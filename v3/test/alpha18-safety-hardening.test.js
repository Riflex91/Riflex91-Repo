'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha18Runtime,
  BankCapacityManager,
  BankExpansionTransactionEngine,
  ControlledBankExpansionExecutor,
  BankSpaceAction,
  packCatalogRow
} = require('../src');

function memoryStorage() {
  const data = new Map();
  return { get: (key) => data.get(key), set: (key, value) => { data.set(key, value); return true; } };
}

function gameData() {
  return {
    monsters: {}, maps: { main: {}, bank: {} }, npcs: {}, skills: {}, events: {},
    items: { weapon: { type: 'weapon', upgrade: true, wtype: 'sword', g: 1000 } }
  };
}

test('unknown or malformed bank-pack costs remain unknown and never become a free expansion', () => {
  assert.equal(packCatalogRow('missing', null).goldCost, null);
  assert.equal(packCatalogRow('short', ['bank']).goldCost, null);
  assert.equal(packCatalogRow('bad', ['bank', 'not-a-number', null]).goldCost, null);

  const manager = new BankCapacityManager({ workspaceSlots: 1, protectedGoldReserve: 0 });
  const observation = manager.observe({
    character: { name: 'MerchantA', map: 'bank', gold: 1000000, bank: { items0: [{ name: 'weapon' }] } },
    bankPacks: { items0: ['bank', 0, 0], items2: ['bank'] },
    gameData: gameData()
  });
  const plan = manager.planSpace({ item: 'anything', depositBlocked: true }, { observation, gold: 1000000, currentMap: 'bank', gameData: gameData() });
  assert.equal(plan.action, BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK);
  assert.equal(plan.globalBotStop, false);
});

test('controlled bank expansion fails safe on a partial local gold delta', async () => {
  const engine = new BankExpansionTransactionEngine();
  const observation = { packs: [{ name: 'items2', unlocked: false, capacity: 0, goldCost: 500, shellCost: 50 }], totals: {} };
  const transaction = engine.plan({ action: 'EXPAND_BANK_PACK', pack: 'items2', map: 'bank', currency: 'gold', cost: 500, protectedReserve: 100 }, { observation }).transaction;
  const root = {
    character: { name: 'MerchantA', ctype: 'merchant', map: 'bank', gold: 1000, bank: { items0: [] } },
    parent: { entities: {} },
    bank_packs: { items2: ['bank', 500, 50] },
    setTimeout, clearTimeout,
    open_bank_pack: async () => {
      root.character.gold = 900;
      root.character.bank.items2 = new Array(42).fill(null);
      return { pack: 'items2', request_id: 'partial-delta-test' };
    }
  };
  const executor = new ControlledBankExpansionExecutor({
    root,
    engine,
    manager: new BankCapacityManager(),
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute(transaction.id);
  assert.equal(result.executed, true);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'BANK_EXPANSION_GOLD_DELTA_INVALID');
  assert.equal(engine.get(transaction.id).state, 'FAILED_SAFE');
});

test('Alpha18 runtime announcements cannot inherit the frozen Alpha.17 version label', () => {
  const messages = [];
  const root = {
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank', x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 1000, rip: false,
      items: [], slots: {}, speed: 40, bank: { items0: [null] }
    },
    parent: { entities: {}, party: {} },
    G: gameData(),
    bank_packs: { items0: ['bank', 0, 0], items2: ['bank', 500, 50] },
    performance_trick() {},
    game_log: (message) => messages.push(String(message)),
    setTimeout, clearTimeout, setInterval, clearInterval
  };
  root.globalThis = root;
  const runtime = new Alpha18Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: memoryStorage() });
  runtime._announce('[AIO v3 3.0.0-alpha.17.0] test', 'ALPHA18_VERSION_TEST');
  assert.equal(messages.length, 1);
  assert.match(messages[0], /3\.0\.0-alpha\.18\.0/);
  assert.doesNotMatch(messages[0], /alpha\.17/);
});
