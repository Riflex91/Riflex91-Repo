'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventLog } = require('../src/core/event-log');
const { AlertEscalationManager } = require('../src/ops/alert-escalation-manager');
const { SafeRecoveryCoordinator, SAFE_RECOVERY_ACK } = require('../src/ops/safe-recovery-coordinator');
const { HostWatchdogBeacon } = require('../src/ops/host-watchdog-beacon');
const { HeadlessOperations } = require('../src/ops/headless-operations');

function memoryStorage() {
  const rows = new Map();
  return { rows, get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; } };
}

function runtimeFixture(clock, options = {}) {
  const now = () => clock.value;
  const names = ['MerchantA', 'RangerA', 'RangerB', 'RangerC'];
  const storage = options.storage || memoryStorage();
  const log = new EventLog({ now, runId: 'alpha205-recovery-alert' });
  const calls = [];
  const snapshot = {
    observedAt: clock.value,
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', x: 10, y: 20,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 1000,
      rip: false, moving: false, target: null
    },
    party: names.slice(1).map((name) => ({ name, type: 'ranger', level: 80, map: 'main' }))
  };
  const registryRows = names.map((name, index) => ({
    name,
    ctype: index === 0 ? 'merchant' : 'ranger',
    level: 80,
    map: 'main',
    presence: 'ONLINE',
    online: true,
    available: true,
    dead: false,
    observationAgeMs: 0,
    primarySource: index === 0 ? 'self' : 'party'
  }));
  const disabledTarget = (name) => ({
    status: () => ({ enabled: false, actionAuthority: false, breaker: { open: false } }),
    disable: (reason) => { calls.push([`disable:${name}`, reason]); return { enabled: false }; }
  });
  const runtime = {
    root: {},
    now,
    log,
    startedAt: clock.value,
    lastHeartbeat: clock.value,
    lastSnapshot: snapshot,
    adapter: { mode: options.mode || 'active' },
    characterRegistry: { status: () => ({ characters: registryRows }) },
    globalSupervisor: { status: () => ({ state: 'HEALTHY', reasons: [] }) },
    scheduler: { snapshot: () => ({ active: [], queued: [] }) },
    transactionEngine: { status: () => ({ active: 0, recovering: 0, states: {}, circuits: {} }) },
    safeTravel: { status: () => ({ active: 0, states: {}, circuit: { open: false } }) },
    controlledPartyLifecycle: disabledTarget('party'),
    controlledPaladinAura: disabledTarget('aura'),
    controlledMerchantSpaceRecovery: disabledTarget('spaceRecovery'),
    controlledBankConsolidation: disabledTarget('consolidation'),
    controlledBankExpansion: disabledTarget('expansion'),
    controlledMerchant: disabledTarget('merchant'),
    controlledTravel: disabledTarget('travel'),
    partyTransitions: { setLiveEnabled: (enabled) => { calls.push(['legacyParty', enabled]); return enabled; } },
    persistence: { storage, maybeSave: () => true },
    world: { revision: 1, serialize: () => '{"revision":1}' },
    farmerEnabled: options.farmerEnabled !== false,
    farmerStatus: () => ({ enabled: runtime.farmerEnabled, state: runtime.farmerEnabled ? 'ENGAGE' : 'IDLE', targetType: 'goo' }),
    setFarmerEnabled: (enabled) => { runtime.farmerEnabled = enabled === true; calls.push(['farmer', runtime.farmerEnabled]); return runtime.farmerEnabled; },
    setMode: (mode) => { runtime.adapter.mode = mode; calls.push(['mode', mode]); return mode; },
    status: () => ({ version: '3.0.0-alpha.20.0', mode: runtime.adapter.mode, character: snapshot.character }),
    setFarmerTargetPolicy: (value) => value,
    addFarmerTargetExclusion: (value) => value,
    removeFarmerTargetExclusion: () => true,
    combatRisk: { approveMonsterType: () => ({}), quarantineMonsterType: () => ({}) },
    alpha20LiveGateStatus: () => ({ running: options.liveGateRunning === true }),
    cancelAlpha20CombinedLiveGate: (reason) => { calls.push(['cancelGate', reason]); return { accepted: true }; }
  };
  return { runtime, storage, log, snapshot, calls, registryRows };
}

test('AlertEscalationManager dedupes, escalates unacked warnings, acknowledges and rate-limits new alerts', () => {
  const clock = { value: 1000 };
  const alerts = new AlertEscalationManager({
    now: () => clock.value,
    capacity: 20,
    dedupeWindowMs: 10000,
    warningEscalateAfterMs: 5000,
    maxNewPerWindow: 2,
    rateWindowMs: 60000
  });
  const first = alerts.emit({ severity: 'WARNING', type: 'STUCK', reason: 'NO_PROGRESS', dedupeKey: 'stuck:a' });
  assert.equal(first.accepted, true);
  assert.equal(first.deduped, false);
  clock.value += 1000;
  const duplicate = alerts.emit({ severity: 'WARNING', type: 'STUCK', reason: 'NO_PROGRESS', dedupeKey: 'stuck:a' });
  assert.equal(duplicate.deduped, true);
  assert.equal(duplicate.alert.occurrences, 2);
  const second = alerts.emit({ severity: 'WARNING', type: 'PARTY', reason: 'STALE', dedupeKey: 'party:b' });
  assert.equal(second.accepted, true);
  const limited = alerts.emit({ severity: 'WARNING', type: 'THIRD', reason: 'FAULT', dedupeKey: 'third:c' });
  assert.equal(limited.accepted, false);
  assert.equal(limited.reason, 'ALERT_RATE_LIMIT');

  clock.value += 5000;
  alerts.sweep();
  const escalated = alerts.peek(10).find((row) => row.id === first.alert.id);
  assert.equal(escalated.severity, 'CRITICAL');
  assert.ok(escalated.escalatedAt != null);
  const ack = alerts.acknowledge(escalated.id, { by: 'operator' });
  assert.equal(ack.acknowledged, true);
  assert.equal(ack.alert.acknowledgedBy, 'operator');
  assert.equal(alerts.status().actionAuthority, false);
  assert.ok(alerts.status().stats.deduped >= 1);
  assert.ok(alerts.status().stats.suppressed >= 1);
});

test('AlertEscalationManager stays bounded during a 2500-event storm', () => {
  const clock = { value: 0 };
  const alerts = new AlertEscalationManager({
    now: () => clock.value,
    capacity: 50,
    dedupeWindowMs: 1000,
    maxNewPerWindow: 500,
    rateWindowMs: 1000
  });
  for (let i = 0; i < 2500; i += 1) {
    clock.value += 10;
    alerts.emit({ severity: i % 20 === 0 ? 'CRITICAL' : 'WARNING', type: 'SOAK', reason: String(i), dedupeKey: `soak:${i}` });
  }
  const status = alerts.status();
  assert.equal(status.retained, 50);
  assert.ok(status.stats.dropped > 0);
  assert.equal(status.actionAuthority, false);
});

test('SafeRecoveryCoordinator rejects wrong ack and applies only safety-reducing actions after bounded degradation', () => {
  const clock = { value: 10000 };
  const { runtime, calls } = runtimeFixture(clock, { mode: 'active', farmerEnabled: true, liveGateRunning: true });
  const recovery = new SafeRecoveryCoordinator({
    runtime,
    now: () => clock.value,
    reobserveAfterMs: 1000,
    replanAfterMs: 2000,
    circuitAfterMs: 3000,
    safeModeAfterMs: 4000,
    hostRestartAfterMs: 10000,
    safeModeCooldownMs: 10000,
    maxSafeModesPerWindow: 2
  });

  const wrong = recovery.configure({ enabled: true, ack: 'WRONG' });
  assert.equal(wrong.enabled, false);
  assert.equal(wrong.enableRejected, 'WRONG_ACK');
  const enabled = recovery.configure({ enabled: true, ack: SAFE_RECOVERY_ACK });
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.rawGameplayActionAuthority, false);
  assert.equal(enabled.actionScope, 'safety-reduction-only');

  let plan = recovery.observe({ state: 'DEGRADED', reason: 'EXPECTED_ACTIVITY_NO_PROGRESS' }, { state: 'HEALTHY' });
  assert.equal(plan.stage, 'REOBSERVE');
  assert.equal(runtime.adapter.mode, 'active');
  clock.value += 5000;
  plan = recovery.observe({ state: 'DEGRADED', reason: 'EXPECTED_ACTIVITY_NO_PROGRESS' }, { state: 'HEALTHY' });
  assert.equal(plan.stage, 'SAFE_MODE');
  assert.equal(plan.execution.executed, true);
  assert.equal(plan.execution.rawGameplayActions, 0);
  assert.equal(runtime.adapter.mode, 'shadow');
  assert.equal(runtime.farmerEnabled, false);
  assert.ok(calls.some((row) => row[0] === 'cancelGate'));
  assert.ok(calls.some((row) => row[0] === 'disable:party'));
  assert.ok(calls.some((row) => row[0] === 'disable:travel'));
  assert.equal(calls.some((row) => ['attack', 'move', 'smart_move', 'town', 'sell', 'buy'].includes(row[0])), false);

  const attempts = recovery.status().stats.safeModeAttempts;
  clock.value += 1000;
  recovery.observe({ state: 'DEGRADED', reason: 'EXPECTED_ACTIVITY_NO_PROGRESS' }, { state: 'HEALTHY' });
  assert.equal(recovery.status().stats.safeModeAttempts, attempts);
});

test('SafeRecoveryCoordinator never self-restarts and escalates persistent degradation to host restart recommendation', () => {
  const clock = { value: 0 };
  const { runtime } = runtimeFixture(clock);
  const recovery = new SafeRecoveryCoordinator({
    runtime,
    now: () => clock.value,
    reobserveAfterMs: 1000,
    replanAfterMs: 2000,
    circuitAfterMs: 3000,
    safeModeAfterMs: 4000,
    hostRestartAfterMs: 6000
  });
  recovery.configure({ enabled: true, ack: SAFE_RECOVERY_ACK });
  recovery.observe({ state: 'DEGRADED', reason: 'SNAPSHOT_STALE' }, null);
  clock.value += 7000;
  const plan = recovery.observe({ state: 'DEGRADED', reason: 'SNAPSHOT_STALE' }, null);
  assert.equal(plan.stage, 'HOST_RESTART');
  assert.equal(plan.automaticActionEligible, false);
  assert.equal(plan.hostActionRequired, true);
  assert.equal(recovery.status().automaticRestart, false);
});

test('HostWatchdogBeacon produces a monotonic lease/dead-man contract without restart authority', () => {
  const clock = { value: 1000 };
  const { runtime } = runtimeFixture(clock);
  const beacon = new HostWatchdogBeacon({ now: () => clock.value, leaseMs: 30000 });
  const one = beacon.emit(runtime, { health: { state: 'HEALTHY' }, recovery: { enabled: false }, alerting: { pending: 0, pendingCritical: 0 } });
  assert.equal(one.seq, 1);
  assert.equal(one.deadlineAt, 31000);
  assert.equal(one.contract.externalDeadManRequired, true);
  assert.equal(one.contract.hostOwnsRestart, true);
  assert.equal(one.contract.actionAuthority, false);
  clock.value += 1000;
  const two = beacon.emit(runtime, { health: { state: 'WATCH' }, recovery: { enabled: false }, alerting: { pending: 1, pendingCritical: 0 } });
  assert.equal(two.seq, 2);
  assert.equal(two.deadlineAt, 32000);
  assert.equal(beacon.status().actionAuthority, false);
});

test('HeadlessOperations exposes bounded alerts, explicit safe recovery and external watchdog heartbeat', () => {
  const clock = { value: 10000 };
  const storage = memoryStorage();
  const { runtime, log } = runtimeFixture(clock, { storage, mode: 'active', farmerEnabled: true });
  const ops = new HeadlessOperations({
    runtime,
    log,
    now: () => clock.value,
    storage,
    alertWarningEscalateAfterMs: 5000,
    recoveryReobserveAfterMs: 1000,
    recoveryReplanAfterMs: 2000,
    recoveryCircuitAfterMs: 3000,
    recoverySafeModeAfterMs: 4000,
    recoveryHostRestartAfterMs: 10000,
    hostWatchdogLeaseMs: 30000
  });

  let status = ops.status();
  assert.equal(status.contractVersion, 3);
  assert.equal(status.reliability.automaticRecovery, false);
  assert.equal(status.reliability.rawGameplayActionAuthority, false);
  const wrong = ops.configureSafeRecovery({ enabled: true, ack: 'WRONG' });
  assert.equal(wrong.enabled, false);
  const enabled = ops.configureSafeRecovery({ enabled: true, ack: SAFE_RECOVERY_ACK });
  assert.equal(enabled.enabled, true);

  log.emit({ component: 'synthetic', event: 'SYNTHETIC_WARNING', severity: 'warn', reason: 'TEST' });
  assert.ok(ops.peekAlerts(10).some((row) => row.reason === 'TEST'));
  const drained = ops.drainAlerts(10);
  assert.ok(drained.length >= 1);
  const ack = ops.acknowledgeAlert(drained[0].id, { by: 'test' });
  assert.equal(ack.acknowledged, true);

  const heartbeat = ops.hostHeartbeat();
  assert.equal(heartbeat.type, 'AIO_V3_HOST_WATCHDOG_BEACON');
  assert.equal(heartbeat.contract.externalDeadManRequired, true);
  status = ops.status();
  assert.equal(status.hostWatchdog.sequence, 1);
  assert.equal(status.reliability.recovery.enabled, true);
});

test('3000-cycle default-off recovery soak never gains action authority or invokes safe-mode actions', () => {
  const clock = { value: 1000 };
  const { runtime, calls } = runtimeFixture(clock, { mode: 'active', farmerEnabled: true });
  const recovery = new SafeRecoveryCoordinator({
    runtime,
    now: () => clock.value,
    reobserveAfterMs: 1000,
    replanAfterMs: 2000,
    circuitAfterMs: 3000,
    safeModeAfterMs: 4000,
    hostRestartAfterMs: 6000
  });
  for (let i = 0; i < 3000; i += 1) {
    clock.value += 1000;
    const plan = recovery.observe({ state: 'DEGRADED', reason: 'EXPECTED_ACTIVITY_NO_PROGRESS' }, { state: 'HEALTHY' });
    assert.equal(plan.automaticActionEligible, false);
    assert.equal(plan.rawGameplayActionAuthority, false);
  }
  assert.equal(recovery.status().enabled, false);
  assert.equal(recovery.status().stats.safeModeAttempts, 0);
  assert.equal(calls.length, 0);
});
