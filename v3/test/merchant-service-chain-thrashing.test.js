'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha27MerchantAutonomy } = require('../src/reliability/alpha27-merchant-autonomy');

function fixture({ now = 10000, plan = null, active = null, cancelResult = { cancelled: true } } = {}) {
  let cancelled = null;
  let executed = 0;
  let lowRiskPlans = 0;
  const runtime = {
    root: { character: { name: 'Merchant', ctype: 'merchant', map: 'bank', bank: {}, items: [] }, parent: { entities: {} } },
    now: () => now,
    log: { emit() {} },
    lastMerchantServicePlan: plan,
    gearProgression: { list: () => [] },
    transactionEngine: {
      cancel(id, reason) { cancelled = { id, reason }; return cancelResult; },
      breaker: () => ({ open: false })
    },
    planEconomyTransaction: () => ({ accepted: true, transaction: { id: 'bank-new', type: 'BANK' } })
  };
  const atomic = {
    merchantActive: () => true,
    supervisorAllowed: () => true,
    merchantInCombat: () => false,
    merchantBusy: false,
    serviceTravelBusy: false,
    status: () => ({}),
    namedServiceTravel: async () => true
  };
  const autonomy = new Alpha27MerchantAutonomy(runtime, atomic, {
    now: runtime.now,
    log: runtime.log,
    options: { merchantIntervalMs: 1200, gearDeliveryDistance: 400 },
    stats: { autonomousMerchantCycles: 0, autonomousMerchantHolds: 0, autonomousMerchantPlans: 0, failedSafe: 0 }
  });
  runtime.controlledMerchant = {
    execute: async () => { executed += 1; return { executed: true, committed: true }; }
  };
  autonomy.ensureAutonomousAuthorities = () => true;
  autonomy.reconcileRecovering = () => false;
  autonomy.activeTransaction = () => active;
  autonomy.restockPartyPotions = async () => false;
  autonomy.planUpgrade = () => null;
  autonomy.planCompound = () => null;
  autonomy.planSellOrBank = () => { lowRiskPlans += 1; return { type: 'BANK', character: 'Merchant', index: 0, quantity: 1 }; };
  autonomy.ensureStandClosed = async () => true;
  autonomy.deliverGearGoal = async () => false;
  return {
    runtime,
    autonomy,
    get cancelled() { return cancelled; },
    get executed() { return executed; },
    get lowRiskPlans() { return lowRiskPlans; }
  };
}

function adaptivePlan(kind, at = 9950) {
  return {
    at,
    kind,
    reason: kind === 'RESTOCK_REQUIRED' ? 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED' : 'MERCHANT_ADAPTIVE_POTION_TRAVEL_READY',
    target: { name: 'Ranger1', map: 'main', x: -1100, y: 900 },
    deliveries: [{ family: 'mp', itemName: 'mpot0', quantity: 1064 }],
    metadata: { p0PotionPolicy4500: true, adaptivePotionDelivery: true }
  };
}

test('fresh adaptive potion travel blocks ordinary bank planning until delivery chain finishes', async () => {
  const f = fixture({ plan: adaptivePlan('SERVICE_TRAVEL') });
  assert.equal(await f.autonomy.cycle(), false);
  assert.equal(f.lowRiskPlans, 0);
  assert.equal(f.executed, 0);
  assert.equal(f.autonomy.lastMerchantPlan.reason, 'PARTY_SUPPLY_SERVICE_CHAIN_ACTIVE');
  assert.equal(f.autonomy.lastMerchantPlan.serviceKind, 'SERVICE_TRAVEL');
  assert.equal(f.autonomy.stats.partySupplyServiceChainHolds, 1);
});

test('fresh adaptive potion delivery safely releases a merely reserved bank transaction', async () => {
  const active = { id: 'bank-reserved', type: 'BANK', state: 'RESERVED' };
  const f = fixture({ plan: adaptivePlan('SERVICE_DELIVERY'), active });
  assert.equal(await f.autonomy.cycle(), false);
  assert.deepEqual(f.cancelled, { id: 'bank-reserved', reason: 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT' });
  assert.equal(f.executed, 0);
  assert.equal(f.lowRiskPlans, 0);
  assert.equal(f.autonomy.stats.partySupplyLowRiskPreemptions, 1);
  assert.equal(f.autonomy.lastMerchantPlan.reason, 'PARTY_SUPPLY_SERVICE_CHAIN_ACTIVE');
  const status = f.autonomy.status();
  assert.equal(status.partySupplyLowRiskPreemptions, 1);
  assert.equal(status.partySupplyPreemptionFailures, 0);
});

test('rejected low-risk cancellation fails closed and never executes the competing bank transaction', async () => {
  const active = { id: 'bank-reserved', type: 'BANK', state: 'RESERVED' };
  const f = fixture({
    plan: adaptivePlan('SERVICE_DELIVERY'),
    active,
    cancelResult: { cancelled: false, reason: 'TRANSACTION_ALREADY_TERMINAL' }
  });
  assert.equal(await f.autonomy.cycle(), false);
  assert.deepEqual(f.cancelled, { id: 'bank-reserved', reason: 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT' });
  assert.equal(f.executed, 0);
  assert.equal(f.lowRiskPlans, 0);
  assert.equal(f.autonomy.stats.partySupplyLowRiskPreemptions || 0, 0);
  assert.equal(f.autonomy.stats.partySupplyPreemptionFailures, 1);
  assert.equal(f.autonomy.lastMerchantPlan.reason, 'PARTY_SUPPLY_SERVICE_CHAIN_ACTIVE');
  const status = f.autonomy.status();
  assert.equal(status.partySupplyPreemptionFailures, 1);
  assert.equal(status.criticalPartySupplyChainAtomicAcrossRestockTravelDelivery, true);
});

test('stale adaptive potion plan cannot hold economy forever', async () => {
  const f = fixture({ now: 30000, plan: adaptivePlan('SERVICE_TRAVEL', 1000) });
  assert.equal(await f.autonomy.cycle(), true);
  assert.equal(f.lowRiskPlans, 1);
  assert.equal(f.executed, 1);
  assert.equal(f.autonomy.lastMerchantPlan.type, 'BANK');
});
