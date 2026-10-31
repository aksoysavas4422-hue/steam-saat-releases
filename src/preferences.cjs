'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
function defaults() { return { closeToTray: true, autoReconnect: true, autoStartOnLogin: true, selectedGames: [], fiveMPath: null }; }
function clean(value) {
  const result = defaults();
  for (const key of ['closeToTray', 'autoReconnect', 'autoStartOnLogin']) if (typeof value?.[key] === 'boolean') result[key] = value[key];
  if (Array.isArray(value?.selectedGames)) result.selectedGames = [...new Set(value.selectedGames.filter(id => [393380, 730].includes(id)))];
  if (typeof value?.fiveMPath === 'string' && value.fiveMPath.length <= 2048 && path.isAbsolute(value.fiveMPath) && path.basename(value.fiveMPath).toLowerCase() === 'fivem.exe') result.fiveMPath = value.fiveMPath;
  return result;
}
class Preferences {
  constructor(file) { this.file = file; this.queue = Promise.resolve(); }
  async load() {
    try {
      if ((await fs.stat(this.file)).size > 16384) return defaults();
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
