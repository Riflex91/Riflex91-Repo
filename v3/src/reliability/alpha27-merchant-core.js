'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity } = require('./alpha27-utils');
const { CONTROLLED_ACK, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { MERCHANT_SERVICE_ACK, TERMINAL_TX } = require('./alpha27-merchant-constants');

class Alpha27MerchantCore {
  constructor(runtime, atomic, shared) {
    this.runtime = runtime;
    this.atomic = atomic;
    this.root = runtime.root || globalThis;
    this.now = shared.now;
    this.log = shared.log;
    this.options = shared.options;
    this.stats = shared.stats;
    this.lastMerchantAt = -Infinity;
    this.lastMerchantPlan = null;
    this.lastMerchantAction = null;
    this.patchMerchantServiceGearDelivery();
    this.patchRuntimeEconomyStatus();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha27-convergence', event, severity, reason, data }); } catch (_) {}
  }

  patchMerchantServiceGearDelivery() {
    const service = this.runtime.controlledMerchantService;
    if (!service || service.__alpha27GearDeliveryPatched || typeof service._executeDelivery !== 'function') return false;
    const baseDelivery = service._executeDelivery.bind(service);
    service._executeDelivery = async (plan) => {
      const delivery = plan && plan.delivery || {};
      const itemName = String(delivery.itemName || '');
      if (/^hpot|^mpot/i.test(itemName)) return baseDelivery(plan);
      const goalId = plan && plan.metadata && plan.metadata.alpha27GearGoal;
      const itemLevel = Math.max(0, Math.floor(finite(plan && plan.metadata && plan.metadata.itemLevel, 0)));
      if (!goalId) return { executed: false, committed: false, reason: 'DELIVERY_ITEM_NOT_AUTHORIZED' };
      const goals = this.runtime.gearProgression && typeof this.runtime.gearProgression.list === 'function' ? this.runtime.gearProgression.list(256) : [];
      const goal = goals.find((row) => row && String(row.id) === String(goalId));
      const targetName = plan.target && String(plan.target.name || '');
      const safeIntermediate = !!(
        plan
        && plan.metadata
        && plan.metadata.alpha27SafeIntermediateDelivery === true
        && ['RISK_GATE_PREFERS_SAFE_CURRENT_PARTY_UPGRADE', 'HIGHEST_CURRENT_SAFE_LEVEL_REACHED'].includes(String(plan.metadata.alpha27FinalizationReason || ''))
        && goal
        && goal.observedMeaningful === true
      );
      if (!goal
        || goal.character !== targetName
        || goal.item !== itemName
        || levelOf({ level: goal.observedLevel }) !== itemLevel
        || (goal.projectedUpgradeRequired && !safeIntermediate)) {
        return { executed: false, committed: false, reason: 'GEAR_GOAL_NOT_CURRENT' };
      }
      if (typeof service._trusted === 'function' && !service._trusted(targetName)) return { executed: false, committed: false, reason: 'UNTRUSTED_DELIVERY_TARGET' };
      if (this.runtime.contentDrift && typeof this.runtime.contentDrift.requiresRevalidation === 'function' && this.runtime.contentDrift.requiresRevalidation('items', itemName)) return { executed: false, committed: false, reason: 'ITEM_REQUIRES_REVALIDATION' };
      const target = typeof service._visibleTarget === 'function' ? service._visibleTarget(targetName) : null;
      if (!target) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_NOT_VISIBLE' };
      const c = characterOf(this.runtime);
      if (target.map && c && c.map && String(target.map) !== String(c.map)) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_CROSS_MAP' };
      const distance = typeof service._distanceTo === 'function' ? service._distanceTo(target) : null;
      if (distance == null || distance > this.options.gearDeliveryDistance) return { executed: false, committed: false, reason: 'DELIVERY_TARGET_OUT_OF_RANGE' };
      const source = inventoryOf(this.root).find((item) => item && item.name === itemName && levelOf(item) === itemLevel && !item.locked && !item.l && !item.special && !item.p);
      if (!source) return { executed: false, committed: false, reason: 'GEAR_DELIVERY_SOURCE_UNAVAILABLE' };
      const sourceReportAt = Math.max(0, finite(plan.sourceReportAt, this.now()));
      const beforeTotal = identityQuantity(inventoryOf(this.root), itemName, itemLevel);
      if (!service._startOperation(plan, { action: 'send_item', alpha27GearDelivery: true, gearGoalId: goal.id, targetName, sourceReportAt, itemName, itemLevel, quantity: 1, sourceIndex: source.index, beforeTotal, expectedAfterTotal: beforeTotal - 1 })) return { executed: false, committed: false, reason: 'PERSIST_BEFORE_ACTION_FAILED' };
      service._transition('EXECUTING', 'RAW_ACTION_STARTING');
      service.actionTimes.push(this.now());
      service.stats.rawActions += 1;
      service.stats.deliveries += 1;
      this.stats.gearDeliveryAttempts += 1;
      try {
        const command = service._command('send_item', [targetName, source.index, 1]);
        if (!command.executed) return service._failed(plan.kind, `SEND_ITEM_COMMAND_REJECTED:${command.reason || 'unknown'}`, { targetName, itemName, itemLevel, quantity: 1, sourceReportAt });
        const response = await service._timeout(command.value);
        if (response && response.success === false) return service._failed(plan.kind, `SEND_ITEM_REJECTED:${response.reason || 'unknown'}`, { targetName, itemName, itemLevel, quantity: 1, sourceReportAt });
        service._transition('VERIFYING', 'RAW_ACTION_RETURNED');
        const verified = await service._verify(() => identityQuantity(inventoryOf(this.root), itemName, itemLevel) === beforeTotal - 1);
        if (!verified) return service._failed(plan.kind, 'GEAR_DELIVERY_LOCAL_DELTA_VERIFICATION_FAILED', { targetName, itemName, itemLevel, quantity: 1, sourceReportAt });
        this.stats.gearDeliveriesCommitted += 1;
        return service._commit(plan.kind, 'GEAR_DELIVERY_LOCAL_DELTA_VERIFIED', { targetName, itemName, itemLevel, quantity: 1, sourceReportAt, gearGoalId: goal.id });
      } catch (error) {
        return service._failed(plan.kind, String(error && error.message || error || 'SEND_ITEM_FAILED'), { targetName, itemName, itemLevel, quantity: 1, sourceReportAt });
      }
    };
    if (typeof service.reconcile === 'function') {
      const baseReconcile = service.reconcile.bind(service);
      service.reconcile = () => {
        const op = service.activeOperation;
        if (!op || op.alpha27GearDelivery !== true || op.state !== 'RECOVERING') return baseReconcile();
        const committed = identityQuantity(inventoryOf(this.root), op.itemName, op.itemLevel) === Number(op.expectedAfterTotal);
        if (committed) {
          service._transition('COMMITTED', 'RESTART_GEAR_DELIVERY_RECONCILIATION_VERIFIED');
          service.stats.recovered += 1;
          service.stats.committed += 1;
          this.stats.gearDeliveriesCommitted += 1;
          return { reconciled: true, committed: true, reason: 'RESTART_GEAR_DELIVERY_RECONCILIATION_VERIFIED' };
        }
        service._transition('FAILED_SAFE', 'RESTART_GEAR_DELIVERY_OUTCOME_UNCERTAIN_NO_RETRY');
        service.stats.failedSafe += 1;
        if (typeof service._failure === 'function') service._failure('RESTART_GEAR_DELIVERY_OUTCOME_UNCERTAIN_NO_RETRY');
        return { reconciled: true, committed: false, reason: 'RESTART_GEAR_DELIVERY_OUTCOME_UNCERTAIN_NO_RETRY' };
      };
    }
    if (typeof service.status === 'function') {
      const baseStatus = service.status.bind(service);
      service.status = () => ({ ...baseStatus(), alpha27GearGoalDelivery: true, arbitraryItemTransferAllowed: false, rawActionFamilies: ['OPEN_STAND', 'CLOSE_STAND', 'SEND_POTION', 'SEND_GEAR_GOAL'] });
    }
    service.__alpha27GearDeliveryPatched = true;
    return true;
  }
}

module.exports = { Alpha27MerchantCore };
