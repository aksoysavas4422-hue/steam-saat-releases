'use strict';
const { EventEmitter } = require('node:events');
const { randomInt } = require('node:crypto');
const { appId } = require('./catalog.cjs');

const APP_IDS = Object.freeze([393380, 730]);
function validateLogin(value) {
  if (!value || typeof value.accountName !== 'string' || typeof value.password !== 'string'
      || !value.accountName.trim() || value.accountName.length > 128
      || !value.password || value.password.length > 256) {
    throw new Error('Kullanıcı adı ve şifreyi kontrol et.');
  }
  return { accountName: value.accountName.trim(), password: value.password };
}
function validateGames(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 32
      || value.some(id => !appId(id)) || new Set(value).size !== value.length) {
    throw new Error('En fazla 32 Steam oyunu seç.');
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
    this.message = 'Bağlı değil.';
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
    return { status: 'idle', checkedAt: null, baselineAt: null, totals: {}, baseline: {}, delta: {}, message: 'Steam süresi henüz okunmadı.' };
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
    if (this.status !== 'offline') throw new Error('Önce mevcut bağlantıyı kes.');
    const details = tokenLogin ? { refreshToken: input } : validateLogin(input);
    if (tokenLogin && (typeof input !== 'string' || input.length < 16 || input.length > 16384)) throw new Error('Geçersiz kayıtlı oturum.');
    this.elapsed = 0;
    this.disconnectKind = 'manual';
    this.playtime = this.emptyPlaytime();
    this.blocked = false;
    let client;
    try {
      client = this.makeClient({ dataDirectory: null, autoRelogin: false, enablePicsCache: false, renewRefreshTokens: true });
    } catch {
      details.password = '';
      this.disconnect('Steam kütüphanesi başlatılamadı. Kurulumu kontrol et.');
      return;
    }
    this.status = 'connecting';
    this.message = 'Steam bağlantısı kuruluyor. Mobil onay istenirse Steam uygulamanı kontrol et.';
    this.client = client;
    const live = () => this.client === client;
    client.on('loggedOn', () => {
      if (!live()) return;
      this.clearDeadline();
      this.guard = null;
      this.guardAfter = 0;
      this.status = 'online';
      this.blocked = Boolean(client.playingState?.blocked);
      this.message = this.blocked ? 'Hesap başka bir oturumda oyun oynuyor. İşlem başlatılmadı.' : 'Steam bağlantısı hazır. Oyun seçip başlatabilirsin.';
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
      this.message = lastCodeWrong ? 'Kod reddedildi. 30 saniye sonra yeni kodu gir.'
        : domain ? 'E-postana gelen Steam Guard kodunu gir.' : 'Steam mobil uygulamasındaki Steam Guard kodunu gir.';
      this.publish();
    });
    client.on('playingState', blocked => {
      if (!live()) return;
      this.blocked = Boolean(blocked);
      if (blocked) {
        this.stop();
        this.message = 'Hesap başka yerde oyun oynuyor. Saat işlemi durduruldu; diğer oturuma müdahale edilmedi.';
      } else if (this.status === 'online') {
        this.message = 'Diğer oyun oturumu sona erdi. İstersen yeniden başlatabilirsin.';
      }
      this.publish();
    });
    client.on('error', error => {
      const transient = [3, 16, 20, 48].includes(error?.eresult) || ['ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN'].includes(error?.code);
      if (live()) this.disconnect(transient ? 'Steam bağlantısı kesildi.' : 'Steam oturumu reddedildi. Yeniden giriş gerekebilir.', transient ? 'transient' : 'auth');
    });
    client.on('disconnected', result => {
      const transient = result == null || [0, 3, 16, 20, 48].includes(result);
      if (live()) this.disconnect('Steam bağlantısı kesildi.', transient ? 'transient' : 'auth');
    });
    this.deadline = setTimeout(() => {
      if (live()) this.disconnect('Giriş süresi doldu. Yeniden deneyebilirsin.');
    }, 180000);
    this.deadline.unref?.();
    this.publish();
    try {
      // Random logonID avoids replacing another local client session using ID 0.
      client.logOn({ ...details, logonID: randomInt(1, 0xFFFFFFFF), machineName: 'Steam Saat' });
    } catch {
      this.disconnect('Giriş başlatılamadı. Yeniden deneyebilirsin.');
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
          const timer = setTimeout(() => reject(new Error('Süre okunamadı.')), 10000);
          const done = (error, response) => { clearTimeout(timer); error ? reject(new Error('Süre okunamadı.')) : resolve(response); };
          try {
            if (!client.steamID || typeof client.getUserOwnedApps !== 'function') return done(new Error('Süre okunamadı.'));
            client.getUserOwnedApps(client.steamID, { filterAppids: this.watchedGames, includePlayedFreeGames: true, includeFreeSub: true, includeAppInfo: false }, done);
          } catch { done(new Error('Süre okunamadı.')); }
        });
        if (this.client !== client || !['online', 'running'].includes(this.status)) return false;
        if (!Array.isArray(result?.apps)) throw new Error('Süre okunamadı.');
        const totals = {};
        for (const id of this.watchedGames) {
          const minutes = result.apps.find(game => game.appid === id)?.playtime_forever;
          totals[id] = Number.isSafeInteger(minutes) && minutes >= 0 ? minutes : null;
        }
        if (!this.watchedGames.some(id => totals[id] !== null)) throw new Error('Süre okunamadı.');
        this.playtime.totals = totals;
        this.playtime.checkedAt = this.wallClock();
        this.playtime.status = 'ready';
        this.playtime.message = 'Steam’in bildirdiği toplam süre. Güncelleme gecikebilir; artış bu uygulamaya özel olarak ölçülemez.';
        this.calculateDelta();
        if (baseline) this.setBaseline();
        this.publish();
        return true;
      } catch {
        if (this.client !== client) return false;
        this.playtime.status = 'error';
        this.playtime.message = 'Steam süresi alınamadı. Profil gizliliği, oyun erişimi veya bağlantı etkili olabilir. Varsa önceki değer son başarılı okumadır.';
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
    if (this.status !== 'guard' || !this.guard) throw new Error('Şu anda kod beklenmiyor.');
    if (this.wallClock() < this.guardAfter) throw new Error('Yeni kod için 30 saniyelik beklemenin bitmesini bekle.');
    if (typeof code !== 'string' || !/^[A-Z0-9]{5}$/i.test(code.trim())) throw new Error('5 karakterli Steam Guard kodunu kontrol et.');
    const callback = this.guard;
    this.guard = null;
    this.status = 'connecting';
    this.message = 'Kod Steam tarafından kontrol ediliyor.';
    this.publish();
    callback(code.trim().toUpperCase());
  }
  async start(ids) {
    const games = validateGames(ids);
    if (this.status !== 'online' || !this.client) throw new Error('Önce Steam hesabına bağlan.');
    if (this.blocked || this.client.playingState?.blocked) throw new Error('Hesap başka yerde oyun oynuyor.');
    const client = this.client;
    if (this.readingPlaytime?.client === client) await this.readingPlaytime.promise;
    this.watchedGames = [...new Set([...APP_IDS, ...games])];
    await this.refreshPlaytime({ baseline: true });
    if (this.client !== client || this.status !== 'online' || this.blocked || client.playingState?.blocked) throw new Error('Bağlantı veya oyun durumu değişti.');
    // Never use force=true or kickPlayingSession().
    this.games = games;
    this.elapsed = 0;
    this.startedAt = this.clock();
    this.status = 'running';
    this.message = 'Seçili oyunlar Steam’e bildirildi. Sayaç yerel oturum süresidir; Steam saati garantisi değildir.';
    try { this.client.gamesPlayed(games, false); }
    catch {
      this.disconnect('Oyun bildirimi gönderilemedi. Bağlantı kapatıldı.');
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
    if (this.status === 'online') this.message = 'Durduruldu. Yeniden başlatınca sayaç sıfırlanır.';
    this.publish();
  }
  disconnect(message = 'Bağlantı kesildi.', kind = 'manual') {
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
