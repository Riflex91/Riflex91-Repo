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
    const visible = (snapshot.entities || []).filter((entity) => {
      if (!entity || entity.type !== 'character') return false;
      const name = registryName(entity.name || entity.id);
      if (!name) return false;
      const trusted = partyNames.has(name) || knownNames.has(name);
      if (!trusted) ignored += 1;
      return trusted;
    });
    const observations = this.characterRegistry.observe({
      self: snapshot.character,
      party: snapshot.party,
      visible
    });
    this.registryVisibility = {
      foreignVisibleIgnored: ignored,
      lastObservedAt: this.now()
    };
    return observations;
  }

  _liveEnableGate() {
    const supervisor = this.globalSupervisor.status();
    if (this.adapter.mode !== 'active') return { allowed: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { allowed: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    return { allowed: true, reason: null };
  }

  _controlledSubsystemHealth() {
    const economy = this.controlledMerchant.status();
    const travel = this.controlledTravel.status();
    return {
      economy: {
        enabled: economy.enabled,
        busy: economy.busy,
        lastAction: economy.lastAction || null,
        stats: economy.stats || null
      },
      travel: {
        enabled: travel.enabled,
        activePlanId: travel.activePlanId || null,
        lastAction: travel.lastAction || null,
        stats: travel.stats || null
      }
    };
  }

  _guardControlledAuthority() {
    const gate = this._liveEnableGate();
    let reason = gate.reason;
    if (!reason && this.transactionEngine && typeof this.transactionEngine.breaker === 'function') {
      const sell = this.transactionEngine.breaker('SELL');
      const bank = this.transactionEngine.breaker('BANK');
      if ((sell && sell.open) || (bank && bank.open)) reason = 'ECONOMY_CIRCUIT_OPEN';
    }
    if (!reason && this.safeTravel && typeof this.safeTravel.breaker === 'function') {
      const travel = this.safeTravel.breaker();
      if (travel && travel.open) reason = 'TRAVEL_CIRCUIT_OPEN';
    }
    if (!reason) {
      this.lastControlledGuardReason = null;
      return { allowed: true, reason: null };
    }
    this.lastControlledGuardReason = reason;
    if (this.controlledMerchant.status().enabled) this.controlledMerchant.disable(reason);
    if (this.controlledTravel.status().enabled) Promise.resolve(this.controlledTravel.disable(reason)).catch(() => {});
    return { allowed: false, reason };
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
