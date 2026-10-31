'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Session, validateGames } = require('../src/session.cjs');

class FakeSteam extends EventEmitter {
  steamID = '76561198000000000';
  totals = { 393380: 120, 730: 300 };
  getUserOwnedApps(_steamID, _options, callback) { callback(null, { apps: Object.entries(this.totals).map(([appid, playtime_forever]) => ({ appid: Number(appid), playtime_forever })) }); }
  playingState = { blocked: false };
  calls = [];
  logOn(details) { this.logonID = details.logonID; this.calls.push(['login']); }
  gamesPlayed(ids, force) { this.calls.push(['games', [...ids], force]); }
  logOff() { this.calls.push(['logout']); this.emit('disconnected'); }
}
function setup() {
  let now = 1000;
  let options;
  const clients = [];
  const session = new Session(value => {
    options = value;
    const client = new FakeSteam(); clients.push(client); return client;
  }, { clock: () => now, wallClock: () => now });
  session.login({ accountName: 'test-only', password: 'test-only' });
  const client = clients[0];
  return { session, client, clients, options, time: value => { now = value; } };
}
function online(t) { const value = setup(); t.after(() => value.session.disconnect()); value.client.emit('loggedOn'); return value; }

test('explicit Steam game IDs are allowed, invalid IDs and duplicates are rejected', () => {
  assert.deepEqual(validateGames([393380, 730]), [393380, 730]);
  assert.deepEqual(validateGames([440]), [440]);
  for (const ids of [[], [0], [-1], ['730'], [730, 730], null, Array.from({ length: 33 }, (_, i) => i + 1)]) {
    assert.throws(() => validateGames(ids));
  }
});
test('custom Steam game is reported explicitly and its actual time is queried', async t => {
  const f = online(t); f.client.totals[440] = 123;
  await f.session.start([440]);
  assert.deepEqual(f.session.snapshot().games, [440]);
  assert.equal(f.session.snapshot().playtime.totals[440], 123);
  assert.ok(f.client.calls.some(call => call[0] === 'games' && call[1][0] === 440 && call[2] === false));
});
test('disk storage and auto reconnect are disabled; login has unique nonzero ID', t => {
  const f = setup(); t.after(() => f.session.disconnect());
  assert.deepEqual(f.options, { dataDirectory: null, autoRelogin: false, enablePicsCache: false, renewRefreshTokens: true });
  assert.ok(f.client.logonID > 0 && f.client.logonID <= 0xFFFFFFFF);
  assert.equal(JSON.stringify(f.session.snapshot()).includes('test-only'), false);
});
test('cannot start before login or while another playing session is blocked', async t => {
  const f = setup(); t.after(() => f.session.disconnect());
  await assert.rejects(() => f.session.start([730]));
  f.client.playingState.blocked = true; f.client.emit('loggedOn');
  await assert.rejects(() => f.session.start([730]));
  assert.equal(f.client.calls.some(call => call[0] === 'games'), false);
});
test('remote session stops games and timer, does not resume itself or force a kick', async t => {
  const f = online(t);
  await f.session.start([393380, 730]); f.time(6000);
  f.client.playingState.blocked = true; f.client.emit('playingState', true, 730);
  assert.equal(f.session.status, 'online');
  assert.deepEqual(f.session.games, []);
  assert.equal(f.session.snapshot().elapsedMs, 5000);
  assert.deepEqual(f.client.calls.at(-1), ['games', [], false]);
  assert.ok(f.client.calls.filter(call => call[0] === 'games').every(call => call[2] === false));
  f.time(20000); assert.equal(f.session.snapshot().elapsedMs, 5000);
  f.client.playingState.blocked = false; f.client.emit('playingState', false);
  assert.equal(f.session.status, 'online'); assert.deepEqual(f.session.games, []);
});
test('synchronous competing-play callback cannot leave the session running', async t => {
  const f = online(t);
  const original = f.client.gamesPlayed.bind(f.client);
  f.client.gamesPlayed = (ids, force) => {
    original(ids, force);
    if (ids.length) { f.client.playingState.blocked = true; f.client.emit('playingState', true); }
  };
  await f.session.start([730]);
  assert.equal(f.session.status, 'online'); assert.equal(f.session.startedAt, null);
});
test('stop freezes local time and a new start resets the interval', async t => {
  const f = online(t);
  await f.session.start([730]); f.time(11000); f.session.stop();
  f.time(21000); assert.equal(f.session.snapshot().elapsedMs, 10000);
  await f.session.start([393380]); assert.equal(f.session.snapshot().elapsedMs, 0);
  await assert.rejects(() => f.session.start([730]));
});
test('disconnection stops play, drops pending guard callback, ignores stale events', async t => {
  const f = online(t); await f.session.start([730]); f.time(4000);
  f.client.emit('error', new Error('sensitive error text must not escape'));
  assert.equal(f.session.status, 'offline'); assert.equal(f.session.client, null);
  assert.equal(f.session.snapshot().elapsedMs, 3000);
  assert.equal(JSON.stringify(f.session.snapshot()).includes('sensitive'), false);
  f.client.emit('loggedOn'); f.client.emit('steamGuard', null, () => assert.fail('stale callback'));
  assert.equal(f.session.status, 'offline'); assert.equal(f.session.guard, null);
});
test('Guard rejects early retries, validates codes and consumes callback once', t => {
  const f = setup(); t.after(() => f.session.disconnect());
  let value;
  f.client.emit('steamGuard', null, code => { value = code; }, true);
  assert.throws(() => f.session.submitGuard('ABCDE'));
  f.time(31000);
  assert.throws(() => f.session.submitGuard('not-a-code'));
  f.session.submitGuard('abcde'); assert.equal(value, 'ABCDE');
  assert.equal(f.session.status, 'connecting');
  assert.throws(() => f.session.submitGuard('ABCDE'));
});
test('logout during Guard cannot accept a later code or callback', t => {
  const f = setup(); t.after(() => f.session.disconnect());
  f.client.emit('steamGuard', 'example.invalid', () => assert.fail('cancelled'));
  f.session.disconnect(); assert.throws(() => f.session.submitGuard('ABCDE'));
  assert.equal(f.session.status, 'offline'); assert.equal(f.session.guardAfter, 0);
  assert.equal(f.client.calls.at(-1)[0], 'logout');
});
test('library creation failure is recoverable and does not retain a connecting state', () => {
  const session = new Session(() => { throw new Error('private data'); });
  session.login({ accountName: 'test-only', password: 'test-only' });
  assert.equal(session.status, 'offline'); assert.equal(session.client, null);
  assert.equal(JSON.stringify(session.snapshot()).includes('private data'), false);
});
test('gamesPlayed failure disconnects and no running timer survives', async t => {
  const f = online(t);
  f.client.gamesPlayed = () => { throw new Error('test error'); };
  await f.session.start([730]);
  assert.equal(f.session.status, 'offline'); assert.equal(f.session.startedAt, null);
});

test('Steam totals and deltas are independent from local elapsed time', async t => {
  const f = online(t);
  await f.session.start([393380, 730]);
  assert.equal(f.session.snapshot().playtime.baseline[730], 300);
  f.time(601000);
  await f.session.refreshPlaytime();
  assert.equal(f.session.snapshot().playtime.delta[730], 0);
  assert.equal(f.session.snapshot().elapsedMs, 600000);
  f.client.totals[730] = 307;
  await f.session.refreshPlaytime();
  assert.equal(f.session.snapshot().playtime.delta[730], 7);
  assert.equal(f.session.snapshot().playtime.totals[730], 307);
});
test('hidden or missing games stay unknown; fetch failure does not manufacture time', async t => {
  const f = online(t); await f.session.refreshPlaytime();
  f.client.totals = { 730: 305 };
  await f.session.start([730]);
  assert.equal(f.session.snapshot().playtime.totals[393380], null);
  f.client.getUserOwnedApps = (_id, _options, callback) => callback(new Error('private response'));
  await f.session.refreshPlaytime();
  assert.equal(f.session.snapshot().playtime.status, 'error');
  assert.equal(f.session.snapshot().playtime.totals[730], 305);
  assert.equal(JSON.stringify(f.session.snapshot()).includes('private response'), false);
  f.session.stop(); await f.session.start([730]);
  assert.equal(f.session.snapshot().playtime.baselineAt, null);
  assert.equal(f.session.snapshot().playtime.delta[730], null);
});
test('late Steam response cannot contaminate a disconnected session', async t => {
  const f = online(t); await f.session.refreshPlaytime();
  let callback;
  f.client.getUserOwnedApps = (_id, _options, done) => { callback = done; };
  const pending = f.session.refreshPlaytime();
  f.session.disconnect();
  callback(null, { apps: [{ appid: 730, playtime_forever: 9999 }] });
  assert.equal(await pending, false);
  assert.notEqual(f.session.snapshot().playtime.totals[730], 9999);
});
test('remembered token is passed only to Steam and private credential event', t => {
  const client = new FakeSteam(); let input;
  client.logOn = details => { input = { ...details }; };
  const session = new Session(() => client); t.after(() => session.disconnect());
  const token = 'test-only-refresh-token-12345';
  session.resume(token);
  assert.equal(input.refreshToken, token);
  assert.equal(input.password, undefined);
  let received;
  session.on('credential', value => { received = value; });
  client.emit('refreshToken', token);
  assert.equal(received, token);
  assert.equal(JSON.stringify(session.snapshot()).includes(token), false);
});

test('network failures are retryable while invalid credentials and replaced sessions are not', async t => {
  for (const [result, kind] of [[3, 'transient'], [16, 'transient'], [20, 'transient'], [5, 'auth'], [34, 'auth'], [6, 'auth'], [84, 'auth']]) {
    const f = online(t); await f.session.start([730]);
    f.client.emit('error', { eresult: result });
    assert.equal(f.session.snapshot().disconnectKind, kind);
    assert.equal(f.session.status, 'offline'); assert.equal(f.session.startedAt, null);
  }
});
