'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantSpaceRecoveryJournal } = require('../src/economy/merchant-space-recovery-journal');
const { ControlledBankConsolidationExecutor } = require('../src/economy/controlled-bank-consolidation-executor');
const { ControlledMerchantSpaceRecovery, CONTROLLED_SPACE_RECOVERY_ACK } = require('../src/economy/controlled-merchant-space-recovery');

function memoryStorage() {
  const rows = new Map();
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; }, rows };
}

function childExecutor(executeImpl) {
  let enabled = false;
  return {
    status: () => ({ enabled }),
    configure: (config) => { enabled = config.enabled === true; return { enabled }; },
    disable: () => { enabled = false; return { enabled }; },
    execute: executeImpl || (async () => ({ executed: true, committed: true, reason: 'OK' }))
  };
}

function emergencyPlan() {
  return {
    planned: true,
    action: 'EMERGENCY_RECLAIM',
    reason: 'EMERGENCY_RECLAIM_MINIMAL_SAFE_CANDIDATE',
    destructive: true,
    exactlyOneUnit: true,
    bulkSellForbidden: true,
    reobserveRequiredBeforeNextDecision: true,
    candidate: { character: 'Merchant', index: 0, item: 'slime', level: 0, observedQuantity: 10, protectedMinimumReserve: 0, quantity: 1 }
  };
}

function baseRoot() {
  return {
    character: { name: 'Merchant', ctype: 'merchant', map: 'bank', gold: 10000000, bank: { items0: [null] }, items: [{ name: 'slime', q: 10 }], isize: 4 },
    parent: { entities: {} },
    setTimeout,
    clearTimeout
  };
}

test('Alpha.19 space recovery remains default-off and rejects wrong acknowledgement', () => {
  const root = baseRoot();
  const journal = new MerchantSpaceRecoveryJournal();
  const recovery = new ControlledMerchantSpaceRecovery({
    root, journal, manager: {}, transactionEngine: {}, ledger: {}, controlledMerchant: childExecutor(),
    expansionTransactions: {}, controlledExpansion: childExecutor(), controlledConsolidation: childExecutor(),
    getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  assert.equal(recovery.status().enabled, false);
  assert.equal(recovery.configure({ enabled: true, ack: 'WRONG' }).enabled, false);
  assert.equal(recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK }).enabled, true);
  recovery.disable();
  assert.equal(recovery.status().enabled, false);
});

test('restart moves nonterminal space recovery to RECOVERING and reconcile never blindly retries', () => {
  const storage = memoryStorage();
  let now = 1000;
  const first = new MerchantSpaceRecoveryJournal({ storage, now: () => now });
  const planned = first.plan({ character: 'Merchant', index: 2, item: 'slime' }, { planned: true, action: 'DEPOSIT_FREE_SLOT' });
  assert.equal(planned.accepted, true);
  first.transition(planned.operation.id, 'EXECUTING', 'STARTED');
  first.addEvidence(planned.operation.id, 'RAW_ATTEMPT', { uncertain: true }, 1);
  first.save();

  now += 100;
  const restarted = new MerchantSpaceRecoveryJournal({ storage, now: () => now });
  assert.equal(restarted.load(), true);
  const recovering = restarted.get(planned.operation.id);
  assert.equal(recovering.state, 'RECOVERING');
  assert.equal(recovering.rawActionCount, 1);
  const result = restarted.reconcile(planned.operation.id);
  assert.equal(result.reconciled, true);
  assert.equal(result.operation.state, 'ABORTED');
  assert.match(result.operation.reason, /NO_BLIND_RETRY/);
});

test('controlled consolidation fails closed when no inventory workspace exists', async () => {
  const root = {
    character: {
      name: 'Merchant', ctype: 'merchant', map: 'bank', bank: { items0: [{ name: 'slime', q: 2 }, { name: 'slime', q: 3 }] },
      items: [{ name: 'hpot0', q: 1 }, { name: 'mpot0', q: 1 }], isize: 2
    },
    parent: { entities: {} }, bank_packs: { items0: ['bank', 0, 0] },
    bank_retrieve: async () => ({ success: true }), bank_store: async () => ({ success: true })
  };
  const executor = new ControlledBankConsolidationExecutor({
    root, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getGameData: () => ({ items: { slime: { s: 9999 } } }), verifyDelayMs: 0
  });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute({ action: 'CONSOLIDATE_BANK_STACKS', pack: 'items0', move: { fromIndex: 1, toIndex: 0, name: 'slime', level: 0 } });
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'NO_INVENTORY_WORKSPACE');
  assert.equal(executor.status().stats.rawCalls, 0);
});

test('controlled consolidation uses retrieve then targeted store and verifies exact quantity conservation', async () => {
  const root = {
    character: {
      name: 'Merchant', ctype: 'merchant', map: 'bank', bank: { items0: [{ name: 'slime', q: 2 }, { name: 'slime', q: 3 }, null] },
      items: [null, { name: 'hpot0', q: 1 }], isize: 2
    },
    parent: { entities: {} }, bank_packs: { items0: ['bank', 0, 0] }, setTimeout, clearTimeout
  };
  const calls = [];
  root.bank_retrieve = async (pack, from, inventory) => {
    calls.push(['retrieve', pack, from, inventory]);
    root.character.items[inventory] = root.character.bank[pack][from];
    root.character.bank[pack][from] = null;
    return { success: true, place: 'bank', bank_action: 'retrieve' };
  };
  root.bank_store = async (inventory, pack, target) => {
    calls.push(['store', inventory, pack, target]);
    const item = root.character.items[inventory];
    root.character.bank[pack][target].q += item.q;
    root.character.items[inventory] = null;
    return { success: true, place: 'bank', bank_action: 'store' };
  };
  const executor = new ControlledBankConsolidationExecutor({
    root, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getGameData: () => ({ items: { slime: { s: 9999 } } }), verifyDelayMs: 0
  });
  executor.configure({ enabled: true, ack: 'CONTROLLED_CANARY' });
  const result = await executor.execute({ action: 'CONSOLIDATE_BANK_STACKS', pack: 'items0', move: { fromIndex: 1, toIndex: 0, name: 'slime', level: 0 } });
  assert.equal(result.committed, true);
  assert.equal(result.rawActions, 2);
  assert.deepEqual(calls.map((row) => row[0]), ['retrieve', 'store']);
  assert.equal(root.character.bank.items0[0].q, 5);
  assert.equal(root.character.bank.items0[1], null);
});

test('Emergency reclaim executes exactly one unit and always reobserves before completing', async () => {
  const root = baseRoot();
  let sellCalls = 0;
  let observations = 0;
  const manager = { planSpace: () => emergencyPlan() };
  const journal = new MerchantSpaceRecoveryJournal();
  const txEngine = { plan: (request) => {
    assert.equal(request.type, 'SELL');
    assert.equal(request.quantity, 1);
    return { accepted: true, transaction: { id: 'sell-1' } };
  } };
  const merchant = childExecutor(async () => { sellCalls += 1; root.character.items[0].q -= 1; return { executed: true, committed: true, reason: 'VERIFIED_COMMIT' }; });
  const recovery = new ControlledMerchantSpaceRecovery({
    root, journal, manager, transactionEngine: txEngine, ledger: {}, controlledMerchant: merchant,
    expansionTransactions: {}, controlledExpansion: childExecutor(), controlledConsolidation: childExecutor(),
    getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    observeBank: () => { observations += 1; return { packs: [], totals: { free: 0 } }; }, getGameData: () => ({ items: {} })
  });
  const planned = recovery.plan({ character: 'Merchant', index: 0, item: 'slime', quantity: 10 });
  assert.equal(planned.accepted, true);
  recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK });
  const result = await recovery.execute(planned.operation.id);
  assert.equal(result.committed, true);
  assert.equal(sellCalls, 1);
  assert.ok(observations >= 3);
  const final = journal.get(planned.operation.id);
  assert.equal(final.emergencyReclaimCount, 1);
  assert.equal(final.rawActionCount, 1);
  assert.ok(final.reobservations >= 3);
});

test('Emergency reclaim fresh-plan drift blocks before SELL with zero raw actions', async () => {
  const root = baseRoot();
  let planCalls = 0;
  let sellCalls = 0;
  const manager = {
    planSpace: () => {
      planCalls += 1;
      if (planCalls === 1) return emergencyPlan();
      return { planned: true, action: 'BLOCK_INVENTORY_PRODUCING_WORK', reason: 'STATE_CHANGED', globalBotStop: false };
    }
  };
  const journal = new MerchantSpaceRecoveryJournal();
  const recovery = new ControlledMerchantSpaceRecovery({
    root, journal, manager, transactionEngine: { plan: () => { throw new Error('must not plan SELL'); } }, ledger: {},
    controlledMerchant: childExecutor(async () => { sellCalls += 1; return { executed: true, committed: true }; }),
    expansionTransactions: {}, controlledExpansion: childExecutor(), controlledConsolidation: childExecutor(),
    getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), observeBank: () => ({ packs: [], totals: {} })
  });
  const planned = recovery.plan({ character: 'Merchant', index: 0, item: 'slime' });
  recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK });
  const result = await recovery.execute(planned.operation.id);
  assert.equal(result.blocked, true);
  assert.equal(result.reason, 'EMERGENCY_RECLAIM_FRESH_PLAN_CHANGED');
  assert.equal(sellCalls, 0);
  assert.equal(journal.get(planned.operation.id).rawActionCount, 0);
});

test('No-space terminal block is selective and never a global bot stop', async () => {
  const root = baseRoot();
  const manager = { planSpace: () => ({ planned: true, action: 'BLOCK_INVENTORY_PRODUCING_WORK', reason: 'NO_SAFE_SPACE_RECOVERY_ACTION', globalBotStop: false }) };
  const journal = new MerchantSpaceRecoveryJournal();
  const recovery = new ControlledMerchantSpaceRecovery({
    root, journal, manager, transactionEngine: {}, ledger: {}, controlledMerchant: childExecutor(), expansionTransactions: {},
    controlledExpansion: childExecutor(), controlledConsolidation: childExecutor(), getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }), observeBank: () => ({ packs: [], totals: {} })
  });
  const planned = recovery.plan({ character: 'Merchant', index: 0, item: 'slime' });
  recovery.configure({ enabled: true, ack: CONTROLLED_SPACE_RECOVERY_ACK });
  const result = await recovery.execute(planned.operation.id);
  assert.equal(result.blocked, true);
  assert.equal(result.operation.state, 'BLOCKED');
  assert.equal(result.operation.finalEvidence.globalBotStop, false);
});

test('space recovery circuit opens after bounded failed-safe budget', () => {
  let now = 1000;
  const journal = new MerchantSpaceRecoveryJournal({ now: () => now, failureThreshold: 3, failureWindowMs: 120000 });
  for (let i = 0; i < 3; i += 1) {
    const planned = journal.plan({ character: 'Merchant', index: i, item: `x${i}` }, { planned: true, action: 'DEPOSIT_FREE_SLOT' });
    assert.equal(planned.accepted, true);
    journal.markFailedSafe(planned.operation.id, 'SYNTHETIC_FAILURE');
    now += 10;
  }
  assert.equal(journal.breaker().open, true);
  assert.equal(journal.plan({ character: 'Merchant', index: 9 }, { planned: true, action: 'DEPOSIT_FREE_SLOT' }).accepted, false);
});

test('2500-cycle journal soak stays bounded and preserves one-active-operation dedupe', () => {
  let now = 1000;
  const journal = new MerchantSpaceRecoveryJournal({ now: () => now, capacity: 64, leaseMs: 5000 });
  for (let i = 0; i < 2500; i += 1) {
    const index = i % 8;
    const planned = journal.plan({ character: 'Merchant', index, item: `item${index}` }, { planned: true, action: 'DEPOSIT_FREE_SLOT' });
    assert.equal(planned.accepted, true);
    const duplicate = journal.plan({ character: 'Merchant', index, item: `item${index}` }, { planned: true, action: 'DEPOSIT_FREE_SLOT' });
    assert.equal(duplicate.accepted, false);
    journal.markCommitted(planned.operation.id, 'SOAK_COMMIT');
    now += 2;
  }
  const status = journal.status();
  assert.ok(status.operations <= 64);
  assert.equal(status.active, 0);
  assert.equal(status.reservations, 0);
  assert.equal(status.breaker.open, false);
});
