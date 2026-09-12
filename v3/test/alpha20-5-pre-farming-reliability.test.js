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
    setEnabled(value) { this.enabled = value === true; return this.enabled; },
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
  return {
    root,
    farmer,
    localFarming,
    partyTelemetry,
    merchantServicePlanner: overrides.merchantServicePlanner || new MerchantServicePlanner({ now: () => 1000 }),
    contentDrift,
    log: { emit(row) { logEvents.push(row); } },
    logEvents
  };
}

test('merchant role boundary disables generic Farmer FSM and local farming before runtime ticks', () => {
  const runtime = runtimeFixture({ character: { name: 'My_Merchant', ctype: 'merchant', map: 'main' } });
  const policy = new PreFarmingReliabilityPolicy(runtime);
  assert.equal(runtime.farmer.enabled, false);
  assert.equal(runtime.localFarming.enabled, false);
  assert.equal(policy.status().merchantFarmerFsmAllowed, false);
  assert.equal(policy.status().stats.merchantFarmerSuppressions, 1);
  assert.equal(policy.status().stats.merchantLocalFarmSuppressions, 1);
});

test('incidental hens no longer block local repositioning while planned hens and self-aggro still do', () => {
  const runtime = runtimeFixture();
  const policy = new PreFarmingReliabilityPolicy(runtime);
  const snapshot = {
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
    entities: [
      { id: 'hen-1', mtype: 'hen', map: 'main' },
      { id: 'squig-1', mtype: 'squigtoad', map: 'main' },
      { id: 'crab-1', mtype: 'crab', map: 'main', target: 'FarmerA' }
    ]
  };

  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id).sort(), ['crab-1', 'squig-1']);
  assert.deepEqual(runtime.farmer._safeLiveMonsters(snapshot, {}).map((row) => row.id).sort(), ['crab-1', 'squig-1']);

  runtime.localFarming.currentPlan = { monster: 'hen' };
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id).sort(), ['crab-1', 'hen-1']);
  assert.deepEqual(runtime.farmer._safeLiveMonsters(snapshot, {}).map((row) => row.id).sort(), ['crab-1', 'hen-1']);
  assert.ok(policy.status().stats.incidentalVisibleMonstersIgnored >= 2);
  assert.ok(policy.status().stats.incidentalTargetsFiltered >= 2);
});

test('explicit Farmer target remains a navigation blocker even when it is not the planned monster type', () => {
  const runtime = runtimeFixture();
  new PreFarmingReliabilityPolicy(runtime);
  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  runtime.farmer.targetId = 'hen-1';
  const snapshot = {
    character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
    entities: [{ id: 'hen-1', mtype: 'hen', map: 'main' }]
  };
  assert.deepEqual(runtime.localFarming._visibleMonsters(snapshot).map((row) => row.id), ['hen-1']);
});

test('missing Farmer supply telemetry stays UNKNOWN and cannot fabricate a critical zero-potion service plan', () => {
  const runtime = runtimeFixture();
  const policy = new PreFarmingReliabilityPolicy(runtime);
  const cleaned = runtime.partyTelemetry._cleanReport({
    name: 'FarmerA',
    ctype: 'ranger',
    at: 1000,
    map: 'main',
    x: 10,
    y: 20,
    supplies: {}
  }, 'FarmerA');
  assert.equal(cleaned.supplies.hpPotions, null);
  assert.equal(cleaned.supplies.mpPotions, null);
  assert.equal(cleaned.supplies.freeSlots, null);
  assert.equal(cleaned.supplies.complete, false);
  assert.equal(supplyEvidenceComplete(cleaned.supplies), false);

  const plan = runtime.merchantServicePlanner.plan({
    merchant: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [{ name: 'hpot1', q: 1000 }] },
    reports: [cleaned],
    standOpen: false
  });
  assert.equal(plan.kind, 'HOLD');
  assert.equal(plan.reason, 'SUPPLY_EVIDENCE_INSUFFICIENT');
  assert.equal(policy.status().stats.supplyHolds, 1);
});

test('a real observed zero potion count remains actionable after nullable telemetry hardening', () => {
  const runtime = runtimeFixture();
  new PreFarmingReliabilityPolicy(runtime);
  const cleaned = runtime.partyTelemetry._cleanReport({
    name: 'FarmerA', ctype: 'ranger', at: 1000, map: 'main', x: 10, y: 20,
    supplies: { inventorySize: 2, inventoryLimit: 42, freeSlots: 40, hpPotions: 0, mpPotions: 500, preferredHpPotion: 'hpot1' }
  }, 'FarmerA');
  assert.equal(cleaned.supplies.complete, true);
  const plan = runtime.merchantServicePlanner.plan({
    merchant: { name: 'Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0, inventory: [{ name: 'hpot1', q: 1000 }] },
    reports: [cleaned],
    standOpen: false,
    deliveryDistance: 400
  });
  assert.equal(plan.kind, 'SERVICE_DELIVERY');
  assert.equal(plan.reason, 'HP_POTIONS_CRITICAL');
  assert.ok(plan.delivery.quantity > 0);
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

test('high-flap legacy quarantine can recover only after three stable semantic observations; later semantic drift quarantines again', () => {
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
  assert.equal(monitor.records.get('maps:uhills').lifecycle, ContentLifecycle.OBSERVED);
  assert.equal(policy.status().stats.contentFlappingRecordsRevalidated, 1);

  now += 1000;
  const changed = monitor._observe('maps', 'uhills', { monsters: [{ type: 'hen', count: 5 }], last_update: 999 }, { baselineAllowed: false });
  assert.equal(changed.kind, 'DRIFT');
  assert.equal(monitor.records.get('maps:uhills').lifecycle, ContentLifecycle.QUARANTINED);
});

test('3000-cycle incidental-monster arbitration soak never promotes random hens over a planned farm type', () => {
  const runtime = runtimeFixture();
  const policy = new PreFarmingReliabilityPolicy(runtime);
  runtime.localFarming.currentPlan = { monster: 'squigtoad' };
  for (let i = 0; i < 3000; i += 1) {
    const snapshot = {
      character: { name: 'FarmerA', ctype: 'ranger', map: 'main' },
      entities: [
        { id: `hen-${i}`, mtype: 'hen', map: 'main' },
        { id: `squig-${i}`, mtype: 'squigtoad', map: 'main' }
      ]
    };
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
