'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');

// Only the main process receives this object. Never expose decrypted values over
// renderer IPC. Queue mutations so "forget" cannot be undone by an older save.
class TokenStore {
  constructor(file, safeStorage, { platform = process.platform, io = fs } = {}) {
    this.file = file;
    this.safe = safeStorage;
    this.platform = platform;
    this.io = io;
    this.queue = Promise.resolve();
  }
  async available() {
    if (this.platform !== 'win32') throw new Error('Windows encryption is required.');
    if (!await this.safe.isAsyncEncryptionAvailable()) throw new Error('Encryption unavailable.');
  }
  enqueue(task) {
    const result = this.queue.then(task);
    this.queue = result.catch(() => {});
    return result;
  }
  save(token) {
    return this.enqueue(async () => {
      if (typeof token !== 'string' || token.length < 16 || token.length > 16384) throw new Error('Invalid session.');
      await this.available();
      const encrypted = await this.safe.encryptStringAsync(token);
      const folder = path.dirname(this.file);
      const temporary = this.file + '.tmp';
      await this.io.mkdir(folder, { recursive: true });
      try {
        await this.io.writeFile(temporary, encrypted, { mode: 0o600 });
        await this.io.rename(temporary, this.file);
      } finally { await this.io.rm(temporary, { force: true }).catch(() => {}); }
    });
  }
  load() {
    return this.enqueue(async () => {
      let encrypted;
      try {
        const info = await this.io.stat(this.file);
        if (info.size > 65536) throw new Error('Invalid session file.');
        encrypted = await this.io.readFile(this.file);
      } catch (error) { if (error.code === 'ENOENT') return null; throw new Error('Saved session could not be read.'); }
      await this.available();
      const decrypted = await this.safe.decryptStringAsync(encrypted);
      if (typeof decrypted.result !== 'string' || decrypted.result.length < 16 || decrypted.result.length > 16384) throw new Error('Invalid saved session.');
      // No plaintext fallback. A successful login emits a fresh token when needed.
      return decrypted.result;
    });
  }
  clear() {
    return this.enqueue(async () => {
      await this.io.rm(this.file, { force: true });
      await this.io.rm(this.file + '.tmp', { force: true });
    });
  }
}
module.exports = { TokenStore };
