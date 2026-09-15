'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  DELEGATION_REASON,
  alpha27OwnsMerchant,
  installAlpha27MerchantLegacyOwnershipGuard
} = require('../src/reliability/alpha27-merchant-legacy-ownership-guard');

function merchantRuntime() {
  const counters = { v2Cycles: 0, legacyCycles: 0, moves: 0, serviceMoves: 0 };
  const legacy = {
    lastDecision: null,
    async cycle() { counters.legacyCycles += 1; return true; },
    _move() { counters.moves += 1; return true; },
    _serviceMove() { counters.serviceMoves += 1; return true; }
  };
  const v2 = {
    lastDecision: null,
    async cycle() { counters.v2Cycles += 1; return true; }
  };
  return {
    runtime: {
      now: () => 12345,
      root: { character: { name: 'My_Merchant', ctype: 'merchant' } },
      merchantEconomyAutonomy: legacy,
      economyEquipmentAutonomyV2: v2
    },
    legacy,
    v2,
    counters
  };
}

test('legacy merchant execution remains live when Alpha27 is absent', async () => {
  const { runtime, legacy, v2, counters } = merchantRuntime();
  const state = installAlpha27MerchantLegacyOwnershipGuard(runtime);
  assert.equal(alpha27OwnsMerchant(runtime), false);
  assert.equal(state.status().ownershipActive, false);
  assert.equal(await v2.cycle(), true);
  assert.equal(await legacy.cycle(), true);
  assert.equal(legacy._move({}, 'TEST'), true);
  assert.equal(legacy._serviceMove('main', 'TEST'), true);
  assert.deepEqual(counters, { v2Cycles: 1, legacyCycles: 1, moves: 1, serviceMoves: 1 });
});

test('Alpha27 becomes the single live Merchant owner and suppresses legacy cycles and movement', async () => {
  const { runtime, legacy, v2, counters } = merchantRuntime();
  installAlpha27MerchantLegacyOwnershipGuard(runtime);
  runtime.alpha27CombatMerchantConvergence = { merchant: {} };

  assert.equal(alpha27OwnsMerchant(runtime), true);
  assert.equal(await v2.cycle(), false);
  assert.equal(await legacy.cycle(), false);
  assert.equal(legacy._move({ map: 'main', x: 100, y: 100 }, 'POTIONS_CRITICAL'), false);
  assert.equal(legacy._serviceMove('bank', 'HOME_SERVICE_BANK'), false);
  assert.deepEqual(counters, { v2Cycles: 0, legacyCycles: 0, moves: 0, serviceMoves: 0 });
  assert.equal(v2.lastDecision.reason, DELEGATION_REASON);
  assert.equal(legacy.lastDecision.reason, DELEGATION_REASON);
  assert.equal(legacy.lastDecision.owner, 'alpha27');
});

test('production live services install the ownership guard after Alpha27 and before the same-version early return', () => {
  const root = path.resolve(__dirname, '..');
  const source = fs.readFileSync(path.resolve(root, 'src/production-live-services.js'), 'utf8');
  assert.match(source, /installAlpha27MerchantLegacyOwnershipGuard/);
  assert.match(source, /const alpha27 = installAlpha27CombatMerchantConvergence[\s\S]*const ownershipGuard = installAlpha27MerchantLegacyOwnershipGuard[\s\S]*if \(runtime\.productionLiveServices/);
  assert.match(source, /merchantSingleOwnerGuardInstalled/);
  assert.match(source, /merchantOwnership:/);
});
