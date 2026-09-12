'use strict';

class MinuteCountdownReporter {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.emit = typeof options.emit === 'function' ? options.emit : (() => {});
    this.intervalMs = Math.max(60 * 1000, Number(options.intervalMs) || 60 * 1000);
    this.label = options.label || 'Live Gate';
    this.startedAt = null;
    this.durationMs = 0;
    this.lastBucket = null;
    this.completed = false;
  }

  start(durationMs, label = this.label) {
    this.startedAt = this.now();
    this.durationMs = Math.max(0, Number(durationMs) || 0);
    this.label = String(label || this.label);
    this.lastBucket = null;
    this.completed = false;
    this.emit(`[${this.label}] gestartet — ${Math.ceil(this.durationMs / 60000)} Minuten Beobachtung.`);
    return this.status();
  }

  tick(at = this.now()) {
    if (this.startedAt == null || this.completed) return null;
    const elapsed = Math.max(0, Number(at) - this.startedAt);
    const remaining = Math.max(0, this.durationMs - elapsed);
    if (remaining <= 0) {
      this.completed = true;
      this.emit(`[${this.label}] Beobachtung abgeschlossen.`);
      return { type: 'complete', remainingMs: 0 };
    }
    const bucket = Math.ceil(remaining / this.intervalMs);
    if (bucket === this.lastBucket) return null;
    this.lastBucket = bucket;
    if (elapsed < this.intervalMs) return null;
    const minutes = Math.max(1, Math.ceil(remaining / 60000));
    this.emit(`[${this.label}] noch ${minutes} Minute${minutes === 1 ? '' : 'n'}.`);
    return { type: 'countdown', remainingMs: remaining, minutes };
  }

  status(at = this.now()) {
    if (this.startedAt == null) return { active: false, label: this.label, durationMs: this.durationMs, remainingMs: null, completed: this.completed };
    return {
      active: !this.completed,
      label: this.label,
      startedAt: this.startedAt,
      durationMs: this.durationMs,
      remainingMs: Math.max(0, this.durationMs - Math.max(0, Number(at) - this.startedAt)),
      completed: this.completed
    };
  }
}

module.exports = { MinuteCountdownReporter };
