'use strict';
const https = require('node:https');
function appId(id) { return Number.isSafeInteger(id) && id > 0 && id <= 2147483647; }
const initialFavorites = () => [{ id: 393380, name: 'Squad' }, { id: 730, name: 'Counter-Strike 2' }];
const storeLanguage = language => ({ en: 'english', tr: 'turkish', ru: 'russian', zh: 'schinese' })[language] || 'english';
function request(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'SteamHours/0.7.0', Accept: 'application/json' } }, res => {
      if (res.statusCode !== 200) { res.resume(); reject(Error('Store unavailable')); return; }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > 1048576) res.destroy(Error('Response limit')); else chunks.push(chunk); });
      res.on('error', reject);
      res.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(Error('Invalid response')); } });
    });
    req.setTimeout(10000, () => req.destroy(Error('Timeout'))); req.on('error', reject);
  });
}
class Catalog {
  constructor(get = request, now = Date.now) { this.get = get; this.now = now; this.last = -Infinity; this.found = new Map(); }
  async search(term, language = 'en') {
    if (typeof term !== 'string' || term.trim().length < 2 || term.length > 80) throw Error('Invalid search');
    if (this.now() - this.last < 800) throw Error('Search rate limit');
    this.last = this.now();
    const url = new URL('https://store.steampowered.com/api/storesearch/');
    url.search = new URLSearchParams({ term: term.trim(), l: storeLanguage(language), cc: 'TR' }).toString();
    const data = await this.get(url);
    if (!Array.isArray(data?.items)) throw Error('Invalid catalog');
    const games = data.items.filter(item => appId(item.id) && typeof item.name === 'string').slice(0, 20)
      .map(item => ({ id: item.id, name: item.name.slice(0, 160) }));
    this.found = new Map(games.map(game => [game.id, game])); return games;
  }
  async game(id, language = 'en') {
    if (!appId(id) || !this.found.has(id)) throw Error('Search first');
    const url = new URL('https://store.steampowered.com/api/appdetails');
    url.search = new URLSearchParams({ appids: String(id), l: storeLanguage(language) }).toString();
    const data = (await this.get(url))?.[id];
    if (!data?.success || data.data?.type !== 'game' || typeof data.data.name !== 'string') throw Error('Not a game');
    return { id, name: data.data.name.slice(0, 160) };
  }
}
module.exports = { Catalog, appId, initialFavorites };
