'use strict';

const { BankSpaceAction } = require('./bank-capacity-manager');

const CONTROLLED_SPACE_RECOVERY_MODE = 'controlled-live-default-off';
const CONTROLLED_SPACE_RECOVERY_ACK = 'ALPHA19_SPACE_RECOVERY';
const CHILD_ACK = 'CONTROLLED_CANARY';
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);
const MAX_RAW_ACTIONS_PER_OPERATION = 3;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

class ControlledMerchantSpaceRecovery {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.log = options.log || null;
    this.now = options.now || (() => Date.now());
    this.journal = options.journal;
    this.manager = options.manager;
    this.transactionEngine = options.transactionEngine;
    this.ledger = options.ledger;
    this.controlledMerchant = options.controlledMerchant;
    this.expansionTransactions = options.expansionTransactions;
    this.controlledExpansion = options.controlledExpansion;
    this.controlledConsolidation = options.controlledConsolidation;
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'HEALTHY' }));
    this.observeBank = options.observeBank || (() => null);
    this.getGameData = options.getGameData || (() => ({}));
    this.getContentDrift = options.getContentDrift || (() => null);
    this.enabled = false;
    this.busy = false;
    this.lastResult = null;
    this.stats = { plans: 0, attempts: 0, committed: 0, blocked: 0, failedSafe: 0, rejected: 0, emergencyReclaims: 0, expansionExecutions: 0, consolidationExecutions: 0, bankDeposits: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'controlled-space-recovery', event, severity, reason, data });
  }

  configure(config = {}) {
    const wantsLive = config.enabled === true;
    if (wantsLive && config.ack !== CONTROLLED_SPACE_RECOVERY_ACK) {
      this.enabled = false;
      this._event('SPACE_RECOVERY_ENABLE_REJECTED', 'warn', 'ACK_REQUIRED');
      return this.status();
    }
    this.enabled = wantsLive;
    this._event('SPACE_RECOVERY_CONFIG_CHANGED', 'warn', wantsLive ? 'EXPLICIT_ALPHA19_ENABLE' : 'DISABLED', { enabled: this.enabled });
    return this.status();
  }

  disable(reason = 'OPERATOR_DISABLED') {
    this.enabled = false;
    this._disableChildren(`SPACE_RECOVERY_${reason}`);
    this._event('SPACE_RECOVERY_DISABLED', 'warn', reason);
    return this.status();
  }

  _liveCharacter() {
    return this.root && this.root.character || null;
  }

  _inCombat() {
    const character = this._liveCharacter() || {};
    if (character.target) return true;
    const entities = this.root && ((this.root.parent && this.root.parent.entities) || this.root.entities) || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _preflight(operation) {
    if (!operation) return { ok: false, reason: 'SPACE_RECOVERY_NOT_FOUND' };
    if (!this.enabled) return { ok: false, reason: 'SPACE_RECOVERY_DISABLED' };
    if (this.busy) return { ok: false, reason: 'SPACE_RECOVERY_BUSY' };
    if (String(this.getMode()) !== 'active') return { ok: false, reason: 'RUNTIME_NOT_ACTIVE' };
    if (operation.state !== 'RESERVED') return { ok: false, reason: 'SPACE_RECOVERY_NOT_RESERVED' };
    if (operation.leaseExpiresAt != null && this.now() > finite(operation.leaseExpiresAt)) return { ok: false, reason: 'SPACE_RECOVERY_LEASE_EXPIRED' };
    if (this.journal && this.journal.breaker().open) return { ok: false, reason: 'SPACE_RECOVERY_CIRCUIT_OPEN' };
    const supervisor = this.getSupervisorStatus() || {};
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) return { ok: false, reason: 'SUPERVISOR_NOT_HEALTHY' };
    const character = this._liveCharacter();
    if (!character || String(character.name || '') !== String(operation.request.character || '')) return { ok: false, reason: 'CONTROLLED_CHARACTER_MISMATCH' };
    if (String(character.ctype || character.type || '').toLowerCase() !== 'merchant') return { ok: false, reason: 'MERCHANT_REQUIRED' };
    if (character.rip === true || character.dead === true) return { ok: false, reason: 'CHARACTER_DEAD' };
    if (!character.bank || typeof character.bank !== 'object') return { ok: false, reason: 'NOT_IN_BANK' };
    if (this._inCombat()) return { ok: false, reason: 'COMBAT_ACTIVE' };
    const childStates = this._childStates();
    if (childStates.merchant || childStates.expansion || childStates.consolidation) return { ok: false, reason: 'CHILD_EXECUTOR_ALREADY_ENABLED', childStates };
    return { ok: true, character, supervisor };
  }

  _childStates() {
    return {
      merchant: !!(this.controlledMerchant && this.controlledMerchant.status && this.controlledMerchant.status().enabled),
      expansion: !!(this.controlledExpansion && this.controlledExpansion.status && this.controlledExpansion.status().enabled),
      consolidation: !!(this.controlledConsolidation && this.controlledConsolidation.status && this.controlledConsolidation.status().enabled)
    };
  }

  _disableChildren(reason) {
    try { if (this.controlledMerchant && typeof this.controlledMerchant.disable === 'function') this.controlledMerchant.disable(reason); } catch (_) {}
    try { if (this.controlledExpansion && typeof this.controlledExpansion.disable === 'function') this.controlledExpansion.disable(reason); } catch (_) {}
    try { if (this.controlledConsolidation && typeof this.controlledConsolidation.disable === 'function') this.controlledConsolidation.disable(reason); } catch (_) {}
  }

  _context(observation, request) {
    const character = this._liveCharacter() || {};
    return {
      observation,
      character,
      bankPacks: this.root.bank_packs || (this.root.parent && this.root.parent.bank_packs) || {},
      gameData: this.getGameData() || {},
      contentDrift: this.getContentDrift(),
      ledger: this.ledger,
      minimumReserves: request.minimumReserves || {},
      gold: Math.max(0, finite(character.gold, 0)),
      shells: Math.max(0, finite(character.shells, 0)),
      currentMap: character.map || null
    };
  }

  _normalizeRequest(request = {}) {
    const character = this._liveCharacter() || {};
    const index = request.index == null ? null : Number(request.index);
    const liveItem = Number.isInteger(index) && Array.isArray(character.items) ? character.items[index] : null;
    return {
      ...clone(request),
      character: String(request.character || character.name || ''),
      index: Number.isInteger(index) ? index : null,
      item: String(request.item || request.name || (liveItem && liveItem.name) || ''),
      name: String(request.item || request.name || (liveItem && liveItem.name) || ''),
      level: Math.max(0, Math.floor(finite(request.level, liveItem && liveItem.level || 0))),
      quantity: Math.max(1, Math.floor(finite(request.quantity, liveItem && liveItem.q || 1))),
      depositBlocked: request.depositBlocked !== false,
      minimumReserves: request.minimumReserves && typeof request.minimumReserves === 'object' ? clone(request.minimumReserves) : {}
    };
  }

  plan(request = {}) {
    const normalized = this._normalizeRequest(request);
    if (!normalized.character) return { accepted: false, reason: 'SPACE_RECOVERY_CHARACTER_REQUIRED' };
    const observation = this.observeBank();
    if (!observation) return { accepted: false, reason: 'BANK_OBSERVATION_UNAVAILABLE' };
    const plan = this.manager.planSpace(normalized, this._context(observation, normalized));
    const reserved = this.journal.plan(normalized, plan);
    if (reserved.accepted) this.stats.plans += 1;
    return { ...reserved, plan: clone(plan), observation: clone(observation) };
  }

  _fallbackPlan(request, observation, options = {}) {
    const context = this._context(observation, request);
    if (!options.skipExpansion && this.manager && typeof this.manager._expansion === 'function') {
      const expansion = this.manager._expansion(observation, context);
      if (expansion && !expansion.requiresTravel) return { at: this.now(), planned: true, reason: 'ALPHA19_EXECUTABLE_EXPANSION_FALLBACK', ...expansion };
    }
    if (this.manager && typeof this.manager._reclaim === 'function') {
      const candidate = this.manager._reclaim(context);
      if (candidate) return {
        at: this.now(), planned: true, reason: 'ALPHA19_MINIMAL_RECLAIM_FALLBACK', action: BankSpaceAction.EMERGENCY_RECLAIM,
        candidate, destructive: true, exactlyOneUnit: true, reobserveRequiredBeforeNextDecision: true, bulkSellForbidden: true, executionAuthority: false
      };
    }
    return {
      at: this.now(), planned: true, reason: 'NO_EXECUTABLE_SAFE_SPACE_RECOVERY_ACTION', action: BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK,
      blockInventoryProducingWork: true, globalBotStop: false,
      independentSubsystemsMayContinue: ['combat', 'party', 'monitoring', 'travel-without-loot', 'safe-non-inventory-work'], executionAuthority: false
    };
  }

  _sourceItem(request) {
    const character = this._liveCharacter() || {};
    const index = Number(request.index);
    if (!Number.isInteger(index) || index < 0 || !Array.isArray(character.items) || !character.items[index]) return null;
    return character.items[index];
  }

  async _deposit(operation, plan) {
    const request = operation.request;
    const source = this._sourceItem(request);
    if (!source) return { ok: false, blocked: true, reason: 'DEPOSIT_SOURCE_ITEM_UNAVAILABLE', rawActions: 0 };
    const quantity = Math.max(1, Math.floor(finite(source.q, 1)));
    const planned = this.transactionEngine.plan({
      type: 'BANK', character: request.character, index: request.index, quantity,
      metadata: { alpha19SpaceRecovery: operation.id, plannedBankAction: plan.action, plannedPack: plan.pack || null, plannedSlot: plan.slot == null ? null : plan.slot }
    }, { ledger: this.ledger });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `BANK_TRANSACTION_${planned.reason}`, rawActions: 0 };
    this.controlledMerchant.configure({ enabled: true, ack: CHILD_ACK, bank: true, sell: false });
    try {
      const result = await this.controlledMerchant.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `BANK_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `BANK_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };
      this.stats.bankDeposits += 1;
      return { ok: true, reason: 'BANK_DEPOSIT_COMMITTED', rawActions: 1, transactionId: planned.transaction.id, result };
    } finally {
      this.controlledMerchant.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  async _expand(operation, plan, observation) {
    if (plan.requiresTravel) return { ok: false, blocked: true, reason: 'EXPANSION_REQUIRES_TRAVEL_NOT_AUTHORIZED', rawActions: 0 };
    const planned = this.expansionTransactions.plan(plan, { observation });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `EXPANSION_TRANSACTION_${planned.reason}`, rawActions: 0 };
    this.controlledExpansion.configure({ enabled: true, ack: CHILD_ACK });
    try {
      const result = await this.controlledExpansion.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `EXPANSION_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `EXPANSION_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };
      this.stats.expansionExecutions += 1;
      return { ok: true, reason: 'BANK_EXPANSION_COMMITTED', rawActions: 1, transactionId: planned.transaction.id, result };
    } finally {
      this.controlledExpansion.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  async _consolidate(operation, plan) {
    this.controlledConsolidation.configure({ enabled: true, ack: CHILD_ACK });
    try {
      const result = await this.controlledConsolidation.execute(plan);
      if (!result.executed && result.reason === 'NO_INVENTORY_WORKSPACE') return { ok: false, fallback: true, reason: result.reason, rawActions: 0, result };
      if (!result.executed) return { ok: false, blocked: true, reason: `CONSOLIDATION_${result.reason}`, rawActions: 0, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `CONSOLIDATION_${result.reason}`, rawActions: result.rawActions || 1, result };
      this.stats.consolidationExecutions += 1;
      return { ok: true, reason: 'BANK_CONSOLIDATION_COMMITTED', rawActions: result.rawActions || 2, result };
    } finally {
      this.controlledConsolidation.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  _sameCandidate(a, b) {
    if (!a || !b) return false;
    return String(a.character || '') === String(b.character || '') && Number(a.index) === Number(b.index) && String(a.item || '') === String(b.item || '') && Math.max(0, Math.floor(finite(a.level, 0))) === Math.max(0, Math.floor(finite(b.level, 0)));
  }

  async _reclaim(operation, plan) {
    if (operation.emergencyReclaimCount >= 1 || plan.exactlyOneUnit !== true || plan.bulkSellForbidden !== true || !plan.candidate || Number(plan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_BOUNDARY_INVALID', rawActions: 0 };
    }
    const freshObservation = this.observeBank();
    const freshPlan = this.manager.planSpace(operation.request, this._context(freshObservation, operation.request));
    this.journal.noteReobservation(operation.id, freshObservation, freshPlan);
    if (freshPlan.action !== BankSpaceAction.EMERGENCY_RECLAIM || !this._sameCandidate(plan.candidate, freshPlan.candidate) || Number(freshPlan.candidate.quantity) !== 1) {
      return { ok: false, blocked: true, reason: 'EMERGENCY_RECLAIM_FRESH_PLAN_CHANGED', rawActions: 0, freshPlan };
    }
    const candidate = freshPlan.candidate;
    const planned = this.transactionEngine.plan({
      type: 'SELL', character: candidate.character, index: candidate.index, quantity: 1,
      metadata: { alpha19SpaceRecovery: operation.id, emergencyReclaim: true, exactlyOneUnit: true, protectedMinimumReserve: candidate.protectedMinimumReserve }
    }, { ledger: this.ledger });
    if (!planned.accepted) return { ok: false, blocked: true, reason: `RECLAIM_TRANSACTION_${planned.reason}`, rawActions: 0 };
    this.controlledMerchant.configure({ enabled: true, ack: CHILD_ACK, sell: true, bank: false });
    try {
      const result = await this.controlledMerchant.execute(planned.transaction.id);
      if (!result.executed) return { ok: false, blocked: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 0, transactionId: planned.transaction.id, result };
      if (!result.committed) return { ok: false, failedSafe: true, reason: `RECLAIM_EXECUTION_${result.reason}`, rawActions: 1, transactionId: planned.transaction.id, result };
      this.journal.noteEmergencyReclaim(operation.id);
      this.stats.emergencyReclaims += 1;
      const after = this.observeBank();
      const afterPlan = this.manager.planSpace(operation.request, this._context(after, operation.request));
      this.journal.noteReobservation(operation.id, after, afterPlan);
      return { ok: true, reclaim: true, reason: 'EMERGENCY_RECLAIM_ONE_UNIT_COMMITTED', rawActions: 1, transactionId: planned.transaction.id, result, afterObservation: after, afterPlan };
    } finally {
      this.controlledMerchant.disable('ALPHA19_CHILD_SCOPE_COMPLETE');
    }
  }

  _rawBudget(operation, additional) {
    return finite(operation.rawActionCount, 0) + Math.max(0, Math.floor(finite(additional, 0))) <= MAX_RAW_ACTIONS_PER_OPERATION;
  }

  _recordChild(operationId, kind, result) {
    const current = this.journal.get(operationId);
    const rawActions = Math.max(0, Math.floor(finite(result && result.rawActions, 0)));
    if (!this._rawBudget(current, rawActions)) return false;
    return this.journal.addEvidence(operationId, kind, result, rawActions);
  }

  _finishBlocked(id, reason, evidence = {}) {
    this.journal.markBlocked(id, reason, { ...clone(evidence), globalBotStop: false });
    this.stats.blocked += 1;
    this.lastResult = { executed: false, committed: false, blocked: true, reason, operation: this.journal.get(id) };
    return clone(this.lastResult);
  }

  _finishFailedSafe(id, reason, evidence = {}) {
    this.journal.markFailedSafe(id, reason, evidence);
    this.stats.failedSafe += 1;
    this.lastResult = { executed: true, committed: false, failedSafe: true, reason, operation: this.journal.get(id) };
    return clone(this.lastResult);
  }

  _finishCommitted(id, reason, evidence = {}) {
    this.journal.markCommitted(id, reason, evidence);
    this.stats.committed += 1;
    this.lastResult = { executed: true, committed: true, reason, operation: this.journal.get(id) };
    return clone(this.lastResult);
  }

  async execute(operationId) {
    let operation = this.journal && this.journal.get(String(operationId));
    const preflight = this._preflight(operation);
    if (!preflight.ok) {
      if (operation && preflight.reason === 'SPACE_RECOVERY_LEASE_EXPIRED') this.journal.cancel(operation.id, preflight.reason);
      this.stats.rejected += 1;
      return { executed: false, committed: false, reason: preflight.reason, childStates: preflight.childStates };
    }
    this.busy = true;
    this.stats.attempts += 1;
    this.journal.transition(operation.id, 'EXECUTING', 'ALPHA19_EXECUTION_STARTED');
    this._event('SPACE_RECOVERY_EXECUTION_STARTED', 'warn', 'ALPHA19_CONTROLLED_SCOPE', { operationId: operation.id, action: operation.plan.action });
    try {
      let plan = clone(operation.plan);
      let observation = this.observeBank();
      this.journal.noteReobservation(operation.id, observation, plan);

      if (plan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK) return this._finishBlocked(operation.id, plan.reason || 'NO_SAFE_SPACE_RECOVERY_ACTION', { plan });

      if (plan.action === BankSpaceAction.CONSOLIDATE_BANK_STACKS) {
        const consolidated = await this._consolidate(operation, plan);
        if (consolidated.fallback) {
          plan = this._fallbackPlan(operation.request, observation, { skipExpansion: false });
          this.journal.addEvidence(operation.id, 'CONSOLIDATION_SKIPPED_NO_WORKSPACE', { fallbackPlan: plan }, 0);
        } else {
          if (!this._recordChild(operation.id, 'CONSOLIDATION', consolidated)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { consolidated });
          if (consolidated.failedSafe) return this._finishFailedSafe(operation.id, consolidated.reason, consolidated);
          if (!consolidated.ok) return this._finishBlocked(operation.id, consolidated.reason, consolidated);
          observation = this.observeBank();
          plan = this.manager.planSpace(operation.request, this._context(observation, operation.request));
          this.journal.noteReobservation(operation.id, observation, plan);
        }
      }

      if (plan.action === BankSpaceAction.EXPAND_BANK_PACK) {
        if (plan.requiresTravel) {
          plan = this._fallbackPlan(operation.request, observation, { skipExpansion: true });
          this.journal.addEvidence(operation.id, 'EXPANSION_SKIPPED_TRAVEL_NOT_AUTHORIZED', { fallbackPlan: plan }, 0);
        } else {
          const expanded = await this._expand(operation, plan, observation);
          if (!this._recordChild(operation.id, 'EXPANSION', expanded)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { expanded });
          if (expanded.failedSafe) return this._finishFailedSafe(operation.id, expanded.reason, expanded);
          if (!expanded.ok) return this._finishBlocked(operation.id, expanded.reason, expanded);
          observation = this.observeBank();
          plan = this.manager.planSpace(operation.request, this._context(observation, operation.request));
          this.journal.noteReobservation(operation.id, observation, plan);
        }
      }

      if ([BankSpaceAction.DEPOSIT_STACK, BankSpaceAction.DEPOSIT_FREE_SLOT].includes(plan.action)) {
        const deposited = await this._deposit(operation, plan);
        if (!this._recordChild(operation.id, 'BANK_DEPOSIT', deposited)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { deposited });
        if (deposited.failedSafe) return this._finishFailedSafe(operation.id, deposited.reason, deposited);
        if (!deposited.ok) return this._finishBlocked(operation.id, deposited.reason, deposited);
        observation = this.observeBank();
        this.journal.noteReobservation(operation.id, observation, null);
        return this._finishCommitted(operation.id, 'SPACE_RECOVERY_DEPOSIT_COMMITTED', { finalObservation: observation, plan });
      }

      if (plan.action === BankSpaceAction.EMERGENCY_RECLAIM) {
        const reclaimed = await this._reclaim(this.journal.get(operation.id), plan);
        if (!this._recordChild(operation.id, 'EMERGENCY_RECLAIM', reclaimed)) return this._finishFailedSafe(operation.id, 'RAW_ACTION_BUDGET_EXCEEDED', { reclaimed });
        if (reclaimed.failedSafe) return this._finishFailedSafe(operation.id, reclaimed.reason, reclaimed);
        if (!reclaimed.ok) return this._finishBlocked(operation.id, reclaimed.reason, reclaimed);
        return this._finishCommitted(operation.id, 'EMERGENCY_RECLAIM_ONE_UNIT_VERIFIED_REOBSERVED', {
          exactlyOneUnit: true,
          bulkSellForbidden: true,
          reobserveRequiredBeforeNextDecision: true,
          afterObservation: reclaimed.afterObservation,
          afterPlan: reclaimed.afterPlan
        });
      }

      if (plan.action === BankSpaceAction.BLOCK_INVENTORY_PRODUCING_WORK) return this._finishBlocked(operation.id, plan.reason || 'NO_SAFE_SPACE_RECOVERY_ACTION', { plan });
      return this._finishBlocked(operation.id, 'UNSUPPORTED_OR_NON_EXECUTABLE_SPACE_RECOVERY_PLAN', { plan });
    } catch (error) {
      return this._finishFailedSafe(operation.id, 'SPACE_RECOVERY_EXCEPTION', { message: String(error && error.message || error) });
    } finally {
      this._disableChildren('ALPHA19_OPERATION_FINALIZE');
      this.busy = false;
    }
  }

  reconcile(operationId) {
    this._disableChildren('ALPHA19_RESTART_RECONCILE');
    return this.journal.reconcile(operationId);
  }

  status() {
    return {
      mode: CONTROLLED_SPACE_RECOVERY_MODE,
      enabled: this.enabled,
      actionAuthority: this.enabled,
      directGameplayActionAccess: false,
      explicitAckRequired: CONTROLLED_SPACE_RECOVERY_ACK,
      childAck: CHILD_ACK,
      maxRawActionsPerOperation: MAX_RAW_ACTIONS_PER_OPERATION,
      emergencyReclaimMaxUnitsPerOperation: 1,
      bulkEmergencyReclaimAllowed: false,
      travelAuthority: false,
      shellExpansionAuthority: false,
      busy: this.busy,
      journal: this.journal && this.journal.status ? this.journal.status() : null,
      consolidation: this.controlledConsolidation && this.controlledConsolidation.status ? this.controlledConsolidation.status() : null,
      lastResult: clone(this.lastResult),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  ControlledMerchantSpaceRecovery,
  CONTROLLED_SPACE_RECOVERY_MODE,
  CONTROLLED_SPACE_RECOVERY_ACK,
  MAX_RAW_ACTIONS_PER_OPERATION
};
