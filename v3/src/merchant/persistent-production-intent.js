'use strict';

const PERSISTENT_PRODUCTION_INTENT_MODE = 'persistent-production-intent-v2';
const TERMINAL_PHASES = new Set(['COMPLETED', 'ABORTED', 'FAILED_SAFE']);

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clean(value) {
  const text = String(value == null ? '' : value).trim();
  return text || null;
}

function targetIdentity(target = {}) {
  const output = clean(target.output || target.item);
  const recipient = clean(target.recipient);
  const slot = clean(target.slot);
  if (!output) return null;
  return `${output}|${recipient || ''}|${slot || ''}`;
}

class PersistentProductionIntent {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || 'aio-v3-production-intent-v2';
    this.active = null;
    this.history = [];
    this.lastRecovery = null;
    this.stats = {
      loads: 0,
      persisted: 0,
      started: 0,
      updated: 0,
      completed: 0,
      aborted: 0,
      recovered: 0,
      recoveryFailedSafe: 0
    };
    this._load();
  }

  _get() {
    try {
      if (this.storage && typeof this.storage.get === 'function') return this.storage.get(this.storageKey);
      const ls = this.root && this.root.localStorage;
      return ls && typeof ls.getItem === 'function' ? ls.getItem(this.storageKey) : null;
    } catch (_) { return null; }
  }

  _set(value) {
    try {
      const text = JSON.stringify(value);
      if (this.storage && typeof this.storage.set === 'function') return this.storage.set(this.storageKey, text) !== false;
      const ls = this.root && this.root.localStorage;
      if (ls && typeof ls.setItem === 'function') {
        ls.setItem(this.storageKey, text);
        return true;
      }
    } catch (_) {}
    return false;
  }

  _persist() {
    const ok = this._set({
      schemaVersion: 2,
      active: this.active,
      history: this.history.slice(-32),
      lastRecovery: this.lastRecovery
    });
    if (ok) this.stats.persisted += 1;
    return ok;
  }

  _load() {
    const raw = this._get();
    if (!raw) return;
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || Number(data.schemaVersion) !== 2) return;
      this.active = data.active && typeof data.active === 'object' ? clone(data.active) : null;
      this.history = Array.isArray(data.history) ? data.history.slice(-32).map(clone) : [];
      this.lastRecovery = clone(data.lastRecovery || null);
      this.stats.loads += 1;
      if (this.active && !TERMINAL_PHASES.has(String(this.active.phase || ''))) {
        this.active.recoveryPending = true;
        this.active.recoveryReason = 'RESTART_REPLAN_RECONCILIATION_REQUIRED';
        this.active.updatedAt = this.now();
        this._persist();
      }
    } catch (_) {
      this.active = null;
      this.lastRecovery = {
        at: this.now(),
        reconciled: false,
        reason: 'CORRUPT_PERSISTED_PRODUCTION_INTENT'
      };
    }
  }

  _targetFromPlan(plan) {
    if (!plan) return null;
    const target = plan.target || null;
    return target && targetIdentity(target) ? {
      output: clean(target.output || target.item),
      recipient: clean(target.recipient),
      slot: clean(target.slot),
      identity: targetIdentity(target)
    } : null;
  }

  _candidateTargets(plan) {
    const out = [];
    const direct = this._targetFromPlan(plan);
    if (direct) out.push(direct);
    for (const row of Array.isArray(plan && plan.blockedCandidates) ? plan.blockedCandidates : []) {
      const target = row && row.candidate;
      const identity = targetIdentity(target);
      if (!identity || out.some((x) => x.identity === identity)) continue;
      out.push({
        output: clean(target.output || target.item),
        recipient: clean(target.recipient),
        slot: clean(target.slot),
        identity
      });
    }
    return out;
  }

  ensureForPlan(plan, phase = 'PLANNED', details = {}) {
    const target = this._targetFromPlan(plan);
    if (!target) return false;
    if (!this.active || this.active.targetIdentity !== target.identity || TERMINAL_PHASES.has(String(this.active.phase || ''))) {
      if (this.active && !TERMINAL_PHASES.has(String(this.active.phase || ''))) {
        this._archive('ABORTED', 'TARGET_SUPERSEDED_BY_REPLAN');
      }
      const now = this.now();
      this.active = {
        schemaVersion: 2,
        id: `production-intent:${target.identity}:${now.toString(36)}`,
        targetIdentity: target.identity,
        target: target,
        phase: String(phase || 'PLANNED'),
        reason: clean(details.reason) || 'PRODUCTION_PLAN_SELECTED',
        createdAt: now,
        updatedAt: now,
        recoveryPending: false,
        planId: clean(plan && plan.id),
        planState: clean(plan && plan.state),
        progress: clone(details.progress || null),
        material: clone(details.material || null),
        lastExecution: clone(details.lastExecution || null)
      };
      this.stats.started += 1;
      return this._persist();
    }
    return this.update(phase, { ...details, plan });
  }

  update(phase, details = {}) {
    if (!this.active) return false;
    this.active.phase = String(phase || this.active.phase || 'PLANNED');
    this.active.reason = clean(details.reason) || this.active.reason || null;
    this.active.updatedAt = this.now();
    if (details.plan) {
      this.active.planId = clean(details.plan.id);
      this.active.planState = clean(details.plan.state);
    }
    if (Object.prototype.hasOwnProperty.call(details, 'progress')) this.active.progress = clone(details.progress);
    if (Object.prototype.hasOwnProperty.call(details, 'material')) this.active.material = clone(details.material);
    if (Object.prototype.hasOwnProperty.call(details, 'lastExecution')) this.active.lastExecution = clone(details.lastExecution);
    if (details.recoveryPending != null) this.active.recoveryPending = details.recoveryPending === true;
    this.stats.updated += 1;
    return this._persist();
  }

  reconcile(plan) {
    if (!this.active || this.active.recoveryPending !== true) {
      return { reconciled: false, reason: 'NO_PERSISTED_PRODUCTION_INTENT_RECOVERY' };
    }
    const candidates = this._candidateTargets(plan);
    const match = candidates.find((row) => row.identity === this.active.targetIdentity) || null;
    if (match) {
      this.active.recoveryPending = false;
      this.active.recoveryReason = null;
      this.active.planId = clean(plan && plan.id);
      this.active.planState = clean(plan && plan.state);
      this.active.updatedAt = this.now();
      this.lastRecovery = {
        at: this.now(),
        reconciled: true,
        continued: true,
        reason: 'PERSISTED_INTENT_MATCHED_FRESH_REPLAN',
        targetIdentity: this.active.targetIdentity
      };
      this.stats.recovered += 1;
      this._persist();
      return clone(this.lastRecovery);
    }

    const previous = clone(this.active);
    this._archive('FAILED_SAFE', 'PERSISTED_INTENT_NOT_PRESENT_IN_FRESH_REPLAN');
    this.lastRecovery = {
      at: this.now(),
      reconciled: true,
      continued: false,
      reason: 'PERSISTED_INTENT_NOT_PRESENT_IN_FRESH_REPLAN',
      targetIdentity: previous && previous.targetIdentity || null
    };
    this.stats.recoveryFailedSafe += 1;
    this._persist();
    return clone(this.lastRecovery);
  }

  _archive(phase, reason) {
    if (!this.active) return false;
    const row = {
      ...clone(this.active),
      phase: String(phase || 'ABORTED'),
      reason: String(reason || 'PRODUCTION_INTENT_ARCHIVED'),
      updatedAt: this.now(),
      completedAt: this.now(),
      recoveryPending: false
    };
    this.history.push(row);
    this.history = this.history.slice(-32);
    if (row.phase === 'COMPLETED') this.stats.completed += 1;
    else if (row.phase === 'ABORTED') this.stats.aborted += 1;
    this.active = null;
    return true;
  }

  complete(reason = 'PRODUCTION_TARGET_COMPLETED') {
    if (!this.active) return false;
    this._archive('COMPLETED', reason);
    return this._persist();
  }

  abort(reason = 'PRODUCTION_TARGET_ABORTED') {
    if (!this.active) return false;
    this._archive('ABORTED', reason);
    return this._persist();
  }

  status() {
    return {
      schemaVersion: 2,
      mode: PERSISTENT_PRODUCTION_INTENT_MODE,
      active: clone(this.active),
      recoveryPending: !!(this.active && this.active.recoveryPending),
      lastRecovery: clone(this.lastRecovery),
      history: this.history.slice(-16).map(clone),
      stats: clone(this.stats)
    };
  }
}

module.exports = {
  PersistentProductionIntent,
  PERSISTENT_PRODUCTION_INTENT_MODE,
  targetIdentity
};
