'use strict';
const path = require('node:path');
const STARTUP_NAME = 'Steam Saat';
const STARTUP_MESSAGES = Object.freeze({
  READ_FAILED: 'Windows startup could not be read. Access policies may be blocking it.',
  WRITE_FAILED: 'Windows startup could not be saved. Check Windows security or organization policies.',
  NOT_WRITTEN: 'Windows startup could not be verified. Access policies may be blocking it.',
  BLOCKED: 'Windows disabled this startup entry. Enable Steam Hours in Task Manager > Startup apps.',
  NOT_REMOVED: 'Windows startup could not be removed. Disable Steam Hours in Task Manager > Startup apps.'
});
class StartupError extends Error {
  constructor(code) { super(STARTUP_MESSAGES[code] || STARTUP_MESSAGES.WRITE_FAILED); this.code = code; }
}
function unquote(value) { return String(value || '').replace(/^"(.*)"$/, '$1'); }
function samePath(left, right) { return path.win32.normalize(unquote(left)).toLowerCase() === path.win32.normalize(unquote(right)).toLowerCase(); }
function loginOptions(app, executable) {
  return { name: STARTUP_NAME, path: executable,
    args: app.isPackaged ? ['--hidden'] : [`"${app.getAppPath()}"`, '--hidden'] };
}
function startupInfo(app, executable) {
  let state;
  try {
    const options = loginOptions(app, executable);
    state = app.getLoginItemSettings({ path: options.path, args: options.args });
  } catch { throw new StartupError('READ_FAILED'); }
  if (Array.isArray(state.launchItems)) {
    // openAtLogin can describe the default AppUserModelID entry instead of our
    // custom name. Also, Electron's aggregate executableWillLaunchAtLogin can
    // refer to another project sharing electron.exe. Inspect our own entry.
    const entry = state.launchItems.find(item => item.name === STARTUP_NAME && item.scope === 'user' && samePath(item.path, executable));
    if (!entry) return { registered: false, enabled: false, blocked: false };
    // GetArgs() in some Electron versions omits --switches. Compare the project
    // positional argument without quote/case differences, not switch reporting.
    const correctProject = app.isPackaged || (Array.isArray(entry.args) && samePath(entry.args[0], app.getAppPath()));
    return { registered: true, enabled: correctProject && entry.enabled === true, blocked: entry.enabled === false };
  }
  // Compatibility with older/non-Windows API implementations without launchItems.
  return { registered: Boolean(state.openAtLogin), enabled: Boolean(state.openAtLogin && state.executableWillLaunchAtLogin !== false), blocked: Boolean(state.openAtLogin && state.executableWillLaunchAtLogin === false) };
}
function startupEnabled(app, executable) { return startupInfo(app, executable).enabled; }
function setStartup(app, executable, enabled) {
  if (typeof enabled !== 'boolean') throw new Error('Invalid startup setting.');
  try { app.setLoginItemSettings({ ...loginOptions(app, executable), openAtLogin: enabled, enabled }); }
  catch { throw new StartupError('WRITE_FAILED'); }
  const info = startupInfo(app, executable);
  if (enabled && !info.enabled) throw new StartupError(info.blocked ? 'BLOCKED' : 'NOT_WRITTEN');
  if (!enabled && info.registered) throw new StartupError('NOT_REMOVED');
  return info.enabled;
}
function makeTray({ Tray, Menu, nativeImage }, { show, start, stop, quit, state, selections, translate = key => key }) {
  // Local monochrome clock icon, built as pixels; no remote artwork or icon fetch.
  const side = 32, pixels = Buffer.alloc(side * side * 4);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const radius = Math.hypot(x - 15.5, y - 15.5);
    if ((radius > 12 && radius < 15) || (Math.abs(x - 16) < 1.5 && y > 7 && y < 18) || (y >= 15 && y <= 17 && x >= 16 && x <= 23)) {
      const i = (y * side + x) * 4; pixels[i] = 175; pixels[i + 1] = 221; pixels[i + 2] = 127; pixels[i + 3] = 255;
    }
  }
  const tray = new Tray(nativeImage.createFromBitmap(pixels, { width: side, height: side, scaleFactor: 1 }));
  const update = () => {
    const current = state();
    const labels = { offline: 'Disconnected', connecting: 'Connecting', restoring: 'Restoring session', guard: 'Waiting for Steam Guard', online: 'Connected', running: 'Active' };
    tray.setToolTip(`Steam Hours · ${translate(labels[current.status] || 'Waiting')}`);
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open Steam Hours', click: show },
      { label: labels[current.status] || 'Waiting', enabled: false },
      { type: 'separator' },
      { label: 'Start selected games', enabled: current.status === 'online' && !current.blocked && selections().length > 0, click: start },
      { label: 'Stop', enabled: current.status === 'running' || Boolean(current.retry?.nextAt), click: stop },
      { type: 'separator' }, { label: 'Quit application', click: quit }
    ].map(item => item.label ? { ...item, label: translate(item.label) } : item)));
  };
  tray.on('double-click', show); tray.on('click', show); update();
  return { update, destroy: () => tray.destroy() };
}
module.exports = { loginOptions, startupInfo, startupEnabled, setStartup, makeTray, StartupError };
