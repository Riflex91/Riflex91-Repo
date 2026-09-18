'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantServicePlanner, MerchantServicePlanKind } = require('../src/merchant/merchant-service-planner');
const { P0RegroupSupplyRecovery } = require('../src/reliability/p0-regroup-supply-recovery');
const { installP0PotionPolicy4500 } = require('../src/reliability/p0-potion-policy-4500');
const { installP0PotionHardCap4500 } = require('../src/reliability/p0-potion-hardcap-4500');

function rootForMerchant(items) {
  return {
    character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, gold: 1000000, isize: 42, items },
    parent: { entities: {}, G: { maps: { main: {} }, items: { hpot0: { g: 1 }, mpot0: { g: 1 } } } }
  };
}

function report(name, at, hp, mp) {
  return {
    name,
    ctype: 'ranger',
    at,
    active: true,
    map: 'main',
    x: 20,
    y: 0,
    supplies: { hpPotions: hp, mpPotions: mp, freeSlots: 20 }
  };
}

function runtimeFor(root, planner) {
  return {
    root,
    now: () => 100000,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.parent.G },
    merchantServicePlanner: planner,
    globalSupervisor: { _activeWork() { return true; }, status() { return { state: 'HEALTHY', reasons: [] }; } },
    partyBootstrap: { status: () => ({ active: true, ready: true }) }
  };
}

function install(runtime) {
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);
  return installP0PotionHardCap4500(runtime);
}

test('merchant surplus never blocks the current farmer demand', () => {
  const items = [{ name: 'hpot0', q: 5415 }, { name: 'mpot0', q: 1500 }];
  const root = rootForMerchant(items);
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeFor(root, planner);
  const hardCap = install(runtime);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: items },
    reports: [report('My_Ranger1', 99900, 199, 3000)],
    deliveryDistance: 400
  });

  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.deepEqual(plan.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 4301], ['mpot0', 1500]]);
  assert.equal(plan.missingStock, undefined);
  assert.equal(plan.metadata.merchantExcessBlocksDelivery, false);
  assert.equal(plan.metadata.overdeliveryAllowed, false);
  assert.equal(hardCap.merchantExcessBlocksDelivery, false);
  assert.equal(hardCap.blockedOverdeliveryPlans, 0);
});

test('hard cap still blocks a plan that would exceed the observed farmer shortfall', () => {
  const root = rootForMerchant([]);
  const maliciousPlan = {
    kind: MerchantServicePlanKind.SERVICE_DELIVERY,
    target: { name: 'My_Ranger1', map: 'main', x: 20, y: 0 },
    deliveries: [{ family: 'hp', itemName: 'hpot0', quantity: 400 }],
    metadata: { p0PotionPolicy4500: true, p0PotionBundle: true }
  };
  const planner = { lastPlan: null, plan() { return maliciousPlan; } };
  const runtime = runtimeFor(root, planner);
  const hardCap = installP0PotionHardCap4500(runtime);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: [] },
    reports: [report('My_Ranger1', 99900, 4200, 4400)]
  });

  assert.equal(plan.kind, MerchantServicePlanKind.HOLD);
  assert.equal(plan.reason, 'POTION_DELIVERY_EXCEEDS_FARMER_SHORTFALL');
  assert.deepEqual(plan.deliveries, []);
  assert.deepEqual(plan.metadata.violations.map((row) => [row.itemName, row.quantity, row.farmerShortfall]), [['hpot0', 400, 300]]);
  assert.equal(hardCap.blockedOverdeliveryPlans, 1);
});
