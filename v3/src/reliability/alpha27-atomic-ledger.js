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
      try {
        futureFarmerProtection = gearProgression && typeof gearProgression.futureProtectionFor === 'function'
          ? gearProgression.futureProtectionFor(row.character, row.index, name, level)
          : null;
      } catch (_) {
        futureFarmerProtection = { reason: 'FUTURE_GEAR_PROTECTION_LOOKUP_FAILED' };
      }

      if (futureFarmerProtection) {
        if (meta.compound && level < Math.max(level + 1, finite(futureFarmerProtection.targetLevel, level + 1)) && grade < 4 && value != null && value <= this.options.compoundValueCap) {
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
        if (meta.upgrade && level < Math.max(level + 1, finite(futureFarmerProtection.targetLevel, level + 1)) && grade < 4 && value != null && value <= this.options.upgradeValueCap) {
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
      if (meta.compound) {
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
          this.stats.autoLedgerSellClassifications += 1;
          return {
            disposition: 'SELL',
            reasons: [...baseReasons, 'AUTONOMOUS_PROCESSED_GEAR_SELL', 'AUTONOMOUS_COMPOUND_RESULT']
          };
        }
      }

      // Generic low-risk upgradeable gear gets exactly one economy lifecycle
      // upgrade unless an active GearProgression reservation has already claimed
      // it for a higher party target. Higher levels are then either delivered by
      // the gear-goal path or sold through the tightly scoped processed-gear gate.
      if (meta.upgrade) {
        if (level === 0 && this.options.maxUpgradeLevel > 0 && grade < 4 && (value != null && value <= this.options.upgradeValueCap)) {
          return {
            disposition: 'RESERVE_UPGRADE',
            reasons: [...baseReasons, 'AUTONOMOUS_ECONOMIC_UPGRADE']
          };
        }
        if (level > 0 && grade < 4 && underKeepValue) {
          this.stats.autoLedgerSellClassifications += 1;
          return {
            disposition: 'SELL',
            reasons: [...baseReasons, 'AUTONOMOUS_PROCESSED_GEAR_SELL', 'AUTONOMOUS_UPGRADE_RESULT']
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
      if (bank) {
        this.stats.autoLedgerBankClassifications += 1;
        return {
          disposition: 'BANK',
          reasons: [...baseReasons, blockers.length ? 'AUTONOMOUS_SELL_SAFETY_BANK' : meta.upgrade || meta.compound ? 'AUTONOMOUS_PROGRESSION_ITEM_BANK' : level > 0 ? 'AUTONOMOUS_LEVELED_ITEM_BANK' : 'AUTONOMOUS_VALUE_KEEP_BANK', ...blockers]
        };
      }
      if (level === 0 && blockers.length === 0) {
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
        lowRiskKnownSurplusAutoSell: true,
        valuableOrProgressionItemsAutoBank: false,
        progressionLifecycleBeforeBank: true,
        compoundMetadataObjectsSupported: true,
        processedGearSaleRequiresLifecycleAuthorization: true,
        futureFarmerGearValuePreemptsProcessedSale: true,
        futureGearProbeIncludesCompoundAndUpgrade: true,
        keepValue: this.options.keepValue
      });
    }
    ledger.__alpha27AutonomousPlannerPatched = true;
    return true;
  }
}

module.exports = { Alpha27AtomicLedger };
