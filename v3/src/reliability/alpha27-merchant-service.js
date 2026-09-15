'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, rawFunction, errorReason } = require('./alpha27-utils');
const { CONTROLLED_ACK, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { MERCHANT_SERVICE_ACK, TERMINAL_TX } = require('./alpha27-merchant-constants');
const { Alpha27MerchantCore } = require('./alpha27-merchant-core');

class Alpha27MerchantService extends Alpha27MerchantCore {
  patchRuntimeEconomyStatus() {
    if (this.runtime.__alpha27EconomyStatusPatched) return false;

    // Alpha20.5 opens the merchant stand whenever the service planner is idle.
    // Alpha27 owns live economy work and must close that stand before each raw
    // mutation. Leaving both authorities active creates an OPEN/CLOSE loop that
    // exhausts the bounded merchant-service action budget without doing useful
    // work. Alpha27 therefore suppresses only the legacy idle-stand behavior;
    // explicit stand/service actions remain bounded by the controlled executor.
    const planner = this.runtime.merchantServicePlanner;
    if (planner && planner.standWhenIdle !== false) {
      planner.standWhenIdle = false;
      this.runtime.__alpha27IdleStandSuppressed = true;
    }

    if (typeof this.runtime._controlledSubsystemHealth === 'function') {
      const baseHealth = this.runtime._controlledSubsystemHealth.bind(this.runtime);
      this.runtime._controlledSubsystemHealth = () => {
        const health = baseHealth();
        const tx = this.runtime.transactionEngine && this.runtime.transactionEngine.status ? this.runtime.transactionEngine.status() : null;
        const economy = health && health.economy || null;
        const reasons = economy && Array.isArray(economy.reasons) ? economy.reasons.slice() : [];
        const mutationReasons = [];
        for (const family of ['UPGRADE', 'COMPOUND']) {
          if (tx && tx.circuits && tx.circuits[family] && tx.circuits[family].open) mutationReasons.push(`${family}_CIRCUIT_OPEN`);
        }
        if (economy && mutationReasons.length) {
          reasons.push(...mutationReasons);
          const baseState = String(economy.state || 'HEALTHY').toUpperCase();
          // UPGRADE/COMPOUND are family-scoped in Alpha27. Mark them WATCH so
          // Alpha17's global authority guard does not disable SELL/BANK and then
          // fight Alpha27's auto-enable loop. Existing DEGRADED state (notably a
          // SELL/BANK circuit) remains globally authoritative.
          health.economy = {
            state: baseState === 'DEGRADED' ? 'DEGRADED' : 'WATCH',
            reasons: [...new Set(reasons)]
          };
        }
        return health;
      };
    }
    if (typeof this.runtime._economyStatus === 'function') {
      const baseEconomy = this.runtime._economyStatus.bind(this.runtime);
      this.runtime._economyStatus = () => {
        const status = baseEconomy();
        const controlled = this.runtime.controlledMerchant && this.runtime.controlledMerchant.status ? this.runtime.controlledMerchant.status() : null;
        return {
          ...status,
          mode: 'alpha27-central-ledger-atomic-autonomy',
          liveEnabled: !!(controlled && controlled.enabled),
          upgradeLiveEnabled: !!(controlled && controlled.upgradeEnabled),
          compoundLiveEnabled: !!(controlled && controlled.compoundEnabled),
          centralInventoryLedgerPlanner: true,
          atomicMerchantTransactions: true,
          autonomousMerchant: true,
          autonomousMerchantAutoEnableForActiveMerchant: true,
          autonomousPartySupplyBuyAuthority: true,
          autonomousGearGoalDelivery: true,
          controlled
        };
      };
    }
    if (typeof this.runtime.merchantServiceStatus === 'function') {
      const base = this.runtime.merchantServiceStatus.bind(this.runtime);
      this.runtime.merchantServiceStatus = () => ({
        ...base(),
        alpha27AutonomousMerchant: true,
        idleStandSuppressedByAlpha27: true,
        liveBuyAuthority: true,
        liveBuyAuthorityScope: 'PARTY_POTIONS_AND_REQUIRED_MUTATION_SCROLLS_ONLY',
        gearGoalDeliveryAuthority: true,
        arbitraryItemTransferAuthority: false
      });
    }
    this.runtime.__alpha27EconomyStatusPatched = true;
    return true;
  }

  ensureAutonomousAuthorities() {
    if (!this.atomic.merchantActive() || !this.atomic.supervisorAllowed()) return false;
    if (typeof this.runtime.configureControlledMerchant === 'function' && this.runtime.controlledMerchant) {
      const status = this.runtime.controlledMerchant.status();
      const tx = this.runtime.transactionEngine && typeof this.runtime.transactionEngine.status === 'function'
        ? this.runtime.transactionEngine.status()
        : null;
      const sell = !(tx && tx.circuits && tx.circuits.SELL && tx.circuits.SELL.open);
      const bank = !(tx && tx.circuits && tx.circuits.BANK && tx.circuits.BANK.open);
      const upgrade = !(tx && tx.circuits && tx.circuits.UPGRADE && tx.circuits.UPGRADE.open);
      const compound = !(tx && tx.circuits && tx.circuits.COMPOUND && tx.circuits.COMPOUND.open);
      const lowRiskCircuitOpen = !sell || !bank;
      // Alpha17 intentionally treats SELL/BANK circuit failures as a global
      // controlled-economy hold. Do not immediately re-enable the executor while
      // that guard is active; doing so caused enable/disable churn every tick.
      if (!lowRiskCircuitOpen && (!status.enabled
        || status.sellEnabled !== sell
        || status.bankEnabled !== bank
        || status.upgradeEnabled !== upgrade
        || status.compoundEnabled !== compound)) {
        this.runtime.configureControlledMerchant({
          enabled: true,
          ack: CONTROLLED_ACK,
          sell,
          bank,
          upgrade,
          compound
        });
      }
    }
    if (typeof this.runtime.configureControlledTravel === 'function' && this.runtime.controlledTravel && !this.runtime.controlledTravel.status().enabled) this.runtime.configureControlledTravel({ enabled: true, ack: CONTROLLED_ACK });
    if (typeof this.runtime.configureMerchantService === 'function' && this.runtime.controlledMerchantService && !this.runtime.controlledMerchantService.status().enabled) this.runtime.configureMerchantService({ enabled: true, ack: MERCHANT_SERVICE_ACK, allowStand: true, allowDelivery: true, allowTravel: true });
    return true;
  }

  transactionFamilyOpen(type) {
    const engine = this.runtime.transactionEngine;
    if (!engine || typeof engine.breaker !== 'function') return false;
    try { return engine.breaker(type).open === true; } catch (_) { return true; }
  }

  async ensureStandClosed(reason = 'ALPHA27_ECONOMY_PREEMPT') {
    const c = characterOf(this.runtime);
    if (!c || !c.stand) return true;
    this.ensureAutonomousAuthorities();
    const service = this.runtime.controlledMerchantService;
    if (!service || service.status().busy) return false;
    const plan = { schemaVersion: 1, id: `alpha27-stand-close-${this.now()}`, at: this.now(), kind: 'STAND_CLOSE', reason, actionAuthority: false, liveExecutionAllowed: false };
    const result = await service.execute(plan);
    return !!(result && (result.committed === true || result.reason === 'STAND_ALREADY_CLOSED'));
  }

  async restockPartyPotions() {
    const plan = this.runtime.lastMerchantServicePlan;
    if (!plan || plan.kind !== 'RESTOCK_REQUIRED' || !plan.need || !['hp', 'mp'].includes(plan.need.family)) return false;
    if (!await this.ensureStandClosed('PARTY_SUPPLY_RESTOCK')) return true;
    const family = plan.need.family;
    const preferred = plan.need.preferred && String(plan.need.preferred).toLowerCase().startsWith(family === 'hp' ? 'hpot' : 'mpot') ? String(plan.need.preferred) : null;
    const itemName = preferred || (family === 'hp' ? 'hpot0' : 'mpot0');
    const c = characterOf(this.runtime);
    const planner = this.runtime.merchantServicePlanner;
    const reserve = Math.max(0, finite(planner && planner.merchantPotionReserve, 80));
    const serviceTarget = Math.max(this.options.merchantPotionTarget, finite(planner && planner.targetPotionCount, 240) + reserve);
    const have = identityQuantity(inventoryOf(this.root), itemName, 0);
    if (have >= serviceTarget) return false;
    const canBuy = rawFunction(this.root, 'can_buy');
    let near = false;
    if (canBuy) { try { near = canBuy.fn.call(canBuy.owner, itemName) === true; } catch (_) {} }
    if (!near) {
      this.lastMerchantPlan = { at: this.now(), action: 'SERVICE_TRAVEL', reason: 'PARTY_SUPPLY_VENDOR_REQUIRED', destination: itemName };
      await this.atomic.namedServiceTravel(itemName);
      return true;
    }
    const buy = rawFunction(this.root, 'buy');
    if (!buy) return false;
    const gd = gameDataOf(this.runtime);
    const meta = gd.items && gd.items[itemName];
    const price = Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
    const affordable = price > 0 ? Math.max(0, Math.floor((finite(c && c.gold, 0) - this.options.goldReserve) / price)) : 0;
    const quantity = Math.max(0, Math.min(this.options.merchantMaxPotionBuy, Math.floor(serviceTarget - have), affordable));
    if (quantity <= 0) {
      this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'PARTY_SUPPLY_GOLD_RESERVE_PROTECTED', itemName, have, serviceTarget };
      return true;
    }
    const before = have;
    try {
      const response = await this.atomic._timeout(buy.fn.call(buy.owner, itemName, quantity), 'BUY_PARTY_SUPPLY', 15000);
      if (response && response.failed === true) throw response;
      const verified = await this.atomic.verifyEventually(() => identityQuantity(inventoryOf(this.root), itemName, 0) >= before + quantity);
      if (!verified) throw new Error('PARTY_SUPPLY_PURCHASE_DELTA_NOT_OBSERVED');
      this.stats.potionRestocks += 1;
      this.lastMerchantAction = { at: this.now(), type: 'BUY_SUPPLY', result: 'COMMITTED', itemName, quantity };
      return true;
    } catch (error) {
      this.stats.failedSafe += 1;
      this.lastMerchantAction = { at: this.now(), type: 'BUY_SUPPLY', result: 'FAILED_SAFE', reason: errorReason(error, 'BUY_PARTY_SUPPLY_FAILED') };
      return true;
    }
  }
}

module.exports = { Alpha27MerchantService };