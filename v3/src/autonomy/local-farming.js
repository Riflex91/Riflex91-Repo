'use strict';

const SAFE_DISPOSITIONS = new Set(['LEGACY_ALLOWED', 'APPROVED']);

function finite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function distance(a, b) {
  if (!a || !b) return Infinity;
  const ax = finite(a.x != null ? a.x : a.real_x);
  const ay = finite(a.y != null ? a.y : a.real_y);
  const bx = finite(b.x != null ? b.x : b.real_x);
  const by = finite(b.y != null ? b.y : b.real_y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function monsterType(raw) {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const token = raw.find((value) => typeof value === 'string' && value.trim());
    return token ? token.trim() : null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const value = raw.type || raw.mtype || raw.monster || raw.id || raw.name;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pointFromBoundary(boundary) {
  if (!Array.isArray(boundary)) return null;
  if (boundary.length >= 4 && boundary.slice(0, 4).every((value) => Number.isFinite(Number(value)))) {
    const [x1, y1, x2, y2] = boundary.slice(0, 4).map(Number);
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  }
  if (boundary.length >= 2 && boundary.slice(0, 2).every((value) => Number.isFinite(Number(value)))) {
    return { x: Number(boundary[0]), y: Number(boundary[1]) };
  }
  return null;
}

function spawnPoints(raw) {
  const points = [];
  const push = (point, source) => {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    points.push({ x: point.x, y: point.y, source });
  };

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const x = finite(raw.x);
    const y = finite(raw.y);
    if (x != null && y != null) push({ x, y }, 'xy');
    push(pointFromBoundary(raw.boundary), 'boundary');
    if (Array.isArray(raw.boundaries)) {
      for (const boundary of raw.boundaries) push(pointFromBoundary(boundary), 'boundaries');
    }
  }

  if (Array.isArray(raw)) {
    const numeric = raw.filter((value) => Number.isFinite(Number(value))).map(Number);
    if (numeric.length >= 4) push(pointFromBoundary(numeric.slice(0, 4)), 'array-boundary');
    else if (numeric.length >= 2) push({ x: numeric[0], y: numeric[1] }, 'array-xy');
    for (const value of raw) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const x = finite(value.x);
        const y = finite(value.y);
        if (x != null && y != null) push({ x, y }, 'array-object');
        push(pointFromBoundary(value.boundary), 'array-object-boundary');
      }
    }
  }

  const unique = new Map();
  for (const point of points) unique.set(`${Math.round(point.x)}:${Math.round(point.y)}`, point);
  return [...unique.values()];
}

function extractSameMapSpawns(mapName, mapData) {
  if (!mapName || !mapData || typeof mapData !== 'object') return [];
  const collection = mapData.monsters;
  if (!collection) return [];
  const values = Array.isArray(collection) ? collection : Object.values(collection);
  const rows = [];
  values.forEach((raw, index) => {
    const monster = monsterType(raw);
    if (!monster) return;
    const points = spawnPoints(raw);
    points.forEach((point, pointIndex) => rows.push({
      id: `${mapName}:${monster}:${index}:${pointIndex}`,
      map: mapName,
      monster,
      x: point.x,
      y: point.y,
      source: point.source
    }));
  });
  return rows;
}

class LocalSpawnNavigator {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.planner = options.planner || null;
    this.maxStep = clamp(options.maxStep == null ? 120 : options.maxStep, 40, 250);
    this.arrivalRadius = clamp(options.arrivalRadius == null ? 55 : options.arrivalRadius, 20, 150);
    this.moveCooldownMs = clamp(options.moveCooldownMs == null ? 1400 : options.moveCooldownMs, 500, 10000);
    this.goalHoldMs = clamp(options.goalHoldMs == null ? 15000 : options.goalHoldMs, 3000, 120000);
    this.arrivalHoldMs = clamp(options.arrivalHoldMs == null ? 4500 : options.arrivalHoldMs, 1000, 30000);
    this.goal = null;
    this.goalSince = 0;
    this.holdUntil = 0;
    this.lastMoveAt = 0;
    this.lastDecision = null;
    this.lastMove = null;
    this.rotation = 0;
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log) return;
    this.log.emit({ component: 'local-farming', event, severity, reason, data });
  }

  reset(reason = 'RESET') {
    if (this.goal) this._event('LOCAL_FARM_GOAL_CLEARED', 'info', reason, { goal: this.goal });
    this.goal = null;
    this.goalSince = 0;
    this.holdUntil = 0;
    this.lastDecision = { at: this.now(), action: 'RESET', reason };
  }

  _disposition(world, monster) {
    if (!world || typeof world.fact !== 'function') return null;
    const fact = world.fact('monster-policy', monster, 'contentSafetyDisposition');
    return fact && fact.value || null;
  }

  _safeSpawns(snapshot, gameData, world, party) {
    const character = snapshot && snapshot.character;
    if (!character || !character.map) return [];
    const mapData = gameData && gameData.maps && gameData.maps[character.map];
    const spawns = extractSameMapSpawns(character.map, mapData);
    const byMonster = new Map();

    for (const spawn of spawns) {
      const disposition = this._disposition(world, spawn.monster);
      if (!SAFE_DISPOSITIONS.has(disposition)) continue;
      const list = byMonster.get(spawn.monster) || [];
      list.push({ ...spawn, disposition });
      byMonster.set(spawn.monster, list);
    }

    const fingerprint = party && party.fingerprint || 'unknown-party';
    const rows = [];
    for (const [monster, monsterSpawns] of byMonster.entries()) {
      const nearest = monsterSpawns.slice().sort((a, b) => distance(character, a) - distance(character, b))[0];
      const learned = world && typeof world.performanceFor === 'function' ? world.performanceFor(monster, fingerprint) : null;
      const g = gameData && gameData.monsters && gameData.monsters[monster] || {};
      rows.push({
        id: monster,
        monster,
        xpPerHour: learned ? learned.xpPerHour : Math.max(0, Number(g.xp) || 0) * 60,
        goldPerHour: learned ? learned.goldPerHour : 0,
        deathsPerHour: learned ? learned.deathsPerHour : 0,
        confidence: learned ? learned.confidence : 0.05,
        travelSeconds: Number.isFinite(distance(character, nearest)) ? distance(character, nearest) / Math.max(1, Number(character.speed) || 40) : 120,
        source: learned ? 'measured-spawn' : 'metadata-spawn',
        spawn: nearest,
        spawnCount: monsterSpawns.length
      });
    }

    const ranked = this.planner && typeof this.planner.rank === 'function'
      ? this.planner.rank(rows, { character: character.name, partyFingerprint: fingerprint })
      : rows.slice().sort((a, b) => b.xpPerHour - a.xpPerHour || a.travelSeconds - b.travelSeconds || a.monster.localeCompare(b.monster));

    return ranked.map((row) => ({ ...row, spawn: row.spawn || (byMonster.get(row.monster) || [])[0] })).filter((row) => row.spawn);
  }

  candidates(context = {}) {
    const rows = this._safeSpawns(context.snapshot, context.gameData || {}, context.world, context.party);
    return rows.map((row) => ({
      monster: row.monster,
      map: row.spawn.map,
      x: row.spawn.x,
      y: row.spawn.y,
      score: Number.isFinite(Number(row.score)) ? Number(row.score) : null,
      confidence: Number(row.confidence) || 0,
      disposition: row.spawn.disposition,
      spawnCount: row.spawnCount
    }));
  }

  _select(context, preference = null) {
    const now = this.now();
    const ranked = this._safeSpawns(context.snapshot, context.gameData || {}, context.world, context.party);
    if (!ranked.length) return { ranked, selected: null, reason: 'NO_SAFE_SAME_MAP_SPAWN' };

    let eligible = ranked;
    if (preference && preference.action === 'change_farm_target' && preference.avoidMonster) {
      const alternatives = ranked.filter((row) => row.monster !== preference.avoidMonster);
      if (alternatives.length) eligible = alternatives;
    }
    if (preference && preference.preferredMonster) {
      const preferred = eligible.find((row) => row.monster === preference.preferredMonster);
      if (preferred) return { ranked, selected: preferred, reason: 'BRAIN_SAFE_PREFERENCE' };
    }

    if (this.goal && now < this.goalSince + this.goalHoldMs) {
      const held = eligible.find((row) => row.monster === this.goal.monster && row.spawn.map === this.goal.map);
      if (held) return { ranked, selected: held, reason: 'GOAL_HYSTERESIS' };
    }

    if (preference && preference.action === 'change_farm_target' && eligible.length > 1) {
      this.rotation = (this.rotation + 1) % eligible.length;
      return { ranked, selected: eligible[this.rotation], reason: 'BRAIN_SAFE_ROTATION' };
    }
    return { ranked, selected: eligible[0], reason: 'DETERMINISTIC_PLANNER' };
  }

  step(context = {}, preference = null) {
    const now = this.now();
    const snapshot = context.snapshot;
    const character = snapshot && snapshot.character;
    const adapter = context.adapter;
    if (!character || !adapter) return { acted: false, reason: 'CONTEXT_UNAVAILABLE' };
    if (preference && preference.action === 'wait' && Number(preference.expiresAt) > now) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'BRAIN_BOUNDED_WAIT', expiresAt: preference.expiresAt };
      return { acted: false, reason: 'BRAIN_BOUNDED_WAIT' };
    }
    if (now < this.holdUntil) return { acted: false, reason: 'ARRIVAL_HOLD', holdUntil: this.holdUntil };

    const movement = typeof adapter.stabilityStatus === 'function' ? adapter.stabilityStatus().movement : null;
    if (movement && movement.circuitOpen) {
      this.lastDecision = { at: now, action: 'SUPPRESS', reason: 'MOVEMENT_CIRCUIT_OPEN', circuitUntil: movement.circuitUntil };
      return { acted: false, reason: 'MOVEMENT_CIRCUIT_OPEN' };
    }
    if (movement && movement.pendingOutcomeId) return { acted: false, reason: 'MOVE_OUTCOME_PENDING', outcomeId: movement.pendingOutcomeId };

    const choice = this._select(context, preference);
    const selected = choice.selected;
    if (!selected) {
      this.reset(choice.reason);
      return { acted: false, reason: choice.reason, candidateCount: choice.ranked.length };
    }

    const spawn = selected.spawn;
    const nextGoal = {
      monster: selected.monster,
      map: spawn.map,
      x: spawn.x,
      y: spawn.y,
      score: Number.isFinite(Number(selected.score)) ? Number(selected.score) : null,
      confidence: Number(selected.confidence) || 0,
      reason: choice.reason
    };
    if (!this.goal || this.goal.monster !== nextGoal.monster || this.goal.map !== nextGoal.map || distance(this.goal, nextGoal) > 5) {
      this.goal = nextGoal;
      this.goalSince = now;
      this._event('LOCAL_FARM_GOAL_SELECTED', 'info', choice.reason, { goal: this.goal, candidateCount: choice.ranked.length });
    }

    if (character.map !== spawn.map) {
      this.lastDecision = { at: now, action: 'SUPPRESS', reason: 'CROSS_MAP_FORBIDDEN', characterMap: character.map, goalMap: spawn.map };
      return { acted: false, reason: 'CROSS_MAP_FORBIDDEN' };
    }

    const d = distance(character, spawn);
    if (!Number.isFinite(d)) return { acted: false, reason: 'SPAWN_POSITION_UNKNOWN' };
    if (d <= this.arrivalRadius) {
      this.holdUntil = now + this.arrivalHoldMs;
      this.lastDecision = { at: now, action: 'ARRIVED', reason: 'SAFE_SPAWN_REACHED', distance: d, goal: this.goal };
      this._event('LOCAL_FARM_SPAWN_REACHED', 'info', 'SAFE_SPAWN_REACHED', { goal: this.goal, distance: Math.round(d), holdUntil: this.holdUntil });
      return { acted: false, reason: 'SAFE_SPAWN_REACHED', arrived: true, distance: d };
    }
    if (now - this.lastMoveAt < this.moveCooldownMs) return { acted: false, reason: 'LOCAL_MOVE_COOLDOWN' };

    const cx = finite(character.x != null ? character.x : character.real_x);
    const cy = finite(character.y != null ? character.y : character.real_y);
    if (cx == null || cy == null) return { acted: false, reason: 'CHARACTER_POSITION_UNKNOWN' };
    const dx = spawn.x - cx;
    const dy = spawn.y - cy;
    const len = Math.max(1, Math.hypot(dx, dy));
    const step = Math.min(this.maxStep, Math.max(0, len - this.arrivalRadius * 0.5));
    const x = cx + (dx / len) * step;
    const y = cy + (dy / len) * step;
    const result = adapter.command('move', [x, y]);
    this.lastMoveAt = now;
    this.lastMove = { at: now, x, y, distance: d, goal: this.goal, result: { executed: !!result.executed, shadow: !!result.shadow, reason: result.reason || null, outcomeId: result.outcomeId || null } };
    this.lastDecision = { at: now, action: result.executed || result.shadow ? 'MOVE' : 'MOVE_FAILED', reason: result.reason || 'SAFE_SPAWN_SEEK', goal: this.goal };
    this._event(
      result.executed || result.shadow ? 'LOCAL_FARM_MOVE_REQUESTED' : 'LOCAL_FARM_MOVE_FAILED',
      result.executed || result.shadow ? 'info' : 'warn',
      result.reason || 'SAFE_SPAWN_SEEK',
      { goal: this.goal, x: Math.round(x), y: Math.round(y), distance: Math.round(d), outcomeId: result.outcomeId || null }
    );
    return { acted: !!result.executed || !!result.shadow, reason: result.reason || 'SAFE_SPAWN_SEEK', result, goal: this.goal };
  }

  status(context = null) {
    const candidates = context ? this.candidates(context) : [];
    return {
      enabled: true,
      sameMapOnly: true,
      unknownContentAllowed: false,
      crossMapAllowed: false,
      maxStep: this.maxStep,
      arrivalRadius: this.arrivalRadius,
      moveCooldownMs: this.moveCooldownMs,
      goalHoldMs: this.goalHoldMs,
      goal: this.goal,
      holdUntil: this.holdUntil || null,
      candidateCount: candidates.length,
      candidates: candidates.slice(0, 20),
      lastDecision: this.lastDecision,
      lastMove: this.lastMove
    };
  }
}

class ProgressWatchdog {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.watchAfterMs = clamp(options.watchAfterMs == null ? 90000 : options.watchAfterMs, 10000, 3600000);
    this.degradedAfterMs = clamp(options.degradedAfterMs == null ? 180000 : options.degradedAfterMs, this.watchAfterMs, 7200000);
    this.cooldownMs = clamp(options.cooldownMs == null ? 60000 : options.cooldownMs, 5000, 1800000);
    this.lastProgressAt = this.now();
    this.lastXp = null;
    this.lastGold = null;
    this.lastMap = null;
    this.lastState = 'HEALTHY';
    this.escalations = 0;
    this.cooldownUntil = 0;
    this.lastAction = null;
  }

  _event(event, severity, reason, data) {
    if (!this.log) return;
    this.log.emit({ component: 'progress-watchdog', event, severity: severity || 'info', reason: reason || null, data: data || {} });
  }

  observe(snapshot, options = {}) {
    const now = this.now();
    const character = snapshot && snapshot.character;
    if (!character) return this.status();
    const xp = finite(character.xp, 0);
    const gold = finite(character.gold, 0);
    const map = character.map || null;
    const progressed = this.lastXp == null || xp > this.lastXp || gold > this.lastGold || (this.lastMap != null && map !== this.lastMap);
    if (progressed) {
      this.lastProgressAt = now;
      if (this.lastState !== 'HEALTHY') this._event('FARM_PROGRESS_RECOVERED', 'info', 'MEANINGFUL_PROGRESS', { previousState: this.lastState });
      this.lastState = 'HEALTHY';
      this.escalations = 0;
      this.cooldownUntil = 0;
    }
    this.lastXp = xp;
    this.lastGold = gold;
    this.lastMap = map;

    const paused = options.paused === true || character.rip === true;
    if (paused) return this.status();
    const age = Math.max(0, now - this.lastProgressAt);
    let state = 'HEALTHY';
    if (now < this.cooldownUntil) state = 'COOLDOWN';
    else if (age >= this.degradedAfterMs) state = 'DEGRADED';
    else if (age >= this.watchAfterMs) state = 'WATCH';
    if (state !== this.lastState) {
      this._event('FARM_PROGRESS_STATE_CHANGED', state === 'DEGRADED' ? 'warn' : 'info', state, { from: this.lastState, to: state, progressAgeMs: age });
      this.lastState = state;
    }
    return this.status();
  }

  requestReassessment() {
    const now = this.now();
    if (this.lastState !== 'DEGRADED' || now < this.cooldownUntil) return false;
    this.escalations += 1;
    this.cooldownUntil = now + this.cooldownMs;
    this.lastState = 'COOLDOWN';
    this.lastAction = { at: now, action: 'REASSESS_LOCAL_PLAN', escalation: this.escalations, cooldownUntil: this.cooldownUntil };
    this._event('FARM_PROGRESS_REASSESS_REQUESTED', 'warn', 'NO_MEANINGFUL_PROGRESS', this.lastAction);
    return true;
  }

  status() {
    const now = this.now();
    return {
      state: this.lastState,
      lastProgressAt: this.lastProgressAt,
      progressAgeMs: Math.max(0, now - this.lastProgressAt),
      watchAfterMs: this.watchAfterMs,
      degradedAfterMs: this.degradedAfterMs,
      cooldownMs: this.cooldownMs,
      cooldownUntil: this.cooldownUntil || null,
      cooldownRemainingMs: Math.max(0, this.cooldownUntil - now),
      escalations: this.escalations,
      lastAction: this.lastAction
    };
  }
}

module.exports = { LocalSpawnNavigator, ProgressWatchdog, extractSameMapSpawns, SAFE_DISPOSITIONS };
