'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
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
