'use strict';
// Public Steam Store only. No account access, login or credentials.
const { Catalog } = require('../src/catalog.cjs');
(async () => {
  const catalog = new Catalog();
  const games = await catalog.search('Counter-Strike');
  if (!games.some(game => game.id === 730)) throw Error('CS2 search result unavailable');
  const game = await catalog.game(730);
  if (game.id !== 730) throw Error('Steam game verification failed');
  process.stdout.write('Steam public search and game verification passed. No account login.\n');
})().catch(() => { process.stderr.write('Steam Store search smoke check failed.\n'); process.exitCode = 1; });
