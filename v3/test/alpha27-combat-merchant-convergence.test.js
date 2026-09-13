'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha27CombatMerchantConvergence, farmerOwnedCombatBusy, isPoisonedPerformanceProfile } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeEngine, makeControlledMerchant, makeLedger, makeRuntime } = require('./alpha27-convergence-test-helpers');

test('raw Adventure Land target alone does not block cohesion recovery', () => {
  const runtime = { farmer: { state: 'TRAVEL', targetId: null }, pendingEmergencyRetreat: false };
  const snapshot = { character: { name: 'Farmer', target: 'raw-stale', hp: 100, max_hp: 100 }, entities: [] };
  assert.equal(farmerOwnedCombatBusy(runtime, snapshot), false);
});

test('self aggro and Farmer-owned ENGAGE still block recovery', () => {
  const snapshot = { character: { name: 'Farmer', hp: 100, max_hp: 100 }, entities: [{ id: 'm1', mtype: 'goo', hp: 10, target: 'Farmer' }] };
  assert.equal(farmerOwnedCombatBusy({ farmer: { state: 'TRAVEL', targetId: null } }, snapshot), true);
  assert.equal(farmerOwnedCombatBusy({ farmer: { state: 'ENGAGE', targetId: 'm2' } }, { ...snapshot, entities: [] }), true);
});

test('poisoned kill profile is detected only when normal-XP monster has kills without XP', () => {
  assert.equal(isPoisonedPerformanceProfile({ windows: 2, kills: 3, xp: 0 }, { xp: 50 }), true);
  assert.equal(isPoisonedPerformanceProfile({ windows: 2, kills: 3, xp: 150 }, { xp: 50 }), false);
  assert.equal(isPoisonedPerformanceProfile({ windows: 2, kills: 3, xp: 0 }, { xp: 0 }), false);
});

test('performance ignores unrelated raw target damage and counts owned disappearance only with XP', () => {
  const perf = {
    observe() {},
    window: { samples: 0, lastObservedAt: 0, xp: 0, gold: 0, deaths: 0, damageTaken: 0, potions: 0, monsterHpLost: 0, damageEventsByMonster: {}, kills: 0, killsByMonster: {}, targetSamples: {} },
    _increment(obj, key, amount = 1) { obj[key] = (obj[key] || 0) + amount; }
  };
  const runtime = makeRuntime({ performance: perf });
  new Alpha27CombatMerchantConvergence(runtime, { verifyDelayMs: 25, verifyAttempts: 1 });
  const previous = { character: { name: 'Farmer', xp: 100, level: 1, hp: 100, gold: 0, inventory: [], __farmerOwnedTargetId: 'owned' }, entities: [
    { id: 'owned', mtype: 'goo', hp: 100 }, { id: 'raw', mtype: 'bee', hp: 100 }
  ] };
  const unrelated = { character: { name: 'Farmer', xp: 100, level: 1, hp: 100, gold: 0, inventory: [], __farmerOwnedTargetId: 'owned' }, entities: [
    { id: 'owned', mtype: 'goo', hp: 100 }, { id: 'raw', mtype: 'bee', hp: 0, dead: true }
  ] };
  perf._observeTransition(previous, unrelated, { gameData: { levels: [] } });
  assert.equal(perf.window.kills, 0);
  assert.equal(perf.window.monsterHpLost, 0);
  const ownedGone = { character: { name: 'Farmer', xp: 110, level: 1, hp: 100, gold: 0, inventory: [], __farmerOwnedTargetId: 'owned' }, entities: [] };
  perf._observeTransition(previous, ownedGone, { gameData: { levels: [] } });
  assert.equal(perf.window.kills, 1);
  assert.equal(perf.window.killsByMonster.goo, 1);
});

test('follower team target uses trusted Farmer-owned leader target instead of raw leader target', () => {
  const team = { _team: () => ({ leaderName: 'Leader', selfName: 'Follower', leaderTargetId: 'raw-target' }) };
  const runtime = makeRuntime({ team });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  convergence.remoteLeaderTarget = { leaderName: 'Leader', targetId: 'owned-target', expiresAt: 5000 };
  convergence._patchTeamTargetAuthority();
  const state = team._team({ character: { name: 'Follower' } });
  assert.equal(state.leaderTargetId, 'owned-target');
  assert.equal(state.leaderTargetAuthority, 'TRUSTED_DIRECT_FARMER_OWNER');
});

test('central ledger auto-sells only known low-risk level-zero surplus and banks progression/value risk', () => {
  const ledger = makeLedger([]);
  const runtime = makeRuntime({ ledger, gameData: { items: {}, monsters: {}, maps: {} } });
  new Alpha27CombatMerchantConvergence(runtime, { keepValue: 1000 });
  assert.equal(ledger._baseDisposition({ name: 'material', level: 0 }, { g: 10 }, {}).disposition, 'SELL');
  assert.equal(ledger._baseDisposition({ name: 'sword', level: 0 }, { g: 10, upgrade: true }, {}).disposition, 'BANK');
  assert.equal(ledger._baseDisposition({ name: 'rare', level: 0 }, { g: 20000 }, {}).disposition, 'BANK');
  assert.equal(ledger._baseDisposition({ name: 'scroll0', level: 0 }, { g: 100 }, {}).disposition, 'KEEP');
  assert.equal(ledger._baseDisposition({ name: 'unknown', level: 0 }, null, {}).disposition, 'UNDECIDED');
});

test('atomic compound reserves and releases all three inputs together', () => {
  const entries = [0, 1, 2].map((index) => ({ character: 'Merchant', index, name: 'ring', level: 0, disposition: 'RESERVE_COMPOUND' }));
  const ledger = makeLedger(entries);
  const engine = makeEngine();
  const runtime = makeRuntime({ ledger, engine });
  new Alpha27CombatMerchantConvergence(runtime);
  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  assert.equal(planned.accepted, true);
  assert.equal(planned.transaction.reservationKeys.length, 3);
  assert.equal(engine.reservations.size, 3);
  const row = engine.transactions.get(planned.transaction.id);
  engine._release(row);
  assert.equal(engine.reservations.size, 0);
});

function mutationFixture(type, { missingScroll = false, failedRoll = false } = {}) {
  const engine = makeEngine();
  const controlledMerchant = makeControlledMerchant();
  const root = { character: { name: 'Merchant', ctype: 'merchant', gold: 2000000, target: null, items: [], isize: 42 }, parent: { entities: {} } };
  let entries;
  let gameData;
  let gearGoals = [];
  if (type === 'UPGRADE') {
    root.character.items[0] = { name: 'sword', level: 0 };
    if (!missingScroll) root.character.items[1] = { name: 'scroll0', level: 0, q: 1 };
    entries = [{ character: 'Merchant', index: 0, name: 'sword', level: 0, disposition: 'RESERVE_UPGRADE' }];
    gameData = { items: { sword: { upgrade: true, g: 1000, grades: [] }, scroll0: { g: 100 } }, monsters: {}, maps: {} };
    gearGoals = [{ id: 'goal-1', sourceCharacter: 'Merchant', character: 'Farmer', item: 'sword', observedLevel: 0, targetLevel: 1, projectedUpgradeRequired: true }];
    root.upgrade = async () => {
      root.character.items[1] = null;
      if (!failedRoll) root.character.items[0] = { name: 'sword', level: 1 };
      return { success: true };
    };
    root.can_buy = () => true;
    root.buy = async (name, q) => { root.character.gold -= 100 * q; root.character.items[1] = { name, level: 0, q }; return { success: true }; };
  } else {
    for (let i = 0; i < 3; i += 1) root.character.items[i] = { name: 'ring', level: 0 };
    root.character.items[3] = { name: 'cscroll0', level: 0, q: 1 };
    entries = [0, 1, 2].map((index) => ({ character: 'Merchant', index, name: 'ring', level: 0, disposition: 'RESERVE_COMPOUND' }));
    gameData = { items: { ring: { compound: true, g: 1000, grades: [] }, cscroll0: { g: 100 } }, monsters: {}, maps: {} };
    root.compound = async () => {
      root.character.items[0] = failedRoll ? null : { name: 'ring', level: 1 };
      root.character.items[1] = null; root.character.items[2] = null; root.character.items[3] = null;
      return { success: true };
    };
  }
  const ledger = makeLedger(entries);
  const runtime = makeRuntime({ root, ledger, engine, controlledMerchant, gameData, gearGoals });
  const convergence = new Alpha27CombatMerchantConvergence(runtime, { verifyAttempts: 1, verifyDelayMs: 25, goldReserve: 1000000 });
  controlledMerchant.configure({ enabled: true, ack: 'CONTROLLED_CANARY', sell: true, bank: true, upgrade: true, compound: true });
  return { runtime, convergence, engine, ledger, root };
}

