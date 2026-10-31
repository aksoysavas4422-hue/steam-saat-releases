'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Reconnect } = require('../src/reconnect.cjs');
const { clean } = require('../src/preferences.cjs');
const { setStartup, loginOptions, startupEnabled, StartupError } = require('../src/desktop.cjs');
function fixture() {
  let timer = null, attempts = 0; const waits = [];
  const reconnect = new Reconnect(async () => { attempts++; }, () => {}, {
    clock: () => 100,
    schedule: (fn, delay) => { timer = fn; waits.push(delay); return { unref() {} }; },
    clear: () => { timer = null; }
  });
  return { reconnect, waits, attempts: () => attempts, fire: async () => { const fn = timer; timer = null; if (fn) await fn(); } };
}
test('retry backs off and stops after eight attempts rather than flooding Steam', async () => {
  const f = fixture();
  for (let i = 0; i < 8; i++) { f.reconnect.schedule(); f.reconnect.schedule(); await f.fire(); }
  f.reconnect.schedule();
  assert.deepEqual(f.waits, [5000, 10000, 20000, 40000, 60000, 120000, 120000, 120000]);
  assert.equal(f.attempts(), 8); assert.equal(f.reconnect.snapshot().exhausted, true);
});
test('manual cancellation removes pending retry and resets delay', async () => {
  const f = fixture(); f.reconnect.schedule(); f.reconnect.cancel(); await f.fire();
  assert.equal(f.attempts(), 0); assert.equal(f.reconnect.snapshot().nextAt, null);
  f.reconnect.schedule(); assert.equal(f.waits.at(-1), 5000);
});
test('preferences retain only supported harmless settings', () => {
  const settings = clean({ autoReconnect: false, closeToTray: false, selectedGames: [730, 730, 271590], password: 'never-save', refreshToken: 'never-save' });
  assert.deepEqual(settings.selectedGames, [730]); assert.equal(settings.autoReconnect, false);
  assert.equal(JSON.stringify(settings).includes('never-save'), false);
});
test('startup registration is quoted, reversible, and never adds credentials', () => {
  const writes = []; let value;
  const app = { isPackaged: false, getAppPath: () => 'C:\\My App\\Steam Saat',
    setLoginItemSettings: input => { writes.push(input); value = input; },
    getLoginItemSettings: () => ({ openAtLogin: value?.openAtLogin, executableWillLaunchAtLogin: value?.enabled }) };
  assert.deepEqual(loginOptions(app, 'electron.exe').args, ['"C:\\My App\\Steam Saat"', '--hidden']);
  assert.equal(setStartup(app, 'electron.exe', true), true);
  assert.equal(setStartup(app, 'electron.exe', false), false);
  assert.equal(writes[1].openAtLogin, false);
});

test('custom-name startup entry works even when default openAtLogin reports false', () => {
  const app = { isPackaged: false, getAppPath: () => 'C:\\My App\\Steam Saat',
    getLoginItemSettings: () => ({ openAtLogin: false, executableWillLaunchAtLogin: true,
      launchItems: [{ name: 'Steam Saat', scope: 'user', path: 'C:\\Tools\\electron.exe', args: ['C:\\My App\\Steam Saat'], enabled: true }] }) };
  assert.equal(startupEnabled(app, 'C:\\Tools\\electron.exe'), true);
});
test('another app sharing electron.exe cannot make this project appear enabled', () => {
  const app = { isPackaged: false, getAppPath: () => 'C:\\My App\\Steam Saat',
    getLoginItemSettings: () => ({ openAtLogin: true, executableWillLaunchAtLogin: true,
      launchItems: [{ name: 'Other App', scope: 'user', path: 'electron.exe', args: ['C:\\Other App'], enabled: true }] }) };
  assert.equal(startupEnabled(app, 'electron.exe'), false);
});
test('entry matching accepts quote and case differences but rejects another project path', () => {
  const entry = { name: 'Steam Saat', scope: 'user', path: '"C:\\TOOLS\\electron.exe"', args: ['"c:\\MY APP\\Steam Saat"', '--hidden'], enabled: true };
  const app = { isPackaged: false, getAppPath: () => 'C:\\My App\\Steam Saat', getLoginItemSettings: () => ({ launchItems: [entry] }) };
  assert.equal(startupEnabled(app, 'C:\\Tools\\electron.exe'), true);
  entry.args[0] = 'C:\\Other App'; assert.equal(startupEnabled(app, 'C:\\Tools\\electron.exe'), false);
});
test('native write exception is replaced with a safe startup-specific error', () => {
  const app = { isPackaged: true, setLoginItemSettings() { throw new Error('private native exception'); } };
  assert.throws(() => setStartup(app, 'electron.exe', true), error => error instanceof StartupError
    && error.code === 'WRITE_FAILED' && !error.message.includes('private native exception'));
});
