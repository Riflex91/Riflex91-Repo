'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  InventoryLedger,
  ItemDisposition,
  ControlledMerchantExecutor,
  EconomyTransactionEngine,
  CONTROLLED_MERCHANT_ACK
} = require('../src');

function registry(characters) {
  return { characters };
}

function protectedGameData() {
  return {
    items: {
      junk: { type: 'material', s: 999, g: 1 },
      gear: { type: 'ring', g: 100 },
      questitem: { type: 'quest', quest: 'q1', g: 1 },
      exchangeitem: { type: 'gem', e: 1, g: 1 },
      compounditem: { type: 'material', compound: true, g: 1 },
      upgradeitem: { type: 'material', upgrade: { attack: 1 }, g: 1 },
      eventitem: { type: 'material', event: true, g: 1 },
      cashitem: { type: 'material', cash: 1, g: 1 },
      soulbounditem: { type: 'material', soulbound: true, g: 1 }
    }
  };
}

function fakeLedger(entry) {
  return {
    status() { return { stale: false, actionAuthority: false }; },
    get(name, index) {
      return name === entry.character && index === entry.index
        ? { ...entry, actionAuthority: false }
        : null;
    }
  };
}

test('SELL allowlist cannot override protected equipment/quest/exchange/event/cash/soulbound/compound/upgrade metadata', () => {
  const names = [
    'junk', 'gear', 'questitem', 'exchangeitem', 'compounditem',
    'upgradeitem', 'eventitem', 'cashitem', 'soulbounditem'
  ];
  const inventory = names.map((name, index) => ({ index, name, level: 0, q: 1 }));
  const ledger = new InventoryLedger({ sellAllowlist: names });

  ledger.observe({
    registry: registry([{
      name: 'MerchantA', ctype: 'merchant', stateConfidence: 1, inventory
    }]),
    gameData: protectedGameData(),
    liveCharacter: { name: 'MerchantA', isize: inventory.length, items: inventory.map((row) => ({ name: row.name })) }
  });

  assert.equal(ledger.get('MerchantA', 0).disposition, ItemDisposition.SELL);

  for (let index = 1; index < inventory.length; index += 1) {
    const row = ledger.get('MerchantA', index);
    assert.equal(row.disposition, ItemDisposition.UNDECIDED, row.name);
    assert.ok(row.reasons.includes('SELL_ALLOWLIST_PROTECTED'), row.name);
  }

  const status = ledger.status();
  assert.equal(status.policy.sellSafety.allowlistCannotOverride, true);
  assert.deepEqual(status.policy.sellSafety.allowedMetadataTypes, ['material']);
  assert.equal(status.stats.sellProtected, inventory.length - 1);
});

test('Controlled Merchant independently rejects forged protected SELL before calling Adventure Land sell()', async () => {
  const engine = new EconomyTransactionEngine();
  const ledger = fakeLedger({
    character: 'MerchantA', index: 0, name: 'gear', level: 0, q: 1, disposition: 'SELL'
  });
  let sellCalls = 0;
  const root = {
    character: {
      name: 'MerchantA', ctype: 'merchant', isize: 1, items: [{ name: 'gear', level: 0, q: 1 }],
      gold: 100, rip: false
    },
    parent: { entities: {} },
    G: protectedGameData(),
    sell: async () => { sellCalls += 1; return { success: true }; }
  };

  const planned = engine.plan(
    { type: 'SELL', character: 'MerchantA', index: 0, quantity: 1 },
    { ledger, snapshot: {} }
  );
  assert.equal(planned.accepted, true);

  const executor = new ControlledMerchantExecutor({
    root,
    engine,
    ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });

  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.executed, false);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'SELL_ITEM_NOT_LOW_RISK');
  assert.ok(result.sellProtectionReasons.includes('SELL_TYPE_NOT_LOW_RISK'));
  assert.equal(sellCalls, 0);
  assert.equal(executor.status().stats.sellSafetyRejected, 1);
  assert.equal(executor.status().sellSafety.allowlistCannotOverride, true);
});

test('Controlled Merchant still permits an explicitly allowlisted low-risk material and verifies its exact identity delta', async () => {
  const engine = new EconomyTransactionEngine();
  const ledger = fakeLedger({
    character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 2, disposition: 'SELL'
  });
  const root = {
    character: {
      name: 'MerchantA', ctype: 'merchant', isize: 1, items: [{ name: 'junk', q: 2 }],
      gold: 100, rip: false
    },
    parent: { entities: {} },
    G: protectedGameData(),
    sell: async (index, quantity) => {
      root.character.items[index].q -= quantity;
      root.character.gold += 1;
      return { success: true };
    }
  };

  const planned = engine.plan(
    { type: 'SELL', character: 'MerchantA', index: 0, quantity: 1 },
    { ledger, snapshot: {} }
  );
  assert.equal(planned.accepted, true);

  const executor = new ControlledMerchantExecutor({
    root,
    engine,
    ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });

  const result = await executor.execute(planned.transaction.id);
  assert.equal(result.executed, true);
  assert.equal(result.committed, true);
  assert.equal(result.reason, 'VERIFIED_COMMIT');
  assert.equal(result.verification.inventoryQuantityBefore, 2);
  assert.equal(result.verification.afterInventoryQuantity, 1);
  assert.equal(result.verification.expectedInventoryQuantity, 1);
  assert.equal(root.character.gold, 101);
});
