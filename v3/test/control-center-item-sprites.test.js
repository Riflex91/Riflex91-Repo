'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  adventureLandAssetUrl,
  itemSpriteCatalog,
  equipmentShadeCatalog,
  installAdventureLandItemSprites,
  installAlpha25ControlCenterBrain
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
            // Adventure Land imagesets commonly omit `rows`; the runtime must infer it.
            pack_20: { file: '/images/tiles/items.png', size: 20, columns: 10 }
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
  assert.equal(catalog.hpot0.rows, 8);
  assert.equal(catalog.unused, undefined);
});

test('equipment shade catalog mirrors Adventure Land empty slot artwork without explicit rows metadata', () => {
  const runtime = {
    adapter: {
      getGameData() {
        return {
          positions: {
            shade_helmet: ['pack_20', 1, 1],
            shade_mainhand: ['pack_20', 2, 1],
            shade_ring: ['pack_20', 3, 1]
          },
          imagesets: {
            pack_20: { file: '/images/tiles/items.png', size: 20, columns: 10 }
          }
        };
      }
    }
  };
  const shades = equipmentShadeCatalog(runtime);
  assert.equal(shades.helmet.skin, 'shade_helmet');
  assert.equal(shades.helmet.rows, 2);
  assert.equal(shades.mainhand.x, 2);
  assert.equal(shades.ring1.skin, 'shade_ring');
  assert.equal(shades.ring2.skin, 'shade_ring');
});

test('runtime snapshot wrapper adds sprites, equipment shades and exact inventory size', () => {
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
  assert.deepEqual(snapshot.equipmentShades, {});
  assert.equal(snapshot.character.isize, 49);
  assert.equal(installAdventureLandItemSprites(runtime, cloud), false);
});

test('existing Alpha25 runtime repairs the sprite hook during same-version hot reload', () => {
  const existing = { mode: 'already-running' };
  const runtime = {
    alpha25ControlCenterBrain: existing,
    lastSnapshot: { character: { name: 'R1', isize: 42 } },
    adapter: {
      getGameData: () => ({
        items: { hpot0: { skin: 'hpot_skin' } },
        positions: {
          hpot_skin: ['pack_20', 1, 2],
          shade_helmet: ['pack_20', 2, 1]
        },
        imagesets: { pack_20: { file: '/images/tiles/items.png', size: 20, columns: 16 } }
      })
    },
    characterRegistry: {
      status: () => ({ characters: [{ name: 'R1', inventory: [{ index: 0, name: 'hpot0', q: 5 }], gear: {} }] })
    }
  };
  const cloud = {
    _runtimeSnapshot() {
      return { character: { name: 'R1' } };
    }
  };
  runtime.cloudControlPlane = cloud;

  assert.equal(installAlpha25ControlCenterBrain(runtime), existing);
  assert.equal(cloud.__adventureLandItemSpritesInstalled, true);
  const snapshot = cloud._runtimeSnapshot();
  assert.equal(snapshot.itemSprites.hpot0.file, 'https://adventure.land/images/tiles/items.png');
  assert.equal(snapshot.equipmentShades.helmet.skin, 'shade_helmet');
  assert.equal(snapshot.character.isize, 42);
});
