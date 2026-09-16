'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantServicePlanner, MerchantServicePlanKind } = require('../src/merchant/merchant-service-planner');
const { ControlledMerchantServiceExecutor, CONTROLLED_MERCHANT_SERVICE_ACK } = require('../src/merchant/controlled-merchant-service-executor');
const { P0RegroupSupplyRecovery } = require('../src/reliability/p0-regroup-supply-recovery');
const { installP0PotionBundleDeltaFix } = require('../src/reliability/p0-potion-bundle-delta-fix');
const {
  installP0PotionPolicy4500,
  POTION_DELIVERY_QUANTITY,
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

function report() {
  return { name: 'My_Ranger1', ctype: 'ranger', at: 99900, active: true, map: 'main', x: 20, y: 0, supplies: { hpPotions: 100, mpPotions: 100, freeSlots: 20 } };
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

test('live potion policy overrides the old 5000 bundle to exact 4500 with zero merchant reserve', () => {
  const root = rootForMerchant();
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase(root, { merchantServicePlanner: planner });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  const policy = installP0PotionPolicy4500(runtime);

  assert.equal(policy.deliveryQuantity, 4500);
  assert.equal(policy.merchantPotionReserve, 0);
  assert.equal(planner.merchantPotionReserve, MERCHANT_POTION_RESERVE);
  assert.equal(planner.lowPotionCount, POTION_LOW_WATERMARK);
  assert.equal(planner.targetPotionCount, POTION_DELIVERY_QUANTITY);

  const restock = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 4499 }, { name: 'mpot0', q: 4500 }] },
    reports: [report()], deliveryDistance: 400
  });
  assert.equal(restock.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.equal(restock.reason, 'MERCHANT_POTION_BUNDLE_4500_RESTOCK_REQUIRED');
  assert.deepEqual(restock.missingStock.map((row) => [row.itemName, row.required]), [['hpot0', 4500]]);

  const ready = planner.plan({
    merchant: { ...root.character, inventory: [{ name: 'hpot0', q: 4500 }, { name: 'mpot0', q: 4500 }] },
    reports: [report()], deliveryDistance: 400
  });
  assert.equal(ready.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.deepEqual(ready.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', 4500], ['mpot0', 4500]]);
  assert.equal(ready.metadata.stockRequirements[0].merchantReserve, 0);
});

test('restock buys only enough stock to reach 4500 of each potion family', async () => {
  const root = rootForMerchant();
  root.character.items = [{ name: 'hpot0', q: 100 }, { name: 'mpot0', q: 200 }];
  root.can_buy = () => true;
  root.buy = async (name, quantity) => {
    const row = root.character.items.find((item) => item && item.name === name);
    row.q += quantity;
    root.character.gold -= quantity;
    return { success: true };
  };

  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const merchant = {
    root, now: () => 100000,
    options: { merchantPotionLow: 160, merchantPotionTarget: 500, merchantMaxPotionBuy: 500, goldReserve: 10000 },
    stats: {}, lastMerchantPlan: null, lastMerchantAction: null,
    ensureStandClosed: async () => true,
    restockPartyPotions: async () => false,
    atomic: { namedServiceTravel: async () => ({ ok: true }), _timeout: async (p) => p, verifyEventually: async (fn) => fn() }
  };
  const runtime = runtimeBase(root, { merchantServicePlanner: planner, alpha27CombatMerchantConvergence: { merchant } });
  runtime.p0RegroupSupplyRecovery = new P0RegroupSupplyRecovery(runtime);
  installP0PotionPolicy4500(runtime);

  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report()], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(total(root, 'hpot0'), 4500);
  assert.equal(total(root, 'mpot0'), 200);

  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report()], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(total(root, 'hpot0'), 4500);
  assert.equal(total(root, 'mpot0'), 4500);
});

test('delivery sends exact 4500 hp and 4500 mp and leaves merchant potion reserve at zero', async () => {
  const root = rootForMerchant();
  root.character.items = [
    { name: 'hpot0', q: 2500 }, { name: 'hpot0', q: 2000 },
    { name: 'mpot0', q: 1500 }, { name: 'mpot0', q: 3000 }
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

  const plan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report()], deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.equal(plan.metadata.p0PotionPolicy4500, true);

  const result = await service.execute(plan);
  assert.equal(result.committed, true);
  assert.equal(result.reason, 'POTION_BUNDLE_4500_DELIVERY_LOCAL_DELTA_VERIFIED');
  assert.equal(total(root, 'hpot0'), 0);
  assert.equal(total(root, 'mpot0'), 0);
  assert.equal(planner.merchantPotionReserve, 0);
  assert.equal(service.stats.rawActions, 4);
});
