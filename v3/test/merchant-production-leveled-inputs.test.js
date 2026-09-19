'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { installMerchantProduction } = require('../src/merchant/merchant-production-controller');
const { MerchantTaskCoordinator } = require('../src/merchant/merchant-task-coordinator');
const { InventoryLedger } = require('../src/economy/inventory-ledger');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeEngine, makeControlledMerchant, makeLedger, makeRuntime } = require('./alpha27-convergence-test-helpers');

function registry() {
  return {
    characters: [{
      name: 'R1',
      ctype: 'ranger',
      level: 80,
      gear: { mainhand: { name: 'weakbow', level: 0 } },
      inventory: []
    }]
  };
}

function leveledGameData(materialMeta, materialLevel = 2) {
  return {
    items: {
      weakbow: { type: 'weapon', attack: 1, class: ['ranger'], g: 10 },
      goodbow: { type: 'weapon', attack: 50, class: ['ranger'], g: 1000 },
      mat: { type: 'material', g: 100, grades: [], ...materialMeta },
      scroll0: { type: 'material', g: 100 },
      cscroll0: { type: 'material', g: 100 }
    },
    craft: {
      goodbow: { cost: 100, items: [[1, 'mat', materialLevel]] }
    },
    npcs: {},
    maps: {},
    monsters: {}
  };
}

function planFor(gameData, items) {
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 0 });
  return planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 1000000, items, bank: {} },
    registry: registry(),
    gameData,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false
  });
}

test('leveled upgrade recipe input resolves to one exact Alpha27 upgrade step', () => {
  const plan = planFor(
    leveledGameData({ upgrade: { attack: 1 } }, 2),
    [{ name: 'mat', level: 1, q: 1 }]
  );

  assert.equal(plan.state, 'BLOCKED');
  const blocked = plan.blockedCandidates[0];
  const mutation = blocked.steps.find((step) => step.kind === ProductionStepKind.UPGRADE_REQUIRED);
  assert.ok(mutation);
  assert.equal(mutation.name, 'mat');
  assert.equal(mutation.fromLevel, 1);
  assert.equal(mutation.targetLevel, 2);
  assert.equal(mutation.quantity, 1);
  assert.equal(mutation.inputQuantity, 1);
  assert.equal(mutation.scrollName, 'scroll0');
  assert.equal(blocked.blockers.some((row) => row.reason === 'MATERIAL_MUTATION_REQUIRED' && row.mutation === 'UPGRADE'), true);
  assert.equal(blocked.steps.some((step) => step.kind === ProductionStepKind.FARM_REQUIRED), false);
});

test('recursive compound recipe input expands +2 into nine level-0 inputs before mutating', () => {
  const baseCopies = Array.from({ length: 9 }, () => ({ name: 'mat', level: 0, q: 1 }));
  const plan = planFor(leveledGameData({ compound: { dex: 1 } }, 2), baseCopies);

  assert.equal(plan.state, 'BLOCKED');
  const blocked = plan.blockedCandidates[0];
  const mutation = blocked.steps.find((step) => step.kind === ProductionStepKind.COMPOUND_REQUIRED);
  assert.ok(mutation);
  assert.equal(mutation.fromLevel, 0);
  assert.equal(mutation.targetLevel, 1);
  assert.equal(mutation.quantity, 3);
  assert.equal(mutation.inputQuantity, 9);
  assert.equal(mutation.inputMultiplier, 3);
  assert.equal(mutation.scrollName, 'cscroll0');
  assert.equal(blocked.steps.some((step) => step.kind === ProductionStepKind.FARM_REQUIRED), false);
});

test('recursive compound acquisition farms only the real base item, never an imaginary +level drop', () => {
  const plan = planFor(leveledGameData({ compound: { dex: 1 } }, 2), []);

  assert.equal(plan.state, 'BLOCKED');
  const blocked = plan.blockedCandidates[0];
  const farm = blocked.steps.find((step) => step.kind === ProductionStepKind.FARM_REQUIRED);
  assert.ok(farm);
  assert.equal(farm.name, 'mat');
  assert.equal(farm.level, 0);
  assert.equal(farm.quantity, 9);
  assert.equal(blocked.steps.some((step) => step.kind === ProductionStepKind.COMPOUND_REQUIRED), false);
});

test('leveled recipe input without upgrade or compound metadata fails closed', () => {
  const plan = planFor(leveledGameData({}, 1), []);

  assert.equal(plan.state, 'BLOCKED');
  const blocked = plan.blockedCandidates[0];
  assert.equal(blocked.blockers.some((row) => row.reason === 'LEVELED_MATERIAL_MUTATION_UNSUPPORTED'), true);
  assert.equal(blocked.steps.some((step) => step.kind === ProductionStepKind.FARM_REQUIRED && step.level > 0), false);
});

test('production mutation demand enters Alpha27 ledger but cannot override Farmer gear protection', () => {
  const ledger = new InventoryLedger({ now: () => 1000 });
  const gameData = {
    items: {
      mat: { type: 'weapon', g: 100, grades: [], upgrade: { attack: 1 } }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ ledger, gameData });
  new Alpha27CombatMerchantConvergence(runtime, { upgradeValueCap: 1000000 });
  runtime.productionMaterialMutationDemand = {
    family: 'UPGRADE',
    item: 'mat',
    fromLevel: 0,
    targetLevel: 1,
    output: 'goodbow',
    recipient: 'R1',
    expiresAt: 60000
  };
  runtime.gearProgression.futureProtectionFor = () => null;
  runtime.gearProgression.futureSellSafetyFor = () => ({ checked: true, protected: false });

  const production = ledger._baseDisposition(
    { character: 'Merchant', index: 0, name: 'mat', level: 0 },
    gameData,
    runtime.contentDrift,
    new Map([['mat:0', 1]])
  );
  assert.equal(production.disposition, 'RESERVE_UPGRADE');
  assert.equal(production.reasons.includes('PRODUCTION_MATERIAL_MUTATION_DEMAND'), true);

  runtime.gearProgression.futureProtectionFor = () => ({ character: 'R1', targetLevel: 5 });
  const protectedGear = ledger._baseDisposition(
    { character: 'Merchant', index: 0, name: 'mat', level: 0 },
    gameData,
    runtime.contentDrift,
    new Map([['mat:0', 1]])
  );
  assert.equal(protectedGear.reasons.includes('FUTURE_FARMER_GEAR_PROGRESSION'), true);
  assert.equal(protectedGear.reasons.includes('PRODUCTION_MATERIAL_MUTATION_DEMAND'), false);
});

function productionUpgradeFixture() {
  const engine = makeEngine();
  const controlledMerchant = makeControlledMerchant();
  controlledMerchant.enabled = true;
  controlledMerchant.upgradeEnabled = true;
  controlledMerchant.compoundEnabled = true;
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      gold: 2000000,
      target: null,
      items: [{ name: 'mat', level: 0 }],
      isize: 42,
      map: 'main',
      x: 0,
      y: 0
    },
    parent: { entities: {} }
  };
  const ledger = makeLedger([{
    character: 'Merchant',
    index: 0,
    name: 'mat',
    level: 0,
    disposition: 'RESERVE_UPGRADE',
    reasons: ['PRODUCTION_MATERIAL_MUTATION_DEMAND', 'PRODUCTION_RECIPE_UPGRADE_INPUT']
  }]);
  const gameData = {
    items: {
      mat: { type: 'weapon', g: 100, grades: [], upgrade: { attack: 1 } },
      scroll0: { type: 'material', g: 100 }
    },
    monsters: {},
    maps: {}
  };
  const runtime = makeRuntime({ root, ledger, engine, controlledMerchant, gameData, gearGoals: [] });
  const convergence = new Alpha27CombatMerchantConvergence(runtime, { upgradeValueCap: 1000000 });
  controlledMerchant.enabled = true;
  controlledMerchant.upgradeEnabled = true;
  controlledMerchant.compoundEnabled = true;
  runtime.productionMaterialMutationDemand = {
    family: 'UPGRADE',
    item: 'mat',
    fromLevel: 0,
    targetLevel: 1,
    output: 'goodbow',
    recipient: 'R1',
    expiresAt: 60000
  };
  return { runtime, convergence, engine, ledger };
}

test('Alpha27 accepts a precisely matching production upgrade without inventing a gear goal', () => {
  const { runtime, convergence, engine, ledger } = productionUpgradeFixture();
  const request = {
    type: 'UPGRADE',
    character: 'Merchant',
    index: 0,
    indices: [0],
    metadata: {
      source: 'MERCHANT_PRODUCTION_ACQUISITION_V2',
      lifecycle: 'PRODUCTION_MATERIAL_ACQUISITION',
      productionMaterialAcquisition: true,
      output: 'goodbow',
      recipient: 'R1',
      targetLevel: 1
    }
  };
  const planned = engine.planAtomic(request, { ledger });
  assert.equal(planned.accepted, true);
  const preflight = convergence.atomic.atomicPreflight(planned.transaction);
  assert.equal(preflight.ok, true);
  assert.equal(preflight.productionLifecycle, true);
  assert.equal(runtime.gearProgression.list().length, 0);
});

test('Alpha27 rejects a production mutation when the exact output/recipient demand no longer matches', () => {
  const { runtime, convergence, engine, ledger } = productionUpgradeFixture();
  const request = {
    type: 'UPGRADE',
    character: 'Merchant',
    index: 0,
    indices: [0],
    metadata: {
      source: 'MERCHANT_PRODUCTION_ACQUISITION_V2',
      lifecycle: 'PRODUCTION_MATERIAL_ACQUISITION',
      productionMaterialAcquisition: true,
      output: 'otherbow',
      recipient: 'R1',
      targetLevel: 1
    }
  };
  const planned = engine.planAtomic(request, { ledger });
  assert.equal(planned.accepted, true);
  const preflight = convergence.atomic.atomicPreflight(planned.transaction);
  assert.equal(preflight.ok, false);
  assert.equal(preflight.reason, 'PRODUCTION_MUTATION_DEMAND_MISMATCH');
  assert.equal(runtime.productionMaterialMutationDemand.output, 'goodbow');
});


// Final integration guard: Recovery owns startup first; once clear, Production
// may hand exactly one leveled-material mutation to Alpha27 under its lease.
test('production controller hands an actionable leveled input to Alpha27 under one exact production lease', async () => {
  let now = 1000;
  let captured = null;
  let publishedFarmObjective = 0;
  let ledgerEntry = null;
  const coordinator = new MerchantTaskCoordinator({ now: () => now, defaultLeaseMs: 600000 });
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map: 'main',
      x: 0,
      y: 0,
      gold: 2000000,
      isize: 42,
      items: [{ name: 'mat', level: 0 }]
    },
    parent: { entities: {} },
    G: {
      items: {
        mat: { type: 'weapon', g: 100, grades: [], upgrade: { attack: 1 } },
        scroll0: { type: 'material', g: 100 }
      },
      craft: {},
      maps: {},
      npcs: {}
    }
  };
  const blockedCandidate = {
    candidate: { output: 'goodbow', recipient: 'R1', slot: 'mainhand', improvement: 50 },
    steps: [{
      kind: ProductionStepKind.UPGRADE_REQUIRED,
      name: 'mat',
      level: 1,
      fromLevel: 0,
      targetLevel: 1,
      quantity: 1,
      inputQuantity: 1,
      inputMultiplier: 1,
      scrollName: 'scroll0'
    }],
    blockers: [{
      reason: 'MATERIAL_MUTATION_REQUIRED',
      mutation: 'UPGRADE',
      name: 'mat',
      level: 1,
      fromLevel: 0,
      targetLevel: 1,
      quantity: 1,
      inputQuantity: 1,
      scrollName: 'scroll0'
    }],
    reservations: {},
    totalGold: 0
  };
  const plan = {
    id: 'production-leveled-1',
    state: 'BLOCKED',
    reason: 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN',
    target: blockedCandidate.candidate,
    steps: blockedCandidate.steps,
    blockers: blockedCandidate.blockers,
    blockedCandidates: [blockedCandidate],
    reservations: {}
  };
  const planner = {
    plan: () => plan,
    planMaterialConsolidation: () => null,
    planExchange: () => null,
    status: () => ({ costStrategy: 'LEAST_GOLD_SOURCE_GRAPH_V3_QUEST_EVENT_PROBABILISTIC' })
  };
  const bankCatalog = {
    observe: () => true,
    needsRefresh: () => false,
    status: () => ({ usable: true, snapshot: { rows: [] } })
  };
  const executor = {
    status: () => ({ enabled: true, busy: false }),
    execute: async () => ({ executed: false, committed: false, reason: 'NOT_EXPECTED' }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({})
  };
  const runtime = {
    root,
    now: () => now,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    contentDrift: { requiresRevalidation: () => false },
    merchantTaskCoordinator: coordinator,
    inventoryLedger: {
      observe() {
        const demand = runtime.productionMaterialMutationDemand;
        ledgerEntry = demand ? {
          key: 'Merchant:0',
          character: 'Merchant',
          index: 0,
          name: 'mat',
          level: 0,
          disposition: 'RESERVE_UPGRADE',
          reasons: ['PRODUCTION_MATERIAL_MUTATION_DEMAND']
        } : null;
        return {};
      },
      get: (_character, index) => index === 0 ? ledgerEntry : null,
      status: () => ({ stale: false })
    },
    controlledPartyLogistics: {
      clearProductionMaterialObjective: () => true,
      publishProductionMaterialObjective: () => { publishedFarmObjective += 1; return true; }
    },
    alpha27CombatMerchantConvergence: {
      merchant: {
        atomic: { merchantBusy: false, serviceTravelBusy: false },
        ensureAutonomousAuthorities: () => true,
        executeEconomyRequest: async (request) => {
          captured = JSON.parse(JSON.stringify(request));
          return true;
        }
      }
    },
    _merchantCollectionSessionActive: () => false,
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };

  const controller = installMerchantProduction(runtime, { planner, bankCatalog, executor });
  const decision = controller.cycle();
  assert.equal(decision.state, 'BLOCKED');
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(captured);
  assert.equal(captured.type, 'UPGRADE');
  assert.deepEqual(captured.indices, [0]);
  assert.equal(captured.metadata.productionMaterialAcquisition, true);
  assert.equal(captured.metadata.output, 'goodbow');
  assert.equal(captured.metadata.recipient, 'R1');
  assert.equal(captured.metadata.targetLevel, 1);
  assert.equal(runtime.productionMaterialMutationDemand, null);
  assert.equal(publishedFarmObjective, 0);
  const active = coordinator.current();
  assert.equal(active, null);
  assert.equal(controller.status().teamMaterialFarmPolicy.mutationExecutions, 1);
  assert.equal(controller.status().teamMaterialFarmPolicy.mutationAuthority, 'ALPHA27_ATOMIC_ONLY');
});


test('production controller refuses irreversible mutation when another required material has no safe acquisition path', () => {
  let captured = 0;
  const coordinator = new MerchantTaskCoordinator({ now: () => 1000, defaultLeaseMs: 600000 });
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map: 'main',
      x: 0,
      y: 0,
      gold: 2000000,
      isize: 42,
      items: [{ name: 'mat', level: 0 }]
    },
    parent: { entities: {} },
    G: {
      items: {
        mat: { type: 'weapon', g: 100, grades: [], upgrade: { attack: 1 } },
        bfur: { type: 'material', g: 100 },
        scroll0: { type: 'material', g: 100 }
      },
      craft: {},
      maps: {},
      npcs: {},
      monsters: {}
    }
  };
  const blockedCandidate = {
    candidate: { output: 'goodbow', recipient: 'R1', slot: 'mainhand', improvement: 50 },
    steps: [
      {
        kind: ProductionStepKind.UPGRADE_REQUIRED,
        name: 'mat',
        level: 1,
        fromLevel: 0,
        targetLevel: 1,
        quantity: 1,
        inputQuantity: 1,
        inputMultiplier: 1,
        scrollName: 'scroll0'
      },
      {
        kind: ProductionStepKind.FARM_REQUIRED,
        name: 'bfur',
        level: 0,
        quantity: 1,
        reason: 'NO_BANK_VENDOR_OR_RECIPE_SOURCE'
      }
    ],
    blockers: [
      { reason: 'MATERIAL_MUTATION_REQUIRED', mutation: 'UPGRADE', name: 'mat', level: 1, fromLevel: 0, targetLevel: 1, quantity: 1, inputQuantity: 1, scrollName: 'scroll0' },
      { reason: 'MATERIAL_FARM_REQUIRED', name: 'bfur', level: 0, quantity: 1 }
    ],
    reservations: {},
    totalGold: 0
  };
  const plan = {
    id: 'production-unsafe-chain',
    state: 'BLOCKED',
    reason: 'NO_CURRENTLY_EXECUTABLE_PRODUCTION_CHAIN',
    target: blockedCandidate.candidate,
    steps: blockedCandidate.steps,
    blockers: blockedCandidate.blockers,
    blockedCandidates: [blockedCandidate],
    reservations: {}
  };
  const planner = {
    plan: () => plan,
    planMaterialConsolidation: () => null,
    planExchange: () => null,
    status: () => ({ costStrategy: 'LEAST_GOLD_SOURCE_GRAPH_V3_QUEST_EVENT_PROBABILISTIC' })
  };
  const bankCatalog = {
    observe: () => true,
    needsRefresh: () => false,
    status: () => ({ usable: true, snapshot: { rows: [] } })
  };
  const executor = {
    status: () => ({ enabled: true, busy: false }),
    execute: async () => ({ executed: false, committed: false, reason: 'NOT_EXPECTED' }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({})
  };
  const runtime = {
    root,
    now: () => 1000,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    contentDrift: { requiresRevalidation: () => false },
    merchantTaskCoordinator: coordinator,
    inventoryLedger: { observe: () => ({}), get: () => null, status: () => ({ stale: false }) },
    controlledPartyLogistics: {
      clearProductionMaterialObjective: () => true,
      publishProductionMaterialObjective: () => true
    },
    alpha27CombatMerchantConvergence: {
      merchant: {
        atomic: { merchantBusy: false, serviceTravelBusy: false },
        ensureAutonomousAuthorities: () => true,
        executeEconomyRequest: async () => { captured += 1; return true; }
      }
    },
    _merchantCollectionSessionActive: () => false,
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };

  const controller = installMerchantProduction(runtime, { planner, bankCatalog, executor });
  const decision = controller.cycle();

  assert.equal(decision.state, 'BLOCKED');
  assert.equal(captured, 0);
  assert.equal(coordinator.current(), null);
  assert.equal(runtime.productionMaterialMutationDemand, null);
  assert.equal(controller.status().lastExecution.result.reason, 'PRODUCTION_MUTATION_CHAIN_NOT_COMPLETABLE');
  assert.equal(controller.status().teamMaterialFarmPolicy.mutationExecutions, 0);
});


test('production releases its lease and holds while Merchant workspace reserve is violated', () => {
  const coordinator = new MerchantTaskCoordinator({ now: () => 1000, defaultLeaseMs: 600000 });
  const acquired = coordinator.acquire(
    'PRODUCTION',
    'EXCHANGE_BATCH',
    'production:exchange:anniversarygift:anniversarygift',
    { exchangeItem: 'anniversarygift', target: 'anniversarygift' }
  );
  assert.equal(acquired.acquired, true);

  let plannerCalls = 0;
  const planner = {
    plan() { plannerCalls += 1; throw new Error('production planning must not run while workspace reserve is violated'); },
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
    status: () => ({ enabled: true, busy: false }),
    execute: async () => ({ executed: false, committed: false, reason: 'NOT_EXPECTED' }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({})
  };
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map: 'main',
      x: 0,
      y: 0,
      gold: 2000000,
      isize: 42,
      items: Array.from({ length: 42 }, (_, index) => index < 41 ? { name: 'placeholder', level: 0, q: 1 } : null)
    },
    parent: { entities: {} },
    G: { items: {}, craft: {}, maps: {}, npcs: {}, monsters: {} }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    contentDrift: { requiresRevalidation: () => false },
    merchantTaskCoordinator: coordinator,
    inventoryLedger: {
      observe: () => ({}),
      get: () => null,
      status: () => ({
        stale: false,
        summary: {
          selfInventory: {
            capacity: 42,
            occupied: 41,
            freeSlots: 1,
            workspaceSlots: 3,
            workspaceAvailable: false
          }
        }
      })
    },
    controlledPartyLogistics: {
      clearProductionMaterialObjective: () => true,
      publishProductionMaterialObjective: () => true
    },
    alpha27CombatMerchantConvergence: {
      merchant: {
        atomic: { merchantBusy: false, serviceTravelBusy: false },
        ensureAutonomousAuthorities: () => true,
        executeEconomyRequest: async () => { throw new Error('mutation must not execute'); }
      }
    },
    _merchantCollectionSessionActive: () => false,
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };

  const controller = installMerchantProduction(runtime, { planner, bankCatalog, executor });
  const decision = controller.cycle();

  assert.equal(decision.state, 'HOLD');
  assert.equal(decision.reason, 'MERCHANT_WORKSPACE_RESERVE_REQUIRED');
  assert.equal(decision.workspace.freeSlots, 1);
  assert.equal(decision.workspace.workspaceSlots, 3);
  assert.equal(coordinator.current(), null);
  assert.equal(runtime.productionMaterialMutationDemand, null);
  assert.equal(plannerCalls, 0);
  assert.equal(controller.status().workspaceReserveBlocksProduction, true);
  assert.equal(controller.status().workspaceReserve.violated, true);
});


test('non-retryable Production failure releases its task lease and pauses through quarantine', async () => {
  let now = 1000;
  const coordinator = new MerchantTaskCoordinator({ now: () => now, defaultLeaseMs: 600000 });
  const root = {
    character: {
      name: 'Merchant',
      ctype: 'merchant',
      map: 'bank',
      x: 0,
      y: 0,
      gold: 2000000,
      isize: 42,
      items: [],
      bank: { items0: [{ name: 'mat', level: 0, q: 1 }] }
    },
    parent: { entities: {} },
    G: {
      items: { mat: { type: 'material', g: 100 } },
      craft: {},
      maps: {},
      npcs: {},
      monsters: {}
    }
  };
  const readyPlan = {
    id: 'production-nonretryable-1',
    state: 'READY',
    reason: 'TEST_READY',
    target: { output: 'goodbow', recipient: 'R1', slot: 'mainhand', improvement: 50 },
    nextStep: {
      kind: ProductionStepKind.BANK_RETRIEVE,
      name: 'mat',
      level: 0,
      pack: 'items0',
      bankIndex: 0,
      quantity: 1
    },
    steps: [],
    blockers: [],
    reservations: {}
  };
  const planner = {
    plan: () => readyPlan,
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
    status: () => ({
      enabled: true,
      busy: false,
      failureQuarantineMs: 900000
    }),
    execute: async () => ({
      executed: true,
      committed: false,
      reason: 'EXCHANGE_REJECTED:EXCHANGE_NOT_READY',
      failureClass: 'SERVER_REJECTED',
      retryable: false,
      failureDetails: { responseReason: { code: 'EXCHANGE_NOT_READY' } }
    }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({})
  };
  const runtime = {
    root,
    now: () => now,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    contentDrift: { requiresRevalidation: () => false },
    merchantTaskCoordinator: coordinator,
    inventoryLedger: {
      observe: () => ({}),
      get: () => null,
      status: () => ({ stale: false })
    },
    controlledPartyLogistics: {
      clearProductionMaterialObjective: () => true,
      publishProductionMaterialObjective: () => true
    },
    alpha27CombatMerchantConvergence: {
      merchant: {
        atomic: { merchantBusy: false, serviceTravelBusy: false },
        ensureAutonomousAuthorities: () => true,
        executeEconomyRequest: async () => true
      }
    },
    _merchantCollectionSessionActive: () => false,
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };

  const controller = installMerchantProduction(runtime, {
    planner,
    bankCatalog,
    executor,
    merchantProductionFailureQuarantineMs: 900000
  });

  const decision = controller.cycle();
  assert.equal(decision.state, 'READY');
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(coordinator.current(), null);
  assert.equal(controller.status().lastExecution.result.retryable, false);
  assert.equal(controller.status().lastExecution.result.failureClass, 'SERVER_REJECTED');
  assert.ok(controller.status().pausedUntil >= now + 900000);
  assert.equal(controller.status().failureQuarantineMs, 900000);
});
