'use strict';
// Isolated smoke test: never loads main.cjs or any saved Steam credential.
const { app, BrowserWindow, safeStorage } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'steam-saat-smoke-'));
app.setPath('userData', folder);
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  assert.equal(await safeStorage.isAsyncEncryptionAvailable(), true);
  const plain = 'synthetic-smoke-test-token-no-account';
  const encrypted = await safeStorage.encryptStringAsync(plain);
  assert.equal(encrypted.includes(Buffer.from(plain)), false);
  assert.equal((await safeStorage.decryptStringAsync(encrypted)).result, plain);
  const window = new BrowserWindow({ show: false, width: 1060, height: 1040,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  await window.loadFile(path.join(__dirname, '../src/ui/index.html'));
  const values = await window.webContents.executeJavaScript('({cards:document.querySelectorAll(".game").length, playtime:!!document.getElementById("refresh-playtime"), remember:!!document.getElementById("remember"), preview:document.getElementById("login").disabled, settings:!!document.getElementById("start-at-login")})');
  assert.equal(values.cards, 3); assert.ok(values.playtime && values.remember && values.preview && values.settings);
  const screenshot = await window.webContents.capturePage();
  const imagePath = path.join(__dirname, '../../work/steam-saat-v04.png');
  fs.mkdirSync(path.dirname(imagePath), { recursive: true });
  fs.writeFileSync(imagePath, screenshot.toPNG());
  process.stdout.write('PASS: Windows safeStorage round trip; three-card UI; remembered-login and playtime controls. No Steam login.\n');
  window.destroy(); app.exit(0);
}).catch(() => { process.stderr.write('Smoke test failed; no Steam account used.\n'); app.exit(1); });
