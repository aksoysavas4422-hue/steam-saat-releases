'use strict';
// UI verification only. Never imports Steam, disk credentials or the application main.
const { contextBridge } = require('electron');
let listener, language = 'en';
const state = () => ({ status: 'offline', games: [], elapsedMs: 0, saved: false, guardAfter: 0,
  message: 'Disconnected. Sign in to Steam.', desktop: { language, selectedGames: [], favorites: [], trayAvailable: true, startupAvailable: true },
  updates: { status: 'current', message: 'You are up to date.' } });
contextBridge.exposeInMainWorld('steamSaat', {
  onState(callback) { listener = callback; }, snapshot: async () => ({ ok: true, state: state() }),
  async preferences(patch) { if (['en','tr','ru','zh'].includes(patch.language)) language = patch.language; listener?.(state()); return { ok: true }; }
});
