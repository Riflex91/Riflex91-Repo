'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { CdpAdventureLandSessionDriver } = require('../host/cdp-adventure-land-session');
const {
  validateWindowsBrowserBootstrap,
  loadWindowsHostConfig
} = require('../host/windows-host-service');
const {
  PersistentWindowsStartBudget,
  WindowsHostServiceSupervisor
} = require('../host/windows-host-service-supervisor');

function memoryStore() {
  let value = null;
  return {
    load(fallback) { return value == null ? JSON.parse(JSON.stringify(fallback)) : JSON.parse(JSON.stringify(value)); },
    save(next) { value = JSON.parse(JSON.stringify(next)); return true; },
    read() { return value == null ? null : JSON.parse(JSON.stringify(value)); }
  };
}

test('CDP startup window waits for delayed AIO_V3 runtime without restarting the outer service', async () => {
  const clock = { value: 1000 };
  const driver = new CdpAdventureLandSessionDriver({
    fetch: async () => ({ ok: true, status: 200, async text() { return '[]'; } }),
    startupWaitMs: 5000,
    startupPollMs: 1000,
    connectAttempts: 1,
    now: () => clock.value,
    sleep: async (ms) => { clock.value += ms; }
  });

  let attempts = 0;
  driver._ensureSession = async () => {
    attempts += 1;
    if (attempts < 4) throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
    driver.connection = { closed: false };
    driver.contextId = 7;
    driver.currentTarget = { id: 'ready', title: 'Adventure Land', url: 'https://adventure.land/' };
    return true;
  };

  const result = await driver.start();
  assert.equal(result.started, true);
  assert.equal(result.startupAttempts, 4);
  assert.equal(driver.status().startup.state, 'READY');
  assert.equal(driver.status().startup.attempts, 4);
  assert.equal(driver.status().stats.startupPolls, 4);
  assert.equal(driver.status().stats.startupTimeouts, 0);
  assert.equal(clock.value, 4000);
  assert.equal(driver.status().gameplayActionAuthority, false);
});

test('CDP startup window fails closed with explicit timeout when runtime never appears', async () => {
  const clock = { value: 1000 };
  const driver = new CdpAdventureLandSessionDriver({
    fetch: async () => ({ ok: true, status: 200, async text() { return '[]'; } }),
    startupWaitMs: 3000,
    startupPollMs: 1000,
    connectAttempts: 1,
    now: () => clock.value,
    sleep: async (ms) => { clock.value += ms; }
  });
  driver._ensureSession = async () => { throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE'); };

  await assert.rejects(() => driver.start(), /CDP_SESSION_STARTUP_TIMEOUT:AIO_V3_OPERATIONS_UNAVAILABLE/);
  const status = driver.status();
  assert.equal(status.startup.state, 'TIMEOUT');
  assert.equal(status.startup.deadlineAt, 4000);
  assert.equal(status.startup.attempts, 4);
  assert.equal(status.stats.startupTimeouts, 1);
  assert.equal(status.connected, false);
  assert.equal(status.gameplayActionAuthority, false);
  assert.equal(status.rawGameplayActionAuthority, false);
});

test('Windows browser bootstrap requires dedicated profile, matching CDP port and Adventure Land launch URL', () => {
  const good = validateWindowsBrowserBootstrap([
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--user-data-dir=C:\\Users\\Tester\\AppData\\Local\\AioBot\\browser-profile',
    'https://adventure.land/'
  ], 'http://127.0.0.1:9222', 'https://adventure.land');
  assert.equal(good.remoteDebuggingPort, 9222);
  assert.match(good.profilePath, /AioBot\\browser-profile$/);

  assert.throws(() => validateWindowsBrowserBootstrap([
    '--remote-debugging-port=9222',
    'https://adventure.land/'
  ], 'http://127.0.0.1:9222', 'https://adventure.land'), /WINDOWS_HOST_DEDICATED_PROFILE_REQUIRED/);

  assert.throws(() => validateWindowsBrowserBootstrap([
    '--remote-debugging-port=9223',
    '--user-data-dir=C:\\AioBot\\profile',
    'https://adventure.land/'
  ], 'http://127.0.0.1:9222', 'https://adventure.land'), /WINDOWS_HOST_REMOTE_DEBUGGING_PORT_MISMATCH/);

  assert.throws(() => validateWindowsBrowserBootstrap([
    '--remote-debugging-port=9222',
    '--remote-debugging-address=0.0.0.0',
    '--user-data-dir=C:\\AioBot\\profile',
    'https://adventure.land/'
  ], 'http://127.0.0.1:9222', 'https://adventure.land'), /WINDOWS_HOST_REMOTE_DEBUGGING_ADDRESS_NOT_LOOPBACK/);

  assert.throws(() => validateWindowsBrowserBootstrap([
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\AioBot\\profile',
    'https://example.com/'
  ], 'http://127.0.0.1:9222', 'https://adventure.land'), /WINDOWS_HOST_ADVENTURE_LAND_START_URL_REQUIRED/);
});

test('Windows production config enables five-minute session bootstrap without storing Adventure Land credentials', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-step11-'));
  const file = path.join(dir, 'host.json');
  fs.writeFileSync(file, JSON.stringify({
    schemaVersion: 1,
    browserCommand: 'C:\\Browser\\browser.exe',
    browserArgs: [
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      '---user-data-dir=unused',
      '--user-data-dir=C:\\Users\\Tester\\AppData\\Local\\AioBot\\browser-profile',
      'https://adventure.land/'
    ].filter((value) => value !== '---user-data-dir=unused'),
    cdpEndpoint: 'http://127.0.0.1:9222',
    allowedOrigin: 'https://adventure.land',
    serviceStatePath: path.join(dir, 'state.json'),
    alertStatePath: path.join(dir, 'alerts.json'),
    apiTokenEnvironmentVariable: 'AIO_V3_HOST_API_TOKEN'
  }));
  const config = loadWindowsHostConfig(file, { AIO_V3_HOST_API_TOKEN: 'x'.repeat(64) });
  assert.equal(config.browserSessionStartupWaitMs, 300000);
  assert.equal(config.browserSessionStartupPollMs, 2000);
  assert.match(config.browserProfilePath, /AioBot\\browser-profile$/);
  assert.equal(JSON.stringify(config).includes('password'), false);
  assert.equal(JSON.stringify(config).includes('username'), false);
});

test('internal runtime startup polling burns only one persistent service start admission', async () => {
  const clock = { value: 1000 };
  const store = memoryStore();
  const budget = new PersistentWindowsStartBudget({
    store,
    now: () => clock.value,
    windowMs: 60000,
    maxStartsPerWindow: 4,
    circuitCooldownMs: 60000
  });
  const driver = new CdpAdventureLandSessionDriver({
    fetch: async () => ({ ok: true, status: 200, async text() { return '[]'; } }),
    startupWaitMs: 5000,
    startupPollMs: 1000,
    connectAttempts: 1,
    now: () => clock.value,
    sleep: async (ms) => { clock.value += ms; }
  });
  let polls = 0;
  driver._ensureSession = async () => {
    polls += 1;
    if (polls < 4) throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
    driver.connection = { closed: false };
    driver.contextId = 1;
    driver.currentTarget = { id: 'ready', url: 'https://adventure.land/' };
  };
  const harness = {
    async start() {
      await driver.start();
      return { started: true };
    },
    async stop() { return { stopped: true }; },
    status() { return { browserSession: driver.status(), gameplayActionAuthority: false, rawGameplayActionAuthority: false }; }
  };
  const supervisor = new WindowsHostServiceSupervisor({
    harness,
    budget,
    now: () => clock.value,
    stableAfterMs: 10000,
    setTimeout() { return { unref() {} }; },
    clearTimeout() {}
  });

  const result = await supervisor.start();
  assert.equal(result.started, true);
  assert.equal(polls, 4);
  assert.equal(store.read().stats.startAttempts, 1);
  assert.equal(store.read().starts.length, 1);
  await supervisor.stop('TEST');
});

test('Windows installer permanently configures persistent profile and bounded runtime startup grace', () => {
  const root = path.resolve(__dirname, '..', '..');
  const install = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'install.ps1'), 'utf8');
  assert.match(install, /--remote-debugging-address=127\.0\.0\.1/);
  assert.match(install, /--user-data-dir=\$profile/);
  assert.match(install, /browserSessionStartupWaitMs = 300000/);
  assert.match(install, /browserSessionStartupPollMs = 2000/);
  assert.doesNotMatch(install, /password/i);
  assert.doesNotMatch(install, /AdventureLandPassword/i);
});
