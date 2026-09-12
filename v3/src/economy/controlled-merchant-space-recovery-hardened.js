'use strict';

const {
  ControlledMerchantSpaceRecovery,
  CONTROLLED_SPACE_RECOVERY_MODE,
  CONTROLLED_SPACE_RECOVERY_ACK,
  MAX_RAW_ACTIONS_PER_OPERATION
} = require('./controlled-merchant-space-recovery');

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

class HardenedControlledMerchantSpaceRecovery extends ControlledMerchantSpaceRecovery {
  _freshReclaimPlan(operation, originalPlan, observation) {
    if (originalPlan && originalPlan.reason === 'ALPHA19_MINIMAL_RECLAIM_FALLBACK') {
      // Re-evaluate the same executable Alpha.19 authority scope. A cross-floor
      // expansion or consolidation without inventory workspace must not become
      // Travel/undocumented authority merely because we are revalidating SELL.
      return this._fallbackPlan(operation.request, observation, { skipExpansion: true });
    }
    return this.manager.planSpace(operation.request, this._context(observation, operation.request));
  }

  async _reclaim(operation, plan) {
    if (operation.emergencyReclaimCount >= 1 || plan.exactlyOneUnit !== true || plan.bulkSellForbidden !== true || !plan.candidate || Number(plan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_BOUNDARY_INVALID', rawActions: 0 };
    }

    const freshObservation = this.observeBank();
    const freshPlan = this._freshReclaimPlan(operation, plan, freshObservation);
    this.journal.noteReobservation(operation.id, freshObservation, freshPlan);
    if (freshPlan.action !== 'EMERGENCY_RECLAIM' || !this._sameCandidate(plan.candidate, freshPlan.candidate) || Number(freshPlan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_FRESH_PLAN_CHANGED', rawActions: 0, freshPlan };
    }

    const candidate = freshPlan.candidate;
    const planned = this.transactionEngine.plan({
      type: 'SELL',
      character: candidate.character,
      index: candidate.index,
      quantity: 1,
      metadata: {
        alpha19SpaceRecovery: operation.id,
        emergencyReclaim: true,
        exactlyOneUnit: true,
        protectedMinimumReserve: candidate.protectedMinimumReserve
      }
    }, { ledger: this.ledger });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `RECLAIM_TRANSACTION_${planned.reason}`, rawActions: 0 };

    this.controlledMerchant.configure({ enabled: true, ack: 'CONTROLLED_CANARY', sell: true, bank: false });
    try {
      const result = await this.controlledMerchant.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };

      this.journal.noteEmergencyReclaim(operation.id);
      this.stats.emergencyReclaims += 1;
      const afterObservation = this.observeBank();
      const afterPlan = this.manager.planSpace(operation.request, this._context(afterObservation, operation.request));
      this.journal.noteReobservation(operation.id, afterObservation, afterPlan);
      return {
        ok: true,
        reclaim: true,
        reason: 'EMERGENCY_RECLAIM_ONE_UNIT_COMMITTED',
        rawActions: 1,
        transactionId: planned.transaction.id,
        result,
        afterObservation,
        afterPlan
      };
    } finally {
      this.controlledMerchant.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  _finishBlocked(id, reason, evidence = {}) {
    const before = this.journal.get(id);
    const didExecute = !!(before && finite(before.rawActionCount, 0) > 0);
    this.journal.markBlocked(id, reason, { ...JSON.parse(JSON.stringify(evidence || {})), globalBotStop: false });
    this.stats.blocked += 1;
    this.lastResult = {
      executed: didExecute,
      committed: false,
      blocked: true,
      reason,
      operation: this.journal.get(id)
    };
    return JSON.parse(JSON.stringify(this.lastResult));
  }

  _finishFailedSafe(id, reason, evidence = {}) {
    const before = this.journal.get(id);
    const didExecute = !!(before && finite(before.rawActionCount, 0) > 0);
    this.journal.markFailedSafe(id, reason, evidence);
    this.stats.failedSafe += 1;
    this.lastResult = {
      executed: didExecute,
      committed: false,
      failedSafe: true,
      reason,
      operation: this.journal.get(id)
    };
    return JSON.parse(JSON.stringify(this.lastResult));
  }
}

module.exports = {
  HardenedControlledMerchantSpaceRecovery,
  CONTROLLED_SPACE_RECOVERY_MODE,
  CONTROLLED_SPACE_RECOVERY_ACK,
  MAX_RAW_ACTIONS_PER_OPERATION
};
