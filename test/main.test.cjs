'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { EventEmitter } = require('node:events');

async function harness({ savedToken = null, argv = [], controlledRetry = false, preferences: initialPreferences = {}, startupBlocked = false, failPreferences = false } = {}) {
  const handlers = new Map();
  const app = new EventEmitter();
  app.commandLine = { appendSwitch() {} };
  app.requestSingleInstanceLock = () => true;
  app.whenReady = () => Promise.resolve();
  app.getPath = () => path.resolve('mock-user-data');
  app.setPath = () => {};
  app.getAppPath = () => path.resolve('mock app folder');
  app.isPackaged = false;
  let loginSettings = { openAtLogin: false, executableWillLaunchAtLogin: false };
  const startupChanges = [];
  app.setLoginItemSettings = value => { startupChanges.push(value); loginSettings = { ...value, enabled: startupBlocked ? false : value.enabled }; };
  // Native Electron openAtLogin may describe its default AppUserModelID entry,
  // even when a custom-name entry was successfully created.
  app.getLoginItemSettings = () => ({ openAtLogin: false, executableWillLaunchAtLogin: Boolean(loginSettings.enabled),
    launchItems: loginSettings.openAtLogin ? [{ name: 'Steam Saat', path: process.execPath,
      args: [app.getAppPath(), '--hidden'], scope: 'user', enabled: loginSettings.enabled }] : [] });
  let quitCalled = false;
  app.quit = () => { quitCalled = true; };
  let window;
  let settings;
  let requestFilter;
  let picker = { canceled: true };
  let launched;
  const childCalls = [];
  const children = [];
  const saves = [];
  let clears = 0;
  let contextMenu;
  const powerMonitor = new EventEmitter();
  let retryTimer = null, continuation = null;
  class FakeTray extends EventEmitter {
    setToolTip() {}
    setContextMenu(value) { contextMenu = value; }
    destroy() {}
  }
  class Window extends EventEmitter {
    constructor(value) {
      super(); settings = value; window = this;
      this.webContents = new EventEmitter();
      this.webContents.mainFrame = { url: '' };
      this.webContents.send = () => {};
      this.webContents.setWindowOpenHandler = value => { this.popup = value; };
    }
    loadURL(url) { this.webContents.mainFrame.url = url; }
    isDestroyed() { return false; }
    hide() { this.hidden = true; }
    show() { this.hidden = false; }
    isMinimized() { return false; }
    focus() {}
    restore() {}
  }
  const electron = {
    app, BrowserWindow: Window, powerMonitor, Tray: FakeTray,
    Menu: { buildFromTemplate: value => value }, nativeImage: { createFromBitmap: () => ({}) },
    ipcMain: { handle(name, value) { handlers.set(name, value); } },
    dialog: { showOpenDialog: async () => picker },
    session: { fromPartition: () => ({
      setPermissionRequestHandler() {}, setPermissionCheckHandler() {},
      webRequest: { onBeforeRequest(fn) { requestFilter = fn; } }
    }) }
  };
  const childProcess = {
    fork(_file, _args, options) {
      const child = new EventEmitter(); child.connected = true; child.exitCode = null;
      child.kill = () => { child.exitCode = 0; child.emit('exit'); };
      child.send = (packet, done) => {
        // Mirror IPC serialization before the caller clears the source string.
        childCalls.push(JSON.parse(JSON.stringify(packet)));
        queueMicrotask(() => { child.emit('message', { type: 'reply', id: packet.id, ok: true }); done?.(); });
      };
      children.push({ child, options }); return child;
    },
    spawn(file, args, options) {
      launched = { file, args, options };
      const child = new EventEmitter(); child.unref = () => {};
      queueMicrotask(() => child.emit('spawn')); return child;
    }
  };
  const directory = path.resolve(__dirname, '../src');
  const context = {
    require(name) {
      if (name === 'electron') return electron;
      if (name === 'node:child_process') return childProcess;
      if (name === 'node:fs/promises') return { stat: async () => ({ isFile: () => true }) };
      if (name === './session.cjs') return require('../src/session.cjs');
      if (name === './token-store.cjs') return { TokenStore: class {
        async load() { return savedToken; }
        async clear() { clears++; }
        async save(token) { saves.push(token); }
      } };
      if (name === './preferences.cjs') return {
        defaults: require('../src/preferences.cjs').defaults,
        Preferences: class { async load() { return { ...require('../src/preferences.cjs').defaults(), ...initialPreferences }; }
          async save() { if (failPreferences) throw new Error('private file error'); } }
      };
      if (name === './reconnect.cjs' && controlledRetry) return { Reconnect: class extends require('../src/reconnect.cjs').Reconnect {
        constructor(attempt, changed) { super(attempt, changed, { clock: () => 100,
          schedule: fn => { retryTimer = fn; return { unref() {} }; }, clear: () => { retryTimer = null; } }); }
      } };
      if (name.startsWith('./')) return require(path.join(directory, name));
      return require(name);
    },
    __dirname: directory, process: { env: {}, execPath: process.execPath, platform: 'win32', argv },
    performance, setTimeout: (fn, delay) => {
      if (controlledRetry && delay === 1500) { continuation = fn; return { unref() {}, continuation: true }; }
      return setTimeout(fn, delay);
    }, clearTimeout: timer => { if (timer?.continuation) continuation = null; else clearTimeout(timer); }, setImmediate, Promise
  };
  vm.runInNewContext(fs.readFileSync(path.join(directory, 'main.cjs'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  const event = () => ({ sender: window.webContents, senderFrame: window.webContents.mainFrame });
  return {
    handlers, window, settings, childCalls, children, saves, clears: () => clears,
    contextMenu: () => contextMenu, startupChanges, powerMonitor, quitCalled: () => quitCalled,
    fireRetry: async () => { const fn = retryTimer; retryTimer = null; if (fn) await fn(); },
    fireContinuation: async () => { const fn = continuation; continuation = null; if (fn) fn(); await new Promise(resolve => setImmediate(resolve)); },
    call: (name, value) => handlers.get(name)(event(), value),
    setPicker: value => { picker = value; },
    launched: () => launched,
    filter: url => { let result; requestFilter({ url }, value => { result = value; }); return result; },
    page: pathToFileURL(path.join(directory, 'ui/index.html')).href
  };
}
test('desktop window isolates Node and rejects remote network requests and popups', async () => {
  const h = await harness();
  assert.equal(h.settings.webPreferences.nodeIntegration, false);
  assert.equal(h.settings.webPreferences.contextIsolation, true);
  assert.equal(h.settings.webPreferences.sandbox, true);
  assert.equal(h.filter('https://example.invalid/secret').cancel, true);
  assert.equal(h.filter(h.page).cancel, false);
  assert.equal(h.window.popup().action, 'deny');
});

test('transient reconnect resumes requested games but a competing session cancels continuation', async () => {
  const h = await harness({ savedToken: 'test-reconnect-token-12345678', controlledRetry: true });
  const first = h.children[0].child;
  first.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0 } });
  await h.call('start', [730]);
  first.emit('message', { type: 'state', state: { status: 'offline', games: [], elapsedMs: 0, disconnectKind: 'transient' } });
  await new Promise(resolve => setImmediate(resolve)); await h.fireRetry();
  const second = h.children[1].child;
  second.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0, blocked: false } });
  await h.fireContinuation();
  assert.equal(h.childCalls.at(-1).action, 'start'); assert.deepEqual(h.childCalls.at(-1).payload, [730]);
  second.emit('message', { type: 'state', state: { status: 'offline', games: [], elapsedMs: 0, disconnectKind: 'transient' } });
  await new Promise(resolve => setImmediate(resolve)); await h.fireRetry();
  const third = h.children[2].child;
  third.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0, blocked: false } });
  const before = h.childCalls.length;
  third.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0, blocked: true } });
  await h.fireContinuation(); assert.equal(h.childCalls.length, before);
  await h.call('disconnect'); first.kill(); second.kill(); third.kill();
});

test('Windows startup starts selected games after remembered login succeeds', async () => {
  const h = await harness({ savedToken: 'test-startup-token-123456789', argv: ['--hidden'], controlledRetry: true,
    preferences: { selectedGames: [393380, 730] } });
  const child = h.children[0].child;
  assert.equal(h.childCalls[0].action, 'resume');
  assert.equal(h.childCalls.some(value => value.action === 'start'), false);
  child.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0, blocked: false } });
  await h.fireContinuation();
  assert.equal(h.childCalls.at(-1).action, 'start');
  assert.deepEqual(h.childCalls.at(-1).payload, [393380, 730]);
  await h.call('disconnect'); child.kill();
});
test('startup auto play does not run for a manual launch, disabled setting, or competing session', async () => {
  for (const scenario of [{ argv: [], enabled: true, blocked: false }, { argv: ['--hidden'], enabled: false, blocked: false }, { argv: ['--hidden'], enabled: true, blocked: true }]) {
    const h = await harness({ savedToken: 'test-startup-token-123456789', argv: scenario.argv, controlledRetry: true,
      preferences: { selectedGames: [730], autoStartOnLogin: scenario.enabled } });
    const child = h.children[0].child;
    child.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0, blocked: scenario.blocked } });
    await h.fireContinuation();
    assert.equal(h.childCalls.some(value => value.action === 'start'), false);
    await h.call('disconnect'); child.kill();
  }
});
test('startup does not attempt login or play without a remembered credential', async () => {
  const h = await harness({ argv: ['--hidden'], controlledRetry: true, preferences: { selectedGames: [730] } });
  await h.fireContinuation(); assert.equal(h.childCalls.length, 0);
});

test('closing window hides to tray; explicit tray exit remains available', async () => {
  const h = await harness(); let prevented = false;
  h.window.emit('close', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(h.window.hidden, true);
  assert.equal(h.quitCalled(), false);
  h.contextMenu().find(item => item.label === 'Steam Saat’i aç').click();
  assert.equal(h.window.hidden, false);
  h.contextMenu().find(item => item.label === 'Tamamen çıkış yap').click();
  assert.equal(h.quitCalled(), true);
});
test('startup does not modify Windows registration until the user toggles it', async () => {
  const h = await harness();
  assert.equal(h.startupChanges.length, 0);
  assert.equal((await h.call('preferences', { startAtLogin: true })).ok, true);
  assert.equal(h.startupChanges[0].openAtLogin, true);
  assert.equal(h.startupChanges[0].args[1], '--hidden');
  assert.ok(h.startupChanges[0].args[0].startsWith('"'));
  assert.equal((await h.call('preferences', { startAtLogin: false })).ok, true);
  assert.equal(h.startupChanges[1].openAtLogin, false);
});

test('startup registration does not depend on an unrelated preferences file write', async () => {
  const h = await harness({ failPreferences: true });
  const result = await h.call('preferences', { startAtLogin: true });
  assert.equal(result.ok, true);
  assert.equal((await h.call('snapshot')).state.desktop.startAtLogin, true);
});
test('blocked Windows startup shows an actionable safe message instead of generic connection error', async () => {
  const h = await harness({ startupBlocked: true });
  const result = await h.call('preferences', { startAtLogin: true });
  assert.equal(result.ok, false);
  assert.ok(result.message.includes('Görev Yöneticisi'));
  assert.equal((await h.call('snapshot')).state.desktop.startAtLogin, false);
});
test('hidden startup keeps a tray and explicit disconnect cancels reconnect', async () => {
  const h = await harness({ savedToken: 'test-reconnect-token-12345678', argv: ['--hidden'] });
  assert.equal(h.window.hidden, true);
  const child = h.children[0].child;
  child.emit('message', { type: 'state', state: { status: 'offline', games: [], elapsedMs: 0, disconnectKind: 'transient' } });
  await new Promise(resolve => setImmediate(resolve));
  assert.ok((await h.call('snapshot')).state.retry.nextAt);
  await h.call('disconnect');
  assert.equal((await h.call('snapshot')).state.retry.nextAt, null);
  child.kill();
});

test('credential is persisted only after authentication and forget blocks later writes', async () => {
  const h = await harness();
  await h.call('login', { accountName: 'test-only', password: 'test-only', remember: true });
  const child = h.children[0].child;
  const token = 'private-unit-test-refresh-token';
  child.emit('message', { type: 'credential', token });
  assert.equal(h.saves.length, 0);
  child.emit('message', { type: 'state', state: { status: 'online', games: [], elapsedMs: 0 } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.saves, [token]);
  const snapshot = await h.call('snapshot');
  assert.equal(JSON.stringify(snapshot).includes(token), false);
  await h.call('forget');
  child.emit('message', { type: 'credential', token: token + '-new' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.saves.length, 1);
  assert.equal(h.clears(), 2);
  assert.equal((await h.call('snapshot')).state.saved, false);
  child.kill();
});

test('startup restores only the encrypted-store token without sending it to renderer', async () => {
  const token = 'private-restored-test-token-1234';
  const h = await harness({ savedToken: token });
  assert.equal(h.childCalls[0].action, 'resume');
  assert.equal(h.childCalls[0].payload, token);
  assert.equal(JSON.stringify(await h.call('snapshot')).includes(token), false);
  h.children[0].child.kill();
});
test('IPC rejects an unrelated sender and an untrusted frame URL', async () => {
  const h = await harness();
  const badSender = await h.handlers.get('snapshot')({ sender: {}, senderFrame: { url: h.page } });
  assert.equal(badSender.ok, false);
  h.window.webContents.mainFrame.url = 'https://example.invalid/';
  const badOrigin = await h.handlers.get('snapshot')({ sender: h.window.webContents, senderFrame: h.window.webContents.mainFrame });
  assert.equal(badOrigin.ok, false);
});
test('login IPC serializes password before clearing it and isolates worker stdio', async () => {
  const h = await harness();
  const input = { accountName: 'unit-test', password: 'unit-test' };
  const result = await h.call('login', input);
  assert.equal(result.ok, true);
  assert.equal(h.childCalls[0].payload.password, 'unit-test');
  assert.equal(input.password, '');
  assert.equal(h.children[0].options.stdio.join(','), 'ignore,ignore,ignore,ipc');
  assert.equal(h.children[0].options.env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal((await h.call('start', [271590])).ok, false);
  h.children[0].child.kill();
});
test('FiveM launcher requires picker selection and spawns without shell or arguments', async () => {
  const h = await harness();
  assert.equal((await h.call('launch-fivem')).ok, false);
  h.setPicker({ canceled: false, filePaths: [path.resolve('other.exe')] });
  assert.equal((await h.call('choose-fivem')).ok, false);
  const executable = path.resolve('trusted games', 'FiveM.exe');
  h.setPicker({ canceled: false, filePaths: [executable] });
  assert.equal((await h.call('choose-fivem')).ok, true);
  assert.equal((await h.call('launch-fivem')).ok, true);
  assert.equal(h.launched().file, executable);
  assert.equal(h.launched().options.shell, false);
  assert.equal(h.launched().args.length, 0);
});
