'use strict';

const { Alpha16Runtime } = require('./alpha16-runtime');
const { ControlledMerchantExecutor, CONTROLLED_MERCHANT_ACK } = require('../economy/controlled-merchant-executor');
const { sellMetadataConsensus, rawSellProtectionReasons } = require('../economy/sell-safety');
const { ControlledTravelExecutor, CONTROLLED_TRAVEL_ACK } = require('../travel/controlled-travel-executor');

const ALPHA17_VERSION = '3.0.0-alpha.17.0';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function registryName(value) {
  const name = String(value == null ? '' : value).trim();
  return name || null;
}

class Alpha17Runtime extends Alpha16Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = ALPHA17_VERSION;
    if (this.inventoryLedger && typeof this.inventoryLedger.setSellSafetyResolver === 'function') {
      this.inventoryLedger.setSellSafetyResolver(({ row }) => {
        const blockers = sellMetadataConsensus(this.root, row && row.name).blockers.slice();
        const character = this.root && this.root.character;
        const sameCharacter = character && row && String(character.name || '') === String(row.character || '');
        if (sameCharacter) {
          const items = Array.isArray(character.items) ? character.items : [];
          const index = Number(row.index);
          const rawItem = Number.isInteger(index) && index >= 0 ? items[index] : null;
          blockers.push(...rawSellProtectionReasons(rawItem));
        }
        return [...new Set(blockers)];
      });
    }
    this.controlledMerchant = options.controlledMerchant || new ControlledMerchantExecutor({
      root: this.root,
      engine: this.transactionEngine,
      ledger: this.inventoryLedger,
      contentDrift: this.contentDrift,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      timeoutMs: options.controlledMerchantTimeoutMs,
      verifyDelayMs: options.controlledMerchantVerifyDelayMs,
      verifyAttempts: options.controlledMerchantVerifyAttempts,
      actionWindowMs: options.controlledMerchantActionWindowMs,
      maxActionsPerWindow: options.controlledMerchantMaxActionsPerWindow
    });
    this.controlledTravel = options.controlledTravel || new ControlledTravelExecutor({
      root: this.root,
      controller: this.safeTravel,
      log: this.log,
      now: this.now,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      timeoutMs: options.controlledTravelTimeoutMs
    });
    this.lastControlledGuardReason = null;
    this.registryVisibility = { foreignVisibleIgnored: 0, lastObservedAt: null };
  }

  _partyObservation() {
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character) return null;

    const selfName = registryName(snapshot.character.name);
    const partyNames = new Set((snapshot.party || []).map((member) => registryName(member && member.name)).filter(Boolean));
    if (selfName) partyNames.add(selfName);
    const knownNames = new Set(
      (this.characterRegistry && typeof this.characterRegistry.list === 'function' ? this.characterRegistry.list() : [])
        .map((member) => registryName(member && member.name))
        .filter(Boolean)
    );

    let ignored = 0;
    const entities = (snapshot.entities || []).filter((entity) => {
      const name = registryName(entity && entity.name);
      if (!name) return false;
      const allowed = name === selfName || partyNames.has(name) || knownNames.has(name);
      if (!allowed) ignored += 1;
      return allowed;
    });

    this.registryVisibility.foreignVisibleIgnored += ignored;
    this.registryVisibility.lastObservedAt = snapshot.observedAt || this.now();

    return this.characterRegistry.observe({
      snapshot: { ...snapshot, entities },
      gameData: this.adapter.getGameData() || {},
      liveCharacter: this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null
    });
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${ALPHA17_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _controlledSubsystemHealth() {
    const tx = this.transactionEngine.status();
    const economyReasons = [];
    for (const family of ['SELL', 'BANK']) {
      if (tx.circuits && tx.circuits[family] && tx.circuits[family].open) economyReasons.push(`${family}_CIRCUIT_OPEN`);
    }
    const economyLast = this.controlledMerchant && this.controlledMerchant.status().lastAction;
    const economy = economyReasons.length
      ? { state: 'DEGRADED', reasons: economyReasons }
      : economyLast && economyLast.result === 'FAILED_SAFE'
        ? { state: 'WATCH', reasons: ['CONTROLLED_MERCHANT_LAST_ACTION_FAILED_SAFE'] }
        : { state: 'HEALTHY', reasons: [] };

    const breaker = this.safeTravel.breaker();
    const travelLast = this.controlledTravel && this.controlledTravel.status().lastAction;
    const travel = breaker.open
      ? { state: 'DEGRADED', reasons: ['TRAVEL_CIRCUIT_OPEN'] }
      : travelLast && travelLast.result === 'FAILED_SAFE'
        ? { state: 'WATCH', reasons: ['CONTROLLED_TRAVEL_LAST_ACTION_FAILED_SAFE'] }
        : { state: 'HEALTHY', reasons: [] };
    return { economy, travel };
  }

  _economyStatus() {
    const base = super._economyStatus();
    const controlled = this.controlledMerchant ? this.controlledMerchant.status() : null;
    return {
      ...base,
      mode: 'controlled-canary-default-off',
      actionAuthority: !!(controlled && controlled.actionAuthority),
      directGameplayActionAccess: !!(controlled && controlled.actionAuthority),
      liveEnabled: !!(controlled && controlled.enabled),
      sellLiveEnabled: !!(controlled && controlled.sellEnabled),
      bankLiveEnabled: !!(controlled && controlled.bankEnabled),
      controlled
    };
  }

  _travelStatus() {
    const base = super._travelStatus();
    const controlled = this.controlledTravel ? this.controlledTravel.status() : null;
    return {
      ...base,
      plannerActionAuthority: false,
      actionAuthority: !!(controlled && controlled.actionAuthority),
      liveExecutionEnabled: !!(controlled && controlled.enabled),
      smartMoveExecutionEnabled: !!(controlled && controlled.enabled),
      controlled
    };
  }

  _evaluateGlobalSupervisor() {
    const status = super.status();
    const result = this.globalSupervisor.observe({ runtime: this, status, contentDrift: this.contentDrift.status() });
    this.lastSupervisorResult = result;
    return result;
  }

  _liveEnableGate() {
    if (this.adapter.mode !== 'active') return { allowed: false, reason: 'RUNTIME_NOT_ACTIVE' };
    const supervisor = this.globalSupervisor.status();
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { allowed: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this.root && this.root.character;
    if (!character || String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { allowed: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { allowed: false, reason: 'CHARACTER_DEAD' };
    return { allowed: true, reason: null };
  }

  _guardControlledAuthority() {
    const health = this._controlledSubsystemHealth();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    else if (health.economy.state === 'DEGRADED') reason = 'ECONOMY_CIRCUIT_OPEN';

    if (reason && this.controlledMerchant.status().enabled) this.controlledMerchant.disable(reason);
    if ((reason || health.travel.state === 'DEGRADED') && this.controlledTravel.status().enabled) {
      const travelReason = health.travel.state === 'DEGRADED' ? 'TRAVEL_CIRCUIT_OPEN' : reason;
      Promise.resolve(this.controlledTravel.disable(travelReason)).catch((error) => {
        this.log.emit({ component: 'controlled-travel', event: 'CONTROLLED_TRAVEL_GUARD_DISABLE_FAILED', severity: 'error', reason: travelReason, data: { message: String(error && error.message || error) } });
      });
    }
    this.lastControlledGuardReason = reason || (health.travel.state === 'DEGRADED' ? 'TRAVEL_CIRCUIT_OPEN' : null);
    return { reason: this.lastControlledGuardReason, health };
  }

  tick() {
    super.tick();
    this._guardControlledAuthority();
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') {
      this.controlledMerchant.disable('RUNTIME_LEFT_ACTIVE_MODE');
      Promise.resolve(this.controlledTravel.disable('RUNTIME_LEFT_ACTIVE_MODE')).catch(() => {});
    }
    return resolved;
  }

  configureInventoryActionPolicy(config = {}) {
    const normalize = (value) => [...new Set((Array.isArray(value) ? value : []).map((x) => String(x || '').trim()).filter(Boolean))].slice(0, 128);
    const sell = normalize(config.sell);
    const bank = normalize(config.bank);
    const exchange = normalize(config.exchange);
    this.inventoryLedger.sellAllowlist = new Set(sell);
    this.inventoryLedger.bankAllowlist = new Set(bank);
    this.inventoryLedger.exchangeAllowlist = new Set(exchange);
    this.log.emit({ component: 'inventory-ledger', event: 'INVENTORY_ACTION_POLICY_CHANGED', severity: 'warn', reason: 'OPERATOR_POLICY', data: { sell, bank, exchange } });
    if (this.lastSnapshot) this._planInventoryAndGear();
    return clone(this.inventoryLedger.status().policy);
  }

  configureControlledMerchant(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledMerchant.disable(gate.reason);
        this.log.emit({ component: 'controlled-merchant', event: 'CONTROLLED_MERCHANT_ENABLE_REJECTED', severity: 'warn', reason: gate.reason });
        return { ...this.controlledMerchant.status(), enableRejected: gate.reason };
      }
    }
    return this.controlledMerchant.configure(config);
  }

  configureControlledTravel(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        Promise.resolve(this.controlledTravel.disable(gate.reason)).catch(() => {});
        this.log.emit({ component: 'controlled-travel', event: 'CONTROLLED_TRAVEL_ENABLE_REJECTED', severity: 'warn', reason: gate.reason });
        return { ...this.controlledTravel.status(), enableRejected: gate.reason };
      }
    }
    return this.controlledTravel.configure(config);
  }

  setEconomyLiveEnabled(enabled) {
    if (enabled !== true) return this.controlledMerchant.disable('GENERIC_LIVE_DISABLE');
    this.log.emit({ component: 'controlled-merchant', event: 'GENERIC_LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'USE_CONTROLLED_CANARY_API' });
    return false;
  }

  setTravelLiveEnabled(enabled) {
    if (enabled !== true) {
      Promise.resolve(this.controlledTravel.disable('GENERIC_LIVE_DISABLE')).catch(() => {});
      return false;
    }
    this.log.emit({ component: 'controlled-travel', event: 'GENERIC_LIVE_ENABLE_REJECTED', severity: 'warn', reason: 'USE_CONTROLLED_CANARY_API' });
    return false;
  }

  executeEconomyTransaction(id) { return this.controlledMerchant.execute(id); }
  executeTravelPlan(id) { return this.controlledTravel.execute(id); }
  abortControlledTravel(reason) { return this.controlledTravel.abort(reason); }

  stop() {
    this.controlledMerchant.disable('RUNTIME_STOP');
    Promise.resolve(this.controlledTravel.disable('RUNTIME_STOP')).catch(() => {});
    return super.stop();
  }

  status() {
    const base = super.status();
    const controlledSubsystems = this._controlledSubsystemHealth();
    return {
      ...base,
      version: ALPHA17_VERSION,
      economy: this._economyStatus(),
      travel: this._travelStatus(),
      supervisor: { ...base.supervisor, controlledSubsystems },
      registryVisibility: clone(this.registryVisibility),
      controlledCanary: {
        explicitAck: CONTROLLED_MERCHANT_ACK,
        merchantAck: CONTROLLED_MERCHANT_ACK,
        travelAck: CONTROLLED_TRAVEL_ACK,
        defaultEnabled: false,
        guardReason: this.lastControlledGuardReason
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.controlledCanary = {
      economy: this._economyStatus(),
      travel: this._travelStatus(),
      supervisor: this._controlledSubsystemHealth(),
      guardReason: this.lastControlledGuardReason
    };
    base.context.registryVisibility = clone(this.registryVisibility);
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha17Runtime, ALPHA17_VERSION };
