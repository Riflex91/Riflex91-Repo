'use strict';

const { ManagedProcessLauncher } = require('./managed-process-launcher');
const { HeadlessHostController } = require('./headless-host-controller');
const { HostApiServer } = require('./host-api-server');
const { JsonFileStateStore } = require('./json-file-state-store');
const { BrowserBotClient } = require('./browser-bot-client');
const { SupabaseDebugTelemetrySink, DEBUG_TELEMETRY_SCHEMA_VERSION } = require('./supabase-debug-telemetry');

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}

class ProductionHostHarness {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.tickIntervalMs = Math.max(1000, Math.min(60000, finite(options.tickIntervalMs, 5000)));
    this.launcher = options.launcher || new ManagedProcessLauncher({
      now: this.now,
      spawn: options.spawn,
      command: options.command,
      args: options.args,
      cwd: options.cwd,
      env: options.env,
      stopGraceMs: options.stopGraceMs,
      outputCapacity: options.outputCapacity
    });
    const browserContext = options.browserPage || options.browserFrame || options.browserContext || null;
    this.botClient = options.botClient || (browserContext ? new BrowserBotClient({
      page: browserContext,
      now: this.now,
      timeoutMs: options.browserBridgeTimeoutMs,
      maxResultBytes: options.browserBridgeMaxResultBytes,
      allowedOrigins: options.browserAllowedOrigins,
      allowInsecureLoopbackForTests: options.browserAllowInsecureLoopbackForTests === true
    }) : null);
    this.alertStore = options.alertStore || (options.alertStatePath ? new JsonFileStateStore({
      filePath: options.alertStatePath,
      maxBytes: options.alertStateMaxBytes
    }) : null);
    this.controller = options.controller || new HeadlessHostController({
      now: this.now,
      botClient: this.botClient,
      alertStore: this.alertStore,
      alertTransports: options.alertTransports,
      alertSpoolCapacity: options.alertSpoolCapacity,
      alertIngestLimit: options.alertIngestLimit,
      alertMaxAttempts: options.alertMaxAttempts,
      alertBaseBackoffMs: options.alertBaseBackoffMs,
      alertMaxBackoffMs: options.alertMaxBackoffMs,
      restartProcess: (context) => this.launcher.restart(context),
      startupGraceMs: options.startupGraceMs,
      restartDelayMs: options.restartDelayMs,
      restartCooldownMs: options.restartCooldownMs,
      restartWindowMs: options.restartWindowMs,
      maxRestartsPerWindow: options.maxRestartsPerWindow,
      maxClockSkewMs: options.maxClockSkewMs
    });
    this.api = options.api || new HostApiServer({
      controller: this.controller,
      launcher: this.launcher,
      host: options.apiHost || '127.0.0.1',
      port: options.apiPort,
      token: options.apiToken,
      serverFactory: options.serverFactory
    });

    const hostEnv = options.hostEnv || process.env || {};
    this.telemetryIntervalMs = Math.max(5000, Math.min(10 * 60 * 1000, finite(
      options.telemetryIntervalMs,
      finite(hostEnv.AIO_V3_DEBUG_TELEMETRY_INTERVAL_MS, 15000)
    )));
    this.telemetrySink = options.telemetrySink || SupabaseDebugTelemetrySink.fromEnv({
      env: hostEnv,
      now: this.now,
      fetch: options.telemetryFetch,
      timeoutMs: options.telemetryTimeoutMs,
      maxPayloadBytes: options.telemetryMaxPayloadBytes,
      source: options.telemetrySource
    });
    this.telemetryInFlight = null;
    this.lastTelemetryAttemptAt = null;
    this.lastTelemetryResult = null;
    this.lastTelemetryError = null;

    this.timer = null;
    this.tickInFlight = false;
    this.startedAt = null;
    this.lastTickResult = null;
    this.lastTickError = null;
    this.stats = {
      starts: 0,
      stops: 0,
      ticks: 0,
      skippedOverlaps: 0,
      tickFailures: 0,
      telemetryAttempts: 0,
      telemetryPublishes: 0,
      telemetryFailures: 0,
      telemetrySkips: 0
    };
  }

  configureRestart(config = {}) {
    return this.controller.configureRestart(config);
  }

  _telemetryEnabled() {
    return !!(this.telemetrySink && typeof this.telemetrySink.enabled === 'function' && this.telemetrySink.enabled());
  }

  _debugEnvelope(diagnostics) {
    return {
      schemaVersion: DEBUG_TELEMETRY_SCHEMA_VERSION,
      type: 'AIO_V3_DEBUG_TELEMETRY',
      collectedAt: this.now(),
      mode: 'observational-read-only',
      actionAuthority: false,
      gameplayActionAuthority: false,
      bot: diagnostics,
      host: {
        running: !!this.timer,
        startedAt: this.startedAt,
        tickIntervalMs: this.tickIntervalMs,
        tickInFlight: this.tickInFlight,
        launcher: this.launcher && typeof this.launcher.status === 'function' ? this.launcher.status() : null,
        controller: this.controller && typeof this.controller.status === 'function' ? this.controller.status() : null,
        stats: {
          starts: this.stats.starts,
          stops: this.stats.stops,
          ticks: this.stats.ticks,
          skippedOverlaps: this.stats.skippedOverlaps,
          tickFailures: this.stats.tickFailures
        }
      }
    };
  }

  _scheduleDebugTelemetry() {
    const at = this.now();
    if (!this._telemetryEnabled()) {
      this.stats.telemetrySkips += 1;
      return false;
    }
    if (!this.botClient || typeof this.botClient.debugDiagnostics !== 'function') {
      this.stats.telemetrySkips += 1;
      return false;
    }
    if (this.telemetryInFlight) {
      this.stats.telemetrySkips += 1;
      return false;
    }
    if (this.lastTelemetryAttemptAt != null && at - this.lastTelemetryAttemptAt < this.telemetryIntervalMs) {
      this.stats.telemetrySkips += 1;
      return false;
    }

    this.lastTelemetryAttemptAt = at;
    this.stats.telemetryAttempts += 1;
    const work = Promise.resolve()
      .then(() => this.botClient.debugDiagnostics())
      .then((diagnostics) => this.telemetrySink.publish(this._debugEnvelope(diagnostics)))
      .then((result) => {
        this.lastTelemetryResult = clone(result);
        this.lastTelemetryError = null;
        if (result && result.published === true) this.stats.telemetryPublishes += 1;
        else this.stats.telemetryFailures += 1;
        return result;
      })
      .catch((error) => {
        this.stats.telemetryFailures += 1;
        this.lastTelemetryError = { at: this.now(), code: bounded(error && error.message || error || 'DEBUG_TELEMETRY_FAILED', 128) };
        return { published: false, reason: this.lastTelemetryError.code };
      })
      .finally(() => {
        if (this.telemetryInFlight === work) this.telemetryInFlight = null;
      });
    this.telemetryInFlight = work;
    return true;
  }

  async tick() {
    if (this.tickInFlight) {
      this.stats.skippedOverlaps += 1;
      return { skipped: true, reason: 'TICK_ALREADY_RUNNING' };
    }
    this.tickInFlight = true;
    this.stats.ticks += 1;
    try {
      const result = await this.controller.tick();
      this.lastTickResult = clone(result);
      this.lastTickError = null;
      this._scheduleDebugTelemetry();
      return result;
    } catch (error) {
      this.stats.tickFailures += 1;
      this.lastTickError = { at: this.now(), message: String(error && error.message || error).slice(0, 256) };
      this._scheduleDebugTelemetry();
      return { error: clone(this.lastTickError) };
    } finally {
      this.tickInFlight = false;
    }
  }

  async start(options = {}) {
    if (this.timer) return { started: false, reason: 'HARNESS_ALREADY_RUNNING', status: this.status() };
    const processResult = options.startProcess === false
      ? { started: false, skipped: true, reason: 'PROCESS_START_SKIPPED' }
      : await this.launcher.start({ reason: 'HOST_HARNESS_START' });
    if (options.startProcess !== false && !processResult.started) {
      return { started: false, reason: 'PROCESS_START_FAILED', process: processResult, status: this.status() };
    }

    const apiResult = await this.api.start();
    if (!apiResult.started && apiResult.reason !== 'API_ALREADY_RUNNING') {
      if (options.startProcess !== false) await this.launcher.stop('API_START_FAILED');
      return { started: false, reason: 'API_START_FAILED', api: apiResult, process: processResult, status: this.status() };
    }

    this.startedAt = this.now();
    this.stats.starts += 1;
    this.timer = setInterval(() => { this.tick().catch(() => {}); }, this.tickIntervalMs);
    if (this.timer && typeof this.timer.unref === 'function') this.timer.unref();
    const firstTick = options.skipInitialTick === true ? null : await this.tick();
    return { started: true, process: processResult, api: apiResult, firstTick, status: this.status() };
  }

  async stop(reason = 'HOST_HARNESS_STOP') {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const api = await this.api.stop();
    const processResult = await this.launcher.stop(reason);
    this.stats.stops += 1;
    return { stopped: true, api, process: processResult, status: this.status() };
  }

  status() {
    const botClientStatus = this.botClient && typeof this.botClient.status === 'function' ? this.botClient.status() : null;
    return {
      mode: 'production-host-harness-foundation',
      running: !!this.timer,
      startedAt: this.startedAt,
      tickIntervalMs: this.tickIntervalMs,
      tickInFlight: this.tickInFlight,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      dashboardDecisionAuthority: false,
      browserProtocolOwnedByInjectedBotClient: !!this.botClient,
      narrowBrowserBridge: !!(botClientStatus && botClientStatus.mode === 'narrow-browser-bot-client'),
      botClient: botClientStatus,
      launcher: this.launcher.status(),
      controller: this.controller.status(),
      api: this.api.status(),
      alertStore: this.alertStore && typeof this.alertStore.status === 'function' ? this.alertStore.status() : null,
      debugTelemetry: {
        enabled: this._telemetryEnabled(),
        intervalMs: this.telemetryIntervalMs,
        inFlight: !!this.telemetryInFlight,
        lastAttemptAt: this.lastTelemetryAttemptAt,
        lastResult: clone(this.lastTelemetryResult),
        lastError: clone(this.lastTelemetryError),
        sink: this.telemetrySink && typeof this.telemetrySink.status === 'function' ? this.telemetrySink.status() : null,
        actionAuthority: false
      },
      lastTickError: clone(this.lastTickError),
      stats: { ...this.stats }
    };
  }
}

module.exports = { ProductionHostHarness };
