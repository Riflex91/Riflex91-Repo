'use strict';

class BackgroundExecutionGuard {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.expectedTickMs = Math.max(100, Number(options.expectedTickMs) || 250);
    this.driftThresholdMs = Math.max(1000, Math.min(60000, Number(options.driftThresholdMs) || 3000));
    this.rearmCooldownMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.rearmCooldownMs) || 30000));
    this.enabled = options.enabled !== false;
    this.lastTickAt = null;
    this.lastArmAt = 0;
    this.lastDriftMs = 0;
    this.stats = { armAttempts: 0, armSuccess: 0, armFailures: 0, driftEvents: 0, focusRearms: 0 };
    this.listenersInstalled = false;
    this.boundRearm = () => {
      if (!this.enabled) return;
      const now = this.now();
      if (this.lastArmAt && now - this.lastArmAt < Math.min(this.rearmCooldownMs, 5000)) return;
      this.stats.focusRearms += 1;
      this.arm('FOCUS_OR_VISIBILITY');
    };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') {
      this.log.emit({ component: 'background-execution', event, severity, reason, data });
    }
  }

  _fn() {
    if (!this.root) return null;
    return this.root.performance_trick || (this.root.parent && this.root.parent.performance_trick) || null;
  }

  arm(reason = 'MANUAL') {
    if (!this.enabled) return { armed: false, reason: 'DISABLED' };
    const fn = this._fn();
    this.stats.armAttempts += 1;
    if (typeof fn !== 'function') {
      this.stats.armFailures += 1;
      return { armed: false, reason: 'PERFORMANCE_TRICK_UNAVAILABLE' };
    }
    try {
      const pending = fn.call(this.root);
      this.lastArmAt = this.now();
      this.stats.armSuccess += 1;
      this._event('BACKGROUND_EXECUTION_GUARD_ARMED', { reason, strategy: 'adventure-land-performance-trick' });
      if (pending && typeof pending.then === 'function') {
        Promise.resolve(pending).catch((error) => {
          this.stats.armFailures += 1;
          this._event('BACKGROUND_EXECUTION_GUARD_FAILED', { reason, message: String(error && error.message || error) }, 'warn', 'PERFORMANCE_TRICK_ASYNC_FAILED');
        });
      }
      return { armed: true, reason, strategy: 'adventure-land-performance-trick' };
    } catch (error) {
      this.stats.armFailures += 1;
      this._event('BACKGROUND_EXECUTION_GUARD_FAILED', { reason, message: String(error && error.message || error) }, 'warn', 'PERFORMANCE_TRICK_FAILED');
      return { armed: false, reason: 'PERFORMANCE_TRICK_FAILED' };
    }
  }

  installListeners() {
    if (this.listenersInstalled || !this.root) return false;
    const doc = this.root.document;
    if (doc && typeof doc.addEventListener === 'function') doc.addEventListener('visibilitychange', this.boundRearm);
    if (typeof this.root.addEventListener === 'function') this.root.addEventListener('focus', this.boundRearm);
    this.listenersInstalled = !!((doc && typeof doc.addEventListener === 'function') || typeof this.root.addEventListener === 'function');
    return this.listenersInstalled;
  }

  removeListeners() {
    if (!this.listenersInstalled || !this.root) return false;
    const doc = this.root.document;
    try {
      if (doc && typeof doc.removeEventListener === 'function') doc.removeEventListener('visibilitychange', this.boundRearm);
      if (typeof this.root.removeEventListener === 'function') this.root.removeEventListener('focus', this.boundRearm);
    } catch (_) {}
    this.listenersInstalled = false;
    return true;
  }

  noteTick() {
    const now = this.now();
    if (this.lastTickAt != null) {
      const drift = Math.max(0, now - this.lastTickAt - this.expectedTickMs);
      this.lastDriftMs = drift;
      if (drift >= this.driftThresholdMs) {
        this.stats.driftEvents += 1;
        this._event('BACKGROUND_EXECUTION_DRIFT', { driftMs: drift, expectedTickMs: this.expectedTickMs }, 'warn', 'TIMER_DRIFT');
        if (now - this.lastArmAt >= this.rearmCooldownMs) this.arm('TIMER_DRIFT');
      }
    }
    this.lastTickAt = now;
  }

  start() {
    this.installListeners();
    return this.arm('RUNTIME_START');
  }

  stop() {
    this.removeListeners();
    this.lastTickAt = null;
    return true;
  }

  setEnabled(enabled) {
    this.enabled = enabled === true;
    return this.enabled;
  }

  status() {
    return {
      enabled: this.enabled,
      strategy: 'adventure-land-performance-trick',
      guarantee: false,
      listenersInstalled: this.listenersInstalled,
      functionAvailable: typeof this._fn() === 'function',
      lastArmAt: this.lastArmAt || null,
      lastDriftMs: this.lastDriftMs,
      expectedTickMs: this.expectedTickMs,
      driftThresholdMs: this.driftThresholdMs,
      rearmCooldownMs: this.rearmCooldownMs,
      stats: { ...this.stats }
    };
  }
}

module.exports = { BackgroundExecutionGuard };
