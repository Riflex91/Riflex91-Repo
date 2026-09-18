'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, rawFunction, errorDetails } = require('./alpha27-utils');
const { CONTROLLED_ACK, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { MERCHANT_SERVICE_ACK, TERMINAL_TX } = require('./alpha27-merchant-constants');
const { Alpha27MerchantPlanning } = require('./alpha27-merchant-planning');

class Alpha27MerchantAutonomy extends Alpha27MerchantPlanning {
  _partySupplyPlanFreshMs() {
    return Math.max(5000, Math.min(20000, finite(this.options && this.options.merchantServiceChainPlanFreshMs, 10000)));
  }

  _partySupplyChainTimeoutMs() {
    return Math.max(30000, Math.min(180000, finite(this.options && this.options.merchantServiceChainTimeoutMs, 130000)));
  }

  _adaptivePartySupplyPlan(plan) {
    if (!plan || !(plan.metadata && plan.metadata.p0PotionPolicy4500)) return null;
    const kind = String(plan.kind || '');
    if (!['RESTOCK_REQUIRED', 'SERVICE_TRAVEL', 'SERVICE_DELIVERY'].includes(kind)) return null;
    const deliveries = Array.isArray(plan.deliveries) ? plan.deliveries.filter((row) => row && Number(row.quantity) > 0) : [];
    if (!deliveries.length) return null;
    return { ...clone(plan), deliveries: clone(deliveries) };
  }

  _partySupplyDeliveryCommitted(chain) {
    if (!chain) return false;
    const execution = this.runtime.lastMerchantServiceExecution;
    if (!execution || String(execution.kind || '') !== 'SERVICE_DELIVERY' || !(execution.result && execution.result.committed === true)) return false;
    const executionAt = finite(execution.at, 0);
    if (executionAt <= 0 || executionAt < finite(chain.startedAt, 0)) return false;
    const targetName = String(chain.targetName || '');
    const executionTarget = String(execution.result && execution.result.targetName || '');
    if (targetName && executionTarget && targetName !== executionTarget) return false;
    return true;
  }

  _clearPartySupplyChain(reason = 'PARTY_SUPPLY_CHAIN_RELEASED') {
    const chain = this.partySupplyChain;
    if (!chain) return null;
    const now = this.now();
    this.partySupplyChain = null;
    this.stats.partySupplyChainReleases = (this.stats.partySupplyChainReleases || 0) + 1;
    this.lastPartySupplyChainRelease = {
      at: now,
      reason,
      targetName: chain.targetName || null,
      lastKind: chain.plan && chain.plan.kind || null,
      startedAt: chain.startedAt,
      refreshedAt: chain.refreshedAt,
      ageMs: Math.max(0, now - finite(chain.startedAt, now))
    };
    this._event('ALPHA27_PARTY_SUPPLY_CHAIN_RELEASED', 'info', reason, clone(this.lastPartySupplyChainRelease));
    return null;
  }

  _latchPartySupplyPlan(plan) {
    const normalized = this._adaptivePartySupplyPlan(plan);
    if (!normalized) return null;
    const now = this.now();
    const targetName = normalized.target && String(normalized.target.name || '') || null;
    const existing = this.partySupplyChain;
    const sameTarget = !!(existing && String(existing.targetName || '') === String(targetName || ''));
    if (existing && !sameTarget) return clone(existing.plan);

    if (!existing) {
      this.stats.partySupplyChainLatches = (this.stats.partySupplyChainLatches || 0) + 1;
      this._event('ALPHA27_PARTY_SUPPLY_CHAIN_LATCHED', 'info', 'ADAPTIVE_PARTY_SUPPLY_CHAIN_STARTED', {
        targetName,
        kind: normalized.kind,
        planId: normalized.id || null
      });
    } else {
      this.stats.partySupplyChainRefreshes = (this.stats.partySupplyChainRefreshes || 0) + 1;
    }

    this.partySupplyChain = {
      startedAt: existing ? existing.startedAt : now,
      refreshedAt: now,
      targetName,
      plan: clone(normalized)
    };
    return clone(normalized);
  }

  _partySupplyTerminalHold(plan) {
    if (!plan || String(plan.kind || '') !== 'HOLD') return false;
    return ['FARMER_POTION_TARGET_SATISFIED', 'NO_SERVICE_NEED', 'STAND_IDLE'].includes(String(plan.reason || ''));
  }

  criticalPartySupplyPlan() {
    const now = this.now();
    const current = this.runtime.lastMerchantServicePlan;
    const latched = this.partySupplyChain;

    if (latched && this._partySupplyDeliveryCommitted(latched)) {
      return this._clearPartySupplyChain('PARTY_SUPPLY_DELIVERY_COMMITTED');
    }

    const adaptive = this._adaptivePartySupplyPlan(current);
    if (adaptive) {
      const at = finite(adaptive.at, 0);
      if (at > 0 && now - at <= this._partySupplyPlanFreshMs()) {
        if (!latched || String(latched.targetName || '') === String(adaptive.target && adaptive.target.name || '')) {
          return this._latchPartySupplyPlan(adaptive);
        }
      }
    }

    if (!this.partySupplyChain) return null;
    const chain = this.partySupplyChain;
    const ageMs = Math.max(0, now - finite(chain.startedAt, now));
    if (ageMs > this._partySupplyChainTimeoutMs()) return this._clearPartySupplyChain('PARTY_SUPPLY_CHAIN_TIMEOUT');

    if (this._partySupplyTerminalHold(current)) {
      const currentAt = finite(current && current.at, 0);
      if (currentAt <= 0 || currentAt >= finite(chain.startedAt, 0)) return this._clearPartySupplyChain(`PARTY_SUPPLY_${String(current.reason || 'NO_SERVICE_NEED')}`);
    }

    // Keep the chain alive across transient planner HOLDs such as
    // CONTROLLED_SUBSYSTEM_BUSY while vendor/farmer travel is in progress.
    return clone(chain.plan);
  }

  preemptReservedLowRiskForPartySupply(active, plan) {
    if (!active || active.state !== 'RESERVED' || !['SELL', 'BANK'].includes(String(active.type || ''))) return false;
    const engine = this.runtime.transactionEngine;
    if (!engine || typeof engine.cancel !== 'function') return false;
    try {
      const result = engine.cancel(active.id, 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT');
      const cancelled = result === true || !!(result && result.cancelled === true);
      if (!cancelled) {
        this.stats.partySupplyPreemptionFailures = (this.stats.partySupplyPreemptionFailures || 0) + 1;
        this.lastMerchantAction = {
          at: this.now(),
          transactionId: active.id,
          type: active.type,
          result: 'HOLD',
          reason: result && result.reason || 'PARTY_SUPPLY_PREEMPT_CANCEL_REJECTED',
          serviceKind: plan && plan.kind || null,
          serviceTarget: plan && plan.target && plan.target.name || null
        };
        this._event('ALPHA27_PARTY_SUPPLY_PREEMPT_FAILED_SAFE', 'warn', this.lastMerchantAction.reason, this.lastMerchantAction);
        return false;
      }
      this.stats.partySupplyLowRiskPreemptions = (this.stats.partySupplyLowRiskPreemptions || 0) + 1;
      this.lastMerchantAction = {
        at: this.now(),
        transactionId: active.id,
        type: active.type,
        result: 'ABORTED',
        reason: 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT',
        serviceKind: plan && plan.kind || null,
        serviceTarget: plan && plan.target && plan.target.name || null
      };
      this._event('ALPHA27_PARTY_SUPPLY_PREEMPTED_LOW_RISK_TRANSACTION', 'info', 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT', this.lastMerchantAction);
      return true;
    } catch (error) {
      this.stats.partySupplyPreemptionFailures = (this.stats.partySupplyPreemptionFailures || 0) + 1;
      this.lastMerchantAction = {
        at: this.now(),
        transactionId: active.id,
        type: active.type,
        result: 'HOLD',
        reason: 'PARTY_SUPPLY_PREEMPT_CANCEL_FAILED',
        error: errorDetails(error),
        serviceKind: plan && plan.kind || null,
        serviceTarget: plan && plan.target && plan.target.name || null
      };
      this._event('ALPHA27_PARTY_SUPPLY_PREEMPT_FAILED_SAFE', 'warn', 'PARTY_SUPPLY_PREEMPT_CANCEL_FAILED', this.lastMerchantAction);
      return false;
    }
  }

  holdForCriticalPartySupply(plan) {
    if (!plan) return false;
    this.stats.autonomousMerchantHolds += 1;
    this.stats.partySupplyServiceChainHolds = (this.stats.partySupplyServiceChainHolds || 0) + 1;
    this.lastMerchantPlan = {
      at: this.now(),
      action: 'HOLD',
      reason: 'PARTY_SUPPLY_SERVICE_CHAIN_ACTIVE',
      serviceKind: plan.kind,
      target: clone(plan.target || null),
      deliveries: clone(plan.deliveries || [])
    };
    return true;
  }

  async executeEconomyRequest(request) {
    if (!request) return false;
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

  async cycle() {
    this.stats.autonomousMerchantCycles += 1;
    if (!this.atomic.merchantActive() || !this.atomic.supervisorAllowed() || this.atomic.merchantInCombat()) { this.stats.autonomousMerchantHolds += 1; return false; }
    const productionStatus = typeof this.runtime.merchantProductionStatus === 'function' ? this.runtime.merchantProductionStatus() : null;
    if (productionStatus && (productionStatus.executionPending === true || productionStatus.controlled && productionStatus.controlled.busy === true)) {
      this.stats.autonomousMerchantHolds += 1;
      this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'MERCHANT_PRODUCTION_BUSY' };
      return false;
    }
    this.ensureAutonomousAuthorities();
    if (this.atomic.serviceTravelBusy || this.atomic.merchantBusy) return false;
    if (this.runtime._controlledMerchantBusy && this.runtime._controlledMerchantBusy()) return false;
    const service = this.runtime.controlledMerchantService;
    if (service && service.activeOperation && service.activeOperation.state === 'RECOVERING' && typeof service.reconcile === 'function') { service.reconcile(); return true; }

    // Finish/reconcile already-started economy work, but a fresh critical party
    // potion chain may safely preempt a merely RESERVED low-risk SELL/BANK row.
    // No EXECUTING/VERIFYING/RECOVERING transaction is ever interrupted here.
    if (this.reconcileRecovering()) return true;
    let supplyPlan = this.criticalPartySupplyPlan();
    const active = this.activeTransaction();
    if (active) {
      const lowRiskReserved = active.state === 'RESERVED' && ['SELL', 'BANK'].includes(String(active.type || ''));
      if (supplyPlan && lowRiskReserved) {
        if (this.preemptReservedLowRiskForPartySupply(active, supplyPlan)) {
          // Reservation released before any raw action; continue the same cycle so
          // the potion chain can make progress immediately.
        } else {
          // Fail closed: never execute the competing low-risk transaction merely
          // because cancellation was rejected or threw. Let the service chain
          // retain priority and re-evaluate the reservation on the next cycle.
          this.holdForCriticalPartySupply(supplyPlan);
          return false;
        }
      } else if (active.state === 'RESERVED') {
        const result = await this.runtime.controlledMerchant.execute(active.id);
        this.lastMerchantAction = { at: this.now(), transactionId: active.id, type: active.type, result: clone(result) };
        return true;
      } else {
        return false;
      }
    }

    // Critical party consumables keep priority. RESTOCK_REQUIRED is executed by
    // Alpha27; SERVICE_TRAVEL/SERVICE_DELIVERY remain owned by the controlled
    // merchant-service cycle. Keep the whole chain together so ordinary bank or
    // sell backlog cannot pull the merchant away between purchase and delivery.
    if (await this.restockPartyPotions()) return true;
    supplyPlan = this.criticalPartySupplyPlan();
    if (supplyPlan) {
      this.holdForCriticalPartySupply(supplyPlan);
      return false;
    }

    // Progression is processed before disposal. This restores the intended
    // Merchant lifecycle: COMPOUND/UPGRADE -> party gear delivery -> SELL -> BANK.
    // Family-scoped circuits still allow unrelated later stages to continue.
    let request = this.transactionFamilyOpen('UPGRADE') ? null : this.planUpgrade();
    if (!request && !this.transactionFamilyOpen('COMPOUND')) request = this.planCompound();
    if (request) return this.executeEconomyRequest(request);

    // Re-evaluate useful gear before any disposal action. A current GearProgression
    // reservation therefore always gets the chance to reach its Farmer first.
    if (await this.deliverGearGoal()) return true;

    const lowRiskRequest = this.planSellOrBank();
    if (lowRiskRequest && !this.transactionFamilyOpen(lowRiskRequest.type)) {
      return this.executeEconomyRequest(lowRiskRequest);
    }

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
    const chain = this.partySupplyChain;
    return {
      autonomous: true,
      centralLedgerPlanner: true,
      autonomousLowRiskDisposition: true,
      autonomousPotionRestock: true,
      autonomousGearGoalDelivery: true,
      economyBeforeNonCriticalGearDelivery: false,
      itemLifecycleOrder: ['UPGRADE', 'COMPOUND', 'GEAR_DELIVERY', 'SELL', 'BANK'],
      criticalPartySupplyPreemptsReservedLowRiskEconomy: true,
      criticalPartySupplyChainAtomicAcrossRestockTravelDelivery: true,
      partySupplyChainLatched: !!chain,
      partySupplyChain: chain ? {
        targetName: chain.targetName || null,
        planKind: chain.plan && chain.plan.kind || null,
        planId: chain.plan && chain.plan.id || null,
        startedAt: chain.startedAt,
        refreshedAt: chain.refreshedAt,
        ageMs: Math.max(0, this.now() - finite(chain.startedAt, this.now())),
        timeoutMs: this._partySupplyChainTimeoutMs()
      } : null,
      completedGearGoalClaims: this.completedGearGoalClaims instanceof Map ? this.completedGearGoalClaims.size : 0,
      gearGoalClaimSuppressions: this.gearGoalClaimSuppressions || 0,
      partySupplyServiceChainHolds: this.stats.partySupplyServiceChainHolds || 0,
      partySupplyLowRiskPreemptions: this.stats.partySupplyLowRiskPreemptions || 0,
      partySupplyPreemptionFailures: this.stats.partySupplyPreemptionFailures || 0,
      partySupplyChainLatches: this.stats.partySupplyChainLatches || 0,
      partySupplyChainRefreshes: this.stats.partySupplyChainRefreshes || 0,
      partySupplyChainReleases: this.stats.partySupplyChainReleases || 0,
      lastPartySupplyChainRelease: clone(this.lastPartySupplyChainRelease || null),
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
