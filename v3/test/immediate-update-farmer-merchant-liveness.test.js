'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha28LedgerFarmerFixes } = require('../src/reliability/alpha28-ledger-farmer-fixes');
const { Alpha27MerchantPlanning } = require('../src/reliability/alpha27-merchant-planning');
const { Alpha27MerchantAutonomy } = require('../src/reliability/alpha27-merchant-autonomy');

function farmerStats() {
  return {
    ledgerSignatureFixes: 0,
    semanticRegroupPreserved: 0,
    falseAreaPressureSuppressed: 0,
    plannedTargetFallbackSelections: 0
  };
}

function farmerFixture({ leader = true, engaged = false } = {}) {
  const farmer = {
    targetPolicy: 'party-only',
    _selectTarget: () => null,
    _targetAllowed: () => true,
    _friendlyNames: () => new Set(['Leader', 'Follower']),
    _candidateRows: () => ({ rows: [], monsters: [] }),
    planner: { rank: () => [] }
  };
  const snapshot = {
    observedAt: 1234,
    character: { name: leader ? 'Leader' : 'Follower', map: 'main', x: 0, y: 0, speed: 40 },
    entities: [
      { id: 'crab-1', mtype: 'crab', map: 'main', x: 25, y: 0, hp: 500, target: engaged ? 'Leader' : null }
    ]
  };
  const runtime = {
    farmer,
    localFarming: { currentPlan: { id: 'plan-squigtoad', monster: 'squigtoad' } },
    preFarmingReliability: { safeEntityIds: new Set(['crab-1']), safeEntitySnapshotAt: 1234 },
    teamCombatCohesionHotfix: {
      _team: () => ({
        selfName: leader ? 'Leader' : 'Follower',
        leaderName: 'Leader',
        complete: true,
        alive: true,
        sameMap: true,
        positionsKnown: true,
        cohesive: true,
        regroupRequired: false,
        stuckMembers: []
      })
    }
  };
  const stats = farmerStats();
  new Alpha28LedgerFarmerFixes(runtime, { now: () => 1234, log: { emit() {} }, stats });
  return { farmer, snapshot, stats };
}

test('farmer leader falls back to an already-safe live monster when the planned type is absent', () => {
  const { farmer, snapshot, stats } = farmerFixture({ leader: true, engaged: false });
  const selected = farmer._selectTarget({ snapshot, party: { members: [{ name: 'Leader' }, { name: 'Follower' }] } });
  assert.ok(selected);
  assert.equal(selected.target.id, 'crab-1');
  assert.equal(selected.target.mtype, 'crab');
  assert.equal(selected.ranking.monster, 'crab');
  assert.equal(selected.ranking.source, 'alpha28-safe-live-plan-miss-fallback');
  assert.equal(stats.plannedTargetFallbackSelections, 1);
});

test('farmer follower only joins a safe plan-miss fallback after the party has engaged it', () => {
  const idle = farmerFixture({ leader: false, engaged: false });
  assert.equal(idle.farmer._selectTarget({ snapshot: idle.snapshot, party: { members: [{ name: 'Leader' }, { name: 'Follower' }] } }), null);

  const engaged = farmerFixture({ leader: false, engaged: true });
  const selected = engaged.farmer._selectTarget({ snapshot: engaged.snapshot, party: { members: [{ name: 'Leader' }, { name: 'Follower' }] } });
  assert.ok(selected);
  assert.equal(selected.target.id, 'crab-1');
  assert.equal(selected.target.target, 'Leader');
});

function planningFixture(serviceResult = { executed: true, committed: true, reason: 'OK' }) {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, items: [{ name: 'wcap', level: 2 }] },
    parent: { entities: { ranger: { name: 'Ranger', map: 'main', x: 20, y: 0 } } }
  };
  let executions = 0;
  const runtime = {
    root,
    now: () => 2000,
    log: { emit() {} },
    controlledMerchantService: {
      async execute() { executions += 1; return { ...serviceResult }; }
    },
    gearProgression: {
      list: () => [{
        id: 'Ranger:helmet:wcap:2',
        sourceCharacter: 'Merchant',
        character: 'Ranger',
        item: 'wcap',
        observedLevel: 2,
        targetLevel: 2,
        projectedUpgradeRequired: false,
        improvement: 5,
        survivalImprovement: 5
      }]
    },
    partyBootstrap: { trustedRosterNames: () => ['Merchant', 'Ranger'] },
    partyTelemetry: { status: () => ({ reports: [{ name: 'Ranger', at: 1900, map: 'main', x: 20, y: 0 }] }) }
  };
  const atomic = {};
  const planning = new Alpha27MerchantPlanning(runtime, atomic, {
    now: runtime.now,
    log: runtime.log,
    options: { gearDeliveryDistance: 400 },
    stats: {}
  });
  planning.ensureStandClosed = async () => true;
  return { planning, executions };
}

test('successful merchant gear goal is claimed and cannot be delivered repeatedly in the same runtime', async () => {
  const fixture = planningFixture();
  assert.equal(await fixture.planning.deliverGearGoal(), true);
  assert.equal(fixture.planning.completedGearGoalClaims.size, 1);
  assert.equal(await fixture.planning.deliverGearGoal(), false);
  assert.ok(fixture.planning.gearGoalClaimSuppressions >= 1);
});

test('merchant gear delivery rejected by the raw-action budget does not consume the autonomous turn', async () => {
  const fixture = planningFixture({ executed: false, committed: false, reason: 'MERCHANT_SERVICE_ACTION_BUDGET_EXHAUSTED' });
  assert.equal(await fixture.planning.deliverGearGoal(), false);
  assert.equal(fixture.planning.completedGearGoalClaims.size, 0);
});

test('merchant executes ledger-authorized economy work before non-critical gear delivery', async () => {
  const runtime = {
    root: { character: { name: 'Merchant', ctype: 'merchant', map: 'main', items: [] }, parent: { entities: {} } },
    now: () => 3000,
    log: { emit() {} },
    gearProgression: { list: () => [] },
    planEconomyTransaction: () => ({ accepted: true, transaction: { id: 'sell-1' } })
  };
  const atomic = {
    merchantActive: () => true,
    supervisorAllowed: () => true,
    merchantInCombat: () => false,
    merchantBusy: false,
    serviceTravelBusy: false,
    status: () => ({}),
    namedServiceTravel: async () => true
  };
  const autonomy = new Alpha27MerchantAutonomy(runtime, atomic, {
    now: runtime.now,
    log: runtime.log,
    options: { merchantIntervalMs: 1200, gearDeliveryDistance: 400 },
    stats: { autonomousMerchantCycles: 0, autonomousMerchantHolds: 0, autonomousMerchantPlans: 0, failedSafe: 0 }
  });
  let economyExecutions = 0;
  let gearCalls = 0;
  runtime.controlledMerchant = { execute: async () => { economyExecutions += 1; return { executed: true, committed: true }; } };
  autonomy.ensureAutonomousAuthorities = () => true;
  autonomy.reconcileRecovering = () => false;
  autonomy.activeTransaction = () => null;
  autonomy.restockPartyPotions = async () => false;
  autonomy.planUpgrade = () => null;
  autonomy.planCompound = () => null;
  autonomy.planSellOrBank = () => ({ type: 'SELL', character: 'Merchant', index: 0, quantity: 1 });
  autonomy.ensureStandClosed = async () => true;
  autonomy.deliverGearGoal = async () => { gearCalls += 1; return true; };

  assert.equal(await autonomy.cycle(), true);
  assert.equal(economyExecutions, 1);
  assert.equal(gearCalls, 0);
  assert.equal(autonomy.lastMerchantPlan.type, 'SELL');
});

test('open upgrade circuit does not starve sell or bank work', async () => {
  const runtime = {
    root: { character: { name: 'Merchant', ctype: 'merchant', map: 'main', items: [] }, parent: { entities: {} } },
    now: () => 4000,
    log: { emit() {} },
    gearProgression: { list: () => [] },
    planEconomyTransaction: (request) => ({ accepted: true, transaction: { id: 'sell-after-upgrade-circuit', type: request.type } })
  };
  const atomic = {
    merchantActive: () => true,
    supervisorAllowed: () => true,
    merchantInCombat: () => false,
    merchantBusy: false,
    serviceTravelBusy: false,
    status: () => ({}),
    namedServiceTravel: async () => true
  };
  const autonomy = new Alpha27MerchantAutonomy(runtime, atomic, {
    now: runtime.now,
    log: runtime.log,
    options: { merchantIntervalMs: 1200, gearDeliveryDistance: 400 },
    stats: { autonomousMerchantCycles: 0, autonomousMerchantHolds: 0, autonomousMerchantPlans: 0, failedSafe: 0 }
  });
  let upgradesPlanned = 0;
  let executed = null;
  runtime.controlledMerchant = {
    execute: async (id) => { executed = id; return { executed: true, committed: true }; }
  };
  autonomy.ensureAutonomousAuthorities = () => true;
  autonomy.transactionFamilyOpen = (type) => type === 'UPGRADE';
  autonomy.reconcileRecovering = () => false;
  autonomy.activeTransaction = () => null;
  autonomy.restockPartyPotions = async () => false;
  autonomy.planUpgrade = () => { upgradesPlanned += 1; return { type: 'UPGRADE' }; };
  autonomy.planCompound = () => null;
  autonomy.planSellOrBank = () => ({ type: 'SELL', character: 'Merchant', index: 0, quantity: 1 });
  autonomy.ensureStandClosed = async () => true;
  autonomy.deliverGearGoal = async () => false;

  assert.equal(await autonomy.cycle(), true);
  assert.equal(upgradesPlanned, 0);
  assert.equal(executed, 'sell-after-upgrade-circuit');
  assert.equal(autonomy.lastMerchantPlan.type, 'SELL');
});
