'use strict';
const { app, BrowserWindow, ipcMain, dialog, safeStorage, powerMonitor, session: electronSession, Tray, Menu, nativeImage } = require('electron');
const { fork, spawn } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');
const { stat } = require('node:fs/promises');
const { validateLogin, validateGames } = require('./session.cjs');
const { TokenStore } = require('./token-store.cjs');
const { Reconnect } = require('./reconnect.cjs');
const { Preferences, defaults } = require('./preferences.cjs');
const { makeTray, startupEnabled, setStartup, StartupError } = require('./desktop.cjs');
const { setupUpdates } = require('./updates.cjs');
app.setPath('userData', path.join(app.getPath('appData'), 'steam-saat'));
let updates, updateInterval, updateDelay;

const page = pathToFileURL(path.join(__dirname, 'ui', 'index.html')).href;
let window;
let worker = null;
let serial = 0;
let fiveMPath = null; // Path intentionally lives only for this application session.
let cached = { status: 'offline', message: 'Bağlı değil.', games: [], elapsedMs: 0, blocked: false, guardAfter: 0 };
let receivedAt = performance.now();
const requests = new Map();
let tokenStore;
let initializing = true;
let remember = true;
let saved = false;
let authRevision = 0;
let saveMessage = 'Oturum bu Windows hesabında şifrelenerek hatırlanır; şifren kaydedilmez.';
let preferences, options = defaults(), tray = null;
let startAtLogin = false, startupAvailable = false;
let volatileToken = null, desiredGames = [], continueTimer = null;
let manualDisconnected = false, suspended = false, shuttingDown = false;
const reconnect = new Reconnect(() => connectAgain(true), () => publishAuth());
function showWindow() { if (window && !window.isDestroyed()) { window.show(); if (window.isMinimized()) window.restore(); window.focus(); } }
function cancelContinuation() { clearTimeout(continueTimer); continueTimer = null; }
function scheduleReconnect() {
  if (!quitting && !initializing && !manualDisconnected && !suspended && options.autoReconnect && volatileToken) reconnect.schedule();
}
async function connectAgain(recovery = true) {
  if (quitting || suspended || worker || initializing || manualDisconnected) return;
  if (!volatileToken) { broadcast({ ...cached, message: 'Yeniden bağlanmak için Steam’e giriş yap.' }); return; }
  makeWorker({ recovery });
  await call('resume', volatileToken);
}
async function startGames(ids) {
  const games = validateGames(ids);
  cancelContinuation(); manualDisconnected = false; desiredGames = games;
  const result = await call('start', games);
  if (!result.ok) desiredGames = [];
  return result;
}
async function stopGames() {
  desiredGames = []; cancelContinuation(); reconnect.cancel();
  return worker ? call('stop') : { ok: true };
}

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

function broadcast(state) {
  cached = { ...state, remember, saved, saveMessage, retry: reconnect.snapshot(), updates: updates?.snapshot(),
    desktop: { ...options, fiveMPath: undefined, fiveMReady: Boolean(fiveMPath), startAtLogin, startupAvailable, trayAvailable: Boolean(tray) } };
  receivedAt = performance.now();
  if (window && !window.isDestroyed()) window.webContents.send('state', cached);
  tray?.update();
}
function publishAuth() { broadcast({ ...cached, elapsedMs: elapsed() }); }
async function saveToken(token) {
  if (!remember || !tokenStore) return;
  const revision = authRevision;
  try {
    await tokenStore.save(token);
    if (revision !== authRevision) return;
    saved = true; saveMessage = 'Oturum Windows ile şifrelendi. Bir sonraki açılışta otomatik bağlanır.';
  } catch {
    if (revision !== authRevision) return;
    saveMessage = 'Oturum kaydedilemedi. Windows şifrelemesi veya dosya erişimi kullanılamıyor; şifresiz kayıt yapılmadı.';
  }
  publishAuth();
}
function settleFor(child) {
  for (const [id, entry] of requests) {
    if (entry.child !== child) continue;
    clearTimeout(entry.timer);
    entry.resolve({ ok: false, message: 'Steam işlemi kapandı. Yeniden giriş yapabilirsin.' });
    requests.delete(id);
  }
}
function retire(child) {
  if (worker === child) worker = null;
  settleFor(child);
  // Allow logOff() a short grace period, then remove library-owned credentials
  // from the live process by terminating it. This is not secure memory erasure.
  const timer = setTimeout(() => { if (child.exitCode === null) child.kill(); }, 1200);
  timer.unref();
}
function makeWorker({ recovery = false } = {}) {
  const env = { ELECTRON_RUN_AS_NODE: '1' };
  for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'PATH', 'USERPROFILE', 'LOCALAPPDATA']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  const child = fork(path.join(__dirname, 'worker.cjs'), [], {
    execPath: process.execPath, execArgv: [], env,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true
  });
  worker = child;
  let tokenCandidate = null;
  let authenticated = false;
  const persistCandidate = () => {
    if (!authenticated || !tokenCandidate) return;
    const token = tokenCandidate; tokenCandidate = null;
    volatileToken = token;
    if (remember) void saveToken(token);
  };
  child.on('message', message => {
    if (worker !== child) return;
    if (message?.type === 'state') {
      if (message.state.blocked) { desiredGames = []; cancelContinuation(); }
      broadcast(message.state);
      if (['online', 'running'].includes(message.state.status)) {
        if (!authenticated) {
          authenticated = true; reconnect.cancel();
          if (recovery && desiredGames.length && !message.state.blocked) {
            cancelContinuation();
            continueTimer = setTimeout(() => {
              continueTimer = null;
              if (worker === child && cached.status === 'online' && !cached.blocked && desiredGames.length && !manualDisconnected && !suspended && !quitting) {
                void startGames([...desiredGames]);
              }
            }, 1500);
            continueTimer.unref();
          }
        }
        persistCandidate();
      }
      if (message.state.status === 'guard') reconnect.cancel();
      if (message.state.status === 'offline') {
        cancelContinuation();
        if (message.state.disconnectKind === 'auth') { volatileToken = null; desiredGames = []; reconnect.cancel(); }
        // Replies sent after the state message must be processed before retirement.
        setImmediate(() => {
          if (worker !== child) return;
          retire(child);
          if (message.state.disconnectKind === 'transient') scheduleReconnect();
        });
      }
    } else if (message?.type === 'credential') {
      if (typeof message.token === 'string' && message.token.length >= 16 && message.token.length <= 16384) {
        tokenCandidate = message.token; persistCandidate();
      }
    } else if (message?.type === 'reply') {
      const entry = requests.get(message.id);
      if (entry?.child === child) {
        clearTimeout(entry.timer);
        requests.delete(message.id);
        entry.resolve(message);
      }
    } else if (message?.type === 'fatal') {
      broadcast({ ...cached, status: 'offline', games: [], message: 'Steam kütüphanesi yüklenemedi. Önce kurulumu tamamla.' });
      retire(child);
    }
  });
  const failed = () => {
    settleFor(child);
    if (worker !== child) return;
    worker = null;
    broadcast({ ...cached, elapsedMs: elapsed(), status: 'offline', games: [], blocked: false, guardAfter: 0,
      message: 'Steam işlemi kapandı. Yeniden giriş yapabilirsin.' });
    scheduleReconnect();
  };
  child.on('error', failed);
  child.on('exit', failed);
  return child;
}
function elapsed() { return cached.elapsedMs + (cached.status === 'running' ? performance.now() - receivedAt : 0); }
function call(action, payload) {
  const child = worker;
  if (!child?.connected) return Promise.resolve({ ok: false, message: 'Steam bağlantısı yok.' });
  const id = ++serial;
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      requests.delete(id);
      resolve({ ok: false, message: 'İşlem zaman aşımına uğradı. Bağlantı kapatıldı.' });
      if (worker === child) {
        broadcast({ ...cached, elapsedMs: elapsed(), status: 'offline', games: [], guardAfter: 0, message: 'İşlem zaman aşımına uğradı.' });
        retire(child);
        scheduleReconnect();
      }
    }, 15000);
    requests.set(id, { child, timer, resolve });
    child.send({ id, action, payload }, error => {
      if (!error) return;
      clearTimeout(timer);
      requests.delete(id);
      resolve({ ok: false, message: 'Steam işlemine ulaşılamadı.' });
    });
  });
}
function checkSender(event) {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame
      || event.senderFrame.url !== page) throw new Error('Geçersiz arayüz.');
}
function handle(name, callback) {
  ipcMain.handle(name, async (event, payload) => {
    try { checkSender(event); return await callback(payload); }
    catch (error) {
      return { ok: false, message: error instanceof StartupError ? error.message : 'İşlem yapılamadı. Seçimini ve bağlantını kontrol et.' };
    }
  });
}
handle('login', async input => {
  if (initializing || worker || cached.status !== 'offline') return { ok: false, message: 'Önce mevcut bağlantıyı kes.' };
  const details = validateLogin(input);
  manualDisconnected = false; volatileToken = null; desiredGames = []; cancelContinuation(); reconnect.cancel();
  initializing = true;
  try {
    remember = input?.remember !== false;
    authRevision++;
    // A new explicit login replaces any previous remembered account, even if the
    // new login later fails. Never silently restore the previous account.
    await tokenStore.clear();
    saved = false;
    saveMessage = remember ? 'Başarılı girişten sonra oturum şifrelenerek hatırlanır.' : 'Bu oturum kaydedilmeyecek.';
    makeWorker();
    const pending = call('login', details);
    details.password = '';
    if (input) input.password = '';
    return await pending;
  } finally {
    details.password = '';
    if (input) input.password = '';
    initializing = false;
  }
});
handle('guard', code => {
  if (typeof code !== 'string' || !/^[A-Z0-9]{5}$/i.test(code.trim())) return { ok: false, message: '5 karakterli kodu kontrol et.' };
  if (Date.now() < cached.guardAfter) return { ok: false, message: 'Yeni kod için bekleme süresinin dolmasını bekle.' };
  return call('guard', code);
});
handle('start', ids => startGames(ids));
handle('stop', () => stopGames());
handle('disconnect', () => {
  manualDisconnected = true; desiredGames = []; cancelContinuation(); reconnect.cancel();
  return worker ? call('disconnect') : { ok: true };
});
handle('retry-now', async () => {
  if (worker || initializing) return { ok: false, message: 'Önce mevcut bağlantının tamamlanmasını bekle.' };
  manualDisconnected = false; reconnect.cancel();
  if (!volatileToken && saved) volatileToken = await tokenStore.load();
  if (!volatileToken) return { ok: false, message: 'Steam hesabına yeniden giriş yap.' };
  await connectAgain(true); return { ok: true };
});
handle('preferences', async patch => {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Geçersiz ayar.');
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'selectedGames') {
      if (!Array.isArray(value) || value.length > 2 || value.some(id => ![393380, 730].includes(id))) throw new Error('Geçersiz oyun.');
    } else if (!['closeToTray', 'autoReconnect', 'autoStartOnLogin', 'startAtLogin'].includes(key) || typeof value !== 'boolean') throw new Error('Geçersiz ayar.');
  }
  if (patch.startAtLogin !== undefined) {
    if (!startupAvailable) return { ok: false, message: 'Windows başlangıç ayarlarına bu oturumda erişilemiyor.' };
    try { startAtLogin = setStartup(app, process.execPath, patch.startAtLogin); }
    catch (error) {
      try { startAtLogin = startupEnabled(app, process.execPath); } catch { /* last known state */ }
      publishAuth(); throw error;
    }
    publishAuth();
  }
  for (const key of ['closeToTray', 'autoReconnect', 'autoStartOnLogin', 'selectedGames']) if (patch[key] !== undefined) options[key] = patch[key];
  if (patch.autoReconnect === false) { reconnect.cancel(); cancelContinuation(); }
  if (patch.autoStartOnLogin === false) { cancelContinuation(); if (cached.status !== 'running') desiredGames = []; }
  if (patch.selectedGames !== undefined && continueTimer) {
    desiredGames = [...options.selectedGames];
    if (!desiredGames.length) cancelContinuation();
  }
  // Startup state lives in Windows, not preferences.json. An unrelated local
  // file write must not turn a successful startup registration into an error.
  if (Object.keys(patch).some(key => key !== 'startAtLogin')) await preferences.save(options);
  publishAuth(); return { ok: true };
});
handle('hide', () => {
  if (tray) { window.hide(); return { ok: true }; }
  return { ok: false, message: 'Sistem tepsisi kullanılamıyor.' };
});
handle('quit', () => { app.quit(); return { ok: true }; });
handle('check-updates', async () => { await updates?.check(); return { ok: true }; });
handle('playtime', () => call('playtime'));
handle('forget', async () => {
  manualDisconnected = true; volatileToken = null; desiredGames = []; cancelContinuation(); reconnect.cancel();
  authRevision++; remember = false;
  if (worker) await call('disconnect');
  await tokenStore.clear();
  saved = false; saveMessage = 'Kayıtlı oturum silindi. Yeniden giriş yapman gerekir.';
  publishAuth();
  return { ok: true };
});
handle('snapshot', () => ({ ok: true, state: { ...cached, elapsedMs: elapsed() } }));
handle('choose-fivem', async () => {
  const result = await dialog.showOpenDialog(window, {
    title: 'FiveM.exe dosyasını seç', properties: ['openFile'],
    filters: [{ name: 'FiveM', extensions: ['exe'] }]
  });
  if (result.canceled) return { ok: true, canceled: true };
  const chosen = result.filePaths[0];
  if (!chosen || path.basename(chosen).toLowerCase() !== 'fivem.exe' || !(await stat(chosen)).isFile()) {
    return { ok: false, message: 'FiveM.exe adlı dosyayı seç.' };
  }
  fiveMPath = chosen;
  options.fiveMPath = chosen; await preferences.save(options); publishAuth();
  return { ok: true, selected: true };
});
handle('launch-fivem', async () => {
  if (!fiveMPath || !(await stat(fiveMPath)).isFile()) return { ok: false, message: 'Önce FiveM.exe dosyasını seç.' };
  // No shell, interpolation, user-supplied arguments or elevation.
  return new Promise(resolve => {
    const child = spawn(fiveMPath, [], { cwd: path.dirname(fiveMPath), shell: false, detached: true, stdio: 'ignore', windowsHide: false });
    child.once('error', () => resolve({ ok: false, message: 'FiveM açılamadı. Dosyayı yeniden seç.' }));
    child.once('spawn', () => { child.unref(); resolve({ ok: true }); });
  });
});

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showWindow);
  app.whenReady().then(async () => {
    updates = setupUpdates(app, () => publishAuth());
    if (app.isPackaged) {
      updateDelay = setTimeout(() => { void updates.check(); }, 15000); updateDelay.unref();
      updateInterval = setInterval(() => { void updates.check(); }, 3600000); updateInterval.unref();
    }
    tokenStore = new TokenStore(path.join(app.getPath('userData'), 'remembered-session.bin'), safeStorage);
    preferences = new Preferences(path.join(app.getPath('userData'), 'preferences.json'));
    options = await preferences.load(); fiveMPath = options.fiveMPath;
    // --hidden is the existing Windows login-item argument, so installations
    // registered by 0.3 do not need a startup registry migration.
    const autoStartAtBoot = process.argv.includes('--hidden') && options.autoStartOnLogin && options.selectedGames.length > 0;
    if (autoStartAtBoot) desiredGames = [...options.selectedGames];
    if (process.platform === 'win32') {
      try { startAtLogin = startupEnabled(app, process.execPath); startupAvailable = true; } catch { /* disabled in UI */ }
    }
    broadcast({ ...cached, status: 'restoring', message: 'Kayıtlı oturum kontrol ediliyor.' });
    const isolated = electronSession.fromPartition(`steam-saat-${randomUUID()}`);
    isolated.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    isolated.setPermissionCheckHandler(() => false);
    isolated.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: !details.url.startsWith(pathToFileURL(path.join(__dirname, 'ui') + path.sep).href) });
    });
    window = new BrowserWindow({
      width: 1230, height: 920, minWidth: 930, minHeight: 720,
      backgroundColor: '#10151d', title: 'Steam Saat', autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'), session: isolated,
        nodeIntegration: false, contextIsolation: true, sandbox: true,
        webSecurity: true, devTools: false, spellcheck: false
      }
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.on('close', event => {
      if (!quitting && !shuttingDown && options.closeToTray && tray) { event.preventDefault(); window.hide(); }
    });
    window.on('query-session-end', () => { shuttingDown = true; manualDisconnected = true; reconnect.cancel(); cancelContinuation(); if (worker) void call('disconnect'); });
    window.on('closed', () => { window = null; });
    try {
      tray = makeTray({ Tray, Menu, nativeImage }, { show: showWindow, state: () => cached, selections: () => options.selectedGames,
        start: () => { void startGames(options.selectedGames); }, stop: () => { void stopGames(); }, quit: () => app.quit() });
    } catch { tray = null; }
    if (process.argv.includes('--hidden') && tray) window.hide();
    powerMonitor.on('suspend', () => {
      suspended = true; reconnect.cancel(); cancelContinuation();
      broadcast({ ...cached, elapsedMs: elapsed(), status: 'offline', games: [], message: 'Bilgisayar uykuya geçiyor. Süre işlemi durduruldu.' });
      if (worker) void call('disconnect');
    });
    powerMonitor.on('resume', () => { suspended = false; scheduleReconnect(); });
    await window.loadURL(page);
    try {
      const token = await tokenStore.load();
      if (token) {
        volatileToken = token;
        saved = true;
        makeWorker({ recovery: Boolean(autoStartAtBoot) });
        const result = await call('resume', token);
        if (!result.ok) broadcast({ ...cached, status: 'offline', message: 'Kayıtlı oturumla bağlantı kurulamadı. Yeniden giriş yapabilir veya kaydı silebilirsin.' });
      } else broadcast({ ...cached, status: 'offline', message: 'Bağlı değil. Steam hesabına giriş yap.' });
    } catch {
      saved = true;
      saveMessage = 'Kayıtlı oturum çözülemedi. Yeniden giriş yap veya kaydı sil.';
      broadcast({ ...cached, status: 'offline', message: saveMessage });
    } finally { initializing = false; publishAuth(); }
  });
}
app.on('window-all-closed', () => { if (!tray || quitting) app.quit(); });
let quitting = false;
app.on('before-quit', event => {
  if (quitting) return;
  event.preventDefault();
  quitting = true;
  clearTimeout(updateDelay); clearInterval(updateInterval);
  manualDisconnected = true; reconnect.cancel(); cancelContinuation(); tray?.destroy(); tray = null;
  const child = worker;
  (child ? call('disconnect') : Promise.resolve()).finally(async () => {
    await tokenStore?.queue;
    await preferences?.queue;
    const finish = () => { if (!shuttingDown && updates?.install()) return; app.quit(); };
    if (!child) { finish(); return; }
    retire(child);
    const timer = setTimeout(() => { child.kill(); finish(); }, 1300);
    timer.unref();
  });
});
