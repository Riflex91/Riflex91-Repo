'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { ManagedProcessLauncher } = require('../host/managed-process-launcher');
const { HostApiServer } = require('../host/host-api-server');
const { createWebhookAlertTransport, validateWebhookUrl } = require('../host/alert-transports');
const { RestartReconciliationObserver } = require('../host/restart-reconciliation-observer');
const { HeadlessHostController } = require('../host/headless-host-controller');
const { ProductionHostHarness } = require('../host/production-host-harness');
const { HOST_RESTART_ACK } = require('../host/host-watchdog-supervisor');

function memoryStateStore() {
  let value = { schemaVersion: 1, records: [] };
  return {
    load: () => JSON.parse(JSON.stringify(value)),
    save: (next) => { value = JSON.parse(JSON.stringify(next)); return true; },
    status: () => ({ mode: 'memory-test-store' })
  };
}

function validBeacon(clock, seq, runId = 'run-a', leaseMs = 5000) {
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
    health: { state: 'HEALTHY', watchdogState: 'HEALTHY', groupState: 'HEALTHY', fourCharacterReady: true },
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

function fakeChild(pid = 1234) {
  const child = new EventEmitter();
  child.pid = pid;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  child.killCalls = [];
  child.kill = (signal) => {
    child.killCalls.push(signal);
    child.signalCode = signal;
    queueMicrotask(() => child.emit('exit', null, signal));
    return true;
  };
  return child;
}

test('ManagedProcessLauncher uses shell:false, captures bounded output and serializes a process restart', async () => {
  const clock = { value: 1000 };
  const children = [];
  const spawnCalls = [];
  const launcher = new ManagedProcessLauncher({
    now: () => clock.value,
    command: '/usr/bin/chromium',
    args: ['--headless=new', 'https://adventure.land/'],
    stopGraceMs: 1000,
    outputCapacity: 10,
    spawn: (command, args, options) => {
      spawnCalls.push({ command, args, options });
      const child = fakeChild(1000 + children.length);
      children.push(child);
      return child;
    }
  });

  const start = await launcher.start({ reason: 'TEST' });
  assert.equal(start.started, true);
  assert.equal(spawnCalls[0].options.shell, false);
  assert.equal(spawnCalls[0].options.detached, false);
  children[0].stdout.emit('data', 'ready');
  assert.equal(launcher.tail(1)[0].text, 'ready');

  clock.value += 1000;
  const restart = await launcher.restart({ reason: 'WATCHDOG', runId: 'run-a' });
  assert.equal(restart.ok, true);
  assert.deepEqual(children[0].killCalls, ['SIGTERM']);
  assert.equal(children.length, 2);
  assert.equal(launcher.status().generation, 2);
  assert.equal(launcher.status().gameplayActionAuthority, false);
  assert.equal(launcher.status().rawGameplayActionAuthority, false);
});

test('ManagedProcessLauncher refuses an empty command instead of invoking a shell fallback', async () => {
  let calls = 0;
  const launcher = new ManagedProcessLauncher({ spawn: () => { calls += 1; } });
  const result = await launcher.start();
  assert.equal(result.started, false);
  assert.equal(result.reason, 'PROCESS_COMMAND_REQUIRED');
  assert.equal(calls, 0);
});

test('ManagedProcessLauncher reports forced shutdown per stop attempt instead of leaking historical state', async () => {
  const children = [];
  const makeChild = (pid, stubborn) => {
    const child = new EventEmitter();
    child.pid = pid;
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.exitCode = null;
    child.signalCode = null;
    child.killCalls = [];
    child.kill = (signal) => {
      child.killCalls.push(signal);
      if (signal === 'SIGKILL' || !stubborn) child.signalCode = signal;
      return true;
    };
    return child;
  };
  const launcher = new ManagedProcessLauncher({
    command: '/usr/bin/chromium',
    stopGraceMs: 1000,
    spawn: () => {
      const child = makeChild(2000 + children.length, children.length === 0);
      children.push(child);
      return child;
    }
  });
  launcher._waitForExit = async (child) => !(child === children[0] && child.killCalls.length === 1 && child.killCalls[0] === 'SIGTERM');

  assert.equal((await launcher.start()).started, true);
  const forced = await launcher.stop('FORCED_TEST');
  assert.equal(forced.stopped, true);
  assert.equal(forced.forced, true);
  assert.deepEqual(children[0].killCalls, ['SIGTERM', 'SIGKILL']);
  assert.equal(launcher.status().stats.forcedKills, 1);

  assert.equal((await launcher.start()).started, true);
  const graceful = await launcher.stop('GRACEFUL_TEST');
  assert.equal(graceful.stopped, true);
  assert.equal(graceful.forced, false);
  assert.deepEqual(children[1].killCalls, ['SIGTERM']);
  assert.equal(launcher.status().stats.forcedKills, 1);

  const duplicate = await launcher.stop('DUPLICATE_TEST');
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.forced, false);
});

test('HostApiServer refuses non-loopback bind and short authentication tokens', async () => {
  const publicServer = new HostApiServer({ host: '0.0.0.0', token: 'x'.repeat(64) });
  assert.equal((await publicServer.start()).reason, 'LOOPBACK_BIND_REQUIRED');
  const weak = new HostApiServer({ host: '127.0.0.1', token: 'short' });
  assert.equal((await weak.start()).reason, 'AUTH_TOKEN_TOO_SHORT');
});

test('HostApiServer is authenticated and read-only on loopback', async () => {
  const token = 't'.repeat(48);
  const controller = {
    watchdog: { status: () => ({ state: 'HEALTHY' }), listHistory: () => [{ type: 'OK' }] },
    alertRelay: { pending: () => [{ id: 'alert-1' }] },
    status: () => ({ mode: 'controller', gameplayActionAuthority: false })
  };
  const launcher = { status: () => ({ running: true, gameplayActionAuthority: false }) };
  const api = new HostApiServer({ controller, launcher, host: '127.0.0.1', port: 0, token });
  const started = await api.start();
  assert.equal(started.started, true);
  const base = `http://127.0.0.1:${started.address.port}`;
  try {
    let response = await fetch(`${base}/v1/status`);
    assert.equal(response.status, 401);
    response = await fetch(`${base}/v1/status`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(response.status, 200);
    const status = await response.json();
    assert.equal(status.ok, true);
    assert.equal(status.controller.gameplayActionAuthority, false);
    response = await fetch(`${base}/v1/alerts`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
    assert.equal(response.status, 405);
    assert.equal(api.status().gameplayActionAuthority, false);
    assert.equal(api.status().tokenExposed, false);
  } finally {
    await api.stop();
  }
});

test('webhook transport requires HTTPS except explicit loopback test mode and never exposes credential headers', async () => {
  assert.equal(validateWebhookUrl('http://example.com/hook').valid, false);
  assert.equal(validateWebhookUrl('https://example.com/hook').valid, true);
  assert.equal(validateWebhookUrl('http://127.0.0.1:1234/hook', true).valid, true);
  const calls = [];
  const transport = createWebhookAlertTransport({
    name: 'critical-push',
    url: 'https://alerts.example.test/hook',
    headers: { authorization: 'Bearer super-secret' },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 202 };
    }
  });
  const result = await transport.send({ id: 'alert-1', severity: 'CRITICAL', reason: 'TEST' });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(JSON.parse(calls[0].options.body).alert.id, 'alert-1');
  const status = transport.status();
  assert.equal(status.credentialsExternal, true);
  assert.equal(status.headersExposed, false);
  assert.equal(JSON.stringify(status).includes('super-secret'), false);
  assert.equal(status.gameplayActionAuthority, false);
});

test('RestartReconciliationObserver requires a fresh run and consumes observation-only bot evidence', async () => {
  const clock = { value: 1000 };
  let evidence = { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: false, blockers: ['TX_RECOVERING'] };
  const observer = new RestartReconciliationObserver({
    now: () => clock.value,
    botClient: { reconciliationStatus: async () => evidence }
  });
  observer.begin('run-a');
  assert.equal(observer.observeFreshRun('run-a').reason, 'RUN_ID_NOT_FRESH');
  assert.equal(observer.observeFreshRun('run-b').accepted, true);
  let result = await observer.observe();
  assert.equal(result.clean, false);
  assert.equal(observer.status().state, 'BLOCKED');
  evidence = { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: true, blockers: [], detail: 'runtime reconciled itself' };
  clock.value += 1000;
  result = await observer.observe();
  assert.equal(result.clean, true);
  assert.equal(observer.status().state, 'OBSERVED_CLEAN');
  assert.equal(observer.status().reconciliationActionAuthority, false);
  assert.equal(observer.status().hostMayNotResumeBlindly, true);
});

test('RestartReconciliationObserver rejects evidence that claims gameplay authority', async () => {
  const observer = new RestartReconciliationObserver({
    botClient: { reconciliationStatus: async () => ({ actionAuthority: true, rawGameplayActionAuthority: false, observedClean: true, blockers: [] }) }
  });
  observer.begin('old');
  observer.observeFreshRun('new');
  const result = await observer.observe();
  assert.equal(result.observed, false);
  assert.equal(observer.status().state, 'BLOCKED');
  assert.equal(observer.status().lastError.code, 'RECONCILIATION_AUTHORITY_INVALID');
});

test('HeadlessHostController observes restart -> fresh run -> blocked -> clean reconciliation without gameplay action authority', async () => {
  const clock = { value: 0 };
  let phase = 'alive-a';
  let reconcileCalls = 0;
  let restartCalls = 0;
  const botClient = {
    async hostHeartbeat() {
      if (phase === 'down') throw new Error('browser down');
      return validBeacon(clock, phase === 'alive-a' ? 1 : 1, phase === 'alive-a' ? 'run-a' : 'run-b');
    },
    async pendingAlerts() { return []; },
    async claimAlerts() { return []; },
    async reconciliationStatus() {
      reconcileCalls += 1;
      if (reconcileCalls === 1) return { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: false, blockers: ['TRAVEL_RECOVERING'] };
      return { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: true, blockers: [] };
    }
  };
  const controller = new HeadlessHostController({
    now: () => clock.value,
    botClient,
    alertStore: memoryStateStore(),
    restartProcess: async () => { restartCalls += 1; return true; },
    startupGraceMs: 5000,
    restartDelayMs: 1000,
    restartCooldownMs: 5000
  });
  controller.configureRestart({ enabled: true, ack: HOST_RESTART_ACK });
  await controller.tick();
  phase = 'down';
  clock.value = 7000;
  let result = await controller.tick();
  assert.equal(restartCalls, 1);
  assert.equal(result.status.reconciliation.state, 'WAITING_FOR_FRESH_RUN');

  phase = 'alive-b';
  clock.value = 8000;
  result = await controller.tick();
  assert.equal(result.status.reconciliation.state, 'BLOCKED');
  assert.deepEqual(result.status.reconciliation.lastEvidence.blockers, ['TRAVEL_RECOVERING']);
  clock.value = 9000;
  result = await controller.tick();
  assert.equal(result.status.reconciliation.state, 'OBSERVED_CLEAN');
  assert.equal(result.status.gameplayActionAuthority, false);
  assert.equal(result.status.rawGameplayActionAuthority, false);
  assert.equal(restartCalls, 1);
});

test('ProductionHostHarness wires launcher/controller/API but keeps every host surface non-gameplay-authoritative', async () => {
  const clock = { value: 1000 };
  let seq = 0;
  const botClient = {
    async hostHeartbeat() { seq += 1; return validBeacon(clock, seq, 'run-harness'); },
    async pendingAlerts() { return []; },
    async claimAlerts() { return []; },
    async reconciliationStatus() { return { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: true, blockers: [] }; }
  };
  const harness = new ProductionHostHarness({
    now: () => clock.value,
    botClient,
    alertStore: memoryStateStore(),
    apiToken: 'h'.repeat(48),
    apiHost: '127.0.0.1',
    apiPort: 0,
    tickIntervalMs: 60000
  });
  const started = await harness.start({ startProcess: false, skipInitialTick: true });
  assert.equal(started.started, true);
  try {
    await harness.tick();
    const status = harness.status();
    assert.equal(status.gameplayActionAuthority, false);
    assert.equal(status.rawGameplayActionAuthority, false);
    assert.equal(status.controller.gameplayActionAuthority, false);
    assert.equal(status.api.loopbackOnly, true);
  } finally {
    await harness.stop();
  }
});

test('2500-cycle production host controller soak stays healthy, bounded and action-authority free', async () => {
  const clock = { value: 1000 };
  let seq = 0;
  const botClient = {
    async hostHeartbeat() { seq += 1; return validBeacon(clock, seq, 'soak-run'); },
    async pendingAlerts() { return []; },
    async claimAlerts() { return []; },
    async reconciliationStatus() { return { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: true, blockers: [] }; }
  };
  const controller = new HeadlessHostController({
    now: () => clock.value,
    botClient,
    alertStore: memoryStateStore(),
    restartProcess: async () => { throw new Error('restart must not occur in healthy soak'); }
  });
  controller.configureRestart({ enabled: true, ack: HOST_RESTART_ACK });
  for (let i = 0; i < 2500; i += 1) {
    const result = await controller.tick();
    assert.equal(result.status.watchdog.state, 'HEALTHY');
    assert.equal(result.status.gameplayActionAuthority, false);
    assert.equal(result.status.rawGameplayActionAuthority, false);
    clock.value += 1000;
  }
  assert.equal(controller.watchdog.listHistory(1000).length <= 100, true);
  assert.equal(controller.status().stats.ticks, 2500);
  assert.equal(controller.status().watchdog.stats.restartAttempts, 0);
});
