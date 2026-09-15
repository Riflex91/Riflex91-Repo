'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ContentDriftMonitor, ContentLifecycle } = require('../src/world/content-drift');
const { MerchantServicePlanner } = require('../src/merchant/merchant-service-planner');
const {
  ObservableBankCapacityManager,
  PreFarmingReliabilityPolicy,
  hasObservableBankSnapshot,
  supplyEvidenceComplete,
  serviceEvidenceComplete,
  sanitizeVolatileContent
} = require('../src/reliability/pre-farming-reliability');

function runtimeFixture(overrides = {}) {
  const character = overrides.character || { name: 'FarmerA', ctype: 'ranger', map: 'main', hp: 1000, max_hp: 1000 };
  const root = { character };
  root.parent = root;
  const farmer = overrides.farmer || {
    enabled: true,
    targetId: null,
    state: 'ASSESS',
    ensureScheduledCalls: 0,
    setEnabled(value) { this.enabled = value === true; return this.enabled; },
    ensureScheduled() { this.ensureScheduledCalls += 1; return 'farmer-task'; },
    _safeLiveMonsters(snapshot) { return (snapshot.entities || []).filter((row) => row && row.mtype && !row.dead); }
  };
  const localFarming = overrides.localFarming || {
    enabled: true,
    currentPlan: null,
    _visibleMonsters(snapshot) { return (snapshot.entities || []).filter((row) => row && row.mtype && !row.dead); }
  };
  const partyTelemetry = overrides.partyTelemetry || {
    _cleanReport(report, sender) {
      return {
        ...report,
        sender,
        supplies: {
          inventorySize: Number(report.supplies && report.supplies.inventorySize) || 0,
          inventoryLimit: Number(report.supplies && report.supplies.inventoryLimit) || 0,
          freeSlots: Number(report.supplies && report.supplies.freeSlots) || 0,
          hpPotions: Number(report.supplies && report.supplies.hpPotions) || 0,
          mpPotions: Number(report.supplies && report.supplies.mpPotions) || 0,
          preferredHpPotion: report.supplies && report.supplies.preferredHpPotion || null,
          preferredMpPotion: report.supplies && report.supplies.preferredMpPotion || null
        }
      };
    }
  };
  const contentDrift = overrides.contentDrift || new ContentDriftMonitor({ now: () => 1000, categories: ['maps', 'npcs'] });
  const logEvents = [];
  const runtime = {
    root,
    farmer,
    localFarming,
    partyTelemetry,
    merchantServicePlanner: overrides.merchantServicePlanner || new MerchantServicePlanner({ now: () => 1000 }),
    contentDrift,
    now: () => 1000,
    _farmSnapshot(snapshot) {
      if (typeof overrides.farmSnapshotFilter === 'function') return overrides.farmSnapshotFilter(snapshot);
      return snapshot;
    },
    log: { emit(row) { logEvents.push(row); } },
    logEvents
  };
  return runtime;
}

function primeSafeSnapshot(runtime, snapshot) {
  return runtime._farmSnapshot(snapshot, {}, {});
}

test('merchant role boundary disables and prevents scheduling of generic Farmer FSM and local farming before runtime ticks', () => {
  const runtime = runtimeFixture({ character: { name: 'My_Merchant', ctype: 'merchant', map: 'main' } });
  const policy = new PreFarmingReliabilityPolicy(runtime);
  assert.equal(runtime.farmer.enabled, false);
  assert.equal(runtime.localFarming.enabled, false);
  assert.equal(runtime.farmer.ensureScheduled({}, 'My_Merchant'), null);
  assert.equal(runtime.farmer.ensureScheduledCalls, 0);
  assert.equal(policy.status().merchantFarmerFsmAllowed, false);
  assert.equal(policy.status().merchantFarmerSchedulingAllowed, false);
  assert.equal(policy.status().stats.merchantFarmerSuppressions, 1);
  assert.equal(policy.status().stats.merchantScheduleSuppressions, 1);
  assert.equal(policy.status().stats.merchantLocalFarmSuppressions, 1);
});

test('incidental safety-approved hens no longer block repositioning while planned hens and self-aggro still do', () => {
  const runtime = runtimeFixture();
  const policy = new PreFarmingReliabilityPolicy(runtime);
  const snapshot = {
    observedAt: 1000,
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
    entities: [
      { id: 'hen-1', mtype: 'hen', map: 'main' },
      { id: 'squig-1', mtype: 'squigtoad', map: 'main' },
      { id: 'crab-1', mtype: 'crab', map: 'main', target: 'FarmerA' }
    ]
  };
  primeSafeSnapshot(runtime, snapshot);

  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id).sort(), ['crab-1', 'squig-1']);
  assert.deepEqual(runtime.farmer._safeLiveMonsters(snapshot, {}).map((row) => row.id).sort(), ['crab-1', 'squig-1']);

  runtime.localFarming.currentPlan = { monster: 'hen' };
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id).sort(), ['crab-1', 'hen-1']);
  assert.deepEqual(runtime.farmer._safeLiveMonsters(snapshot, {}).map((row) => row.id).sort(), ['crab-1', 'hen-1']);
  assert.ok(policy.status().stats.incidentalVisibleMonstersIgnored >= 2);
  assert.ok(policy.status().stats.incidentalTargetsFiltered >= 2);
});

test('unknown or safety-rejected incidental monsters remain navigation blockers', () => {
  const runtime = runtimeFixture({
    farmSnapshotFilter(snapshot) {
      return { ...snapshot, entities: (snapshot.entities || []).filter((row) => row.id !== 'danger-1') };
    }
  });
  const policy = new PreFarmingReliabilityPolicy(runtime);
  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  const snapshot = {
    observedAt: 1000,
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
    entities: [
      { id: 'hen-1', mtype: 'hen', map: 'main' },
      { id: 'squig-1', mtype: 'squigtoad', map: 'main' },
      { id: 'danger-1', mtype: 'unknownboss', map: 'main' }
    ]
  };
  primeSafeSnapshot(runtime, snapshot);
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id).sort(), ['danger-1', 'squig-1']);
  assert.equal(policy.status().unsafeOrUnknownVisibleMonsterStillBlocksNavigation, true);
  assert.equal(policy.status().stats.unsafeVisibleMonstersBlocked, 1);
});

test('explicit Farmer target remains a navigation blocker even when it is not the planned monster type', () => {
  const runtime = runtimeFixture();
  new PreFarmingReliabilityPolicy(runtime);
  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  runtime.farmer.targetId = 'hen-1';
  const snapshot = {
    observedAt: 1000,
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
    entities: [{ id: 'hen-1', mtype: 'hen', map: 'main' }]
  };
  primeSafeSnapshot(runtime, snapshot);
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id), ['hen-1']);
});

test('missing Farmer supply or location telemetry stays UNKNOWN and cannot fabricate zero-potion or 0,0 service plans', () => {
  const runtime = runtimeFixture();
  const policy = new PreFarmingReliabilityPolicy(runtime);
  const cleaned = runtime.partyTelemetry._cleanReport({
    name: 'FarmerA',
    ctype: 'ranger',
    at: 1000,
    map: 'main',
    supplies: {}
  }, 'FarmerA');
  assert.equal(cleaned.x, null);
  assert.equal(cleaned.y, null);
  assert.equal(cleaned.supplies.hpPotions, null);
  assert.equal(cleaned.supplies.mpPotions, null);
  assert.equal(cleaned.supplies.freeSlots, null);
  assert.equal(cleaned.supplies.complete, false);
  assert.equal(cleaned.serviceEvidenceComplete, false);
  assert.equal(supplyEvidenceComplete(cleaned.supplies), false);
  assert.equal(serviceEvidenceComplete(cleaned), false);

  const plan = runtime.merchantServicePlanner.plan({
    merchant: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [{ name: 'hpot1', q: 1000 }] },
    reports: [cleaned],
    standOpen: false
  });
  assert.equal(plan.kind, 'HOLD');
  assert.equal(plan.reason, 'SUPPLY_EVIDENCE_INSUFFICIENT');
  assert.equal(policy.status().stats.supplyHolds, 1);
});

test('a real observed zero potion count at explicit 0,0 remains actionable after nullable telemetry hardening', () => {
  const runtime = runtimeFixture();
  new PreFarmingReliabilityPolicy(runtime);
  const cleaned = runtime.partyTelemetry._cleanReport({
    name: 'FarmerA', ctype: 'ranger', at: 1000, map: 'main', x: 0, y: 0,
    supplies: { inventorySize: 2, inventoryLimit: 42, freeSlots: 40, hpPotions: 0, mpPotions: 500, preferredHpPotion: 'hpot1' }
  }, 'FarmerA');
  assert.equal(cleaned.supplies.complete, true);
  assert.equal(cleaned.serviceEvidenceComplete, true);
  const plan = runtime.merchantServicePlanner.plan({
    merchant: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [{ name: 'hpot1', q: 1000 }] },
    reports: [cleaned],
    standOpen: false,
    deliveryDistance: 400
  });
  assert.equal(plan.kind, 'SERVICE_DELIVERY');
  assert.equal(plan.reason, 'HP_POTIONS_CRITICAL');
  assert.equal(plan.target.x, 0);
  assert.equal(plan.target.y, 0);
  assert.ok(plan.delivery.quantity > 0);
});

test('incomplete service evidence never masks a stronger Merchant safety hold', () => {
  const runtime = runtimeFixture();
  new PreFarmingReliabilityPolicy(runtime);
  const cleaned = runtime.partyTelemetry._cleanReport({ name: 'FarmerA', ctype: 'ranger', at: 1000, map: 'main', supplies: {} }, 'FarmerA');
  const plan = runtime.merchantServicePlanner.plan({
    merchant: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [] },
    reports: [cleaned],
    inCombat: true,
    standOpen: false
  });
  assert.equal(plan.kind, 'HOLD');
  assert.equal(plan.reason, 'MERCHANT_IN_COMBAT');
});

test('bank capacity is NOT_OBSERVABLE outside a real bank snapshot and cannot fabricate pressure or a plan', () => {
  const manager = new ObservableBankCapacityManager({ now: () => 1000, workspaceSlots: 3 });
  assert.equal(hasObservableBankSnapshot({ name: 'Merchant', map: 'main' }), false);
  const observation = manager.observe({ character: { name: 'Merchant', map: 'main', gold: 10000000 }, bankPacks: { items0: ['bank', 0, 0] } });
  assert.equal(observation.observable, false);
  assert.equal(observation.observationState, 'NOT_OBSERVABLE');
  assert.equal(observation.totals.free, null);
  assert.equal(observation.pressureNow, false);
  assert.equal(observation.sustainedPressure, false);
  assert.equal(manager.pressureHistory.length, 0);

  const plan = manager.planSpace({ item: 'seashell', quantity: 1 }, { observation });
  assert.equal(plan.planned, false);
  assert.equal(plan.reason, 'BANK_SNAPSHOT_NOT_OBSERVABLE');
});

test('real observed bank arrays retain normal capacity semantics', () => {
  const manager = new ObservableBankCapacityManager({ now: () => 1000, workspaceSlots: 1 });
  const character = { name: 'Merchant', map: 'bank', gold: 10000000, bank: { items0: [null, null, null] } };
  assert.equal(hasObservableBankSnapshot(character), true);
  const observation = manager.observe({ character, bankPacks: { items0: ['bank', 0, 0] }, gameData: { items: {} } });
  assert.equal(observation.observable, true);
  assert.equal(observation.observationState, 'OBSERVED');
  assert.equal(observation.totals.capacity, 3);
  assert.equal(observation.totals.free, 3);
  assert.equal(observation.pressureNow, false);
});

test('content semantic projection strips runtime fields but preserves meaningful map changes', () => {
  const first = sanitizeVolatileContent({
    monsters: [{ type: 'hen', count: 4 }],
    doors: [[1, 2, 'main']],
    loaded: true,
    last_update: 123,
    runtime: { players: 5 },
    nested: { updatedAt: 999, safe: true }
  });
  const second = sanitizeVolatileContent({
    monsters: [{ type: 'hen', count: 4 }],
    doors: [[1, 2, 'main']],
    loaded: false,
    last_update: 456,
    runtime: { players: 99 },
    nested: { updatedAt: 111, safe: true }
  });
  assert.deepEqual(first.value, second.value);
  assert.ok(first.stripped >= 4);

  const semanticChange = sanitizeVolatileContent({ monsters: [{ type: 'hen', count: 5 }], doors: [[1, 2, 'main']], nested: { safe: true } });
  assert.notDeepEqual(first.value, semanticChange.value);
});

test('high-flap legacy quarantine becomes OBSERVED only after three stable semantic observations and never gains control authority', () => {
  let now = 1000;
  const monitor = new ContentDriftMonitor({ now: () => now, categories: ['maps'], minObservedSamples: 2 });
  monitor._observe('maps', 'uhills', { monsters: [{ type: 'hen', count: 4 }], last_update: 1 }, { baselineAllowed: true });
  const legacy = monitor.records.get('maps:uhills');
  legacy.lifecycle = ContentLifecycle.QUARANTINED;
  legacy.changeCount = 12;

  const runtime = runtimeFixture({ contentDrift: monitor });
  const policy = new PreFarmingReliabilityPolicy(runtime);
  for (let i = 0; i < 3; i += 1) {
    now += 1000;
    monitor._observe('maps', 'uhills', { monsters: [{ type: 'hen', count: 4 }], last_update: i + 10 }, { baselineAllowed: false });
  }
  const observed = monitor.records.get('maps:uhills');
  assert.equal(observed.lifecycle, ContentLifecycle.OBSERVED);
  assert.equal(policy.status().contentMigrationControlAuthority, false);
  assert.equal(policy.status().stats.contentFlappingRecordsReobserved, 1);
  const serialized = JSON.parse(monitor.serialize());
  const serializedRecord = serialized.records.find(([key]) => key === 'maps:uhills')[1];
  assert.equal(serializedRecord.semanticFingerprintProfile, 'stable-runtime-fields-v1');

  now += 1000;
  const changed = monitor._observe('maps', 'uhills', { monsters: [{ type: 'hen', count: 5 }], last_update: 999 }, { baselineAllowed: false });
  assert.equal(changed.kind, 'DRIFT');
  assert.equal(monitor.records.get('maps:uhills').lifecycle, ContentLifecycle.QUARANTINED);
});

test('3000-cycle incidental-monster arbitration soak never promotes random safe hens over a planned farm type', () => {
  const runtime = runtimeFixture();
  const policy = new PreFarmingReliabilityPolicy(runtime);
  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  for (let i = 0; i < 3000; i += 1) {
    const snapshot = {
      observedAt: i,
      character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
      entities: [
        { id: `hen-${i}`, mtype: 'hen', map: 'main' },
        { id: `squig-${i}`, mtype: 'squigtoad', map: 'main' }
      ]
    };
    primeSafeSnapshot(runtime, snapshot);
    const localBlocking = runtime.localFarming._visibleMonsters(snapshot);
    const targets = runtime.farmer._safeLiveMonsters(snapshot, {});
    assert.equal(localBlocking.length, 1);
    assert.equal(localBlocking[0].mtype, 'squigtoad');
    assert.equal(targets.length, 1);
    assert.equal(targets[0].mtype, 'squigtoad');
  }
  assert.equal(policy.status().stats.incidentalVisibleMonstersIgnored, 3000);
  assert.equal(policy.status().stats.incidentalTargetsFiltered, 3000);
});

test('2500-cycle unsafe incidental-monster soak never ignores a monster rejected by the existing safety snapshot', () => {
  const runtime = runtimeFixture({
    farmSnapshotFilter(snapshot) {
      return { ...snapshot, entities: (snapshot.entities || []).filter((row) => row.id !== 'danger') };
    }
  });
  const policy = new PreFarmingReliabilityPolicy(runtime);
  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  for (let i = 0; i < 2500; i += 1) {
    const snapshot = {
      observedAt: i,
      character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
      entities: [
        { id: `hen-${i}`, mtype: 'hen', map: 'main' },
        { id: `squig-${i}`, mtype: 'squigtoad', map: 'main' },
        { id: 'danger', mtype: 'unknownboss', map: 'main' }
      ]
    };
    primeSafeSnapshot(runtime, snapshot);
    const ids = runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id);
    assert.ok(ids.includes('danger'));
    assert.ok(ids.includes(`squig-${i}`));
    assert.ok(!ids.includes(`hen-${i}`));
  }
  assert.equal(policy.status().stats.incidentalVisibleMonstersIgnored, 2500);
  assert.equal(policy.status().stats.unsafeVisibleMonstersBlocked, 2500);
});
