'use strict';

const { finite, clone, text, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, findItem, gradeForLevel, transactionInputs, rawFunction } = require('./alpha27-utils');
const { CONTROLLED_ACK, SUPERVISOR_ALLOWED, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { Alpha27AtomicCore } = require('./alpha27-atomic-core');

class Alpha27AtomicLedger extends Alpha27AtomicCore {
  patchInventoryLedger() {
    const ledger = this.runtime.inventoryLedger;
    if (!ledger || ledger.__alpha27AutonomousPlannerPatched || typeof ledger._baseDisposition !== 'function') return false;
    const baseDisposition = ledger._baseDisposition.bind(ledger);
    ledger._baseDisposition = (row, meta, context = {}) => {
      const base = baseDisposition(row, meta, context);
      if (!base || base.disposition !== 'UNDECIDED') return base;
      if (!row || !row.name || !meta || typeof meta !== 'object') return base;
      const name = String(row.name);
      if (/^(hpot|mpot|scroll|cscroll)/i.test(name)) return { disposition: 'KEEP', reasons: [...(base.reasons || []), 'AUTONOMOUS_SERVICE_RESOURCE'] };
      if (meta.quest || meta.q || meta.event || meta.cash || meta.cash_item || meta.soulbound || meta.soul_bound || meta.exchange || meta.e) {
        return { disposition: 'KEEP', reasons: [...(base.reasons || []), 'AUTONOMOUS_PROTECTED_METADATA'] };
      }
      let blockers = [];
      try {
        blockers = typeof ledger._resolveSellBlockers === 'function'
          ? ledger._resolveSellBlockers(row, meta, context.gameData || gameDataOf(this.runtime), context.contentDrift || this.runtime.contentDrift)
          : [];
      } catch (_) { blockers = ['SELL_SAFETY_RESOLVER_FAILED']; }
      const rawValue = meta.g != null ? Number(meta.g) : Number(meta.gold);
      const value = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : null;
      const bank = levelOf(row) > 0 || meta.upgrade || meta.compound || blockers.length > 0 || (value != null && value >= this.options.keepValue);
      if (bank) {
        this.stats.autoLedgerBankClassifications += 1;
        return {
          disposition: 'BANK',
          reasons: [...(base.reasons || []), blockers.length ? 'AUTONOMOUS_SELL_SAFETY_BANK' : meta.upgrade || meta.compound ? 'AUTONOMOUS_PROGRESSION_ITEM_BANK' : levelOf(row) > 0 ? 'AUTONOMOUS_LEVELED_ITEM_BANK' : 'AUTONOMOUS_VALUE_KEEP_BANK', ...blockers]
        };
      }
      if (levelOf(row) === 0 && blockers.length === 0) {
        this.stats.autoLedgerSellClassifications += 1;
        return { disposition: 'SELL', reasons: [...(base.reasons || []), 'AUTONOMOUS_LOW_RISK_SURPLUS'] };
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
        valuableOrProgressionItemsAutoBank: true,
        keepValue: this.options.keepValue
      });
    }
    ledger.__alpha27AutonomousPlannerPatched = true;
    return true;
  }
}

module.exports = { Alpha27AtomicLedger };
