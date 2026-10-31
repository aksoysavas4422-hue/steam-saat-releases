'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { setupUpdates } = require('../src/updates.cjs');
test('source mode never loads updater or accesses network', async () => {
  const update = setupUpdates({ isPackaged: false }, () => {}, () => { throw Error('must not load'); });
  await update.check(); assert.equal(update.snapshot().status, 'development'); assert.equal(update.install(), false);
});
test('installed update waits until complete and deduplicates checks', async () => {
  const updater = new EventEmitter(); let finish, checks = 0, installs = 0;
  updater.checkForUpdates = () => { checks++; return new Promise(resolve => { finish = resolve; }); };
  updater.quitAndInstall = (silent, restart) => { assert.equal(silent, true); assert.equal(restart, false); installs++; };
  const update = setupUpdates({ isPackaged: true }, () => {}, () => updater);
  assert.equal(updater.logger, null); assert.equal(updater.allowDowngrade, false);
  assert.equal(updater.autoInstallOnAppQuit, false); assert.equal(update.install(), false);
  const first = update.check(); await update.check(); assert.equal(checks, 1); finish(); await first;
  updater.emit('update-available'); assert.equal(update.install(), false);
  updater.emit('update-downloaded'); assert.equal(update.snapshot().status, 'ready');
  await update.check(); assert.equal(checks, 1); assert.equal(update.install(), true); assert.equal(installs, 1);
});
test('network errors never expose raw URLs or credentials', async () => {
  const updater = new EventEmitter(); updater.checkForUpdates = async () => { throw Error('secret-token'); };
  const update = setupUpdates({ isPackaged: true }, () => {}, () => updater);
  await update.check(); assert.equal(update.snapshot().status, 'error');
  assert.equal(update.snapshot().message.includes('secret-token'), false);
});
