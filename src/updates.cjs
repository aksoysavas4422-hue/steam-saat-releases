'use strict';
function setupUpdates(app, notify, load = () => require('electron-updater').autoUpdater) {
  let state = { status: 'development', message: 'Updates are available in the desktop application.' };
  let updater, checking = false, ready = false;
  const send = (status, message, params = {}) => { state = { status, message, params }; notify(state); };
  if (app.isPackaged) {
    try {
      updater = load(); updater.logger = null;
      updater.autoDownload = true; updater.autoInstallOnAppQuit = false;
      updater.allowPrerelease = false; updater.allowDowngrade = false;
      updater.on('checking-for-update', () => send('checking', 'Checking for updates…'));
      updater.on('update-available', () => send('downloading', 'Downloading a new version in the background…'));
      updater.on('update-not-available', () => send('current', 'You are up to date.'));
      updater.on('download-progress', value => send('downloading', 'Download progress: {percent}%', { percent: Math.min(100, Math.max(0, Math.floor(value.percent || 0))) }));
      updater.on('update-downloaded', () => { ready = true; send('ready', 'Update ready. It will install when you quit.'); });
      updater.on('error', () => { if (!ready) send('error', 'Update unavailable. It will be checked again later.'); });
      send('idle', 'Updates are checked automatically.');
    } catch { send('error', 'Update component unavailable.'); }
  }
  return {
    snapshot: () => state,
    async check() {
      if (!updater || checking || ready) return;
      checking = true;
      try { await updater.checkForUpdates(); }
      catch { if (!ready) send('error', 'Update unavailable. It will be checked again later.'); }
      finally { checking = false; }
    },
    install() { if (!ready || !updater) return false; updater.quitAndInstall(true, false); return true; }
  };
}
module.exports = { setupUpdates };
