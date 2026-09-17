'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  refreshAdventureLandSpriteHook,
  SPRITE_HOT_RELOAD_HOOK_VERSION
} = require('../src/production-live-services');

const root = path.resolve(__dirname, '..');
function read(rel) { return fs.readFileSync(path.resolve(root, rel), 'utf8'); }

test('production entry installs cloud heartbeat and safe updater services', () => {
  const source = read('src/index-production.js');
  assert.match(source, /require\('\.\/production-live-services'\)/);
  assert.match(source, /installProductionLiveServices\(api, options\)/);
});

test('production live services wire Alpha25 cloud control, Alpha26 updater, and Alpha27\/28 merchant authority', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /installAlpha25ControlCenterBrain/);
  assert.match(source, /installAlpha26CloudUpdateLogisticsUiHotfix/);
  assert.match(source, /installAlpha27CombatMerchantConvergence/);
  assert.match(source, /runtime\.alpha25ControlCenterBrain/);
  assert.match(source, /runtime\.alpha26CloudUpdateLogisticsUiHotfix/);
  assert.match(source, /runtime\.alpha27CombatMerchantConvergence/);
  assert.match(source, /runtime\.alpha28LiveAuthorityLiveness/);
  assert.match(source, /alpha27ConvergenceInstalled/);
  assert.match(source, /alpha28LiveAuthorityInstalled/);
  assert.match(source, /const alpha27 = installAlpha27CombatMerchantConvergence[\s\S]*if \(runtime\.productionLiveServices/);
  assert.match(source, /cloudControlPlaneInstalled/);
  assert.match(source, /safeAutoUpdaterInstalled/);
});

test('same-version hot reload replaces an already-installed stale sprite snapshot hook exactly once', () => {
  const runtime = {
    lastSnapshot: { character: { name: 'R1', isize: 42 } },
    adapter: {
      getGameData: () => ({
        items: { hpot0: { skin: 'hpot_skin' } },
        positions: {
          hpot_skin: ['pack_20', 1, 2],
          shade_helmet: ['pack_20', 2, 1]
        },
        imagesets: { pack_20: { file: '/images/tiles/items.png', size: 20, columns: 16, rows: 8 } }
      })
    },
    characterRegistry: {
      status: () => ({ characters: [{ name: 'R1', inventory: [{ index: 0, name: 'hpot0', q: 5 }], gear: {} }] })
    }
  };
  const cloud = {
    __adventureLandItemSpritesInstalled: true,
    _runtimeSnapshot() {
      return { character: { name: 'R1' }, itemSprites: {}, equipmentShades: {} };
    }
  };
  runtime.cloudControlPlane = cloud;

  assert.equal(refreshAdventureLandSpriteHook(runtime, { cloud }), true);
  assert.equal(cloud.__adventureLandSpriteHotReloadHookVersion, SPRITE_HOT_RELOAD_HOOK_VERSION);
  const snapshot = cloud._runtimeSnapshot();
  assert.equal(snapshot.itemSprites.hpot0.file, 'https://adventure.land/images/tiles/items.png');
  assert.equal(snapshot.equipmentShades.helmet.skin, 'shade_helmet');
  assert.equal(snapshot.character.isize, 42);
  assert.equal(refreshAdventureLandSpriteHook(runtime, { cloud }), false);
});

test('merchant production and Alpha27 autonomy mutually observe busy ownership', () => {
  const production = read('src/merchant/merchant-production-controller.js');
  const autonomy = read('src/reliability/alpha27-merchant-autonomy.js');
  assert.match(production, /runtime\.alpha27CombatMerchantConvergence/);
  assert.match(production, /atomic\.merchantBusy \|\| atomic\.serviceTravelBusy/);
  assert.match(production, /alpha27Busy\(\)/);
  assert.match(autonomy, /runtime\.merchantProductionStatus/);
  assert.match(autonomy, /productionStatus\.executionPending/);
  assert.match(autonomy, /MERCHANT_PRODUCTION_BUSY/);
});

test('production entry replaces an older in-memory AIO runtime before reinstalling', () => {
  const source = read('src/index-production.js');
  assert.match(source, /existing\.version/);
  assert.match(source, /base\.VERSION/);
  assert.match(source, /existing\.stop/);
  assert.match(source, /delete root\.AIO_V3/);
  assert.match(source, /replaceOlderRuntime\(root\)/);
});

test('live diagnostics expose cloud, updater, convergence, and live-authority state', () => {
  const source = read('src/production-live-services.js');
  assert.match(source, /api\.cloud\s*=/);
  assert.match(source, /api\.autoUpdate\s*=/);
  assert.match(source, /api\.liveServices\s*=/);
  assert.match(source, /convergence:/);
  assert.match(source, /liveAuthority:/);
});