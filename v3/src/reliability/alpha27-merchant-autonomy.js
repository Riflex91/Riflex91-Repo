'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, identityQuantity, rawFunction, errorDetails } = require('./alpha27-utils');
const { CONTROLLED_ACK, EXPECTED_DISPOSITIONS } = require('./alpha27-atomic-constants');
const { MERCHANT_SERVICE_ACK, TERMINAL_TX } = require('./alpha27-merchant-constants');
const { Alpha27MerchantPlanning } = require('./alpha27-merchant-planning');
const { Alpha27BankRecovery } = require('./alpha27-bank-recovery');
const { MerchantSelfGear } = require('./merchant-self-gear');

class Alpha27MerchantAutonomy extends Alpha27MerchantPlanning {
  constructor(runtime, atomic, shared) {
    super(runtime, atomic, shared);
    this.bankRecovery = new Alpha27BankRecovery(runtime, atomic, shared);
    this.selfGear = new MerchantSelfGear(runtime, atomic, shared);
    this.taskCoordinator = shared.taskCoordinator || runtime.merchantTaskCoordinator || null;
    this.collectionSession = null;
    this.lastCollectionSession = null;
    this.runtime._merchantCollectionSessionActive = () => !!(this._updateCollectionSession().active);
  }

  _taskCurrent() {
    return this.taskCoordinator && typeof this.taskCoordinator.current === 'function' ? this.taskCoordinator.current() : null;
  }

  _taskAcquire(kind, key, metadata = {}) {
    if (!this.taskCoordinator || typeof this.taskCoordinator.acquire !== 'function') return { acquired: true, task: null };
    return this.taskCoordinator.acquire('ALPHA27', kind, key, metadata);
  }

  _taskRelease(key, reason, details = {}) {
    if (!this.taskCoordinator || typeof this.taskCoordinator.release !== 'function') return false;
    return this.taskCoordinator.release('ALPHA27', key, reason, details);
  }

  _taskBlockedByOther() {
    const task = this._taskCurrent();
    return !!(task && task.owner !== 'ALPHA27');
  }

  _collectionSettleMs() {
    return Math.max(3000, Math.min(30000, finite(this.options && this.options.merchantCollectionSettleMs, 8000)));
  }

  _collectionSnapshot() {
    const c = characterOf(this.runtime) || {};
    const items = inventoryOf(this.root);
    const capacity = Math.max(items.length, Math.floor(finite(c.isize, items.length)));
    const occupied = items.slice(0, capacity).filter(Boolean).length;
    const logistics = this.runtime.controlledPartyLogistics;
    const maxDistance = Math.max(100, finite(logistics && logistics.config && logistics.config.maxTransferDistance, 380));
    const registry = this.runtime.characterRegistry && typeof this.runtime.characterRegistry.status === 'function' ? this.runtime.characterRegistry.status() : { characters: [] };
    const farmers = [];
    let transferable = 0;
    for (const row of Array.isArray(registry && registry.characters) ? registry.characters : []) {
      if (!row || row.name === c.name || String(row.ctype || '').toLowerCase() === 'merchant' || row.rip === true) continue;
      if (c.map && row.map && String(c.map) !== String(row.map)) continue;
      const x = finite(row.real_x != null ? row.real_x : row.x);
      const y = finite(row.real_y != null ? row.real_y : row.y);
      const cx = finite(c.real_x != null ? c.real_x : c.x);
      const cy = finite(c.real_y != null ? c.real_y : c.y);
      const distance = x == null || y == null || cx == null || cy == null ? Infinity : Math.hypot(x - cx, y - cy);
      if (!Number.isFinite(distance) || distance > maxDistance) continue;
      let rowTransferable = 0;
      for (const item of Array.isArray(row.inventory) ? row.inventory : []) {
        if (!item) continue;
        try {
          const safe = logistics && typeof logistics._safeLootDescriptor === 'function' ? logistics._safeLootDescriptor(item) : null;
          if (safe && safe.ok) rowTransferable += 1;
        } catch (_) {}
      }
      transferable += rowTransferable;
      farmers.push({ name: row.name, distance, transferable: rowTransferable });
    }
    const activeGrants = logistics && logistics.activeLootGrants instanceof Map ? logistics.activeLootGrants.size : 0;
    return { capacity, occupied, freeSlots: Math.max(0, capacity - occupied), transferable, activeGrants, farmers };
  }

  collectionStatus() {
    const snap = this._collectionSnapshot();
    return {
      active: !!this.collectionSession,
      session: clone(this.collectionSession),
      lastSession: clone(this.lastCollectionSession),
      settleMs: this._collectionSettleMs(),
      snapshot: snap
    };
  }

  _updateCollectionSession() {
    const now = this.now();
    const snap = this._collectionSnapshot();
    const nearFarmers = snap.farmers.length > 0;
    if (!this.collectionSession && nearFarmers && snap.freeSlots > 0 && (snap.transferable > 0 || snap.activeGrants > 0)) {
      this.collectionSession = { startedAt: now, lastProgressAt: now, lastOccupied: snap.occupied, reason: 'FARMER_LOOT_COLLECTION', farmers: snap.farmers.map((row) => row.name) };
      this._event('ALPHA27_COLLECTION_SESSION_STARTED', 'info', 'FARMER_LOOT_COLLECTION', { snapshot: snap });
    }
    const session = this.collectionSession;
    if (!session) return { active: false, snapshot: snap };

    if (snap.occupied > finite(session.lastOccupied, 0)) {
      session.lastOccupied = snap.occupied;
      session.lastProgressAt = now;
    }
    if (snap.freeSlots <= 0) {
      this.lastCollectionSession = { ...clone(session), endedAt: now, endReason: 'MERCHANT_INVENTORY_FULL' };
      this.collectionSession = null;
      this._event('ALPHA27_COLLECTION_SESSION_RELEASED', 'info', 'MERCHANT_INVENTORY_FULL', this.lastCollectionSession);
      return { active: false, snapshot: snap, released: true, reason: 'MERCHANT_INVENTORY_FULL' };
    }
    if (snap.transferable <= 0 && snap.activeGrants <= 0 && now - finite(session.lastProgressAt, now) >= this._collectionSettleMs()) {
      this.lastCollectionSession = { ...clone(session), endedAt: now, endReason: 'FARMERS_DRAINED' };
      this.collectionSession = null;
      this._event('ALPHA27_COLLECTION_SESSION_RELEASED', 'info', 'FARMERS_DRAINED', this.lastCollectionSession);
      return { active: false, snapshot: snap, released: true, reason: 'FARMERS_DRAINED' };
    }
    return { active: true, snapshot: snap, session };
  }

  holdForCollectionSession(state) {
    if (!state || state.active !== true) return false;
    this.stats.autonomousMerchantHolds += 1;
    this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'FARMER_LOOT_COLLECTION_ACTIVE', collection: clone(state) };
    return true;
  }

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
    const serviceChainId = normalized.metadata && normalized.metadata.p0PotionServiceChainId || null;
    const batch = normalized.metadata && normalized.metadata.p0PotionBatch === true;
    const existing = this.partySupplyChain;
    const sameTarget = !!(existing && String(existing.targetName || '') === String(targetName || ''));
    const sameBatch = !!(
      existing
      && batch
      && serviceChainId
      && String(existing.serviceChainId || '') === String(serviceChainId)
    );
    if (existing && !sameTarget && !sameBatch) return clone(existing.plan);
    if (existing && !sameTarget && sameBatch) {
      this.stats.partySupplyChainRefreshes = (this.stats.partySupplyChainRefreshes || 0) + 1;
      this._event('ALPHA27_PARTY_SUPPLY_BATCH_TARGET_SWITCH', 'info', 'SAME_BATCH_NEXT_FARMER', {
        from: existing.targetName || null,
        to: targetName,
        serviceChainId
      });
    }

    if (!existing) {
      this.stats.partySupplyChainLatches = (this.stats.partySupplyChainLatches || 0) + 1;
      this._event('ALPHA27_PARTY_SUPPLY_CHAIN_LATCHED', 'info', 'ADAPTIVE_PARTY_SUPPLY_CHAIN_STARTED', {
        targetName,
        kind: normalized.kind,
        planId: normalized.id || null
      });
    } else if (sameTarget) {
      this.stats.partySupplyChainRefreshes = (this.stats.partySupplyChainRefreshes || 0) + 1;
    }

    this.partySupplyChain = {
      startedAt: existing ? existing.startedAt : now,
      refreshedAt: now,
      targetName,
      serviceChainId,
      batch,
      plan: clone(normalized)
    };
    return clone(normalized);
  }

  _partySupplyTerminalHold(plan) {
    if (!plan || String(plan.kind || '') !== 'HOLD') return false;
    return ['FARMER_POTION_TARGET_SATISFIED', 'NO_SERVICE_NEED', 'STAND_IDLE'].includes(String(plan.reason || ''));
  }

  _p0BatchContinuation() {
    const policy = this.runtime && this.runtime.p0PotionPolicy4500;
    const chain = policy && policy.serviceChain;
    if (!chain || chain.batch !== true) return null;
    const pending = Array.isArray(chain.targets) ? chain.targets.filter((row) => row && row.status === 'PENDING') : [];
    if (!pending.length) return null;
    return {
      kind: 'HOLD',
      reason: 'POTION_BATCH_ADVANCING_TO_NEXT_FARMER',
      target: chain.target || pending[0].target || null,
      deliveries: chain.deliveries || pending[0].deliveries || [],
      metadata: {
        p0PotionPolicy4500: true,
        p0PotionBatch: true,
        p0PotionServiceChainId: chain.id,
        p0PotionBatchPendingCount: pending.length
      }
    };
  }

  criticalPartySupplyPlan() {
    const now = this.now();
    const current = this.runtime.lastMerchantServicePlan;
    const latched = this.partySupplyChain;

    if (latched && this._partySupplyDeliveryCommitted(latched)) {
      this._clearPartySupplyChain('PARTY_SUPPLY_DELIVERY_COMMITTED');
      const continuation = this._p0BatchContinuation();
      if (continuation) return continuation;
      return null;
    }

    const adaptive = this._adaptivePartySupplyPlan(current);
    if (adaptive) {
      const at = finite(adaptive.at, 0);
      if (at > 0 && now - at <= this._partySupplyPlanFreshMs()) {
        const adaptiveChainId = adaptive.metadata && adaptive.metadata.p0PotionServiceChainId || null;
        const sameBatch = !!(
          latched
          && adaptive.metadata && adaptive.metadata.p0PotionBatch === true
          && adaptiveChainId
          && String(latched.serviceChainId || '') === String(adaptiveChainId)
        );
        if (!latched || String(latched.targetName || '') === String(adaptive.target && adaptive.target.name || '') || sameBatch) {
          return this._latchPartySupplyPlan(adaptive);
        }
      }
    }

    if (!this.partySupplyChain) {
      const continuation = this._p0BatchContinuation();
      if (continuation) return continuation;
      return null;
    }
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

  preemptReservedForPartySupply(active, plan) {
    const type = String(active && active.type || '');
    const preemptible = ['SELL', 'BANK', 'UPGRADE', 'COMPOUND'].includes(type);
    if (!active || active.state !== 'RESERVED' || !preemptible) return false;
    const engine = this.runtime.transactionEngine;
    if (!engine || typeof engine.cancel !== 'function') return false;

    // RESERVED is the transaction engine's persisted pre-action state. Once a
    // mutation enters EXECUTING/VERIFYING/RECOVERING we never cancel it for
    // supply; its raw Adventure Land outcome must be reconciled first.
    const live = typeof engine.get === 'function' ? engine.get(active.id) : active;
    if (!live || live.state !== 'RESERVED' || String(live.type || '') !== type) return false;

    try {
      const result = engine.cancel(active.id, 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT');
      const cancelled = result === true || !!(result && result.cancelled === true);
      if (!cancelled) {
        this.stats.partySupplyPreemptionFailures = (this.stats.partySupplyPreemptionFailures || 0) + 1;
        this.lastMerchantAction = {
          at: this.now(),
          transactionId: active.id,
          type,
          result: 'HOLD',
          reason: result && result.reason || 'PARTY_SUPPLY_PREEMPT_CANCEL_REJECTED',
          serviceKind: plan && plan.kind || null,
          serviceTarget: plan && plan.target && plan.target.name || null
        };
        this._event('ALPHA27_PARTY_SUPPLY_PREEMPT_FAILED_SAFE', 'warn', this.lastMerchantAction.reason, this.lastMerchantAction);
        return false;
      }

      if (['UPGRADE', 'COMPOUND'].includes(type)) {
        this.stats.partySupplyMutationPreemptions = (this.stats.partySupplyMutationPreemptions || 0) + 1;
      } else {
        this.stats.partySupplyLowRiskPreemptions = (this.stats.partySupplyLowRiskPreemptions || 0) + 1;
      }
      this.lastMerchantAction = {
        at: this.now(),
        transactionId: active.id,
        type,
        result: 'ABORTED',
        reason: 'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT',
        preemptedBeforeRawAction: true,
        serviceKind: plan && plan.kind || null,
        serviceTarget: plan && plan.target && plan.target.name || null
      };
      this._event(
        'ALPHA27_PARTY_SUPPLY_PREEMPTED_RESERVED_TRANSACTION',
        'info',
        'PARTY_SUPPLY_SERVICE_CHAIN_PREEMPT',
        this.lastMerchantAction
      );
      return true;
    } catch (error) {
      this.stats.partySupplyPreemptionFailures = (this.stats.partySupplyPreemptionFailures || 0) + 1;
      this.lastMerchantAction = {
        at: this.now(),
        transactionId: active.id,
        type,
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
    if (request.type === 'BANK' && result && result.committed === true && this.runtime.merchantBankCatalog && typeof this.runtime.merchantBankCatalog.observe === 'function') {
      this.runtime.merchantBankCatalog.observe(characterOf(this.runtime));
    }
    this.lastMerchantAction = { at: this.now(), transactionId: planned.transaction.id, type: request.type, result: clone(result) };
    return true;
  }

  async progressOrDeliverFarmerGear() {
    const finalization = typeof this.planGearDeliveryFinalization === 'function'
      ? this.planGearDeliveryFinalization()
      : { state: 'NONE', reason: 'FINALIZATION_PLANNER_UNAVAILABLE' };
    // Preserve the pre-existing delivery contract when there is nothing to
    // finalize. In production deliverGearGoal() simply returns false without a
    // candidate; tests/patch layers may also provide their own delivery source.
    if (!finalization || finalization.state === 'NONE') return this.deliverGearGoal();

    if (finalization.state === 'HOLD') {
      this.stats.autonomousMerchantHolds += 1;
      this.lastMerchantPlan = {
        at: this.now(),
        action: 'HOLD',
        reason: finalization.reason || 'GEAR_DELIVERY_FINALIZATION_HOLD',
        finalization: clone({
          state: finalization.state,
          reason: finalization.reason,
          targetLevel: finalization.targetLevel,
          retryAt: finalization.retryAt,
          targetName: finalization.candidate && finalization.candidate.goal && finalization.candidate.goal.character,
          slot: finalization.candidate && finalization.candidate.goal && finalization.candidate.goal.slot,
          item: finalization.candidate && finalization.candidate.item && finalization.candidate.item.name,
          level: finalization.candidate && finalization.candidate.item ? levelOf(finalization.candidate.item) : null,
          sourceIndex: finalization.candidate && finalization.candidate.item && finalization.candidate.item.index
        })
      };
      // A safe HOLD is not progress. Returning false lets the caller drain any
      // other executable progression work and, if none exists, release the
      // PROGRESSION_BATCH lease so Production/Collection cannot be starved.
      return false;
    }

    if (finalization.state === 'MUTATE' && finalization.request) {
      const family = String(finalization.request.type || '').toUpperCase();
      if (this.transactionFamilyOpen(family)) {
        this.stats.autonomousMerchantHolds += 1;
        this.lastMerchantPlan = {
          at: this.now(),
          action: 'HOLD',
          reason: 'GEAR_FINALIZATION_TRANSACTION_CIRCUIT_OPEN',
          type: family,
          targetLevel: finalization.targetLevel,
          request: clone(finalization.request)
        };
        return false;
      }
      const acted = await this.executeEconomyRequest(finalization.request);
      if (!acted) {
        // Never fall through to delivery after a targeted finalization request
        // was rejected. A later tick may re-evaluate the exact live identity,
        // but this tick must not keep the global progression task leased.
        this.stats.autonomousMerchantHolds += 1;
        this.lastMerchantPlan = {
          at: this.now(),
          action: 'HOLD',
          reason: 'GEAR_FINALIZATION_TRANSACTION_NOT_EXECUTED',
          type: family,
          targetLevel: finalization.targetLevel,
          request: clone(finalization.request)
        };
        return false;
      }
      return true;
    }

    if (finalization.state === 'READY') return this.deliverGearGoal();
    return false;
  }

  async cycle() {
    this.stats.autonomousMerchantCycles += 1;
    if (!this.atomic.merchantActive() || !this.atomic.supervisorAllowed() || this.atomic.merchantInCombat()) { this.stats.autonomousMerchantHolds += 1; return false; }

    const taskAtStart = this._taskCurrent();
    if (taskAtStart && taskAtStart.owner !== 'ALPHA27') {
      this.stats.autonomousMerchantHolds += 1;
      this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: 'MERCHANT_TASK_OWNED_BY_OTHER_SUBSYSTEM', task: clone(taskAtStart) };
      return false;
    }

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

    if (this.reconcileRecovering()) return true;
    let supplyPlan = this.criticalPartySupplyPlan();
    const taskBeforeSupply = this._taskCurrent();
    if (supplyPlan
      && ['RESTOCK_REQUIRED', 'SERVICE_TRAVEL', 'SERVICE_DELIVERY'].includes(String(supplyPlan.kind || ''))
      && taskBeforeSupply
      && taskBeforeSupply.owner === 'ALPHA27'
      && taskBeforeSupply.kind === 'BANK_RECOVERY') {
      this._taskRelease(taskBeforeSupply.key, 'CRITICAL_PARTY_SUPPLY_PREEMPTS_BANK_WORK');
      if (this.bankRecovery && typeof this.bankRecovery._finishBatch === 'function') {
        this.bankRecovery._finishBatch('CRITICAL_PARTY_SUPPLY_PREEMPT');
      }
    }
    const active = this.activeTransaction();
    if (active) {
      if (supplyPlan && active.state === 'RESERVED') {
        if (!this.preemptReservedForPartySupply(active, supplyPlan)) {
          // Unknown/non-preemptible reservations are never executed ahead of
          // critical party supply. Hold fail-closed until they are explicitly
          // resolved instead of deepening the supply outage.
          this.holdForCriticalPartySupply(supplyPlan);
          return false;
        }
      } else if (active.state === 'RESERVED') {
        const result = await this.runtime.controlledMerchant.execute(active.id);
        this.lastMerchantAction = { at: this.now(), transactionId: active.id, type: active.type, result: clone(result) };
        return true;
      } else {
        // EXECUTING/VERIFYING/RECOVERING mutations are not safe to preempt.
        return false;
      }
    }

    if (await this.restockPartyPotions()) return true;
    supplyPlan = this.criticalPartySupplyPlan();
    if (supplyPlan) {
      this.holdForCriticalPartySupply(supplyPlan);
      return false;
    }

    let task = this._taskCurrent();
    let progressionAttemptedThisCycle = false;

    // Once a Bank work block starts, keep it latched until the planned rows are
    // retrieved or the bank explicitly hands control back for processing.
    if (task && task.owner === 'ALPHA27' && task.kind === 'BANK_RECOVERY' && this.bankRecovery) {
      const recoveryPlan = this.bankRecovery.plan();
      if (recoveryPlan && recoveryPlan.action !== 'HOLD') {
        this.lastMerchantPlan = { at: this.now(), action: 'BANK_RECOVERY', reason: recoveryPlan.reason, recovery: clone(recoveryPlan) };
        const acted = await this.bankRecovery.execute(recoveryPlan);
        if (acted) return true;
      }
      if (recoveryPlan && recoveryPlan.action === 'HOLD' && recoveryPlan.keepTask === true) {
        this.lastMerchantPlan = { at: this.now(), action: 'HOLD', reason: recoveryPlan.reason, recovery: clone(recoveryPlan) };
        return false;
      }
      this._taskRelease(task.key, recoveryPlan && recoveryPlan.reason || 'BANK_RECOVERY_WORK_BLOCK_COMPLETE', {
        recovery: clone(recoveryPlan)
      });
      task = null;
    }

    // A collection session owns the Merchant until the inventory is actually
    // full or every nearby Farmer has been drained for the settle window.
    if (task && task.owner === 'ALPHA27' && task.kind === 'COLLECTION') {
      const collection = this._updateCollectionSession();
      if (collection.active) {
        this.holdForCollectionSession(collection);
        return false;
      }
      this._taskRelease(task.key, collection.reason || 'COLLECTION_COMPLETE', { collection: clone(collection) });
      task = null;
    }

    const explicitOperatorSell = typeof this.planExplicitOperatorSell === 'function' ? this.planExplicitOperatorSell() : null;
    if (explicitOperatorSell && task && task.owner === 'ALPHA27' && task.kind === 'PROGRESSION_BATCH') {
      this._taskRelease(task.key, 'OPERATOR_SELL_PREEMPTS_PROGRESSION_BATCH', { item: explicitOperatorSell.item || null, index: explicitOperatorSell.index });
      task = null;
    }
    if (explicitOperatorSell && !task && !this.transactionFamilyOpen('SELL')) {
      const lock = this._taskAcquire('DISPOSAL', 'alpha27:operator-disposal-sell', { type: 'SELL', source: 'OPERATOR_ITEM_PERMISSION' });
      if (!lock.acquired) return false;
      try {
        this.lastMerchantPlan = { at: this.now(), action: 'EXECUTE', reason: 'OPERATOR_ITEM_PERMISSION_SELL', request: clone(explicitOperatorSell) };
        return await this.executeEconomyRequest(explicitOperatorSell);
      } finally {
        this._taskRelease('alpha27:operator-disposal-sell', 'OPERATOR_SELL_STEP_COMPLETE');
      }
    }

    // Progression is a batch task because COMPOUND/UPGRADE/SelfGear share the
    // same service area. Do not let Production/Exchange pull the Merchant away
    // between individual mutations.
    if (task && task.owner === 'ALPHA27' && task.kind === 'PROGRESSION_BATCH') {
      progressionAttemptedThisCycle = true;
      // Farmer gear is first-class work, but a ready lower tier is never
      // delivered while that exact gear path can still be safely improved.
      // Targeted finalization runs before delivery; unrelated mutation backlog
      // remains behind Farmer delivery so it cannot starve the party upgrade.
      if (await this.progressOrDeliverFarmerGear()) return true;
      let request = this.transactionFamilyOpen('COMPOUND') ? null : this.planCompound();
      if (!request && !this.transactionFamilyOpen('UPGRADE')) request = this.planUpgrade();
      if (request) {
        const acted = await this.executeEconomyRequest(request);
        if (acted) return true;
        this.stats.progressionTaskNoProgressReleases = (this.stats.progressionTaskNoProgressReleases || 0) + 1;
        this._taskRelease(task.key, 'PROGRESSION_REQUEST_NOT_EXECUTED', { type: request.type || null, request: clone(request) });
        this._event('ALPHA27_PROGRESSION_TASK_RELEASED_NO_PROGRESS', 'warn', 'PROGRESSION_REQUEST_NOT_EXECUTED', { type: request.type || null });
        task = null;
      }
      if (task && this.selfGear && await this.selfGear.cycle()) {
        this.lastMerchantPlan = { at: this.now(), action: 'SELF_GEAR', reason: 'MERCHANT_EQUIPMENT_PROGRESSION_AFTER_FARMER_WORK', selfGear: this.selfGear.status() };
        return true;
      }
      if (task) {
        this._taskRelease(task.key, 'PROGRESSION_BATCH_DRAINED');
        task = null;
      }
    }

    if (!task) {
      const collection = this._updateCollectionSession();
      if (collection.active) {
        const lock = this._taskAcquire('COLLECTION', 'alpha27:collection', { farmers: collection.session && collection.session.farmers || [] });
        if (lock.acquired) {
          this.holdForCollectionSession(collection);
          return false;
        }
      }

      // Periodic bank service outranks ordinary progression when due. One
      // acquire covers travel, bank visibility and the bounded retrieve batch,
      // preventing bank<->upgrade ping-pong between individual items.
      if (this.bankRecovery) {
        const recoveryPlan = this.bankRecovery.plan();
        if (recoveryPlan && recoveryPlan.action !== 'HOLD') {
          const lock = this._taskAcquire('BANK_RECOVERY', 'alpha27:bank-recovery', { action: recoveryPlan.action, reason: recoveryPlan.reason });
          if (lock.acquired) {
            this.lastMerchantPlan = { at: this.now(), action: 'BANK_RECOVERY', reason: recoveryPlan.reason, recovery: clone(recoveryPlan) };
            const acted = await this.bankRecovery.execute(recoveryPlan);
            if (acted) return true;
            this._taskRelease('alpha27:bank-recovery', 'BANK_RECOVERY_NO_PROGRESS', { recovery: clone(recoveryPlan) });
          }
        }
      }

      const progression = progressionAttemptedThisCycle
        ? { acquired: false, reason: 'PROGRESSION_ALREADY_ATTEMPTED_THIS_CYCLE' }
        : this._taskAcquire('PROGRESSION_BATCH', 'alpha27:progression-batch', { serviceArea: 'newupgrade' });
      if (progression.acquired) {
        if (await this.progressOrDeliverFarmerGear()) return true;
        let request = this.transactionFamilyOpen('COMPOUND') ? null : this.planCompound();
        if (!request && !this.transactionFamilyOpen('UPGRADE')) request = this.planUpgrade();
        if (request) {
          const acted = await this.executeEconomyRequest(request);
          if (acted) return true;
          this.stats.progressionTaskNoProgressReleases = (this.stats.progressionTaskNoProgressReleases || 0) + 1;
          this._taskRelease('alpha27:progression-batch', 'PROGRESSION_REQUEST_NOT_EXECUTED', { type: request.type || null, request: clone(request) });
          this._event('ALPHA27_PROGRESSION_TASK_RELEASED_NO_PROGRESS', 'warn', 'PROGRESSION_REQUEST_NOT_EXECUTED', { type: request.type || null });
        } else {
          if (this.selfGear && await this.selfGear.cycle()) {
            this.lastMerchantPlan = { at: this.now(), action: 'SELF_GEAR', reason: 'MERCHANT_EQUIPMENT_PROGRESSION_AFTER_FARMER_WORK', selfGear: this.selfGear.status() };
            return true;
          }
          this._taskRelease('alpha27:progression-batch', 'NO_PROGRESSION_WORK');
        }
      }
    }

    const lowRiskRequest = this.planSellOrBank();
    if (lowRiskRequest && lowRiskRequest.type === 'SELL' && !this.transactionFamilyOpen('SELL')) {
      const lock = this._taskAcquire('DISPOSAL', 'alpha27:disposal-sell', { type: 'SELL' });
      if (!lock.acquired) return false;
      try { return await this.executeEconomyRequest(lowRiskRequest); }
      finally { this._taskRelease('alpha27:disposal-sell', 'SELL_STEP_COMPLETE'); }
    }

    if (lowRiskRequest && lowRiskRequest.type === 'BANK' && !this.transactionFamilyOpen('BANK')) {
      const lock = this._taskAcquire('DISPOSAL', 'alpha27:disposal-bank', { type: 'BANK' });
      if (!lock.acquired) return false;
      try { return await this.executeEconomyRequest(lowRiskRequest); }
      finally { this._taskRelease('alpha27:disposal-bank', 'BANK_STEP_COMPLETE'); }
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
      taskCoordinator: this.taskCoordinator ? this.taskCoordinator.status() : null,
      nonPreemptiveMerchantTasks: true,
      farmerGearBeforeMerchantSelfGear: true,
      autonomousLowRiskDisposition: true,
      autonomousPotionRestock: true,
      autonomousGearGoalDelivery: true,
      targetedGearFinalizationBeforeDelivery: true,
      targetedGearFinalizationPolicy: 'HIGHEST_CURRENT_SAFE_REACHABLE_LEVEL',
      targetedGearFinalization: {
        last: clone(this.lastGearDeliveryFinalization),
        stats: clone(this.gearDeliveryFinalizationStats)
      },
      economyBeforeNonCriticalGearDelivery: false,
      gearDeliveryLifecycleOrder: ['TARGETED_COMPOUND_OR_UPGRADE', 'GEAR_DELIVERY'],
      itemLifecycleOrder: ['COMPOUND', 'UPGRADE', 'GEAR_DELIVERY', 'SELL', 'BANK'],
      bankRecoveryLifecycle: ['BANK_PROBE', 'BATCH_RETRIEVE_WORK_BLOCK', 'COMPOUND_OR_UPGRADE', 'GEAR_DELIVERY_OR_SELL', 'BANK_FALLBACK'],
      bankRecovery: this.bankRecovery ? this.bankRecovery.status() : null,
      collectionSession: this.collectionStatus(),
      collectionSessionPreemptsEconomy: true,
      selfGear: this.selfGear ? this.selfGear.status() : null,
      selfGearLifecycle: ['UNEQUIP', 'ATOMIC_UPGRADE_OR_COMPOUND', 'REEQUIP_OR_FALLBACK'],
      criticalPartySupplyPreemptsReservedLowRiskEconomy: true,
      criticalPartySupplyPreemptsUnexecutedReservedMutations: true,
      criticalPartySupplyNeverPreemptsExecutingMutation: true,
      criticalPartySupplyChainAtomicAcrossRestockTravelDelivery: true,
      criticalPartySupplyBatchAtomicAcrossFarmers: true,
      partySupplyChainLatched: !!chain,
      partySupplyChain: chain ? {
        targetName: chain.targetName || null,
        serviceChainId: chain.serviceChainId || null,
        batch: chain.batch === true,
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
      partySupplyMutationPreemptions: this.stats.partySupplyMutationPreemptions || 0,
      partySupplyPreemptionFailures: this.stats.partySupplyPreemptionFailures || 0,
      partySupplyChainLatches: this.stats.partySupplyChainLatches || 0,
      partySupplyChainRefreshes: this.stats.partySupplyChainRefreshes || 0,
      partySupplyChainReleases: this.stats.partySupplyChainReleases || 0,
      progressionTaskNoProgressReleases: this.stats.progressionTaskNoProgressReleases || 0,
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
