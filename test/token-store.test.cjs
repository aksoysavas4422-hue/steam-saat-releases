'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { TokenStore } = require('../src/token-store.cjs');

async function fixture(t, safe) {
  const directory = await fs.mkdtemp(path.join(require('node:os').tmpdir(), 'steam-saat-token-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'token.bin');
  const store = new TokenStore(file, safe, { platform: 'win32' });
  return { directory, file, store };
}
test('only encrypted bytes reach disk and queued forget wins over an earlier save', async t => {
  let value;
  const safe = {
    isAsyncEncryptionAvailable: async () => true,
    encryptStringAsync: async token => { value = token; return Buffer.from('encrypted-test-bytes'); },
    decryptStringAsync: async bytes => { assert.equal(bytes.toString(), 'encrypted-test-bytes'); return { result: value }; }
  };
  const { store, file } = await fixture(t, safe);
  const token = 'sensitive-test-token-123456789';
  await store.save(token);
  assert.equal((await fs.readFile(file)).includes(Buffer.from(token)), false);
  assert.equal(await store.load(), token);
  const saving = store.save(token);
  const forgetting = store.clear();
  await Promise.all([saving, forgetting]);
  assert.equal(await store.load(), null);
});
test('unavailable Windows encryption never falls back to plaintext storage', async t => {
  const { store, directory } = await fixture(t, { isAsyncEncryptionAvailable: async () => false });
  await assert.rejects(store.save('sensitive-test-token-123456789'));
  assert.deepEqual(await fs.readdir(directory), []);
});
test('corrupt ciphertext does not leak plaintext or silently produce a token', async t => {
  const { store, file } = await fixture(t, {
    isAsyncEncryptionAvailable: async () => true,
    decryptStringAsync: async () => { throw new Error('decryption failed'); }
  });
  await fs.writeFile(file, Buffer.from('invalid-ciphertext'));
  await assert.rejects(store.load());
  await store.clear();
  assert.equal(await store.load(), null);
});
