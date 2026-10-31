'use strict';
const { EventEmitter } = require('node:events');
const { randomInt } = require('node:crypto');
const { appId } = require('./catalog.cjs');

const APP_IDS = Object.freeze([393380, 730]);
function validateLogin(value) {
  if (!value || typeof value.accountName !== 'string' || typeof value.password !== 'string'
      || !value.accountName.trim() || value.accountName.length > 128
      || !value.password || value.password.length > 256) {
    throw new Error('Check your account name and password.');
  }
  return { accountName: value.accountName.trim(), password: value.password };
}
function validateGames(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 32
      || value.some(id => !appId(id)) || new Set(value).size !== value.length) {
    throw new Error('Select up to 32 Steam games.');
  }
  return [...value];
}

// Token events go only to the privileged parent, never into public snapshots.
class Session extends EventEmitter {
  constructor(makeClient, { clock = () => performance.now(), wallClock = Date.now } = {}) {
    super();
    this.makeClient = makeClient;
    this.clock = clock;
    this.wallClock = wallClock;
    this.client = null;
    this.status = 'offline';
    this.message = 'Disconnected.';
    this.games = [];
    this.watchedGames = [...APP_IDS];
    this.startedAt = null;
    this.elapsed = 0;
    this.blocked = false;
    this.guard = null;
    this.guardAfter = 0;
    this.deadline = null;
    this.disconnectKind = 'manual';
    this.playtime = this.emptyPlaytime();
    this.readingPlaytime = null;
  }
  emptyPlaytime() {
    return { status: 'idle', checkedAt: null, baselineAt: null, totals: {}, baseline: {}, delta: {}, message: 'Steam playtime has not been read yet.' };
  }
  snapshot() {
    return {
      status: this.status, message: this.message, games: [...this.games],
      elapsedMs: Math.max(0, this.elapsed + (this.startedAt === null ? 0 : this.clock() - this.startedAt)),
      blocked: this.blocked, guardAfter: this.guardAfter, disconnectKind: this.disconnectKind,
      playtime: { ...this.playtime, totals: { ...this.playtime.totals }, baseline: { ...this.playtime.baseline }, delta: { ...this.playtime.delta } }
    };
  }
  publish() { this.emit('state', this.snapshot()); }
  clearDeadline() { clearTimeout(this.deadline); this.deadline = null; }
  login(input, tokenLogin = false) {
    if (this.status !== 'offline') throw new Error('Disconnect the current session first.');
    const details = tokenLogin ? { refreshToken: input } : validateLogin(input);
    if (tokenLogin && (typeof input !== 'string' || input.length < 16 || input.length > 16384)) throw new Error('Invalid saved session.');
    this.elapsed = 0;
    this.disconnectKind = 'manual';
    this.playtime = this.emptyPlaytime();
    this.blocked = false;
    let client;
    try {
      client = this.makeClient({ dataDirectory: null, autoRelogin: false, enablePicsCache: false, renewRefreshTokens: true });
    } catch {
      details.password = '';
      this.disconnect('Steam component unavailable. Reopen the application.');
      return;
    }
    this.status = 'connecting';
    this.message = 'Connecting to Steam. Check the Steam mobile app if approval is requested.';
    this.client = client;
    const live = () => this.client === client;
    client.on('loggedOn', () => {
      if (!live()) return;
      this.clearDeadline();
      this.guard = null;
      this.guardAfter = 0;
      this.status = 'online';
      this.blocked = Boolean(client.playingState?.blocked);
      this.message = this.blocked ? 'Another game session is active. Nothing was started.' : 'Steam connected. Choose your games and start.';
      this.publish();
      void this.refreshPlaytime();
    });
    client.on('refreshToken', token => {
      if (live() && typeof token === 'string' && token.length >= 16 && token.length <= 16384) this.emit('credential', token);
    });
    client.on('steamGuard', (domain, callback, lastCodeWrong) => {
      if (!live()) return;
      this.guard = callback;
      this.guardAfter = lastCodeWrong ? this.wallClock() + 30000 : 0;
      this.status = 'guard';
      this.message = lastCodeWrong ? 'Code rejected. Wait 30 seconds before entering a new code.'
        : domain ? 'Enter the Steam Guard code from your email.' : 'Enter the Steam Guard code from your mobile app.';
      this.publish();
    });
    client.on('playingState', blocked => {
      if (!live()) return;
      this.blocked = Boolean(blocked);
      if (blocked) {
        this.stop();
        this.message = 'Another game session is active. This session stopped without interrupting it.';
      } else if (this.status === 'online') {
        this.message = 'The other game session ended. You can start again.';
      }
      this.publish();
    });
    client.on('error', error => {
      const transient = [3, 16, 20, 48].includes(error?.eresult) || ['ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN'].includes(error?.code);
      if (live()) this.disconnect(transient ? 'Steam disconnected.' : 'Steam session rejected. You may need to sign in again.', transient ? 'transient' : 'auth');
    });
    client.on('disconnected', result => {
      const transient = result == null || [0, 3, 16, 20, 48].includes(result);
      if (live()) this.disconnect('Steam disconnected.', transient ? 'transient' : 'auth');
    });
    this.deadline = setTimeout(() => {
      if (live()) this.disconnect('Sign-in timed out. Try again.');
    }, 180000);
    this.deadline.unref?.();
    this.publish();
    try {
      // Random logonID avoids replacing another local client session using ID 0.
      client.logOn({ ...details, logonID: randomInt(1, 0xFFFFFFFF), machineName: 'Steam Saat' });
    } catch {
      this.disconnect('Sign-in could not start. Try again.');
    } finally {
      details.password = '';
      details.refreshToken = '';
      // JS strings and library-owned memory cannot be securely zeroed; worker is
      // terminated by the parent after disconnect. No claim of forensic erasure.
    }
  }
  resume(token) { this.login(token, true); }
  async refreshPlaytime({ baseline = false } = {}) {
    const client = this.client;
    if (!client || !['online', 'running'].includes(this.status)) return false;
    if (this.readingPlaytime?.client === client) {
      const success = await this.readingPlaytime.promise;
      if (baseline && this.client === client) {
        if (success) this.setBaseline();
        else { this.playtime.baseline = {}; this.playtime.baselineAt = null; this.calculateDelta(); this.publish(); }
      }
      return success;
    }
    const read = async () => {
      this.playtime.status = 'loading'; this.publish();
      try {
        const result = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Playtime unavailable.')), 10000);
          const done = (error, response) => { clearTimeout(timer); error ? reject(new Error('Playtime unavailable.')) : resolve(response); };
          try {
            if (!client.steamID || typeof client.getUserOwnedApps !== 'function') return done(new Error('Playtime unavailable.'));
            client.getUserOwnedApps(client.steamID, { filterAppids: this.watchedGames, includePlayedFreeGames: true, includeFreeSub: true, includeAppInfo: false }, done);
          } catch { done(new Error('Playtime unavailable.')); }
        });
        if (this.client !== client || !['online', 'running'].includes(this.status)) return false;
        if (!Array.isArray(result?.apps)) throw new Error('Playtime unavailable.');
        const totals = {};
        for (const id of this.watchedGames) {
          const minutes = result.apps.find(game => game.appid === id)?.playtime_forever;
          totals[id] = Number.isSafeInteger(minutes) && minutes >= 0 ? minutes : null;
        }
        if (!this.watchedGames.some(id => totals[id] !== null)) throw new Error('Playtime unavailable.');
        this.playtime.totals = totals;
        this.playtime.checkedAt = this.wallClock();
        this.playtime.status = 'ready';
        this.playtime.message = 'Totals reported by Steam. Updates can be delayed; increases cannot be attributed solely to this app.';
        this.calculateDelta();
        if (baseline) this.setBaseline();
        this.publish();
        return true;
      } catch {
        if (this.client !== client) return false;
        this.playtime.status = 'error';
        this.playtime.message = 'Steam playtime unavailable. Privacy, game access or connection may be the cause. Previous values show the last successful reading.';
        if (baseline) { this.playtime.baseline = {}; this.playtime.baselineAt = null; this.calculateDelta(); }
        this.publish();
        return false;
      }
    };
    const promise = read();
    this.readingPlaytime = { client, promise };
    try { return await promise; }
    finally { if (this.readingPlaytime?.promise === promise) this.readingPlaytime = null; }
  }
  setBaseline() {
    this.playtime.baseline = { ...this.playtime.totals };
    this.playtime.baselineAt = this.playtime.checkedAt;
    this.calculateDelta(); this.publish();
  }
  calculateDelta() {
    for (const id of this.watchedGames) {
      const total = this.playtime.totals[id], start = this.playtime.baseline[id];
      this.playtime.delta[id] = Number.isSafeInteger(total) && Number.isSafeInteger(start) && total >= start ? total - start : null;
    }
  }
  submitGuard(code) {
    if (this.status !== 'guard' || !this.guard) throw new Error('No code is currently requested.');
    if (this.wallClock() < this.guardAfter) throw new Error('Wait 30 seconds before entering a new code.');
    if (typeof code !== 'string' || !/^[A-Z0-9]{5}$/i.test(code.trim())) throw new Error('Check the five-character Steam Guard code.');
    const callback = this.guard;
    this.guard = null;
    this.status = 'connecting';
    this.message = 'Steam is checking your code.';
    this.publish();
    callback(code.trim().toUpperCase());
  }
  async start(ids) {
    const games = validateGames(ids);
    if (this.status !== 'online' || !this.client) throw new Error('Connect to Steam first.');
    if (this.blocked || this.client.playingState?.blocked) throw new Error('Another game session is active.');
    const client = this.client;
    if (this.readingPlaytime?.client === client) await this.readingPlaytime.promise;
    this.watchedGames = [...new Set([...APP_IDS, ...games])];
    await this.refreshPlaytime({ baseline: true });
    if (this.client !== client || this.status !== 'online' || this.blocked || client.playingState?.blocked) throw new Error('Connection or game state changed.');
    // Never use force=true or kickPlayingSession().
    this.games = games;
    this.elapsed = 0;
    this.startedAt = this.clock();
    this.status = 'running';
    this.message = 'Selected games reported to Steam. The local timer does not guarantee Steam playtime.';
    try { this.client.gamesPlayed(games, false); }
    catch {
      this.disconnect('Game activity could not be reported. Connection closed.');
      return;
    }
    this.publish();
  }
  stop() {
    if (this.startedAt !== null) {
      this.elapsed += Math.max(0, this.clock() - this.startedAt);
      this.startedAt = null;
    }
    if (this.client && this.status === 'running') {
      // Update local state before sending: synchronous callbacks cannot recurse.
      this.status = 'online';
      try { this.client.gamesPlayed([], false); } catch { /* disconnect handler owns failure */ }
    }
    this.games = [];
    if (this.status === 'online') this.message = 'Stopped. Starting again resets the local timer.';
    this.publish();
  }
  disconnect(message = 'Disconnected.', kind = 'manual') {
    this.clearDeadline();
    this.stop();
    const client = this.client;
    this.client = null;
    this.guard = null;
    this.guardAfter = 0;
    this.blocked = false;
    this.status = 'offline';
    this.disconnectKind = kind;
    this.message = message;
    if (client) {
      // Keep error listeners attached until process exit, but ignore stale callbacks.
      try { client.logOff(); } catch { /* no raw exceptions leave this layer */ }
    }
    this.publish();
  }
}
module.exports = { Session, validateLogin, validateGames };
