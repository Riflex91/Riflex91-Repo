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

test('adaptive policy tops the farmer up to 4500 and keeps merchant reserve at zero', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  const policy = installP0PotionPolicy4500(runtime);

  assert.equal(policy.farmerTarget, 4500);
  assert.equal(policy.merchantPotionReserve, 0);
  assert.equal(policy.adaptiveDelivery, true);
  assert.equal(planner.merchantPotionReserve, MERCHANT_POTION_RESERVE);
  assert.equal(planner.lowPotionCount, POTION_LOW_WATERMARK);
  assert.equal(planner.targetPotionCount, POTION_TARGET_COUNT);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 300 }, { name: 'mpot0', q: 20 }] },
    reports: [report(1200, 4400)], deliveryDistance: 400
  });
  assert.equal(plan.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.equal(plan.reason, 'MERCHANT_ADAPTIVE_POTION_RESTOCK_REQUIRED');
  assert.deepEqual(plan.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 3300], ['mpot0', 100]]);
  assert.deepEqual(plan.missingStock.map((row) => [row.itemName, row.buyQuantity]), [['hpot0', 3000], ['mpot0', 80]]);
  assert.equal(plan.metadata.stockRequirements[0].merchantReserve, 0);
});

test('restock buys only the exact deficit for the current adaptive delivery', async () => {
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

  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(1200, 4400)], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(total(root, 'hpot0'), 3300);
  assert.equal(total(root, 'mpot0'), 20);

  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(1200, 4400)], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(total(root, 'hpot0'), 3300);
  assert.equal(total(root, 'mpot0'), 100);
  assert.deepEqual(purchases, [['hpot0', 3000], ['mpot0', 80]]);

  const ready = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(1200, 4400)], deliveryDistance: 400 });
  assert.equal(ready.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.deepEqual(ready.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 3300], ['mpot0', 100]]);
});

test('successful adaptive delivery sends the planned amounts and leaves zero hp/mp potions on merchant', async () => {
  const root = rootForMerchant();
  root.character.items = [
    { name: 'hpot0', q: 2000 }, { name: 'hpot0', q: 1300 },
    { name: 'mpot0', q: 40 }, { name: 'mpot0', q: 60 }
  ];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  installImmediateSend(root);

  const persisted = {};
  const storage = { get(key) { return persisted[key] || null; }, set(key, value) { persisted[key] = value; return true; } };
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = new ControlledMerchantServiceExecutor({
    root, storage, now: () => 100000,
    getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), getEconomyEmergency: () => false,
    getTrustedNames: () => ['My_Ranger1'], verifyDelayMs: 25, verifyAttempts: 2, maxActionsPerWindow: 8
  });
  service.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });

  const runtime = runtimeBase(root, { merchantServicePlanner: planner, controlledMerchantService: service });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionBundleDeltaFix(runtime);
  installP0PotionPolicy4500(runtime);

  const plan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report(1200, 4400)], deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.deepEqual(plan.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 3300], ['mpot0', 100]]);

  const result = await service.execute(plan);
  assert.equal(result.committed, true);
  assert.equal(result.reason, 'ADAPTIVE_POTION_DELIVERY_ZERO_RESERVE_VERIFIED');
  assert.equal(total(root, 'hpot0'), 0);
  assert.equal(total(root, 'mpot0'), 0);
  assert.equal(planner.merchantPotionReserve, 0);
  assert.equal(service.stats.rawActions, 4);
});

test('stock changes after planning force a replan instead of leaving potion reserve behind', async () => {
  const root = rootForMerchant();
  root.character.items = [{ name: 'hpot0', q: 3301 }, { name: 'mpot0', q: 100 }];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  installImmediateSend(root);
  const persisted = {};
  const storage = { get(key) { return persisted[key] || null; }, set(key, value) { persisted[key] = value; return true; } };
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = new ControlledMerchantServiceExecutor({
    root, storage, now: () => 100000,
    getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), getEconomyEmergency: () => false,
    getTrustedNames: () => ['My_Ranger1'], verifyDelayMs: 25, verifyAttempts: 2, maxActionsPerWindow: 8
  });
  service.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, controlledMerchantService: service });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionBundleDeltaFix(runtime);
  installP0PotionPolicy4500(runtime);

  const plan = planner.plan({ merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 3300 }, { name: 'mpot0', q: 100 }] }, reports: [report(1200, 4400)], deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  const result = await service.execute(plan);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'POTION_STOCK_CHANGED_REPLAN_REQUIRED');
  assert.equal(total(root, 'hpot0'), 3301);
  assert.equal(total(root, 'mpot0'), 100);
});


test('adaptive planner holds instead of overfilling when merchant stock exceeds farmer shortfall', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);

  const plan = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 500 }, { name: 'mpot0', q: 500 }] },
    reports: [report(4300, 4400)],
    deliveryDistance: 400
  });

  assert.equal(plan.kind, MerchantServicePlanKind.HOLD);
  assert.equal(plan.reason, 'MERCHANT_POTION_EXCESS_REQUIRES_REROUTE');
  assert.deepEqual(plan.deliveries, []);
  assert.deepEqual(plan.metadata.excessStock.map((row) => [row.itemName, row.excessQuantity]), [['hpot0', 300], ['mpot0', 400]]);
});
