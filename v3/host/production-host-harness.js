'use strict';

const { ManagedProcessLauncher } = require('./managed-process-launcher');
const { HeadlessHostController } = require('./headless-host-controller');
const { HostApiServer } = require('./host-api-server');
const { JsonFileStateStore } = require('./json-file-state-store');
const { BrowserBotClient } = require('./browser-bot-client');
const { CdpAdventureLandSessionDriver } = require('./cdp-adventure-land-session');
const { DebugTelemetryExporter } = require('./debug-telemetry-exporter');
const { FtpsDiagnosticsUploader } = require('./ftps-diagnostics-uploader');
const { ProblemDiagnosticsArchive } = require('./problem-diagnostics-archive');

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function bool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
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
    this.sessionDriver = options.sessionDriver || (options.browserCdpEndpoint || options.cdpEndpoint ? new CdpAdventureLandSessionDriver({
      now: this.now,
      fetch: options.browserCdpFetch,
      webSocketFactory: options.browserCdpWebSocketFactory,
      endpoint: options.browserCdpEndpoint || options.cdpEndpoint,
      allowedOrigin: options.browserAllowedOrigin,
      allowInsecureLoopbackForTests: options.browserAllowInsecureLoopbackForTests === true,
      connectTimeoutMs: options.browserCdpConnectTimeoutMs,
      commandTimeoutMs: options.browserCdpCommandTimeoutMs,
      discoveryTimeoutMs: options.browserCdpDiscoveryTimeoutMs,
      contextSettleMs: options.browserCdpContextSettleMs,
      connectAttempts: options.browserCdpConnectAttempts,
      reconnectBaseMs: options.browserCdpReconnectBaseMs,
      reconnectMaxMs: options.browserCdpReconnectMaxMs,
      sleep: options.browserCdpSleep
    }) : null);
    const browserContext = options.browserPage || options.browserFrame || options.browserContext
      || (this.sessionDriver && typeof this.sessionDriver.executionContext === 'function' ? this.sessionDriver.executionContext() : null);
    this.botClient = options.botClient || (browserContext ? new BrowserBotClient({
      page: browserContext,
      now: this.now,
      timeoutMs: options.browserBridgeTimeoutMs,
      maxResultBytes: options.browserBridgeMaxResultBytes,
      allowedOrigins: options.browserAllowedOrigins || (this.sessionDriver ? [this.sessionDriver.allowedOrigin] : undefined),
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
      restartProcess: async (context) => {
        const result = await this.launcher.restart(context);
        if (result && result.ok && this.sessionDriver && typeof this.sessionDriver.invalidate === 'function') {
          this.sessionDriver.invalidate('PROCESS_RESTART');
        }
        return result;
      },
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

    const env = options.env || (typeof process !== 'undefined' && process.env) || {};
    this.telemetryExporter = options.telemetryExporter || new DebugTelemetryExporter({
      now: this.now,
      fetch: options.telemetryFetch,
      endpoint: options.telemetryIngestUrl || env.AIO_V3_DEBUG_TELEMETRY_URL,
      token: options.telemetryIngestToken || env.AIO_V3_DEBUG_TELEMETRY_TOKEN,
      botId: options.telemetryBotId || env.AIO_V3_DEBUG_TELEMETRY_BOT_ID,
      eventLimit: options.telemetryEventLimit,
      timeoutMs: options.telemetryTimeoutMs,
      minIntervalMs: options.telemetryMinIntervalMs,
      maxBackoffMs: options.telemetryMaxBackoffMs,
      allowInsecureLoopbackForTests: options.telemetryAllowInsecureLoopbackForTests === true
    });

    this.diagnosticsUploader = options.diagnosticsUploader || new FtpsDiagnosticsUploader({
      now: this.now,
      host: options.diagnosticsFtpsHost || env.AIO_V3_DIAGNOSTICS_FTPS_HOST,
      port: options.diagnosticsFtpsPort || env.AIO_V3_DIAGNOSTICS_FTPS_PORT,
      user: options.diagnosticsFtpsUser || env.AIO_V3_DIAGNOSTICS_FTPS_USER,
      password: options.diagnosticsFtpsPassword || env.AIO_V3_DIAGNOSTICS_FTPS_PASSWORD,
      root: options.diagnosticsFtpsRoot || env.AIO_V3_DIAGNOSTICS_FTPS_ROOT,
      botId: options.diagnosticsBotId || env.AIO_V3_DIAGNOSTICS_BOT_ID || options.telemetryBotId || env.AIO_V3_DEBUG_TELEMETRY_BOT_ID,
      secure: options.diagnosticsFtpsSecure == null ? env.AIO_V3_DIAGNOSTICS_FTPS_SECURE : options.diagnosticsFtpsSecure,
      rejectUnauthorized: options.diagnosticsFtpsRejectUnauthorized == null ? env.AIO_V3_DIAGNOSTICS_FTPS_REJECT_UNAUTHORIZED : options.diagnosticsFtpsRejectUnauthorized,
      timeoutMs: options.diagnosticsFtpsTimeoutMs || env.AIO_V3_DIAGNOSTICS_FTPS_TIMEOUT_MS,
      maxFilesPerFlush: options.diagnosticsFtpsMaxFilesPerFlush || env.AIO_V3_DIAGNOSTICS_FTPS_MAX_FILES_PER_FLUSH,
      clientFactory: options.diagnosticsFtpsClientFactory,
      allowInsecureForTests: options.diagnosticsFtpsAllowInsecureForTests === true
    });
    const diagnosticsEnabled = options.diagnosticsEnabled == null
      ? bool(env.AIO_V3_DIAGNOSTICS_ENABLED, this.diagnosticsUploader.enabled())
      : bool(options.diagnosticsEnabled, false);
    this.diagnosticsArchive = options.diagnosticsArchive || new ProblemDiagnosticsArchive({
      now: this.now,
      enabled: diagnosticsEnabled,
      botId: options.diagnosticsBotId || env.AIO_V3_DIAGNOSTICS_BOT_ID || options.telemetryBotId || env.AIO_V3_DEBUG_TELEMETRY_BOT_ID,
      spoolDir: options.diagnosticsSpoolDir || env.AIO_V3_DIAGNOSTICS_SPOOL_DIR,
      eventLimit: options.diagnosticsEventLimit || env.AIO_V3_DIAGNOSTICS_EVENT_LIMIT,
      dedupeMs: options.diagnosticsDedupeMs || env.AIO_V3_DIAGNOSTICS_DEDUPE_MS,
      maxPendingFiles: options.diagnosticsMaxPendingFiles || env.AIO_V3_DIAGNOSTICS_MAX_PENDING_FILES,
      maxPendingBytes: options.diagnosticsMaxPendingBytes || env.AIO_V3_DIAGNOSTICS_MAX_PENDING_BYTES,
      uploader: this.diagnosticsUploader
    });

    this.timer = null;
    this.tickInFlight = false;
    this.startedAt = null;
    this.lastTickResult = null;
    this.lastTickError = null;
    this.lastTelemetryResult = null;
    this.lastDiagnosticsResult = null;
    this.stats = { starts: 0, stops: 0, ticks: 0, skippedOverlaps: 0, tickFailures: 0, telemetryTicks: 0, diagnosticsTicks: 0 };
  }

  configureRestart(config = {}) {
    return this.controller.configureRestart(config);
  }

  async _tickTelemetry() {
    if (!this.telemetryExporter || typeof this.telemetryExporter.tick !== 'function') return null;
    this.stats.telemetryTicks += 1;
    const launcher = this.launcher && typeof this.launcher.status === 'function' ? this.launcher.status() : {};
    const result = await this.telemetryExporter.tick(this.botClient, {
      processRunning: launcher && launcher.running === true,
      restartCount: launcher && launcher.stats && launcher.stats.restarts || 0,
      harnessStartedAt: this.startedAt
    });
    this.lastTelemetryResult = clone(result);
    return result;
  }

  async _tickDiagnostics(tickResult = null, harnessError = null) {
    if (!this.diagnosticsArchive || typeof this.diagnosticsArchive.tick !== 'function') return null;
    this.stats.diagnosticsTicks += 1;
    const launcher = this.launcher && typeof this.launcher.status === 'function' ? this.launcher.status() : {};
    const controllerStatus = this.controller && typeof this.controller.status === 'function' ? this.controller.status() : {};
    const watchdogState = tickResult && tickResult.watchdog && tickResult.watchdog.state
      || tickResult && tickResult.status && tickResult.status.watchdog && tickResult.status.watchdog.state
      || controllerStatus && controllerStatus.watchdog && controllerStatus.watchdog.state
      || null;
    const result = await this.diagnosticsArchive.tick(this.botClient, {
      processRunning: launcher && launcher.running === true,
      restartCount: launcher && launcher.stats && launcher.stats.restarts || 0,
      harnessStartedAt: this.startedAt,
      watchdogState,
      harnessError
    });
    this.lastDiagnosticsResult = clone(result);
    return result;
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
      try { await this._tickTelemetry(); } catch (error) {
        this.lastTelemetryResult = { sent: false, reason: 'DEBUG_TELEMETRY_ISOLATED_FAILURE', error: String(error && error.message || error).slice(0, 256) };
      }
      try { await this._tickDiagnostics(result); } catch (error) {
        this.lastDiagnosticsResult = { captured: false, reason: 'PROBLEM_DIAGNOSTICS_ISOLATED_FAILURE', error: String(error && error.message || error).slice(0, 256) };
      }
      return result;
    } catch (error) {
      this.stats.tickFailures += 1;
      const message = String(error && error.message || error).slice(0, 256);
      this.lastTickError = { at: this.now(), message };
      try { await this._tickDiagnostics(null, message); } catch (diagnosticsError) {
        this.lastDiagnosticsResult = { captured: false, reason: 'PROBLEM_DIAGNOSTICS_ISOLATED_FAILURE', error: String(diagnosticsError && diagnosticsError.message || diagnosticsError).slice(0, 256) };
      }
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

    let sessionResult = null;
    if (this.sessionDriver && options.startBrowserSession !== false) {
      try {
        sessionResult = await this.sessionDriver.start();
      } catch (error) {
        if (options.startProcess !== false) await this.launcher.stop('BROWSER_SESSION_START_FAILED');
        return {
          started: false,
          reason: 'BROWSER_SESSION_START_FAILED',
          error: String(error && error.message || error).slice(0, 256),
          process: processResult,
          browserSession: this.sessionDriver.status(),
          status: this.status()
        };
      }
    }

    const apiResult = await this.api.start();
    if (!apiResult.started && apiResult.reason !== 'API_ALREADY_RUNNING') {
      if (this.sessionDriver && typeof this.sessionDriver.stop === 'function') {
        try { await this.sessionDriver.stop('API_START_FAILED'); } catch (_) {}
      }
      if (options.startProcess !== false) await this.launcher.stop('API_START_FAILED');
      return { started: false, reason: 'API_START_FAILED', api: apiResult, process: processResult, browserSession: sessionResult, status: this.status() };
    }

    this.startedAt = this.now();
    this.stats.starts += 1;
    this.timer = setInterval(() => { this.tick().catch(() => {}); }, this.tickIntervalMs);
    if (this.timer && typeof this.timer.unref === 'function') this.timer.unref();
    const firstTick = options.skipInitialTick === true ? null : await this.tick();
    return { started: true, process: processResult, browserSession: sessionResult, api: apiResult, firstTick, status: this.status() };
  }

  async stop(reason = 'HOST_HARNESS_STOP') {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.diagnosticsArchive && typeof this.diagnosticsArchive.flush === 'function') {
      try { await this.diagnosticsArchive.flush(); } catch (_) {}
    }
    const api = await this.api.stop();
    let browserSession = null;
    if (this.sessionDriver && typeof this.sessionDriver.stop === 'function') {
      try { browserSession = await this.sessionDriver.stop(reason); }
      catch (error) { browserSession = { stopped: false, error: String(error && error.message || error).slice(0, 256) }; }
    }
    const processResult = await this.launcher.stop(reason);
    this.stats.stops += 1;
    return { stopped: true, api, browserSession, process: processResult, status: this.status() };
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
      browserSessionManaged: !!this.sessionDriver,
      browserSession: this.sessionDriver && typeof this.sessionDriver.status === 'function' ? this.sessionDriver.status() : null,
      narrowBrowserBridge: !!(botClientStatus && botClientStatus.mode === 'narrow-browser-bot-client'),
      botClient: botClientStatus,
      launcher: this.launcher.status(),
      controller: this.controller.status(),
      api: this.api.status(),
      alertStore: this.alertStore && typeof this.alertStore.status === 'function' ? this.alertStore.status() : null,
      debugTelemetry: this.telemetryExporter && typeof this.telemetryExporter.status === 'function' ? this.telemetryExporter.status() : null,
      problemDiagnostics: this.diagnosticsArchive && typeof this.diagnosticsArchive.status === 'function' ? this.diagnosticsArchive.status() : null,
      lastTelemetryResult: clone(this.lastTelemetryResult),
      lastDiagnosticsResult: clone(this.lastDiagnosticsResult),
      lastTickError: clone(this.lastTickError),
      stats: { ...this.stats }
    };
  }
}

module.exports = { ProductionHostHarness };
