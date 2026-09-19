'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantProductionPlanner, ProductionStepKind } = require('../src/merchant/merchant-production-planner');
const { ControlledMerchantProductionExecutor, CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('../src/merchant/controlled-merchant-production-executor');

function baseGameData() {
  return {
    items: {
      stick: { type: 'weapon', attack: 5, class: ['warrior'], g: 20 },
      sword: { type: 'weapon', attack: 25, class: ['warrior'], g: 500 },
      wood: { type: 'material', g: 100 }
    },
    craft: {
      sword: { cost: 250, items: [[2, 'wood', 0]] }
    },
    maps: {},
    npcs: {}
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

function memoryStorage() {
  const values = new Map();
  return {
    get: (key) => values.has(key) ? values.get(key) : null,
    set: (key, value) => { values.set(key, value); return true; }
  };
}

function executor(root, extra = {}) {
  return new ControlledMerchantProductionExecutor({
    root,
    now: extra.now || (() => Date.now()),
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getEconomyEmergency: () => false,
    storage: extra.storage || memoryStorage(),
    goldReserve: 1000,
    verifyDelayMs: 1,
    verifyAttempts: 3
  });
}

test('planner selects a deterministic crafted gear improvement and reserves held materials', () => {
  const gameData = baseGameData();
  const planner = new MerchantProductionPlanner({ now: () => 1000, goldReserve: 1000 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [{ name: 'wood', q: 2 }], bank: {} },
    registry: registry(),
    gameData,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false
  });
  assert.equal(plan.state, 'READY');
  assert.equal(plan.target.output, 'sword');
  assert.equal(plan.target.recipient, 'Farmer');
  assert.equal(plan.nextStep.kind, ProductionStepKind.CRAFT);
  assert.equal(plan.nextStep.name, 'sword');
  assert.equal(plan.reservations['wood|0'], 2);
});

test('production planner rejects Merchant speed gain when it is a net gear regression', () => {
  const gameData = {
    items: {
      currentboots: { type: 'shoes', armor: 1000, speed: 5, class: ['merchant'], g: 1000 },
      tankboots: { type: 'shoes', armor: 100000, speed: 4, class: ['merchant'], g: 1000 },
      swiftboots: { type: 'shoes', armor: 0, speed: 6, class: ['merchant'], g: 1000 },
      wood: { type: 'material', g: 10 }
    },
    craft: {
      tankboots: { cost: 10, items: [[1, 'wood', 0]] },
      swiftboots: { cost: 10, items: [[1, 'wood', 0]] }
    },
    maps: {},
    npcs: {}
  };
  const planner = new MerchantProductionPlanner({ now: () => 1500, goldReserve: 0, minImprovementRatio: 0.01 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [{ name: 'wood', q: 2 }], bank: {} },
    registry: {
      characters: [{
        name: 'Merchant',
        ctype: 'merchant',
        level: 80,
        gear: { shoes: { name: 'currentboots', level: 0 } },
        inventory: []
      }]
    },
    gameData,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false
  });

  assert.equal(plan.state, 'HOLD');
  assert.equal(plan.reason, 'NO_CRAFTED_GEAR_IMPROVEMENT');
});

test('production planner still prefers a Merchant speed gain when weighted gear value is net positive', () => {
  const gameData = {
    items: {
      currentboots: { type: 'shoes', armor: 0, speed: 5, class: ['merchant'], g: 1000 },
      swiftboots: { type: 'shoes', armor: 10, speed: 6, class: ['merchant'], g: 1000 },
      wood: { type: 'material', g: 10 }
    },
    craft: {
      swiftboots: { cost: 10, items: [[1, 'wood', 0]] }
    },
    maps: {},
    npcs: {}
  };
  const planner = new MerchantProductionPlanner({ now: () => 1550, goldReserve: 0, minImprovementRatio: 0.01 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [{ name: 'wood', q: 1 }], bank: {} },
    registry: {
      characters: [{
        name: 'Merchant',
        ctype: 'merchant',
        level: 80,
        gear: { shoes: { name: 'currentboots', level: 0 } },
        inventory: []
      }]
    },
    gameData,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false
  });

  assert.equal(plan.state, 'READY');
  assert.equal(plan.target.output, 'swiftboots');
  assert.equal(plan.target.recipient, 'Merchant');
  assert.equal(plan.target.speedImprovement, 1);
  assert.ok(plan.target.improvement > 0);
  assert.equal(plan.target.improvementReason, 'MERCHANT_SPEED_WEIGHTED_IMPROVEMENT');
});

test('planner uses bank materials before declaring farming required', () => {
  const gameData = baseGameData();
  const planner = new MerchantProductionPlanner({ now: () => 2000, goldReserve: 1000 });
  const plan = planner.plan({
    character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [], bank: { items0: [{ name: 'wood', q: 5 }] } },
    registry: registry(),
    gameData,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false
  });
  assert.equal(plan.state, 'READY');
  assert.equal(plan.nextStep.kind, ProductionStepKind.BANK_RETRIEVE);
  assert.equal(plan.nextStep.pack, 'items0');
  assert.equal(plan.nextStep.bankIndex, 0);
});

test('controlled production requires explicit ACK and exposes scoped buy/bank/craft authority', () => {
  const root = { character: { name: 'Merchant', ctype: 'merchant', gold: 10000, items: [] }, G: baseGameData() };
  const controlled = executor(root);
  controlled.configure({ enabled: true, allowBuy: true, allowBank: true, allowCraft: true, ack: 'wrong' });
  assert.equal(controlled.status().enabled, false);
  controlled.configure({ enabled: true, allowBuy: true, allowBank: true, allowCraft: true, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK });
  const status = controlled.status();
  assert.equal(status.buyAllowed, true);
  assert.equal(status.bankAllowed, true);
  assert.equal(status.craftAllowed, true);
});

test('controlled BUY verifies inventory delta and keeps gold reserve', async () => {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 5000, items: [] },
    G: baseGameData(),
    buy: async (name, quantity) => {
      root.character.gold -= 100 * quantity;
      root.character.items.push({ name, q: quantity, level: 0 });
      return { success: true };
    }
  };
  const controlled = executor(root);
  controlled.configure({ enabled: true, allowBuy: true, allowBank: true, allowCraft: true, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK });
  const step = { kind: ProductionStepKind.BUY, name: 'wood', level: 0, quantity: 2, unitCost: 100 };
  const result = await controlled.execute({ id: 'buy-plan' }, step);
  assert.equal(result.committed, true);
  assert.equal(root.character.items[0].q, 2);
  assert.ok(root.character.gold >= 1000);
});

test('controlled BANK_RETRIEVE verifies bank and inventory deltas', async () => {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 5000, items: [], bank: { items0: [{ name: 'wood', q: 5, level: 0 }] } },
    G: baseGameData(),
    bank_retrieve: async (pack, index) => {
      const item = root.character.bank[pack][index];
      root.character.bank[pack][index] = null;
      root.character.items.push(item);
      return { success: true, place: 'bank', bank_action: 'swap' };
    }
  };
  const controlled = executor(root);
  controlled.configure({ enabled: true, allowBuy: true, allowBank: true, allowCraft: true, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK });
  const step = { kind: ProductionStepKind.BANK_RETRIEVE, name: 'wood', level: 0, quantity: 5, pack: 'items0', bankIndex: 0 };
  const result = await controlled.execute({ id: 'bank-plan' }, step);
  assert.equal(result.committed, true);
  assert.equal(root.character.items[0].name, 'wood');
  assert.equal(root.character.bank.items0[0], null);
});

test('controlled AUTO_CRAFT verifies produced output', async () => {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 5000, items: [{ name: 'wood', q: 2, level: 0 }] },
    G: baseGameData(),
    auto_craft: async (name) => {
      root.character.gold -= 250;
      root.character.items[0] = { name, q: 1, level: 0 };
      return { success: true };
    }
  };
  const controlled = executor(root);
  controlled.configure({ enabled: true, allowBuy: true, allowBank: true, allowCraft: true, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK });
  const step = { kind: ProductionStepKind.CRAFT, name: 'sword', level: 0 };
  const result = await controlled.execute({ id: 'craft-plan' }, step);
  assert.equal(result.committed, true);
  assert.equal(root.character.items[0].name, 'sword');
});
