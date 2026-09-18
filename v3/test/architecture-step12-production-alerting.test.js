'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { AlertRelay } = require('../host/alert-relay');
const { ManagedProcessLauncher } = require('../host/managed-process-launcher');
const {
  parseWindowsAlertSecrets,
  createWindowsCriticalAlertTransports,
  canaryWindowsCriticalAlertRoutes
} = require('../host/windows-alerting');
const {
  loadWindowsHostConfig,
  sanitizeWindowsBrowserEnvironment
} = require('../host/windows-host-service');

function memoryStore() {
  let value = null;
  return {
    load(fallback) { return value == null ? JSON.parse(JSON.stringify(fallback)) : JSON.parse(JSON.stringify(value)); },
    save(next) { value = JSON.parse(JSON.stringify(next)); return true; },
    read() { return value == null ? null : JSON.parse(JSON.stringify(value)); }
  };
}

function secrets(primaryHost = 'primary.example', fallbackHost = 'fallback.example') {
  return {
    schemaVersion: 1,
    primary: {
      url: 'https://' + primaryHost + '/hook/secret-primary',
      headers: { Authorization: 'Bearer primary-secret' }
    },
    fallback: {
      url: 'https://' + fallbackHost + '/hook/secret-fallback',
      headers: { 'X-Api-Key': 'fallback-secret' }
    }
  };
}

test('Windows alert secret schema requires two independent HTTPS hosts and blocks dangerous headers', () => {
  const parsed = parseWindowsAlertSecrets(secrets());
  assert.equal(parsed.primary.hostname, 'primary.example');
  assert.equal(parsed.fallback.hostname, 'fallback.example');

  assert.throws(() => parseWindowsAlertSecrets(secrets('same.example', 'same.example')), /WINDOWS_ALERT_ROUTES_NOT_INDEPENDENT/);
  const insecure = secrets();
  insecure.primary.url = 'http://primary.example/hook';
  assert.throws(() => parseWindowsAlertSecrets(insecure), /ALERT_PRIMARY_HTTPS_REQUIRED/);

  const blocked = secrets();
  blocked.primary.headers.Host = 'evil.example';
  assert.throws(() => parseWindowsAlertSecrets(blocked), /ALERT_HEADER_NOT_ALLOWED/);

  const injected = secrets();
  injected.primary.headers.Authorization = 'Bearer x\r\nX-Evil: yes';
  assert.throws(() => parseWindowsAlertSecrets(injected), /ALERT_HEADER_VALUE_INVALID/);
});

test('production CRITICAL transports expose health but never URL/header secrets', () => {
  const transports = createWindowsCriticalAlertTransports(JSON.stringify(secrets()), {
    fetch: async () => ({ ok: true, status: 204 })
  });
  assert.equal(transports.length, 2);
  for (const transport of transports) {
    assert.equal(transport.required, true);
    assert.deepEqual(transport.severities, ['CRITICAL']);
    const status = transport.status();
    const serialized = JSON.stringify(status);
    assert.equal(status.credentialsExternal, true);
    assert.equal(status.headersExposed, false);
    assert.equal(serialized.includes('secret-primary'), false);
    assert.equal(serialized.includes('fallback-secret'), false);
    assert.equal(serialized.includes('primary.example'), false);
    assert.equal(serialized.includes('fallback.example'), false);
  }
});

test('durable CRITICAL alert remains pending until both independent required routes accept it', async () => {
  const clock = { value: 1000 };
  let fallbackAttempts = 0;
  const fetch = async (url) => {
    if (String(url).includes('primary.example')) return { ok: true, status: 204 };
    fallbackAttempts += 1;
    if (fallbackAttempts === 1) return { ok: false, status: 503 };
    return { ok: true, status: 204 };
  };
  const transports = createWindowsCriticalAlertTransports(secrets(), { fetch, timeoutMs: 1000 });
  const store = memoryStore();
  let pending = [{ id: 'critical-1', severity: 'CRITICAL', type: 'TEST', reason: 'STEP12', at: 1000 }];
  const claimed = [];
  const botClient = {
    async pendingAlerts() { return pending; },
    async claimAlerts(ids) {
      const rows = pending.filter((row) => ids.includes(row.id));
      claimed.push(...rows.map((row) => row.id));
      pending = pending.filter((row) => !ids.includes(row.id));
      return rows;
    }
  };
  const relay = new AlertRelay({
    now: () => clock.value,
    botClient,
    store,
    transports,
    baseBackoffMs: 1000,
    maxBackoffMs: 1000,
    maxAttempts: 4
  });

  const ingest = await relay.ingest();
  assert.equal(ingest.ingested, 1);
  assert.equal(ingest.claimed, 1);
  assert.deepEqual(claimed, ['critical-1']);

  const first = await relay.flush();
  assert.equal(first.delivered, 1);
  assert.equal(first.failed, 1);
  assert.equal(relay.pending(10).length, 1);
  assert.equal(store.read().records[0].completedAt, null);

  clock.value += 999;
  const tooEarly = await relay.flush();
  assert.equal(tooEarly.attempted, 0);
  assert.equal(relay.pending(10).length, 1);

  clock.value += 1;
  const recovered = await relay.flush();
  assert.equal(recovered.delivered, 1);
  assert.equal(relay.pending(10).length, 0);
  assert.equal(store.read().records[0].completedAt, 2000);
});

test('operator canary tests both routes independently without operator/gameplay acknowledgement authority', async () => {
  const calls = [];
  const transports = createWindowsCriticalAlertTransports(secrets(), {
    fetch: async (url, options) => {
      calls.push({ url: String(url), body: JSON.parse(options.body) });
      return { ok: true, status: 204 };
    }
  });
  let now = 5000;
  const result = await canaryWindowsCriticalAlertRoutes(transports, { now: () => now++ });
  assert.equal(result.ok, true);
  assert.equal(result.routes.length, 2);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.includes('primary.example'));
  assert.ok(calls[1].url.includes('fallback.example'));
  assert.equal(calls.every((row) => row.body.alert.operatorCanary === true), true);
  assert.equal(result.operatorAckAuthority, false);
  assert.equal(result.gameplayActionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
  assert.equal(JSON.stringify(result).includes('secret-primary'), false);
});

test('Windows host config keeps host-only secrets non-enumerable and strips them from Chromium environment', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-step12-'));
  const configPath = path.join(dir, 'host.json');
  fs.writeFileSync(configPath, JSON.stringify({
    schemaVersion: 1,
    browserCommand: 'C:\\Browser\\browser.exe',
    browserArgs: [
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      '--user-data-dir=C:\\Users\\Tester\\AppData\\Local\\AioBot\\browser-profile',
      'https://adventure.land/'
    ],
    cdpEndpoint: 'http://127.0.0.1:9222',
    allowedOrigin: 'https://adventure.land',
    serviceStatePath: path.join(dir, 'service-state.json'),
    alertStatePath: path.join(dir, 'alerts.json'),
    apiTokenEnvironmentVariable: 'AIO_V3_HOST_API_TOKEN',
    criticalAlertingEnabled: true,
    alertSecretsEnvironmentVariable: 'AIO_V3_ALERT_SECRETS_JSON'
  }));
  const env = {
    SystemRoot: 'C:\\Windows',
    TEMP: 'C:\\Temp',
    PATH: 'C:\\Windows\\System32',
    AIO_V3_HOST_API_TOKEN: 'host-token-' + 'x'.repeat(40),
    AIO_V3_ALERT_SECRETS_JSON: JSON.stringify(secrets()),
    AIO_V3_DIAGNOSTICS_FTPS_PASSWORD: 'diagnostics-secret',
    UNRELATED_SECRET: 'must-not-reach-browser'
  };
  const config = loadWindowsHostConfig(configPath, env);
  assert.equal(config.criticalAlertingEnabled, true);
  assert.equal(config.alertTransports.length, 2);
  assert.equal(config.apiToken, env.AIO_V3_HOST_API_TOKEN);
  assert.equal(config.hostEnv.AIO_V3_ALERT_SECRETS_JSON, env.AIO_V3_ALERT_SECRETS_JSON);
  assert.equal(config.browserEnv.SystemRoot, 'C:\\Windows');
  assert.equal(config.browserEnv.AIO_V3_HOST_API_TOKEN, undefined);
  assert.equal(config.browserEnv.AIO_V3_ALERT_SECRETS_JSON, undefined);
  assert.equal(config.browserEnv.AIO_V3_DIAGNOSTICS_FTPS_PASSWORD, undefined);
  assert.equal(config.browserEnv.UNRELATED_SECRET, undefined);

  const serialized = JSON.stringify(config);
  assert.equal(serialized.includes('host-token-'), false);
  assert.equal(serialized.includes('secret-primary'), false);
  assert.equal(serialized.includes('fallback-secret'), false);
  assert.equal(serialized.includes('primary.example'), false);
  assert.equal(serialized.includes('fallback.example'), false);
});

test('production alerting fails closed if DPAPI-provided secret environment is absent', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-step12-missing-'));
  const configPath = path.join(dir, 'host.json');
  fs.writeFileSync(configPath, JSON.stringify({
    schemaVersion: 1,
    browserCommand: 'C:\\Browser\\browser.exe',
    browserArgs: [
      '--remote-debugging-port=9222',
      '--user-data-dir=C:\\AioBot\\browser-profile',
      'https://adventure.land/'
    ],
    cdpEndpoint: 'http://127.0.0.1:9222',
    serviceStatePath: path.join(dir, 'service-state.json'),
    alertStatePath: path.join(dir, 'alerts.json'),
    criticalAlertingEnabled: true
  }));
  assert.throws(() => loadWindowsHostConfig(configPath, {
    AIO_V3_HOST_API_TOKEN: 'x'.repeat(64)
  }), /WINDOWS_CRITICAL_ALERT_SECRETS_REQUIRED/);
});

test('ManagedProcessLauncher supports a non-inheriting child environment for Windows browser isolation', async () => {
  let spawnOptions = null;
  const child = {
    pid: 123,
    stdout: { on() {} },
    stderr: { on() {} },
    on() {},
    once() {},
    kill() {},
    exitCode: null,
    signalCode: null
  };
  const launcher = new ManagedProcessLauncher({
    command: 'browser.exe',
    args: [],
    env: { SystemRoot: 'C:\\Windows', SAFE: 'yes' },
    inheritEnv: false,
    spawn(_command, _args, options) {
      spawnOptions = options;
      return child;
    }
  });
  const result = await launcher.start();
  assert.equal(result.started, true);
  assert.deepEqual(spawnOptions.env, { SystemRoot: 'C:\\Windows', SAFE: 'yes' });
  assert.equal(launcher.status().inheritsProcessEnv, false);
});

test('browser environment sanitizer is an allowlist, not a secret-name denylist', () => {
  const result = sanitizeWindowsBrowserEnvironment({
    SystemRoot: 'C:\\Windows',
    USERPROFILE: 'C:\\Users\\Tester',
    PATH: 'C:\\Windows\\System32',
    AIO_V3_HOST_API_TOKEN: 'secret',
    AIO_V3_ALERT_SECRETS_JSON: 'secret-json',
    RANDOM_PROVIDER_KEY: 'secret-provider'
  });
  assert.deepEqual(result, {
    SystemRoot: 'C:\\Windows',
    USERPROFILE: 'C:\\Users\\Tester',
    PATH: 'C:\\Windows\\System32'
  });
});

test('Windows PowerShell alert path uses DPAPI CurrentUser and clears decrypted environment values', () => {
  const root = path.resolve(__dirname, '..', '..');
  const run = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'run.ps1'), 'utf8');
  const configure = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'configure-alerts.ps1'), 'utf8');
  const canary = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'test-alerts.ps1'), 'utf8');
  const install = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'install.ps1'), 'utf8');

  assert.match(configure, /DataProtectionScope\]::CurrentUser/);
  assert.match(configure, /WINDOWS_ALERT_ROUTES_NOT_INDEPENDENT/);
  assert.match(run, /AIO_V3_ALERT_SECRETS_JSON/);
  assert.match(run, /Remove-Item Env:AIO_V3_ALERT_SECRETS_JSON/);
  assert.match(canary, /Remove-Item Env:AIO_V3_ALERT_SECRETS_JSON/);
  assert.match(install, /criticalAlertingEnabled = \$false/);
  assert.doesNotMatch(install, /https:\/\/.*webhook/i);
});
