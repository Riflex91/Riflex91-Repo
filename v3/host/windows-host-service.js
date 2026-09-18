'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { ProductionHostHarness } = require('./production-host-harness');
const { JsonFileStateStore } = require('./json-file-state-store');
const { HOST_RESTART_ACK } = require('./host-watchdog-supervisor');
const { PersistentWindowsStartBudget, WindowsHostServiceSupervisor } = require('./windows-host-service-supervisor');

function bounded(value, max = 4096) {
  return String(value == null ? '' : value).slice(0, max);
}
function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function validateWindowsBrowserBootstrap(args, cdpEndpoint, allowedOrigin) {
  const values = Array.isArray(args) ? args.map((value) => String(value)) : [];
  const cdp = new URL(String(cdpEndpoint));
  const expectedPort = Number(cdp.port || 80);
  const portArgs = values.filter((value) => value.startsWith('--remote-debugging-port='));
  if (portArgs.length !== 1) throw new Error('WINDOWS_HOST_REMOTE_DEBUGGING_PORT_REQUIRED');
  const actualPort = Number(portArgs[0].slice('--remote-debugging-port='.length));
  if (!Number.isInteger(actualPort) || actualPort !== expectedPort) throw new Error('WINDOWS_HOST_REMOTE_DEBUGGING_PORT_MISMATCH');

  const addressArgs = values.filter((value) => value.startsWith('--remote-debugging-address='));
  if (addressArgs.length > 1) throw new Error('WINDOWS_HOST_REMOTE_DEBUGGING_ADDRESS_INVALID');
  if (addressArgs.length === 1) {
    const host = addressArgs[0].slice('--remote-debugging-address='.length).toLowerCase();
    if (!['127.0.0.1','localhost','::1','[::1]'].includes(host)) throw new Error('WINDOWS_HOST_REMOTE_DEBUGGING_ADDRESS_NOT_LOOPBACK');
  }

  const profileArgs = values.filter((value) => value.startsWith('--user-data-dir='));
  if (profileArgs.length !== 1) throw new Error('WINDOWS_HOST_DEDICATED_PROFILE_REQUIRED');
  const profilePath = profileArgs[0].slice('--user-data-dir='.length).trim();
  if (!profilePath || !(path.isAbsolute(profilePath) || path.win32.isAbsolute(profilePath))) throw new Error('WINDOWS_HOST_PROFILE_PATH_INVALID');

  const origin = new URL(String(allowedOrigin || 'https://adventure.land')).origin;
  const launchUrls = [];
  for (const value of values) {
    let parsed;
    try { parsed = new URL(value); } catch (_) { continue; }
    if (!['http:','https:'].includes(parsed.protocol)) continue;
    if (parsed.username || parsed.password) throw new Error('WINDOWS_HOST_BROWSER_URL_CREDENTIALS_FORBIDDEN');
    launchUrls.push(parsed);
  }
  if (!launchUrls.some((url) => url.origin === origin)) throw new Error('WINDOWS_HOST_ADVENTURE_LAND_START_URL_REQUIRED');

  const normalizedProfilePath = path.win32.isAbsolute(profilePath) ? path.win32.normalize(profilePath) : path.resolve(profilePath);
  return { profilePath: normalizedProfilePath, remoteDebuggingPort: actualPort, allowedOrigin: origin };
}

function configPathFromArgs(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--config');
  if (index < 0 || !argv[index + 1]) throw new Error('WINDOWS_HOST_CONFIG_PATH_REQUIRED');
  return path.resolve(String(argv[index + 1]));
}
function loadWindowsHostConfig(filePath, env = process.env) {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (error) { throw new Error('WINDOWS_HOST_CONFIG_INVALID:' + bounded(error && error.message || error, 180)); }
  if (!raw || raw.schemaVersion !== 1) throw new Error('WINDOWS_HOST_CONFIG_SCHEMA_INVALID');
  if (!raw.browserCommand || !Array.isArray(raw.browserArgs)) throw new Error('WINDOWS_HOST_BROWSER_CONFIG_REQUIRED');
  if (!raw.cdpEndpoint || !/^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?\/?$/i.test(String(raw.cdpEndpoint))) {
    throw new Error('WINDOWS_HOST_CDP_LOOPBACK_REQUIRED');
  }
  if (!raw.serviceStatePath || !raw.alertStatePath) throw new Error('WINDOWS_HOST_STATE_PATHS_REQUIRED');
  const allowedOrigin = String(raw.allowedOrigin || 'https://adventure.land');
  let originUrl;
  try { originUrl = new URL(allowedOrigin); } catch (_) { throw new Error('WINDOWS_HOST_ALLOWED_ORIGIN_INVALID'); }
  if (originUrl.protocol !== 'https:' || originUrl.username || originUrl.password) throw new Error('WINDOWS_HOST_ALLOWED_ORIGIN_INVALID');
  const browserBootstrap = validateWindowsBrowserBootstrap(raw.browserArgs, raw.cdpEndpoint, originUrl.origin);
  const tokenEnv = String(raw.apiTokenEnvironmentVariable || 'AIO_V3_HOST_API_TOKEN');
  if (!/^[A-Z][A-Z0-9_]{2,80}$/.test(tokenEnv)) throw new Error('WINDOWS_HOST_API_TOKEN_ENV_INVALID');
  const apiToken = String(env[tokenEnv] || '');
  if (apiToken.length < 32) throw new Error('WINDOWS_HOST_API_TOKEN_REQUIRED');

  return {
    schemaVersion: 1,
    browserCommand: bounded(raw.browserCommand),
    browserArgs: raw.browserArgs.slice(0, 128).map((value) => bounded(value)),
    browserCwd: raw.browserCwd ? bounded(raw.browserCwd) : undefined,
    cdpEndpoint: String(raw.cdpEndpoint),
    allowedOrigin: originUrl.origin,
    browserProfilePath: browserBootstrap.profilePath,
    browserSessionStartupWaitMs: Math.max(0, Math.min(10 * 60 * 1000, finite(raw.browserSessionStartupWaitMs, 5 * 60 * 1000))),
    browserSessionStartupPollMs: Math.max(100, Math.min(15000, finite(raw.browserSessionStartupPollMs, 2000))),
    serviceStatePath: path.resolve(String(raw.serviceStatePath)),
    alertStatePath: path.resolve(String(raw.alertStatePath)),
    apiHost: '127.0.0.1',
    apiPort: Math.max(0, Math.min(65535, Math.floor(finite(raw.apiPort, 8791)))),
    apiToken,
    tickIntervalMs: Math.max(1000, Math.min(60000, finite(raw.tickIntervalMs, 5000))),
    stableAfterMs: Math.max(10000, finite(raw.stableAfterMs, 120000)),
    startWindowMs: Math.max(60000, finite(raw.startWindowMs, 10 * 60 * 1000)),
    maxStartsPerWindow: Math.max(1, Math.min(20, Math.floor(finite(raw.maxStartsPerWindow, 4)))),
    startCircuitCooldownMs: Math.max(60000, finite(raw.startCircuitCooldownMs, 15 * 60 * 1000)),
    browserRestartEnabled: raw.browserRestartEnabled === true,
    env
  };
}

function createWindowsHostService(config, options = {}) {
  const stateStore = options.stateStore || new JsonFileStateStore({ filePath: config.serviceStatePath, maxBytes: 256 * 1024 });
  const harness = options.harness || new ProductionHostHarness({
    command: config.browserCommand,
    args: config.browserArgs,
    cwd: config.browserCwd,
    env: config.env,
    browserCdpEndpoint: config.cdpEndpoint,
    browserAllowedOrigin: config.allowedOrigin,
    browserCdpStartupWaitMs: config.browserSessionStartupWaitMs,
    browserCdpStartupPollMs: config.browserSessionStartupPollMs,
    alertStatePath: config.alertStatePath,
    apiHost: config.apiHost,
    apiPort: config.apiPort,
    apiToken: config.apiToken,
    tickIntervalMs: config.tickIntervalMs
  });
  if (config.browserRestartEnabled === true && typeof harness.configureRestart === 'function') {
    harness.configureRestart({ enabled: true, ack: HOST_RESTART_ACK });
  }
  const budget = options.budget || new PersistentWindowsStartBudget({
    store: stateStore,
    now: options.now,
    windowMs: config.startWindowMs,
    maxStartsPerWindow: config.maxStartsPerWindow,
    circuitCooldownMs: config.startCircuitCooldownMs
  });
  return new WindowsHostServiceSupervisor({
    harness,
    budget,
    now: options.now,
    stableAfterMs: config.stableAfterMs,
    setTimeout: options.setTimeout,
    clearTimeout: options.clearTimeout
  });
}

function installGracefulShutdown(service, proc = process) {
  let stopping = false;
  const handlers = new Map();
  const stop = (signal) => {
    if (stopping) return;
    stopping = true;
    Promise.resolve(service.stop('WINDOWS_' + signal))
      .then((result) => {
        proc.exitCode = result && result.stopped === true ? 0 : 1;
      })
      .catch(() => { proc.exitCode = 1; });
  };
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const handler = () => stop(signal);
    handlers.set(signal, handler);
    proc.once(signal, handler);
  }
  return () => {
    for (const [signal, handler] of handlers) proc.removeListener(signal, handler);
  };
}

async function main(argv = process.argv.slice(2), env = process.env) {
  const filePath = configPathFromArgs(argv);
  const config = loadWindowsHostConfig(filePath, env);
  const service = createWindowsHostService(config);
  installGracefulShutdown(service);
  const result = await service.start();
  if (!result.started) {
    const reason = bounded(result.reason || 'WINDOWS_HOST_START_FAILED', 180);
    process.stderr.write(reason + '\n');
    process.exitCode = 1;
  }
  return result;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(bounded(error && error.message || error || 'WINDOWS_HOST_FATAL', 220) + '\n');
    process.exitCode = 1;
  });
}

module.exports = {
  configPathFromArgs,
  validateWindowsBrowserBootstrap,
  loadWindowsHostConfig,
  createWindowsHostService,
  installGracefulShutdown,
  main
};
