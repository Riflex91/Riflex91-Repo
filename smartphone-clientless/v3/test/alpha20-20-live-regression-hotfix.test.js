'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  installStaleEncounterCleanup,
  installMerchantGearDeliveryGuard
} = require('../src/reliability/alpha20-20-live-regression-hotfix');

test('stale encounter is cleared before a cohesion wrapper can hold ENGAGE', () => {
  let wrappedEngageCalls = 0;
  const farmer = {
    targetId: 'dead-1',
    targetType: 'squigtoad',
    state: 'ENGAGE',
    _engage: () => { wrappedEngageCalls += 1; },
    _travel: () => {},
    _clearTarget(reason) {
      this.clearReason = reason;
      this.targetId = null;
      this.targetType = null;
    },
    _transition(state, reason) {
      this.state = state;
      this.stateReason = reason;
    }
  };
  const stats = { staleEncounterClears: 0 };
  assert.equal(installStaleEncounterCleanup({ farmer }, stats), true);
  farmer._engage({ snapshot: { character: { name: 'My_Ranger1' }, entities: [] } }, null);
  assert.equal(wrappedEngageCalls, 0);
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.targetType, null);
  assert.equal(farmer.state, 'REASSESS');
  assert.equal(farmer.stateReason, 'TARGET_DEAD_OR_GONE_PRE_COHESION_GATE');
  assert.equal(farmer.clearReason, 'TARGET_DEAD_OR_GONE_PRE_COHESION_GATE');
  assert.equal(stats.staleEncounterClears, 1);
});

test('live target still passes through the existing cohesion/combat wrapper', () => {
  let wrappedEngageCalls = 0;
  const farmer = {
    targetId: 'live-1',
    targetType: 'squigtoad',
    state: 'ENGAGE',
    _engage: (_context, target) => { wrappedEngageCalls += 1; assert.equal(target.id, 'live-1'); },
    _travel: () => {},
    _clearTarget: () => { throw new Error('must not clear live target'); },
    _transition: () => { throw new Error('must not transition live target'); }
  };
  const stats = { staleEncounterClears: 0 };
  installStaleEncounterCleanup({ farmer }, stats);
  farmer._engage({}, { id: 'live-1', hp: 100, max_hp: 100 });
  assert.equal(wrappedEngageCalls, 1);
  assert.equal(stats.staleEncounterClears, 0);
});

test('merchant gear guard rejects stale goals and delivers identical fresh goal only once', async () => {
  let now = 100000;
  let baseCalls = 0;
  const economy = {
    now: () => now,
    stats: { gearTransfers: 0 },
    lastAction: null,
    async _gearTransfer(reservations) {
      baseCalls += 1;
      const goal = reservations.goals[0];
      if (!goal) return false;
      this.stats.gearTransfers += 1;
      this.lastAction = { kind: 'GEAR_TRANSFER', target: goal.character, item: goal.item, level: goal.observedLevel };
      return true;
    }
  };
  const runtime = { merchantEconomyAutonomy: economy, now: () => now };
  const stats = { staleGearGoalBlocks: 0, duplicateGearDeliveryBlocks: 0, guardedGearDeliveries: 0 };
  assert.equal(installMerchantGearDeliveryGuard(runtime, stats, { maxGearEvidenceAgeMs: 30000 }), true);

  const stale = {
    id: 'My_Ranger1:amulet:hpamulet:0',
    character: 'My_Ranger1',
    slot: 'amulet',
    sourceCharacter: 'My_Merchant',
    item: 'hpamulet',
    observedLevel: 0,
    targetLevel: 0,
    currentItem: null,
    currentLevel: 0,
    projectedUpgradeRequired: false,
    lastSeenAt: 60000
  };
  assert.equal(await economy._gearTransfer({ goals: [stale], keys: new Set() }), false);
  assert.equal(economy.stats.gearTransfers, 0);
  assert.equal(stats.staleGearGoalBlocks, 1);

  const fresh = { ...stale, lastSeenAt: 95000 };
  assert.equal(await economy._gearTransfer({ goals: [fresh], keys: new Set() }), true);
  assert.equal(economy.stats.gearTransfers, 1);
  assert.equal(stats.guardedGearDeliveries, 1);

  now += 1000;
  assert.equal(await economy._gearTransfer({ goals: [{ ...fresh, lastSeenAt: 100500 }], keys: new Set() }), false);
  assert.equal(economy.stats.gearTransfers, 1);
  assert.equal(stats.duplicateGearDeliveryBlocks, 1);
  assert.equal(baseCalls, 3);
});

test('gear delivery becomes eligible again only when the goal evidence meaningfully changes', async () => {
  let now = 200000;
  const economy = {
    now: () => now,
    stats: { gearTransfers: 0 },
    lastAction: null,
    async _gearTransfer(reservations) {
      const goal = reservations.goals[0];
      if (!goal) return false;
      this.stats.gearTransfers += 1;
      this.lastAction = { kind: 'GEAR_TRANSFER', target: goal.character, item: goal.item, level: goal.observedLevel };
      return true;
    }
  };
  const stats = { staleGearGoalBlocks: 0, duplicateGearDeliveryBlocks: 0, guardedGearDeliveries: 0 };
  installMerchantGearDeliveryGuard({ merchantEconomyAutonomy: economy, now: () => now }, stats);
  const goal = {
    id: 'My_Ranger1:amulet:hpamulet:0',
    character: 'My_Ranger1',
    slot: 'amulet',
    sourceCharacter: 'My_Merchant',
    item: 'hpamulet',
    observedLevel: 0,
    targetLevel: 0,
    currentItem: null,
    currentLevel: 0,
    projectedUpgradeRequired: false,
    lastSeenAt: 199000
  };
  await economy._gearTransfer({ goals: [goal] });
  now += 2000;
  const changed = { ...goal, currentItem: 'oldamulet', lastSeenAt: 201500 };
  await economy._gearTransfer({ goals: [changed] });
  assert.equal(economy.stats.gearTransfers, 2);
  assert.equal(stats.guardedGearDeliveries, 2);
});
