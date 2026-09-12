'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ControlledMerchantExecutor,
  EconomyTransactionEngine,
  CONTROLLED_MERCHANT_ACK
} = require('../src');

function ledger(entry) {
  return {
    status() { return { stale: false, actionAuthority: false }; },
    get(name, index) {
      return name === entry.character && index === entry.index
        ? { ...entry, actionAuthority: false }
        : null;
    }
  };
}

function character(overrides = {}) {
  return {
    name: 'MerchantA',
    ctype: 'merchant',
    level: 80,
    map: 'bank',
    hp: 1000,
    max_hp: 1000,
    mp: 500,
    max_mp: 500,
    gold: 100,
    rip: false,
    target: null,
    items: [],
    bank: { items0: Array(42).fill(null) },
    ...overrides
  };
}

function root(overrides = {}) {
  const value = {
    character: character(),
    parent: { entities: {} },
    setTimeout,
    clearTimeout,
    ...overrides
  };
  value.globalThis = value;
  return value;
}

function plan(engine, fakeLedger, type, quantity) {
  return engine.plan(
    { type, character: 'MerchantA', index: 0, quantity },
    { ledger: fakeLedger, snapshot: {} }
  );
}

test('Controlled BANK verifies delayed full-stack transfer by identity balances even when inventory compacts', async () => {
  const engine = new EconomyTransactionEngine();
  const fakeLedger = ledger({
    character: 'MerchantA', index: 0, name: 'bankme', level: 0, q: 2, disposition: 'BANK'
  });
  const bank = { items0: Array(42).fill(null) };
  bank.items0[5] = { name: 'bankme', level: 0, q: 3 };
  const game = root({
    character: character({
      items: [{ name: 'bankme', level: 0, q: 2 }, { name: 'other', level: 0, q: 1 }],
      bank
    })
  });
  game.bank_store = async () => {
    game.setTimeout(() => {
      game.character.items[0] = game.character.items[1];
      game.character.items[1] = null;
      game.character.bank.items0[5].q = 5;
    }, 120);
    return { success: true };
  };

  const executor = new ControlledMerchantExecutor({
    root: game,
    engine,
    ledger: fakeLedger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 40,
    verifyAttempts: 8
  });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = plan(engine, fakeLedger, 'BANK', 2);
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(engine.get(planned.transaction.id).state, 'COMMITTED');
  assert.equal(game.character.items[0].name, 'other');
  assert.equal(result.verification.inventoryQuantityBefore, 2);
  assert.equal(result.verification.afterInventoryQuantity, 0);
  assert.equal(result.verification.bankQuantityBefore, 3);
  assert.equal(result.verification.afterBankQuantity, 5);
  assert.ok(executor.status().stats.verificationRetries >= 1);
});

test('Controlled BANK fails safe when inventory decreases but matching bank balance does not increase', async () => {
  const engine = new EconomyTransactionEngine({ failureThreshold: 1, circuitCooldownMs: 5000 });
  const fakeLedger = ledger({
    character: 'MerchantA', index: 0, name: 'bankme', level: 0, q: 1, disposition: 'BANK'
  });
  const game = root({
    character: character({ items: [{ name: 'bankme', level: 0, q: 1 }] })
  });
  game.bank_store = async () => {
    game.character.items[0] = null;
    return { success: true };
  };

  const executor = new ControlledMerchantExecutor({
    root: game,
    engine,
    ledger: fakeLedger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0,
    verifyAttempts: 2
  });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = plan(engine, fakeLedger, 'BANK', 1);
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.committed, false);
  assert.equal(result.reason, 'INVENTORY_DELTA_MISMATCH');
  assert.equal(engine.get(planned.transaction.id).state, 'FAILED_SAFE');
  assert.equal(result.verification.afterInventoryQuantity, 0);
  assert.equal(result.verification.afterBankQuantity, 0);
  assert.equal(result.verification.expectedBankQuantity, 1);
});

test('Controlled SELL verification tolerates inventory slot compaction but requires exact identity quantity decrease', async () => {
  const engine = new EconomyTransactionEngine();
  const fakeLedger = ledger({
    character: 'MerchantA', index: 0, name: 'junk', level: 0, q: 1, disposition: 'SELL'
  });
  const game = root({
    character: character({
      map: 'main',
      bank: undefined,
      items: [{ name: 'junk', level: 0, q: 1 }, { name: 'other', level: 0, q: 1 }],
      gold: 100
    })
  });
  game.sell = async () => {
    game.character.items[0] = game.character.items[1];
    game.character.items[1] = null;
    game.character.gold = 112;
    return { success: true };
  };

  const executor = new ControlledMerchantExecutor({
    root: game,
    engine,
    ledger: fakeLedger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, sell: true, ack: CONTROLLED_MERCHANT_ACK });
  const planned = plan(engine, fakeLedger, 'SELL', 1);
  const result = await executor.execute(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(engine.get(planned.transaction.id).state, 'COMMITTED');
  assert.equal(game.character.items[0].name, 'other');
  assert.equal(result.verification.inventoryQuantityBefore, 1);
  assert.equal(result.verification.afterInventoryQuantity, 0);
  assert.equal(result.verification.afterGold, 112);
});
