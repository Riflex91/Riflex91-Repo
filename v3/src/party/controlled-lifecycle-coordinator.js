'use strict';

const { PartyLifecycleState } = require('./lifecycle-store');
const { AURAS } = require('./paladin-aura-policy');

const CONTROLLED_PARTY_LIFECYCLE_MODE = 'controlled-live-default-off';
const CONTROLLED_PARTY_LIFECYCLE_ACK = 'ALPHA20_PARTY_LIFECYCLE';
const PartyLifecycleOperationState = Object.freeze({
  RESERVED: 'RESERVED',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  RECOVERING: 'RECOVERING',
  COMMITTED: 'COMMITTED',
  ABORTED: 'ABORTED',
  FAILED_SAFE: 'FAILED_SAFE'
});
const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }

class ControlledPartyLifecycleCoordinator {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'AIO_V3_PARTY_LIFECYCLE_OPERATION';
    this.lifecycle = options.lifecycle;
    this.transitions = options.transitions;
    this.auraPolicy = options.auraPolicy;
    this.adapter = options.adapter;
    this.getMode = options.getMode || (() => 'shadow');
    this.getSupervisorStatus = options.getSupervisorStatus || (() => ({ state: 'UNKNOWN' }));
    this.getEconomyEmergency = options.getEconomyEmergency || (() => false);
    this.enabled = false;
    this.allowTransitions = false;
    this.allowDevelopmentRotation = false;
    this.allowAuraChanges = false;
    this.minTransitionIntervalMs = Math.max(60 * 1000, Math.min(24 * 60 * 60 * 1000, Number(options.minTransitionIntervalMs) || 15 * 60 * 1000));
    this.lastTransitionAt = 0;
    this.operation = null;
    this.busy = false;
    this.lastResult = null;
    this.lastAuraResult = null;
    this.stats = { plans: 0, attempts: 0, committed: 0, aborted: 0, failedSafe: 0, rejected: 0, developmentRotations: 0, promotions: 0, auraAttempts: 0, auraChanges: 0 };
    this.load();
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-lifecycle-controlled', event, data, severity, reason });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    return null;
  }

  save() {
    const backend = this._backend();
    if (!backend) return false;
    try {
      backend.set(this.storageKey, JSON.stringify({ schemaVersion: 1, savedAt: this.now(), operation: this.operation, lastTransitionAt: this.lastTransitionAt }));
      return true;
    } catch (error) {
      this._event('PARTY_LIFECYCLE_OPERATION_SAVE_FAILED', { message: String(error && error.message || error) }, 'warn', 'PERSISTENCE_WRITE_ERROR');
      return false;
    }
  }

  load() {
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.storageKey);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== 1) throw new Error('unsupported lifecycle operation schema');
      this.lastTransitionAt = Math.max(0, finite(data.lastTransitionAt));
      if (data.operation && [PartyLifecycleOperationState.RESERVED, PartyLifecycleOperationState.EXECUTING, PartyLifecycleOperationState.VERIFYING].includes(data.operation.state)) {
        this.operation = { ...data.operation, state: PartyLifecycleOperationState.RECOVERING, reason: 'RESTART_RECONCILIATION_REQUIRED', updatedAt: this.now() };
        this._event('PARTY_LIFECYCLE_RESTART_RECOVERY_REQUIRED', { id: this.operation.id }, 'warn', 'NO_BLIND_RETRY');
        this.save();
      } else this.operation = data.operation || null;
      return true;
    } catch (error) {
      this.operation = null;
      this._event('PARTY_LIFECYCLE_OPERATION_RESTORE_FAILED', { message: String(error && error.message || error) }, 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA');
      return false;
    }
  }

  configure(config = {}) {
    if (config.enabled !== true) {
      this.disable(config.reason || 'OPERATOR_DISABLED');
      return this.status();
    }
    if (config.ack !== CONTROLLED_PARTY_LIFECYCLE_ACK) {
      this.disable('WRONG_ACK');
      this.stats.rejected += 1;
      return { ...this.status(), enableRejected: 'WRONG_ACK' };
    }
    this.enabled = true;
    this.allowTransitions = config.allowTransitions === true;
    this.allowDevelopmentRotation = this.allowTransitions && config.allowDevelopmentRotation === true;
    this.allowAuraChanges = config.allowAuraChanges === true;
    this._event('PARTY_LIFECYCLE_CONTROL_ENABLED', { allowTransitions: this.allowTransitions, allowDevelopmentRotation: this.allowDevelopmentRotation, allowAuraChanges: this.allowAuraChanges });
    return this.status();
  }

  disable(reason = 'DISABLED') {
    this.enabled = false;
    this.allowTransitions = false;
    this.allowDevelopmentRotation = false;
    this.allowAuraChanges = false;
    if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
    this._event('PARTY_LIFECYCLE_CONTROL_DISABLED', {}, 'info', reason);
    return this.status();
  }

  _localCharacter() { return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null; }
  _partyNames() { const p = this.root && (this.root.parent || this.root); return Object.keys(p && p.party || {}); }

  _gate(context = {}) {
    const reasons = [];
    const local = this._localCharacter();
    const supervisor = this.getSupervisorStatus() || {};
    if (!this.enabled) reasons.push('CONTROLLED_PARTY_LIFECYCLE_DISABLED');
    if (this.getMode() !== 'active') reasons.push('RUNTIME_NOT_ACTIVE');
    if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reasons.push('SUPERVISOR_NOT_HEALTHY');
    if (!local || local.ctype !== 'merchant') reasons.push('MERCHANT_CONTROLLER_REQUIRED');
    if (context.inCombat === true) reasons.push('ACTIVE_COMBAT');
    if (context.highRisk === true) reasons.push('HIGH_RISK_CONTEXT');
    if (context.emergency === true) reasons.push('EMERGENCY_RECOVERY');
    if (this.getEconomyEmergency() === true) reasons.push('ECONOMY_EMERGENCY');
    if (this.busy) reasons.push('PARTY_LIFECYCLE_BUSY');
    if (this.operation && this.operation.state === PartyLifecycleOperationState.RECOVERING) reasons.push('RESTART_RECONCILIATION_REQUIRED');
    return { allowed: reasons.length === 0, reasons, local, supervisor };
  }

  _selectPlan(currentMembers = [], registryStatus = {}, context = {}) {
    const life = this.lifecycle && this.lifecycle.status ? this.lifecycle.status() : { characters: [] };
    const rows = life.characters || [];
    const current = currentMembers.filter(Boolean);
    const merchant = current.find((row) => row.ctype === 'merchant');
    const activeCombat = current.filter((row) => row.ctype !== 'merchant');
    if (!merchant || activeCombat.length !== 3) return { planned: false, reason: 'CURRENT_PARTY_MUST_BE_MERCHANT_PLUS_THREE' };
    const byName = new Map((registryStatus.characters || []).map((row) => [row.name, row]));
    const lifecycleByName = new Map(rows.map((row) => [row.name, row]));
    const promotion = rows.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE && !row.active).sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))[0] || null;
    const development = rows.filter((row) => row.state === PartyLifecycleState.DEVELOPMENT && !row.active).sort((a, b) => (b.projectedScore || 0) - (a.projectedScore || 0))[0] || null;
    let incoming = promotion;
    let kind = 'PROMOTION';
    if (!incoming && this.allowDevelopmentRotation) { incoming = development; kind = 'DEVELOPMENT_ROTATION'; }
    if (!incoming) return { planned: false, reason: 'NO_ELIGIBLE_LIFECYCLE_CHANGE' };
    if (kind === 'DEVELOPMENT_ROTATION' && !this.allowDevelopmentRotation) return { planned: false, reason: 'DEVELOPMENT_ROTATION_NOT_AUTHORIZED' };
    if (kind === 'PROMOTION' && !this.allowTransitions) return { planned: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };
    const incomingRegistry = byName.get(incoming.name);
    if (!incomingRegistry || incomingRegistry.dead === true || incomingRegistry.available === false) return { planned: false, reason: 'INCOMING_NOT_AVAILABLE' };

    const outgoing = activeCombat
      .map((member) => ({ member, lifecycle: lifecycleByName.get(member.name) || null }))
      .sort((a, b) => {
        const as = a.lifecycle && a.lifecycle.currentScore;
        const bs = b.lifecycle && b.lifecycle.currentScore;
        if (as == null && bs != null) return -1;
        if (as != null && bs == null) return 1;
        return finite(as, 0) - finite(bs, 0) || finite(a.member.level, 0) - finite(b.member.level, 0);
      })[0];
    if (!outgoing) return { planned: false, reason: 'NO_OUTGOING_MEMBER' };
    if (kind === 'PROMOTION') {
      if (incoming.currentScore == null || !outgoing.lifecycle || outgoing.lifecycle.currentScore == null || incoming.currentScore <= outgoing.lifecycle.currentScore) return { planned: false, reason: 'CURRENT_SUPERIORITY_NOT_PROVEN' };
    }
    if (kind === 'DEVELOPMENT_ROTATION' && (incoming.expectedTrainingXpRatio == null || incoming.expectedTrainingXpRatio < life.thresholds.minTrainingExpectedXpRatio)) return { planned: false, reason: 'TRAINING_XP_RATIO_GATE' };

    const targetNames = [merchant.name, ...activeCombat.filter((row) => row.name !== outgoing.member.name).map((row) => row.name), incoming.name];
    const targetMembers = targetNames.map((name) => byName.get(name) || current.find((row) => row.name === name)).filter(Boolean);
    if (targetMembers.length !== 4) return { planned: false, reason: 'TARGET_MEMBER_STATE_INCOMPLETE' };
    return {
      planned: true,
      kind,
      destructive: false,
      incoming: incoming.name,
      outgoing: outgoing.member.name,
      targetNames,
      members: targetMembers,
      merchant,
      evidence: { incoming: clone(incoming), outgoing: clone(outgoing.lifecycle), context: clone(context) }
    };
  }

  plan(currentMembers = [], registryStatus = {}, context = {}) {
    this.stats.plans += 1;
    const gate = this._gate(context);
    if (!gate.allowed) return { planned: false, reason: gate.reasons[0], reasons: gate.reasons };
    if (!this.allowTransitions) return { planned: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };
    if (this.now() - this.lastTransitionAt < this.minTransitionIntervalMs) return { planned: false, reason: 'TRANSITION_HYSTERESIS_HOLD' };
    return this._selectPlan(currentMembers, registryStatus, context);
  }

  _reserve(plan) {
    const now = this.now();
    this.operation = {
      schemaVersion: 1,
      id: `party-life-${now}`,
      state: PartyLifecycleOperationState.RESERVED,
      createdAt: now,
      updatedAt: now,
      plan: clone(plan),
      rawActionAuthority: false,
      directGameplayActionAccess: false,
      reason: 'PARTY_LIFECYCLE_RESERVED'
    };
    this.save();
    return this.operation;
  }

  async executePlan(plan, currentMembers = [], registryStatus = {}, context = {}) {
    const gate = this._gate(context);
    if (!gate.allowed) { this.stats.rejected += 1; return { executed: false, reason: gate.reasons[0], reasons: gate.reasons }; }
    if (!plan || plan.planned !== true) return { executed: false, reason: 'INVALID_PLAN' };
    if (!this.allowTransitions) return { executed: false, reason: 'TRANSITIONS_NOT_AUTHORIZED' };
    if (plan.kind === 'DEVELOPMENT_ROTATION' && !this.allowDevelopmentRotation) return { executed: false, reason: 'DEVELOPMENT_ROTATION_NOT_AUTHORIZED' };
    if (this.now() - this.lastTransitionAt < this.minTransitionIntervalMs) return { executed: false, reason: 'TRANSITION_HYSTERESIS_HOLD' };
    this.busy = true;
    this.stats.attempts += 1;
    const op = this._reserve(plan);
    try {
      op.state = PartyLifecycleOperationState.EXECUTING; op.updatedAt = this.now(); this.save();
      this.transitions.setLiveEnabled(true);
      const result = await this.transitions.execute({ members: plan.members, merchant: plan.merchant }, {
        runtimeMode: this.getMode(),
        currentMembers,
        registryStatus,
        inCombat: context.inCombat === true,
        emergency: context.emergency === true || context.highRisk === true || this.getEconomyEmergency() === true,
        requiresCrossMapRouting: context.requiresCrossMapRouting === true,
        verifyTargetState: context.verifyTargetState
      });
      this.transitions.setLiveEnabled(false);
      if (result && result.executed === true) {
        op.state = PartyLifecycleOperationState.COMMITTED;
        op.reason = 'PARTY_LIFECYCLE_TRANSITION_COMMITTED';
        op.result = clone(result);
        op.updatedAt = this.now();
        this.lastTransitionAt = this.now();
        this.stats.committed += 1;
        if (plan.kind === 'PROMOTION') this.stats.promotions += 1; else this.stats.developmentRotations += 1;
        this.lastResult = clone(op);
        this.save();
        this._event('PARTY_LIFECYCLE_TRANSITION_COMMITTED', { id: op.id, kind: plan.kind, incoming: plan.incoming, outgoing: plan.outgoing });
        return { executed: true, operation: clone(op), transition: result };
      }
      op.state = result && result.recovery && result.recovery.recovered === false ? PartyLifecycleOperationState.FAILED_SAFE : PartyLifecycleOperationState.ABORTED;
      op.reason = result && result.reason || 'TRANSITION_ABORTED';
      op.result = clone(result);
      op.updatedAt = this.now();
      if (op.state === PartyLifecycleOperationState.FAILED_SAFE) this.stats.failedSafe += 1; else this.stats.aborted += 1;
      this.lastResult = clone(op); this.save();
      return { executed: false, operation: clone(op), transition: result, reason: op.reason };
    } catch (error) {
      if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
      op.state = PartyLifecycleOperationState.FAILED_SAFE;
      op.reason = 'UNHANDLED_PARTY_LIFECYCLE_ERROR';
      op.error = String(error && error.message || error);
      op.updatedAt = this.now();
      this.stats.failedSafe += 1;
      this.lastResult = clone(op); this.save();
      this._event('PARTY_LIFECYCLE_TRANSITION_FAILED_SAFE', { id: op.id, error: op.error }, 'error', op.reason);
      return { executed: false, reason: op.reason, operation: clone(op) };
    } finally {
      this.busy = false;
      if (this.transitions && typeof this.transitions.setLiveEnabled === 'function') this.transitions.setLiveEnabled(false);
    }
  }

  async maybeExecute(currentMembers = [], registryStatus = {}, context = {}) {
    const plan = this.plan(currentMembers, registryStatus, context);
    if (!plan.planned) return plan;
    return this.executePlan(plan, currentMembers, registryStatus, context);
  }

  reconcile(currentNames = []) {
    if (!this.operation || this.operation.state !== PartyLifecycleOperationState.RECOVERING) return { reconciled: false, reason: 'NO_RECOVERING_OPERATION' };
    const current = new Set((currentNames || []).map((row) => typeof row === 'string' ? row : row && row.name).filter(Boolean));
    const target = new Set(this.operation.plan && this.operation.plan.targetNames || []);
    const old = new Set(this.operation.plan && this.operation.plan.evidence && this.operation.plan.evidence.context && this.operation.plan.evidence.context.currentNames || []);
    const exact = (set) => set.size === current.size && [...set].every((name) => current.has(name));
    if (target.size === 4 && exact(target)) {
      this.operation.state = PartyLifecycleOperationState.COMMITTED;
      this.operation.reason = 'RESTART_TARGET_STATE_OBSERVED';
      this.lastTransitionAt = this.now();
      this.stats.committed += 1;
    } else if (old.size === 4 && exact(old)) {
      this.operation.state = PartyLifecycleOperationState.ABORTED;
      this.operation.reason = 'RESTART_ORIGINAL_STATE_OBSERVED';
      this.stats.aborted += 1;
    } else {
      this.operation.state = PartyLifecycleOperationState.FAILED_SAFE;
      this.operation.reason = 'RESTART_PARTY_STATE_AMBIGUOUS_NO_BLIND_RETRY';
      this.stats.failedSafe += 1;
    }
    this.operation.updatedAt = this.now();
    this.lastResult = clone(this.operation);
    this.save();
    return { reconciled: true, operation: clone(this.operation) };
  }

  applyAura(recommendation, context = {}) {
    const gate = this._gate(context);
    if (!gate.allowed) return { executed: false, reason: gate.reasons[0], reasons: gate.reasons };
    if (!this.allowAuraChanges) return { executed: false, reason: 'AURA_CHANGES_NOT_AUTHORIZED' };
    const local = gate.local;
    if (!local || local.ctype !== 'paladin') return { executed: false, reason: 'LOCAL_PALADIN_REQUIRED' };
    if (Number(local.level) < 60) return { executed: false, reason: 'PALADIN_LEVEL_TOO_LOW' };
    const aura = recommendation && recommendation.aura;
    if (!AURAS.includes(aura)) return { executed: false, reason: 'INVALID_AURA' };
    if (recommendation.canSwitch === false) return { executed: false, reason: 'AURA_HYSTERESIS_HOLD' };
    if (!this.adapter || typeof this.adapter.command !== 'function') return { executed: false, reason: 'ADAPTER_UNAVAILABLE' };
    this.stats.auraAttempts += 1;
    const result = this.adapter.command('use_skill', ['paladin_aura', aura]);
    const out = { at: this.now(), aura, executed: !!(result && result.executed), reason: result && result.reason || null, shadow: !!(result && result.shadow) };
    if (out.executed) {
      if (this.auraPolicy && typeof this.auraPolicy.noteApplied === 'function') this.auraPolicy.noteApplied(aura);
      this.stats.auraChanges += 1;
      this._event('PALADIN_AURA_CONTROLLED_CHANGED', { aura, recommendation: clone(recommendation) });
    }
    this.lastAuraResult = out;
    return clone(out);
  }

  status() {
    return {
      mode: CONTROLLED_PARTY_LIFECYCLE_MODE,
      requiredAck: CONTROLLED_PARTY_LIFECYCLE_ACK,
      enabled: this.enabled,
      actionAuthority: this.enabled && (this.allowTransitions || this.allowAuraChanges),
      directGameplayActionAccess: false,
      transitionAuthority: this.enabled && this.allowTransitions,
      developmentRotationAuthority: this.enabled && this.allowDevelopmentRotation,
      auraAuthority: this.enabled && this.allowAuraChanges,
      maxDevelopmentSlots: 1,
      minTransitionIntervalMs: this.minTransitionIntervalMs,
      lastTransitionAt: this.lastTransitionAt || null,
      busy: this.busy,
      operation: clone(this.operation),
      lastResult: clone(this.lastResult),
      lastAuraResult: clone(this.lastAuraResult),
      serverChangeAllowed: false,
      smartMoveAllowed: false,
      crossMapRoutingAllowed: false,
      stats: { ...this.stats }
    };
  }
}

module.exports = { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_MODE, CONTROLLED_PARTY_LIFECYCLE_ACK, PartyLifecycleOperationState };
