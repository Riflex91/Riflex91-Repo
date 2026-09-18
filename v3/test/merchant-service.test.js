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

test('merchant service planner gives critical potion supply priority and binds delivery to exact report evidence', () => {
  const now = 100000;
  const planner = new MerchantServicePlanner({ now: () => now, merchantPotionReserve: 80, maxDeliveryQuantity: 200 });
  const plan = planner.plan({ merchant: merchant(), reports: [report(now)], standOpen: false, inCombat: false, economyEmergency: false, controlledBusy: false, deliveryDistance: 400 });
  assert.equal(plan.kind, MerchantServicePlanKind.SERVICE_DELIVERY);
  assert.equal(plan.target.name, 'FarmerA');
  assert.equal(plan.delivery.itemName, 'hpot0');
  assert.equal(plan.delivery.quantity, 200);
  assert.equal(plan.sourceReportAt, now);
  assert.equal(plan.actionAuthority, false);
});

test('equal-priority critical supply services the most depleted Farmer first', () => {
  const now = 150000;
  const planner = new MerchantServicePlanner({ now: () => now, merchantPotionReserve: 0, maxDeliveryQuantity: 4500 });
  const r20 = report(now - 1000, {
    name: 'FarmerWith20',
    supplies: { inventorySize: 42, inventoryUsed: 20, freeSlots: 22, hpPotions: 4500, mpPotions: 20, preferredHpPotion: 'hpot0', preferredMpPotion: 'mpot0' }
  });
  const r0 = report(now, {
    name: 'FarmerWith0',
    supplies: { inventorySize: 42, inventoryUsed: 20, freeSlots: 22, hpPotions: 4500, mpPotions: 0, preferredHpPotion: 'hpot0', preferredMpPotion: 'mpot0' }
  });
  const plan = planner.plan({
    merchant: merchant([{ index: 0, name: 'mpot0', q: 5000 }]),
    reports: [r20, r0],
    standOpen: false,
    inCombat: false,
    economyEmergency: false,
    controlledBusy: false,
    deliveryDistance: 400
  });
  assert.equal(plan.target.name, 'FarmerWith0');
  assert.equal(plan.need.family, 'mp');
  assert.equal(plan.need.count, 0);
  assert.equal(plan.need.priority, 100);
});

test('farmer service need preempts an open stand before any delivery or travel action', () => {
  const now = 200000;
  const planner = new MerchantServicePlanner({ now: () => now });
  const plan = planner.plan({ merchant: merchant(), reports: [report(now)], standOpen: true });
  assert.equal(plan.kind, MerchantServicePlanKind.STAND_CLOSE);
  assert.equal(plan.reason, 'SERVICE_PREEMPTS_STAND');
  assert.equal(plan.sourceReportAt, now);
});

test('inventory pressure is observed as collection-required but grants no collection authority', () => {
  const now = 300000;
  const planner = new MerchantServicePlanner({ now: () => now });
  const row = report(now, { supplies: { inventorySize: 42, inventoryUsed: 41, freeSlots: 1, hpPotions: 300, mpPotions: 300, preferredHpPotion: 'hpot0', preferredMpPotion: 'mpot0' } });
  const plan = planner.plan({ merchant: merchant(), reports: [row], standOpen: false });
  assert.equal(plan.kind, MerchantServicePlanKind.COLLECTION_REQUIRED);
  assert.equal(plan.sourceReportAt, now);
  assert.equal(plan.actionAuthority, false);
});

test('merchant stock reserve blocks potion delivery and asks for restock instead of draining reserve', () => {
  const now = 400000;
  const planner = new MerchantServicePlanner({ now: () => now, merchantPotionReserve: 80 });
  const plan = planner.plan({ merchant: merchant([{ index: 0, name: 'hpot0', q: 80 }]), reports: [report(now)], standOpen: false });
  assert.equal(plan.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.equal(plan.sourceReportAt, now);
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
  const character = { name: 'MerchantA', ctype: 'merchant', map: 'main', x: 0, y: 0, isize: 4, stand: false, items: [{ name: 'hpot0', q: 400 }, { name: 'stand0', q: 1 }, null, null] };
  const farmer = { id: 'f1', name: 'FarmerA', type: 'character', map: 'main', x: 20, y: 0 };
  const root = {
    character,
    G: { items: { hpot0: {}, stand0: { stand: true } } },
    parent: { entities: { f1: farmer } },
    setTimeout,
    clearTimeout,
    open_stand: async (slot) => { openCalls += 1; assert.equal(slot, 1); character.stand = true; return { success: true }; },
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

function deliveryPlan(id, sourceReportAt, itemName = 'hpot0', quantity = 120, targetName = 'FarmerA') {
  return { id, kind: MerchantServicePlanKind.SERVICE_DELIVERY, sourceReportAt, target: { name: targetName }, delivery: { itemName, quantity } };
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

test('controlled stand uses one exact isize-bounded stand slot and close consumes exactly one verified raw action', async () => {
  const { executor, counters } = controlledFixture();
  executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowStand: true });
  let result = await executor.execute({ id: 'stand-open', kind: MerchantServicePlanKind.STAND_OPEN });
  assert.equal(result.committed, true);
  assert.equal(result.standSlot, 1);
  result = await executor.execute({ id: 'stand-close', kind: MerchantServicePlanKind.STAND_CLOSE });
  assert.equal(result.committed, true);
  assert.deepEqual(counters(), { sendCalls: 0, openCalls: 1, closeCalls: 1 });
  assert.equal(executor.status().stats.rawActions, 2);
});

test('stand open rejects when only an out-of-isize tail slot contains a stand item', async () => {
  const fx = controlledFixture();
  fx.character.isize = 1;
  fx.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowStand: true });
  const result = await fx.executor.execute({ id: 'stand-tail', kind: MerchantServicePlanKind.STAND_OPEN });
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'VALID_STAND_ITEM_REQUIRED');
  assert.equal(fx.counters().openCalls, 0);
});

test('controlled potion delivery verifies exact local identity delta and rejects arbitrary items', async () => {
  const { executor, counters, character } = controlledFixture();
  executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const result = await executor.execute(deliveryPlan('delivery-1', 1000));
  assert.equal(result.committed, true);
  assert.equal(character.items[0].q, 280);
  assert.equal(counters().sendCalls, 1);
  const blocked = await executor.execute(deliveryPlan('delivery-2', 1001, 'sword', 1));
  assert.equal(blocked.executed, false);
  assert.equal(blocked.reason, 'DELIVERY_ITEM_NOT_POTION');
  assert.equal(counters().sendCalls, 1);
});

test('delivery requires exact farmer report evidence before any send_item call', async () => {
  const fx = controlledFixture();
  fx.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const result = await fx.executor.execute({ id: 'missing-report', kind: MerchantServicePlanKind.SERVICE_DELIVERY, target: { name: 'FarmerA' }, delivery: { itemName: 'hpot0', quantity: 10 } });
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'DELIVERY_SOURCE_REPORT_REQUIRED');
  assert.equal(fx.counters().sendCalls, 0);
});

test('exact farmer report can authorize at most one potion delivery and newer evidence can authorize the next', async () => {
  const fx = controlledFixture();
  fx.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  let result = await fx.executor.execute(deliveryPlan('first', 5000, 'hpot0', 10));
  assert.equal(result.committed, true);
  result = await fx.executor.execute(deliveryPlan('duplicate', 5000, 'hpot0', 10));
  assert.equal(result.executed, false);
  assert.equal(result.reason, 'SERVICE_REPORT_ALREADY_SERVED');
  assert.equal(fx.counters().sendCalls, 1);
  result = await fx.executor.execute(deliveryPlan('newer', 5001, 'hpot0', 10));
  assert.equal(result.committed, true);
  assert.equal(fx.counters().sendCalls, 2);
  assert.equal(fx.executor.status().servedReports[0].at, 5001);
});

test('served-report dedupe persists across executor restart', async () => {
  const storage = memoryStorage();
  const first = controlledFixture({ storage });
  first.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const committed = await first.executor.execute(deliveryPlan('persist-first', 7000, 'hpot0', 10));
  assert.equal(committed.committed, true);
  assert.equal(first.counters().sendCalls, 1);

  const restarted = controlledFixture({ storage });
  restarted.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const duplicate = await restarted.executor.execute(deliveryPlan('persist-duplicate', 7000, 'hpot0', 10));
  assert.equal(duplicate.executed, false);
  assert.equal(duplicate.reason, 'SERVICE_REPORT_ALREADY_SERVED');
  assert.equal(restarted.counters().sendCalls, 0);
});

test('untrusted or distant target is rejected before send_item', async () => {
  const fx = controlledFixture();
  fx.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  let result = await fx.executor.execute(deliveryPlan('x', 8000, 'hpot0', 10, 'Stranger'));
  assert.equal(result.executed, false);
  fx.farmer.x = 1000;
  result = await fx.executor.execute(deliveryPlan('y', 8001, 'hpot0', 10));
  assert.equal(result.reason, 'DELIVERY_TARGET_OUT_OF_RANGE');
  assert.equal(fx.counters().sendCalls, 0);
});

test('restart reconciliation never blindly retries an uncertain service operation', () => {
  const storage = memoryStorage({
    'aio-v3-merchant-service-operation-v1': JSON.stringify({ schemaVersion: 1, activeOperation: { schemaVersion: 1, id: 'old', planKind: 'SERVICE_DELIVERY', sourceReportAt: 9000, state: 'EXECUTING', action: 'send_item', targetName: 'FarmerA', itemName: 'hpot0', quantity: 20, beforeTotal: 400, expectedAfterTotal: 380 }, history: [], servedReports: [] })
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

test('critical p0 supply falls back to controlled direct travel when TOWN is recommendation-only', async () => {
  const events = [];
  let plannedRequest = null;
  let plannedContext = null;
  const runtime = Object.create(index.Alpha20_5MerchantRuntime.prototype);
  runtime.merchantServiceAllowTravel = true;
  runtime.controlledTravel = { status: () => ({ enabled: true }) };
  runtime.lastMerchantRouteDecision = {
    route: 'TOWN',
    reason: 'TOWN_MATERIALLY_FASTER',
    directEtaMs: 33000,
    townEtaMs: 0
  };
  runtime.merchantServicePlanner = { reportTtlMs: 25000 };
  runtime.log = { emit: (event) => events.push(event) };
  runtime.planTravel = (request, context) => {
    plannedRequest = request;
    plannedContext = context;
    return { accepted: true, plan: { id: 'critical-direct-1' } };
  };
  runtime.executeTravelPlan = async (id) => ({ completed: true, id });

  const plan = {
    id: 'service-critical',
    kind: MerchantServicePlanKind.SERVICE_TRAVEL,
    sourceReportAt: 99900,
    target: { name: 'FarmerA', map: 'main', x: 1200, y: 600 },
    need: { family: 'mp', priority: 100, count: 0 },
    metadata: { p0PotionPolicy4500: true }
  };
  const result = await runtime._executeMerchantTravel(plan);

  assert.equal(result.completed, true);
  assert.equal(plannedRequest.destination.map, 'main');
  assert.equal(plannedRequest.destination.x, 1200);
  assert.equal(plannedContext.destinationMapAttestation.observedAt, 99900);
  assert.equal(plannedContext.destinationMapAttestation.source, 'trusted-owned-farmer-service');
  assert.ok(events.some((event) => event.event === 'MERCHANT_SERVICE_TOWN_RECOMMENDATION_FALLBACK'));
});

test('noncritical TOWN recommendation remains fail-closed when live town authority is unavailable', async () => {
  const runtime = Object.create(index.Alpha20_5MerchantRuntime.prototype);
  runtime.merchantServiceAllowTravel = true;
  runtime.controlledTravel = { status: () => ({ enabled: true }) };
  runtime.lastMerchantRouteDecision = { route: 'TOWN', reason: 'TOWN_MATERIALLY_FASTER' };
  runtime.merchantServicePlanner = { reportTtlMs: 25000 };
  runtime.planTravel = () => { throw new Error('noncritical town recommendation must not broaden authority'); };

  const result = await runtime._executeMerchantTravel({
    id: 'service-normal',
    kind: MerchantServicePlanKind.SERVICE_TRAVEL,
    sourceReportAt: 99900,
    target: { name: 'FarmerA', map: 'main', x: 1200, y: 600 },
    need: { family: 'inventory', priority: 70, count: 4 },
    metadata: {}
  });

  assert.equal(result.executed, false);
  assert.equal(result.reason, 'TOWN_ROUTE_RECOMMENDED_BUT_LIVE_TOWN_AUTHORITY_NOT_IMPLEMENTED');
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
    if (![MerchantServicePlanKind.HOLD, MerchantServicePlanKind.STAND_OPEN].includes(plan.kind)) assert.equal(plan.sourceReportAt, now);
  }
  const status = planner.status();
  assert.equal(status.stats.plans, 3000);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test('2000 repeated executions of one report can produce only one raw potion send', async () => {
  const fx = controlledFixture();
  fx.executor.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const first = await fx.executor.execute(deliveryPlan('soak-0', 15000, 'hpot0', 1));
  assert.equal(first.committed, true);
  for (let i = 1; i <= 2000; i += 1) {
    const result = await fx.executor.execute(deliveryPlan(`soak-${i}`, 15000, 'hpot0', 1));
    assert.equal(result.reason, 'SERVICE_REPORT_ALREADY_SERVED');
  }
  assert.equal(fx.counters().sendCalls, 1);
  assert.equal(fx.executor.status().stats.rawActions, 1);
  assert.equal(fx.executor.status().stats.duplicateReportsRejected, 2000);
});

test('public module exports the Alpha20.5 merchant runtime without changing the frozen Alpha20 class', () => {
  assert.equal(typeof index.Alpha20Runtime, 'function');
  assert.equal(typeof index.Alpha20_5MerchantRuntime, 'function');
  assert.notEqual(index.Alpha20Runtime, index.Alpha20_5MerchantRuntime);
  assert.equal(index.CONTROLLED_MERCHANT_SERVICE_ACK, CONTROLLED_MERCHANT_SERVICE_ACK);
});
