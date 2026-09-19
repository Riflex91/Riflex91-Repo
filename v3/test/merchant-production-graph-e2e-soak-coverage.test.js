'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  COVERAGE_STATUS,
  ProductionAcquisitionCoverageAudit,
  ProductionGraphSoakAuditor,
  productionGraphCertificationGate
} = require('../src/merchant/production-graph-certification');
const { PersistentProductionIntent } = require('../src/merchant/persistent-production-intent');
const { installMerchantProduction } = require('../src/merchant/merchant-production-controller');

function memoryStorage() {
  const values = new Map();
  return {
    get: (key) => values.has(key) ? values.get(key) : null,
    set: (key, value) => { values.set(key, value); return true; },
    values
  };
}

function gameDataFixture() {
  return {
    items: {
      gearbuy: { type: 'weapon', attack: 10, class: ['ranger'] },
      gearfarm: { type: 'weapon', attack: 11, class: ['ranger'] },
      gearevent: { type: 'weapon', attack: 12, class: ['ranger'] },
      gearquestbad: { type: 'weapon', attack: 13, class: ['ranger'] },
      gearlevel: { type: 'weapon', attack: 14, class: ['ranger'] },
      gearmissing: { type: 'weapon', attack: 15, class: ['ranger'] },
      buywood: { type: 'material', g: 10 },
      farmmat: { type: 'material', g: 1 },
      eventmat: { type: 'material', g: 1 },
      shard: { type: 'material', g: 1 },
      shell: { type: 'material', g: 1, e: 20, quest: 'shells' },
      mutmat: { type: 'material', g: 1 }
    },
    craft: {
      gearbuy: { cost: 1, items: [[1, 'buywood', 0]] },
      gearfarm: { cost: 1, items: [[2, 'farmmat', 0]] },
      gearevent: { cost: 1, items: [[1, 'eventmat', 0]] },
      gearquestbad: { cost: 1, items: [[1, 'shard', 0]] },
      gearlevel: { cost: 1, items: [[1, 'mutmat', 1]] },
      gearmissing: { cost: 1, items: [[1, 'not-in-items', 0]] }
    },
    drops: {
      monsters: {
        goo: [[1, 'farmmat', 1]],
        witch: [[1, 'eventmat', 1]],
        crab: [[1, 'shell', 1]]
      },
      shell: [[1, 'shard', 1]]
    },
    monsters: {
      goo: { hp: 100, attack: 1 },
      witch: { hp: 100, attack: 1 },
      crab: { hp: 100, attack: 1 }
    },
    maps: {
      main: {
        npcs: [{ id: 'materials', position: [0, 0] }],
        monsters: [{ type: 'goo', boundary: [0, 0, 100, 100] }]
      },
      halloween: {
        event: 'halloween',
        monsters: [{ type: 'witch', boundary: [0, 0, 100, 100] }]
      },
      beach: {
        monsters: [{ type: 'crab', boundary: [0, 0, 100, 100] }]
      }
    },
    npcs: {
      materials: { items: ['buywood'] }
    },
    events: {
      halloween: { type: 'seasonal' }
    }
  };
}

function runtimeFor(gameData, extra = {}) {
  return {
    now: () => 1700000000000,
    root: {
      S: extra.serverState || {},
      character: {
        name: 'Merchant',
        ctype: 'merchant',
        gold: 10000000,
        isize: 42,
        items: [],
        bank: {}
      },
      parent: { entities: {} },
      G: gameData
    },
    adapter: { mode: 'active', getGameData: () => gameData },
    world: {
      performance: new Map(),
      fact: () => ({ value: 'APPROVED' })
    },
    contentDrift: extra.contentDrift || { requiresRevalidation: () => false },
    characterRegistry: extra.characterRegistry || { status: () => ({ characters: [] }) }
  };
}

test('coverage audit classifies resolved, temporary and structural acquisition gaps across craft gear', () => {
  const gameData = gameDataFixture();
  const runtime = runtimeFor(gameData, { serverState: {} });
  const audit = new ProductionAcquisitionCoverageAudit(runtime, { fallbackKillsPerHour: 20 });
  const report = audit.auditAllGear();

  assert.equal(report.mode, 'production-acquisition-coverage-audit-v1');
  assert.equal(report.actionAuthority, false);
  assert.equal(report.decisionQuantile, 'P90');
  assert.equal(report.totals.gear, 6);

  const byOutput = new Map(report.rows.map((row) => [row.output, row]));
  assert.equal(byOutput.get('gearbuy').status, COVERAGE_STATUS.FULLY_RESOLVED);
  assert.equal(byOutput.get('gearbuy').children[0].node, 'BUY');
  assert.equal(byOutput.get('gearfarm').status, COVERAGE_STATUS.FULLY_RESOLVED);
  assert.equal(byOutput.get('gearfarm').children[0].decisionQuantile, 'P90');
  assert.equal(byOutput.get('gearevent').status, COVERAGE_STATUS.EVENT_CURRENTLY_INACTIVE);
  assert.equal(byOutput.get('gearquestbad').status, COVERAGE_STATUS.QUEST_DESTINATION_UNVERIFIED);
  assert.equal(byOutput.get('gearlevel').status, COVERAGE_STATUS.MUTATION_UNSUPPORTED);
  assert.equal(byOutput.get('gearmissing').status, COVERAGE_STATUS.MISSING_GAME_DATA);
  assert.equal(report.ready, false);
  assert.ok(report.totals.gaps >= 3);
});

test('coverage audit treats known inactive events as deferred coverage rather than a permanent structural gap', () => {
  const gameData = gameDataFixture();
  gameData.craft = { gearevent: gameData.craft.gearevent };
  gameData.items = {
    gearevent: gameData.items.gearevent,
    eventmat: gameData.items.eventmat
  };
  const runtime = runtimeFor(gameData, { serverState: {} });
  const report = new ProductionAcquisitionCoverageAudit(runtime).auditAllGear();

  assert.equal(report.rows[0].status, COVERAGE_STATUS.EVENT_CURRENTLY_INACTIVE);
  assert.equal(report.totals.temporarilyDeferred, 1);
  assert.equal(report.totals.gaps, 0);
  assert.equal(report.ready, true);
});

test('coverage audit surfaces content drift before declaring a material path resolved', () => {
  const gameData = gameDataFixture();
  gameData.craft = { gearfarm: gameData.craft.gearfarm };
  gameData.items = {
    gearfarm: gameData.items.gearfarm,
    farmmat: gameData.items.farmmat
  };
  const runtime = runtimeFor(gameData, {
    contentDrift: { requiresRevalidation: (kind, name) => kind === 'item' && name === 'farmmat' }
  });
  const report = new ProductionAcquisitionCoverageAudit(runtime).auditAllGear();

  assert.equal(report.rows[0].status, COVERAGE_STATUS.CONTENT_DRIFT);
  assert.equal(report.ready, false);
});

test('5000-sample end-to-end production soak stays invariant-clean and bounded across restart injection', () => {
  const audit = new ProductionGraphSoakAuditor({ capacity: 256, committedCapacity: 300 });

  for (let chain = 0; chain < 1000; chain += 1) {
    const targetIdentity = `gear-${chain}|R1|mainhand`;
    audit.observe({
      phase: 'FARMING_MATERIAL',
      targetIdentity,
      farmDecision: { decisionQuantile: 'P90' },
      farmerProductionObjectives: ['objective-a', 'objective-a', 'objective-a']
    });
    audit.observe({
      phase: 'FARMING_MATERIAL',
      targetIdentity,
      recoveryPending: true,
      gameplayActionExecuted: false,
      farmDecision: { decisionQuantile: 'P90' }
    });
    audit.observe({
      phase: 'MATERIAL_READY_FOR_HANDOFF',
      targetIdentity,
      remainingToFarm: 0,
      farmerCombatActive: false,
      farmerAttackIssued: false,
      farmerProductionObjectives: ['objective-a', 'objective-a', 'objective-a']
    });
    audit.observe({
      phase: 'EXECUTING_CRAFT',
      targetIdentity,
      irreversibleAction: {
        kind: 'CRAFT',
        committed: true,
        idempotencyKey: `craft-${chain}`
      }
    });
    audit.observe({
      phase: 'COMPLETED',
      targetIdentity,
      recipientVerified: true,
      productionTaskActive: false,
      productionObjectiveActive: false,
      exchangeDemandActive: false,
      mutationDemandActive: false
    });
  }

  const status = audit.status();
  assert.equal(status.samples, 5000);
  assert.equal(status.passed, true);
  assert.equal(status.violationCount, 0);
  assert.equal(status.bounded, true);
  assert.ok(status.committedKeysTracked <= 300);
});

test('certification gate requires structural coverage, a clean soak and the minimum sample count', () => {
  const notEnough = productionGraphCertificationGate({
    coverage: { ready: true },
    soak: { passed: true, samples: 4999 },
    minSoakSamples: 5000
  });
  assert.equal(notEnough.ready, false);
  assert.deepEqual(notEnough.reasons, ['PRODUCTION_SOAK_SAMPLE_GATE_NOT_MET']);

  const structuralGap = productionGraphCertificationGate({
    coverage: { ready: false },
    soak: { passed: true, samples: 5000 },
    minSoakSamples: 5000
  });
  assert.equal(structuralGap.ready, false);
  assert.equal(structuralGap.reasons.includes('ACQUISITION_COVERAGE_NOT_READY'), true);

  const ready = productionGraphCertificationGate({
    coverage: { ready: true },
    soak: { passed: true, samples: 5000 },
    minSoakSamples: 5000
  });
  assert.equal(ready.ready, true);
  assert.deepEqual(ready.reasons, []);
  assert.equal(ready.actionAuthority, false);
});

test('soak auditor detects restart replay, split Farmers, handoff combat, inactive events and orphan cleanup', () => {
  const audit = new ProductionGraphSoakAuditor({ capacity: 32 });

  audit.observe({
    phase: 'EXECUTING_BUY',
    targetIdentity: 'gear|R1|mainhand',
    recoveryPending: true,
    gameplayActionExecuted: true,
    irreversibleAction: { kind: 'BUY', committed: true, idempotencyKey: 'op-1' }
  });
  audit.observe({
    phase: 'EXECUTING_BUY',
    targetIdentity: 'gear|R1|mainhand',
    irreversibleAction: { kind: 'BUY', committed: true, idempotencyKey: 'op-1' }
  });
  audit.observe({
    phase: 'FARMING_MATERIAL',
    targetIdentity: 'gear|R1|mainhand',
    farmerProductionObjectives: ['a', 'b'],
    farmDecision: { decisionQuantile: 'EXPECTED' }
  });
  audit.observe({
    phase: 'MATERIAL_READY_FOR_HANDOFF',
    targetIdentity: 'gear|R1|mainhand',
    remainingToFarm: 1,
    farmerCombatActive: true,
    farmerAttackIssued: true
  });
  audit.observe({
    phase: 'EVENT_QUEST_EXECUTING',
    targetIdentity: 'gear|R1|mainhand',
    eventKey: 'halloween',
    eventActive: false
  });
  audit.observe({
    phase: 'COMPLETED',
    targetIdentity: 'gear|R1|mainhand',
    recipientVerified: false,
    productionTaskActive: true,
    productionObjectiveActive: true,
    exchangeDemandActive: true,
    mutationDemandActive: true
  });

  const codes = new Set(audit.status().violations.map((row) => row.code));
  for (const code of [
    'GAMEPLAY_ACTION_DURING_RECOVERY_PENDING',
    'DUPLICATE_IRREVERSIBLE_COMMIT',
    'FARMERS_SPLIT_ACROSS_PRODUCTION_OBJECTIVES',
    'NON_P90_FARM_DECISION',
    'FARMER_COMBAT_DURING_HANDOFF',
    'HANDOFF_WITH_REMAINING_FARM_REQUIREMENT',
    'INACTIVE_EVENT_EXECUTION',
    'COMPLETED_WITHOUT_RECIPIENT_VERIFICATION',
    'ORPHAN_PRODUCTION_TASK_AFTER_COMPLETION',
    'ORPHAN_PRODUCTION_OBJECTIVE_AFTER_COMPLETION',
    'ORPHAN_EXCHANGE_DEMAND_AFTER_COMPLETION',
    'ORPHAN_MUTATION_DEMAND_AFTER_COMPLETION'
  ]) assert.equal(codes.has(code), true, code);
  assert.equal(audit.status().passed, false);
});

test('soak auditor covers every irreversible production family with idempotency keys', () => {
  const audit = new ProductionGraphSoakAuditor();
  for (const [index, kind] of ['BUY', 'CRAFT', 'EXCHANGE', 'UPGRADE', 'COMPOUND', 'TRANSFER'].entries()) {
    audit.observe({
      phase: `EXECUTING_${kind}`,
      targetIdentity: 'gear|R1|mainhand',
      irreversibleAction: { kind, committed: true, idempotencyKey: `${kind}-${index}` }
    });
  }
  audit.observe({
    phase: 'COMPLETED',
    targetIdentity: 'gear|R1|mainhand',
    recipientVerified: true
  });
  assert.equal(audit.status().passed, true);
});

function controllerHarness({ recipientInventory = [], recipientGear = {} } = {}) {
  const storage = memoryStorage();
  let now = 1000;
  const gameData = {
    items: {
      goodbow: { type: 'weapon', attack: 50, class: ['ranger'] }
    },
    craft: {},
    maps: {},
    npcs: {},
    drops: { monsters: {} },
    monsters: {}
  };
  const runtime = runtimeFor(gameData, {
    characterRegistry: {
      status: () => ({
        characters: [{
          name: 'R1',
          ctype: 'ranger',
          gear: recipientGear,
          inventory: recipientInventory
        }]
      })
    }
  });
  runtime.now = () => now;
  runtime.log = { emit() {} };
  runtime.globalSupervisor = { status: () => ({ state: 'HEALTHY' }) };
  runtime._merchantCollectionSessionActive = () => false;
  runtime._liveEnableGate = () => ({ allowed: true });
  runtime.tick = () => {};
  runtime.status = () => ({});
  runtime.exportDiagnostics = () => '{}';
  runtime.setMode = function setMode(mode) { this.adapter.mode = mode; return mode; };
  runtime.stop = () => {};

  const productionIntent = new PersistentProductionIntent({ now: () => now, storage });
  productionIntent.ensureForPlan({
    id: 'plan-goodbow',
    state: 'READY',
    target: { output: 'goodbow', recipient: 'R1', slot: 'mainhand' }
  }, 'OUTPUT_READY_FOR_DELIVERY', {
    reason: 'FINAL_PRODUCTION_OUTPUT_VERIFIED_ON_MERCHANT',
    progress: { outputReady: true, recipientVerified: false }
  });

  let plannerCalls = 0;
  const planner = {
    plan: () => { plannerCalls += 1; return { state: 'HOLD', reason: 'SHOULD_NOT_PLAN_WHILE_DELIVERY_PENDING' }; },
    planMaterialConsolidation: () => null,
    planExchange: () => null,
    status: () => ({})
  };
  const executor = {
    status: () => ({ enabled: true, busy: false, activeOperation: null }),
    execute: async () => ({ executed: false, committed: false }),
    configure: () => {},
    disable: () => {},
    reconcile: () => ({ reconciled: false })
  };
  const controller = installMerchantProduction(runtime, {
    storage,
    productionIntent,
    planner,
    executor,
    bankCatalog: {
      observe: () => true,
      needsRefresh: () => false,
      status: () => ({ usable: true, snapshot: { rows: [] } })
    }
  });
  return { runtime, controller, productionIntent, plannerCalls: () => plannerCalls, setNow: (value) => { now = value; } };
}

test('final craft stays OUTPUT_READY_FOR_DELIVERY until intended Farmer receipt is observable', () => {
  const pending = controllerHarness();
  const first = pending.controller.cycle();

  assert.equal(first.state, 'HOLD');
  assert.equal(first.reason, 'PRODUCTION_OUTPUT_AWAITING_RECIPIENT_DELIVERY');
  assert.equal(pending.productionIntent.status().active.phase, 'OUTPUT_READY_FOR_DELIVERY');
  assert.equal(pending.plannerCalls(), 0);
});

test('recipient inventory settlement completes production before another plan can start', () => {
  const settled = controllerHarness({
    recipientInventory: [{ name: 'goodbow', level: 0, q: 1 }]
  });
  const result = settled.controller.cycle();

  assert.equal(result.state, 'HOLD');
  assert.equal(result.reason, 'FINAL_PRODUCTION_RECIPIENT_VERIFIED');
  assert.equal(result.delivery.verified, true);
  assert.equal(result.delivery.reason, 'RECIPIENT_INVENTORY_VERIFIED');
  assert.equal(settled.productionIntent.status().active, null);
  assert.equal(settled.productionIntent.status().history.at(-1).phase, 'COMPLETED');
  assert.equal(settled.productionIntent.status().history.at(-1).reason, 'FINAL_PRODUCTION_RECIPIENT_VERIFIED');
  assert.equal(settled.plannerCalls(), 0);
});

test('controller exposes on-demand coverage audit and actionless soak observation APIs', () => {
  const harness = controllerHarness();
  const coverage = harness.controller.auditProductionCoverage();
  const soak = harness.controller.observeProductionSoakSample({
    phase: 'FARMING_MATERIAL',
    targetIdentity: 'goodbow|R1|mainhand',
    farmDecision: { decisionQuantile: 'P90' }
  });

  assert.equal(coverage.actionAuthority, false);
  assert.equal(soak.actionAuthority, false);
  assert.equal(harness.runtime.auditProductionCoverage instanceof Function, true);
  assert.equal(harness.runtime.observeProductionSoakSample instanceof Function, true);
  assert.equal(harness.runtime.productionCertificationGate instanceof Function, true);
  assert.equal(harness.controller.status().teamMaterialFarmPolicy.finalCraftCompletionRequiresRecipientVerification, true);
  assert.equal(harness.controller.productionCertificationGate().ready, false);
  assert.equal(harness.controller.productionCertificationGate().reasons.includes('PRODUCTION_SOAK_SAMPLE_GATE_NOT_MET'), true);
});


test('production soak audit persists bounded restart state and restores committed idempotency history', () => {
  const storage = memoryStorage();
  const first = new ProductionGraphSoakAuditor({
    storage,
    storageKey: 'production-soak-test',
    capacity: 128,
    committedCapacity: 128,
    persistEvery: 1
  });
  first.observe({
    phase: 'EXECUTING_CRAFT',
    targetIdentity: 'goodbow|R1|mainhand',
    irreversibleAction: { kind: 'CRAFT', committed: true, idempotencyKey: 'craft-op-1' }
  });

  const restored = new ProductionGraphSoakAuditor({
    storage,
    storageKey: 'production-soak-test',
    capacity: 128,
    committedCapacity: 128,
    persistEvery: 1
  });
  assert.equal(restored.status().samples, 1);
  assert.equal(restored.status().committedKeysTracked, 1);
  assert.equal(restored.status().persistence.loads, 1);

  restored.observe({
    phase: 'EXECUTING_CRAFT',
    targetIdentity: 'goodbow|R1|mainhand',
    irreversibleAction: { kind: 'CRAFT', committed: true, idempotencyKey: 'craft-op-1' }
  });
  assert.equal(restored.status().violations.some((row) => row.code === 'DUPLICATE_IRREVERSIBLE_COMMIT'), true);
});

test('merchant production cycle automatically feeds real runtime soak without changing log behavior', () => {
  const harness = controllerHarness();
  const before = harness.runtime.productionRealSoakStatus();
  assert.equal(before.mode, 'production-real-soak-runtime-observer-v1');
  assert.equal(before.actionAuthority, false);
  assert.equal(before.logsModified, false);
  assert.equal(before.audit.samples, 0);

  const result = harness.controller.cycle();
  const after = harness.runtime.productionRealSoakStatus();

  assert.equal(result.reason, 'PRODUCTION_OUTPUT_AWAITING_RECIPIENT_DELIVERY');
  assert.equal(after.autoObservation, true);
  assert.equal(after.logsModified, false);
  assert.equal(after.audit.samples, 1);
  assert.equal(after.lastSample.source, 'REAL_RUNTIME');
  assert.equal(after.lastSample.targetIdentity, 'goodbow|R1|mainhand');
  assert.equal(after.coverage.reason, undefined);
  assert.equal(harness.runtime.productionRealSoakStatus instanceof Function, true);
});
