'use strict';

const { finite, clone, levelOf, inventoryOf, characterOf, gameDataOf, gradeForLevel } = require('./alpha27-utils');
const { candidateSlots, effectiveStats } = require('../economy/gear-progression');

const SELF_GEAR_MODE = 'alpha27-merchant-self-gear-v1';
const TERMINAL_STAGES = new Set(['DONE', 'FAILED_SAFE']);

function itemValue(meta) {
  return Math.max(0, finite(meta && (meta.g != null ? meta.g : meta.gold), 0));
}

function compatible(meta, ctype) {
  if (!meta) return false;
  const classes = Array.isArray(meta.class) ? meta.class : meta.class ? [meta.class] : [];
  return !classes.length || classes.map((row) => String(row).toLowerCase()).includes(String(ctype || '').toLowerCase());
}

class MerchantSelfGear {
  constructor(runtime, atomic, shared) {
    this.runtime = runtime;
    this.atomic = atomic;
    this.root = runtime.root || globalThis;
    this.now = shared.now;
    this.log = shared.log;
    this.options = shared.options;
    this.storageKey = 'aio-v3-alpha27-self-gear-v1';
    this.session = null;
    this.lastSession = null;
    this.stats = {
      sessionsStarted: 0,
      unequips: 0,
      mutations: 0,
      mutationSuccesses: 0,
      mutationFailures: 0,
      reequips: 0,
      fallbackEquips: 0,
      skippedNoFallback: 0,
      skippedNoWorkspace: 0,
      failedSafe: 0,
      speedPrioritySelections: 0
    };
    this._load();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'alpha27-self-gear', event, severity, reason, data }); } catch (_) {}
  }

  _storage() {
    const ls = this.root && this.root.localStorage;
    return ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function' ? ls : null;
  }

  _load() {
    const storage = this._storage();
    if (!storage) return;
    try {
      const raw = storage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || data.schemaVersion !== 1 || !data.session || TERMINAL_STAGES.has(data.session.stage)) return;
      this.session = data.session;
      this.runtime.merchantSelfGearReservation = clone(data.reservation || null);
    } catch (_) {}
  }

  _save() {
    const storage = this._storage();
    if (!storage) return false;
    try {
      storage.setItem(this.storageKey, JSON.stringify({
        schemaVersion: 1,
        savedAt: this.now(),
        session: this.session,
        reservation: this.runtime.merchantSelfGearReservation || null
      }));
      return true;
    } catch (_) { return false; }
  }

  _capacity() {
    const c = characterOf(this.runtime) || {};
    const items = inventoryOf(this.root);
    const capacity = Math.max(items.length, Math.floor(finite(c.isize, items.length)));
    const occupied = items.slice(0, capacity).filter(Boolean).length;
    return { capacity, occupied, free: Math.max(0, capacity - occupied) };
  }

  _fallback(slot, excluded = new Set()) {
    const c = characterOf(this.runtime) || {};
    const gd = gameDataOf(this.runtime);
    const rows = [];
    for (const item of inventoryOf(this.root)) {
      if (!item || excluded.has(Number(item.index)) || item.locked || item.l || item.special || item.p) continue;
      const meta = gd.items && gd.items[item.name];
      if (!meta || !compatible(meta, c.ctype) || !candidateSlots(meta).includes(slot)) continue;
      const level = levelOf(item);
      const stats = effectiveStats(meta, level);
      rows.push({ index: item.index, name: item.name, level, speed: finite(stats.speed, 0) });
    }
    rows.sort((a, b) => b.speed - a.speed || b.level - a.level || a.name.localeCompare(b.name) || a.index - b.index);
    return rows[0] || null;
  }

  _candidate() {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant' || !c.slots) return null;
    const gd = gameDataOf(this.runtime);
    const pressure = this._capacity();
    if (pressure.free < 1) {
      this.stats.skippedNoWorkspace += 1;
      return null;
    }
    const slotOrder = ['mainhand', 'offhand', 'helmet', 'chest', 'pants', 'shoes', 'gloves', 'cape', 'amulet', 'belt', 'orb', 'ring1', 'ring2', 'earring1', 'earring2'];
    const rows = [];
    for (const slot of slotOrder) {
      const equipped = c.slots[slot];
      if (!equipped || !equipped.name || equipped.l || equipped.locked || equipped.p || equipped.special) continue;
      const meta = gd.items && gd.items[equipped.name];
      if (!meta || !compatible(meta, c.ctype)) continue;
      const level = levelOf(equipped);
      const type = meta.compound ? 'COMPOUND' : meta.upgrade ? 'UPGRADE' : null;
      if (!type) continue;
      if (type === 'UPGRADE' && (level >= this.options.maxUpgradeLevel || itemValue(meta) > this.options.upgradeValueCap)) continue;
      if (type === 'COMPOUND' && (level >= this.options.maxCompoundLevel || itemValue(meta) > this.options.compoundValueCap)) continue;
      if (gradeForLevel(meta, level) >= 4) continue;
      const budget = this.atomic.mutationAttemptBudget({ type, character: c.name, item: equipped.name, level });
      if (!budget.allowed) continue;

      const matches = inventoryOf(this.root)
        .filter((item) => item && item.name === equipped.name && levelOf(item) === level && !item.locked && !item.l && !item.special && !item.p)
        .map((item) => ({ index: item.index, name: item.name, level }));

      const usesSpare = type === 'UPGRADE' ? matches.length >= 1 : matches.length >= 3;
      if (type === 'COMPOUND' && matches.length < 2) continue;

      let fallback = { slot, name: equipped.name, level, equipped: true };
      if (!usesSpare) {
        const excluded = new Set(type === 'COMPOUND' ? matches.slice(0, 2).map((row) => Number(row.index)) : []);
        fallback = this._fallback(slot, excluded);
        // If the worn item must participate, mutation can destroy it. Never
        // voluntarily leave the Merchant without a valid replacement.
        if (!fallback) {
          this.stats.skippedNoFallback += 1;
          continue;
        }
      }
      const currentStats = effectiveStats(meta, level);
      const nextStats = effectiveStats(meta, level + 1);
      const speedGain = finite(nextStats.speed, 0) - finite(currentStats.speed, 0);
      rows.push({
        slot, type, name: equipped.name, level, fallback, budget,
        usesSpare,
        speedGain,
        currentSpeed: finite(currentStats.speed, 0),
        inventoryMatches: matches.slice(0, type === 'COMPOUND' ? 3 : 1)
      });
    }
    rows.sort((a, b) => b.speedGain - a.speedGain
      || b.currentSpeed - a.currentSpeed
      || a.level - b.level
      || (a.type === 'COMPOUND' ? -1 : 1)
      || a.slot.localeCompare(b.slot));
    const selected = rows[0] || null;
    if (selected && selected.speedGain > 0) this.stats.speedPrioritySelections += 1;
    return selected;
  }

  _reservationMatches(session, indices) {
    return {
      sessionId: session.id,
      type: session.type,
      slot: session.slot,
      character: session.character,
      item: session.name,
      level: session.level,
      indices: indices.map(Number).sort((a, b) => a - b)
    };
  }

  _findMutationIndices(session) {
    const matches = inventoryOf(this.root)
      .filter((item) => item && item.name === session.name && levelOf(item) === session.level && !item.locked && !item.l && !item.special && !item.p)
      .map((item) => Number(item.index))
      .sort((a, b) => a - b);
    if (session.type === 'UPGRADE') return matches.length ? [matches[0]] : [];
    return matches.length >= 3 ? matches.slice(0, 3) : [];
  }

  _findEquipCandidate(session, outcome) {
    const wantedLevel = outcome === 'SUCCESS' ? session.level + 1 : session.level;
    const rows = inventoryOf(this.root)
      .filter((item) => item && item.name === session.name && levelOf(item) === wantedLevel)
      .map((item) => ({ index: Number(item.index), name: item.name, level: levelOf(item) }));
    if (rows.length) return { ...rows[0], fallback: false };
    const fallback = this._fallback(session.slot, new Set());
    return fallback ? { ...fallback, fallback: true } : null;
  }

  async _equip(session, candidate) {
    if (!candidate || !this.runtime.adapter || typeof this.runtime.adapter.command !== 'function') return false;
    const command = this.runtime.adapter.command('equip', [candidate.index, session.slot]);
    if (!command || command.executed !== true) return false;
    try { await Promise.resolve(command.value); } catch (_) {}
    const verified = await this.atomic.verifyEventually(() => {
      const c = characterOf(this.runtime);
      const item = c && c.slots && c.slots[session.slot];
      return !!(item && item.name === candidate.name && levelOf(item) === candidate.level);
    });
    if (!verified) return false;
    this.stats.reequips += 1;
    if (candidate.fallback) this.stats.fallbackEquips += 1;
    return true;
  }

  _finish(reason, details = {}) {
    const session = this.session;
    this.lastSession = { ...clone(session), endedAt: this.now(), endReason: reason, ...clone(details) };
    this.session = null;
    this.runtime.merchantSelfGearReservation = null;
    this._save();
    this._event('ALPHA27_SELF_GEAR_SESSION_FINISHED', reason === 'SUCCESS' ? 'info' : 'warn', reason, this.lastSession);
  }

  async cycle() {
    const c = characterOf(this.runtime);
    if (!c || String(c.ctype || c.type || '').toLowerCase() !== 'merchant') return false;

    if (!this.session) {
      const candidate = this._candidate();
      if (!candidate) return false;
      this.session = {
        schemaVersion: 1,
        id: `selfgear-${this.now().toString(36)}-${candidate.slot}`,
        startedAt: this.now(),
        updatedAt: this.now(),
        stage: candidate.usesSpare ? 'WAIT_LEDGER' : 'UNEQUIP',
        character: c.name,
        ...clone(candidate)
      };
      this.stats.sessionsStarted += 1;
      this._save();
    }

    const session = this.session;
    if (session.stage === 'UNEQUIP') {
      const current = c.slots && c.slots[session.slot];
      if (!current || current.name !== session.name || levelOf(current) !== session.level) {
        this._finish('SELF_GEAR_SLOT_CHANGED_BEFORE_UNEQUIP');
        return true;
      }
      const command = this.runtime.adapter && this.runtime.adapter.command
        ? this.runtime.adapter.command('unequip', [session.slot])
        : null;
      if (!command || command.executed !== true) {
        this._finish('SELF_GEAR_UNEQUIP_COMMAND_REJECTED');
        return true;
      }
      try { await Promise.resolve(command.value); } catch (_) {}
      const verified = await this.atomic.verifyEventually(() => {
        const live = characterOf(this.runtime);
        return !(live && live.slots && live.slots[session.slot]);
      });
      if (!verified) {
        this.stats.failedSafe += 1;
        this._finish('SELF_GEAR_UNEQUIP_NOT_VERIFIED');
        return true;
      }
      this.stats.unequips += 1;
      session.stage = 'WAIT_LEDGER';
      session.updatedAt = this.now();
      this._save();
      return true;
    }

    if (session.stage === 'WAIT_LEDGER') {
      const indices = this._findMutationIndices(session);
      const needed = session.type === 'COMPOUND' ? 3 : 1;
      if (indices.length < needed) return true;
      const ledger = this.runtime.inventoryLedger;
      const status = ledger && typeof ledger.status === 'function' ? ledger.status() : null;
      if (!status || status.stale === true || indices.some((index) => !ledger.get(session.character, index))) return true;

      this.runtime.merchantSelfGearReservation = this._reservationMatches(session, indices);
      this._save();
      const request = {
        type: session.type,
        character: session.character,
        index: indices[0],
        indices,
        metadata: {
          source: 'ALPHA27_SELF_GEAR',
          selfGear: true,
          selfGearSessionId: session.id,
          selfGearSlot: session.slot
        }
      };
      const planned = this.runtime.transactionEngine.planAtomic(request, { ledger, snapshot: this.runtime.lastSnapshot });
      if (!planned || planned.accepted !== true || !planned.transaction) {
        this.runtime.merchantSelfGearReservation = null;
        this._save();
        return true;
      }
      session.stage = 'MUTATING';
      session.transactionId = planned.transaction.id;
      session.indices = indices;
      session.updatedAt = this.now();
      this._save();
      this.stats.mutations += 1;
      const result = await this.runtime.controlledMerchant.execute(planned.transaction.id);
      session.mutationResult = clone(result);
      session.outcome = result && result.outcome || null;
      session.updatedAt = this.now();
      if (result && result.outcome === 'SUCCESS') {
        this.stats.mutationSuccesses += 1;
        session.stage = 'REEQUIP';
      } else {
        this.stats.mutationFailures += 1;
        if (session.usesSpare) {
          this.runtime.merchantSelfGearReservation = null;
          this._finish('MUTATION_FAILED_CURRENT_GEAR_RETAINED', { outcome: session.outcome });
          return true;
        }
        session.stage = 'REEQUIP';
      }
      this.runtime.merchantSelfGearReservation = null;
      this._save();
      return true;
    }

    if (session.stage === 'MUTATING') {
      const tx = this.runtime.transactionEngine && this.runtime.transactionEngine.get(session.transactionId);
      if (tx && tx.state === 'RECOVERING' && typeof this.runtime.transactionEngine.reconcileAtomic === 'function') {
        this.runtime.transactionEngine.reconcileAtomic(tx.id);
      }
      session.stage = 'REEQUIP';
      session.updatedAt = this.now();
      this._save();
      return true;
    }

    if (session.stage === 'REEQUIP') {
      const outcome = session.outcome || session.mutationResult && session.mutationResult.outcome || null;
      const candidate = this._findEquipCandidate(session, outcome);
      if (!candidate) {
        this.stats.failedSafe += 1;
        this._finish('SELF_GEAR_NO_REEQUIP_CANDIDATE', { outcome });
        return true;
      }
      const ok = await this._equip(session, candidate);
      if (!ok) {
        this.stats.failedSafe += 1;
        this._finish('SELF_GEAR_REEQUIP_NOT_VERIFIED', { outcome, candidate });
        return true;
      }
      this._finish(candidate.fallback ? 'MUTATION_FAILED_FALLBACK_EQUIPPED' : 'SUCCESS', { outcome, equipped: candidate });
      return true;
    }

    return false;
  }

  status() {
    return {
      mode: SELF_GEAR_MODE,
      enabled: true,
      requiresFallbackBeforeRisk: true,
      spareFirst: true,
      primaryStat: 'speed',
      speedPriority: 'NEXT_LEVEL_SPEED_GAIN_FIRST',
      fallbackSpeedFirst: true,
      session: clone(this.session),
      lastSession: clone(this.lastSession),
      stats: clone(this.stats)
    };
  }
}

module.exports = { MerchantSelfGear, SELF_GEAR_MODE };
