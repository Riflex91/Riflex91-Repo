'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantServicePlanner, MerchantServicePlanKind } = require('../src/merchant/merchant-service-planner');
const { ControlledMerchantServiceExecutor, CONTROLLED_MERCHANT_SERVICE_ACK } = require('../src/merchant/controlled-merchant-service-executor');
const {
  P0RegroupSupplyRecovery,
  POTION_DELIVERY_QUANTITY,
  POTION_LOW_WATERMARK
} = require('../src/reliability/p0-regroup-supply-recovery');
const { installP0PotionBundleDeltaFix } = require('../src/reliability/p0-potion-bundle-delta-fix');

function supervisor(state = 'HEALTHY', reasons = []) {
  return {
    state,
    reasons,
    _activeWork() { return true; },
    status() { return { state: this.state, reasons: this.reasons.slice() }; }
  };
}

function rootFor(ctype = 'ranger') {
  return {
    character: { name: ctype === 'merchant' ? 'My_Merchant' : 'My_Ranger1', ctype, map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, gold: 1000000, items: [] },
    parent: { entities: {}, G: { maps: { main: {}, winterland: {} }, items: { hpot0: { g: 1 }, mpot0: { g: 1 } } } }
  };
}

function runtimeBase(overrides = {}) {
  const root = overrides.root || rootFor();
  return {
    root,
    now: overrides.now || (() => 100000),
    log: { emit() {} },
    adapter: { mode: 'active', getGameData: () => root.parent.G },
    globalSupervisor: overrides.globalSupervisor || supervisor(),
    partyBootstrap: overrides.partyBootstrap || { status: () => ({ active: true, ready: true }) },
    ...overrides
  };
}

function potionTotal(root, itemName) {
  return (root.character.items || []).reduce((sum, item) => sum + (item && item.name === itemName ? Number(item.q || 1) : 0), 0);
}

function installImmediateSend(root) {
  root.send_item = async (_name, index, quantity) => {
    const item = root.character.items[index];
    if (!item || item.q < quantity) return { success: false };
    item.q -= quantity;
    if (item.q === 0) root.character.items[index] = null;
    return { success: true };
  };
}

function bundlePlan(targetName = 'My_Ranger1') {
  return {
    id: `bundle-${targetName}`, kind: MerchantServicePlanKind.SERVICE_DELIVERY, sourceReportAt: 99900,
    target: { name: targetName, map: 'main', x: 20, y: 0 },
    delivery: { itemName: 'hpot0', quantity: 5000 },
    deliveries: [{ family: 'hp', itemName: 'hpot0', quantity: 5000 }, { family: 'mp', itemName: 'mpot0', quantity: 5000 }],
    metadata: { p0PotionBundle: true }
  };
}

test('verified map split can publish TEAM_REGROUP in DEGRADED and receiver is repaired', () => {
  const sent = [];
  const sup = supervisor('DEGRADED', ['NO_PROGRESS_DEGRADED', 'CONTENT_REVALIDATION_REQUIRED']);
  const runtime = runtimeBase({ globalSupervisor: sup });
  const team = {
    selfName: 'My_Ranger1', leaderName: 'My_Ranger1', complete: true, alive: true, positionsKnown: true, sameMap: false,
    members: [{ name: 'My_Ranger1', map: 'main' }, { name: 'My_Ranger2', map: 'winterland' }, { name: 'My_Ranger3', map: 'winterland' }]
  };
  const transport = { installDirectReceiver() { return true; }, send() { return true; } };
  runtime.partyAccountCommunication = { transport };
  runtime.lastSnapshot = { character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', x: 0, y: 0 }, entities: [] };
  const crossMap = {
    runtime,
    now: runtime.now,
    receiverInstalled: false,
    busy: false,
    lastAction: null,
    stats: {},
    _transport() { return null; },
    _ensureReceiver() {
      const t = this._transport();
      if (!t) return false;
      t.installDirectReceiver('alpha28.progression.crossmap', () => true);
      this.receiverInstalled = true;
      return true;
    },
    _supervisorAllowed() { return false; },
    _inCombat() { return false; },
    _team() { return team; },
    _makeRegroupObjective() { return { id: 'rg-1', kind: 'TEAM_REGROUP', leaderName: 'My_Ranger1', map: 'main', x: 0, y: 0 }; },
    _publishRegroup(_team, objective) { sent.push(objective); return true; },
    event() {},
    tick() { return false; }
  };
  runtime.alpha28LiveAuthorityLiveness = { crossMap };

  const module = new P0RegroupSupplyRecovery(runtime);
  assert.equal(crossMap.receiverInstalled, true);
  assert.equal(crossMap.tick(), true);
  assert.equal(sent.length, 1);
  assert.equal(crossMap.lastAction.reason, 'NO_PROGRESS_RECOVERY_TEAM_REGROUP');
  assert.equal(module.stats.recoveryRegroupPublishes, 1);

  sup.reasons = ['MOVEMENT_CIRCUIT_OPEN'];
  sent.length = 0;
  assert.equal(crossMap.tick(), false);
  assert.equal(sent.length, 0);
});

test('production fallback tick executes cross-map recovery even when the original alpha28 tick chain is missed', () => {
  const sup = supervisor('DEGRADED', ['NO_PROGRESS_DEGRADED']);
  const runtime = runtimeBase({ globalSupervisor: sup });
  runtime.lastSnapshot = { character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', x: 0, y: 0 }, entities: [] };
  const team = { selfName: 'My_Ranger1', leaderName: 'My_Ranger1', complete: true, alive: true, positionsKnown: true, sameMap: false, members: [] };
  let published = 0;
  const crossMap = {
    runtime, now: runtime.now, receiverInstalled: true, busy: false, stats: {},
    _transport() { return null; }, _ensureReceiver() { return true; }, _supervisorAllowed() { return false; }, _inCombat() { return false; }, _team() { return team; },
    _makeRegroupObjective() { return { id: 'rg-fallback', kind: 'TEAM_REGROUP', leaderName: 'My_Ranger1', map: 'main', x: 0, y: 0 }; },
    _publishRegroup() { published += 1; return true; }, event() {}, tick() { return false; }
  };
  runtime.alpha28LiveAuthorityLiveness = { crossMap };
  const module = new P0RegroupSupplyRecovery(runtime);
  crossMap.__p0LastTickAt = 0;
  assert.equal(module.beforeTick(), true);
  assert.equal(published, 1);
  assert.equal(module.stats.crossMapFallbackTicks, 1);
});

test('bootstrap wait does not age farmer no-progress but ready farming remains monitored', () => {
  let ready = false;
  const sup = supervisor();
  const runtime = runtimeBase({ globalSupervisor: sup, partyBootstrap: { status: () => ({ active: true, ready }) } });
  new P0RegroupSupplyRecovery(runtime);
  assert.equal(sup._activeWork({}), false);
  ready = true;
  assert.equal(sup._activeWork({}), true);
});

test('planner refuses farmer travel until merchant has 5000 hp and 5000 mp plus reserve, then plans exact bundle', () => {
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const runtime = runtimeBase({ merchantServicePlanner: planner });
  new P0RegroupSupplyRecovery(runtime);
  const report = { name: 'My_Ranger2', ctype: 'ranger', at: 99000, active: true, map: 'winterland', x: -200, y: -700, supplies: { hpPotions: 100, mpPotions: 100, freeSlots: 20 } };

  const restock = planner.plan({ merchant: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [{ name: 'hpot0', q: 100 }, { name: 'mpot0', q: 100 }] }, reports: [report], deliveryDistance: 400 });
  assert.equal(restock.kind, MerchantServicePlanKind.RESTOCK_REQUIRED);
  assert.equal(restock.reason, 'MERCHANT_POTION_BUNDLE_RESTOCK_REQUIRED');
  assert.deepEqual(restock.missingStock.map((row) => [row.itemName, row.required]), [['hpot0', 5080], ['mpot0', 5080]]);

  const ready = planner.plan({ merchant: { name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [{ name: 'hpot0', q: 5080 }, { name: 'mpot0', q: 5080 }] }, reports: [report], deliveryDistance: 400 });
  assert.equal(ready.kind, MerchantServicePlanKind.SERVICE_TRAVEL);
  assert.deepEqual(ready.deliveries.map((row) => [row.itemName, row.quantity]), [['hpot0', POTION_DELIVERY_QUANTITY], ['mpot0', POTION_DELIVERY_QUANTITY]]);
  assert.equal(planner.lowPotionCount, POTION_LOW_WATERMARK);
});

test('bundle executor commits exactly 5000 hpot0 and 5000 mpot0 with synchronous inventory updates', async () => {
  const root = rootFor('merchant');
  root.character.isize = 42;
  root.character.items = [{ name: 'hpot0', q: 5080 }, { name: 'mpot0', q: 5080 }];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  installImmediateSend(root);
  const persisted = {};
  const storage = { get(key) { return persisted[key] || null; }, set(key, value) { persisted[key] = value; return true; } };
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = new ControlledMerchantServiceExecutor({ root, storage, now: () => 100000, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), getEconomyEmergency: () => false, getTrustedNames: () => ['My_Ranger1'], verifyDelayMs: 25, verifyAttempts: 2, maxActionsPerWindow: 8 });
  service.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const runtime = runtimeBase({ root, merchantServicePlanner: planner, controlledMerchantService: service });
  const module = new P0RegroupSupplyRecovery(runtime);
  runtime.p0RegroupSupplyRecovery = module;
  assert.equal(installP0PotionBundleDeltaFix(runtime), true);

  const result = await service.execute(bundlePlan());
  assert.equal(result.committed, true);
  assert.equal(result.reason, 'POTION_BUNDLE_DELIVERY_LOCAL_DELTA_VERIFIED');
  assert.equal(root.character.items[0].q, 80);
  assert.equal(root.character.items[1].q, 80);
  assert.equal(module.stats.bundleDeliveriesCommitted, 1);
});

test('bundle executor sends exact 5000+5000 across fragmented inventory stacks', async () => {
  const root = rootFor('merchant');
  root.character.isize = 42;
  root.character.items = [
    { name: 'hpot0', q: 3000 }, { name: 'hpot0', q: 2080 },
    { name: 'mpot0', q: 2000 }, { name: 'mpot0', q: 3080 }
  ];
  root.parent.entities.r1 = { name: 'My_Ranger1', map: 'main', x: 20, y: 0, real_x: 20, real_y: 0 };
  installImmediateSend(root);
  const persisted = {};
  const storage = { get(key) { return persisted[key] || null; }, set(key, value) { persisted[key] = value; return true; } };
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const service = new ControlledMerchantServiceExecutor({ root, storage, now: () => 100000, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), getEconomyEmergency: () => false, getTrustedNames: () => ['My_Ranger1'], verifyDelayMs: 25, verifyAttempts: 2, maxActionsPerWindow: 8 });
  service.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  const runtime = runtimeBase({ root, merchantServicePlanner: planner, controlledMerchantService: service });
  const module = new P0RegroupSupplyRecovery(runtime);
  runtime.p0RegroupSupplyRecovery = module;
  assert.equal(installP0PotionBundleDeltaFix(runtime), true);

  const result = await service.execute(bundlePlan());
  assert.equal(result.committed, true);
  assert.equal(potionTotal(root, 'hpot0'), 80);
  assert.equal(potionTotal(root, 'mpot0'), 80);
  assert.equal(module.stats.bundleDeliveriesCommitted, 1);
  assert.equal(service.stats.rawActions, 4);
});

test('alpha27 restock purchases both required potion families before service travel becomes possible', async () => {
  const root = rootFor('merchant');
  root.character.items = [{ name: 'hpot0', q: 80 }, { name: 'mpot0', q: 80 }];
  root.can_buy = () => true;
  root.buy = async (name, quantity) => { root.character.items.find((row) => row.name === name).q += quantity; root.character.gold -= quantity; return { success: true }; };
  const planner = new MerchantServicePlanner({ now: () => 100000, merchantPotionReserve: 80 });
  const merchant = {
    root, now: () => 100000,
    options: { merchantPotionLow: 160, merchantPotionTarget: 500, merchantMaxPotionBuy: 500, goldReserve: 10000 },
    stats: {}, lastMerchantPlan: null, lastMerchantAction: null,
    ensureStandClosed: async () => true,
    restockPartyPotions: async () => false,
    atomic: { namedServiceTravel: async () => ({ ok: true }), _timeout: async (p) => p, verifyEventually: async (fn) => fn() }
  };
  const runtime = runtimeBase({ root, merchantServicePlanner: planner, alpha27CombatMerchantConvergence: { merchant } });
  new P0RegroupSupplyRecovery(runtime);
  const report = { name: 'My_Ranger3', ctype: 'ranger', at: 99000, active: true, map: 'winterland', x: -250, y: -700, supplies: { hpPotions: 100, mpPotions: 100, freeSlots: 20 } };
  runtime.lastMerchantServicePlan = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report], deliveryDistance: 400 });
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(root.character.items[0].q, 5080);
  assert.equal(await merchant.restockPartyPotions(), true);
  assert.equal(root.character.items[1].q, 5080);
  const ready = planner.plan({ merchant: { ...root.character, inventory: root.character.items }, reports: [report], deliveryDistance: 400 });
  assert.equal(ready.kind, MerchantServicePlanKind.SERVICE_TRAVEL);
});

test('gear delivery receives a fresh scoped owned-farmer map attestation', () => {
  let captured = null;
  const runtime = runtimeBase({
    merchantServicePlanner: { reportTtlMs: 25000 },
    partyTelemetry: { status: () => ({ reports: [{ name: 'My_Ranger2', at: 99000, map: 'winterland', x: -200, y: -700 }] }) },
    planTravel(request, context = {}) { captured = { request, context }; return { accepted: true, plan: { id: 'gear-travel' } }; }
  });
  new P0RegroupSupplyRecovery(runtime);
  runtime.planTravel({ destination: { map: 'winterland', x: -200, y: -700 }, metadata: { source: 'ALPHA27_GEAR_DELIVERY', targetName: 'My_Ranger2' } });
  assert.equal(captured.context.destinationMapAttestation.source, 'trusted-owned-farmer-service');
  assert.equal(captured.context.destinationMapAttestation.subject, 'My_Ranger2');
});

test('gear delivery is not falsely rejected as SERVICE_REPORT_ALREADY_SERVED by a prior potion delivery', () => {
  const root = rootFor('merchant');
  const service = new ControlledMerchantServiceExecutor({ root, now: () => 100000, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }), getEconomyEmergency: () => false, getTrustedNames: () => ['My_Ranger2'] });
  service.configure({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowDelivery: true });
  service.servedReports.set('My_Ranger2', 99900);
  const runtime = runtimeBase({ root, controlledMerchantService: service });
  new P0RegroupSupplyRecovery(runtime);
  const result = service._preflight({ kind: MerchantServicePlanKind.SERVICE_DELIVERY, sourceReportAt: 99900, target: { name: 'My_Ranger2' }, metadata: { alpha27GearGoal: 'goal-1' } });
  assert.equal(result.ok, true);
});

test('legacy direct party potion supply is disabled so there is only one potion owner', () => {
  let processCalls = 0;
  let requestCalls = 0;
  const logistics = { config: {}, _processSupply() { processCalls += 1; return true; }, _requestSupply() { requestCalls += 1; return true; } };
  const runtime = runtimeBase({ controlledPartyLogistics: logistics });
  const module = new P0RegroupSupplyRecovery(runtime);
  assert.equal(logistics._processSupply({}), false);
  assert.equal(logistics._requestSupply({}), false);
  assert.equal(processCalls, 0);
  assert.equal(requestCalls, 0);
  assert.equal(logistics.config.farmerPotionTarget, 5000);
  assert.equal(logistics.config.maxSupplyBatch, 5000);
  assert.equal(module.status().potionPolicy.deliveryPerFarmer.hpot0, 5000);
  assert.equal(module.status().potionPolicy.deliveryPerFarmer.mpot0, 5000);
});
