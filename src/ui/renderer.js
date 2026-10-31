'use strict';
const api = window.steamSaat;
const i18n = window.SteamHoursI18n;
const $ = id => document.getElementById(id);
let language = 'en', state = { status: 'offline', games: [], elapsedMs: 0, guardAfter: 0, blocked: false };
let receivedAt = performance.now(), busy = false, hasFiveM = false;
let favoriteKey = '', searchSerial = 0, searchTimer, searchNote = 'Search Steam and add games to your favorites.';
let notice = { key: 'Disconnected. Sign in to Steam.', error: false };
let searchResults = [];
const favoriteControls = new Map();
const statusLabels = { restoring: 'Restoring session', offline: 'Disconnected', connecting: 'Connecting', guard: 'Steam Guard', online: 'Connected', running: 'Active session' };
const t = (key, params) => i18n.t(key, language, params);
const chosen = () => [...['squad', 'cs2'].filter(id => $(id).checked).map(id => Number($(id).value)), ...[...favoriteControls].filter(([_id, control]) => control.input.checked).map(([id]) => id)];
const duration = value => Number.isSafeInteger(value) ? t('{hours} h {minutes} min', { hours: Math.floor(value / 60), minutes: value % 60 }) : t('Unavailable');
function message(key, error = false) { notice = { key, error }; $('message').textContent = t(key); $('message').classList.toggle('error', error); }
function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
  for (const element of document.querySelectorAll('[data-i18n-placeholder]')) element.placeholder = t(element.dataset.i18nPlaceholder);
  for (const element of document.querySelectorAll('[data-i18n-title]')) { element.title = t(element.dataset.i18nTitle); element.setAttribute('aria-label', t(element.dataset.i18nTitle)); }
  for (const code of i18n.languages) $('language-' + code).setAttribute('aria-pressed', String(code === language));
  $('squad').setAttribute('aria-label', t('Select {game}', { game: 'Squad' }));
  $('cs2').setAttribute('aria-label', t('Select {game}', { game: 'Counter-Strike 2' }));
  $('timer').setAttribute('aria-label', t('Local active session duration'));
  $('game-search').setAttribute('aria-label', t('Search Steam games'));
  $('message').textContent = t(notice.key);
}
function renderFavorites(favorites) {
  const extra = (favorites || []).filter(game => ![393380, 730].includes(game.id));
  const key = JSON.stringify(extra); if (key === favoriteKey) return;
  favoriteKey = key; favoriteControls.clear(); $('extra-favorites').textContent = '';
  for (const game of extra) {
    const row = document.createElement('div'); row.className = 'favorite-row';
    const label = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox';
    const name = document.createElement('span'); name.textContent = game.name;
    const time = document.createElement('span'); time.className = 'help';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button';
    label.append(input, name); row.append(label, time, remove); $('extra-favorites').append(row);
    input.addEventListener('change', () => { paint(); if (api) act(() => savePreferences({ selectedGames: chosen() })); });
    remove.addEventListener('click', () => act(() => api.removeFavorite(game.id)));
    favoriteControls.set(game.id, { input, time, remove, name: game.name });
  }
}
function renderSearchResults() {
  $('search-results').textContent = '';
  for (const game of searchResults) {
    const row = document.createElement('div'); row.className = 'search-result';
    const label = document.createElement('span'); label.textContent = game.name;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'small secondary';
    const exists = state.desktop?.favorites?.some(item => item.id === game.id);
    button.textContent = t(exists ? 'In favorites' : '+ Favorite'); button.disabled = exists || busy || state.status === 'running';
    button.addEventListener('click', () => act(async () => {
      const response = await api.addFavorite(game.id);
      if (response.ok) { searchNote = 'Added to favorites. Select the game to start a session.'; }
      return response;
    }));
    row.append(label, button); $('search-results').append(row);
  }
}
function paint() {
  const connected = ['online', 'running'].includes(state.status), desktop = state.desktop || {};
  $('game-search').disabled = !api;
  $('search-games').disabled = !api || busy;
  $('search-note').textContent = t(searchNote);
  $('favorites-empty').hidden = favoriteControls.size > 0 || searchResults.length > 0;
  for (const [id, control] of favoriteControls) {
    control.input.disabled = busy || state.status === 'running'; control.remove.disabled = !api || busy || state.status === 'running';
    control.input.setAttribute('aria-label', t('Select {game}', { game: control.name })); control.remove.textContent = t('Remove');
    const total = state.playtime?.totals?.[id], delta = state.playtime?.delta?.[id];
    control.time.textContent = Number.isSafeInteger(total) ? duration(total) + (Number.isSafeInteger(delta) ? ' · ' + t('+{minutes} min', { minutes: delta }) : '') : t('Steam playtime: —');
  }
  const waiting = Boolean(state.retry?.nextAt);
  $('retry-note').textContent = waiting ? t('{attempt}/8 · Retrying in {seconds}s', { attempt: state.retry.count, seconds: Math.max(0, Math.ceil((state.retry.nextAt - Date.now()) / 1000)) })
    : t(state.retry?.exhausted ? 'Automatic retry limit reached' : state.blocked ? 'Another game session has priority' : connected ? 'Steam connection active' : 'Waiting for connection');
  $('retry-now').disabled = !api || busy || state.status !== 'offline';
  $('hide').disabled = !api || !desktop.trayAvailable;
  $('quit').disabled = !api || busy;
  $('update-message').textContent = t(state.updates?.message || 'Updates are available in the desktop application.', state.updates?.params);
  $('check-updates').disabled = !api || busy || !state.updates || ['development', 'checking', 'downloading', 'ready'].includes(state.updates.status);
  for (const code of i18n.languages) $('language-' + code).disabled = !api || busy;
  $('close-to-tray').disabled = !api || busy || !desktop.trayAvailable;
  $('auto-reconnect').disabled = !api || busy;
  $('start-at-login').disabled = !api || busy || !desktop.startupAvailable;
  $('auto-start-on-login').disabled = !api || busy;
  $('login-form').hidden = connected || state.status === 'guard'; $('account-ready').hidden = !connected;
  $('account-detail').textContent = t(state.saved ? 'Session remembered for this Windows account.' : 'Session kept only while the app is open.');
  $('desktop-note').textContent = t(!api ? 'Preview only. Open the desktop application to use these settings.'
    : !desktop.trayAvailable ? 'System tray unavailable. Closing the window quits the app.'
    : desktop.startAtLogin ? desktop.autoStartOnLogin
      ? !desktop.selectedGames?.length ? 'Select games to start automatically.'
        : !state.saved ? 'Sign in and enable Remember this session for automatic startup.'
          : 'Selected games start automatically when you sign in to Windows.'
      : 'The app opens in the tray on Windows login. Start games manually.'
    : 'Windows startup is off.');
  $('badge').textContent = '● ' + t(statusLabels[state.status] || 'Disconnected'); $('badge').classList.toggle('online', connected);
  for (const id of ['username', 'password', 'login', 'remember']) $(id).disabled = !api || busy || state.status !== 'offline';
  $('forget').disabled = !api || busy || !state.saved;
  $('refresh-playtime').disabled = !api || busy || !connected || state.playtime?.status === 'loading';
  const playtime = state.playtime;
  for (const [name, id] of [['squad', 393380], ['cs2', 730]]) {
    $(name + '-total').textContent = playtime?.checkedAt != null ? duration(playtime.totals?.[id]) : '—';
    const delta = playtime?.delta?.[id]; $(name + '-delta').textContent = Number.isSafeInteger(delta) ? t('+{minutes} min', { minutes: delta }) : '—';
  }
  $('playtime-note').textContent = t(playtime?.status === 'loading' ? 'Reading playtime from Steam…' : playtime?.message || 'Steam playtime has not been read yet.');
  $('playtime-checked').textContent = t('Last reading: {time}', { time: playtime?.checkedAt != null ? new Date(playtime.checkedAt).toLocaleString(i18n.locale(language)) : '—' }) + (connected ? '' : ' · ' + t('Disconnected'));
  if (state.saveMessage) $('save-message').textContent = t(state.saveMessage);
  else $('save-message').textContent = t('Your password is never saved.');
  $('guard-form').hidden = state.status !== 'guard'; $('guard-submit').disabled = busy || Date.now() < state.guardAfter; $('guard-code').disabled = busy;
  $('guard-help').textContent = Date.now() < state.guardAfter ? t('Wait {seconds}s before entering a new code.', { seconds: Math.ceil((state.guardAfter - Date.now()) / 1000) }) : t('Your code is sent only to Steam and is never saved.');
  $('start').disabled = !api || busy || state.status !== 'online' || state.blocked || !chosen().length;
  $('stop').disabled = !api || busy || (state.status !== 'running' && !waiting);
  $('disconnect').disabled = !api || busy || (state.status === 'offline' && !waiting);
  for (const id of ['squad', 'cs2']) $(id).disabled = !api || busy || state.status === 'running';
  $('selected-count').textContent = t(chosen().length === 1 ? '{count} game selected' : '{count} games selected', { count: chosen().length });
  $('choose-fivem').disabled = !api || busy; $('launch-fivem').disabled = !api || busy || !hasFiveM;
  const elapsed = Math.max(0, Math.floor((state.elapsedMs + (state.status === 'running' ? performance.now() - receivedAt : 0)) / 1000));
  $('timer').textContent = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60].map(n => String(n).padStart(2, '0')).join(':');
}
function update(value) {
  const oldStatus = state.status, previousLanguage = language; state = value;
  if (typeof value.remember === 'boolean') $('remember').checked = value.remember;
  if (value.desktop) {
    language = i18n.languages.includes(value.desktop.language) ? value.desktop.language : 'en';
    renderFavorites(value.desktop.favorites); hasFiveM = Boolean(value.desktop.fiveMReady);
    for (const [id, key] of [['close-to-tray', 'closeToTray'], ['auto-reconnect', 'autoReconnect'], ['start-at-login', 'startAtLogin'], ['auto-start-on-login', 'autoStartOnLogin']]) $(id).checked = Boolean(value.desktop[key]);
    if (Array.isArray(value.desktop.selectedGames)) {
      for (const id of ['squad', 'cs2']) $(id).checked = value.desktop.selectedGames.includes(Number($(id).value));
      for (const [id, control] of favoriteControls) control.input.checked = value.desktop.selectedGames.includes(id);
    }
  }
  receivedAt = performance.now(); if (previousLanguage !== language) applyLanguage();
  if (value.message) message(value.message);
  if (state.status === 'offline') { $('password').value = ''; $('guard-code').value = ''; }
  renderSearchResults(); paint(); if (oldStatus !== 'guard' && state.status === 'guard') $('guard-code').focus();
}
async function act(callback) {
  if (busy || !api) return;
  busy = true; paint();
  try { const result = await callback(); if (!result?.ok) message(result?.message || 'Action could not be completed.', true); return result; }
  catch { message('Action could not be completed. Try again.', true); }
  finally { busy = false; renderSearchResults(); paint(); }
}
async function savePreferences(patch) {
  const result = await api.preferences(patch);
  if (!result?.ok) { const snapshot = await api.snapshot(); if (snapshot.state) update(snapshot.state); }
  return result;
}
for (const code of i18n.languages) $('language-' + code).addEventListener('click', () => act(async () => {
  const result = await savePreferences({ language: code });
  if (result.ok) { language = code; applyLanguage(); renderSearchResults(); }
  return result;
}));
$('login-form').addEventListener('submit', event => {
  event.preventDefault(); if (!api || busy) return;
  const payload = { accountName: $('username').value, password: $('password').value, remember: $('remember').checked };
  const request = api.login(payload); payload.password = ''; $('password').value = ''; act(() => request);
});
$('guard-form').addEventListener('submit', event => { event.preventDefault(); if (!api || busy) return; const request = api.guard($('guard-code').value); $('guard-code').value = ''; act(() => request); });
$('start').addEventListener('click', () => act(() => api.start(chosen())));
for (const [id, method] of [['stop', 'stop'], ['disconnect', 'disconnect'], ['forget', 'forget'], ['refresh-playtime', 'refreshPlaytime'], ['hide', 'hide'], ['quit', 'quit'], ['check-updates', 'checkUpdates'], ['retry-now', 'retryNow']]) $(id).addEventListener('click', () => act(() => api[method]()));
for (const id of ['squad', 'cs2']) $(id).addEventListener('change', () => { paint(); if (api) act(() => savePreferences({ selectedGames: chosen() })); });
for (const [id, key] of [['close-to-tray', 'closeToTray'], ['auto-reconnect', 'autoReconnect'], ['start-at-login', 'startAtLogin'], ['auto-start-on-login', 'autoStartOnLogin']]) $(id).addEventListener('change', () => act(() => savePreferences({ [key]: $(id).checked })));
async function searchGames() {
  if (!api) return;
  const term = $('game-search').value.trim(), serial = ++searchSerial; searchResults = []; renderSearchResults();
  if (term.length < 2) { searchNote = 'Enter at least two characters to search.'; paint(); return; }
  searchNote = 'Searching the Steam Store…'; paint();
  try {
    const result = await api.searchGames(term); if (serial !== searchSerial) return;
    if (!result.ok) { searchNote = result.message; paint(); return; }
    searchResults = result.games; searchNote = result.games.length ? 'Choose a game to add to your favorites.' : 'No games found. Try a different name.';
    renderSearchResults(); paint();
  } catch { if (serial === searchSerial) { searchNote = 'Search could not be completed. Try again.'; paint(); } }
}
$('game-search-form').addEventListener('submit', event => { event.preventDefault(); clearTimeout(searchTimer); void searchGames(); });
$('game-search').addEventListener('input', () => { ++searchSerial; clearTimeout(searchTimer); searchTimer = setTimeout(() => { void searchGames(); }, 850); });
$('choose-fivem').addEventListener('click', () => act(async () => { const result = await api.chooseFiveM(); if (result?.selected) { hasFiveM = true; message('FiveM shortcut saved.'); } return result; }));
$('launch-fivem').addEventListener('click', () => act(async () => { const result = await api.launchFiveM(); if (result?.ok) message('FiveM launch requested. This does not add Steam playtime.'); return result; }));
if (api) { api.onState(update); api.snapshot().then(result => { if (result?.state) update(result.state); }).catch(() => message('Status could not be read.', true)); }
else message('Preview only. Open SteamHours.exe to connect to Steam.');
applyLanguage(); setInterval(paint, 250); paint();
