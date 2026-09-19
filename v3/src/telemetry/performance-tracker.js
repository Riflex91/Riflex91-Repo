'use strict';

function number(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }

function potionCounts(inventory) {
  const totals = { hpPotions: 0, mpPotions: 0, total: 0 };
  for (const item of inventory || []) {
    if (!item || !/^(hpot|mpot)/i.test(String(item.name || ''))) continue;
    const quantity = Math.max(0, number(item.q) || 1);
    if (/^hpot/i.test(String(item.name || ''))) totals.hpPotions += quantity;
    else if (/^mpot/i.test(String(item.name || ''))) totals.mpPotions += quantity;
  }
  totals.total = totals.hpPotions + totals.mpPotions;
  return totals;
}
function potionCount(inventory) { return potionCounts(inventory).total; }

function levelRequirement(gameData, level) {
  const levels = gameData && gameData.levels;
  if (!levels) return null;
  const raw = Array.isArray(levels) ? levels[level] : levels[level] != null ? levels[level] : levels[String(level)];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function xpDelta(previous, current, gameData) {
  if (!previous || !current) return 0;
  const before = number(previous.xp);
  const after = number(current.xp);
  const beforeLevel = number(previous.level);
  const afterLevel = number(current.level);
  if (afterLevel === beforeLevel) return Math.max(0, after - before);
  if (afterLevel < beforeLevel) return 0;

  let total = -before + after;
  for (let level = beforeLevel; level < afterLevel; level++) {
    const required = levelRequirement(gameData, level);
    if (required == null) return Math.max(0, after - before);
    total += required;
  }
  return Math.max(0, total);
}

class PerformanceTracker {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.windowMs = Math.max(1000, Number(options.windowMs) || 60000);
    this.minRecordSeconds = Math.max(1, Number(options.minRecordSeconds) || 5);
    this.historyCapacity = Math.max(10, Number(options.historyCapacity) || 120);
    this.previous = null;
    this.window = null;
    this.history = [];
    this.nextWindowId = 1;
  }

  _start(snapshot, context) {
    const now = this.now();
    this.window = {
      id: `perf-${this.nextWindowId++}`,
      startedAt: now,
      lastObservedAt: now,
      character: snapshot.character.name,
      map: snapshot.character.map,
      partyFingerprint: context.partyFingerprint || 'unknown-party',
      xp: 0,
      gold: 0,
      kills: 0,
      deaths: 0,
      potions: 0,
      hpPotions: 0,
      mpPotions: 0,
      damageTaken: 0,
      monsterHpLost: 0,
      targetSamples: {},
      killsByMonster: {},
      damageEventsByMonster: {},
      samples: 0
    };
  }

  _contextChanged(snapshot, context) {
    return this.window && (
      this.window.character !== snapshot.character.name ||
      this.window.map !== snapshot.character.map ||
      this.window.partyFingerprint !== (context.partyFingerprint || 'unknown-party')
    );
  }

  _entityMap(snapshot) {
    const map = new Map();
    for (const entity of snapshot && snapshot.entities || []) map.set(entity.id, entity);
    return map;
  }

  _increment(object, key, amount = 1) {
    if (!key) return;
    object[key] = (object[key] || 0) + amount;
  }

  _observeTransition(previous, current, context) {
    const w = this.window;
    const prevC = previous.character;
    const currC = current.character;
    w.samples += 1;
    w.lastObservedAt = this.now();
    w.xp += xpDelta(prevC, currC, context.gameData);
    w.gold += number(currC.gold) - number(prevC.gold);

    if (!prevC.rip && currC.rip) w.deaths += 1;
    if (number(prevC.hp) > number(currC.hp)) w.damageTaken += number(prevC.hp) - number(currC.hp);

    const beforePotions = potionCounts(prevC.inventory);
    const afterPotions = potionCounts(currC.inventory);
    const hpUsed = Math.max(0, beforePotions.hpPotions - afterPotions.hpPotions);
    const mpUsed = Math.max(0, beforePotions.mpPotions - afterPotions.mpPotions);
    if (hpUsed) w.hpPotions += hpUsed;
    if (mpUsed) w.mpPotions += mpUsed;
    if (hpUsed || mpUsed) w.potions += hpUsed + mpUsed;

    const prevEntities = this._entityMap(previous);
    const currEntities = this._entityMap(current);
    for (const [id, before] of prevEntities) {
      if (!before.mtype) continue;
      const after = currEntities.get(id);
      if (!after) continue;
      const beforeHp = number(before.hp);
      const afterHp = number(after.hp);
      if (beforeHp > afterHp) {
        w.monsterHpLost += beforeHp - afterHp;
        this._increment(w.damageEventsByMonster, before.mtype);
      }
      const wasAlive = !before.dead && (before.hp == null || beforeHp > 0);
      const isDead = !!after.dead || (after.hp != null && afterHp <= 0);
      if (wasAlive && isDead) {
        w.kills += 1;
        this._increment(w.killsByMonster, before.mtype);
      }
    }

    const targetId = currC.target;
    if (targetId) {
      const target = currEntities.get(String(targetId)) || currEntities.get(targetId);
      if (target && target.mtype) this._increment(w.targetSamples, target.mtype);
    }
  }

  _dominantMonster(window) {
    const score = {};
    for (const [monster, count] of Object.entries(window.targetSamples)) this._increment(score, monster, count);
    for (const [monster, count] of Object.entries(window.killsByMonster)) this._increment(score, monster, count * 8);
    for (const [monster, count] of Object.entries(window.damageEventsByMonster)) this._increment(score, monster, count * 2);
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!ranked.length) return { monster: null, confidence: 0, mixed: false };
    const total = ranked.reduce((sum, row) => sum + row[1], 0);
    const share = total > 0 ? ranked[0][1] / total : 0;
    return { monster: share >= 0.6 || ranked.length === 1 ? ranked[0][0] : null, confidence: share, mixed: ranked.length > 1 && share < 0.6 };
  }

  _rates(window, seconds) {
    const hours = seconds / 3600;
    return {
      xpPerHour: hours > 0 ? window.xp / hours : 0,
      goldPerHour: hours > 0 ? window.gold / hours : 0,
      killsPerHour: hours > 0 ? window.kills / hours : 0,
      deathsPerHour: hours > 0 ? window.deaths / hours : 0,
      potionsPerHour: hours > 0 ? window.potions / hours : 0,
      hpPotionsPerHour: hours > 0 ? window.hpPotions / hours : 0,
      mpPotionsPerHour: hours > 0 ? window.mpPotions / hours : 0,
      damageTakenPerHour: hours > 0 ? window.damageTaken / hours : 0,
      monsterHpLostPerHour: hours > 0 ? window.monsterHpLost / hours : 0
    };
  }

  flush(context = {}, reason = 'WINDOW_COMPLETE') {
    if (!this.window) return null;
    const now = this.now();
    const seconds = Math.max(0, (now - this.window.startedAt) / 1000);
    const dominant = this._dominantMonster(this.window);
    const completed = {
      ...this.window,
      endedAt: now,
      seconds,
      monster: dominant.monster,
      targetConfidence: dominant.confidence,
      mixedTargets: dominant.mixed,
      rates: this._rates(this.window, seconds),
      reason
    };
    this.history.push(completed);
    if (this.history.length > this.historyCapacity) this.history.splice(0, this.history.length - this.historyCapacity);

    if (this.log) {
      this.log.emit({
        component: 'performance',
        event: 'PERFORMANCE_WINDOW_COMPLETED',
        character: completed.character,
        reason: dominant.monster ? reason : (dominant.mixed ? 'MIXED_TARGETS' : 'TARGET_UNKNOWN'),
        data: {
          windowId: completed.id,
          seconds: Number(seconds.toFixed(3)),
          monster: dominant.monster,
          targetConfidence: Number(dominant.confidence.toFixed(3)),
          partyFingerprint: completed.partyFingerprint,
          map: completed.map,
          xp: completed.xp,
          gold: completed.gold,
          kills: completed.kills,
          deaths: completed.deaths,
          potions: completed.potions,
          hpPotions: completed.hpPotions,
          mpPotions: completed.mpPotions,
          damageTaken: completed.damageTaken,
          monsterHpLost: completed.monsterHpLost,
          rates: completed.rates
        }
      });
    }

    const world = context.world;
    if (world && dominant.monster && seconds >= this.minRecordSeconds) {
      world.recordPerformance(dominant.monster, completed.partyFingerprint, {
        seconds,
        xp: completed.xp,
        gold: completed.gold,
        kills: completed.kills,
        deaths: completed.deaths,
        potions: completed.potions,
        hpPotions: completed.hpPotions,
        mpPotions: completed.mpPotions,
        damageTaken: completed.damageTaken,
        monsterHpLost: completed.monsterHpLost
      });
    }
    this.window = null;
    return completed;
  }

  observe(snapshot, context = {}) {
    if (!snapshot || !snapshot.character) return null;
    if (!this.window) this._start(snapshot, context);
    if (this.previous && this._contextChanged(snapshot, context)) {
      this.flush(context, 'CONTEXT_CHANGED');
      this._start(snapshot, context);
      this.previous = snapshot;
      return this.status();
    }
    if (this.previous) this._observeTransition(this.previous, snapshot, context);
    this.previous = snapshot;

    if (this.now() - this.window.startedAt >= this.windowMs) {
      this.flush(context, 'WINDOW_COMPLETE');
      this._start(snapshot, context);
    }
    return this.status();
  }

  status() {
    const current = this.window ? {
      id: this.window.id,
      startedAt: this.window.startedAt,
      seconds: Math.max(0, (this.now() - this.window.startedAt) / 1000),
      character: this.window.character,
      map: this.window.map,
      partyFingerprint: this.window.partyFingerprint,
      xp: this.window.xp,
      gold: this.window.gold,
      kills: this.window.kills,
      deaths: this.window.deaths,
      potions: this.window.potions,
      hpPotions: this.window.hpPotions,
      mpPotions: this.window.mpPotions,
      damageTaken: this.window.damageTaken,
      monsterHpLost: this.window.monsterHpLost,
      rates: this._rates(this.window, Math.max(0, (this.now() - this.window.startedAt) / 1000))
    } : null;
    return { windowMs: this.windowMs, current, recent: this.history.slice(-10) };
  }
}

module.exports = { PerformanceTracker, xpDelta, potionCount, potionCounts };
