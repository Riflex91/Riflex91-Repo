'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { PersistentProductionIntent } = require('../src/merchant/persistent-production-intent');
const { installMerchantProduction } = require('../src/merchant/merchant-production-controller');
const { ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { ControlledPartyLogistics, Action } = require('../src/party/controlled-party-logistics');
const { FarmerController, FarmerState } = require('../src/farmer/farmer-fsm');
const { estimateBlockedProductionCandidate } = require('../src/party/production-material-acquisition');

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    get: (key) => values.has(key) ? values.get(key) : null,
    set: (key, value) => { values.set(key, value); return true; },
    values
  };
}

function targetPlan(state = 'BLOCKED') {
  return {
    id: 'plan-goodbow',
    state,
    reason: state === 'BLOCKED' ? 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN' : 'PRODUCTION_CHAIN_READY',
    target: { output: 'goodbow', recipient: 'R1', slot: 'mainhand' },
    blockedCandidates: state === 'BLOCKED' ? [{
      candidate: { output: 'goodbow', recipient: 'R1', slot: 'mainhand' },
      steps: [{ kind: ProductionStepKind.FARM_REQUIRED, name: 'wood', level: 0, quantity: 10 }],
      blockers: [{ reason: 'MATERIAL_FARM_REQUIRED', name: 'wood', level: 0, quantity: 10 }]
    }] : []
  };
}

test('persistent production intent reloads as recovery-pending and only continues after fresh identity match', () => {
  let now = 1000;
  const storage = memoryStorage();
  const first = new PersistentProductionIntent({ now: () => now, storage });
  assert.equal(first.ensureForPlan(targetPlan(), 'FARMING_MATERIAL', {
    reason: 'TEAM_FARM_PATH_WITHIN_PRIORITY_BUDGET',
    material: { material: 'wood', level: 0, requiredQuantity: 10 },
    progress: { heldByFarmers: 4, remainingToFarm: 6 }
  }), true);
  assert.equal(first.status().active.phase, 'FARMING_MATERIAL');

  now = 2000;
  const reloaded = new PersistentProductionIntent({ now: () => now, storage });
  assert.equal(reloaded.status().recoveryPending, true);
  assert.equal(reloaded.status().active.progress.remainingToFarm, 6);

  const recovery = reloaded.reconcile(targetPlan());
  assert.equal(recovery.reconciled, true);
  assert.equal(recovery.continued, true);
  assert.equal(recovery.reason, 'PERSISTED_INTENT_MATCHED_FRESH_REPLAN');
  assert.equal(reloaded.status().recoveryPending, false);
  assert.equal(reloaded.status().active.target.output, 'goodbow');
});

test('persistent production intent never replays an old target when fresh replan identity changed', () => {
  let now = 1000;
  const storage = memoryStorage();
  const first = new PersistentProductionIntent({ now: () => now, storage });
  first.ensureForPlan(targetPlan(), 'MATERIAL_READY_FOR_HANDOFF', {
    material: { material: 'wood', requiredQuantity: 10 },
    progress: { heldByFarmers: 10, transferPending: true }
  });

  now = 2000;
  const reloaded = new PersistentProductionIntent({ now: () => now, storage });
  const changed = {
    id: 'plan-other',
    state: 'BLOCKED',
    target: { output: 'otherbow', recipient: 'R1', slot: 'mainhand' },
    blockedCandidates: []
  };
  const recovery = reloaded.reconcile(changed);
  assert.equal(recovery.reconciled, true);
  assert.equal(recovery.continued, false);
  assert.equal(recovery.reason, 'PERSISTED_INTENT_NOT_PRESENT_IN_FRESH_REPLAN');
  assert.equal(reloaded.status().active, null);
  assert.equal(reloaded.status().history.at(-1).phase, 'FAILED_SAFE');
});

function dropRuntimeWithFarmerInventory(inventory) {
  const gameData = {
    items: {
      weakbow: { type: 'weapon', attack: 1, class: ['ranger'], g: 10 },
      goodbow: { type: 'weapon', attack: 20, class: ['ranger'], g: 1000 },
      shard: { type: 'material', g: 1 },
      shell: { type: 'material', g: 1, e: 20 }
    },
    craft: { goodbow: { cost: 100, items: [[2, 'shard', 0]] } },
    drops: {
      monsters: { crab: [[1, 'shell', 1]] },
      shell: [[1, 'shard', 1]]
    },
    monsters: { crab: { hp: 100, attack: 10 } },
    maps: { beach: { monsters: [{ type: 'crab', boundary: [0, 0, 100, 100] }] } },
    npcs: {}
  };
  return {
    adapter: { getGameData: () => gameData },
    root: { character: { name: 'Merchant', ctype: 'merchant', items: [], bank: {} } },
    characterRegistry: {
      status: () => ({
        characters: [
          { name: 'Merchant', ctype: 'merchant', inventory: [] },
          { name: 'R1', ctype: 'ranger', inventory }
        ]
      })
    },
    world: { performance: new Map(), fact: () => ({ value: 'APPROVED' }) },
    contentDrift: { requiresRevalidation: () => false }
  };
}

test('exchange-backed acquisition enters handoff when Farmers already hold all exchange inputs', () => {
  const runtime = dropRuntimeWithFarmerInventory([{ name: 'shell', level: 0, q: 40 }]);
  const candidate = {
    candidate: { output: 'goodbow', recipient: 'R1', slot: 'mainhand', improvement: 20 },
    steps: [{ kind: ProductionStepKind.FARM_REQUIRED, name: 'shard', level: 0, quantity: 2 }],
    blockers: [{ reason: 'MATERIAL_FARM_REQUIRED', name: 'shard', level: 0, quantity: 2 }]
  };
  const estimate = estimateBlockedProductionCandidate(runtime, candidate, { fallbackKillsPerHour: 20 });
  assert.equal(estimate.eligible, false);
  assert.equal(estimate.reason, 'MATERIAL_ALREADY_HELD_BY_FARMERS_AWAIT_TRANSFER');
  assert.equal(estimate.materials[0].awaitingTransfer, true);
  assert.equal(estimate.materials[0].handoffMaterial, 'shell');
  assert.equal(estimate.materials[0].handoffQuantity, 40);
  assert.equal(estimate.materials[0].heldByFarmers, 40);
});

test('party logistics handoff replaces farm objective, clears cross-map farm travel and keeps material transferable', () => {
  let cleared = null;
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.now = () => 1000;
  logistics.root = { G: { items: { wood: { type: 'material', exchange: true } } } };
  logistics.parent = logistics.root;
  logistics.runtime = {
    farmer: {
      materialObjective: {
        kind: 'PRODUCTION_MATERIAL',
        objectiveId: 'production-material:goodbow:R1:wood',
        material: 'wood',
        monster: 'goo',
        map: 'main',
        level: 0,
        expiresAt: 60000
      }
    },
    alpha28LiveAuthorityLiveness: {
      crossMap: {
        clearMaterialObjective: (kind, objectiveId) => { cleared = { kind, objectiveId }; return true; }
      }
    }
  };
  logistics.stats = { messagesReceived: 0, messagesRejected: 0 };
  logistics._validEnvelope = () => true;
  logistics._merchantName = () => 'Merchant';
  logistics._isMerchant = () => false;

  const accepted = logistics.receive('Merchant', {
    action: Action.PRODUCTION_MATERIAL_HANDOFF_READY,
    objectiveId: 'production-material:goodbow:R1:wood',
    material: 'wood',
    targetMaterial: 'wood',
    level: 0,
    requiredQuantity: 10,
    heldByFarmers: 10,
    output: 'goodbow',
    recipient: 'R1',
    expiresAt: 60000
  });

  assert.equal(accepted, true);
  assert.equal(logistics.runtime.farmer.materialObjective.kind, 'PRODUCTION_MATERIAL_HANDOFF');
  assert.equal(logistics.runtime.farmer.materialObjective.monster, undefined);
  assert.deepEqual(cleared, {
    kind: 'PRODUCTION_MATERIAL',
    objectiveId: 'production-material:goodbow:R1:wood'
  });
  assert.equal(logistics._safeLootDescriptor({ name: 'wood', level: 0, q: 10 }).ok, true);
});

test('Farmer production handoff is a real combat hold, not merely removal of farm priority', () => {
  let commands = 0;
  const farmer = new FarmerController({ now: () => 1000, log: { emit() {} } });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'goo-1';
  farmer.targetType = 'goo';
  farmer.materialObjective = {
    kind: 'PRODUCTION_MATERIAL_HANDOFF',
    objectiveId: 'production-material:goodbow:R1:wood',
    material: 'wood',
    requiredQuantity: 10,
    expiresAt: 60000
  };

  const result = farmer.step({
    adapter: {
      mode: 'active',
      command: () => { commands += 1; return { executed: true }; },
      canAttack: () => true,
      getGameData: () => ({ monsters: { goo: {} } })
    },
    snapshot: {
      character: {
        name: 'R1', ctype: 'ranger', hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
        x: 0, y: 0, map: 'main', range: 120, speed: 40, inventory: []
      },
      party: [],
      entities: [{ id: 'goo-1', mtype: 'goo', hp: 100, x: 20, y: 0, map: 'main' }]
    },
    party: { fingerprint: 'team', names: ['R1'] },
    world: null
  });

  assert.equal(result.reason, 'PRODUCTION_MATERIAL_HANDOFF_READY');
  assert.equal(commands, 0);
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.targetType, null);
  assert.equal(farmer.stateReason, 'PRODUCTION_MATERIAL_HANDOFF_READY');
});

test('production controller converts aggregate Farmer-held material into handoff and persists that phase', () => {
  let handoff = null;
  let farmPublishes = 0;
  const storage = memoryStorage();
  const runtimeDrop = dropRuntimeWithFarmerInventory([{ name: 'shard', level: 0, q: 2 }]);
  const root = runtimeDrop.root;
  root.character.gold = 10000000;
  root.character.isize = 42;
  root.parent = { entities: {} };

  const blocked = {
    ...targetPlan(),
    blockedCandidates: [{
      candidate: { output: 'goodbow', recipient: 'R1', slot: 'mainhand', improvement: 20 },
      steps: [{ kind: ProductionStepKind.FARM_REQUIRED, name: 'shard', level: 0, quantity: 2 }],
      blockers: [{ reason: 'MATERIAL_FARM_REQUIRED', name: 'shard', level: 0, quantity: 2 }],
      reservations: {}
    }]
  };
  blocked.steps = blocked.blockedCandidates[0].steps;
  blocked.blockers = blocked.blockedCandidates[0].blockers;

  const planner = {
    plan: () => blocked,
    planMaterialConsolidation: () => null,
    planExchange: () => null,
    status: () => ({})
  };
  const bankCatalog = {
    observe: () => true,
    needsRefresh: () => false,
    status: () => ({ usable: true, snapshot: { rows: [] } })
  };
  const executor = {
    status: () => ({ enabled: true, busy: false, activeOperation: null }),
    execute: async () => ({ executed: false, committed: false }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({ reconciled: false })
  };
  const runtime = {
    root,
    now: () => 1000,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: runtimeDrop.adapter.getGameData },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: runtimeDrop.characterRegistry,
    world: runtimeDrop.world,
    contentDrift: runtimeDrop.contentDrift,
    controlledPartyLogistics: {
      lastProductionMaterialObjective: null,
      publishProductionMaterialObjective: () => { farmPublishes += 1; return true; },
      publishProductionMaterialHandoffReady: (row) => { handoff = JSON.parse(JSON.stringify(row)); return true; },
      clearProductionMaterialObjective: () => true
    },
    _merchantCollectionSessionActive: () => false,
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };

  const controller = installMerchantProduction(runtime, { storage, planner, bankCatalog, executor });
  const plan = controller.cycle();
  assert.equal(plan.state, 'BLOCKED');
  assert.ok(handoff);
  assert.equal(handoff.material, 'shard');
  assert.equal(handoff.requiredQuantity, 2);
  assert.equal(handoff.heldByFarmers, 2);
  assert.equal(farmPublishes, 0);
  assert.equal(controller.status().productionIntent.active.phase, 'MATERIAL_READY_FOR_HANDOFF');
  assert.equal(controller.status().productionIntent.active.progress.transferPending, true);
});

test('controller restart reconciles persisted target before any fresh production action', () => {
  let now = 1000;
  const storage = memoryStorage();
  const seeded = new PersistentProductionIntent({ now: () => now, storage });
  seeded.ensureForPlan(targetPlan(), 'FARMING_MATERIAL', {
    material: { material: 'wood', requiredQuantity: 10 },
    progress: { heldByFarmers: 3, remainingToFarm: 7 }
  });
  now = 2000;

  let plannerCalls = 0;
  let executorCalls = 0;
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000000, isize: 42, items: [], bank: {} },
    parent: { entities: {} },
    G: { items: {}, craft: {}, maps: {}, npcs: {} }
  };
  const planner = {
    plan: () => { plannerCalls += 1; return targetPlan(); },
    planMaterialConsolidation: () => null,
    planExchange: () => null,
    status: () => ({})
  };
  const controller = installMerchantProduction({
    root,
    now: () => now,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    contentDrift: { requiresRevalidation: () => false },
    _merchantCollectionSessionActive: () => false,
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  }, {
    storage,
    planner,
    bankCatalog: {
      observe: () => true,
      needsRefresh: () => false,
      status: () => ({ usable: true, snapshot: { rows: [] } })
    },
    executor: {
      status: () => ({ enabled: true, busy: false, activeOperation: null }),
      execute: async () => { executorCalls += 1; return { executed: true, committed: true }; },
      configure: () => {},
      disable: () => {},
      reconcile: () => ({ reconciled: false })
    }
  });

  const first = controller.cycle();
  assert.equal(first.state, 'HOLD');
  assert.equal(first.reason, 'PRODUCTION_INTENT_RECOVERED_REPLAN_VERIFIED');
  assert.equal(plannerCalls, 1);
  assert.equal(executorCalls, 0);
  assert.equal(controller.status().productionIntent.recoveryPending, false);
});
