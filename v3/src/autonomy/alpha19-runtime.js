'use strict';

const { Alpha18Runtime } = require('./alpha18-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { MerchantSpaceRecoveryJournal } = require('../economy/merchant-space-recovery-journal');
const { ControlledBankConsolidationExecutor, CONTROLLED_BANK_CONSOLIDATION_ACK } = require('../economy/controlled-bank-consolidation-executor');
const { ControlledMerchantSpaceRecovery, CONTROLLED_SPACE_RECOVERY_ACK, MAX_RAW_ACTIONS_PER_OPERATION } = require('../economy/controlled-merchant-space-recovery');

const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

class Alpha19Runtime extends Alpha18Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = RELEASE_VERSION;
    this.merchantSpaceRecoveryJournal = options.merchantSpaceRecoveryJournal || new MerchantSpaceRecoveryJournal({
      now: this.now,
      log: this.log,
      storage: options.merchantSpaceRecoveryStorage || options.storage,
      storageKey: options.merchantSpaceRecoveryStorageKey,
      capacity: options.merchantSpaceRecoveryCapacity,
      leaseMs: options.merchantSpaceRecoveryLeaseMs,
      failureWindowMs: options.merchantSpaceRecoveryFailureWindowMs,
      failureThreshold: options.merchantSpaceRecoveryFailureThreshold,
      circuitCooldownMs: options.merchantSpaceRecoveryCircuitCooldownMs
    });
    this.merchantSpaceRecoveryJournal.load();
    this.controlledBankConsolidation = options.controlledBankConsolidation || new ControlledBankConsolidationExecutor({
      root: this.root,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getGameData: () => this.adapter.getGameData() || {},
      timeoutMs: options.controlledBankConsolidationTimeoutMs,
      verifyDelayMs: options.controlledBankConsolidationVerifyDelayMs,
      verifyAttempts: options.controlledBankConsolidationVerifyAttempts
    });
    this.controlledMerchantSpaceRecovery = options.controlledMerchantSpaceRecovery || new ControlledMerchantSpaceRecovery({
      root: this.root,
      log: this.log,
      now: this.now,
      journal: this.merchantSpaceRecoveryJournal,
      manager: this.bankCapacity,
      transactionEngine: this.transactionEngine,
      ledger: this.inventoryLedger,
      controlledMerchant: this.controlledMerchant,
      expansionTransactions: this.bankExpansionTransactions,
      controlledExpansion: this.controlledBankExpansion,
      controlledConsolidation: this.controlledBankConsolidation,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      observeBank: () => this._observeBankCapacity(),
      getGameData: () => this.adapter.getGameData() || {},
      getContentDrift: () => this.contentDrift
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${RELEASE_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _economyStatus() {
    const base = super._economyStatus();
    return {
      ...base,
      merchantSpaceRecovery: this.controlledMerchantSpaceRecovery.status()
    };
  }

  _guardControlledAuthority() {
    const result = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (this.merchantSpaceRecoveryJournal.breaker().open) reason = 'SPACE_RECOVERY_CIRCUIT_OPEN';
    if (reason && this.controlledMerchantSpaceRecovery.status().enabled) this.controlledMerchantSpaceRecovery.disable(reason);
    if (reason && this.controlledBankConsolidation.status().enabled) this.controlledBankConsolidation.disable(reason);
    return { ...result, merchantSpaceRecoveryGuardReason: reason };
  }

  tick() {
    super.tick();
    this.merchantSpaceRecoveryJournal.tick();
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') {
      this.controlledMerchantSpaceRecovery.disable('RUNTIME_LEFT_ACTIVE_MODE');
      this.controlledBankConsolidation.disable('RUNTIME_LEFT_ACTIVE_MODE');
    }
    return resolved;
  }

  planMerchantSpaceRecovery(request = {}) {
    return this.controlledMerchantSpaceRecovery.plan(request);
  }

  configureControlledMerchantSpaceRecovery(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledMerchantSpaceRecovery.disable(gate.reason);
        return { ...this.controlledMerchantSpaceRecovery.status(), enableRejected: gate.reason };
      }
      if (this.merchantSpaceRecoveryJournal.breaker().open) {
        this.controlledMerchantSpaceRecovery.disable('SPACE_RECOVERY_CIRCUIT_OPEN');
        return { ...this.controlledMerchantSpaceRecovery.status(), enableRejected: 'SPACE_RECOVERY_CIRCUIT_OPEN' };
      }
    }
    return this.controlledMerchantSpaceRecovery.configure(config);
  }

  executeMerchantSpaceRecovery(id) {
    return this.controlledMerchantSpaceRecovery.execute(id);
  }

  reconcileMerchantSpaceRecovery(id) {
    return this.controlledMerchantSpaceRecovery.reconcile(id);
  }

  stop() {
    this.controlledMerchantSpaceRecovery.disable('RUNTIME_STOP');
    this.controlledBankConsolidation.disable('RUNTIME_STOP');
    this.merchantSpaceRecoveryJournal.save();
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: RELEASE_VERSION,
      economy: this._economyStatus(),
      alpha19: {
        merchantSpaceRecovery: true,
        controlledSpaceRecoveryAck: CONTROLLED_SPACE_RECOVERY_ACK,
        controlledConsolidationAck: CONTROLLED_BANK_CONSOLIDATION_ACK,
        maxRawActionsPerOperation: MAX_RAW_ACTIONS_PER_OPERATION,
        emergencyReclaimMaxUnitsPerOperation: 1,
        emergencyReclaimBulkAllowed: false,
        emergencyReclaimRequiresFreshReobservation: true,
        travelAuthority: false,
        shellExpansionAuthority: false,
        craftingAuthority: false,
        upgradeAuthority: false,
        compoundAuthority: false,
        exchangeAuthority: false,
        globalStopOnNoSpace: false,
        liveExecutionDefault: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.merchantSpaceRecovery = {
      status: this.controlledMerchantSpaceRecovery.status(),
      journal: this.merchantSpaceRecoveryJournal.list(100),
      consolidation: this.controlledBankConsolidation.status()
    };
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha19Runtime };
