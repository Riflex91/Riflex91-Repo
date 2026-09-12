'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { AlertEscalationManager } = require('../src/ops/alert-escalation-manager');
const { HostWatchdogSupervisor, HOST_RESTART_ACK } = require('../host/host-watchdog-supervisor');
const { JsonFileStateStore } = require('../host/json-file-state-store');
const { AlertRelay } = require('../host/alert-relay');
const { HeadlessHostController } = require('../host/headless-host-controller');
const { install } = require('../src');

function validBeacon(clock, seq, runId = 'run-1', leaseMs = 5000) {
  return {
    schemaVersion: 1,
    type: 'AIO_V3_HOST_WATCHDOG_BEACON',
    seq,
    at: clock.value,
    deadlineAt: clock.value + leaseMs,
    leaseMs,
    runId,
    release: '3.0.0-alpha.20.0',
    character: { name: 'MerchantA', ctype: 'merchant', map: 'main', rip: false },
    runtime: { mode: 'shadow', heartbeatAt: clock.value, snapshotAt: clock.value },
    health: { state: 'HEALTHY', watchdogState: 'HEALTHY', watchdogReason: null, groupState: 'HEALTHY', fourCharacterReady: true },
    recovery: { enabled: false, stage: null, rawGameplayActionAuthority: false, automaticRestart: false },
    alerts: { pending: 0, pendingCritical: 0 },
    contract: {
      externalDeadManRequired: true,
      hostMustTreatMissedDeadlineAsUnhealthy: true,
      hostOwnsRestart: true,
      authenticationOwnedByHost: true,
      actionAuthority: false
    }
  };
}

function memoryStateStore(initial = { schemaVersion: 1, records: [] }) {
  let value = JSON.parse(JSON.stringify(initial));
  const calls = [];
  return {
    calls,
    load: (fallback) => {
      calls.push(['load']);
      return value == null ? JSON.parse(JSON.stringify(fallback)) : JSON.parse(JSON.stringify(value));
    },
    save: (next) => {
      calls.push(['save', JSON.parse(JSON.stringify(next))]);
      value = JSON.parse(JSON.stringify(next));
      return true;
    },
    value: () => JSON.parse(JSON.stringify(value))
  };
}

function botAlertQueue(rows = []) {
  const pending = rows.map((row) => ({ ...row }));
  const calls = [];
  return {
    calls,
    pending,
    async pendingAlerts(limit) {
      calls.push(['pending', limit]);
      return pending.slice(0, limit).map((row) => ({ ...row }));
    },
    async claimAlerts(ids) {
      calls.push(['claim', ids.slice()]);
      const wanted = new Set(ids.map(String));
      const claimed = [];
      for (let i = pending.length - 1; i >= 0; i -= 1) {
        if (!wanted.has(String(pending[i].id))) continue;
        claimed.push(pending[i]);
        pending.splice(i, 1);
      }
      return claimed.reverse().map((row) => ({ ...row }));
    }
  };
}

function publicRoot() {
  const root = {
    AIO_V3_AUTOSTART: false,
    character: {
      name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0,
      hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 0, gold: 10000000, rip: false,
      items: [], isize: 42, slots: {}, speed: 40, bank: { items0: [null] }
    },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, npcs: {}, skills: {}, events: {}, items: {} },
    performance_trick() {}, setTimeout, clearTimeout, setInterval, clearInterval
  };
  root.globalThis = root;
  return root;
}

function runtimeStorage() {
  const rows = new Map();
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; } };
}

test('HostWatchdogSupervisor is default-off and exact-ack gated for process-only restart authority', () => {
  const clock = { value: 0 };
  const supervisor = new HostWatchdogSupervisor({ now: () => clock.value, startupGraceMs: 5000, restartDelayMs: 1000 });
  assert.equal(supervisor.status().restartEnabled, false);
  assert.equal(supervisor.status().gameplayActionAuthority, false);
  const wrong = supervisor.configure({ enabled: true, ack: 'WRONG' });
  assert.equal(wrong.accepted, false);
  assert.equal(supervisor.status().restartEnabled, false);
  const exact = supervisor.configure({ enabled: true, ack: HOST_RESTART_ACK });
  assert.equal(exact.accepted, true);
  assert.equal(exact.restartAuthority, 'process-only');
  assert.equal(exact.gameplayActionAuthority, false);
});

test('HostWatchdogSupervisor accepts fresh monotonic beacons, rejects replay, and allows sequence reset only on a new run', () => {
  const clock = { value: 1000 };
  const supervisor = new HostWatchdogSupervisor({ now: () => clock.value });
  assert.equal(supervisor.acceptBeacon(validBeacon(clock, 1, 'run-a')).accepted, true);
  clock.value += 1000;
  assert.equal(supervisor.acceptBeacon(validBeacon(clock, 2, 'run-a')).accepted, true);
  const replay = supervisor.acceptBeacon(validBeacon(clock, 2, 'run-a'));
  assert.equal(replay.accepted, false);
  assert.equal(replay.reason, 'BEACON_REPLAY');
  const newRun = supervisor.acceptBeacon(validBeacon(clock, 1, 'run-b'));
  assert.equal(newRun.accepted, true);
  assert.equal(newRun.newRun, true);
  assert.equal(supervisor.status().lastSeq, 1);
});

test('HostWatchdogSupervisor rejects malformed contract and future-clock beacons', () => {
  const clock = { value: 1000 };
  const supervisor = new HostWatchdogSupervisor({ now: () => clock.value, maxClockSkewMs: 1000 });
  const authority = validBeacon(clock, 1);
  authority.contract.actionAuthority = true;
  assert.equal(supervisor.acceptBeacon(authority).reason, 'BEACON_GAMEPLAY_AUTHORITY_INVALID');
  const future = validBeacon(clock, 2);
  future.at = 5000;
  future.deadlineAt = 10000;
  assert.equal(supervisor.acceptBeacon(future).reason, 'BEACON_CLOCK_AHEAD');
  const badDeadline = validBeacon(clock, 3);
  badDeadline.deadlineAt += 1;
  assert.equal(supervisor.acceptBeacon(badDeadline).reason, 'BEACON_DEADLINE_INVALID');
});

test('missed beacon deadline cannot restart while authority is disabled', async () => {
  const clock = { value: 0 };
  let restartCalls = 0;
  const supervisor = new HostWatchdogSupervisor({
    now: () => clock.value,
    restartProcess: async () => { restartCalls += 1; },
    startupGraceMs: 5000,
    restartDelayMs: 1000
  });
  supervisor.acceptBeacon(validBeacon(clock, 1));
  clock.value = 7000;
  const status = await supervisor.tick();
  assert.equal(status.state, 'RESTART_REQUIRED');
  assert.equal(status.reason, 'RESTART_AUTHORITY_DISABLED');
  assert.equal(restartCalls, 0);
});

test('exact host authority executes one bounded process restart then waits for a new-run beacon', async () => {
  const clock = { value: 0 };
  const calls = [];
  const supervisor = new HostWatchdogSupervisor({
    now: () => clock.value,
    restartProcess: async (context) => { calls.push(context); return { ok: true }; },
    startupGraceMs: 5000,
    restartDelayMs: 1000,
    restartCooldownMs: 5000
  });
  supervisor.configure({ enabled: true, ack: HOST_RESTART_ACK });
  supervisor.acceptBeacon(validBeacon(clock, 1, 'run-a'));
  clock.value = 7000;
  let status = await supervisor.tick();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].gameplayActionAuthority, false);
  assert.equal(status.state, 'RESTARTING');
  assert.equal(status.lastRunId, null);
  status = await supervisor.tick();
  assert.equal(calls.length, 1);
  assert.equal(status.state, 'STARTING');
  clock.value += 1000;
  assert.equal(supervisor.acceptBeacon(validBeacon(clock, 1, 'run-b')).accepted, true);
  assert.equal(supervisor.status().state, 'HEALTHY');
});

test('restart failures are contained and restart budget opens a circuit instead of looping', async () => {
  const clock = { value: 0 };
  let fail = true;
  let calls = 0;
  const supervisor = new HostWatchdogSupervisor({
    now: () => clock.value,
    restartProcess: async () => {
      calls += 1;
      if (fail) throw new Error('synthetic restart failure');
      return true;
    },
    startupGraceMs: 5000,
    restartDelayMs: 1000,
    restartCooldownMs: 5000,
    restartWindowMs: 60000,
    maxRestartsPerWindow: 2
  });
  supervisor.configure({ enabled: true, ack: HOST_RESTART_ACK });
  supervisor.acceptBeacon(validBeacon(clock, 1, 'run-a'));
  clock.value = 7000;
  let status = await supervisor.tick();
  assert.equal(status.state, 'RESTART_FAILED');
  assert.equal(calls, 1);

  clock.value = 13000;
  fail = false;
  status = await supervisor.tick();
  assert.equal(status.state, 'RESTARTING');
  assert.equal(calls, 2);

  clock.value = 14000;
  supervisor.acceptBeacon(validBeacon(clock, 1, 'run-b'));
  clock.value = 21000;
  status = await supervisor.tick();
  assert.equal(status.state, 'CIRCUIT_OPEN');
  assert.equal(status.reason, 'RESTART_BUDGET_EXHAUSTED');
  assert.equal(calls, 2);
});

test('3000-beacon host soak stays bounded and never gains gameplay authority', async () => {
  const clock = { value: 1000 };
  let restarts = 0;
  const supervisor = new HostWatchdogSupervisor({
    now: () => clock.value,
    restartProcess: async () => { restarts += 1; },
    historyCapacity: 30
  });
  supervisor.configure({ enabled: true, ack: HOST_RESTART_ACK });
  for (let i = 1; i <= 3000; i += 1) {
    const accepted = supervisor.acceptBeacon(validBeacon(clock, i, 'soak-run'));
    assert.equal(accepted.accepted, true);
    const status = await supervisor.tick();
    assert.equal(status.gameplayActionAuthority, false);
    assert.equal(status.rawGameplayActionAuthority, false);
    clock.value += 1000;
  }
  assert.equal(restarts, 0);
  assert.equal(supervisor.listHistory(100).length, 30);
  assert.equal(supervisor.status().stats.acceptedBeacons, 3000);
});

test('AlertEscalationManager exact claim marks only requested pending IDs', () => {
  const clock = { value: 1000 };
  const alerts = new AlertEscalationManager({ now: () => clock.value, maxNewPerWindow: 10 });
  const a = alerts.emit({ severity: 'CRITICAL', type: 'A', reason: 'one' }).alert;
  const b = alerts.emit({ severity: 'WARNING', type: 'B', reason: 'two' }).alert;
  const claimed = alerts.claim([a.id]);
  assert.deepEqual(claimed.map((row) => row.id), [a.id]);
  assert.deepEqual(alerts.pending(10).map((row) => row.id), [b.id]);
});

test('JsonFileStateStore uses atomic bounded persistence and corrupt state fails closed', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-v3-host-store-'));
  const filePath = path.join(directory, 'relay.json');
  try {
    const store = new JsonFileStateStore({ filePath, maxBytes: 8192 });
    assert.deepEqual(store.load({ empty: true }), { empty: true });
    assert.equal(store.save({ schemaVersion: 1, rows: [{ id: 'a' }] }), true);
    assert.deepEqual(store.load(null), { schemaVersion: 1, rows: [{ id: 'a' }] });
    assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
    fs.writeFileSync(filePath, '{broken', 'utf8');
    assert.throws(() => store.load({}), (error) => error && error.code === 'STATE_FILE_CORRUPT');
    assert.equal(store.status().lastError.code, 'STATE_FILE_CORRUPT');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('AlertRelay persists an alert before exact bot claim and never auto-acknowledges it', async () => {
  const clock = { value: 1000 };
  const store = memoryStateStore();
  const bot = botAlertQueue([{ id: 'alert-1', severity: 'CRITICAL', type: 'STUCK', reason: 'NO_PROGRESS' }]);
  const originalClaim = bot.claimAlerts.bind(bot);
  bot.claimAlerts = async (ids) => {
    const persistedIds = store.value().records.map((row) => row.id);
    assert.ok(persistedIds.includes('alert-1'));
    return originalClaim(ids);
  };
  let delivered = 0;
  const relay = new AlertRelay({
    now: () => clock.value,
    botClient: bot,
    store,
    transports: [{ name: 'email', severities: ['CRITICAL'], send: async () => { delivered += 1; return true; } }]
  });
  const ingest = await relay.ingest();
  assert.equal(ingest.ingested, 1);
  assert.equal(ingest.claimed, 1);
  assert.equal(bot.pending.length, 0);
  assert.equal(bot.calls.some((row) => row[0] === 'acknowledge'), false);
  const flush = await relay.flush();
  assert.equal(flush.delivered, 1);
  assert.equal(delivered, 1);
  assert.equal(relay.pending(10).length, 0);
  assert.equal(relay.status().operatorAckAuthority, false);
});

test('transport failure remains durably spooled and retries only after bounded backoff', async () => {
  const clock = { value: 1000 };
  const store = memoryStateStore();
  const bot = botAlertQueue([{ id: 'alert-1', severity: 'CRITICAL', type: 'FAULT', reason: 'TRANSPORT_TEST' }]);
  let attempts = 0;
  const relay = new AlertRelay({
    now: () => clock.value,
    botClient: bot,
    store,
    baseBackoffMs: 1000,
    maxBackoffMs: 4000,
    transports: [{ name: 'push', severities: ['CRITICAL'], send: async () => { attempts += 1; if (attempts === 1) throw new Error('offline'); return true; } }]
  });
  await relay.ingest();
  let flush = await relay.flush();
  assert.equal(flush.failed, 1);
  assert.equal(relay.pending(10).length, 1);
  const savedAfterFailure = store.value().records[0];
  assert.equal(savedAfterFailure.transportState.push.attempts, 1);
  assert.ok(savedAfterFailure.transportState.push.nextAttemptAt > clock.value);
  flush = await relay.flush();
  assert.equal(flush.attempted, 0);
  clock.value += 1000;
  flush = await relay.flush();
  assert.equal(flush.delivered, 1);
  assert.equal(attempts, 2);
  assert.equal(relay.pending(10).length, 0);
});

test('durable spool failure blocks bot claim instead of losing alerts', async () => {
  const clock = { value: 1000 };
  const bot = botAlertQueue([{ id: 'alert-1', severity: 'CRITICAL', type: 'FAULT', reason: 'PERSIST_FAIL' }]);
  const store = {
    load: () => ({ schemaVersion: 1, records: [] }),
    save: () => false
  };
  const relay = new AlertRelay({ now: () => clock.value, botClient: bot, store });
  const result = await relay.ingest();
  assert.equal(result.blocked, true);
  assert.equal(result.reason, 'SPOOL_PERSIST_BEFORE_CLAIM_FAILED');
  assert.equal(bot.calls.some((row) => row[0] === 'claim'), false);
  assert.equal(bot.pending.length, 1);
});

test('2500-alert host relay soak remains bounded while delivering without gameplay authority', async () => {
  const clock = { value: 1000 };
  const store = memoryStateStore();
  const bot = botAlertQueue([]);
  let delivered = 0;
  const relay = new AlertRelay({
    now: () => clock.value,
    botClient: bot,
    store,
    capacity: 50,
    ingestLimit: 100,
    transports: [{ name: 'critical-sink', severities: ['CRITICAL'], send: async () => { delivered += 1; return true; } }]
  });
  for (let batch = 0; batch < 25; batch += 1) {
    for (let i = 0; i < 100; i += 1) {
      const id = batch * 100 + i;
      bot.pending.push({ id: `alert-${id}`, severity: 'CRITICAL', type: 'SOAK', reason: String(id) });
    }
    await relay.ingest();
    await relay.flush(100);
    clock.value += 1000;
  }
  assert.equal(bot.pending.length, 0);
  assert.equal(delivered, 2500);
  assert.ok(relay.status().retained <= 50);
  assert.equal(relay.status().gameplayActionAuthority, false);
  assert.equal(relay.status().rawGameplayActionAuthority, false);
});

test('HeadlessHostController keeps watchdog supervision alive when alert transport fails and owns no gameplay commands', async () => {
  const clock = { value: 0 };
  let restarts = 0;
  const botCalls = [];
  const botClient = {
    async hostHeartbeat() { botCalls.push('hostHeartbeat'); throw new Error('browser gone'); },
    async pendingAlerts() { botCalls.push('pendingAlerts'); throw new Error('browser gone'); },
    async claimAlerts() { botCalls.push('claimAlerts'); return []; }
  };
  const controller = new HeadlessHostController({
    now: () => clock.value,
    botClient,
    alertStore: memoryStateStore(),
    restartProcess: async () => { restarts += 1; return true; },
    startupGraceMs: 5000,
    restartDelayMs: 1000
  });
  controller.configureRestart({ enabled: true, ack: HOST_RESTART_ACK });
  await controller.tick();
  clock.value = 7000;
  const result = await controller.tick();
  assert.equal(restarts, 1);
  assert.equal(result.status.gameplayActionAuthority, false);
  assert.equal(result.status.rawGameplayActionAuthority, false);
  assert.equal(result.status.botSafetyLogicDuplicated, false);
  assert.ok(botCalls.includes('hostHeartbeat'));
  assert.ok(botCalls.includes('pendingAlerts'));
  assert.equal(botCalls.includes('attack'), false);
  assert.equal(botCalls.includes('move'), false);
});

test('public AIO_V3.operations exposes the host heartbeat and persist-before-claim alert handshake', () => {
  const root = publicRoot();
  const api = install(root, { mode: 'shadow', visibleStatus: false, debugMonitorVisible: false, storage: runtimeStorage() });
  assert.equal(typeof api.operations.hostHeartbeat, 'function');
  assert.equal(typeof api.operations.pendingAlerts, 'function');
  assert.equal(typeof api.operations.claimAlerts, 'function');
  assert.equal(typeof api.operations.configureSafeRecovery, 'function');
  assert.equal(typeof api.operations.safeRecoveryStatus, 'function');

  api.__runtime.log.emit({ component: 'host-test', event: 'HOST_TEST_WARNING', severity: 'warn', reason: 'PUBLIC_HANDSHAKE' });
  const pending = api.operations.pendingAlerts(10);
  const row = pending.find((alert) => alert.reason === 'PUBLIC_HANDSHAKE');
  assert.ok(row);
  const claimed = api.operations.claimAlerts([row.id]);
  assert.equal(claimed.length, 1);
  assert.equal(api.operations.pendingAlerts(10).some((alert) => alert.id === row.id), false);
  const heartbeat = api.operations.hostHeartbeat();
  assert.equal(heartbeat.type, 'AIO_V3_HOST_WATCHDOG_BEACON');
  assert.equal(heartbeat.contract.hostOwnsRestart, true);
  assert.equal(heartbeat.contract.actionAuthority, false);
});
