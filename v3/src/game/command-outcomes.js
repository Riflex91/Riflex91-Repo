'use strict';

const { finite } = require('../core/numeric');
const { createSnapshotEntityIndex, entityById: indexedEntityById } = require('../core/snapshot-entity-index');

const CommandOutcomeState = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  TIMED_OUT: 'TIMED_OUT'
});

function entityById(snapshot, id, index = null) {
  if (!snapshot || id == null) return null;
  if (index && index.snapshot === snapshot) return indexedEntityById(index, id);
  const wanted = String(id);
  return (snapshot.entities || []).find((entity) => entity && String(entity.id) === wanted) || null;
}

function inventoryCount(snapshot, prefix) {
  const inventory = snapshot && snapshot.character && snapshot.character.inventory || [];
  return inventory.reduce((sum, item) => {
    if (!item || !String(item.name || '').startsWith(prefix)) return sum;
    return sum + Math.max(0, Number(item.q) || 1);
  }, 0);
}

class CommandOutcomeTracker {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.capacity = Math.max(50, Number(options.capacity) || 500);
    this.pendingCapacity = Math.max(10, Number(options.pendingCapacity) || 100);
    this.moveMinDelta = Math.max(1, Number(options.moveMinDelta) || 4);
    this.defaultTimeoutMs = Math.max(500, Number(options.defaultTimeoutMs) || 2500);
    this.nextId = 1;
    this.nextTerminalSeq = 1;
    this.pending = new Map();
    this.history = [];
    this.terminalQueue = [];
    this.droppedPending = 0;
    this.droppedHistory = 0;
  }

  _timeoutFor(action) {
    if (action === 'attack') return 2000;
    if (action === 'stop') return 1500;
    if (action === 'smart_move' || action === 'town') return 5000;
    return this.defaultTimeoutMs;
  }

  issue(spec = {}) {
    const now = this.now();
    if (this.pending.size >= this.pendingCapacity) {
      const oldest = [...this.pending.values()].sort((a, b) => a.issuedAt - b.issuedAt)[0];
      if (oldest) {
        this.pending.delete(oldest.id);
        this.droppedPending += 1;
        this._terminal(oldest, CommandOutcomeState.TIMED_OUT, 'PENDING_CAPACITY_EVICTION', now);
      }
    }

    const record = {
      id: spec.id || `outcome-${now}-${this.nextId++}`,
      action: String(spec.action || ''),
      args: Array.isArray(spec.args) ? spec.args.map((value) => {
        if (value && typeof value === 'object') return value.id || value.name || '[object]';
        return value;
      }) : [],
      issuedAt: now,
      expiresAt: now + Math.max(500, Number(spec.timeoutMs) || this._timeoutFor(spec.action)),
      state: CommandOutcomeState.PENDING,
      reason: 'AWAITING_OBSERVED_EFFECT',
      before: spec.before || null,
      confirmedAt: null,
      observed: null,
      terminalSeq: null
    };
    this.pending.set(record.id, record);
    if (this.log) this.log.emit({
      component: 'adapter',
      event: 'COMMAND_OUTCOME_PENDING',
      data: { outcomeId: record.id, action: record.action, expiresAt: record.expiresAt }
    });
    return { ...record };
  }

  _effect(record, snapshot, entityIndex = null) {
    if (!snapshot || !snapshot.character || !record.before) return null;
    const before = record.before;
    const c = snapshot.character;
    const action = record.action;

    if (action === 'move' || action === 'smart_move' || action === 'town') {
      if (before.map && c.map && before.map !== c.map) return { kind: 'MAP_CHANGED', map: c.map };
      const bx = finite(before.x, null);
      const by = finite(before.y, null);
      const x = finite(c.x, null);
      const y = finite(c.y, null);
      if (bx != null && by != null && x != null && y != null) {
        const delta = Math.hypot(x - bx, y - by);
        if (delta >= this.moveMinDelta) return { kind: 'POSITION_CHANGED', delta: Number(delta.toFixed(2)), x, y };
      }
      if ((action === 'smart_move' || action === 'town') && c.moving && !before.moving) return { kind: 'MOVEMENT_STARTED' };
      return null;
    }

    if (action === 'stop') {
      if (before.moving && !c.moving) return { kind: 'MOVEMENT_STOPPED' };
      if (!before.moving && !c.moving) return { kind: 'ALREADY_STOPPED' };
      return null;
    }

    if (action === 'attack' || action === 'use_skill') {
      const targetId = action === 'attack' ? record.args[0] : record.args[1];
      const target = entityById(snapshot, targetId, entityIndex);
      if (before.targetPresent && !target) return { kind: 'TARGET_GONE', targetId: targetId || null };
      if (target && (target.dead || (target.hp != null && Number(target.hp) <= 0))) return { kind: 'TARGET_DEAD', targetId: target.id };
      if (target && before.targetHp != null && target.hp != null && Number(target.hp) < Number(before.targetHp)) {
        return { kind: 'TARGET_HP_DECREASED', targetId: target.id, beforeHp: before.targetHp, afterHp: Number(target.hp) };
      }
      if (action === 'use_skill' && before.mp != null && c.mp != null && Number(c.mp) < Number(before.mp)) {
        return { kind: 'MP_DECREASED', beforeMp: before.mp, afterMp: Number(c.mp) };
      }
      return null;
    }

    if (action === 'use_hp') {
      if (before.hp != null && c.hp != null && Number(c.hp) > Number(before.hp)) return { kind: 'HP_INCREASED', beforeHp: before.hp, afterHp: Number(c.hp) };
      if (inventoryCount(snapshot, 'hpot') < Number(before.hpPotionCount || 0)) return { kind: 'HP_POTION_CONSUMED' };
      return null;
    }

    if (action === 'use_mp') {
      if (before.mp != null && c.mp != null && Number(c.mp) > Number(before.mp)) return { kind: 'MP_INCREASED', beforeMp: before.mp, afterMp: Number(c.mp) };
      if (inventoryCount(snapshot, 'mpot') < Number(before.mpPotionCount || 0)) return { kind: 'MP_POTION_CONSUMED' };
      return null;
    }

    if (action === 'use_hp_or_mp') {
      if (before.hp != null && c.hp != null && Number(c.hp) > Number(before.hp)) return { kind: 'HP_INCREASED' };
      if (before.mp != null && c.mp != null && Number(c.mp) > Number(before.mp)) return { kind: 'MP_INCREASED' };
      const beforePotions = Number(before.hpPotionCount || 0) + Number(before.mpPotionCount || 0);
      const afterPotions = inventoryCount(snapshot, 'hpot') + inventoryCount(snapshot, 'mpot');
      if (afterPotions < beforePotions) return { kind: 'POTION_CONSUMED' };
      return null;
    }

    return null;
  }

  _terminal(record, state, reason, at, observed = null) {
    this.pending.delete(record.id);
    record.state = state;
    record.reason = reason;
    record.confirmedAt = at;
    record.observed = observed;
    record.terminalSeq = this.nextTerminalSeq++;
    const stored = { ...record };
    this.history.push(stored);
    this.terminalQueue.push(stored);
    if (this.history.length > this.capacity) {
      const drop = this.history.length - this.capacity;
      this.history.splice(0, drop);
      this.droppedHistory += drop;
    }
    if (this.terminalQueue.length > this.capacity) this.terminalQueue.splice(0, this.terminalQueue.length - this.capacity);
    if (this.log) this.log.emit({
      component: 'adapter',
      event: state === CommandOutcomeState.CONFIRMED ? 'COMMAND_OUTCOME_CONFIRMED' : 'COMMAND_OUTCOME_TIMED_OUT',
      severity: state === CommandOutcomeState.CONFIRMED ? 'info' : 'warn',
      reason,
      data: { outcomeId: record.id, action: record.action, observed }
    });
    return stored;
  }

  observe(snapshot) {
    const now = this.now();
    const completed = [];
    const entityIndex = createSnapshotEntityIndex(snapshot);
    for (const record of [...this.pending.values()]) {
      const effect = this._effect(record, snapshot, entityIndex);
      if (effect) {
        completed.push(this._terminal(record, CommandOutcomeState.CONFIRMED, effect.kind, now, effect));
        continue;
      }
      if (now >= record.expiresAt) completed.push(this._terminal(record, CommandOutcomeState.TIMED_OUT, 'OBSERVED_EFFECT_TIMEOUT', now));
    }
    return completed;
  }

  get(id) {
    if (!id) return null;
    const pending = this.pending.get(String(id));
    if (pending) return { ...pending };
    const terminal = [...this.history].reverse().find((record) => record.id === String(id));
    return terminal ? { ...terminal } : null;
  }

  drainTerminal(limit = 100) {
    const count = Math.max(0, Math.min(this.terminalQueue.length, Number(limit) || 0));
    return this.terminalQueue.splice(0, count).map((record) => ({ ...record }));
  }

  status() {
    const counts = { PENDING: this.pending.size, CONFIRMED: 0, TIMED_OUT: 0 };
    for (const record of this.history) counts[record.state] = (counts[record.state] || 0) + 1;
    return {
      counts,
      pendingCapacity: this.pendingCapacity,
      historyCapacity: this.capacity,
      historySize: this.history.length,
      droppedPending: this.droppedPending,
      droppedHistory: this.droppedHistory,
      recent: this.history.slice(-20).map((record) => ({
        id: record.id,
        action: record.action,
        state: record.state,
        reason: record.reason,
        issuedAt: record.issuedAt,
        confirmedAt: record.confirmedAt
      }))
    };
  }
}

module.exports = { CommandOutcomeTracker, CommandOutcomeState, inventoryCount, entityById };
