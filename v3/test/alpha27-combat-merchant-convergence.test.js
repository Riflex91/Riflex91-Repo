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

test('central ledger processes low-risk progression before bank fallback', () => {
  const ledger = makeLedger([]);
  const gameData = {
    items: {
      material: { g: 10 },
      sword: { g: 10, upgrade: { attack: 1 }, grades: [] },
      ring: { g: 10, type: 'ring', compound: { dex: 1 }, grades: [] },
      scroll0: { g: 0 },
      cscroll0: { g: 0 },
      rare: { g: 20000 }
    },
    monsters: {}, maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData });
  new Alpha27CombatMerchantConvergence(runtime, { keepValue: 1000 });
  // Economic processing is allowed only after a fresh gear-value evaluation
  // proves the physical item has no useful party path. Cheap scrolls make the
  // expected-value model prefer progression in this fixture.
  runtime.gearProgression.futureProtectionFor = () => null;
  runtime.gearProgression.futureSellSafetyFor = () => ({ checked: true, protected: false });
  const counts = new Map([['ring:0', 3]]);
  const classify = (name, level = 0) => ledger._baseDisposition({ name, level }, gameData, runtime.contentDrift, counts).disposition;
  assert.equal(classify('material'), 'SELL');
  assert.equal(classify('sword'), 'RESERVE_UPGRADE');
  assert.equal(classify('ring'), 'RESERVE_COMPOUND');
  assert.equal(classify('rare'), 'BANK');
  assert.equal(classify('scroll0'), 'KEEP');
  assert.equal(classify('unknown'), 'UNDECIDED');
});

test('sell permission does not preempt an active gear progression batch', async () => {
  const engine = makeEngine();
  const controlledMerchant = makeControlledMerchant();
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 2000000, target: null, items: [{ name: 'partyhat', level: 0, q: 1 }], isize: 42, map: 'main' },
    parent: { entities: {} }
  };
  const ledger = makeLedger([{
    character: 'Merchant',
    index: 0,
    name: 'partyhat',
    level: 0,
    q: 1,
    disposition: 'RESERVE_UPGRADE',
    reasons: ['FUTURE_FARMER_GEAR_PROGRESSION', 'AUTONOMOUS_UPGRADE_CONTINUATION'],
    operatorPermissions: { sell: true }
  }]);
  const runtime = makeRuntime({
    root,
    ledger,
    engine,
    controlledMerchant,
    gameData: { items: { partyhat: { type: 'helmet', g: 12000, upgrade: { str: 0.2 } } }, monsters: {}, maps: {} }
  });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  const merchant = convergence.merchant;

  merchant.atomic.merchantActive = () => true;
  merchant.atomic.supervisorAllowed = () => true;
  merchant.atomic.merchantInCombat = () => false;
  merchant.atomic.serviceTravelBusy = false;
  merchant.atomic.merchantBusy = false;
  merchant.ensureAutonomousAuthorities = () => true;
  merchant.reconcileRecovering = () => false;
  merchant.criticalPartySupplyPlan = () => null;
  merchant.restockPartyPotions = async () => false;
  merchant._updateCollectionSession = () => ({ active: false, snapshot: { freeSlots: 41, farmers: [], transferable: 0, activeGrants: 0 } });
  merchant.bankRecovery.plan = () => ({ action: 'HOLD', reason: 'NOT_DUE' });

  let progressionCalls = 0;
  merchant.progressOrDeliverFarmerGear = async () => { progressionCalls += 1; return true; };
  let executedRequest = null;
  merchant.executeEconomyRequest = async (request) => {
    executedRequest = request;
    return true;
  };

  const releases = [];
  const baseRelease = merchant._taskRelease.bind(merchant);
  merchant._taskRelease = (key, reason, details) => {
    releases.push({ key, reason });
    return baseRelease(key, reason, details);
  };

  const acquired = merchant._taskAcquire('PROGRESSION_BATCH', 'alpha27:progression-batch', { serviceArea: 'newupgrade' });
  assert.equal(acquired.acquired, true);

  const acted = await merchant.cycle();

  assert.equal(acted, true);
  assert.equal(progressionCalls, 1);
  assert.equal(executedRequest, null);
  assert.equal(releases.some((row) => row.reason === 'OPERATOR_SELL_PREEMPTS_PROGRESSION_BATCH'), false);
});

test('central ledger respects explicit operator denials before autonomous fallbacks', () => {
  const denied = {
    material: { sell: false },
    sword: { upgrade: false },
    ring: { compound: false },
    rare: { bank: false }
  };
  const ledger = makeLedger([], {
    _permission(name, action) {
      const row = denied[name];
      return row && typeof row[action] === 'boolean' ? row[action] : null;
    }
  });
  const gameData = {
    items: {
      material: { g: 10 },
      sword: { g: 10, upgrade: { attack: 1 }, grades: [] },
      ring: { g: 10, type: 'ring', compound: { dex: 1 }, grades: [] },
      rare: { g: 20000 }
    },
    monsters: {}, maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData });
  new Alpha27CombatMerchantConvergence(runtime, { keepValue: 1000 });
  runtime.gearProgression.futureProtectionFor = () => null;
  runtime.gearProgression.futureSellSafetyFor = () => ({ checked: true, protected: false });
  const counts = new Map([['ring:0', 3]]);
  const classify = (name, level = 0) => ledger._baseDisposition({ name, level }, gameData, runtime.contentDrift, counts);

  assert.equal(classify('material').disposition, 'KEEP');
  assert.ok(classify('material').reasons.includes('OPERATOR_SELL_DENIED'));
  assert.equal(classify('sword').disposition, 'SELL');
  assert.ok(classify('sword').reasons.includes('AUTONOMOUS_ECONOMIC_EXPECTED_VALUE_SELL'));
  assert.equal(classify('ring').disposition, 'SELL');
  assert.ok(classify('ring').reasons.includes('AUTONOMOUS_ECONOMIC_EXPECTED_VALUE_SELL'));
  assert.equal(classify('rare').disposition, 'KEEP');
  assert.ok(classify('rare').reasons.includes('OPERATOR_BANK_DENIED'));
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

