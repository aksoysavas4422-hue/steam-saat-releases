'use strict';
function setupUpdates(app, notify, load = () => require('electron-updater').autoUpdater) {
  let state = { status: 'development', message: 'Güncellemeler kurulu uygulamada etkinleşir.' };
  let updater, checking = false, ready = false;
  const send = (status, message) => { state = { status, message }; notify(state); };
  if (app.isPackaged) {
    try {
      updater = load(); updater.logger = null;
      updater.autoDownload = true; updater.autoInstallOnAppQuit = false;
      updater.allowPrerelease = false; updater.allowDowngrade = false;
      updater.on('checking-for-update', () => send('checking', 'Güncellemeler kontrol ediliyor…'));
      updater.on('update-available', () => send('downloading', 'Yeni sürüm arka planda indiriliyor…'));
      updater.on('update-not-available', () => send('current', 'Uygulama güncel.'));
      updater.on('download-progress', value => send('downloading', 'Güncelleme indiriliyor: %' + Math.min(100, Math.max(0, Math.floor(value.percent || 0)))));
      updater.on('update-downloaded', () => { ready = true; send('ready', 'Güncelleme hazır. Uygulamadan çıkınca yüklenir.'); });
      updater.on('error', () => { if (!ready) send('error', 'Güncelleme alınamadı. Daha sonra yeniden denenecek.'); });
      send('idle', 'Güncellemeler otomatik kontrol edilir.');
    } catch { send('error', 'Güncelleme bileşeni yüklenemedi.'); }
  }
  return {
    snapshot: () => state,
    async check() {
      if (!updater || checking || ready) return;
      checking = true;
      try { await updater.checkForUpdates(); }
      catch { if (!ready) send('error', 'Güncelleme alınamadı. Daha sonra yeniden denenecek.'); }
      finally { checking = false; }
    },
    install() { if (!ready || !updater) return false; updater.quitAndInstall(true, false); return true; }
  };
}
module.exports = { setupUpdates };
