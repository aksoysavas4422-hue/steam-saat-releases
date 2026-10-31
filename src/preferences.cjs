'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { appId, initialFavorites } = require('./catalog.cjs');
function defaults() { return { closeToTray: true, autoReconnect: true, autoStartOnLogin: true, selectedGames: [], favorites: initialFavorites(), fiveMPath: null }; }
function clean(value) {
  const result = defaults();
  for (const key of ['closeToTray', 'autoReconnect', 'autoStartOnLogin']) if (typeof value?.[key] === 'boolean') result[key] = value[key];
  if (Array.isArray(value?.favorites)) for (const game of value.favorites.slice(0, 50)) {
    if (result.favorites.length < 50 && appId(game?.id) && typeof game.name === 'string' && game.name.trim() && !result.favorites.some(item => item.id === game.id)) result.favorites.push({ id: game.id, name: game.name.slice(0, 160) });
  }
  if (Array.isArray(value?.selectedGames)) result.selectedGames = [...new Set(value.selectedGames.filter(id => result.favorites.some(game => game.id === id)))].slice(0, 32);
  if (typeof value?.fiveMPath === 'string' && value.fiveMPath.length <= 2048 && path.isAbsolute(value.fiveMPath) && path.basename(value.fiveMPath).toLowerCase() === 'fivem.exe') result.fiveMPath = value.fiveMPath;
  return result;
}
class Preferences {
  constructor(file) { this.file = file; this.queue = Promise.resolve(); }
  async load() {
    try {
      if ((await fs.stat(this.file)).size > 65536) return defaults();
      return clean(JSON.parse(await fs.readFile(this.file, 'utf8')));
    } catch { return defaults(); }
  }
  save(value) {
    const text = JSON.stringify(clean(value));
    const result = this.queue.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.writeFile(this.file + '.tmp', text, { mode: 0o600 });
      await fs.rename(this.file + '.tmp', this.file);
    });
    this.queue = result.catch(() => {}); return result;
  }
}
module.exports = { Preferences, defaults, clean };
