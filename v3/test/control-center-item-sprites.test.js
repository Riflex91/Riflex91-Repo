'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  adventureLandAssetUrl,
  itemSpriteCatalog,
  installAdventureLandItemSprites
} = require('../src/reliability/alpha25-control-center-brain');

test('Adventure Land asset URLs stay absolute and normalize relative sprite sheets', () => {
  assert.equal(adventureLandAssetUrl('/images/tiles/items.png'), 'https://adventure.land/images/tiles/items.png');
  assert.equal(adventureLandAssetUrl('images/tiles/items.png'), 'https://adventure.land/images/tiles/items.png');
  assert.equal(adventureLandAssetUrl('https://cdn.example/items.png'), 'https://cdn.example/items.png');
});

test('item sprite catalog exposes only inventory and equipped Adventure Land sprites', () => {
  const runtime = {
    adapter: {
      getGameData() {
        return {
          items: {
            sword: { skin: 'sword_skin' },
            hpot0: { skin: 'hpot_skin' },
            unused: { skin: 'unused_skin' }
          },
          positions: {
            sword_skin: ['pack_20', 2, 3],
            hpot_skin: ['pack_20', 4, 5],
            unused_skin: ['pack_20', 6, 7]
          },
          imagesets: {
            pack_20: { file: '/images/tiles/items.png', size: 20, columns: 10, rows: 8 }
          }
        };
      }
    },
    characterRegistry: {
      status() {
        return {
          characters: [{
            inventory: [{ index: 0, name: 'hpot0', q: 5 }],
            gear: { mainhand: { name: 'sword', level: 4 } }
          }]
        };
      }
    }
  };

  const catalog = itemSpriteCatalog(runtime);
  assert.deepEqual(catalog.sword, {
    skin: 'sword_skin',
    file: 'https://adventure.land/images/tiles/items.png',
    x: 2,
    y: 3,
    size: 20,
    columns: 10,
    rows: 8
  });
  assert.equal(catalog.hpot0.x, 4);
  assert.equal(catalog.unused, undefined);
});

test('runtime snapshot wrapper adds sprite metadata and preserves exact inventory size', () => {
  const runtime = {
    lastSnapshot: { character: { name: 'R1', isize: 49 } },
    adapter: { getGameData: () => ({ items: {}, positions: {}, imagesets: {} }) },
    characterRegistry: { status: () => ({ characters: [] }) }
  };
  const cloud = {
    _runtimeSnapshot() {
      return { character: { name: 'R1' } };
    }
  };

  assert.equal(installAdventureLandItemSprites(runtime, cloud), true);
  const snapshot = cloud._runtimeSnapshot();
  assert.deepEqual(snapshot.itemSprites, {});
  assert.equal(snapshot.character.isize, 49);
  assert.equal(installAdventureLandItemSprites(runtime, cloud), false);
});
