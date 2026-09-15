'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeEngine, makeControlledMerchant, makeLedger, makeRuntime, mutationFixture } = require('./alpha27-convergence-test-helpers');

test('real upgrade() executes once and commits only after observed item+scroll delta', async () => {
  const { convergence, engine, ledger } = mutationFixture('UPGRADE');
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'SUCCESS');
  assert.equal(engine.transactions.get(planned.transaction.id).state, 'COMMITTED');
});

test('upgrade travels to the named upgrade service before invoking raw upgrade()', async () => {
  const { convergence, engine, ledger, root } = mutationFixture('UPGRADE');
  const order = [];
  root.smart_move = async (destination) => { order.push(`travel:${destination}`); return { success: true }; };
  const baseUpgrade = root.upgrade;
  root.upgrade = async (...args) => { order.push('upgrade'); return baseUpgrade(...args); };
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.deepEqual(order.slice(0, 2), ['travel:upgrade', 'upgrade']);
  assert.equal(convergence.stats.namedServiceTravels, 1);
});

test('compound travels to the named compound service before invoking raw compound()', async () => {
  const { convergence, engine, ledger, root } = mutationFixture('COMPOUND');
  const order = [];
  root.smart_move = async (destination) => { order.push(`travel:${destination}`); return { success: true }; };
  const baseCompound = root.compound;
  root.compound = async (...args) => { order.push('compound'); return baseCompound(...args); };
  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.deepEqual(order.slice(0, 2), ['travel:compound', 'compound']);
  assert.equal(convergence.stats.namedServiceTravels, 1);
});

test('failed mutation service travel fail-closes transaction without invoking raw upgrade()', async () => {
  const { convergence, engine, ledger, root } = mutationFixture('UPGRADE');
  let upgradeCalls = 0;
  root.smart_move = async () => ({ failed: true, reason: 'UPGRADE_SERVICE_UNREACHABLE' });
  root.upgrade = async () => { upgradeCalls += 1; return { success: true }; };
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, false);
  assert.equal(upgradeCalls, 0);
  assert.equal(engine.transactions.get(planned.transaction.id).state, 'FAILED_SAFE');
  assert.equal(engine.reservations.size, 0);
});

test('verified failed upgrade roll commits as game outcome instead of opening failure circuit', async () => {
  const { convergence, engine, ledger } = mutationFixture('UPGRADE', { failedRoll: true });
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'FAILED_ROLL_ITEM_SURVIVED');
  assert.equal(engine.stats.failedSafe, 0);
});

test('missing upgrade scroll is safely purchased with reserve protection before real upgrade()', async () => {
  const { convergence, engine, ledger } = mutationFixture('UPGRADE', { missingScroll: true });
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(convergence.stats.scrollPurchases, 1);
});

test('real compound() uses exactly three reserved inputs and commits after verified delta', async () => {
  const { convergence, engine, ledger, root } = mutationFixture('COMPOUND');
  let calls = 0;
  const base = root.compound;
  root.compound = async (...args) => { calls += 1; assert.deepEqual(args, [0, 1, 2, 3]); return base(...args); };
  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'SUCCESS');
  assert.equal(calls, 1);
  assert.equal(engine.reservations.size, 0);
});

test('verified failed compound roll is terminal and never blind-retried inside transaction', async () => {
  const { convergence, engine, ledger } = mutationFixture('COMPOUND', { failedRoll: true });
  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'FAILED_ROLL_INPUTS_CONSUMED');
  assert.equal(engine.stats.failedSafe, 0);
});

test('gear-goal delivery is the only non-potion Merchant service transfer Alpha27 authorizes', async () => {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 2000000, items: [{ name: 'blade', level: 0 }], map: 'main', x: 0, y: 0 },
    parent: { entities: { farmer: { name: 'Farmer', map: 'main', x: 10, y: 0 } } }
  };
  root.send_item = async () => { root.character.items[0] = null; return { success: true }; };
  const service = {
    enabled: true, busy: false, allowStand: true, allowDelivery: true, activeOperation: null, actionTimes: [],
    stats: { rawActions: 0, deliveries: 0, failedSafe: 0, recovered: 0, committed: 0 },
    _trusted: (name) => name === 'Farmer',
    _visibleTarget: (name) => Object.values(root.parent.entities).find((x) => x.name === name) || null,
    _distanceTo: () => 10,
    _startOperation(plan, data) { this.activeOperation = { ...data, id: plan.id, state: 'RESERVED' }; return true; },
    _transition(state, reason) { this.activeOperation.state = state; this.activeOperation.reason = reason; },
    _timeout(promise) { return Promise.resolve(promise); },
    _verify(fn) { return Promise.resolve(fn()); },
    _commit(kind, reason, extra) { this.activeOperation.state = 'COMMITTED'; this.stats.committed += 1; return { executed: true, committed: true, reason, ...extra }; },
    _failed(kind, reason, extra) { this.activeOperation.state = 'FAILED_SAFE'; this.stats.failedSafe += 1; return { executed: true, committed: false, reason, ...extra }; },
    async _executeDelivery(plan) { return { executed: false, committed: false, reason: 'BASE_NON_POTION_REJECT' }; },
    reconcile() { return { reconciled: false }; },
    status() { return { enabled: true, busy: this.busy, rawActionFamilies: ['SEND_POTION'] }; }
  };
  const goal = { id: 'gear-1', sourceCharacter: 'Merchant', character: 'Farmer', item: 'blade', observedLevel: 0, targetLevel: 0, projectedUpgradeRequired: false };
  const runtime = makeRuntime({ root, service, gearGoals: [goal], gameData: { items: { blade: { g: 1000 } }, monsters: {}, maps: { main: {} } } });
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  const result = await service._executeDelivery({
    id: 'd1', kind: 'SERVICE_DELIVERY', sourceReportAt: 1000, target: { name: 'Farmer' },
    delivery: { itemName: 'blade', quantity: 1 }, metadata: { alpha27GearGoal: 'gear-1', itemLevel: 0 }
  });
  assert.equal(result.committed, true);
  assert.equal(convergence.stats.gearDeliveriesCommitted, 1);
  const rejected = await service._executeDelivery({ id: 'd2', kind: 'SERVICE_DELIVERY', sourceReportAt: 1001, target: { name: 'Farmer' }, delivery: { itemName: 'mystery', quantity: 1 }, metadata: {} });
  assert.equal(rejected.committed, false);
  assert.equal(rejected.reason, 'DELIVERY_ITEM_NOT_AUTHORIZED');
});

test('party potion restock preserves configured gold reserve and verifies purchased quantity', async () => {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 1100000, items: [], map: 'main' },
    parent: { entities: {} }
  };
  root.can_buy = () => true;
  root.buy = async (name, q) => { root.character.gold -= q * 100; root.character.items[0] = { name, level: 0, q }; return { success: true }; };
  const runtime = makeRuntime({ root, gameData: { items: { hpot0: { g: 100 } }, monsters: {}, maps: { main: {} } } });
  runtime.lastMerchantServicePlan = { kind: 'RESTOCK_REQUIRED', need: { family: 'hp', preferred: 'hpot0' } };
  runtime.merchantServicePlanner = { targetPotionCount: 240, merchantPotionReserve: 80 };
  const convergence = new Alpha27CombatMerchantConvergence(runtime, { merchantPotionTarget: 500, merchantMaxPotionBuy: 500, goldReserve: 1000000, verifyAttempts: 1 });
  const acted = await convergence._restockPartyPotions();
  assert.equal(acted, true);
  assert.equal(root.character.items[0].q, 500);
  assert.equal(root.character.gold, 1050000);
  assert.equal(convergence.stats.potionRestocks, 1);
});

test('mutation risk budget prevents rapid repeated upgrade attempts for the same item level', async () => {
  const { convergence, engine, ledger } = mutationFixture('UPGRADE');
  for (let i = 0; i < 3; i += 1) engine.transactions.set(`history-${i}`, { id: `history-${i}`, type: 'UPGRADE', state: 'COMMITTED', character: 'Merchant', index: 0, item: 'sword', level: 0, attemptedAt: 900 + i });
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'MUTATION_RISK_BUDGET_EXHAUSTED');
});

test('ambiguous no-retry mutation blocks autonomous replanning of the same inventory slot', () => {
  const { convergence, engine } = mutationFixture('UPGRADE');
  engine.transactions.set('uncertain', { id: 'uncertain', type: 'UPGRADE', state: 'FAILED_SAFE', character: 'Merchant', index: 0, item: 'sword', level: 0, reason: 'UPGRADE_DELTA_NOT_OBSERVED_NO_RETRY' });
  assert.equal(convergence._planUpgrade(), null);
});

test('restart reconciliation commits an atomic mutation only when persisted pre-action deltas prove the outcome', () => {
  const { convergence, engine, ledger, root } = mutationFixture('UPGRADE');
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const row = engine.transactions.get(planned.transaction.id);
  row.preAction = { baseLevelQuantity: 1, nextLevelQuantity: 0, scrollQuantity: 1 };
  row.mutationScroll = 'scroll0';
  row.state = 'RECOVERING';
  root.character.items[0] = { name: 'sword', level: 1 };
  root.character.items[1] = null;
  const result = engine.reconcileAtomic(row.id);
  assert.equal(result.reconciled, true);
  assert.equal(result.committed, true);
  assert.equal(result.outcome, 'SUCCESS');
  assert.equal(engine.transactions.get(row.id).state, 'COMMITTED');
  assert.equal(convergence.stats.restartAtomicTransactionsAborted, 0);
});
