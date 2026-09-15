'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, rawFunction, errorDetails } = require('./alpha27-utils');
const { CONTROLLED_ACK, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { MERCHANT_SERVICE_ACK, TERMINAL_TX } = require('./alpha27-merchant-constants');
const { Alpha27MerchantPlanning } = require('./alpha27-merchant-planning');

class Alpha27MerchantAutonomy extends Alpha27MerchantPlanning {
  async cycle() {
    this.stats.autonomousMerchantCycles += 1;
    if (!this.atomic.merchantActive() || !this.atomic.supervisorAllowed() || this.atomic.merchantInCombat()) { this.stats.autonomousMerchantHolds += 1; return false; }
    this.ensureAutonomousAuthorities();
    if (this.atomic.serviceTravelBusy || this.atomic.merchantBusy) return false;
    if (this.runtime._controlledMerchantBusy && this.runtime._controlledMerchantBusy()) return false;
    const service = this.runtime.controlledMerchantService;
    if (service && service.activeOperation && service.activeOperation.state === 'RECOVERING' && typeof service.reconcile === 'function') { service.reconcile(); return true; }

    // Finish/reconcile already-reserved economy work before creating more service
    // traffic. This prevents stand/gear-delivery churn from starving atomic work.
    if (this.reconcileRecovering()) return true;
    const active = this.activeTransaction();
    if (active) {
      if (active.state === 'RESERVED') {
        const result = await this.runtime.controlledMerchant.execute(active.id);
        this.lastMerchantAction = { at: this.now(), transactionId: active.id, type: active.type, result: clone(result) };
        return true;
      }
      return false;
    }

    // Critical party consumables keep priority, but ordinary gear delivery no
    // longer preempts every ledger-authorized SELL/BANK/UPGRADE/COMPOUND turn.
    if (await this.restockPartyPotions()) return true;

    // A scoped mutation circuit must not starve independent economy work.
    // Skip the blocked family and continue with the next ledger-authorized
    // action instead of reserving the same doomed item every cycle.
    let request = this.transactionFamilyOpen('UPGRADE') ? null : this.planUpgrade();
    if (!request && !this.transactionFamilyOpen('COMPOUND')) request = this.planCompound();
    if (!request) {
      const lowRiskRequest = this.planSellOrBank();
      if (lowRiskRequest && !this.transactionFamilyOpen(lowRiskRequest.type)) request = lowRiskRequest;
    }
    if (request) {
      if (!await this.ensureStandClosed('ECONOMY_TRANSACTION_PREEMPT')) return true;

      if (request.type === 'BANK') {
        const c = characterOf(this.runtime);
        if (!c.bank || typeof c.bank !== 'object') {
          this.lastMerchantPlan = { at: this.now(), action: 'SERVICE_TRAVEL', reason: 'BANK_REQUIRED', destination: 'bank' };
          await this.atomic.namedServiceTravel('bank');
          return true;
        }
      }
      if (request.type === 'SELL') {
        const canSell = rawFunction(this.root, 'can_sell');
        let near = false;
        if (canSell) {
          try { near = canSell.fn.call(canSell.owner) === true; } catch (_) { near = false; }
        }
        // Adventure Land does not guarantee a public can_sell() helper. The old
        // code treated a missing probe as proof that the merchant was already in
        // range, which produced repeated sell()->distance failures. Unknown
        // proximity is now fail-closed: travel to a known vendor first, then
        // execute the already-authorized transaction in the same cycle.
        if (!near) {
          this.lastMerchantPlan = { at: this.now(), action: 'SERVICE_TRAVEL', reason: canSell ? 'SELL_VENDOR_REQUIRED' : 'SELL_VENDOR_PROXIMITY_UNKNOWN', destination: 'scroll0' };
          const travelled = await this.atomic.namedServiceTravel('scroll0');
          const travelSucceeded = travelled === true || !!(travelled && travelled.ok === true);
          if (!travelSucceeded) {
            this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: travelled && travelled.reason || 'SELL_VENDOR_TRAVEL_FAILED', destination: 'scroll0', request: clone(request) };
            return true;
          }
          if (canSell) {
            try { near = canSell.fn.call(canSell.owner) === true; } catch (_) { near = false; }
            if (!near) {
              this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'SELL_VENDOR_NOT_REACHED', destination: 'scroll0', request: clone(request) };
              return true;
            }
          }
        }
      }

      const planned = ['UPGRADE', 'COMPOUND'].includes(request.type)
        ? this.runtime.transactionEngine.planAtomic(request, { ledger: this.runtime.inventoryLedger, snapshot: this.runtime.lastSnapshot })
        : this.runtime.planEconomyTransaction(request);
      if (!planned || planned.accepted !== true || !planned.transaction) {
        this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: planned && planned.reason || 'TRANSACTION_PLAN_REJECTED', request: clone(request) };
        return false;
      }
      this.stats.autonomousMerchantPlans += 1;
      this.lastMerchantPlan = { at: this.now(), action: 'EXECUTE', reason: 'LEDGER_AUTHORIZED_TRANSACTION', transactionId: planned.transaction.id, type: request.type, request: clone(request) };
      const result = await this.runtime.controlledMerchant.execute(planned.transaction.id);
      this.lastMerchantAction = { at: this.now(), transactionId: planned.transaction.id, type: request.type, result: clone(result) };
      return true;
    }

    // Non-critical gear goals use otherwise-idle merchant turns. A rejected
    // service execution now returns false from deliverGearGoal(), so a full raw
    // action budget does not masquerade as useful work.
    if (await this.deliverGearGoal()) return true;

    this.lastMerchantPlan = { at: this.now(), action: 'IDLE', reason: 'NO_LEDGER_AUTHORIZED_ACTION' };
    return false;
  }

  tick() {
    if (!this.atomic.merchantActive() || this.now() - this.lastMerchantAt < this.options.merchantIntervalMs) return false;
    this.lastMerchantAt = this.now();
    Promise.resolve(this.cycle()).catch((error) => {
      this.atomic.merchantBusy = false;
      this.stats.failedSafe += 1;
      this.lastMerchantAction = { at: this.now(), result: 'FAILED_SAFE', reason: 'UNHANDLED_ALPHA27_MERCHANT_ERROR', error: errorDetails(error) };
      this._event('ALPHA27_MERCHANT_FAILED_SAFE', 'error', 'UNHANDLED_ALPHA27_MERCHANT_ERROR', this.lastMerchantAction);
    });
    return true;
  }

  status() {
    return {
      autonomous: true,
      centralLedgerPlanner: true,
      autonomousLowRiskDisposition: true,
      autonomousPotionRestock: true,
      autonomousGearGoalDelivery: true,
      economyBeforeNonCriticalGearDelivery: true,
      completedGearGoalClaims: this.completedGearGoalClaims instanceof Map ? this.completedGearGoalClaims.size : 0,
      gearGoalClaimSuppressions: this.gearGoalClaimSuppressions || 0,
      atomicTransactions: true,
      realUpgrade: true,
      realCompound: true,
      blindMutationRetryAllowed: false,
      merchantBusy: this.atomic.merchantBusy,
      serviceTravelBusy: this.atomic.serviceTravelBusy,
      lastPlan: clone(this.lastMerchantPlan),
      lastAction: clone(this.lastMerchantAction || this.atomic.lastMerchantAction),
      ...this.atomic.status(),
      risk: {
        goldReserve: this.options.goldReserve,
        upgradeValueCap: this.options.upgradeValueCap,
        compoundValueCap: this.options.compoundValueCap,
        keepValue: this.options.keepValue,
        merchantPotionTarget: this.options.merchantPotionTarget,
        mutationAttemptWindowMs: this.options.mutationAttemptWindowMs,
        maxUpgradeAttemptsPerWindow: this.options.maxUpgradeAttemptsPerWindow,
        maxCompoundAttemptsPerWindow: this.options.maxCompoundAttemptsPerWindow,
        gearDeliveryDistance: this.options.gearDeliveryDistance,
        maxUpgradeLevel: this.options.maxUpgradeLevel,
        maxCompoundLevel: this.options.maxCompoundLevel
      }
    };
  }
}

module.exports = { Alpha27MerchantAutonomy };