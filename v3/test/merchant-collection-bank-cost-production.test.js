'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { PersistentBankCatalog } = require('../src/merchant/persistent-bank-catalog');
const { installMerchantProduction } = require('../src/merchant/merchant-production-controller');
const { ControlledPartyLogistics } = require('../src/party/controlled-party-logistics');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeRuntime } = require('./alpha27-convergence-test-helpers');

function memoryStorage() {
  const values = new Map();
  return {
    get: (key) => values.has(key) ? values.get(key) : null,
    set: (key, value) => { values.set(key, value); return true; }
  };
}

function registry() {
  return {
    characters: [{
      name: 'Farmer', ctype: 'warrior', level: 50,
      gear: { mainhand: { name: 'stick', level: 0 } },
      inventory: []
    }]
  };
}

function costGameData(partVendorCost = 100) {
  return {
    items: {
      stick: { type: 'weapon', attack: 1, class: ['warrior'], g: 10 },
      sword: { type: 'weapon', attack: 40, class: ['warrior'], g: 1000 },
      part: { type: 'material', g: partVendorCost },
      wood: { type: 'material', g: 5 }
    },
    craft: {
      sword: { cost: 20, items: [[1, 'part', 0]] },
      part: { cost: 10, items: [[1, 'wood', 0]] }
    },
    npcs: {
      mats: { items: ['part', 'wood'] }
    },
    maps: {
      main: { npcs: [['mats', 0, 0]] }
    }
  };
}

test('production planner chooses a cheaper recipe chain over direct NPC purchase', () => {
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 0 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [], bank: {} },
    registry: registry(),
    gameData: costGameData(100),
    controlledBusy: false,
    inCombat: false,
    economyEmergency: false
  });
  assert.equal(plan.state, 'READY');
  assert.equal(plan.costStrategy, 'LEAST_GOLD_SOURCE_GRAPH_V1');
  assert.equal(plan.steps.some((step) => step.name === 'part' && step.kind === ProductionStepKind.CRAFT && step.reason === 'LEAST_GOLD_RECIPE_SOURCE'), true);
  assert.equal(plan.steps.some((step) => step.name === 'part' && step.kind === ProductionStepKind.BUY), false);
});

test('production planner chooses direct NPC purchase when it is cheaper than recipe chain', () => {
  const gameData = costGameData(8);
  gameData.items.wood.g = 100;
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 0 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [], bank: {} },
    registry: registry(),
    gameData,
    controlledBusy: false,
    inCombat: false,
    economyEmergency: false
  });
  assert.equal(plan.state, 'READY');
  assert.equal(plan.steps.some((step) => step.name === 'part' && step.kind === ProductionStepKind.BUY && step.reason === 'LEAST_GOLD_VENDOR_SOURCE'), true);
});

test('persistent bank catalog survives leaving the bank and feeds production planning', () => {
  let now = 1000;
  const storage = memoryStorage();
  const root = { character: { name: 'Merchant', bank: { items0: [{ name: 'part', level: 0, q: 1 }] } } };
  const catalog = new PersistentBankCatalog({ root, now: () => now, storage });
  assert.equal(catalog.observe(root.character), true);
  assert.equal(catalog.status().usable, true);

  const reloaded = new PersistentBankCatalog({ root: {}, now: () => now + 1000, storage });
  assert.equal(reloaded.status().usable, true);
  const planner = new MerchantProductionPlanner({ now: () => now + 1000, goldReserve: 0 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [] },
    bankCatalog: reloaded.status(),
    registry: registry(),
    gameData: costGameData(100),
    controlledBusy: false,
    inCombat: false,
    economyEmergency: false
  });
  assert.equal(plan.state, 'READY');
  assert.equal(plan.bankSource, 'PERSISTED_BANK_CATALOG');
  assert.equal(plan.nextStep.kind, ProductionStepKind.BANK_RETRIEVE);
  assert.equal(plan.nextStep.name, 'part');
});

test('merchant production auto-enables scoped BUY/BANK/CRAFT authority in active Merchant mode', () => {
  const storage = memoryStorage();
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [], bank: {} },
    G: { items: {}, craft: {}, maps: {}, npcs: {} },
    localStorage: { getItem: storage.get, setItem: storage.set }
  };
  const runtime = {
    root,
    now: () => 1000,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.G },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    characterRegistry: { status: () => ({ characters: [] }) },
    contentDrift: { requiresRevalidation: () => false },
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };
  const controller = installMerchantProduction(runtime, { storage });
  controller.cycle();
  const status = controller.status();
  assert.equal(status.controlled.enabled, true);
  assert.equal(status.controlled.allowBuy, true);
  assert.equal(status.controlled.allowBank, true);
  assert.equal(status.controlled.allowCraft, true);
  assert.equal(status.autoLiveEnabled, true);
});

test('Farmer runtime never acquires Merchant production or BANK_CATALOG work', async () => {
  let now = 1000;
  let taskAcquires = 0;
  let bankTravels = 0;
  const storage = memoryStorage();
  const root = {
    character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', gold: 0, items: [], isize: 42 },
    parent: {},
    G: { items: {}, craft: {}, maps: {}, npcs: {} },
    localStorage: { getItem: storage.get, setItem: storage.set }
  };
  root.parent.character = root.character;
  const coordinator = {
    current: () => null,
    acquire: () => { taskAcquires += 1; return { acquired: true }; },
    release: () => true,
    status: () => ({ activeTask: null })
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
    alpha27CombatMerchantConvergence: {
      atomic: {
        merchantBusy: false,
        serviceTravelBusy: false,
        namedServiceTravel: async () => { bankTravels += 1; return { ok: true }; }
      }
    },
    tick() {},
    status() { return {}; },
    exportDiagnostics() { return '{}'; },
    setMode(mode) { this.adapter.mode = mode; return mode; },
    stop() {},
    _liveEnableGate: () => ({ allowed: true })
  };

  const controller = installMerchantProduction(runtime, { storage, merchantProductionIntervalMs: 1000 });
  const decision = controller.cycle();
  assert.equal(decision.state, 'HOLD');
  assert.equal(decision.reason, 'MERCHANT_PRODUCTION_ROLE_MISMATCH');
  assert.equal(taskAcquires, 0);
  assert.equal(bankTravels, 0);
  assert.equal(controller.status().roleEligible, false);
  assert.equal(controller.status().controlled.enabled, false);

  now = 5000;
  runtime.tick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(taskAcquires, 0);
  assert.equal(bankTravels, 0);
});

test('Farmer progression gear is transferable to the Merchant while bound/special items remain protected', () => {
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.root = {
    G: {
      items: {
        ringsj: { type: 'ring', compound: { dex: 1 } },
        sword: { type: 'weapon', upgrade: { attack: 1 } },
        questgear: { type: 'ring', compound: { dex: 1 }, quest: true }
      }
    }
  };
  logistics.parent = logistics.root;
  assert.equal(logistics._safeLootDescriptor({ name: 'ringsj', level: 1, q: 1 }).ok, true);
  assert.equal(logistics._safeLootDescriptor({ name: 'sword', level: 3, q: 1 }).ok, true);
  assert.equal(logistics._safeLootDescriptor({ name: 'questgear', level: 0, q: 1 }).ok, false);
  assert.equal(logistics._safeLootDescriptor({ name: 'hpot0', level: 0, q: 100 }).ok, false);
});

test('active Farmer collection session blocks economy until inventory is full or Farmers are drained', () => {
  let now = 1000;
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, isize: 4, items: [{ name: 'hpot0', q: 1 }, null, null, null], gold: 2000000 },
    parent: { entities: {} }
  };
  const runtime = makeRuntime({ root, gameData: { items: {}, monsters: {}, maps: {} } });
  runtime.now = () => now;
  runtime.characterRegistry = {
    status: () => ({
      characters: [
        { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: root.character.items },
        { name: 'Farmer', ctype: 'ranger', map: 'main', x: 20, y: 0, inventory: [{ index: 0, name: 'ringsj', level: 0, q: 1 }] }
      ]
    })
  };
  runtime.controlledPartyLogistics = {
    config: { maxTransferDistance: 380 },
    activeLootGrants: new Map(),
    _safeLootDescriptor: (item) => item && item.name === 'ringsj' ? { ok: true } : { ok: false }
  };
  const convergence = new Alpha27CombatMerchantConvergence(runtime, { merchantCollectionSettleMs: 3000 });
  const first = convergence.merchant._updateCollectionSession();
  assert.equal(first.active, true);
  assert.equal(runtime._merchantCollectionSessionActive(), true);

  root.character.items[1] = { name: 'ringsj', level: 0 };
  root.character.items[2] = { name: 'ringsj', level: 0 };
  root.character.items[3] = { name: 'ringsj', level: 0 };
  const full = convergence.merchant._updateCollectionSession();
  assert.equal(full.active, false);
  assert.equal(full.reason, 'MERCHANT_INVENTORY_FULL');
});
