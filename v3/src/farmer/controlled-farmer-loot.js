'use strict';

const { GameAdapter } = require('../game/adapter');

const CONTROLLED_FARMER_LOOT_MODE = 'controlled-farmer-loot';

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

class ControlledFarmerLoot {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.getMode = options.getMode || (() => 'shadow');
    this.ownsAdapter = !options.adapter;
    this.adapter = options.adapter || new GameAdapter({ root: this.root, parent: this.root && this.root.parent, log: this.log, now: this.now, mode: 'shadow' });
    this.enabled = options.enabled !== false;
    this.intervalMs = Math.floor(clamp(options.intervalMs, 500, 10000, 900));
    this.noChestPollMs = Math.floor(clamp(options.noChestPollMs, 250, 10000, 700));
    this.fullInventoryIntervalMs = Math.floor(clamp(options.fullInventoryIntervalMs, this.intervalMs, 30000, 4000));
    this.failureBackoffMs = Math.floor(clamp(options.failureBackoffMs, 1000, 60000, 5000));
    this.verifyDelayMs = Math.floor(clamp(options.verifyDelayMs, 100, 5000, 500));
    this.nextAttemptAt = 0;
    this.requestSequence = 0;
    this.pendingObservation = null;
    this.lastAttempt = null;
    this.lastObservation = null;
    this.state = 'IDLE';
    this.failureStreak = 0;
    this.stats = {
      ticks: 0,
      chestPolls: 0,
      noChestSkips: 0,
      requests: 0,
      rawActions: 0,
      failures: 0,
      observedDeltas: 0,
      fullInventoryRequests: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    this.log.emit({ component: 'controlled-farmer-loot', event, severity, reason, data });
  }

  _syncAdapterMode() {
    if (this.ownsAdapter && this.adapter && typeof this.adapter.setMode === 'function') {
      this.adapter.setMode(this.getMode() === 'active' ? 'active' : 'shadow');
    }
  }

  _readBinding(name) {
    if (this.root && typeof this.root[name] === 'function') return { fn: this.root[name], owner: this.root };
    if (this.root && this.root.parent && typeof this.root.parent[name] === 'function') return { fn: this.root.parent[name], owner: this.root.parent };
    return null;
  }

  _metrics(snapshot) {
    const c = snapshot && snapshot.character || {};
    const inventory = Array.isArray(c.inventory) ? c.inventory : [];
    const isize = Math.max(0, Math.floor(finite(c.isize, inventory.length) || 0));
    const bounded = inventory.slice(0, isize);
    let occupied = 0;
    let quantity = 0;
    for (const item of bounded) {
      if (!item) continue;
      occupied += 1;
      quantity += Math.max(1, finite(item.q, 1));
    }
    return {
      gold: finite(c.gold, 0),
      occupied,
      quantity,
      freeSlots: Math.max(0, isize - occupied)
    };
  }

  _chestCount() {
    const binding = this._readBinding('get_chests');
    if (!binding) return null;
    this.stats.chestPolls += 1;
    try {
      const value = binding.fn.call(binding.owner);
      if (Array.isArray(value)) return value.length;
      if (value && typeof value === 'object') return Object.keys(value).length;
      return null;
    } catch (error) {
      this._event('FARMER_LOOT_CHEST_QUERY_FAILED', 'warn', 'CHEST_QUERY_FAILED', { message: String(error && error.message || error).slice(0, 160) });
      return null;
    }
  }

  _observePending(snapshot) {
    if (!this.pendingObservation) return null;
    const now = this.now();
    if (now - this.pendingObservation.at < this.verifyDelayMs) return null;
    const after = this._metrics(snapshot);
    const before = this.pendingObservation.before;
    const requestId = this.pendingObservation.requestId;
    const delta = {
      gold: after.gold - before.gold,
      occupied: after.occupied - before.occupied,
      quantity: after.quantity - before.quantity,
      freeSlots: after.freeSlots - before.freeSlots
    };
    const observedDelta = delta.gold !== 0 || delta.occupied !== 0 || delta.quantity !== 0 || delta.freeSlots !== 0;
    this.lastObservation = { at: now, requestId, requestedAt: this.pendingObservation.at, observedDelta, delta, before, after };
    if (observedDelta) {
      this.stats.observedDeltas += 1;
      this._event('FARMER_LOOT_DELTA_OBSERVED', 'info', 'POST_LOOT_DELTA', { requestId, delta, freeSlots: after.freeSlots });
    }
    this.pendingObservation = null;
    return clone(this.lastObservation);
  }

  tick(snapshot) {
    this.stats.ticks += 1;
    if (snapshot && snapshot.character) this._observePending(snapshot);
    if (!this.enabled) { this.state = 'DISABLED'; return { executed: false, reason: 'LOOT_DISABLED' }; }
    if (!snapshot || !snapshot.character) { this.state = 'WAITING'; return { executed: false, reason: 'SNAPSHOT_UNAVAILABLE' }; }

    const c = snapshot.character;
    if (String(c.ctype || '').toLowerCase() === 'merchant') {
      this.state = 'NOT_FARMER';
      return { executed: false, reason: 'MERCHANT_EXCLUDED' };
    }
    if (c.rip === true) {
      this.state = 'DEAD';
      return { executed: false, reason: 'CHARACTER_DEAD' };
    }
    if (this.getMode() !== 'active') {
      this.state = 'SHADOW';
      return { executed: false, shadow: true, reason: 'RUNTIME_NOT_ACTIVE' };
    }

    const now = this.now();
    if (now < this.nextAttemptAt) return { executed: false, reason: 'LOOT_RATE_LIMITED', nextAttemptAt: this.nextAttemptAt };

    const chestCount = this._chestCount();
    if (chestCount === 0) {
      this.state = 'IDLE_NO_CHESTS';
      this.stats.noChestSkips += 1;
      this.nextAttemptAt = now + this.noChestPollMs;
      return { executed: false, reason: 'NO_CHESTS' };
    }

    if (!this.adapter || typeof this.adapter.command !== 'function' || (typeof this.adapter.canCommand === 'function' && !this.adapter.canCommand('loot'))) {
      this.state = 'BLOCKED';
      this.failureStreak += 1;
      this.stats.failures += 1;
      this.nextAttemptAt = now + this.failureBackoffMs;
      this.lastAttempt = { at: now, executed: false, reason: 'LOOT_UNAVAILABLE' };
      this._event('FARMER_LOOT_FAILED_SAFE', 'warn', 'LOOT_UNAVAILABLE');
      return clone(this.lastAttempt);
    }

    const before = this._metrics(snapshot);
    const requestId = ++this.requestSequence;
    try {
      this._syncAdapterMode();
      const command = this.adapter.command('loot');
      if (!command.executed) throw new Error(command.reason || (command.shadow ? 'RUNTIME_NOT_ACTIVE' : 'LOOT_COMMAND_REJECTED'));
      const value = command.value;
      this.stats.requests += 1;
      this.stats.rawActions += 1;
      if (before.freeSlots <= 0) this.stats.fullInventoryRequests += 1;
      this.failureStreak = 0;
      this.state = 'REQUESTED';
      this.nextAttemptAt = now + (before.freeSlots <= 0 ? this.fullInventoryIntervalMs : this.intervalMs);
      this.pendingObservation = { at: now, requestId, before };
      this.lastAttempt = { at: now, requestId, executed: true, reason: 'LOOT_REQUESTED', chestCount, freeSlots: before.freeSlots };
      this._event('FARMER_LOOT_REQUESTED', 'info', 'CHEST_AVAILABLE', { requestId, chestCount, freeSlots: before.freeSlots, rawActions: this.stats.rawActions });
      if (value && typeof value.then === 'function') {
        Promise.resolve(value).catch((error) => {
          this.failureStreak += 1;
          this.stats.failures += 1;
          this.nextAttemptAt = Math.max(this.nextAttemptAt, this.now() + this.failureBackoffMs);
          this._event('FARMER_LOOT_ASYNC_REJECTED', 'warn', 'LOOT_PROMISE_REJECTED', {
            requestId,
            message: String(error && error.message || error).slice(0, 160)
          });
        });
      }
      return clone(this.lastAttempt);
    } catch (error) {
      this.state = 'BACKOFF';
      this.failureStreak += 1;
      this.stats.failures += 1;
      this.nextAttemptAt = now + this.failureBackoffMs;
      this.lastAttempt = { at: now, requestId, executed: false, reason: 'LOOT_CALL_FAILED', error: String(error && error.message || error).slice(0, 160) };
      this._event('FARMER_LOOT_FAILED_SAFE', 'warn', 'LOOT_CALL_FAILED', { requestId, message: this.lastAttempt.error });
      return clone(this.lastAttempt);
    }
  }

  status() {
    return {
      schemaVersion: 1,
      mode: CONTROLLED_FARMER_LOOT_MODE,
      enabled: this.enabled,
      state: this.state,
      directCombatAuthority: false,
      directEconomyAuthority: false,
      lootAuthority: true,
      intervalMs: this.intervalMs,
      nextAttemptAt: this.nextAttemptAt || null,
      requestSequence: this.requestSequence,
      failureStreak: this.failureStreak,
      pendingObservation: clone(this.pendingObservation),
      lastAttempt: clone(this.lastAttempt),
      lastObservation: clone(this.lastObservation),
      stats: clone(this.stats)
    };
  }
}

module.exports = { ControlledFarmerLoot, CONTROLLED_FARMER_LOOT_MODE };
