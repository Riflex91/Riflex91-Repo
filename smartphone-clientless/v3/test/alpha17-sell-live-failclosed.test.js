'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha17Runtime,
  ControlledMerchantExecutor,
  EconomyTransactionEngine,
  CONTROLLED_MERCHANT_ACK
} = require('../src');

function storage() { return { get: () => null, set() {} }; }

function character(items) {
  return {
    name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main',
    x: 0, y: 0, real_x: 0, real_y: 0,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    xp: 0, gold: 100, rip: false, target: null,
    isize: items.length, items, slots: {}, speed: 40
  };
}

function baseGameData(items) {
  return { monsters: {}, maps: { main: {} }, npcs: {}, items, skills: {}, events: {} };
}

function rootWith({ items, rootItems, parentItems = null, sell }) {
  const rootGameData = baseGameData(rootItems);
  const parentGameData = parentItems == null ? rootGameData : baseGameData(parentItems);
  const root = {
    character: character(items),
    G: rootGameData,
    parent: { entities: {}, party: {}, G: parentGameData },
    performance_trick() {},
    setTimeout, clearTimeout, setInterval, clearInterval,
    sell
  };
  root.globalThis = root;
  return root;
}

function forgedLedger(entry) {
  return {
    status() { return { stale: false, actionAuthority: false }; },
    get(name, index) {
      return name === entry.character && index === entry.index
        ? { ...entry, actionAuthority: false }
        : null;
    }
  };
}

function plannedSell(engine, ledger, item = 'junk') {
  return engine.plan(
    { type: 'SELL', character: 'MerchantA', index: 0, quantity: 1 },
    { ledger, snapshot: {} }
  );
}

test('Alpha17 public policy path keeps live shoes out of SELL even when root metadata falsely looks like a material', () => {
  const root = rootWith({
    items: [{ name: 'shoes', level: 0 }],
    rootItems: { shoes: { type: 'material', s: 999, g: 1 } },
    parentItems: {
      shoes: {
        type: 'shoes', g: 1, scroll: true, tier: 1,
        grades: [0, 1, 2, 3], upgrade: { armor: 1 }
      }
    }
  });
  const runtime = new Alpha17Runtime({ root, parent: root.parent, mode: 'shadow', visibleStatus: false, storage: storage() });

  runtime.tick();
  const policy = runtime.configureInventoryActionPolicy({ sell: ['shoes'] });
  const row = runtime.inventoryLedger.get('MerchantA', 0);

  assert.equal(policy.sellSafety.policy, 'plain-stackable-material-only');
  assert.equal(policy.sellSafetyResolver, 'ENABLED');
  assert.ok(row);
  assert.equal(row.disposition, 'UNDECIDED');
  assert.ok(row.reasons.includes('SELL_ALLOWLIST_PROTECTED'));
  assert.ok(row.reasons.includes('SELL_METADATA_CONFLICT'));
  assert.ok(row.reasons.includes('SELL_RAW_LEVELLED_ITEM_PROTECTED'));
  assert.equal(runtime.status().economy.liveEnabled, false);
});

test('Controlled SELL rejects a levelled raw item even when every metadata source claims a safe material', async () => {
  let sellCalls = 0;
  const safeMeta = { junk: { type: 'material', s: 999, g: 1 } };
  const root = rootWith({
    items: [{ name: 'junk', level: 0, q: 1 }],
    rootItems: safeMeta,
    parentItems: safeMeta,
    sell: async () => { sellCalls += 1; return { success: true }; }
  });
  const engine = new EconomyTransactionEngine();
  const ledger = forgedLedger({ character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 1, disposition: 'SELL' });
  const planned = plannedSell(engine, ledger);
  assert.equal(planned.accepted, true);

  const executor = new ControlledMerchantExecutor({
    root, engine, ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.executed, false);
  assert.equal(result.reason, 'SELL_ITEM_NOT_LOW_RISK');
  assert.ok(result.sellProtectionReasons.includes('SELL_RAW_LEVELLED_ITEM_PROTECTED'));
  assert.equal(sellCalls, 0);
});

test('Controlled SELL rejects conflicting root and parent metadata before sell()', async () => {
  let sellCalls = 0;
  const root = rootWith({
    items: [{ name: 'junk', q: 1 }],
    rootItems: { junk: { type: 'material', s: 999, g: 1 } },
    parentItems: { junk: { type: 'shoes', scroll: true, tier: 1, upgrade: { armor: 1 }, g: 1 } },
    sell: async () => { sellCalls += 1; return { success: true }; }
  });
  const engine = new EconomyTransactionEngine();
  const ledger = forgedLedger({ character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 1, disposition: 'SELL' });
  const planned = plannedSell(engine, ledger);

  const executor = new ControlledMerchantExecutor({
    root, engine, ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.executed, false);
  assert.equal(result.reason, 'SELL_ITEM_NOT_LOW_RISK');
  assert.ok(result.sellProtectionReasons.includes('SELL_METADATA_CONFLICT'));
  assert.equal(sellCalls, 0);
});

test('Controlled SELL still permits one plain stackable material with matching metadata and no raw level field', async () => {
  let sellCalls = 0;
  const sharedItems = { junk: { type: 'material', s: 999, g: 1 } };
  const root = rootWith({
    items: [{ name: 'junk', q: 2 }],
    rootItems: sharedItems,
    parentItems: sharedItems,
    sell: async (index, quantity) => {
      sellCalls += 1;
      root.character.items[index].q -= quantity;
      root.character.gold += 1;
      return { success: true };
    }
  });
  const engine = new EconomyTransactionEngine();
  const ledger = forgedLedger({ character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 2, disposition: 'SELL' });
  const planned = plannedSell(engine, ledger);

  const executor = new ControlledMerchantExecutor({
    root, engine, ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.executed, true);
  assert.equal(result.committed, true);
  assert.equal(result.reason, 'VERIFIED_COMMIT');
  assert.equal(sellCalls, 1);
  assert.equal(root.character.items[0].q, 1);
});
