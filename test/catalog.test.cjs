'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Catalog } = require('../src/catalog.cjs');
const { clean } = require('../src/preferences.cjs');
test('search encodes terms and returns only bounded ID/name metadata', async () => {
  let url;
  const catalog = new Catalog(async value => { url = value; return { items: [{ id: 440, name: '<img src=x>', token: 'never-copy' }, { id: -1, name: 'bad' }] }; });
  const games = await catalog.search('Team & Fortress');
  assert.equal(url.hostname, 'store.steampowered.com'); assert.equal(url.searchParams.get('term'), 'Team & Fortress');
  assert.deepEqual(games, [{ id: 440, name: '<img src=x>' }]);
  await assert.rejects(catalog.search('again'));
});
test('favorite addition requires search result and verified Steam game type', async () => {
  let type = 'dlc';
  const catalog = new Catalog(async url => url.pathname.includes('storesearch') ? { items: [{ id: 440, name: 'Team Fortress' }] }
    : { 440: { success: true, data: { type, name: 'Team Fortress 2' } } });
  await assert.rejects(catalog.game(440)); await catalog.search('Team');
  await assert.rejects(catalog.game(440)); type = 'game';
  assert.deepEqual(await catalog.game(440), { id: 440, name: 'Team Fortress 2' });
});
test('favorites survive preferences cleanup; selections must belong to a favorite', () => {
  const prefs = clean({ favorites: [{ id: 440, name: 'Team Fortress 2', password: 'never-save' }, { id: -2, name: 'invalid' }], selectedGames: [440, 440, 271590] });
  assert.deepEqual(prefs.selectedGames, [440]); assert.equal(prefs.favorites.length, 3);
  assert.equal(JSON.stringify(prefs).includes('never-save'), false);
});
