'use strict';
// Isolated application: no real account, saved session or network access.
const { app, BrowserWindow, session } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-hours-ui-'));
app.setPath('userData', folder); app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const isolated = session.fromPartition('ui-test-only');
  isolated.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !details.url.startsWith('file:') }));
  const window = new BrowserWindow({ show: false, width: 1280, height: 1160,
    webPreferences: { preload: path.join(__dirname, 'preview-preload.cjs'), session: isolated, nodeIntegration: false, contextIsolation: true, sandbox: true } });
  let rendererErrors = 0;
  window.webContents.on('console-message', (details, level) => { if (details.level === 'error' || level === 3) rendererErrors++; });
  await window.loadFile(path.join(__dirname, '../src/ui/index.html'));
  const output = path.resolve(process.env.STEAM_HOURS_SCREENSHOT_DIR || path.join(__dirname, '../../work/ui-preview'));
  fs.mkdirSync(output, { recursive: true });
  for (const language of ['en','tr','ru','zh']) {
    await window.webContents.executeJavaScript(`document.getElementById('language-${language}').click()`);
    // Wait for the isolated preload preference promise and renderer repaint.
    await new Promise(resolve => setTimeout(resolve, 150));
    const result = await window.webContents.executeJavaScript(`({lang:document.documentElement.lang,title:document.getElementById('session-title').textContent,selected:document.getElementById('language-${language}').getAttribute('aria-pressed'),columns:getComputedStyle(document.querySelector('.bento-grid')).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>window.innerWidth})`);
    assert.equal(result.lang, language === 'zh' ? 'zh-CN' : language); assert.equal(result.selected, 'true');
    assert.equal(result.columns, 12); assert.equal(result.overflow, false);
    assert.equal(result.title, ({en:'Current session',tr:'Mevcut oturum',ru:'Текущий сеанс',zh:'当前会话'})[language]);
    fs.writeFileSync(path.join(output, 'steam-hours-' + language + '.png'), (await window.webContents.capturePage()).toPNG());
  }
  assert.equal(rendererErrors, 0);
  process.stdout.write('Four-language UI, flag switching and bento layout passed. No Steam account used.\n');
  window.destroy(); app.exit(0);
}).catch(error => { process.stderr.write('Isolated UI smoke test failed: ' + error.message + '\n'); app.exit(1); });
