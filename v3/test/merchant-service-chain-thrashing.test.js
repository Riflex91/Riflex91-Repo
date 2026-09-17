'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha27MerchantAutonomy } = require('../src/reliability/alpha27-merchant-autonomy');

function fixture({ now = 10000, plan = null, active = null, cancelResult = { cancelled: true } } = {}) {
  let clock = now;
  let cancelled = null;
  let executed = 0;
  let lowRiskPlans = 0;
  const runtime = {
    root: { character: { name: 'Merchant', ctype: 'merchant', map: 'bank', bank: {}, items: [] }, parent: { entities: {} } },
    now: () => clock,
    log: { emit() {} },
    lastMerchantServicePlan: plan,
    lastMerchantServiceExecution: null,
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
    setNow(value) { clock = Number(value); },
    get cancelled() { return cancelled; },
    get executed() { return executed; },
    get lowRiskPlans() { return lowRiskPlans; }
  };
}

function adaptivePlan(kind, at = 9950) {
  return {
    id: `adaptive-${String(kind).toLowerCase()}-${at}`,
    at,
    kind,
    reason: kind === 'RESTOCK_REQUIRED'
      ? 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED'
      : kind === 'SERVICE_DELIVERY'
        ? 'MERCHANT_ADAPTIVE_POTION_DELIVERY_READY'
        : 'MERCHANT_ADAPTIVE_POTION_TRAVEL_READY',
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
  assert.equal(f.autonomy.status().partySupplyChainLatched, true);
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
  assert.equal(status.partySupplyChainLatched, true);
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

test('transient CONTROLLED_SUBSYSTEM_BUSY planner overwrite cannot break a latched supply chain', async () => {
  const f = fixture({ plan: adaptivePlan('RESTOCK_REQUIRED') });
  assert.equal(f.autonomy.criticalPartySupplyPlan().kind, 'RESTOCK_REQUIRED');
  assert.equal(f.autonomy.status().partySupplyChainLatched, true);

  // Reproduce the live race: while Alpha27 is travelling to the potion vendor,
  // the 2s service planner replaces lastMerchantServicePlan with a busy HOLD.
  // More than the old 10s freshness window then elapses before Alpha27 cycles.
  f.setNow(25000);
  f.runtime.lastMerchantServicePlan = { at: 25000, kind: 'HOLD', reason: 'CONTROLLED_SUBSYSTEM_BUSY' };

  assert.equal(await f.autonomy.cycle(), false);
  assert.equal(f.lowRiskPlans, 0);
  assert.equal(f.executed, 0);
  assert.equal(f.autonomy.lastMerchantPlan.reason, 'PARTY_SUPPLY_SERVICE_CHAIN_ACTIVE');
  const status = f.autonomy.status();
  assert.equal(status.partySupplyChainLatched, true);
  assert.equal(status.partySupplyChain.targetName, 'Ranger1');
  assert.equal(status.partySupplyChain.planKind, 'RESTOCK_REQUIRED');
  assert.ok(status.partySupplyChain.ageMs >= 15000);
});

test('confirmed potion delivery releases the latched chain and economy can resume', async () => {
  const plan = adaptivePlan('SERVICE_DELIVERY');
  const f = fixture({ plan });
  assert.equal(f.autonomy.criticalPartySupplyPlan().kind, 'SERVICE_DELIVERY');
  f.setNow(11000);
  f.runtime.lastMerchantServicePlan = { at: 11000, kind: 'HOLD', reason: 'CONTROLLED_SUBSYSTEM_BUSY' };
  f.runtime.lastMerchantServiceExecution = {
    at: 10950,
    planId: plan.id,
    kind: 'SERVICE_DELIVERY',
    result: { executed: true, committed: true, targetName: 'Ranger1' }
  };

  assert.equal(await f.autonomy.cycle(), true);
  assert.equal(f.lowRiskPlans, 1);
  assert.equal(f.executed, 1);
  const status = f.autonomy.status();
  assert.equal(status.partySupplyChainLatched, false);
  assert.equal(status.lastPartySupplyChainRelease.reason, 'PARTY_SUPPLY_DELIVERY_COMMITTED');
});

test('fresh NO_SERVICE_NEED releases a latched chain instead of holding economy forever', async () => {
  const f = fixture({ plan: adaptivePlan('SERVICE_TRAVEL') });
  assert.equal(f.autonomy.criticalPartySupplyPlan().kind, 'SERVICE_TRAVEL');
  f.setNow(12000);
  f.runtime.lastMerchantServicePlan = { at: 12000, kind: 'HOLD', reason: 'NO_SERVICE_NEED' };

  assert.equal(await f.autonomy.cycle(), true);
  assert.equal(f.lowRiskPlans, 1);
  assert.equal(f.executed, 1);
  const status = f.autonomy.status();
  assert.equal(status.partySupplyChainLatched, false);
  assert.equal(status.lastPartySupplyChainRelease.reason, 'PARTY_SUPPLY_NO_SERVICE_NEED');
});

test('hard chain timeout releases a busy-held chain after bounded recovery window', async () => {
  const f = fixture({ plan: adaptivePlan('RESTOCK_REQUIRED') });
  assert.equal(f.autonomy.criticalPartySupplyPlan().kind, 'RESTOCK_REQUIRED');
  f.setNow(150000);
  f.runtime.lastMerchantServicePlan = { at: 150000, kind: 'HOLD', reason: 'CONTROLLED_SUBSYSTEM_BUSY' };

  assert.equal(await f.autonomy.cycle(), true);
  assert.equal(f.lowRiskPlans, 1);
  assert.equal(f.executed, 1);
  const status = f.autonomy.status();
  assert.equal(status.partySupplyChainLatched, false);
  assert.equal(status.lastPartySupplyChainRelease.reason, 'PARTY_SUPPLY_CHAIN_TIMEOUT');
});

test('stale adaptive potion plan cannot create a new latch or hold economy forever', async () => {
  const f = fixture({ now: 30000, plan: adaptivePlan('SERVICE_TRAVEL', 1000) });
  assert.equal(await f.autonomy.cycle(), true);
  assert.equal(f.lowRiskPlans, 1);
  assert.equal(f.executed, 1);
  assert.equal(f.autonomy.lastMerchantPlan.type, 'BANK');
  assert.equal(f.autonomy.status().partySupplyChainLatched, false);
});
