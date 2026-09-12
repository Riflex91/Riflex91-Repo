'use strict';

const { Alpha14Runtime } = require('./alpha14-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { EconomyTransactionEngine } = require('../economy/transaction-engine');

class Alpha15Runtime extends Alpha14Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = RELEASE_VERSION;
    this.transactionMaintenanceIntervalMs = Math.max(250, Math.min(30000, Number(options.transactionMaintenanceIntervalMs) || 1000));
    this.lastTransactionMaintenanceAt = -Infinity;
    this.transactionEngine = options.transactionEngine || new EconomyTransactionEngine({
      now: this.now,
      log: this.log,
      storage: options.transactionStorage || options.storage,
      capacity: options.transactionCapacity,
      leaseMs: options.transactionLeaseMs,
      failureWindowMs: options.transactionFailureWindowMs,
      failureThreshold: options.transactionFailureThreshold,
      circuitCooldownMs: options.transactionCircuitCooldownMs
    });
    this.transactionEngine.load();
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${RELEASE_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _economyStatus() {
    return {
      schemaVersion: 1,
      mode: 'transaction-foundation',
      actionAuthority: false,
      directGameplayActionAccess: false,
      liveEnabled: false,
      sellLiveEnabled: false,
      bankLiveEnabled: false,
      compoundLiveEnabled: false,
      upgradeLiveEnabled: false,
      exchangeLiveEnabled: false,
      transactions: this.transactionEngine.status()
    };
  }

  _evaluateGlobalSupervisor() {
    const baseStatus = super.status();
    const status = { ...baseStatus, economy: this._economyStatus() };
    const result = this.globalSupervisor.observe({ runtime: this, status, contentDrift: this.contentDrift.status() });
    this.lastSupervisorResult = result;
    return result;
  }

  tick() {
    super.tick();
    const now = this.now();
    if (now - this.lastTransactionMaintenanceAt >= this.transactionMaintenanceIntervalMs) {
      this.lastTransactionMaintenanceAt = now;
      this.transactionEngine.tick();
    }
  }

  stop() {
    if (this.transactionEngine) this.transactionEngine.save();
    return super.stop();
  }

  setEconomyLiveEnabled() {
    this.log.emit({ component: 'economy-transaction', event: 'LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'ALPHA15_SHADOW_ONLY' });
    return false;
  }

  planEconomyTransaction(request) {
    return this.transactionEngine.plan(request, { ledger: this.inventoryLedger, snapshot: this.lastSnapshot });
  }

  reconcileEconomyTransaction(id) {
    return this.transactionEngine.reconcile(id, { ledger: this.inventoryLedger, snapshot: this.lastSnapshot });
  }

  status() {
    const base = super.status();
    return { ...base, version: RELEASE_VERSION, economy: this._economyStatus() };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.economy = {
      status: this._economyStatus(),
      transactions: this.transactionEngine.list(200)
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha15Runtime };
