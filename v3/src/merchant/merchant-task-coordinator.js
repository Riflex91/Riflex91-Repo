'use strict';

const MERCHANT_TASK_COORDINATOR_MODE = 'merchant-task-coordinator-v1';

function clone(value) {
  try { return value == null ? value : JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

class MerchantTaskCoordinator {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.defaultLeaseMs = Math.max(30000, Number(options.defaultLeaseMs || 10 * 60 * 1000));
    this.activeTask = null;
    this.lastTask = null;
    this.stats = { acquired: 0, continued: 0, blocked: 0, released: 0, expired: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'merchant-task-coordinator', event, severity, reason, data }); } catch (_) {}
  }

  _expire() {
    if (!this.activeTask) return false;
    if (this.now() <= Number(this.activeTask.leaseExpiresAt || 0)) return false;
    this.lastTask = { ...clone(this.activeTask), endedAt: this.now(), endReason: 'TASK_LEASE_EXPIRED' };
    this.activeTask = null;
    this.stats.expired += 1;
    this._event('MERCHANT_TASK_EXPIRED', 'warn', 'TASK_LEASE_EXPIRED', this.lastTask);
    return true;
  }

  current() {
    this._expire();
    return clone(this.activeTask);
  }

  acquire(owner, kind, key, metadata = {}, options = {}) {
    this._expire();
    const now = this.now();
    const resolvedOwner = String(owner || '');
    const resolvedKind = String(kind || '');
    const resolvedKey = String(key || resolvedKind || '');
    const leaseMs = Math.max(30000, Number(options.leaseMs || this.defaultLeaseMs));
    if (!resolvedOwner || !resolvedKind || !resolvedKey) return { acquired: false, reason: 'TASK_IDENTITY_REQUIRED', task: this.current() };

    if (this.activeTask) {
      if (this.activeTask.owner === resolvedOwner && this.activeTask.key === resolvedKey) {
        this.activeTask.updatedAt = now;
        this.activeTask.leaseExpiresAt = now + leaseMs;
        this.activeTask.metadata = { ...this.activeTask.metadata, ...clone(metadata) };
        this.stats.continued += 1;
        return { acquired: true, continued: true, task: clone(this.activeTask) };
      }
      this.stats.blocked += 1;
      return { acquired: false, reason: 'MERCHANT_TASK_LOCKED', task: clone(this.activeTask) };
    }

    this.activeTask = {
      id: `merchant-task-${now.toString(36)}-${resolvedOwner}-${resolvedKind}`,
      owner: resolvedOwner,
      kind: resolvedKind,
      key: resolvedKey,
      startedAt: now,
      updatedAt: now,
      leaseExpiresAt: now + leaseMs,
      metadata: clone(metadata)
    };
    this.stats.acquired += 1;
    this._event('MERCHANT_TASK_ACQUIRED', 'info', resolvedKind, this.activeTask);
    return { acquired: true, continued: false, task: clone(this.activeTask) };
  }

  heartbeat(owner, key, metadata = null) {
    this._expire();
    if (!this.activeTask || this.activeTask.owner !== String(owner || '') || this.activeTask.key !== String(key || '')) return false;
    const now = this.now();
    this.activeTask.updatedAt = now;
    this.activeTask.leaseExpiresAt = now + this.defaultLeaseMs;
    if (metadata && typeof metadata === 'object') this.activeTask.metadata = { ...this.activeTask.metadata, ...clone(metadata) };
    return true;
  }

  release(owner, key, reason = 'TASK_COMPLETE', details = {}) {
    this._expire();
    if (!this.activeTask) return false;
    if (owner != null && this.activeTask.owner !== String(owner)) return false;
    if (key != null && this.activeTask.key !== String(key)) return false;
    const now = this.now();
    this.lastTask = { ...clone(this.activeTask), endedAt: now, endReason: String(reason || 'TASK_COMPLETE'), details: clone(details) };
    this.activeTask = null;
    this.stats.released += 1;
    this._event('MERCHANT_TASK_RELEASED', 'info', reason, this.lastTask);
    return true;
  }

  blockedFor(owner) {
    const task = this.current();
    return !!(task && task.owner !== String(owner || ''));
  }

  status() {
    return {
      mode: MERCHANT_TASK_COORDINATOR_MODE,
      activeTask: this.current(),
      lastTask: clone(this.lastTask),
      stats: clone(this.stats)
    };
  }
}

function installMerchantTaskCoordinator(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.merchantTaskCoordinator) return runtime.merchantTaskCoordinator;
  runtime.merchantTaskCoordinator = new MerchantTaskCoordinator({
    now: runtime.now,
    log: runtime.log,
    defaultLeaseMs: options.merchantTaskLeaseMs
  });
  return runtime.merchantTaskCoordinator;
}

module.exports = { MerchantTaskCoordinator, installMerchantTaskCoordinator, MERCHANT_TASK_COORDINATOR_MODE };
