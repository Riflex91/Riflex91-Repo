'use strict';

const { CONTROLLED_MERCHANT_ACK } = require('../economy/controlled-merchant-executor');
const { CONTROLLED_TRAVEL_ACK } = require('../travel/controlled-travel-executor');
const { CONTROLLED_MERCHANT_SERVICE_ACK } = require('../merchant/controlled-merchant-service-executor');
const { CONTROLLED_MERCHANT_PRODUCTION_ACK } = require('../merchant/controlled-merchant-production-executor');
const { ProductionStepKind } = require('../merchant/merchant-production-planner');

const FULL_TEST_AUTHORITY_MODE = 'alpha20.42-full-merchant-test-authority-v1';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function countItem(snapshot, name) {
  const inventory = snapshot && snapshot.character && snapshot.character.inventory || [];
  return inventory.reduce((sum, item) => item && item.name === name ? sum + Math.max(1, Math.floor(finite(item.q, 1))) : sum, 0);
}

class FullTestAuthorityHotfix {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.warningDedupeMs = Math.max(1000, finite(options.warningDedupeMs, 5000));
    this.authorityIntervalMs = Math.max(500, finite(options.authorityIntervalMs, 1000));
    this.maxBuyQuantity = Math.max(1, Math.min(10000, Math.floor(finite(options.maxGlobalBuyQuantity, 2000))));
    this.goldReserve = Math.max(0, Math.floor(finite(options.testGoldReserve, 0)));
    this.lastAuthorityAt = -Infinity;
    this.lastWarningAt = -Infinity;
    this.lastWarningKey = null;
    this.lastBuy = null;
    this.lastTown = null;
    this.stats = { authorityRefreshes: 0, warningSuppressions: 0, skillBlocks: 0, retainedSupplyRequests: 0, buys: 0 };
    this._patchFarmer();
    this._patchLogistics();
    this._patchStatus();
    this._installApi();
    this.ensureAuthorities(true);
    this._event('FULL_TEST_AUTHORITY_INSTALLED', 'warn', 'OPERATOR_REQUESTED_FULL_MERCHANT_TEST', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    try { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'full-test-authority', event, severity, reason, data }); } catch (_) {}
  }

  _character() { return this.root && (this.root.character || this.parent && this.parent.character) || null; }
  _isMerchant() { const c = this._character(); return String(c && (c.ctype || c.type) || '').toLowerCase() === 'merchant'; }
  _inCombat() {
    const c = this._character();
    if (!c) return false;
    if (c.target) return true;
    const entities = this.parent && this.parent.entities || this.root && this.root.entities || {};
    const names = new Set([c.name, c.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && names.has(String(entity.target)));
  }
  _gate() {
    if (!this._isMerchant()) return { allowed: false, reason: 'MERCHANT_REQUIRED' };
    if (!this.runtime.adapter || this.runtime.adapter.mode !== 'active') return { allowed: false, reason: 'RUNTIME_NOT_ACTIVE' };
    const supervisor = this.runtime.globalSupervisor && this.runtime.globalSupervisor.status ? this.runtime.globalSupervisor.status() : { state: 'UNKNOWN' };
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { allowed: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const c = this._character();
    if (!c || c.rip === true || c.dead === true) return { allowed: false, reason: 'MERCHANT_DEAD' };
    if (this._inCombat()) return { allowed: false, reason: 'MERCHANT_IN_COMBAT' };
    if (typeof this.runtime._alpha20EconomyEmergency === 'function' && this.runtime._alpha20EconomyEmergency()) return { allowed: false, reason: 'ECONOMY_EMERGENCY' };
    return { allowed: true, reason: null };
  }

  ensureAuthorities(force = false) {
    const gate = this._gate();
    const now = this.now();
    if (!gate.allowed) return false;
    if (!force && now - this.lastAuthorityAt < this.authorityIntervalMs) return true;
    this.lastAuthorityAt = now;
    const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
    if (alpha27 && alpha27.options) alpha27.options.goldReserve = this.goldReserve;
    if (this.runtime.merchantEconomyAutonomy && this.runtime.merchantEconomyAutonomy.cfg) this.runtime.merchantEconomyAutonomy.cfg.goldReserve = this.goldReserve;

    if (typeof this.runtime.configureControlledMerchant === 'function') {
      this.runtime.configureControlledMerchant({ enabled: true, ack: CONTROLLED_MERCHANT_ACK, sell: true, bank: true, upgrade: true, compound: true });
    }
    if (typeof this.runtime.configureControlledTravel === 'function') this.runtime.configureControlledTravel({ enabled: true, ack: CONTROLLED_TRAVEL_ACK });
    if (typeof this.runtime.configureMerchantService === 'function') {
      this.runtime.configureMerchantService({ enabled: true, ack: CONTROLLED_MERCHANT_SERVICE_ACK, allowStand: true, allowDelivery: true, allowTravel: true });
    }
    if (this.runtime.controlledMerchantProduction) {
      this.runtime.controlledMerchantProduction.goldReserve = this.goldReserve;
      this.runtime.controlledMerchantProduction.maxBuyQuantity = Math.max(this.maxBuyQuantity, this.runtime.controlledMerchantProduction.maxBuyQuantity || 0);
    }
    if (typeof this.runtime.configureMerchantProduction === 'function') {
      this.runtime.configureMerchantProduction({ enabled: true, ack: CONTROLLED_MERCHANT_PRODUCTION_ACK, allowBuy: true, allowBank: true, allowCraft: true });
    }
    this.stats.authorityRefreshes += 1;
    return true;
  }

  _patchFarmer() {
    const resource = this.runtime.farmerResourceTopoffHotfix;
    if (resource && !resource.__alpha2042MpDegradePatched) {
      if (typeof resource.supply === 'function') {
        const baseSupply = resource.supply.bind(resource);
        resource.supply = (snapshot) => {
          const result = baseSupply(snapshot) || {};
          const next = { ...result, strictReady: result.hpReady === true && result.mpReady === true, ready: result.hpReady === true, basicCombatReady: result.hpReady === true, mpSkillReady: result.mpReady === true };
          resource.lastSupply = next;
          return next;
        };
      }
      if (typeof resource._event === 'function') {
        const baseEvent = resource._event.bind(resource);
        resource._event = (event, severity, reason, data = {}) => {
          if (event === 'FARMER_RESOURCE_TOPOFF_UNAVAILABLE') {
            const supply = data && data.supply || {};
            const key = `${reason || '-'}:${supply.hpReady === false ? 'hp0' : 'hp1'}:${supply.mpReady === false ? 'mp0' : 'mp1'}`;
            const now = this.now();
            if (key === this.lastWarningKey && now - this.lastWarningAt < this.warningDedupeMs) { this.stats.warningSuppressions += 1; return; }
            this.lastWarningKey = key; this.lastWarningAt = now;
          }
          return baseEvent(event, severity, reason, data);
        };
      }
      if (typeof resource.status === 'function') {
        const baseStatus = resource.status.bind(resource);
        resource.status = () => ({ ...baseStatus(), requiresHpAndMpSupplyForTeamCombat: false, missingMpPotionBlocksBasicCombat: false, missingMpPotionDisablesMpSkills: true, warningDedupeMs: this.warningDedupeMs });
      }
      resource.__alpha2042MpDegradePatched = true;
    }

    const farmer = this.runtime.farmer;
    const skillUsage = farmer && farmer.skillUsage;
    if (skillUsage && typeof skillUsage.evaluate === 'function' && !skillUsage.__alpha2042MpSupplyPatched) {
      const baseEvaluate = skillUsage.evaluate.bind(skillUsage);
      skillUsage.evaluate = (snapshot, target, gameData, adapter, options) => {
        const decision = baseEvaluate(snapshot, target, gameData, adapter, options);
        const supply = resource && typeof resource.supply === 'function' ? resource.supply(snapshot) : null;
        if (decision && decision.useSkill && decision.skill && Number(decision.skill.mp) > 0 && supply && supply.mpReady === false) {
          this.stats.skillBlocks += 1;
          return { ...decision, useSkill: false, reason: 'MP_POTION_SUPPLY_UNAVAILABLE_BASIC_ATTACK_ONLY' };
        }
        return decision;
      };
      skillUsage.__alpha2042MpSupplyPatched = true;
    }

    const team = this.runtime.teamCombatCohesionHotfix;
    if (team && typeof team._team === 'function' && !team.__alpha2042ManaGatePatched) {
      const baseTeam = team._team.bind(team);
      team._team = (snapshot) => {
        const state = baseTeam(snapshot);
        if (!state) return state;
        return { ...state, observedManaReady: state.manaReady, manaReady: true };
      };
      if (typeof team.status === 'function') {
        const baseStatus = team.status.bind(team);
        team.status = () => ({ ...baseStatus(), mpSupplyDegradesToBasicAttack: true, manaThresholdBlocksBasicCombat: false });
      }
      team.__alpha2042ManaGatePatched = true;
    }
    return true;
  }

  _patchLogistics() {
    const logistics = this.runtime.controlledPartyLogistics;
    if (!logistics || typeof logistics._processSupply !== 'function' || logistics.__alpha2042SupplyRetentionPatched) return false;
    const baseProcess = logistics._processSupply.bind(logistics);
    logistics._processSupply = (snapshot) => {
      if (!snapshot || !snapshot.character || logistics.pendingSupply || this.now() < logistics.backoffUntil) return baseProcess(snapshot);
      const reserve = Math.max(0, finite(logistics.config && logistics.config.merchantPotionReserve, 0));
      const requests = [...logistics.supplyRequests.values()].filter((request) => request && this.now() - request.receivedAt <= logistics.config.messageTtlMs);
      for (const request of requests) {
        const mpDeficit = Math.max(0, logistics.config.farmerPotionTarget - Math.max(0, Math.floor(finite(request.mpPotions, 0))));
        const hpDeficit = Math.max(0, logistics.config.farmerPotionTarget - Math.max(0, Math.floor(finite(request.hpPotions, 0))));
        const blockedMp = mpDeficit > 0 && countItem(snapshot, 'mpot0') <= reserve;
        const blockedHp = hpDeficit > 0 && countItem(snapshot, 'hpot0') <= reserve;
        if (!blockedMp && !blockedHp) continue;
        this.stats.retainedSupplyRequests += 1;
        logistics.lastDecision = { at: this.now(), action: 'RESTOCK_REQUIRED', reason: 'MERCHANT_SUPPLY_RESERVE_ONLY_REQUEST_RETAINED', target: request.sender, itemName: blockedMp ? 'mpot0' : 'hpot0' };
        return false;
      }
      return baseProcess(snapshot);
    };
    logistics.__alpha2042SupplyRetentionPatched = true;
    return true;
  }

  _patchStatus() {
    if (typeof this.runtime.merchantServiceStatus === 'function' && !this.runtime.__alpha2042MerchantServiceStatusPatched) {
      const baseStatus = this.runtime.merchantServiceStatus.bind(this.runtime);
      this.runtime.merchantServiceStatus = () => ({ ...baseStatus(), liveTownAuthority: true, liveBuyAuthority: true, liveBuyAuthorityScope: 'ANY_KNOWN_PURCHASABLE_ITEM', fullMerchantTestAuthority: true });
      this.runtime.__alpha2042MerchantServiceStatusPatched = true;
    }
    const service = this.runtime.controlledMerchantService;
    if (service && typeof service.status === 'function' && !service.__alpha2042StatusPatched) {
      const baseStatus = service.status.bind(service);
      service.status = () => ({ ...baseStatus(), buyAllowed: true, globalMerchantBuyAuthority: true, buyAuthorityOwner: 'controlled-merchant-production' });
      service.__alpha2042StatusPatched = true;
    }
  }

  _installApi() {
    this.runtime.buyMerchantItemGlobal = (name, quantity = 1) => this.buy(name, quantity);
    this.runtime.requestMerchantTown = () => this.town();
  }

  _raw(name) {
    if (this.root && typeof this.root[name] === 'function') return { fn: this.root[name], owner: this.root };
    if (this.parent && typeof this.parent[name] === 'function') return { fn: this.parent[name], owner: this.parent };
    return null;
  }

  async buy(itemName, requestedQuantity = 1) {
    const gate = this._gate();
    if (!gate.allowed) return { executed: false, committed: false, reason: gate.reason };
    const name = String(itemName || '').trim();
    const gameData = this.runtime.adapter && this.runtime.adapter.getGameData ? this.runtime.adapter.getGameData() || {} : {};
    const meta = gameData.items && gameData.items[name];
    const unitCost = Math.max(0, Math.floor(finite(meta && (meta.g != null ? meta.g : meta.gold), 0)));
    if (!name || !meta || unitCost <= 0) return { executed: false, committed: false, reason: !name ? 'ITEM_NAME_REQUIRED' : (!meta ? 'ITEM_METADATA_UNKNOWN' : 'BUY_PRICE_UNKNOWN') };
    this.ensureAuthorities(true);
    const canBuy = this._raw('can_buy');
    let near = false;
    if (canBuy) { try { near = canBuy.fn.call(canBuy.owner, name) === true; } catch (_) {} }
    if (!near) {
      const alpha27 = this.runtime.alpha27CombatMerchantConvergence;
      const travelled = alpha27 && alpha27.atomic && typeof alpha27.atomic.namedServiceTravel === 'function'
        ? await alpha27.atomic.namedServiceTravel(name)
        : null;
      if (!travelled || travelled.ok !== true) return { executed: false, committed: false, reason: travelled && travelled.reason || 'BUY_VENDOR_TRAVEL_FAILED' };
    }
    const executor = this.runtime.controlledMerchantProduction;
    if (!executor || typeof executor.execute !== 'function') return { executed: false, committed: false, reason: 'CONTROLLED_PRODUCTION_EXECUTOR_UNAVAILABLE' };
    const quantity = Math.min(this.maxBuyQuantity, Math.max(1, Math.floor(finite(requestedQuantity, 1))));
    const plan = { schemaVersion: 1, id: `full-test-buy-${this.now()}-${name}`, state: 'READY', source: 'FULL_TEST_GLOBAL_BUY' };
    const result = await executor.execute(plan, { kind: ProductionStepKind.BUY, name, level: 0, quantity, unitCost });
    this.lastBuy = { at: this.now(), itemName: name, quantity, result };
    if (result && result.committed) this.stats.buys += 1;
    return result;
  }

  town() {
    const gate = this._gate();
    if (!gate.allowed) return { executed: false, reason: gate.reason };
    const result = this.runtime.adapter && this.runtime.adapter.command ? this.runtime.adapter.command('town', []) : { executed: false, reason: 'ADAPTER_UNAVAILABLE' };
    this.lastTown = { at: this.now(), result };
    return result;
  }

  beforeTick() {
    this._patchFarmer(); this._patchLogistics(); this._patchStatus();
    if (this._isMerchant()) this.ensureAuthorities(false);
    return true;
  }

  status() {
    return {
      schemaVersion: 1,
      mode: FULL_TEST_AUTHORITY_MODE,
      operatorRequestedFullTest: true,
      gate: this._gate(),
      authority: { globalBuy: true, sell: true, bank: true, upgrade: true, compound: true, craft: true, stand: true, travel: true, town: true, potionDelivery: true, trustedPartyItemTransfer: true, externalArbitraryTrade: false },
      farmerPolicy: { missingMpPotionBlocksBasicCombat: false, missingMpPotionDisablesMpSkills: true, missingHpPotionSafetyStillHard: true, warningDedupeMs: this.warningDedupeMs },
      safetyStillEnforced: ['ACTIVE_MODE', 'SUPERVISOR_HEALTHY_OR_WATCH', 'NO_MERCHANT_COMBAT', 'CIRCUIT_BREAKERS', 'ACTION_BUDGETS', 'CONTENT_DRIFT_FOR_PRODUCTION_BUY'],
      lastBuy: this.lastBuy,
      lastTown: this.lastTown,
      stats: { ...this.stats }
    };
  }
}

function installFullTestAuthorityHotfix(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.fullTestAuthorityHotfix) return runtime.fullTestAuthorityHotfix;
  return runtime.fullTestAuthorityHotfix = new FullTestAuthorityHotfix(runtime, options);
}

module.exports = { FULL_TEST_AUTHORITY_MODE, FullTestAuthorityHotfix, installFullTestAuthorityHotfix };
