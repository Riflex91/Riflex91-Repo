'use strict';

const CONTROLLED_AUTO_RESPAWN_MODE = 'controlled-auto-respawn';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max, fallback) {
  const number = finite(value, fallback);
  return Math.max(min, Math.min(max, number));
}

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

class ControlledAutoRespawn {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.getMode = options.getMode || (() => 'shadow');
    this.enabled = options.enabled !== false;
    this.deathGraceMs = Math.floor(clamp(options.deathGraceMs, 500, 15000, 1500));
    this.retryMs = Math.floor(clamp(options.retryMs, 1000, 30000, 3000));
    this.maxAttempts = Math.floor(clamp(options.maxAttempts, 1, 8, 5));
    this.state = 'IDLE';
    this.deathStartedAt = null;
    this.deathSequence = 0;
    this.attempts = 0;
    this.nextAttemptAt = null;
    this.lastAttemptAt = null;
    this.lastRecoveredAt = null;
    this.lastError = null;
    this.exhaustedLogged = false;
    this.stats = { deathsObserved: 0, respawnRequests: 0, rawActions: 0, recoveriesVerified: 0, failures: 0, exhausted: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'controlled-auto-respawn', event, severity, reason, data });
  }

  _character() {
    return this.root && (this.root.character || (this.root.parent && this.root.parent.character)) || null;
  }

  _respawnBinding() {
    if (this.root && typeof this.root.respawn === 'function') return { fn: this.root.respawn, owner: this.root };
    if (this.root && this.root.parent && typeof this.root.parent.respawn === 'function') return { fn: this.root.parent.respawn, owner: this.root.parent };
    return null;
  }

  _dead(snapshot) {
    if (snapshot && snapshot.character) return snapshot.character.rip === true;
    const c = this._character();
    return !!(c && c.rip === true);
  }

  _beginDeath(now, snapshot) {
    this.deathStartedAt = now;
    this.deathSequence += 1;
    this.attempts = 0;
    this.nextAttemptAt = now + this.deathGraceMs;
    this.lastAttemptAt = null;
    this.lastError = null;
    this.exhaustedLogged = false;
    this.state = 'DEAD_WAIT';
    this.stats.deathsObserved += 1;
    const c = snapshot && snapshot.character || this._character() || {};
    this._event('AUTO_RESPAWN_DEATH_OBSERVED', 'warn', 'CHARACTER_DEAD', {
      deathSequence: this.deathSequence,
      character: c.name || null,
      ctype: c.ctype || null,
      map: c.map || null,
      graceMs: this.deathGraceMs
    });
  }

  _verifyRecovered(now, snapshot) {
    if (this.deathStartedAt == null) {
      this.state = 'IDLE';
      return false;
    }
    const c = snapshot && snapshot.character || this._character() || {};
    this.state = 'IDLE';
    this.lastRecoveredAt = now;
    this.stats.recoveriesVerified += 1;
    this._event('AUTO_RESPAWN_RECOVERY_VERIFIED', 'info', 'CHARACTER_ALIVE', {
      deathSequence: this.deathSequence,
      attempts: this.attempts,
      character: c.name || null,
      map: c.map || null,
      elapsedMs: Math.max(0, now - this.deathStartedAt)
    });
    this.deathStartedAt = null;
    this.attempts = 0;
    this.nextAttemptAt = null;
    this.exhaustedLogged = false;
    return true;
  }

  tick(snapshot) {
    const now = this.now();
    const dead = this._dead(snapshot);
    if (!dead) {
      const recovered = this._verifyRecovered(now, snapshot);
      return { executed: false, reason: recovered ? 'RECOVERY_VERIFIED' : 'CHARACTER_ALIVE' };
    }

    if (this.deathStartedAt == null) this._beginDeath(now, snapshot);
    if (!this.enabled) {
      this.state = 'DISABLED';
      return { executed: false, reason: 'AUTO_RESPAWN_DISABLED' };
    }
    if (this.getMode() !== 'active') {
      this.state = 'MODE_BLOCKED';
      return { executed: false, reason: 'RUNTIME_NOT_ACTIVE' };
    }
    if (this.attempts >= this.maxAttempts) {
      this.state = 'EXHAUSTED';
      if (!this.exhaustedLogged) {
        this.exhaustedLogged = true;
        this.stats.exhausted += 1;
        this._event('AUTO_RESPAWN_EXHAUSTED', 'error', 'RESPAWN_ATTEMPT_BUDGET_EXHAUSTED', {
          deathSequence: this.deathSequence,
          attempts: this.attempts,
          maxAttempts: this.maxAttempts
        });
      }
      return { executed: false, reason: 'RESPAWN_ATTEMPT_BUDGET_EXHAUSTED', attempts: this.attempts };
    }
    if (this.nextAttemptAt != null && now < this.nextAttemptAt) {
      this.state = this.attempts > 0 ? 'VERIFYING' : 'DEAD_WAIT';
      return { executed: false, reason: 'RESPAWN_WAIT', nextAttemptAt: this.nextAttemptAt };
    }

    const binding = this._respawnBinding();
    if (!binding) {
      this.state = 'BLOCKED';
      this.lastError = 'RESPAWN_UNAVAILABLE';
      this.nextAttemptAt = now + this.retryMs;
      this.stats.failures += 1;
      this._event('AUTO_RESPAWN_FAILED_SAFE', 'error', 'RESPAWN_UNAVAILABLE');
      return { executed: false, reason: 'RESPAWN_UNAVAILABLE' };
    }

    this.attempts += 1;
    const attempt = this.attempts;
    const deathSequence = this.deathSequence;
    this.lastAttemptAt = now;
    this.nextAttemptAt = now + this.retryMs;
    this.stats.respawnRequests += 1;
    this.stats.rawActions += 1;
    this.state = 'VERIFYING';
    this.lastError = null;

    try {
      const value = binding.fn.call(binding.owner);
      this._event('AUTO_RESPAWN_REQUESTED', 'warn', 'RESPAWN_REQUESTED', {
        deathSequence,
        attempt,
        maxAttempts: this.maxAttempts,
        rawActions: this.stats.rawActions
      });
      if (value && typeof value.then === 'function') {
        Promise.resolve(value)
          .then(() => {
            this._event('AUTO_RESPAWN_CALL_SETTLED', 'info', 'RESPAWN_CALL_RESOLVED', { deathSequence, attempt });
          })
          .catch((error) => {
            const message = String(error && error.message || error).slice(0, 160);
            this.stats.failures += 1;
            if (this.deathSequence === deathSequence && this.deathStartedAt != null) this.lastError = message;
            this._event('AUTO_RESPAWN_CALL_REJECTED', 'warn', 'RESPAWN_CALL_REJECTED', { deathSequence, attempt, message });
          });
      }
      return { executed: true, reason: 'RESPAWN_REQUESTED', deathSequence, attempt, nextAttemptAt: this.nextAttemptAt };
    } catch (error) {
      const message = String(error && error.message || error).slice(0, 160);
      this.lastError = message;
      this.stats.failures += 1;
      this.state = 'VERIFYING';
      this._event('AUTO_RESPAWN_CALL_FAILED', 'warn', 'RESPAWN_CALL_FAILED', { deathSequence, attempt, message });
      return { executed: false, reason: 'RESPAWN_CALL_FAILED', deathSequence, attempt, error: message };
    }
  }

  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_AUTO_RESPAWN_MODE,
      enabled: this.enabled,
      state: this.state,
      respawnAuthority: true,
      otherGameplayAuthority: false,
      directEconomyAuthority: false,
      deathGraceMs: this.deathGraceMs,
      retryMs: this.retryMs,
      maxAttempts: this.maxAttempts,
      deathStartedAt: this.deathStartedAt,
      deathSequence: this.deathSequence,
      attempts: this.attempts,
      nextAttemptAt: this.nextAttemptAt,
      lastAttemptAt: this.lastAttemptAt,
      lastRecoveredAt: this.lastRecoveredAt,
      lastError: this.lastError,
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledAutoRespawn, CONTROLLED_AUTO_RESPAWN_MODE };
