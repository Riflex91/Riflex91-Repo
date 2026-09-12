'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventLog } = require('../src/core/event-log');
const { FlightRecorder } = require('../src/ops/flight-recorder');
const { GroupLivenessMonitor } = require('../src/ops/group-liveness');
const { RuntimeProgressWatchdog } = require('../src/ops/runtime-watchdog');
const { ReliabilityCheckpointStore } = require('../src/ops/reliability-checkpoint');
const { HeadlessOperations } = require('../src/ops/headless-operations');

function memoryStorage() {
  const rows = new Map();
  return {
    rows,
    get: (key) => rows.get(key),
    set: (key, value) => { rows.set(key, value); return true; }
  };
}

function liveRegistry(now, names = ['MerchantA', 'RangerA', 'RangerB', 'RangerC']) {
  return {
    status: () => ({
      characters: names.map((name, index) => ({
        name,
        ctype: index === 0 ? 'merchant' : 'ranger',
        level: 80,
        map: 'main',
        presence: 'ONLINE',
        online: true,
        available: true,
        dead: false,
        observationAgeMs: 0,
        primarySource: index === 0 ? 'self' : 'party',
        lastSeenAt: now()
      }))
    })
  };
}

function runtimeFixture(clock, options = {}) {
  const now = () => clock.value;
  const names = ['MerchantA', 'RangerA', 'RangerB', 'RangerC'];
  const log = new EventLog({ now, runId: 'alpha205-reliability' });
  const storage = options.storage || memoryStorage();
  const snapshot = {
    observedAt: clock.value,
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', x: 10, y: 20,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 1000,
      rip: false, moving: false, target: null
    },
    party: names.slice(1).map((name) => ({ name, type: 'ranger', level: 80, map: 'main' }))
  };
  const runtime = {
    root: {},
    now,
    log,
    startedAt: clock.value,
    lastHeartbeat: clock.value,
    lastSnapshot: snapshot,
    adapter: { mode: options.mode || 'shadow' },
    characterRegistry: liveRegistry(now, names),
    globalSupervisor: { status: () => ({ state: 'HEALTHY', reasons: [] }) },
    scheduler: { snapshot: () => ({ active: [], queued: [] }) },
    transactionEngine: { status: () => ({ active: 0, recovering: 0, states: {}, circuits: {} }) },
    safeTravel: { status: () => ({ active: 0, states: {}, circuit: { open: false } }) },
    controlledPartyLifecycle: { status: () => ({ enabled: false, operation: null, developmentSession: null, breaker: { open: false } }) },
    controlledPaladinAura: { status: () => ({ enabled: false, actionAuthority: false }) },
    persistence: { storage, maybeSave: () => true },
    world: { revision: 1, serialize: () => '{"revision":1}' },
    farmerStatus: () => ({ enabled: options.farmerEnabled === true, state: options.farmerState || 'IDLE', targetType: null }),
    status: () => ({ version: '3.0.0-alpha.20.0', mode: runtime.adapter.mode, character: snapshot.character }),
    setMode: (mode) => { runtime.adapter.mode = mode; return mode; },
    setFarmerEnabled: () => false,
    setFarmerTargetPolicy: (value) => value,
    addFarmerTargetExclusion: (value) => value,
    removeFarmerTargetExclusion: () => true,
    combatRisk: { approveMonsterType: () => ({}), quarantineMonsterType: () => ({}) }
  };
  return { runtime, storage, log, snapshot };
}

test('GroupLivenessMonitor recognizes a fresh Merchant plus three combat party and degrades on stale member', () => {
  const clock = { value: 10000 };
  const { runtime } = runtimeFixture(clock);
  const monitor = new GroupLivenessMonitor({ now: () => clock.value, staleAfterMs: 15000 });
  const healthy = monitor.evaluate(runtime);
  assert.equal(healthy.state, 'HEALTHY');
  assert.equal(healthy.fourCharacterReady, true);
  assert.equal(healthy.memberCount, 4);
  assert.equal(healthy.invalidMembers.length, 0);

  runtime.characterRegistry.status = () => ({
    characters: [
      { name: 'MerchantA', ctype: 'merchant', presence: 'ONLINE', online: true, available: true, dead: false, observationAgeMs: 0 },
      { name: 'RangerA', ctype: 'ranger', presence: 'ONLINE', online: true, available: true, dead: false, observationAgeMs: 0 },
      { name: 'RangerB', ctype: 'ranger', presence: 'STALE', online: null, available: null, dead: false, observationAgeMs: 20000 },
      { name: 'RangerC', ctype: 'ranger', presence: 'ONLINE', online: true, available: true, dead: false, observationAgeMs: 0 }
    ]
  });
  const degraded = monitor.evaluate(runtime);
  assert.equal(degraded.state, 'DEGRADED');
  assert.deepEqual(degraded.invalidMembers, ['RangerB']);
  assert.equal(degraded.fourCharacterReady, false);
});

test('RuntimeProgressWatchdog does not call shadow/idle a stuck state but detects missing active progress', () => {
  const clock = { value: 10000 };
  const fixture = runtimeFixture(clock, { mode: 'shadow', farmerEnabled: false });
  const monitor = new GroupLivenessMonitor({ now: () => clock.value });
  const watchdog = new RuntimeProgressWatchdog({
    now: () => clock.value,
    watchAfterMs: 10000,
    degradedAfterMs: 20000,
    progressWatchAfterMs: 5000,
    progressDegradedAfterMs: 10000
  });

  watchdog.observe(fixture.runtime, monitor.evaluate(fixture.runtime));
  for (let i = 0; i < 6; i += 1) {
    clock.value += 5000;
    fixture.runtime.lastHeartbeat = clock.value;
    fixture.snapshot.observedAt = clock.value;
    const row = watchdog.observe(fixture.runtime, monitor.evaluate(fixture.runtime));
    assert.equal(row.activityExpected, false);
    assert.equal(row.state, 'HEALTHY');
  }

  fixture.runtime.adapter.mode = 'active';
  fixture.runtime.farmerStatus = () => ({ enabled: true, state: 'ENGAGE', targetType: 'goo' });
  watchdog.observe(fixture.runtime, monitor.evaluate(fixture.runtime));
  clock.value += 6000;
  fixture.runtime.lastHeartbeat = clock.value;
  fixture.snapshot.observedAt = clock.value;
  let row = watchdog.observe(fixture.runtime, monitor.evaluate(fixture.runtime));
  assert.equal(row.state, 'WATCH');
  assert.equal(row.reason, 'EXPECTED_ACTIVITY_PROGRESS_WATCH');

  clock.value += 5000;
  fixture.runtime.lastHeartbeat = clock.value;
  fixture.snapshot.observedAt = clock.value;
  row = watchdog.observe(fixture.runtime, monitor.evaluate(fixture.runtime));
  assert.equal(row.state, 'DEGRADED');
  assert.equal(row.reason, 'EXPECTED_ACTIVITY_NO_PROGRESS');
  assert.equal(row.recoveryRecommendation, 'REPLAN_THEN_SAFE_MODE');
  assert.equal(row.automaticRecovery, false);
});

test('RuntimeProgressWatchdog freshness can degrade without another runtime observe call', () => {
  const clock = { value: 1000 };
  const { runtime } = runtimeFixture(clock);
  const watchdog = new RuntimeProgressWatchdog({ now: () => clock.value, watchAfterMs: 2000, degradedAfterMs: 5000 });
  watchdog.observe(runtime, null);
  clock.value += 6000;
  const status = watchdog.status(runtime, null);
  assert.equal(status.state, 'DEGRADED');
  assert.equal(status.reason, 'SNAPSHOT_STALE');
  assert.equal(status.actionAuthority, false);
});

test('ReliabilityCheckpointStore writes inactive slot then pointer and falls back from corruption without resume authority', () => {
  const clock = { value: 1000 };
  const storage = memoryStorage();
  const first = new ReliabilityCheckpointStore({ storage, now: () => clock.value, baseKey: 'TEST_CP' });
  const a = first.save({ marker: 'one', transaction: { state: 'EXECUTING' } });
  assert.equal(a.saved, true);
  assert.equal(a.slot, 'A');
  clock.value += 100;
  const b = first.save({ marker: 'two', transaction: { state: 'RECOVERING' } });
  assert.equal(b.saved, true);
  assert.equal(b.slot, 'B');
  assert.equal(storage.get('TEST_CP_PTR'), 'B');

  storage.set('TEST_CP_B', '{corrupt');
  const restarted = new ReliabilityCheckpointStore({ storage, now: () => clock.value, baseKey: 'TEST_CP' });
  const loaded = restarted.load();
  assert.equal(loaded.slot, 'A');
  assert.equal(loaded.snapshot.marker, 'one');
  assert.equal(loaded.resumeAllowed, false);
  assert.equal(loaded.reconciliationRequired, true);
  assert.equal(restarted.status().stats.fallbacks, 1);
  assert.ok(restarted.status().stats.corrupt >= 1);
});

test('FlightRecorder is bounded and stores compact reliability incidents', () => {
  const clock = { value: 1000 };
  const { runtime } = runtimeFixture(clock);
  const recorder = new FlightRecorder({ now: () => clock.value, capacity: 60, incidentCapacity: 20, sampleIntervalMs: 1000 });
  for (let i = 0; i < 100; i += 1) {
    clock.value += 1000;
    runtime.lastSnapshot.observedAt = clock.value;
    runtime.lastSnapshot.character.x = i;
    recorder.capture(runtime, { group: { state: 'HEALTHY', memberCount: 4, freshCount: 4, fourCharacterReady: true, invalidMembers: [] }, watchdog: { state: 'HEALTHY', activityExpected: false } });
  }
  assert.equal(recorder.status().samples, 60);
  assert.equal(recorder.status().droppedSamples, 40);
  assert.equal(recorder.latest().character.x, 99);
  recorder.markIncident({ severity: 'warn', type: 'TEST_INCIDENT', reason: 'FAULT' });
  assert.equal(recorder.listIncidents(1)[0].reason, 'FAULT');
  assert.equal(recorder.status().actionAuthority, false);
});

test('HeadlessOperations captures heartbeat flight data, exposes group/watchdog health and persists reconcile-only checkpoint', () => {
  const clock = { value: 10000 };
  const storage = memoryStorage();
  const { runtime, log } = runtimeFixture(clock, { storage });
  const ops = new HeadlessOperations({
    runtime,
    log,
    now: () => clock.value,
    storage,
    checkpointIntervalMs: 5000,
    flightRecorderSampleIntervalMs: 1000
  });

  log.emit({ component: 'runtime', event: 'HEARTBEAT', character: 'MerchantA', data: { mode: 'shadow' } });
  const status = ops.status();
  assert.equal(status.contractVersion, 2);
  assert.equal(status.reliability.actionAuthority, false);
  assert.equal(status.reliability.automaticRecovery, false);
  assert.equal(status.reliability.groupLiveness.fourCharacterReady, true);
  assert.equal(status.health.state, 'HEALTHY');
  assert.ok(status.reliability.flightRecorder.samples >= 1);
  const checkpoint = ops.reliabilityCheckpoint();
  assert.ok(checkpoint);
  assert.equal(checkpoint.resumeAllowed, false);
  assert.equal(checkpoint.reconciliationRequired, true);

  log.emit({ component: 'test', event: 'FAULT', severity: 'error', reason: 'SYNTHETIC' });
  const incidents = ops.reliabilityIncidents(10);
  assert.ok(incidents.some((row) => row.reason === 'SYNTHETIC'));
});

test('3000-cycle reliability soak stays bounded, healthy with progress, and never gains action authority', () => {
  const clock = { value: 1000 };
  const { runtime } = runtimeFixture(clock, { mode: 'active', farmerEnabled: true, farmerState: 'ENGAGE' });
  const groupMonitor = new GroupLivenessMonitor({ now: () => clock.value });
  const watchdog = new RuntimeProgressWatchdog({
    now: () => clock.value,
    watchAfterMs: 10000,
    degradedAfterMs: 30000,
    progressWatchAfterMs: 10000,
    progressDegradedAfterMs: 30000
  });
  const recorder = new FlightRecorder({ now: () => clock.value, capacity: 120, sampleIntervalMs: 1000 });

  for (let i = 0; i < 3000; i += 1) {
    clock.value += 1000;
    runtime.lastHeartbeat = clock.value;
    runtime.lastSnapshot.observedAt = clock.value;
    runtime.lastSnapshot.character.x = i % 100;
    runtime.lastSnapshot.character.xp += 1;
    const group = groupMonitor.evaluate(runtime);
    const health = watchdog.observe(runtime, group);
    recorder.capture(runtime, { group, watchdog: health });
    assert.notEqual(health.state, 'DEGRADED');
    assert.equal(health.actionAuthority, false);
  }

  assert.equal(recorder.status().samples, 120);
  assert.equal(recorder.status().droppedSamples, 2880);
  assert.equal(watchdog.status(runtime, groupMonitor.evaluate(runtime)).state, 'HEALTHY');
  assert.equal(watchdog.status(runtime, groupMonitor.evaluate(runtime)).automaticRecovery, false);
});
