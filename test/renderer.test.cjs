'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function fixture(connected = true) {
  const html = fs.readFileSync(path.join(__dirname, '../src/ui/index.html'), 'utf8');
  const elements = new Map();
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    elements.set(match[1], { value: /\bvalue="([^"]+)"/.exec(match[0])?.[1] || '', checked: /\bchecked\b/.test(match[0]),
      textContent: '', disabled: false, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, classList: { toggle() {} }, handlers: {},
      addEventListener(type, fn) { this.handlers[type] = fn; }, children: [], append(...children) { this.children.push(...children); }, focus() {}, scrollIntoView() {} });
  }
  let update; const calls = [];
  const api = { onState: fn => { update = fn; }, snapshot: async () => ({ ok: true }),
    login: async value => { calls.push(JSON.parse(JSON.stringify(value))); return { ok: true }; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/ui/renderer.js'), 'utf8'), {
    window: { SteamHoursI18n: require('../src/ui/i18n.js'), ...(connected ? { steamSaat: api } : {}) }, document: { documentElement: { lang: 'en' }, getElementById: id => {
      assert.ok(elements.has(id), 'renderer references missing control: ' + id); return elements.get(id);
    }, querySelectorAll: () => [], createElement: tag => ({ tagName: tag, children: [], attributes: {}, handlers: {},
      setAttribute(key, value) { this.attributes[key] = value; }, append(...children) { this.children.push(...children); },
      addEventListener(name, fn) { this.handlers[name] = fn; } }) }, performance, setInterval: () => 1, setTimeout, clearTimeout, Date
  });
  return { get: id => elements.get(id), update, calls, html };
}
test('new dashboard renders unknown Steam time without making up progress', () => {
  const f = fixture();
  f.update({ status: 'running', games: [730], elapsedMs: 3600000, desktop: { selectedGames: [730], trayAvailable: true },
    playtime: { status: 'error', checkedAt: null, totals: {}, delta: {}, message: 'Süre alınamadı.' } });
  assert.equal(f.get('timer').textContent, '01:00:00');
  assert.equal(f.get('cs2-total').textContent, '—'); assert.equal(f.get('cs2-delta').textContent, '—');
  assert.equal(f.get('start').disabled, true); assert.equal(f.get('stop').disabled, false);
  assert.equal(f.get('login-form').hidden, true);
  assert.equal(f.get('account-ready').hidden, false);
  assert.equal((f.html.match(/class="game /g) || []).length, 3);
});
test('custom favorite names stay text and selected Steam time is shown', () => {
  const f = fixture();
  f.update({ status: 'online', elapsedMs: 0, desktop: { favorites: [{ id: 440, name: '<script>bad()</script>' }], selectedGames: [440] },
    playtime: { checkedAt: Date.now(), totals: { 440: 120 }, delta: { 440: 5 } } });
  const row = f.get('extra-favorites').children[0];
  assert.equal(row.children[0].children[1].textContent, '<script>bad()</script>');
  assert.equal(row.children[0].children[0].checked, true);
  assert.equal(row.children[1].textContent, '2 h 0 min · +5 min');
  assert.equal(f.get('selected-count').textContent, '1 game selected');
});
test('retry countdown and unavailable startup integration are clearly represented', () => {
  const f = fixture();
  f.update({ status: 'offline', elapsedMs: 0, retry: { count: 2, nextAt: Date.now() + 10000 },
    desktop: { selectedGames: [], startupAvailable: false, trayAvailable: false } });
  assert.ok(f.get('retry-note').textContent.includes('2/8'));
  assert.equal(f.get('start-at-login').disabled, true); assert.equal(f.get('hide').disabled, true);
  assert.equal(f.get('disconnect').disabled, false);
});
test('browser preview does not invite entering credentials into a nonfunctional login', () => {
  const f = fixture(false);
  assert.equal(f.get('username').disabled, true); assert.equal(f.get('password').disabled, true);
  assert.equal(f.get('login').disabled, true);
});
test('password field is cleared immediately after passing the IPC copy', async () => {
  const f = fixture();
  f.get('username').value = 'test-only'; f.get('password').value = 'test-only-password';
  f.get('login-form').handlers.submit({ preventDefault() {} });
  assert.equal(f.get('password').value, '');
  assert.equal(f.calls[0].password, 'test-only-password');
  await new Promise(resolve => setImmediate(resolve));
});
