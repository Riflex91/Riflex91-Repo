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

test('hard cap reroutes to another farmer instead of overfilling the selected farmer', () => {
  const items = [{ name: 'hpot0', q: 500 }, { name: 'mpot0', q: 200 }];
  const root = rootForMerchant(items);
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeFor(root, planner);
  const hardCap = install(runtime);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: items },
    reports: [
      report('My_Ranger1', 99900, 4200, 4400),
      report('My_Ranger2', 99910, 3000, 4000)
    ],
    deliveryDistance: 400
  });

  assert.equal(plan.target.name, 'My_Ranger2');
  assert.equal(plan.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.deepEqual(plan.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 1500], ['mpot0', 500]]);
  assert.deepEqual(plan.missingStock.map((row) => [row.itemName, row.buyQuantity]), [['hpot0', 1000], ['mpot0', 300]]);
  assert.equal(plan.metadata.zeroReserveHardCap, true);
  assert.equal(plan.metadata.overdeliveryAllowed, false);
  assert.equal(plan.metadata.reroutedFromPotionExcess[0].targetName, 'My_Ranger1');
  assert.equal(hardCap.reroutes, 1);
});

test('hard cap holds when no farmer can absorb existing stock without exceeding 4500', () => {
  const items = [{ name: 'hpot0', q: 500 }, { name: 'mpot0', q: 200 }];
  const root = rootForMerchant(items);
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeFor(root, planner);
  const hardCap = install(runtime);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: items },
    reports: [report('My_Ranger1', 99900, 4200, 4400)],
    deliveryDistance: 400
  });

  assert.equal(plan.kind, MerchantServicePlanKind.HOLD);
  assert.equal(plan.reason, 'MERCHANT_POTION_EXCESS_BLOCKS_ZERO_RESERVE_DELIVERY');
  assert.deepEqual(plan.deliveries, []);
  assert.equal(plan.metadata.zeroReserveHardCap, true);
  assert.equal(plan.metadata.overdeliveryAllowed, false);
  assert.equal(plan.metadata.blockedTargets[0].targetName, 'My_Ranger1');
  assert.deepEqual(plan.metadata.blockedTargets[0].excess.map((row) => [row.itemName, row.excessQuantity]), [['hpot0', 200], ['mpot0', 100]]);
  assert.equal(hardCap.blockedPlans, 1);
});
