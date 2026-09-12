'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha18Runtime,
  BankCapacityManager,
  BankExpansionTransactionEngine,
  ControlledBankExpansionExecutor
} = require('../src');

function storage() {
  const data = new Map();
  return {
    get: (key) => data.get(key),
    set: (key, value) => { data.set(key, value); return true; }
  };
}

function gameData() {
  return {
    monsters: {},
    maps: { main: {}, bank: {} },
    npcs: {},
    skills: {},
    events: {},
    items: {
      scrap: { type: 'material', s: 9999, g: 1 },
      weapon: { type: 'weapon', upgrade: true, wtype: 'sword', g: 1000 }
    }
  };
}

function character(overrides = {}) {
  return {
    name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 1000, rip: false,
    items: [], slots: {}, speed: 40, bank: { items0: [null] },
    ...overrides
  };
}

function root(overrides = {}) {
  const value = {
    character: character(),
    parent: { entities: {}, party: {} },
    G: gameData(),
    bank_packs: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] },
    performance_trick() {}, setTimeout, clearTimeout, setInterval, clearInterval,
    ...overrides
  };
  value.globalThis = value;
  return value;
}

test('Alpha18Runtime installs bank capacity foundation while every new authority remains default-off', () => {
  const r = root();
  const runtime = new Alpha18Runtime({ root: r, parent: r.parent, mode: 'shadow', visibleStatus: false, storage: storage(), bankProtectedGoldReserve: 100 });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.18.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.alpha18.bankCapacityFoundation, true);
  assert.equal(status.alpha18.automaticExpansionEnabled, false);
  assert.equal(status.alpha18.automaticEmergencyReclaimEnabled, false);
  assert.equal(status.economy.bankCapacity.actionAuthority, false);
  assert.equal(status.economy.bankCapacity.destructiveActionAuthority, false);
  assert.equal(status.economy.bankExpansion.transactions.liveExecutionEnabled, false);
  assert.equal(status.economy.bankExpansion.controlled.enabled, false);
  assert.equal(status.economy.bankExpansion.controlled.actionAuthority, false);
  assert.equal(status.alpha18.globalStopOnNoSpace, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('full inventory plus full bank plans safe expansion before any emergency reclaim', () => {
  const manager = new BankCapacityManager({ workspaceSlots: 1, protectedGoldReserve: 100, pressureObservationsRequired: 2 });
  const observation = manager.observe({
    character: character({ gold: 1000, items: new Array(42).fill({ name: 'scrap', q: 1 }), isize: 42, bank: { items0: [{ name: 'weapon' }] } }),
    bankPacks: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] },
    gameData: gameData()
  });
  const ledger = {
    status: () => ({ stale: false }),
    list: () => [{ character: 'MerchantA', index: 0, name: 'scrap', q: 42, level: 0, locked: false, special: false, metadataKnown: true, disposition: 'SELL' }]
  };
  const plan = manager.planSpace({ item: 'scrap', quantity: 1, depositBlocked: true, inventoryFull: true }, {
    observation, gold: 1000, currentMap: 'bank', ledger, gameData: gameData()
  });
  assert.equal(plan.action, 'EXPAND_BANK_PACK');
  assert.equal(plan.pack, 'items2');
  assert.equal(plan.currency, 'gold');
});

function plannedEngine() {
  const engine = new BankExpansionTransactionEngine();
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const result = engine.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation });
  return { engine, transaction: result.transaction };
}

test('bank capacity race fails closed if another actor unlocks the pack before raw action', async () => {
  const { engine, transaction } = plannedEngine();
  let calls = 0;
  const r = root({
    character: character({ bank: { items0: [], items2: new Array(42).fill(null) } }),
    open_bank_pack: async () => { calls += 1; }
  });
  const executor = new ControlledBankExpansionExecutor({
    root: r, engine, manager: new BankCapacityManager(), getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute(transaction.id);
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'BANK_PACK_ALREADY_UNLOCKED');
  assert.equal(calls, 0);
});

test('no funds rejects bank expansion before raw action and preserves the transaction for bounded retry/replan', async () => {
  const { engine, transaction } = plannedEngine();
  let calls = 0;
  const r = root({
    character: character({ gold: 499, bank: { items0: [] } }),
    open_bank_pack: async () => { calls += 1; }
  });
  const executor = new ControlledBankExpansionExecutor({
    root: r, engine, manager: new BankCapacityManager(), getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute(transaction.id);
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'INSUFFICIENT_FUNDS');
  assert.equal(calls, 0);
  assert.equal(engine.get(transaction.id).state, 'RESERVED');
});
