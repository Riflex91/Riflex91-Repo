'use strict';

// Adventure Land in-game inventory storage regression tests. No real-world financial operations.
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ControlledMerchantExecutor,
  EconomyTransactionEngine,
  CONTROLLED_MERCHANT_ACK
} = require('../src');

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

function gameRoot(bankStore) {
  const root = {
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'bank',
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, gold: 100,
      rip: false, target: null,
      items: [{ name: 'bankme', level: 0, q: 1 }],
      bank: { items0: Array(42).fill(null) }
    },
    parent: { entities: {} },
    setTimeout, clearTimeout,
    bank_store: bankStore
  };
  root.globalThis = root;
  return root;
}

function planned(engine, ledger) {
  return engine.plan(
    { type: 'BANK', character: 'MerchantA', index: 0, quantity: 1 },
    { ledger, snapshot: {} }
  );
}

test('explicit Adventure Land bank store acknowledgement commits even when local cache stays stale', async () => {
  const engine = new EconomyTransactionEngine({ failureThreshold: 1, circuitCooldownMs: 5000 });
  const ledger = fakeLedger({
    character: 'MerchantA', index: 0, name: 'bankme', level: 0, q: 1, disposition: 'BANK'
  });
  const root = gameRoot(async () => ({ success: true, place: 'bank', bank_action: 'store' }));
  const executor = new ControlledMerchantExecutor({
    root, engine, ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0,
    verifyAttempts: 3
  });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const tx = planned(engine, ledger);
  const result = await executor.execute(tx.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(result.reason, 'SERVER_ACK_COMMIT');
  assert.equal(engine.get(tx.transaction.id).state, 'COMMITTED');
  assert.equal(result.verification.serverAcknowledged, true);
  assert.equal(result.verification.localObservationConfirmed, false);
  assert.equal(result.verification.commitBasis, 'SERVER_ACK');
  assert.equal(executor.status().stats.bankServerAckCommits, 1);
  assert.equal(executor.status().stats.bankLocalObservationMisses, 1);
  assert.equal(executor.status().stats.failedSafe, 0);
  assert.equal(engine.breaker('BANK').open, false);
});

test('explicit non-store bank response cannot commit even if it is otherwise successful', async () => {
  const engine = new EconomyTransactionEngine({ failureThreshold: 1, circuitCooldownMs: 5000 });
  const ledger = fakeLedger({
    character: 'MerchantA', index: 0, name: 'bankme', level: 0, q: 1, disposition: 'BANK'
  });
  const root = gameRoot(async () => ({ success: true, place: 'bank', bank_action: 'retrieve' }));
  const executor = new ControlledMerchantExecutor({
    root, engine, ledger,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    verifyDelayMs: 0
  });
  executor.configure({ enabled: true, bank: true, ack: CONTROLLED_MERCHANT_ACK });
  const tx = planned(engine, ledger);
  const result = await executor.execute(tx.transaction.id);

  assert.equal(result.committed, false);
  assert.equal(result.reason, 'BANK_SERVER_ACK_INVALID');
  assert.equal(engine.get(tx.transaction.id).state, 'FAILED_SAFE');
  assert.equal(executor.status().stats.bankInvalidServerAcks, 1);
  assert.equal(engine.breaker('BANK').open, true);
});
