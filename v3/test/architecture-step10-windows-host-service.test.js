'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const {
  PersistentWindowsStartBudget,
  WindowsHostServiceSupervisor
} = require('../host/windows-host-service-supervisor');
const {
  loadWindowsHostConfig,
  installGracefulShutdown
} = require('../host/windows-host-service');

function memoryStore(initial = null) {
  let value = initial;
  return {
    load(fallback) {
      if (value == null) return JSON.parse(JSON.stringify(fallback));
      return JSON.parse(JSON.stringify(value));
    },
    save(next) {
      value = JSON.parse(JSON.stringify(next));
      return true;
    },
    read() { return value == null ? null : JSON.parse(JSON.stringify(value)); }
  };
}

test('persistent Windows start budget survives process restart and opens a bounded circuit', () => {
  const clock = { value: 1000 };
  const store = memoryStore();
  const make = () => new PersistentWindowsStartBudget({
    store,
    now: () => clock.value,
    windowMs: 60000,
    maxStartsPerWindow: 2,
    circuitCooldownMs: 60000
  });

  let budget = make();
  assert.equal(budget.admitStart().allowed, true);
  clock.value += 1000;
  assert.equal(budget.admitStart().allowed, true);
  clock.value += 1000;
  let denied = budget.admitStart();
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'START_BUDGET_EXHAUSTED');

  budget = make();
  denied = budget.admitStart();
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'START_CIRCUIT_OPEN');

  clock.value += 61000;
  const recovered = budget.admitStart();
  assert.equal(recovered.allowed, true);
  assert.equal(budget.status().gameplayActionAuthority, false);
  assert.equal(budget.status().rawGameplayActionAuthority, false);
});

test('persistent Windows start budget fails closed on corrupt/unreadable state', () => {
  const budget = new PersistentWindowsStartBudget({
    store: {
      load() { throw Object.assign(new Error('corrupt'), { code: 'STATE_FILE_CORRUPT' }); },
      save() { return true; }
    }
  });
  const result = budget.admitStart();
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'SERVICE_STATE_UNAVAILABLE');
});

test('Windows host service supervisor stops the harness if post-start state persistence fails', async () => {
  let starts = 0;
  let stops = 0;
  const harness = {
    async start() { starts += 1; return { started: true }; },
    async stop() { stops += 1; return { stopped: true }; },
    status() { return { gameplayActionAuthority: false }; }
  };
  const budget = {
    admitStart: () => ({ allowed: true }),
    recordStarted() { throw new Error('disk unavailable'); },
    recordFailure() {},
    recordCleanStop() {},
    status: () => ({ gameplayActionAuthority: false })
  };
  const supervisor = new WindowsHostServiceSupervisor({ harness, budget });
  const result = await supervisor.start();
  assert.equal(result.started, false);
  assert.equal(result.reason, 'WINDOWS_HOST_STATE_PERSIST_FAILED');
  assert.equal(starts, 1);
  assert.equal(stops, 1);
  assert.equal(supervisor.status().gameplayActionAuthority, false);
  assert.equal(supervisor.status().rawGameplayActionAuthority, false);
});

test('Windows host service records clean shutdown and stable state without adding authority', async () => {
  const clock = { value: 1000 };
  const store = memoryStore();
  const budget = new PersistentWindowsStartBudget({
    store,
    now: () => clock.value,
    windowMs: 60000,
    maxStartsPerWindow: 4,
    circuitCooldownMs: 60000
  });
  let stableCallback = null;
  const timer = { unref() {} };
  let stops = 0;
  const harness = {
    async start() { return { started: true }; },
    async stop() { stops += 1; return { stopped: true }; },
    status() { return { gameplayActionAuthority: false, rawGameplayActionAuthority: false }; }
  };
  const supervisor = new WindowsHostServiceSupervisor({
    harness,
    budget,
    now: () => clock.value,
    stableAfterMs: 10000,
    setTimeout(fn) { stableCallback = fn; return timer; },
    clearTimeout() {}
  });
  assert.equal((await supervisor.start()).started, true);
  clock.value += 10000;
  stableCallback();
  assert.equal(store.read().stats.stableMarks, 1);
  assert.equal((await supervisor.stop('TEST')).stopped, true);
  assert.equal(stops, 1);
  assert.equal(store.read().stats.cleanStops, 1);
  assert.equal(supervisor.status().genericShellAuthority, false);
});

test('SIGINT/SIGTERM handler uses the bounded service stop path', async () => {
  const proc = new EventEmitter();
  proc.exitCode = null;
  proc.once = proc.once.bind(proc);
  proc.removeListener = proc.removeListener.bind(proc);
  let reason = null;
  const service = {
    async stop(value) { reason = value; return { stopped: true }; }
  };
  const cleanup = installGracefulShutdown(service, proc);
  proc.emit('SIGTERM');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reason, 'WINDOWS_SIGTERM');
  assert.equal(proc.exitCode, 0);
  cleanup();
});

test('Windows host config keeps API secret in environment and requires loopback CDP', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-win-host-'));
  const configPath = path.join(dir, 'host.json');
  fs.writeFileSync(configPath, JSON.stringify({
    schemaVersion: 1,
    browserCommand: 'C:\\Browser\\browser.exe',
    browserArgs: ['--remote-debugging-port=9222', 'https://adventure.land/'],
    cdpEndpoint: 'http://127.0.0.1:9222',
    allowedOrigin: 'https://adventure.land',
    serviceStatePath: path.join(dir, 'state.json'),
    alertStatePath: path.join(dir, 'alerts.json'),
    apiTokenEnvironmentVariable: 'AIO_V3_HOST_API_TOKEN'
  }));
  const loaded = loadWindowsHostConfig(configPath, { AIO_V3_HOST_API_TOKEN: 'x'.repeat(64) });
  assert.equal(loaded.apiToken, 'x'.repeat(64));
  assert.equal(loaded.cdpEndpoint, 'http://127.0.0.1:9222');
  assert.throws(() => loadWindowsHostConfig(configPath, {}), /WINDOWS_HOST_API_TOKEN_REQUIRED/);

  const invalid = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  invalid.cdpEndpoint = 'http://192.168.1.50:9222';
  fs.writeFileSync(configPath, JSON.stringify(invalid));
  assert.throws(() => loadWindowsHostConfig(configPath, { AIO_V3_HOST_API_TOKEN: 'x'.repeat(64) }), /WINDOWS_HOST_CDP_LOOPBACK_REQUIRED/);
});

test('Windows Task Scheduler installer uses interactive logon, bounded restart and DPAPI CurrentUser', () => {
  const root = path.resolve(__dirname, '..', '..');
  const install = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'install.ps1'), 'utf8');
  const runner = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'run.ps1'), 'utf8');
  assert.match(install, /New-ScheduledTaskTrigger -AtLogOn/);
  assert.match(install, /-LogonType Interactive/);
  assert.match(install, /-RestartCount 3/);
  assert.match(install, /-RestartInterval \(New-TimeSpan -Minutes 2\)/);
  assert.match(install, /-MultipleInstances IgnoreNew/);
  assert.doesNotMatch(install, /AtStartup/);
  assert.doesNotMatch(install, /systemd/i);
  assert.match(install, /DataProtectionScope\]::CurrentUser/);
  assert.match(runner, /DataProtectionScope\]::CurrentUser/);
  assert.match(runner, /Remove-Item Env:AIO_V3_HOST_API_TOKEN/);
});

test('2500-cycle Windows service supervisor soak remains bounded and authority-free', async () => {
  const clock = { value: 1000 };
  const store = memoryStore();
  const budget = new PersistentWindowsStartBudget({
    store,
    now: () => clock.value,
    windowMs: 60000,
    maxStartsPerWindow: 4,
    circuitCooldownMs: 60000
  });
  const harness = {
    async start() { return { started: true }; },
    async stop() { return { stopped: true }; },
    status() { return { gameplayActionAuthority: false, rawGameplayActionAuthority: false }; }
  };
  const supervisor = new WindowsHostServiceSupervisor({
    harness,
    budget,
    now: () => clock.value,
    stableAfterMs: 10000,
    setTimeout() { return { unref() {} }; },
    clearTimeout() {}
  });

  for (let i = 0; i < 2500; i += 1) {
    const started = await supervisor.start();
    assert.equal(started.started, true);
    const stopped = await supervisor.stop('SOAK');
    assert.equal(stopped.stopped, true);
    assert.equal(supervisor.status().gameplayActionAuthority, false);
    assert.equal(supervisor.status().rawGameplayActionAuthority, false);
    clock.value += 61000;
  }
  const state = store.read();
  assert.ok(state.starts.length <= 2);
  assert.equal(state.stats.starts, 2500);
  assert.equal(state.stats.cleanStops, 2500);
});
