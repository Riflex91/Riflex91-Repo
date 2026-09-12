'use strict';

const HealthState = Object.freeze({
  HEALTHY: 'HEALTHY',
  WATCH: 'WATCH',
  DEGRADED: 'DEGRADED',
  RECOVERY: 'RECOVERY',
  SAFE_MODE: 'SAFE_MODE',
  QUARANTINE: 'QUARANTINE'
});

const RANK = Object.freeze({
  [HealthState.HEALTHY]: 0,
  [HealthState.WATCH]: 1,
  [HealthState.DEGRADED]: 2,
  [HealthState.RECOVERY]: 3,
  [HealthState.SAFE_MODE]: 4,
  [HealthState.QUARANTINE]: 5
});

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class GlobalSupervisor {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.safeActionsEnabled = options.safeActionsEnabled === true;
    this.watchAfterMs = clamp(options.watchAfterMs || 15000, 1000, 30 * 60 * 1000);
    this.degradedAfterMs = clamp(options.degradedAfterMs || 45000, this.watchAfterMs, 60 * 60 * 1000);
    this.safeModeAfterMs = clamp(options.safeModeAfterMs || 120000, this.degradedAfterMs, 2 * 60 * 60 * 1000);
    this.quarantineAfterMs = clamp(options.quarantineAfterMs || 300000, this.safeModeAfterMs, 6 * 60 * 60 * 1000);
    this.minMovementProgress = clamp(options.minMovementProgress || 25, 5, 500);
    this.recoveryCooldownMs = clamp(options.recoveryCooldownMs || 30000, 1000, 30 * 60 * 1000);
    this.recoveryWindowMs = clamp(options.recoveryWindowMs || 10 * 60 * 1000, this.recoveryCooldownMs, 24 * 60 * 60 * 1000);
    this.maxRecoveriesPerWindow = Math.max(1, Math.min(20, Math.floor(finite(options.maxRecoveriesPerWindow, 3))));
    this.state = HealthState.HEALTHY;
    this.reasons = [];
    this.subsystems = {};
    this.lastEvaluatedAt = null;
    this.lastProgressAt = null;
    this.progressAnchor = null;
    this.lastRecoveryAt = null;
    this.recoveries = [];
    this.manualQuarantines = new Map();
    this.stats = { evaluations: 0, transitions: 0, safeFallbacks: 0, safeFallbackFailures: 0, budgetBlocks: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'global-supervisor', event, severity, reason, data });
  }

  _probe(status) {
    const c = status && status.character;
    if (!c) return null;
    return {
      map: c.map || null,
      x: finite(c.x != null ? c.x : c.real_x, 0),
      y: finite(c.y != null ? c.y : c.real_y, 0),
      xp: finite(c.xp, 0),
      gold: finite(c.gold, 0),
      rip: c.rip === true
    };
  }

  _activeWork(status) {
    if (!status || status.running !== true || status.mode !== 'active') return false;
    const c = status.character;
    if (!c || c.rip === true) return false;
    const farmer = status.farmer || {};
    const transition = status.party && status.party.transition;
    const partyActive = !!(transition && (transition.active === true || !['IDLE', 'READY', 'COMPLETED'].includes(String(transition.state || 'IDLE'))));
    return farmer.enabled === true || partyActive;
  }

  _noteProgress(status) {
    const now = this.now();
    const probe = this._probe(status);
    if (!probe || !this._activeWork(status)) {
      this.progressAnchor = probe;
      this.lastProgressAt = now;
      return { active: false, progressed: true, ageMs: 0 };
    }
    if (!this.progressAnchor) {
      this.progressAnchor = probe;
      this.lastProgressAt = now;
      return { active: true, progressed: true, ageMs: 0 };
    }
    const anchor = this.progressAnchor;
    const distance = Math.hypot(probe.x - anchor.x, probe.y - anchor.y);
    const progressed = probe.map !== anchor.map || probe.xp > anchor.xp || probe.gold > anchor.gold || distance >= this.minMovementProgress;
    if (progressed) {
      this.progressAnchor = probe;
      this.lastProgressAt = now;
    }
    if (this.lastProgressAt == null) this.lastProgressAt = now;
    return { active: true, progressed, ageMs: Math.max(0, now - this.lastProgressAt), distance };
  }

  _progressState(progress) {
    if (!progress.active) return { state: HealthState.HEALTHY, reasons: [] };
    const age = progress.ageMs;
    if (age >= this.quarantineAfterMs) return { state: HealthState.QUARANTINE, reasons: ['NO_PROGRESS_QUARANTINE'] };
    if (age >= this.safeModeAfterMs) return { state: HealthState.SAFE_MODE, reasons: ['NO_PROGRESS_SAFE_MODE'] };
    if (age >= this.degradedAfterMs) return { state: HealthState.DEGRADED, reasons: ['NO_PROGRESS_DEGRADED'] };
    if (age >= this.watchAfterMs) return { state: HealthState.WATCH, reasons: ['NO_PROGRESS_WATCH'] };
    return { state: HealthState.HEALTHY, reasons: [] };
  }

  _subsystemState(status, contentDrift, progress) {
    const result = {};
    const movement = status && status.stability && status.stability.commandOutcomes && status.stability.commandOutcomes.movement;
    result.combat = movement && movement.circuitOpen
      ? { state: HealthState.DEGRADED, reasons: ['MOVEMENT_CIRCUIT_OPEN'] }
      : { state: HealthState.HEALTHY, reasons: [] };

    const persistence = status && status.persistence || {};
    if (finite(persistence.loadFailureStreak) >= 5 || finite(persistence.saveFailureStreak) >= 8) {
      result.persistence = { state: HealthState.SAFE_MODE, reasons: ['PERSISTENCE_FAILURE_BUDGET_EXCEEDED'] };
    } else if (persistence.saveCircuitOpen === true || finite(persistence.loadFailureStreak) >= 3 || finite(persistence.saveFailureStreak) >= 3) {
      result.persistence = { state: HealthState.DEGRADED, reasons: ['PERSISTENCE_UNHEALTHY'] };
    } else result.persistence = { state: HealthState.HEALTHY, reasons: [] };

    const transition = status && status.party && status.party.transition || {};
    if (String(transition.state || '') === 'FAILED_SAFE') result.party = { state: HealthState.QUARANTINE, reasons: ['PARTY_TRANSITION_FAILED_SAFE'] };
    else if (transition.active === true && transition.leaseExpired === true) result.party = { state: HealthState.DEGRADED, reasons: ['PARTY_TRANSITION_LEASE_EXPIRED'] };
    else result.party = { state: HealthState.HEALTHY, reasons: [] };

    const brain = status && status.brain || {};
    result.brain = String(brain.quality && brain.quality.state || brain.qualityState || brain.quality || '').toUpperCase().includes('QUARANTINED')
      ? { state: HealthState.QUARANTINE, reasons: ['BRAIN_QUARANTINED'] }
      : { state: HealthState.HEALTHY, reasons: [] };

    const quarantined = finite(contentDrift && contentDrift.counts && contentDrift.counts.QUARANTINED, 0);
    result.content = quarantined > 0
      ? { state: HealthState.WATCH, reasons: ['CONTENT_REVALIDATION_REQUIRED'] }
      : { state: HealthState.HEALTHY, reasons: [] };

    result.progress = this._progressState(progress);

    for (const [name, record] of this.manualQuarantines.entries()) {
      result[name] = { state: HealthState.QUARANTINE, reasons: ['MANUAL_QUARANTINE', record.reason].filter(Boolean) };
    }
    return result;
  }

  _overall(subsystems) {
    let state = HealthState.HEALTHY;
    const reasons = [];
    const critical = ['progress', 'combat', 'persistence'];
    for (const name of critical) {
      const row = subsystems[name];
      if (!row) continue;
      if (RANK[row.state] > RANK[state]) state = row.state;
      reasons.push(...row.reasons);
    }
    const party = subsystems.party;
    if (party) {
      const capped = party.state === HealthState.QUARANTINE ? HealthState.DEGRADED : party.state;
      if (RANK[capped] > RANK[state]) state = capped;
      reasons.push(...party.reasons);
    }
    for (const name of ['brain', 'content']) {
      const row = subsystems[name];
      if (!row) continue;
      const capped = row.state === HealthState.HEALTHY ? HealthState.HEALTHY : HealthState.WATCH;
      if (RANK[capped] > RANK[state]) state = capped;
      reasons.push(...row.reasons);
    }
    for (const [name, row] of Object.entries(subsystems)) {
      if (['progress', 'combat', 'persistence', 'party', 'brain', 'content'].includes(name)) continue;
      if (RANK[row.state] > RANK[state]) state = row.state;
      reasons.push(...row.reasons);
    }
    return { state, reasons: [...new Set(reasons)] };
  }

  _pruneRecoveries(now) {
    this.recoveries = this.recoveries.filter((row) => now - row.at <= this.recoveryWindowMs);
  }

  _canRecover(now) {
    this._pruneRecoveries(now);
    if (this.lastRecoveryAt != null && now - this.lastRecoveryAt < this.recoveryCooldownMs) return { allowed: false, reason: 'RECOVERY_COOLDOWN' };
    if (this.recoveries.length >= this.maxRecoveriesPerWindow) return { allowed: false, reason: 'RECOVERY_BUDGET_EXHAUSTED' };
    return { allowed: true, reason: null };
  }

  _applySafeFallback(runtime, triggerState, reasons) {
    const now = this.now();
    const budget = this._canRecover(now);
    if (!budget.allowed) {
      this.stats.budgetBlocks += 1;
      this._event('SUPERVISOR_RECOVERY_SUPPRESSED', 'warn', budget.reason, { triggerState, reasons, recoveriesInWindow: this.recoveries.length });
      return { executed: false, reason: budget.reason, actions: [] };
    }
    const actions = [];
    const call = (name, fn) => {
      try {
        if (typeof fn !== 'function') return;
        fn();
        actions.push(name);
      } catch (error) {
        this.stats.safeFallbackFailures += 1;
        this._event('SUPERVISOR_SAFE_ACTION_FAILED', 'error', name, { message: String(error && error.message || error) });
      }
    };
    call('PARTY_TRANSITIONS_OFF', runtime && typeof runtime.setPartyTransitionsEnabled === 'function' ? () => runtime.setPartyTransitionsEnabled(false) : null);
    call('PARTY_AURA_OFF', runtime && typeof runtime.setPartyAuraAutomationEnabled === 'function' ? () => runtime.setPartyAuraAutomationEnabled(false) : null);
    call('PARTY_EXPLORATION_OFF', runtime && typeof runtime.setPartyExplorationEnabled === 'function' ? () => runtime.setPartyExplorationEnabled(false) : null);
    call('FARMER_OFF', runtime && typeof runtime.setFarmerEnabled === 'function' ? () => runtime.setFarmerEnabled(false) : null);
    call('RUNTIME_SHADOW', runtime && typeof runtime.setMode === 'function' ? () => runtime.setMode('shadow') : null);
    this.lastRecoveryAt = now;
    const row = { at: now, triggerState, reasons: reasons.slice(0, 16), actions };
    this.recoveries.push(row);
    this.stats.safeFallbacks += 1;
    this._event('SUPERVISOR_SAFE_FALLBACK_APPLIED', 'warn', 'SAFETY_REDUCTION_ONLY', row);
    return { executed: true, reason: 'SAFETY_REDUCTION_ONLY', actions };
  }

  observe(context = {}) {
    const now = this.now();
    const status = context.status || {};
    const progress = this._noteProgress(status);
    const subsystems = this._subsystemState(status, context.contentDrift || null, progress);
    const overall = this._overall(subsystems);
    let recovery = { executed: false, reason: this.safeActionsEnabled ? 'NOT_REQUIRED' : 'SAFE_ACTIONS_DISABLED', actions: [] };
    if (this.safeActionsEnabled && RANK[overall.state] >= RANK[HealthState.SAFE_MODE]) recovery = this._applySafeFallback(context.runtime, overall.state, overall.reasons);

    const previous = this.state;
    this.state = overall.state;
    if (overall.state === HealthState.HEALTHY && this.lastRecoveryAt != null && now - this.lastRecoveryAt < this.recoveryCooldownMs) this.state = HealthState.RECOVERY;
    this.reasons = overall.reasons;
    this.subsystems = subsystems;
    this.lastEvaluatedAt = now;
    this.stats.evaluations += 1;
    if (previous !== this.state) {
      this.stats.transitions += 1;
      this._event('SUPERVISOR_STATE_CHANGED', this.state === HealthState.HEALTHY ? 'info' : 'warn', this.reasons[0] || null, { from: previous, to: this.state, reasons: this.reasons });
    }
    return { state: this.state, reasons: this.reasons.slice(), progress, recovery };
  }

  setSafeActionsEnabled(enabled) {
    this.safeActionsEnabled = enabled === true;
    this._event('SUPERVISOR_SAFE_ACTIONS_CHANGED', 'info', null, { enabled: this.safeActionsEnabled });
    return this.safeActionsEnabled;
  }

  quarantineSubsystem(name, reason = 'MANUAL') {
    const key = String(name || '').trim();
    if (!key) return false;
    this.manualQuarantines.set(key, { at: this.now(), reason: String(reason || 'MANUAL') });
    this._event('SUPERVISOR_SUBSYSTEM_QUARANTINED', 'warn', reason, { subsystem: key });
    return true;
  }

  clearSubsystemQuarantine(name) {
    const key = String(name || '').trim();
    const cleared = this.manualQuarantines.delete(key);
    if (cleared) this._event('SUPERVISOR_SUBSYSTEM_QUARANTINE_CLEARED', 'info', null, { subsystem: key });
    return cleared;
  }

  status() {
    const now = this.now();
    this._pruneRecoveries(now);
    return {
      schemaVersion: 1,
      state: this.state,
      reasons: this.reasons.slice(),
      safeActionsEnabled: this.safeActionsEnabled,
      actionAuthority: this.safeActionsEnabled,
      actionScope: 'safety-reduction-only',
      directGameplayActionAccess: false,
      thresholds: {
        watchAfterMs: this.watchAfterMs,
        degradedAfterMs: this.degradedAfterMs,
        safeModeAfterMs: this.safeModeAfterMs,
        quarantineAfterMs: this.quarantineAfterMs,
        minMovementProgress: this.minMovementProgress
      },
      progress: {
        lastProgressAt: this.lastProgressAt,
        ageMs: this.lastProgressAt == null ? null : Math.max(0, now - this.lastProgressAt),
        anchor: clone(this.progressAnchor)
      },
      subsystems: clone(this.subsystems),
      manualQuarantines: [...this.manualQuarantines.entries()].map(([name, value]) => ({ name, ...value })),
      recovery: {
        lastRecoveryAt: this.lastRecoveryAt,
        cooldownMs: this.recoveryCooldownMs,
        windowMs: this.recoveryWindowMs,
        maxPerWindow: this.maxRecoveriesPerWindow,
        inWindow: this.recoveries.length,
        recent: clone(this.recoveries.slice(-10))
      },
      lastEvaluatedAt: this.lastEvaluatedAt,
      stats: { ...this.stats }
    };
  }
}

module.exports = { GlobalSupervisor, HealthState };
