'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantServicePlanner, MerchantServicePlanKind } = require('../src/merchant/merchant-service-planner');
const { ControlledMerchantServiceExecutor, CONTROLLED_MERCHANT_SERVICE_ACK } = require('../src/merchant/controlled-merchant-service-executor');
const { P0RegroupSupplyRecovery } = require('../src/reliability/p0-regroup-supply-recovery');
const { installP0PotionBundleDeltaFix } = require('../src/reliability/p0-potion-bundle-delta-fix');
const {
  installP0PotionPolicy4500,
  POTION_TARGET_COUNT,
  POTION_REQUEST_BELOW,
  POTION_LOW_WATERMARK,
  MERCHANT_POTION_RESERVE
} = require('../src/reliability/p0-potion-policy-4500');

function rootForMerchant() {
  return {
    character: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, gold: 1000000, isize: 42, items: [] },
    parent: { entities: {}, G: { maps: { main: {}, winterland: {} }, items: { hpot0: { g: 1 }, mpot0: { g: 1 } } } }
  };
}

function runtimeBase(root, overrides = {}) {
  return {
    root,
    now: () => 100000,
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.parent.G },
    globalSupervisor: { _activeWork() { return true; }, status() { return { state: 'HEALTHY', reasons: [] }; } },
    partyBootstrap: { status: () => ({ active: true, ready: true }) },
    ...overrides
  };
}

function total(root, name) {
  return root.character.items.reduce((sum, item) => sum + (item && item.name === name ? Number(item.q || 1) : 0), 0);
}

function report(hp = 1200, mp = 4400) {
  return { name: 'My_Ranger1', ctype: 'ranger', at: 99900, active: true, map: 'main', x: 20, y: 0, supplies: { hpPotions: hp, mpPotions: mp, freeSlots: 20 } };
}

function installImmediateSend(root) {
  root.send_item = async (_name, index, quantity) => {
    const item = root.character.items[index];
    if (!item || Number(item.q || 1) < quantity) return { success: false, reason: 'insufficient' };
    item.q -= quantity;
    if (item.q === 0) root.character.items[index] = null;
    return { success: true };
  };
}

function makeMerchant(root) {
  return {
    root, now: () => 100000,
    options: { merchantPotionLow: 160, merchantPotionTarget: 500, merchantMaxPotionBuy: 500, goldReserve: 10000 },
    stats: {}, lastMerchantPlan: null, lastMerchantAction: null,
    ensureStandClosed: async () => true,
    restockPartyPotions: async () => false,
    atomic: { namedServiceTravel: async () => ({ ok: true }), _timeout: async (p) => p, verifyEventually: async (fn) => fn() }
  };
}

function makeService(root) {
  const persisted = {};
  const storage = { get(key) { return persisted[key] || null; }, set(key, value) { persisted[key] = value; return true; } };
  const service = new ControlledMerchantServiceExecutor({
    root, storage, now: () => 100000,
    getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), getEconomyEmergency: () => false,
    getTrustedNames: () => ['My_Ranger1', 'My_Ranger2', 'My_Ranger3'], verifyDelayMs: 25, verifyAttempts: 2, maxActionsPerWindow: 8
  });
  service.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  return service;
}

// A request starts only below 200, but once triggered the same Farmer is fully
// topped up in both potion families to avoid another Merchant trip shortly after.
test('critical request triggers a full 4500 HP and MP top-up for that Farmer', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  const policy = installP0PotionPolicy4500(runtime);

  assert.equal(policy.farmerTarget, 4500);
  assert.equal(policy.merchantPotionReserve, 0);
  assert.equal(policy.potionRequestBelow, 200);
  assert.equal(POTION_REQUEST_BELOW, 200);
  assert.equal(policy.noPurchasedReserve, true);
  assert.equal(policy.batchOnAnyFarmerRequest, true);
  assert.equal(planner.merchantPotionReserve, MERCHANT_POTION_RESERVE);
  assert.equal(planner.lowPotionCount, POTION_LOW_WATERMARK);
  assert.equal(planner.targetPotionCount, POTION_TARGET_COUNT);

  const noRequestAt200 = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 5000 }, { name: 'mpot0', q: 5000 }] },
    reports: [report(200, 3000)], deliveryDistance: 400
  });
  assert.equal(noRequestAt200.reason, 'NO_SERVICE_NEED');

  const plan = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 300 }, { name: 'mpot0', q: 20 }] },
    reports: [report(199, 3000)], deliveryDistance: 400
  });
  assert.equal(plan.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.deepEqual(plan.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 4301], ['mpot0', 1500]]);
  assert.deepEqual(plan.missingStock.map((row) => [row.itemName, row.buyQuantity]), [['hpot0', 4001], ['mpot0', 1480]]);
  assert.equal(plan.metadata.p0PotionBatch, true);
  assert.equal(plan.metadata.batchPolicy, 'ONE_CRITICAL_TRIGGER_TOPS_ALL_FRESH_FARMERS_TO_4500');
  assert.equal(plan.metadata.noPurchasedReserve, true);
});

test('one Farmer request aggregates all fresh Farmers into one 4500 restock batch', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);

  const reports = [
    { ...report(4500, 0), name: 'My_Ranger1', x: 20 },
    { ...report(3000, 4000), name: 'My_Ranger2', x: 40 },
    { ...report(4490, 4490), name: 'My_Ranger3', x: 60 }
  ];
  const plan = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 1000 }, { name: 'mpot0', q: 1000 }] },
    reports,
    deliveryDistance: 400
  });

  assert.equal(plan.target.name, 'My_Ranger1');
  assert.equal(plan.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.equal(plan.metadata.p0PotionBatch, true);
  assert.equal(plan.metadata.p0PotionBatchObservedFarmers, 3);
  assert.equal(plan.metadata.p0PotionBatchTargetCount, 3);
  assert.deepEqual(
    plan.metadata.batchStockRequirements.map((row) => [row.itemName, row.requiredStock]),
    [['hpot0', 1510], ['mpot0', 5010]]
  );
  assert.deepEqual(
    plan.missingStock.map((row) => [row.itemName, row.buyQuantity]),
    [['hpot0', 510], ['mpot0', 4010]]
  );
});

test('batched restock buys aggregate HP and MP demand without another vendor trip', async () => {
  const root = rootForMerchant();
  root.character.items = [{ name: 'hpot0', q: 1000 }, { name: 'mpot0', q: 1000 }];
  root.can_buy = () => true;
  const purchases = [];
  root.buy = async (name, quantity) => {
    purchases.push([name, quantity]);
    const row = root.character.items.find((item) => item && item.name === name);
    row.q += quantity;
    root.character.gold -= quantity;
    return { success: true };
  };

  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const merchant = makeMerchant(root);
  let vendorTravels = 0;
  merchant.atomic.namedServiceTravel = async () => { vendorTravels += 1; return { ok: true }; };
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, alpha27CombatMerchantConvergence: { merchant } });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);

  const reports = [
    { ...report(4500, 0), name: 'My_Ranger1', x: 20 },
    { ...report(3000, 4000), name: 'My_Ranger2', x: 40 },
    { ...report(4490, 4490), name: 'My_Ranger3', x: 60 }
  ];
  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports, deliveryDistance: 400 });

  assert.equal(await merchant.restockPartyPotions(), true);
  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports, deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);

  assert.deepEqual(purchases, [['hpot0', 510], ['mpot0', 4010]]);
  assert.equal(total(root, 'hpot0'), 1510);
  assert.equal(total(root, 'mpot0'), 5010);
  assert.equal(vendorTravels, 0);
});

test('successful deliveries advance through all Farmers in the same batch before release', async () => {
  const root = rootForMerchant();
  root.character.items = [{ name: 'hpot0', q: 1510 }, { name: 'mpot0', q: 5010 }];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  root.parent.entities.r2 = { name: 'My_Ranger2', map: 'main', x: 40, y: 0, real_x: 40, real_y: 0 };
  root.parent.entities.r3 = { name: 'My_Ranger3', map: 'main', x: 60, y: 0, real_x: 60, real_y: 0 };
  installImmediateSend(root);

  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = makeService(root);
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, controlledMerchantService: service });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionBundleDeltaFix(runtime);
  const policy = installP0PotionPolicy4500(runtime);
  const reports = [
    { ...report(4500, 0), name: 'My_Ranger1', x: 20 },
    { ...report(3000, 4000), name: 'My_Ranger2', x: 40 },
    { ...report(4490, 4490), name: 'My_Ranger3', x: 60 }
  ];

  let plan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports, deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.equal(plan.target.name, 'My_Ranger1');
  assert.equal((await service.execute(plan)).committed, true);
  assert.ok(policy.serviceChain);
  assert.equal(policy.serviceChain.deliveredCount, 1);

  plan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports, deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.equal(plan.target.name, 'My_Ranger2');
  assert.equal((await service.execute(plan)).committed, true);
  assert.ok(policy.serviceChain);
  assert.equal(policy.serviceChain.deliveredCount, 2);

  plan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports, deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.equal(plan.target.name, 'My_Ranger3');
  assert.equal((await service.execute(plan)).committed, true);

  assert.equal(policy.serviceChain, null);
  assert.equal(policy.lastServiceChainRelease.reason, 'BATCH_DELIVERY_COMMITTED');
  assert.equal(total(root, 'hpot0'), 0);
  assert.equal(total(root, 'mpot0'), 0);
});

// Regression from the live My_Merchant session: a 10-item catch-up must not become a second 5-item vendor trip.
test('latched potion chain prevents the observed 10 then 5 micro-restock loop', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  const policy = installP0PotionPolicy4500(runtime);

  const initialReport = { ...report(4500, 190), x: 1000, y: 0 };
  const first = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'mpot0', q: 4300 }] },
    reports: [initialReport], deliveryDistance: 400
  });

  assert.equal(first.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.deepEqual(first.deliveries.map((row) => [row.itemName, row.quantity]), [['mpot0', 4310]]);
  assert.deepEqual(first.missingStock.map((row) => [row.itemName, row.buyQuantity]), [['mpot0', 10]]);
  assert.equal(first.metadata.p0PotionServiceChainLatched, true);
  assert.ok(first.metadata.p0PotionServiceChainId);

  // Reproduce the live race: the Merchant bought the missing 10 while the farmer
  // consumed another 5 mpot0. The old planner would grow the active order from
  // 4310 to 4315 and send the Merchant back for another micro-purchase.
  const afterConsumption = { ...report(4500, 185), x: 1000, y: 0 };
  const second = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'mpot0', q: 4310 }] },
    reports: [afterConsumption], deliveryDistance: 400
  });

  assert.equal(second.kind, MerchantServicePlanKind.SERVICE_TRAVEL);
  assert.deepEqual(second.deliveries.map((row) => [row.itemName, row.quantity]), [['mpot0', 4310]]);
  assert.equal(second.missingStock, undefined);
  assert.equal(second.metadata.p0PotionServiceChainId, first.metadata.p0PotionServiceChainId);
  assert.equal(second.metadata.deliveryQuantityMayIncreaseWhileActive, false);
  assert.equal(policy.serviceChain.id, first.metadata.p0PotionServiceChainId);

  // Safety remains monotonic in the other direction: if the farmer receives
  // potions elsewhere, the active order may shrink so the 4500 hard cap cannot
  // be exceeded, but it still cannot grow above the original 4310.
  const externallySupplied = { ...report(4500, 1000), x: 1000, y: 0 };
  const third = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'mpot0', q: 4310 }] },
    reports: [externallySupplied], deliveryDistance: 400
  });

  assert.equal(third.kind, MerchantServicePlanKind.SERVICE_TRAVEL);
  assert.deepEqual(third.deliveries.map((row) => [row.itemName, row.quantity]), [['mpot0', 3500]]);
  assert.equal(third.metadata.p0PotionServiceChainId, first.metadata.p0PotionServiceChainId);
  assert.ok(policy.serviceChainStats.downwardClamps >= 1);
});

test('restock buys exactly the current delivery deficit', async () => {
  const root = rootForMerchant();
  root.character.items = [{ name: 'hpot0', q: 300 }, { name: 'mpot0', q: 20 }];
  root.can_buy = () => true;
  const purchases = [];
  root.buy = async (name, quantity) => {
    purchases.push([name, quantity]);
    const row = root.character.items.find((item) => item && item.name === name);
    row.q += quantity;
    root.character.gold -= quantity;
    return { success: true };
  };

  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const merchant = makeMerchant(root);
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, alpha27CombatMerchantConvergence: { merchant } });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);

  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(150, 190)], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(total(root, 'hpot0'), 4350);
  assert.equal(total(root, 'mpot0'), 20);

  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(150, 190)], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(total(root, 'hpot0'), 4350);
  assert.equal(total(root, 'mpot0'), 4310);
  assert.deepEqual(purchases, [['hpot0', 4050], ['mpot0', 4290]]);
});

test('existing merchant surplus does not block or overfill the farmer', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 5000 }, { name: 'mpot0', q: 500 }] },
    reports: [report(199, 4400)], deliveryDistance: 400
  });

  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.deepEqual(plan.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 4301], ['mpot0', 100]]);
  assert.deepEqual(plan.metadata.batchStockRequirements.map((row) => [row.itemName, row.requiredStock]), [['hpot0', 4301], ['mpot0', 100]]);
  assert.equal(plan.metadata.p0PotionBatch, true);
});

test('successful adaptive delivery verifies the planned decrement and retains pre-existing surplus', async () => {
  const root = rootForMerchant();
  root.character.items = [
    { name: 'hpot0', q: 2500 }, { name: 'hpot0', q: 2500 },
    { name: 'mpot0', q: 2500 }, { name: 'mpot0', q: 2500 }
  ];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  installImmediateSend(root);

  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = makeService(root);
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, controlledMerchantService: service });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionBundleDeltaFix(runtime);
  const policy = installP0PotionPolicy4500(runtime);

  const plan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(150, 190)], deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.ok(policy.serviceChain);
  const result = await service.execute(plan);
  assert.equal(result.committed, true);
  assert.equal(result.reason, 'ADAPTIVE_POTION_DELIVERY_DEMAND_VERIFIED');
  assert.equal(total(root, 'hpot0'), 650);
  assert.equal(total(root, 'mpot0'), 690);
  assert.equal(service.stats.rawActions, 4);
  assert.equal(policy.serviceChain, null);
  assert.equal(policy.lastServiceChainRelease.reason, 'BATCH_DELIVERY_COMMITTED');
});

test('stock falling below the planned delivery after planning forces a replan', async () => {
  const root = rootForMerchant();
  root.character.items = [{ name: 'hpot0', q: 4349 }, { name: 'mpot0', q: 4000 }];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  installImmediateSend(root);
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = makeService(root);
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, controlledMerchantService: service });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionBundleDeltaFix(runtime);
  installP0PotionPolicy4500(runtime);

  const plan = planner.plan({ merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 4350 }, { name: 'mpot0', q: 4000 }] }, reports: [report(150, 500)], deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  const result = await service.execute(plan);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'POTION_STOCK_CHANGED_REPLAN_REQUIRED');
  assert.equal(total(root, 'hpot0'), 4349);
  assert.equal(total(root, 'mpot0'), 4000);
});
