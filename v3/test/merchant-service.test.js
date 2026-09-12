'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantServicePlanner, MerchantServicePlanKind } = require('../src/merchant/merchant-service-planner');
const { ControlledMerchantServiceExecutor, CONTROLLED_MERCHANT_SERVICE_ACK } = require('../src/merchant/controlled-merchant-service-executor');
const { RouteCostEstimator } = require('../src/travel/route-cost-estimator');
const { PartyTelemetryBridge, potionSummary } = require('../src/party/telemetry-bridge');
const index = require('../src');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed));
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; }, rows };
}

function report(now, overrides = {}) {
  return {
    name: 'FarmerA', ctype: 'ranger', level: 80, map: 'main', x: 120, y: 100, at: now,
    rip: false, active: true,
    rates: { xpPerHour: 1000, goldPerHour: 100, killsPerHour: 100, deathsPerHour: 0, potionsPerHour: 120, damageTakenPerHour: 10 },
    supplies: { inventorySize: 42, inventoryUsed: 20, freeSlots: 22, hpPotions: 20, mpPotions: 200, preferredHpPotion: 'hpot0', preferredMpPotion: 'mpot0' },
    safety: { retreat: false, emergency: false, movementCircuitOpen: false, skillFailureBackoffs: 0 },
    ...overrides
  };
}

function merchant(inventory = [{ index: 0, name: 'hpot0', q: 500 }, { index: 1, name: 'mpot0', q: 500 }]) {
  return { name: 'MerchantA', ctype: 'merchant', map: 'main', x: 100, y: 100, speed: 40, rip: false, inventory };
}

test('merchant service planner gives critical potion supply priority and emits one bounded delivery', () => {
  let now = 100000;
  const planner = new MerchantServicePlanner({ now: () => now, merchantPotionReserve: 80, maxDeliveryQuantity: 200 });
  const plan = planner.plan({ merchant: merchant(), reports: [report(now)], standOpen: false, inCombat: false, economyEmergency: false, controlledBusy: false, deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.equal(plan.target.name, 'FarmerA');
  assert.equal(plan.delivery.itemName, 'hpot0');
  assert.equal(plan.delivery.quantity, 200);
  assert.equal(plan.actionAuthority, false);
});

test('farmer service need preempts an open stand before any delivery or travel action', () => {
  const now = 200000;
  const planner = new MerchantServicePlanner({ now: () => now });
  const plan = planner.plan({ merchant: merchant(), reports: [report(now)], standOpen: true });
  assert.equal(plan.kind, MerchantServicePlanKind.STAND_CLOSE);
  assert.equal(plan.reason, 'SERVICE_PREEMPTS_STAND');
});

test('inventory pressure is observed as collection-required but grants no collection authority', () => {
  const now = 300000;
  const planner = new MerchantServicePlanner({ now: () => now });
  const row = report(now, { supplies: { inventorySize: 42, inventoryUsed: 41, freeSlots: 1, hpPotions: 300, mpPotions: 300, preferredHpPotion: 'hpot0', preferredMpPotion: 'mpot0' } });
  const plan = planner.plan({ merchant: merchant(), reports: [row], standOpen: false });
  assert.equal(plan.kind, MerchantServicePlanKind.COLLECTION_REQUIRED);
  assert.equal(plan.actionAuthority, false);
});

test('merchant stock reserve blocks potion delivery and asks for restock instead of draining reserve', () => {
  const now = 400000;
  const planner = new MerchantServicePlanner({ now: () => now, merchantPotionReserve: 80 });
  const plan = planner.plan({ merchant: merchant([{ index: 0, name: 'hpot0', q: 80 }]), reports: [report(now)], standOpen: false });
  assert.equal(plan.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.match(plan.reason, /STOCK_LOW/);
});

test('stale and emergency farmer reports never trigger a merchant service trip', () => {
  const now = 500000;
  const planner = new MerchantServicePlanner({ now: () => now, reportTtlMs: 10000 });
  const stale = planner.plan({ merchant: merchant(), reports: [report(now - 20000)], standOpen: false });
  assert.equal(stale.kind, MerchantServicePlanKind.STAND_OPEN);
  const unsafe = planner.plan({ merchant: merchant(), reports: [report(now, { safety: { retreat: true, emergency: true } })], standOpen: true });
  assert.equal(unsafe.kind, MerchantServicePlanKind.HOLD);
});

test('party telemetry reports position, free slots and potion stock without changing protocol', () => {
  const bridge = new PartyTelemetryBridge({ now: () => 1000 });
  const runtime = {
    lastSnapshot: { character: { name: 'FarmerA', ctype: 'ranger', level: 80, map: 'main', x: 12, y: 34, hp: 900, max_hp: 1000, mp: 700, max_mp: 1000, isize: 6, inventory: [{ index: 0, name: 'hpot0', q: 25 }, null, { index: 2, name: 'mpot0', q: 40 }, null, null, null] } },
    performance: { status: () => ({ current: { rates: {} } }) },
    farmerStatus: () => ({}), localFarming: { status: () => ({}) }, adapter: {}
  };
  const built = bridge.buildLocalReport(runtime);
  assert.equal(built.protocol, 1);
  assert.equal(built.x, 12); assert.equal(built.y, 34);
  assert.equal(built.supplies.freeSlots, 4);
  assert.equal(built.supplies.hpPotions, 25);
  assert.equal(built.supplies.mpPotions, 40);
  assert.equal(built.supplies.preferredHpPotion, 'hpot0');
  assert.deepEqual(potionSummary(runtime.lastSnapshot.character.inventory).preferredMpPotion, 'mpot0');
});

function controlledFixture(options = {}) {
  let now = 1000;
  let sendCalls = 0; let openCalls = 0; let closeCalls = 0;
  const storage = options.storage || memoryStorage();
  const character = { name: 'MerchantA', ctype: 'merchant', map: 'main', x: 0, y: 0, isize: 4, stand: false, items: [{ name: 'hpot0', q: 400 }, null, null, null] };
  const farmer = { id: 'f1', name: 'FarmerA', type: 'character', map: 'main', x: 20, y: 0 };
  const root = {
    character,
    parent: { entities: { f1: farmer } },
    setTimeout,
    clearTimeout,
    open_stand: async () => { openCalls += 1; character.stand = true; return { success: true }; },
    close_stand: async () => { closeCalls += 1; character.stand = false; return { success: true }; },
    send_item: async (name, index, quantity) => {
      sendCalls += 1;
      assert.equal(name, 'FarmerA');
      const item = character.items[index];
      if (!item || item.q < quantity) return { success: false, reason: 'quantity' };
      item.q -= quantity;
      if (item.q === 0) character.items[index] = null;
      return { success: true };
    }
  };
  const executor = new ControlledMerchantServiceExecutor({
    root, storage, now: () => now, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getEconomyEmergency: () => false, getTrustedNames: () => ['MerchantA', 'FarmerA'], verifyDelayMs: 25, verifyAttempts: 2
  });
  return { root, character, farmer, executor, storage, counters: () => ({ sendCalls, openCalls, closeCalls }), setNow: (value) => { now = value; } };
}

test('controlled merchant service is default-off and exact-ack gated', () => {
  const { executor } = controlledFixture();
  assert.equal(executor.status().enabled, false);
  executor.configure({ enabled: true, ack: 'WRONG', allowStand: true, allowDelivery: true });
  assert.equal(executor.status().enabled, false);
  executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowStand: true, allowDelivery: true });
  assert.equal(executor.status().enabled, true);
  assert.equal(executor.status().arbitraryItemTransferAllowed, false);
});

test('controlled stand open and close each consume exactly one verified raw action', async () => {
  const { executor, counters } = controlledFixture();
  executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowStand: true });
  let result = await executor.execute({ id: 'stand-open', kind: MerchantServicePlanKind.STAND_OPEN });
  assert.equal(result.committed, true);
  result = await executor.execute({ id: 'stand-close', kind: MerchantServicePlanKind.STAND_CLOSE });
  assert.equal(result.committed, true);
  assert.deepEqual(counters(), { sendCalls: 0, openCalls: 1, closeCalls: 1 });
  assert.equal(executor.status().stats.rawActions, 2);
});

test('controlled potion delivery verifies exact local identity delta and rejects arbitrary items', async () => {
  const { executor, counters, character } = controlledFixture();
  executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const result = await executor.execute({ id: 'delivery-1', kind: MerchantServicePlanKind.SERVICE_DELIVERY, target: { name: 'FarmerA' }, delivery: { itemName: 'hpot0', quantity: 120 } });
  assert.equal(result.committed, true);
  assert.equal(character.items[0].q, 280);
  assert.equal(counters().sendCalls, 1);
  const blocked = await executor.execute({ id: 'delivery-2', kind: MerchantServicePlanKind.SERVICE_DELIVERY, target: { name: 'FarmerA' }, delivery: { itemName: 'sword', quantity: 1 } });
  assert.equal(blocked.executed, false);
  assert.equal(blocked.reason, 'DELIVERY_ITEM_NOT_POTION');
  assert.equal(counters().sendCalls, 1);
});

test('untrusted or distant target is rejected before send_item', async () => {
  const fx = controlledFixture();
  fx.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  let result = await fx.executor.execute({ id: 'x', kind: MerchantServicePlanKind.SERVICE_DELIVERY, target: { name: 'Stranger' }, delivery: { itemName: 'hpot0', quantity: 10 } });
  assert.equal(result.executed, false);
  fx.farmer.x = 1000;
  result = await fx.executor.execute({ id: 'y', kind: MerchantServicePlanKind.SERVICE_DELIVERY, target: { name: 'FarmerA' }, delivery: { itemName: 'hpot0', quantity: 10 } });
  assert.equal(result.reason, 'DELIVERY_TARGET_OUT_OF_RANGE');
  assert.equal(fx.counters().sendCalls, 0);
});

test('restart reconciliation never blindly retries an uncertain service operation', () => {
  const storage = memoryStorage({
    'aio-v3-merchant-service-operation-v1': JSON.stringify({ schemaVersion: 1, activeOperation: { schemaVersion: 1, id: 'old', planKind: 'SERVICE_DELIVERY', state: 'EXECUTING', action: 'send_item', itemName: 'hpot0', quantity: 20, beforeTotal: 400, expectedAfterTotal: 380 }, history: [] })
  });
  const fx = controlledFixture({ storage });
  assert.equal(fx.executor.status().activeOperation.state, 'RECOVERING');
  const result = fx.executor.reconcile();
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'RESTART_OUTCOME_UNCERTAIN_NO_RETRY');
  assert.equal(fx.counters().sendCalls, 0);
});

test('town route is selected only when materially faster than direct travel', () => {
  const estimator = new RouteCostEstimator({ minTownSavingsMs: 30000 });
  let result = estimator.choose({ directEtaMs: 120000, townEtaMs: 60000, townAvailable: true });
  assert.equal(result.route, 'TOWN');
  result = estimator.choose({ directEtaMs: 80000, townEtaMs: 60000, townAvailable: true });
  assert.equal(result.route, 'DIRECT');
  assert.equal(result.actionAuthority, false);
});

test('3000-cycle merchant planner soak stays bounded, deterministic and action-authority free', () => {
  let now = 1000000;
  const planner = new MerchantServicePlanner({ now: () => now });
  for (let i = 0; i < 3000; i += 1) {
    now += 1000;
    const hp = i % 4 === 0 ? 20 : 200;
    const freeSlots = i % 7 === 0 ? 1 : 12;
    const plan = planner.plan({ merchant: merchant(), reports: [report(now, { supplies: { inventorySize: 42, inventoryUsed: 42 - freeSlots, freeSlots, hpPotions: hp, mpPotions: 200, preferredHpPotion: 'hpot0', preferredMpPotion: 'mpot0' } })], standOpen: false });
    assert.equal(plan.actionAuthority, false);
    assert.ok(Object.values(MerchantServicePlanKind).includes(plan.kind));
  }
  const status = planner.status();
  assert.equal(status.stats.plans, 3000);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test('public module exports the Alpha20.5 merchant runtime without changing the frozen Alpha20 class', () => {
  assert.equal(typeof index.Alpha20Runtime, 'function');
  assert.equal(typeof index.Alpha20_5MerchantRuntime, 'function');
  assert.notEqual(index.Alpha20Runtime, index.Alpha20_5MerchantRuntime);
  assert.equal(index.CONTROLLED_MERCHANT_SERVICE_ACK, CONTROLLED_MERCHANT_SERVICE_ACK);
});
