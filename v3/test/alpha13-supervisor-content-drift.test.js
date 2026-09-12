'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha13Runtime,
  GlobalSupervisor,
  HealthState,
  ContentDriftMonitor,
  ContentLifecycle,
  CONTENT_DRIFT_SCHEMA_VERSION,
  stableStringify,
  fingerprint
} = require('../src');

function activeStatus(extra = {}) {
  return {
    running: true,
    mode: 'active',
    character: { name: 'R1', map: 'main', x: 0, y: 0, xp: 100, gold: 1000, rip: false },
    farmer: { enabled: true, state: 'ENGAGE' },
    stability: { commandOutcomes: { movement: { circuitOpen: false } } },
    persistence: { loadFailureStreak: 0, saveFailureStreak: 0, saveCircuitOpen: false },
    party: { transition: { state: 'IDLE', active: false } },
    brain: { qualityState: 'HEALTHY' },
    ...extra
  };
}

function snapshot(monsters = ['goo']) {
  return {
    character: { name: 'R1', ctype: 'ranger', level: 70, map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100 },
    entities: monsters.map((mtype, index) => ({ id: `${mtype}-${index}`, mtype, map: 'main', x: 10 + index, y: 10, hp: 100, dead: false }))
  };
}

function gameData() {
  return {
    monsters: { goo: { hp: 100, attack: 10, damage_type: 'physical', xp: 100 } },
    maps: { main: { monsters: [{ type: 'goo', boundary: [0, 0, 100, 100] }], doors: [] } },
    npcs: {}, items: {}, skills: {}, events: {}
  };
}

test('Global Supervisor escalates bounded no-progress health states and material progress resets the watchdog', () => {
  let now = 0;
  const supervisor = new GlobalSupervisor({ now: () => now, watchAfterMs: 1000, degradedAfterMs: 2000, safeModeAfterMs: 3000, quarantineAfterMs: 4000 });
  const status = activeStatus();
  assert.equal(supervisor.observe({ status }).state, HealthState.HEALTHY);
  now = 1500;
  assert.equal(supervisor.observe({ status }).state, HealthState.WATCH);
  now = 2500;
  assert.equal(supervisor.observe({ status }).state, HealthState.DEGRADED);
  now = 3500;
  assert.equal(supervisor.observe({ status }).state, HealthState.SAFE_MODE);
  status.character.x = 40;
  now = 3600;
  assert.equal(supervisor.observe({ status }).state, HealthState.HEALTHY);
  assert.equal(supervisor.status().progress.ageMs, 0);
});

test('Global Supervisor isolates Brain/content quarantine from deterministic combat while critical failures still degrade globally', () => {
  let now = 0;
  const supervisor = new GlobalSupervisor({ now: () => now });
  const shadow = activeStatus({ mode: 'shadow', brain: { qualityState: 'QUARANTINED' } });
  assert.equal(supervisor.observe({ status: shadow, contentDrift: { counts: { QUARANTINED: 4 } } }).state, HealthState.WATCH);
  let status = activeStatus({ mode: 'shadow' });
  status.stability.commandOutcomes.movement.circuitOpen = true;
  assert.equal(supervisor.observe({ status }).state, HealthState.DEGRADED);
  status = activeStatus({ mode: 'shadow', persistence: { loadFailureStreak: 5, saveFailureStreak: 0, saveCircuitOpen: false } });
  assert.equal(supervisor.observe({ status }).state, HealthState.SAFE_MODE);
  status = activeStatus({ mode: 'shadow', party: { transition: { state: 'FAILED_SAFE', active: false } } });
  const partyResult = supervisor.observe({ status });
  assert.equal(partyResult.state, HealthState.DEGRADED);
  assert.equal(supervisor.status().subsystems.party.state, HealthState.QUARANTINE);
});

test('Supervisor safe fallback is explicit opt-in, safety-reduction-only and recovery-budgeted', () => {
  let now = 0;
  const calls = [];
  const runtime = {
    setPartyTransitionsEnabled: (value) => calls.push(['party', value]),
    setPartyAuraAutomationEnabled: (value) => calls.push(['aura', value]),
    setPartyExplorationEnabled: (value) => calls.push(['explore', value]),
    setFarmerEnabled: (value) => calls.push(['farmer', value]),
    setMode: (value) => calls.push(['mode', value])
  };
  const supervisor = new GlobalSupervisor({
    now: () => now,
    safeActionsEnabled: true,
    watchAfterMs: 1000,
    degradedAfterMs: 2000,
    safeModeAfterMs: 3000,
    quarantineAfterMs: 6000,
    recoveryCooldownMs: 1000,
    recoveryWindowMs: 10000,
    maxRecoveriesPerWindow: 1
  });
  const status = activeStatus();
  supervisor.observe({ status, runtime });
  now = 3500;
  const safe = supervisor.observe({ status, runtime });
  assert.equal(safe.state, HealthState.SAFE_MODE);
  assert.equal(safe.recovery.executed, true);
  assert.deepEqual(calls, [['party', false], ['aura', false], ['explore', false], ['farmer', false], ['mode', 'shadow']]);
  now = 7000;
  const blocked = supervisor.observe({ status, runtime });
  assert.equal(blocked.recovery.executed, false);
  assert.equal(blocked.recovery.reason, 'RECOVERY_BUDGET_EXHAUSTED');
  assert.equal(supervisor.status().actionScope, 'safety-reduction-only');
  assert.equal(supervisor.status().directGameplayActionAccess, false);
});

test('Supervisor manual subsystem quarantine is explicit, observable and reversible', () => {
  const supervisor = new GlobalSupervisor();
  assert.equal(supervisor.quarantineSubsystem('merchant', 'FAULT_INJECTION'), true);
  const result = supervisor.observe({ status: activeStatus({ mode: 'shadow' }) });
  assert.equal(result.state, HealthState.QUARANTINE);
  assert.equal(supervisor.status().subsystems.merchant.state, HealthState.QUARANTINE);
  assert.equal(supervisor.clearSubsystemQuarantine('merchant'), true);
  assert.equal(supervisor.observe({ status: activeStatus({ mode: 'shadow' }) }).state, HealthState.HEALTHY);
});

test('Content fingerprinting is deterministic across object key ordering and sanitizes non-finite/function values', () => {
  const a = { z: 1, a: { c: Infinity, b: 2 }, fn() {} };
  const b = { a: { b: 2, c: Infinity }, z: 1 };
  assert.equal(stableStringify(a), stableStringify(b));
  assert.equal(fingerprint(a).hash, fingerprint(b).hash);
  assert.doesNotThrow(() => JSON.stringify(fingerprint(a)));
});

test('Content Drift baseline does not misclassify existing content and reordered metadata does not drift', () => {
  let now = 1000;
  const monitor = new ContentDriftMonitor({ now: () => now, scanBudget: 512 });
  const G = gameData();
  const first = monitor.scan(snapshot(), G);
  assert.equal(first.changes.length, 0);
  assert.equal(monitor.status().baseline.monsters.baselineComplete, true);
  assert.equal(monitor.status().baseline.maps.baselineComplete, true);
  const reordered = { ...G, monsters: { goo: { xp: 100, damage_type: 'physical', attack: 10, hp: 100 } } };
  now += 5000;
  const second = monitor.scan(snapshot(), reordered);
  assert.equal(second.changes.length, 0);
  assert.equal(monitor.status().stats.drift, 0);
  assert.equal(monitor.status().counts.QUARANTINED, 0);
});

test('Changed known monster definition is detected and re-quarantined until explicit revalidation', () => {
  let now = 1000;
  const monitor = new ContentDriftMonitor({ now: () => now, scanBudget: 512 });
  const G = gameData();
  monitor.scan(snapshot(), G);
  G.monsters.goo.attack = 99;
  now += 5000;
  const result = monitor.scan(snapshot(), G);
  assert.ok(result.changes.some((row) => row.kind === 'DRIFT' && row.category === 'monsters' && row.id === 'goo'));
  assert.equal(monitor.requiresRevalidation('monsters', 'goo'), true);
  assert.equal(monitor.markRevalidated('monsters', 'goo'), true);
  assert.equal(monitor.requiresRevalidation('monsters', 'goo'), false);
  assert.equal(monitor.list(10).find((row) => row.category === 'monsters' && row.id === 'goo').lifecycle, ContentLifecycle.OBSERVED);
});

test('New content appearing after catalog baseline is novelty and fails closed in the drift model', () => {
  let now = 1000;
  const monitor = new ContentDriftMonitor({ now: () => now, scanBudget: 512 });
  const G = gameData();
  monitor.scan(snapshot(), G);
  G.monsters.bee = { hp: 150, attack: 15, damage_type: 'physical' };
  now += 5000;
  const result = monitor.scan(snapshot(['goo', 'bee']), G);
  assert.ok(result.changes.some((row) => row.kind === 'NOVELTY' && row.category === 'monsters' && row.id === 'bee'));
  assert.equal(monitor.requiresRevalidation('monsters', 'bee'), true);
  assert.ok(monitor.status().counts.QUARANTINED >= 1);
});

test('Content Drift persistence is schema-versioned, restorable, bounded and corrupt data fails closed', () => {
  let now = 1000;
  let raw = null;
  const storage = { get: () => raw, set: (_, value) => { raw = value; } };
  const monitor = new ContentDriftMonitor({ now: () => now, storage, scanBudget: 512, capacity: 64 });
  const G = gameData();
  G.items = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`item${i}`, { level: i % 10, g: i }]));
  monitor.scan(snapshot(), G);
  monitor.save({ force: true });
  assert.ok(raw && raw.includes('schemaVersion'));
  assert.ok(monitor.status().records <= 64);
  const restored = new ContentDriftMonitor({ now: () => now, storage, capacity: 64 });
  assert.equal(restored.load(), true);
  assert.ok(restored.status().records > 0);
  assert.equal(restored.status().schemaVersion, CONTENT_DRIFT_SCHEMA_VERSION);
  raw = '{broken';
  const corrupt = new ContentDriftMonitor({ storage });
  assert.equal(corrupt.load(), false);
  assert.equal(corrupt.status().records, 0);
  assert.equal(corrupt.status().stats.loadErrors, 1);
});

test('Content Drift uses bounded incremental catalog scans and eventually completes large baselines', () => {
  const monitor = new ContentDriftMonitor({ scanBudget: 6, capacity: 256 });
  const G = gameData();
  G.items = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`item${i}`, { value: i }]));
  for (let i = 0; i < 40 && !monitor.status().baseline.items.baselineComplete; i += 1) monitor.scan(snapshot(), G);
  assert.equal(monitor.status().baseline.items.baselineComplete, true);
  assert.ok(monitor.status().records <= 256);
});

test('Alpha13 runtime integrates Supervisor and Content Drift while all new authority stays default-off', () => {
  let now = 10000;
  const storageData = {};
  const storage = { get: (key) => storageData[key] || null, set: (key, value) => { storageData[key] = value; } };
  const root = {
    character: { name: 'Merch', ctype: 'merchant', level: 70, map: 'main', real_x: 0, real_y: 0, hp: 2000, max_hp: 2000, mp: 1000, max_mp: 1000, xp: 0, gold: 0, items: [], slots: {}, speed: 40, rip: false },
    parent: { entities: {}, party: { R1: { type: 'ranger', level: 70, map: 'main' }, R2: { type: 'ranger', level: 70, map: 'main' }, R3: { type: 'ranger', level: 70, map: 'main' } } },
    G: { monsters: { goo: { xp: 100, hp: 100, attack: 10, damage_type: 'physical' } }, maps: { main: { monsters: [{ type: 'goo', boundary: [100, 100, 200, 200] }] } }, skills: {}, items: {}, npcs: {}, events: {} },
    performance_trick() {}
  };
  const runtime = new Alpha13Runtime({
    root,
    parent: root.parent,
    mode: 'shadow',
    now: () => now,
    visibleStatus: false,
    storage,
    contentDriftScanMs: 1000,
    globalSupervisorIntervalMs: 500,
    characterRoster: [
      { name: 'Merch', ctype: 'merchant', level: 70, available: true },
      { name: 'R1', ctype: 'ranger', level: 70, available: true },
      { name: 'R2', ctype: 'ranger', level: 70, available: true },
      { name: 'R3', ctype: 'ranger', level: 70, available: true }
    ],
    partyMerchantName: 'Merch'
  });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.13.0');
  assert.equal(status.mode, 'shadow');
  assert.equal(status.supervisor.safeActionsEnabled, false);
  assert.equal(status.supervisor.actionAuthority, false);
  assert.equal(status.contentDrift.actionAuthority, false);
  assert.equal(status.contentDrift.mode, 'observation-first');
  assert.equal(status.party.transition.liveEnabled, false);
  assert.equal(status.party.aura.automationEnabled, false);
  assert.equal(status.party.orchestrator.explorationEnabled, false);
  assert.equal(status.brain.mode, 'shadow');
  assert.equal(status.brain.actionAuthority, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.doesNotThrow(() => JSON.parse(runtime.exportDiagnostics()));
});

test('Alpha13 runtime fail-closes a previously approved monster when its game definition drifts', () => {
  let now = 10000;
  const storage = { get: () => null, set() {} };
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 0, items: [], slots: {}, speed: 40, rip: false },
    parent: { entities: {}, party: {} },
    G: { monsters: { goo: { xp: 100, hp: 100, attack: 10, damage_type: 'physical' } }, maps: { main: { monsters: [{ type: 'goo', boundary: [0, 0, 100, 100] }] } }, skills: {}, items: {}, npcs: {}, events: {} },
    performance_trick() {}
  };
  const runtime = new Alpha13Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, visibleStatus: false, storage, contentDriftScanMs: 1000, globalSupervisorIntervalMs: 500 });
  runtime.combatRisk.approveMonsterType(runtime.world, 'goo');
  runtime.tick();
  assert.equal(runtime.world.fact('monster', 'goo', 'contentSafetyDisposition').value, 'APPROVED');
  root.G.monsters.goo.attack = 999;
  now += 2000;
  runtime.tick();
  assert.equal(runtime.world.fact('monster', 'goo', 'contentSafetyDisposition').value, 'QUARANTINED');
  assert.equal(runtime.contentDrift.requiresRevalidation('monsters', 'goo'), true);
});

test('Alpha13 supervisor safe actions remain off even if runtime is switched active until explicitly enabled', () => {
  let now = 10000;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 70, map: 'main', real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 0, items: [], slots: {}, speed: 40, rip: false },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {}, items: {}, npcs: {}, events: {} },
    performance_trick() {}
  };
  const runtime = new Alpha13Runtime({ root, parent: root.parent, mode: 'shadow', now: () => now, visibleStatus: false, contentDriftScanMs: 1000, globalSupervisorIntervalMs: 500 });
  runtime.setMode('active');
  runtime.tick();
  assert.equal(runtime.status().mode, 'active');
  assert.equal(runtime.status().supervisor.safeActionsEnabled, false);
  assert.equal(runtime.status().party.transition.liveEnabled, false);
  assert.equal(runtime.status().party.aura.automationEnabled, false);
});

test('2000 combined supervisor/content-drift evaluations stay finite, bounded and JSON-safe', () => {
  let now = 1000;
  const monitor = new ContentDriftMonitor({ now: () => now, scanBudget: 12, capacity: 64 });
  const supervisor = new GlobalSupervisor({ now: () => now });
  const G = gameData();
  monitor.scan(snapshot(), G);
  for (let i = 0; i < 2000; i += 1) {
    now += 1000;
    G.monsters.goo.attack = 10 + (i % 17 === 0 ? 1 : 0);
    monitor.scan(snapshot(), G);
    const status = activeStatus({ mode: 'shadow', character: { name: 'R1', map: 'main', x: i % 100, y: 0, xp: i, gold: 1000, rip: false } });
    supervisor.observe({ status, contentDrift: monitor.status() });
  }
  assert.ok(monitor.status().records <= 64);
  assert.ok(Number.isFinite(supervisor.status().stats.evaluations));
  assert.doesNotThrow(() => JSON.stringify({ monitor: monitor.status(), supervisor: supervisor.status(), records: monitor.list(64) }));
});
