'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicCore } = require('./alpha27-atomic-core');

class Alpha27AtomicLedger extends Alpha27AtomicCore {
  patchInventoryLedger() {
    const ledger = this.runtime.inventoryLedger;
    if (!ledger || ledger.__alpha27AutonomousPlannerPatched || typeof ledger._baseDisposition !== 'function') return false;
    const baseDisposition = ledger._baseDisposition.bind(ledger);
    ledger._baseDisposition = (row, gameData, contentDrift, counts, reservationRemaining) => {
      const safeCounts = counts && typeof counts.get === 'function' ? counts : new Map();
      const base = baseDisposition(row, gameData, contentDrift, safeCounts, reservationRemaining);
      if (!base || base.disposition !== 'UNDECIDED') return base;
      const meta = gameData && gameData.items && row && row.name ? gameData.items[row.name] : null;
      if (!row || !row.name || !meta || typeof meta !== 'object') return base;
      const name = String(row.name);
      const permission = (action) => typeof ledger._permission === 'function' ? ledger._permission(name, action) : null;
      if (/^(hpot|mpot|scroll|cscroll)/i.test(name)) return { disposition: 'KEEP', reasons: [...(base.reasons || []), 'AUTONOMOUS_SERVICE_RESOURCE'] };
      if (meta.quest || meta.q || meta.event || meta.cash || meta.cash_item || meta.soulbound || meta.soul_bound || meta.exchange || meta.e) {
        return { disposition: 'KEEP', reasons: [...(base.reasons || []), 'AUTONOMOUS_PROTECTED_METADATA'] };
      }
      const baseReasons = Array.isArray(base.reasons) ? base.reasons : [];
      if (baseReasons.includes('CONTENT_REVALIDATION_REQUIRED')) return base;

      const level = levelOf(row);
      const rawValue = meta.g != null ? Number(meta.g) : Number(meta.gold);
      const value = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : null;
      const same = safeCounts.get(`${name}:${level}`) || 0;
      const grade = gradeForLevel(meta, level);
      const underKeepValue = value != null && value < this.options.keepValue;

      const gearProgression = this.runtime.gearProgression;
      let futureFarmerProtection = null;
      let futureSellSafety = null;
      try {
        futureFarmerProtection = gearProgression && typeof gearProgression.futureProtectionFor === 'function'
          ? gearProgression.futureProtectionFor(row.character, row.index, name, level)
          : null;
        futureSellSafety = gearProgression && typeof gearProgression.futureSellSafetyFor === 'function'
          ? gearProgression.futureSellSafetyFor(row.character, row.index, name, level)
          : null;
      } catch (_) {
        futureFarmerProtection = { reason: 'FUTURE_GEAR_PROTECTION_LOOKUP_FAILED' };
        futureSellSafety = null;
      }

      const productionDemand = this.runtime && this.runtime.productionMaterialMutationDemand;
      const productionDemandActive = !!(
        productionDemand
        && finite(productionDemand.expiresAt, 0) > this.now()
        && String(productionDemand.item || '') === name
        && Math.max(0, Math.floor(finite(productionDemand.fromLevel, -1))) === level
        && Math.max(0, Math.floor(finite(productionDemand.targetLevel, -1))) === level + 1
      );

      // A production mutation demand is intentionally weaker than a Farmer gear
      // reservation. Exact/future Farmer protection keeps ownership. Otherwise
      // the demanded recipe input may enter the same Alpha27 mutation authority
      // used for normal autonomous progression; no second raw mutation path is
      // introduced.
      if (!futureFarmerProtection && productionDemandActive) {
        const family = String(productionDemand.family || '').toUpperCase();
        if (family === 'UPGRADE'
          && permission('upgrade') !== false
          && meta.upgrade
          && level < this.options.maxUpgradeLevel
          && grade < 4
          && value != null
          && value <= this.options.upgradeValueCap) {
          return {
            disposition: 'RESERVE_UPGRADE',
            reasons: [...baseReasons, 'PRODUCTION_MATERIAL_MUTATION_DEMAND', 'PRODUCTION_RECIPE_UPGRADE_INPUT'],
            productionMutationDemand: clone(productionDemand)
          };
        }
        if (family === 'COMPOUND'
          && permission('compound') !== false
          && meta.compound
          && level < this.options.maxCompoundLevel
          && grade < 4
          && value != null
          && value <= this.options.compoundValueCap) {
          return same >= 3
            ? {
                disposition: 'RESERVE_COMPOUND',
                reasons: [...baseReasons, 'PRODUCTION_MATERIAL_MUTATION_DEMAND', 'PRODUCTION_RECIPE_COMPOUND_INPUT'],
                productionMutationDemand: clone(productionDemand)
              }
            : {
                disposition: 'KEEP',
                reasons: [...baseReasons, 'PRODUCTION_MATERIAL_MUTATION_DEMAND', 'PRODUCTION_RECIPE_COMPOUND_ACCUMULATION'],
                productionMutationDemand: clone(productionDemand)
              };
        }
      }

      if (futureFarmerProtection) {
        if (permission('compound') !== false && meta.compound && level < Math.max(level + 1, finite(futureFarmerProtection.targetLevel, level + 1)) && grade < 4 && value != null && value <= this.options.compoundValueCap) {
          return same >= 3
            ? {
                disposition: 'RESERVE_COMPOUND',
                reasons: [...baseReasons, 'FUTURE_FARMER_GEAR_PROGRESSION', 'AUTONOMOUS_COMPOUND_SET_AVAILABLE'],
                futureFarmerProtection: clone(futureFarmerProtection)
              }
            : {
                disposition: 'KEEP',
                reasons: [...baseReasons, 'FUTURE_FARMER_GEAR_PROGRESSION', 'AUTONOMOUS_COMPOUND_ACCUMULATION'],
                futureFarmerProtection: clone(futureFarmerProtection)
              };
        }
        if (permission('upgrade') !== false && meta.upgrade && level < Math.max(level + 1, finite(futureFarmerProtection.targetLevel, level + 1)) && grade < 4 && value != null && value <= this.options.upgradeValueCap) {
          return {
            disposition: 'RESERVE_UPGRADE',
            reasons: [...baseReasons, 'FUTURE_FARMER_GEAR_PROGRESSION', 'AUTONOMOUS_UPGRADE_CONTINUATION'],
            futureFarmerProtection: clone(futureFarmerProtection)
          };
        }
        return {
          disposition: 'KEEP',
          reasons: [...baseReasons, 'FUTURE_FARMER_GEAR_PROGRESSION', 'FUTURE_GEAR_SELL_BLOCKED'],
          futureFarmerProtection: clone(futureFarmerProtection)
        };
      }

      // Progression lifecycle comes before generic BANK fallback. Adventure Land
      // exposes compound/upgrade metadata as objects, not necessarily boolean true.
      // A complete compound set is actionable now; an incomplete level-0 set is
      // retained until a third copy arrives instead of being hidden in the bank.
      if (meta.compound && permission('compound') !== false) {
        if (same >= 3 && level < this.options.maxCompoundLevel && grade < 4 && (value != null && value <= this.options.compoundValueCap)) {
          return {
            disposition: 'RESERVE_COMPOUND',
            reasons: [...baseReasons, 'AUTONOMOUS_COMPOUND_SET_AVAILABLE']
          };
        }
        if (level === 0 && grade < 4 && (value != null && value <= this.options.compoundValueCap)) {
          return {
            disposition: 'KEEP',
            reasons: [...baseReasons, 'AUTONOMOUS_COMPOUND_ACCUMULATION']
          };
        }
        if (level > 0 && grade < 4 && underKeepValue) {
          if (!futureSellSafety || futureSellSafety.checked !== true) {
            return {
              disposition: 'KEEP',
              reasons: [...baseReasons, 'FUTURE_FARMER_GEAR_EVALUATION_REQUIRED', 'PROCESSED_GEAR_SELL_FAIL_CLOSED']
            };
          }
          if (permission('sell') === false) return { disposition: 'KEEP', reasons: [...baseReasons, 'OPERATOR_SELL_DENIED', 'AUTONOMOUS_COMPOUND_RESULT'] };
          this.stats.autoLedgerSellClassifications += 1;
          return {
            disposition: 'SELL',
            reasons: [...baseReasons, 'AUTONOMOUS_PROCESSED_GEAR_SELL', 'AUTONOMOUS_COMPOUND_RESULT', 'FUTURE_FARMER_GEAR_EVALUATED_SAFE']
          };
        }
      }

      // Upgradeable gear that has been explicitly evaluated as having no
      // Farmer value by +5 still receives a bounded economic processing path:
      // try up to +3 with scroll0 only, then allow the normal processed-gear
      // sale gate to dispose of low-value results. Re-evaluation is required
      // after every observed level change, so a newly useful item immediately
      // leaves this fallback and moves into the Farmer +5 progression path.
      if (meta.upgrade && permission('upgrade') !== false) {
        if (!futureSellSafety || futureSellSafety.checked !== true) {
          return {
            disposition: 'KEEP',
            reasons: [...baseReasons, 'FUTURE_FARMER_GEAR_EVALUATION_REQUIRED', 'PROCESSED_GEAR_SELL_FAIL_CLOSED']
          };
        }
        const economicTargetLevel = Math.min(3, this.options.maxUpgradeLevel);
        if (level < economicTargetLevel && grade < 4 && value != null && value <= this.options.upgradeValueCap) {
          return {
            disposition: 'RESERVE_UPGRADE',
            reasons: [
              ...baseReasons,
              'AUTONOMOUS_ECONOMIC_UPGRADE',
              'AUTONOMOUS_ECONOMIC_UPGRADE_TO_PLUS3',
              'FUTURE_FARMER_GEAR_EVALUATED_SAFE'
            ],
            economicTargetLevel
          };
        }
        if (level >= economicTargetLevel && level > 0 && grade < 4 && underKeepValue) {
          if (permission('sell') === false) return { disposition: 'KEEP', reasons: [...baseReasons, 'OPERATOR_SELL_DENIED', 'AUTONOMOUS_UPGRADE_RESULT'] };
          this.stats.autoLedgerSellClassifications += 1;
          return {
            disposition: 'SELL',
            reasons: [...baseReasons, 'AUTONOMOUS_PROCESSED_GEAR_SELL', 'AUTONOMOUS_UPGRADE_RESULT', 'FUTURE_FARMER_GEAR_EVALUATED_SAFE']
          };
        }
      }

      let blockers = [];
      try {
        blockers = typeof ledger._resolveSellBlockers === 'function'
          ? ledger._resolveSellBlockers(row, meta, gameData || gameDataOf(this.runtime), contentDrift || this.runtime.contentDrift)
          : [];
      } catch (_) { blockers = ['SELL_SAFETY_RESOLVER_FAILED']; }
      const bank = level > 0 || meta.upgrade || meta.compound || blockers.length > 0 || (value != null && value >= this.options.keepValue);
      if (bank && permission('bank') !== false) {
        this.stats.autoLedgerBankClassifications += 1;
        return {
          disposition: 'BANK',
          reasons: [...baseReasons, blockers.length ? 'AUTONOMOUS_SELL_SAFETY_BANK' : meta.upgrade || meta.compound ? 'AUTONOMOUS_PROGRESSION_ITEM_BANK' : level > 0 ? 'AUTONOMOUS_LEVELED_ITEM_BANK' : 'AUTONOMOUS_VALUE_KEEP_BANK', ...blockers]
        };
      }
      if (bank && permission('bank') === false) return { disposition: 'KEEP', reasons: [...baseReasons, 'OPERATOR_BANK_DENIED'] };
      if (level === 0 && blockers.length === 0) {
        if (permission('sell') === false) return { disposition: 'KEEP', reasons: [...baseReasons, 'OPERATOR_SELL_DENIED'] };
        this.stats.autoLedgerSellClassifications += 1;
        return { disposition: 'SELL', reasons: [...baseReasons, 'AUTONOMOUS_LOW_RISK_SURPLUS'] };
      }
      return base;
    };
    if (typeof ledger.status === 'function') {
      const baseStatus = ledger.status.bind(ledger);
      ledger.status = () => ({
        ...baseStatus(),
        mode: 'alpha27-central-autonomous-inventory-ledger',
        autonomousPlanner: true,
        unknownItemsFailClosed: true,
        protectedItemsNeverAutoSold: true,
        progressionReservationsPreemptDisposition: true,
        productionMutationDemandSupported: true,
        productionMutationDemandCannotOverrideFarmerProtection: true,
        lowRiskKnownSurplusAutoSell: true,
        valuableOrProgressionItemsAutoBank: false,
        progressionLifecycleBeforeBank: true,
        compoundMetadataObjectsSupported: true,
        processedGearSaleRequiresLifecycleAuthorization: true,
        futureFarmerGearValuePreemptsProcessedSale: true,
        futureGearProbeIncludesCompoundAndUpgrade: true,
        farmerPotentialUpgradeTargetLevel: 5,
        nonImprovingUpgradeProcessingTargetLevel: 3,
        nonImprovingUpgradeProcessingScrollPolicy: 'SCROLL0_ONLY',
        processedGearSellFailClosedWithoutFutureEvaluation: true,
        keepValue: this.options.keepValue
      });
    }
    ledger.__alpha27AutonomousPlannerPatched = true;
    return true;
  }
}

module.exports = { Alpha27AtomicLedger };
