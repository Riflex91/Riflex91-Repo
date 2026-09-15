'use strict';

const { HostWatchdogSupervisor } = require('./host-watchdog-supervisor');
const { AlertRelay } = require('./alert-relay');
const { RestartReconciliationObserver } = require('./restart-reconciliation-observer');

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class HeadlessHostController {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.botClient = options.botClient || null;
    this.watchdog = options.watchdog || new HostWatchdogSupervisor({
      now: this.now,
      restartProcess: options.restartProcess,
      startupGraceMs: options.startupGraceMs,
      restartDelayMs: options.restartDelayMs,
      restartCooldownMs: options.restartCooldownMs,
      restartWindowMs: options.restartWindowMs,
      maxRestartsPerWindow: options.maxRestartsPerWindow,
      maxClockSkewMs: options.maxClockSkewMs
    });
    this.alertRelay = options.alertRelay || new AlertRelay({
      now: this.now,
      botClient: this.botClient,
      store: options.alertStore,
      transports: options.alertTransports,
      capacity: options.alertSpoolCapacity,
      ingestLimit: options.alertIngestLimit,
      maxAttempts: options.alertMaxAttempts,
      baseBackoffMs: options.alertBaseBackoffMs,
      maxBackoffMs: options.alertMaxBackoffMs
    });
    this.reconciliation = options.reconciliation || new RestartReconciliationObserver({ now: this.now, botClient: this.botClient });
    this.lastTickAt = null;
    this.lastHeartbeatError = null;
    this.lastAlertError = null;
    this.lastRestartRunId = null;
    this.stats = { ticks: 0, heartbeatFailures: 0, alertFailures: 0, reconciliationPolls: 0 };
  }

  configureRestart(config = {}) {
    return this.watchdog.configure(config);
  }

  async _pollHeartbeat() {
    if (!this.botClient || typeof this.botClient.hostHeartbeat !== 'function') {
      this.lastHeartbeatError = { at: this.now(), code: 'BOT_HEARTBEAT_UNAVAILABLE' };
      this.stats.heartbeatFailures += 1;
      return { accepted: false, reason: 'BOT_HEARTBEAT_UNAVAILABLE' };
    }
    try {
      const beacon = await this.botClient.hostHeartbeat();
      const result = this.watchdog.acceptBeacon(beacon);
      if (!result.accepted) {
        this.lastHeartbeatError = { at: this.now(), code: result.reason };
        this.stats.heartbeatFailures += 1;
      } else {
        this.lastHeartbeatError = null;
        if (this.reconciliation.status().state === 'WAITING_FOR_FRESH_RUN') {
          const currentRunId = this.watchdog.status().lastRunId;
          const fresh = this.reconciliation.observeFreshRun(currentRunId);
          if (!fresh.accepted) this.lastHeartbeatError = { at: this.now(), code: fresh.reason };
        }
      }
      return result;
    } catch (error) {
      this.lastHeartbeatError = { at: this.now(), code: 'BOT_HEARTBEAT_FAILED', message: String(error && error.message || error).slice(0, 256) };
      this.stats.heartbeatFailures += 1;
      return { accepted: false, reason: 'BOT_HEARTBEAT_FAILED' };
    }
  }

  async _serviceReconciliation() {
    const state = this.reconciliation.status().state;
    if (state !== 'WAITING_FOR_RECONCILIATION_EVIDENCE' && state !== 'BLOCKED') return null;
    this.stats.reconciliationPolls += 1;
    return this.reconciliation.observe();
  }

  async _serviceAlerts() {
    try {
      const ingest = await this.alertRelay.ingest();
      const flush = await this.alertRelay.flush();
      this.lastAlertError = null;
      return { ingest, flush };
    } catch (error) {
      this.lastAlertError = { at: this.now(), code: 'ALERT_RELAY_FAILED', message: String(error && error.message || error).slice(0, 256) };
      this.stats.alertFailures += 1;
      return { ingest: null, flush: null, error: clone(this.lastAlertError) };
    }
  }

  async tick() {
    this.stats.ticks += 1;
    this.lastTickAt = this.now();
    const heartbeat = await this._pollHeartbeat();
    const beforeWatchdog = this.watchdog.status();

    let watchdog;
    try {
      watchdog = await this.watchdog.tick();
    } catch (error) {
      watchdog = this.watchdog.status();
      watchdog.tickError = String(error && error.message || error).slice(0, 256);
    }

    if (watchdog.state === 'RESTARTING' && beforeWatchdog.state !== 'RESTARTING') {
      this.lastRestartRunId = beforeWatchdog.lastRunId || this.lastRestartRunId || null;
      this.reconciliation.begin(this.lastRestartRunId);
    }

    const reconciliation = await this._serviceReconciliation();
    const alerts = await this._serviceAlerts();
    return { heartbeat, watchdog, reconciliation, alerts, status: this.status() };
  }

  status() {
    return {
      mode: 'external-headless-host-controller',
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      dashboardDecisionAuthority: false,
      botSafetyLogicDuplicated: false,
      lastTickAt: this.lastTickAt,
      lastHeartbeatError: clone(this.lastHeartbeatError),
      lastAlertError: clone(this.lastAlertError),
      watchdog: this.watchdog.status(),
      reconciliation: this.reconciliation.status(),
      alertRelay: this.alertRelay.status(),
      stats: { ...this.stats }
    };
  }
}

module.exports = { HeadlessHostController };
