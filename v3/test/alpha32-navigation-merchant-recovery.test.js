'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha28LedgerFarmerFixes } = require('../src/reliability/alpha28-ledger-farmer-fixes');
const { installAlpha32NavigationMerchantRecovery } = require('../src/reliability/alpha32-navigation-merchant-recovery');

function alpha28Stats() {
  return {
    ledgerSignatureFixes: 0,
    semanticRegroupPreserved: 0,
    falseAreaPressureSuppressed: 0,
    plannedTargetFallbackSelections: 0
  };
}

test('Alpha32 prevents Alpha28 fallback from immediately reselecting a terrain-blocked target', () => {
  let now = 1000;
  const farmer = {
    _selectTarget: () => null,
    _targetAllowed: () => true,
    _friendlyNames: () => new Set(['Leader']),
    _candidateRows: () => ({ rows: [], monsters: [] }),
    planner: { rank: () => [] }
  };
  const snapshot = {
    observedAt: 1000,
    character: { name: 'Leader', map: 'main', x: 0, y: 0, speed: 40 },
    entities: [
      { id: 'blocked', mtype: 'tortoise', map: 'main', x: 10, y: 0, hp: 100 },
      { id: 'open', mtype: 'tortoise', map: 'main', x: 40, y: 0, hp: 100 }
    ]
  };
  const runtime = {
    now: () => now,
    farmer,
    localFarming: { currentPlan: { id: 'plan-tortoise', monster: 'tortoise' } },
    preFarmingReliability: { safeEntityIds: new Set(['blocked', 'open']), safeEntitySnapshotAt: 1000 },
    farmerTerrainNavigationHotfix: {
      blockedTargets: new Map([['blocked', 13000]]),
      _pruneBlocked() {}
    },
    teamCombatCohesionHotfix: {
      _team: () => ({ selfName: 'Leader', leaderName: 'Leader', complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true, regroupRequired: false, stuckMembers: [] })
    },
    log: { emit() {} }
  };

  new Alpha28LedgerFarmerFixes(runtime, { now: runtime.now, log: runtime.log, stats: alpha28Stats() });
  const hotfix = installAlpha32NavigationMerchantRecovery(runtime);
  const selected = farmer._selectTarget({ snapshot, party: { members: [{ name: 'Leader' }] } });

  assert.ok(selected);
  assert.equal(selected.target.id, 'open');
  assert.equal(runtime.preFarmingReliability.safeEntityIds.has('blocked'), true, 'shared safe set must be restored after selection');
  assert.equal(hotfix.stats.blockedTargetIdsFiltered, 1);
  assert.equal(hotfix.stats.blockedTargetSelectionCycles, 1);
});

test('Alpha32 allows a bounded lateral local-farm detour when greedy progress probing returns no waypoint', () => {
  let now = 2000;
  const localFarming = {
    config: { minStep: 50, maxStep: 120, stepSeconds: 2.5 },
    _boundedDestination: () => null
  };
  const runtime = {
    now: () => now,
    root: {
      can_move_to(x, y) { return Math.abs(y) >= 40 && Math.hypot(x, y) <= 121; }
    },
    localFarming,
    log: { emit() {} }
  };
  const hotfix = installAlpha32NavigationMerchantRecovery(runtime, { localDetourMaxAttempts: 4 });
  const plan = { id: 'wall-plan', monster: 'tortoise', x: 1000, y: 0, lastProgressAt: 0 };
  const waypoint = localFarming._boundedDestination({ name: 'Leader', x: 0, y: 0, speed: 48 }, plan);

  assert.ok(waypoint);
  assert.equal(waypoint.terrainDetour, true);
  assert.notEqual(Math.round(waypoint.y), 0);
  assert.equal(plan.lastProgressAt, now);
  assert.equal(hotfix.stats.localFarmDetours, 1);
});

test('Alpha32 releases stale merchant reservations immediately after live identity mismatch', async () => {
  const tx = { id: 'tx-stale', type: 'BANK', state: 'RESERVED' };
  let cancelReason = null;
  const runtime = {
    now: () => 3000,
    controlledMerchant: {
      async execute() { return { executed: false, committed: false, reason: 'LIVE_ITEM_IDENTITY_MISMATCH' }; }
    },
    transactionEngine: {
      get: () => tx,
      cancel(id, reason) { assert.equal(id, tx.id); tx.state = 'ABORTED'; cancelReason = reason; return true; }
    },
    log: { emit() {} }
  };
  const hotfix = installAlpha32NavigationMerchantRecovery(runtime);
  const result = await runtime.controlledMerchant.execute(tx.id);

  assert.equal(result.aborted, true);
  assert.equal(result.staleReservationReleased, true);
  assert.equal(cancelReason, 'PREFLIGHT_ABORTED:LIVE_ITEM_IDENTITY_MISMATCH');
  assert.equal(hotfix.stats.staleMerchantTransactionsReleased, 1);
});

test('Alpha32 heals a low-HP merchant and holds economy, service, production, and autonomy until recovery', () => {
  let now = 4000;
  let potionCalls = 0;
  let autonomyCalls = 0;
  let serviceCycles = 0;
  const character = { name: 'Merchant', ctype: 'merchant', hp: 100, max_hp: 1000, items: [{ name: 'hpot0', q: 10 }] };
  const alpha27Merchant = {
    tick() { autonomyCalls += 1; return true; }
  };
  const okPreflight = () => ({ ok: true });
  const runtime = {
    now: () => now,
    root: { character },
    adapter: {
      mode: 'active',
      command(action) { assert.equal(action, 'use_hp'); potionCalls += 1; return { executed: true, accepted: true }; }
    },
    controlledMerchant: { _preflight: okPreflight },
    controlledMerchantService: { _preflight: okPreflight },
    controlledMerchantProduction: { _preflight: okPreflight },
    alpha27CombatMerchantConvergence: { merchant: alpha27Merchant },
    _merchantServiceCycle() { serviceCycles += 1; return { kind: 'SERVICE_DELIVERY' }; },
    log: { emit() {} }
  };

  const hotfix = installAlpha32NavigationMerchantRecovery(runtime, { merchantRecoveryTriggerHpRatio: 0.5, merchantRecoveryResumeHpRatio: 0.7, merchantPotionCooldownMs: 1000 });
  assert.equal(runtime.controlledMerchant._preflight({}).reason, 'MERCHANT_HP_RECOVERY_REQUIRED');
  assert.equal(runtime.controlledMerchantService._preflight({}).reason, 'MERCHANT_HP_RECOVERY_REQUIRED');
  assert.equal(runtime.controlledMerchantProduction._preflight({}).reason, 'MERCHANT_HP_RECOVERY_REQUIRED');

  hotfix.beforeTick();
  assert.equal(potionCalls, 1);
  assert.equal(alpha27Merchant.tick(), false);
  assert.equal(autonomyCalls, 0);
  assert.equal(runtime._merchantServiceCycle(), null);
  assert.equal(serviceCycles, 0);
  assert.equal(hotfix.status().merchant.recoveryActive, true);

  character.hp = 800;
  now += 1200;
  hotfix.beforeTick();
  assert.equal(hotfix.status().merchant.recoveryActive, false);
  assert.equal(runtime.controlledMerchant._preflight({}).ok, true);
  assert.equal(alpha27Merchant.tick(), true);
  assert.equal(autonomyCalls, 1);
  assert.deepEqual(runtime._merchantServiceCycle(), { kind: 'SERVICE_DELIVERY' });
  assert.equal(serviceCycles, 1);
});

test('Alpha32 backs gear delivery off until the shared merchant-service action budget can recover', async () => {
  let now = 10000;
  let calls = 0;
  const character = { name: 'Merchant', ctype: 'merchant', hp: 1000, max_hp: 1000, items: [] };
  const merchant = {
    async deliverGearGoal() {
      calls += 1;
      this.lastMerchantAction = { result: { executed: false, committed: false, reason: 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED' } };
      return false;
    }
  };
  const runtime = {
    now: () => now,
    root: { character },
    controlledMerchantService: { actionTimes: [0, 2000, 4000], actionWindowMs: 60000 },
    alpha27CombatMerchantConvergence: { merchant },
    log: { emit() {} }
  };
  const hotfix = installAlpha32NavigationMerchantRecovery(runtime);

  assert.equal(await merchant.deliverGearGoal(), false);
  assert.equal(calls, 1);
  assert.ok(hotfix.gearDeliveryBackoffUntil > now);
  assert.equal(await merchant.deliverGearGoal(), false);
  assert.equal(calls, 1, 'budget backoff must suppress repeated plan/execution spam');
  assert.equal(hotfix.stats.gearDeliveryBudgetBackoffs, 1);
  assert.equal(hotfix.stats.gearDeliveryBackoffSkips, 1);
});
