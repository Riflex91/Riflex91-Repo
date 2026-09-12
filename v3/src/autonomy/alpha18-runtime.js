'use strict';

const { Alpha17Runtime } = require('./alpha17-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { BankCapacityManager } = require('../economy/bank-capacity-manager');
const { BankExpansionTransactionEngine } = require('../economy/bank-expansion-transactions');
const { ControlledBankExpansionExecutor, CONTROLLED_BANK_EXPANSION_ACK } = require('../economy/controlled-bank-expansion-executor');

const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class Alpha18Runtime extends Alpha17Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = RELEASE_VERSION;
    this.bankCapacityObservationIntervalMs = Math.max(1000, Math.min(60000, Number(options.bankCapacityObservationIntervalMs) || 3000));
    this.lastBankCapacityObservationAt = -Infinity;

    this.bankCapacity = options.bankCapacity || new BankCapacityManager({
      now: this.now,
      log: this.log,
      workspaceSlots: options.bankWorkspaceSlots == null ? options.inventoryWorkspaceSlots : options.bankWorkspaceSlots,
      protectedGoldReserve: options.bankProtectedGoldReserve,
      protectedShellReserve: options.bankProtectedShellReserve,
      allowShellSpend: options.bankAllowShellSpend === true,
      pressureObservationsRequired: options.bankPressureObservationsRequired
    });
    this.bankExpansionTransactions = options.bankExpansionTransactions || new BankExpansionTransactionEngine({
      now: this.now,
      log: this.log,
      storage: options.bankExpansionStorage || options.storage,
      leaseMs: options.bankExpansionLeaseMs,
      failureWindowMs: options.bankExpansionFailureWindowMs,
      failureThreshold: options.bankExpansionFailureThreshold,
      circuitCooldownMs: options.bankExpansionCircuitCooldownMs,
      preflightRetryBudget: options.bankExpansionPreflightRetryBudget,
      retryBackoffMs: options.bankExpansionRetryBackoffMs
    });
    this.bankExpansionTransactions.load();
    this.controlledBankExpansion = options.controlledBankExpansion || new ControlledBankExpansionExecutor({
      root: this.root,
      engine: this.bankExpansionTransactions,
      manager: this.bankCapacity,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      timeoutMs: options.controlledBankExpansionTimeoutMs
    });
    this._observeBankCapacity();
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${RELEASE_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _bankPacks() {
    return this.root && (this.root.bank_packs || this.root.parent && this.root.parent.bank_packs) || {};
  }

  _liveCharacter() {
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _observeBankCapacity() {
    const character = this._liveCharacter();
    if (!character) return null;
    const result = this.bankCapacity.observe({
      character,
      bankPacks: this._bankPacks(),
      gameData: this.adapter.getGameData() || {},
      contentDrift: this.contentDrift,
      observedAt: this.now()
    });
    for (const tx of this.bankExpansionTransactions.list(256)) {
      if (tx.state === 'RECOVERING') this.bankExpansionTransactions.reconcile(tx.id, result);
    }
    return result;
  }

  _economyStatus() {
    const base = super._economyStatus();
    return {
      ...base,
      bankCapacity: this.bankCapacity.status(),
      bankExpansion: {
        transactions: this.bankExpansionTransactions.status(),
        controlled: this.controlledBankExpansion.status()
      }
    };
  }

  _guardControlledAuthority() {
    const result = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (this.bankExpansionTransactions.breaker().open) reason = 'BANK_EXPANSION_CIRCUIT_OPEN';
    if (reason && this.controlledBankExpansion.status().enabled) this.controlledBankExpansion.disable(reason);
    return { ...result, bankExpansionGuardReason: reason };
  }

  tick() {
    super.tick();
    const now = this.now();
    this.bankExpansionTransactions.tick();
    if (now - this.lastBankCapacityObservationAt >= this.bankCapacityObservationIntervalMs) {
      this.lastBankCapacityObservationAt = now;
      this._observeBankCapacity();
    }
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') this.controlledBankExpansion.disable('RUNTIME_LEFT_ACTIVE_MODE');
    return resolved;
  }

  planBankSpace(request = {}) {
    const observation = this._observeBankCapacity();
    return this.bankCapacity.planSpace(request, {
      observation,
      currentMap: this._liveCharacter() && this._liveCharacter().map,
      gold: this._liveCharacter() && this._liveCharacter().gold,
      ledger: this.inventoryLedger,
      gameData: this.adapter.getGameData() || {},
      contentDrift: this.contentDrift,
      minimumReserves: request.minimumReserves || {}
    });
  }

  planBankExpansion(request = {}) {
    const plan = request.plan && request.plan.action === 'EXPAND_BANK_PACK' ? request.plan : this.planBankSpace(request);
    if (!plan || plan.action !== 'EXPAND_BANK_PACK') return { accepted: false, reason: 'NO_SAFE_EXPANSION_PLAN', plan: clone(plan) };
    return this.bankExpansionTransactions.plan(plan, { observation: this.bankCapacity.status().observation });
  }

  configureControlledBankExpansion(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledBankExpansion.disable(gate.reason);
        return { ...this.controlledBankExpansion.status(), enableRejected: gate.reason };
      }
      if (this.bankExpansionTransactions.breaker().open) {
        this.controlledBankExpansion.disable('BANK_EXPANSION_CIRCUIT_OPEN');
        return { ...this.controlledBankExpansion.status(), enableRejected: 'BANK_EXPANSION_CIRCUIT_OPEN' };
      }
    }
    return this.controlledBankExpansion.configure(config);
  }

  executeBankExpansion(id) { return this.controlledBankExpansion.execute(id); }

  stop() {
    this.controlledBankExpansion.disable('RUNTIME_STOP');
    this.bankExpansionTransactions.save();
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: RELEASE_VERSION,
      economy: this._economyStatus(),
      alpha18: {
        bankCapacityFoundation: true,
        automaticExpansionEnabled: false,
        automaticEmergencyReclaimEnabled: false,
        controlledExpansionAck: CONTROLLED_BANK_EXPANSION_ACK,
        globalStopOnNoSpace: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.bankCapacity = this.bankCapacity.status();
    base.context.bankExpansion = {
      status: this.bankExpansionTransactions.status(),
      transactions: this.bankExpansionTransactions.list(100),
      controlled: this.controlledBankExpansion.status()
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha18Runtime };
