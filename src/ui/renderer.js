'use strict';
const api = window.steamSaat;
const $ = id => document.getElementById(id);
let state = { status: 'offline', games: [], elapsedMs: 0, guardAfter: 0, blocked: false };
let receivedAt = performance.now();
let busy = false;
let hasFiveM = false;
const labels = { restoring: 'Oturum açılıyor', offline: 'Bağlı değil', connecting: 'Bağlanıyor', guard: 'Steam Guard', online: 'Bağlı', running: 'Etkin oturum' };
const chosen = () => ['squad', 'cs2'].filter(id => $(id).checked).map(id => Number($(id).value));
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
function paint() {
  const connected = ['online', 'running'].includes(state.status);
  const desktop = state.desktop || {};
  const waiting = Boolean(state.retry?.nextAt);
  $('retry-note').textContent = waiting ? `${state.retry.count}/8 · ${Math.max(0, Math.ceil((state.retry.nextAt - Date.now()) / 1000))} sn sonra tekrar denenecek`
    : state.retry?.exhausted ? 'Otomatik deneme sınırına ulaşıldı'
    : state.blocked ? 'Diğer oyun oturumu öncelikli'
    : connected ? 'Steam bağlantısı açık' : 'Bağlantı bekleniyor';
  $('retry-now').disabled = !api || busy || state.status !== 'offline';
  $('hide').disabled = !api || !desktop.trayAvailable;
  $('quit').disabled = !api || busy;
  $('update-message').textContent = state.updates?.message || 'Güncellemeler kurulu uygulamada etkinleşir.';
  $('check-updates').disabled = !api || busy || !state.updates || ['development', 'checking', 'downloading', 'ready'].includes(state.updates.status);
  $('close-to-tray').disabled = !api || busy || !desktop.trayAvailable;
  $('auto-reconnect').disabled = !api || busy;
  $('start-at-login').disabled = !api || busy || !desktop.startupAvailable;
  $('auto-start-on-login').disabled = !api || busy;
  $('login-form').hidden = connected || state.status === 'guard';
  $('account-ready').hidden = !connected;
  $('account-detail').textContent = state.saved ? 'Oturum bu Windows hesabında hatırlanıyor.' : 'Oturum yalnızca uygulama açıkken korunur.';
  $('desktop-note').textContent = !api ? 'Arayüz önizlemesi. Bu ayarları masaüstü uygulamasında değiştirebilirsin.'
    : !desktop.trayAvailable ? 'Sistem tepsisi kullanılamıyor; pencereyi kapatmak uygulamadan çıkar.'
    : desktop.startAtLogin ? desktop.autoStartOnLogin
      ? !desktop.selectedGames?.length ? 'Otomatik başlatmak için yukarıdan Squad veya CS2 seç.'
        : !state.saved ? 'Otomatik başlatmak için Steam’e girip “Oturumu hatırla” seçeneğini açık tut.'
          : 'Windows oturumu açıldığında seçili oyunlarla otomatik başlar.'
      : 'Windows oturumu açılınca uygulama tepside açılır; oyunları elle başlatırsın.'
    : 'Windows başlangıcı kapalı. × düğmesi tepside tutma ayarına göre davranır.';
  $('badge').textContent = `● ${labels[state.status] || 'Bağlı değil'}`;
  $('badge').classList.toggle('online', connected);
  $('username').disabled = !api || busy || state.status !== 'offline';
  $('password').disabled = !api || busy || state.status !== 'offline';
  $('login').disabled = !api || busy || state.status !== 'offline';
  $('remember').disabled = !api || busy || state.status !== 'offline';
  $('forget').disabled = !api || busy || !state.saved;
  $('refresh-playtime').disabled = !api || busy || !connected || state.playtime?.status === 'loading';
  const playtime = state.playtime;
  const duration = value => Number.isSafeInteger(value) ? `${Math.floor(value / 60)} sa ${value % 60} dk` : 'Alınamadı';
  for (const [name, id] of [['squad', 393380], ['cs2', 730]]) {
    $(name + '-total').textContent = playtime?.checkedAt != null ? duration(playtime.totals?.[id]) : '—';
    const delta = playtime?.delta?.[id];
    $(name + '-delta').textContent = Number.isSafeInteger(delta) ? `+${delta} dk` : '—';
  }
  $('playtime-note').textContent = playtime?.status === 'loading' ? 'Steam’den süre okunuyor…' : playtime?.message || 'Steam süresi henüz okunmadı.';
  $('playtime-checked').textContent = `Son başarılı okuma: ${playtime?.checkedAt != null ? new Date(playtime.checkedAt).toLocaleString('tr-TR') : '—'}${connected ? '' : ' · Bağlantı kapalı'}`;
  if (state.saveMessage) $('save-message').textContent = state.saveMessage;
  $('guard-form').hidden = state.status !== 'guard';
  $('guard-submit').disabled = busy || Date.now() < state.guardAfter;
  $('guard-code').disabled = busy;
  $('guard-help').textContent = Date.now() < state.guardAfter
    ? `Yeni kod için ${Math.ceil((state.guardAfter - Date.now()) / 1000)} saniye bekle.` : 'Kod yalnızca Steam’e iletilir ve kaydedilmez.';
  $('start').disabled = !api || busy || state.status !== 'online' || state.blocked || !chosen().length;
  $('stop').disabled = busy || (state.status !== 'running' && !waiting);
  // Disconnect is available during login and Guard; it doubles as cancellation.
  $('disconnect').disabled = busy || (state.status === 'offline' && !waiting);
  ['squad', 'cs2'].forEach(id => { $(id).disabled = busy || state.status === 'running'; });
  $('selected-count').textContent = `${chosen().length} oyun seçili`;
  $('choose-fivem').disabled = !api || busy;
  $('launch-fivem').disabled = !api || busy || !hasFiveM;
  const elapsed = Math.max(0, Math.floor((state.elapsedMs + (state.status === 'running' ? performance.now() - receivedAt : 0)) / 1000));
  $('timer').textContent = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60].map(n => String(n).padStart(2, '0')).join(':');
}
function update(value) {
  const oldStatus = state.status;
  state = value;
  if (typeof value.remember === 'boolean') $('remember').checked = value.remember;
  if (value.desktop) {
    hasFiveM = Boolean(value.desktop.fiveMReady);
    for (const [id, key] of [['close-to-tray', 'closeToTray'], ['auto-reconnect', 'autoReconnect'], ['start-at-login', 'startAtLogin'], ['auto-start-on-login', 'autoStartOnLogin']]) $(id).checked = Boolean(value.desktop[key]);
    if (Array.isArray(value.desktop.selectedGames)) {
      for (const id of ['squad', 'cs2']) $(id).checked = value.desktop.selectedGames.includes(Number($(id).value));
    }
  }
  receivedAt = performance.now();
  if (value.message) message(value.message);
  if (state.status === 'offline') { $('password').value = ''; $('guard-code').value = ''; }
  paint();
  if (oldStatus !== 'guard' && state.status === 'guard') $('guard-code').focus();
}
async function act(callback) {
  if (busy || !api) return;
  busy = true; paint();
  try {
    const result = await callback();
    if (!result?.ok) message(result?.message || 'İşlem tamamlanamadı.', true);
    return result;
  } catch { message('Uygulama işlemi tamamlayamadı. Yeniden deneyebilirsin.', true); }
  finally { busy = false; paint(); }
}
$('login-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!api || busy) return;
  const payload = { accountName: $('username').value, password: $('password').value, remember: $('remember').checked };
  // Capture the IPC copy then immediately clear the rendered password field.
  const request = api.login(payload);
  payload.password = '';
  $('password').value = '';
  act(() => request);
});
$('guard-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!api || busy) return;
  const request = api.guard($('guard-code').value);
  $('guard-code').value = '';
  act(() => request);
});
$('start').addEventListener('click', () => act(() => api.start(chosen())));
$('stop').addEventListener('click', () => act(() => api.stop()));
$('disconnect').addEventListener('click', () => act(() => api.disconnect()));
$('forget').addEventListener('click', () => act(() => api.forget()));
$('refresh-playtime').addEventListener('click', () => act(() => api.refreshPlaytime()));
async function savePreferences(patch) {
  const result = await api.preferences(patch);
  if (!result?.ok) { const snapshot = await api.snapshot(); if (snapshot.state) update(snapshot.state); }
  return result;
}
['squad', 'cs2'].forEach(id => $(id).addEventListener('change', () => { paint(); if (api) act(() => savePreferences({ selectedGames: chosen() })); }));
for (const [id, key] of [['close-to-tray', 'closeToTray'], ['auto-reconnect', 'autoReconnect'], ['start-at-login', 'startAtLogin'], ['auto-start-on-login', 'autoStartOnLogin']]) $(id).addEventListener('change', () => act(() => savePreferences({ [key]: $(id).checked })));
$('hide').addEventListener('click', () => act(() => api.hide()));
$('quit').addEventListener('click', () => act(() => api.quit()));
$('check-updates').addEventListener('click', () => act(() => api.checkUpdates()));
$('retry-now').addEventListener('click', () => act(() => api.retryNow()));
document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => {
  $(button.dataset.scroll).scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('[data-scroll]').forEach(item => item.classList.toggle('active', item === button));
}));
$('choose-fivem').addEventListener('click', () => act(async () => {
  const result = await api.chooseFiveM();
  if (result?.selected) { hasFiveM = true; message('FiveM.exe seçildi. Kısayol sonraki açılışlarda da hatırlanır.'); }
  return result;
}));
$('launch-fivem').addEventListener('click', () => act(async () => {
  const result = await api.launchFiveM();
  if (result?.ok) message('FiveM’i açma isteği gönderildi. Bu işlem Steam saati biriktirmez.');
  return result;
}));
if (api) {
  api.onState(update);
  api.snapshot().then(result => { if (result?.state) update(result.state); }).catch(() => message('Durum okunamadı.', true));
} else {
  message('Arayüz önizlemesi. Steam bağlantısı için uygulamayı BAŞLAT.cmd ile aç.');
}
setInterval(paint, 250);
paint();
