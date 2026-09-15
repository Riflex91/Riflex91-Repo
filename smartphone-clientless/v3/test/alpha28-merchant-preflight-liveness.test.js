'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mutationFixture } = require('./alpha27-convergence-test-helpers');

test('temporary item revalidation defers one reserved mutation instead of hot-looping rejects', async () => {
  const { runtime, convergence, engine, ledger } = mutationFixture('UPGRADE');
  let now = 1000;
  let blocked = true;
  convergence.atomic.now = () => now;
  runtime.contentDrift.requiresRevalidation = (kind, name) => blocked && kind === 'items' && name === 'sword';

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  assert.equal(planned.accepted, true);
  const transactionId = planned.transaction.id;
  const reservationKey = engine.transactions.get(transactionId).reservationKey;

  const first = await convergence._executeAtomic(transactionId);
  assert.equal(first.executed, false);
  assert.equal(first.deferred, true);
  assert.equal(first.reason, 'ITEM_REQUIRES_REVALIDATION');
  assert.equal(first.backoffMs, 1000);
  assert.equal(engine.transactions.get(transactionId).state, 'RESERVED');
  assert.equal(engine.transactions.get(transactionId).lastPreflightReason, 'ITEM_REQUIRES_REVALIDATION');
  assert.equal(engine.reservations.get(reservationKey), transactionId);
  assert.equal(runtime.controlledMerchant.stats.rejected, 1);
  assert.equal(runtime.controlledMerchant.stats.attempts, 0);
  assert.equal(runtime.controlledMerchant.lastAction.reason, 'ITEM_REQUIRES_REVALIDATION');

  const second = await convergence._executeAtomic(transactionId);
  assert.equal(second.executed, false);
  assert.equal(second.reason, 'TRANSACTION_PREFLIGHT_DEFERRED');
  assert.equal(second.blockedReason, 'ITEM_REQUIRES_REVALIDATION');
  assert.equal(runtime.controlledMerchant.stats.rejected, 1);
  assert.equal(runtime.controlledMerchant.stats.attempts, 0);

  blocked = false;
  now = first.retryAt + 1;
  const third = await convergence._executeAtomic(transactionId);
  assert.equal(third.executed, true);
  assert.equal(third.committed, true);
  assert.equal(engine.transactions.get(transactionId).state, 'COMMITTED');
  assert.equal(engine.reservations.has(reservationKey), false);
  assert.equal(runtime.controlledMerchant.stats.attempts, 1);
  assert.equal(runtime.controlledMerchant.status().preflightDeferral.extendsTransactionLease, false);
});

test('stale atomic preflight aborts and releases reservation before any raw mutation', async () => {
  const { runtime, convergence, engine, ledger, root } = mutationFixture('UPGRADE');
  let rawUpgradeCalls = 0;
  root.upgrade = async () => { rawUpgradeCalls += 1; return { success: true }; };
  engine.cancel = function cancel(id, reason) {
    const row = this.transactions.get(String(id));
    if (!row) return { cancelled: false, reason: 'TRANSACTION_NOT_FOUND' };
    row.state = 'ABORTED';
    row.reason = String(reason);
    row.updatedAt = 1000;
    row.leaseExpiresAt = null;
    this._release(row);
    return { cancelled: true, transaction: { ...row } };
  };

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  assert.equal(planned.accepted, true);
  const transactionId = planned.transaction.id;
  const reservationKey = engine.transactions.get(transactionId).reservationKey;
  ledger.entries.get('Merchant:0').name = 'different-item';

  const result = await convergence._executeAtomic(transactionId);
  assert.equal(result.executed, false);
  assert.equal(result.aborted, true);
  assert.equal(result.reason, 'LEDGER_ITEM_IDENTITY_CHANGED');
  assert.equal(engine.transactions.get(transactionId).state, 'ABORTED');
  assert.equal(engine.transactions.get(transactionId).reason, 'PREFLIGHT_ABORTED:LEDGER_ITEM_IDENTITY_CHANGED');
  assert.equal(engine.reservations.has(reservationKey), false);
  assert.equal(runtime.controlledMerchant.stats.rejected, 1);
  assert.equal(runtime.controlledMerchant.stats.attempts, 0);
  assert.equal(rawUpgradeCalls, 0);
});
