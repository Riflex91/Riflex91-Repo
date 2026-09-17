'use strict';

const FARM_AREA_PRESSURE_MODE = 'adaptive-local-farm-area-pressure-v1';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function clone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
}

function areaKey(value) {
  if (!value) return null;
  const map = String(value.map || 'unknown');
  const monster = String(value.monster || value.mtype || 'unknown');
  const spawn = Number.isFinite(Number(value.spawnIndex)) ? Number(value.spawnIndex) : 'x';
  return `${map}:${monster}:${spawn}`;
}

class FarmAreaPressureHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.localFarming || !runtime.localFarming.planner) throw new Error('local farming planner required');
    this.runtime = runtime;
    this.localFarming = runtime.localFarming;
    this.planner = runtime.localFarming.planner;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.config = {
      sampleIntervalMs: Math.max(500, finite(options.sampleIntervalMs, 1000)),
      windowMs: Math.max(30000, finite(options.windowMs, 60000)),
      minDwellMs: Math.max(20000, finite(options.minDwellMs, 45000)),
      minSamples: Math.max(15, Math.floor(finite(options.minSamples, 30))),
      availabilityThreshold: Math.max(0.05, Math.min(0.5, finite(options.availabilityThreshold, 0.22))),
      idleThreshold: Math.max(0.4, Math.min(0.95, finite(options.idleThreshold, 0.72))),
      foreignPresenceThreshold: Math.max(0.1, Math.min(0.9, finite(options.foreignPresenceThreshold, 0.35))),
      observationRadius: Math.max(120, Math.min(700, finite(options.observationRadius, 300))),
      exclusionMs: Math.max(60000, finite(options.exclusionMs, 300000)),
      switchCooldownMs: Math.max(15000, finite(options.switchCooldownMs, 30000))
    };
    this.samples = [];
    this.sampleAreaKey = null;
    this.sampleAreaSince = null;
    this.lastSampleAt = -Infinity;
    this.lastSwitchAt = -Infinity;
    this.exclusions = new Map();
    this.lastRanked = [];
    this.lastEvaluation = null;
    this.lastDecision = null;
    this.originalRank = null;
    this.stats = {
      samples: 0,
      evaluations: 0,
      pressureDetections: 0,
      overcrowdedDetections: 0,
      spawnStarvedDetections: 0,
      areaSwitches: 0,
      noAlternativeHolds: 0,
      excludedCandidates: 0,
      suppressedNotLeader: 0,
      suppressedNotReady: 0
    };
    this.installed = false;
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'farm-area-pressure', event, severity, reason, data }); } catch (_) {}
  }

  _prune() {
    const now = this.now();
    for (const [key, expiresAt] of this.exclusions) if (expiresAt <= now) this.exclusions.delete(key);
    const cutoff = now - this.config.windowMs;
    while (this.samples.length && this.samples[0].at < cutoff) this.samples.shift();
  }

  install() {
    if (this.installed || this.planner.__areaPressureRankInstalled) return false;
    this.originalRank = this.planner.rank.bind(this.planner);
    this.planner.rank = (...args) => {
      this._prune();
      const ranked = this.originalRank(...args) || [];
      this.lastRanked = ranked.map((row) => ({ ...row, areaKey: areaKey(row) }));
      const allowed = ranked.filter((row) => !this.exclusions.has(areaKey(row)));
      this.stats.excludedCandidates += Math.max(0, ranked.length - allowed.length);
      // Never strand the team because every safe candidate is temporarily
      // pressure-marked. If no safe alternative exists, keep the normal safety
      // ranking and wait for fresh evidence instead of inventing a new area.
      return allowed.length ? allowed : ranked;
    };
    this.planner.__areaPressureRankInstalled = true;
    this.installed = true;
    this._event('FARM_AREA_PRESSURE_INSTALLED', 'info', null, { ...this.config });
    return true;
  }

  _team(snapshot) {
    const cohesion = this.runtime.teamCombatCohesionHotfix;
    if (!cohesion) return null;
    if (cohesion.lastTeam && cohesion.lastTeam.selfName === snapshot.character.name) return cohesion.lastTeam;
    if (typeof cohesion._team === 'function') {
      try { return cohesion._team(snapshot); } catch (_) { return null; }
    }
    return null;
  }

  _isLeaderReady(snapshot) {
    const team = this._team(snapshot);
    if (!team || team.selfName !== team.leaderName) {
      this.stats.suppressedNotLeader += 1;
      return { ok: false, reason: 'NOT_TEAM_LEADER', team };
    }
    if (!team.complete || !team.alive || !team.sameMap || !team.positionsKnown || !team.cohesive || !team.healthReady || !team.manaReady) {
      this.stats.suppressedNotReady += 1;
      return { ok: false, reason: 'TEAM_NOT_PRESSURE_SAMPLE_READY', team };
    }
    const supply = this.runtime.farmerResourceTopoffHotfix && typeof this.runtime.farmerResourceTopoffHotfix.supply === 'function'
      ? this.runtime.farmerResourceTopoffHotfix.supply(snapshot)
      : { ready: true };
    if (!supply.ready) {
      this.stats.suppressedNotReady += 1;
      return { ok: false, reason: 'LOCAL_SUPPLY_NOT_READY', team };
    }
    return { ok: true, team };
  }

  _trustedNames() {
    const bootstrap = this.runtime.partyBootstrap;
    if (bootstrap && typeof bootstrap.trustedRosterNames === 'function') {
      try { return new Set((bootstrap.trustedRosterNames() || []).map(String)); } catch (_) {}
    }
    return new Set();
  }

  _nearPlan(entity, plan) {
    if (!entity || !plan) return false;
    if (entity.map && plan.map && entity.map !== plan.map) return false;
    return distance(entity, plan) <= this.config.observationRadius;
  }

  _sample(snapshot, plan) {
    const trusted = this._trustedNames();
    const matching = (snapshot.entities || []).filter((entity) => entity && entity.mtype === plan.monster && !entity.dead && Number(entity.hp == null ? 1 : entity.hp) > 0 && this._nearPlan(entity, plan));
    const foreignPlayers = (snapshot.entities || []).filter((entity) => {
      if (!entity || entity.mtype || !entity.name || trusted.has(String(entity.name))) return false;
      const playerLike = entity.player || entity.type === 'character' || entity.ctype;
      return !!playerLike && this._nearPlan(entity, plan);
    });
    const farmer = this.runtime.farmer;
    const targetActive = !!(farmer && farmer.targetId);
    return {
      at: this.now(),
      areaKey: areaKey(plan),
      matchingMonsters: matching.length,
      foreignPlayers: foreignPlayers.length,
      targetActive,
      farmerState: farmer && farmer.state || null
    };
  }

  _resetForArea(key) {
    this.samples = [];
    this.sampleAreaKey = key;
    this.sampleAreaSince = this.now();
  }

  _alternativeFor(currentKey) {
    return this.lastRanked.find((row) => row.areaKey !== currentKey && !this.exclusions.has(row.areaKey)) || null;
  }

  _evaluate(plan) {
    this._prune();
    const key = areaKey(plan);
    const rows = this.samples.filter((row) => row.areaKey === key);
    if (rows.length < this.config.minSamples) return null;
    const dwellMs = this.sampleAreaSince == null ? 0 : this.now() - this.sampleAreaSince;
    if (dwellMs < this.config.minDwellMs) return null;
    const availabilityRatio = rows.filter((row) => row.matchingMonsters > 0 || row.targetActive).length / rows.length;
    const idleRatio = rows.filter((row) => !row.targetActive && row.matchingMonsters === 0).length / rows.length;
    const foreignPresenceRatio = rows.filter((row) => row.foreignPlayers > 0).length / rows.length;
    const averageForeignPlayers = rows.reduce((sum, row) => sum + row.foreignPlayers, 0) / rows.length;
    const pressured = availabilityRatio <= this.config.availabilityThreshold && idleRatio >= this.config.idleThreshold;
    const classification = pressured
      ? (foreignPresenceRatio >= this.config.foreignPresenceThreshold ? 'AREA_OVERPOPULATED' : 'AREA_SPAWN_STARVED')
      : 'AREA_HEALTHY';
    const evaluation = {
      at: this.now(), key, monster: plan.monster, map: plan.map, spawnIndex: plan.spawnIndex,
      samples: rows.length, dwellMs, availabilityRatio, idleRatio, foreignPresenceRatio,
      averageForeignPlayers, pressured, classification
    };
    this.stats.evaluations += 1;
    this.lastEvaluation = evaluation;
    return evaluation;
  }

  tick(snapshot) {
    if (!this.installed || !snapshot || !snapshot.character || String(snapshot.character.ctype || '').toLowerCase() === 'merchant') return null;
    this._prune();
    const ready = this._isLeaderReady(snapshot);
    if (!ready.ok) {
      this.lastDecision = { at: this.now(), action: 'HOLD', reason: ready.reason };
      return this.lastDecision;
    }
    const plan = this.localFarming.currentPlan;
    if (!plan || plan.state !== 'HOLDING') {
      this.lastDecision = { at: this.now(), action: 'WAIT', reason: 'NOT_SETTLED_AT_FARM_AREA' };
      return this.lastDecision;
    }
    const currentKey = areaKey(plan);
    if (this.sampleAreaKey !== currentKey) this._resetForArea(currentKey);
    if (this.now() - this.lastSampleAt >= this.config.sampleIntervalMs) {
      this.samples.push(this._sample(snapshot, plan));
      this.lastSampleAt = this.now();
      this.stats.samples += 1;
    }
    if (this.now() - this.lastSwitchAt < this.config.switchCooldownMs) {
      this.lastDecision = { at: this.now(), action: 'WAIT', reason: 'AREA_SWITCH_COOLDOWN', areaKey: currentKey };
      return this.lastDecision;
    }
    const evaluation = this._evaluate(plan);
    if (!evaluation || !evaluation.pressured) {
      this.lastDecision = { at: this.now(), action: 'HOLD', reason: evaluation ? 'AREA_HEALTHY' : 'COLLECTING_AREA_PRESSURE_EVIDENCE', evaluation };
      return this.lastDecision;
    }
    this.stats.pressureDetections += 1;
    if (evaluation.classification === 'AREA_OVERPOPULATED') this.stats.overcrowdedDetections += 1;
    else this.stats.spawnStarvedDetections += 1;

    const alternative = this._alternativeFor(currentKey);
    if (!alternative) {
      this.stats.noAlternativeHolds += 1;
      this.lastDecision = { at: this.now(), action: 'HOLD', reason: 'AREA_PRESSURED_BUT_NO_SAFE_ALTERNATIVE', evaluation };
      this._event('FARM_AREA_PRESSURE_NO_ALTERNATIVE', 'warn', this.lastDecision.reason, { evaluation });
      return this.lastDecision;
    }

    this.exclusions.set(currentKey, this.now() + this.config.exclusionMs);
    const aborted = typeof this.localFarming._abort === 'function'
      ? this.localFarming._abort('AREA_PRESSURE_REPLAN', this.now(), {
          classification: evaluation.classification,
          previousArea: currentKey,
          nextCandidate: alternative.areaKey,
          availabilityRatio: evaluation.availabilityRatio,
          foreignPresenceRatio: evaluation.foreignPresenceRatio
        })
      : false;
    this.lastSwitchAt = this.now();
    this.stats.areaSwitches += 1;
    this._resetForArea(null);
    this.lastDecision = {
      at: this.now(), action: 'REPLAN', reason: evaluation.classification,
      previousArea: currentKey,
      excludedUntil: this.exclusions.get(currentKey),
      nextCandidate: alternative.areaKey,
      nextMonster: alternative.monster,
      aborted: !!aborted,
      evaluation
    };
    this._event('FARM_AREA_PRESSURE_REPLAN', 'warn', evaluation.classification, this.lastDecision);
    return this.lastDecision;
  }

  status() {
    this._prune();
    return {
      schemaVersion: 1,
      mode: FARM_AREA_PRESSURE_MODE,
      installed: this.installed,
      config: { ...this.config },
      sampleAreaKey: this.sampleAreaKey,
      sampleAreaSince: this.sampleAreaSince,
      sampleCount: this.samples.length,
      exclusions: [...this.exclusions.entries()].map(([key, expiresAt]) => ({ key, expiresAt })),
      lastRanked: this.lastRanked.slice(0, 12).map(clone),
      lastEvaluation: clone(this.lastEvaluation),
      lastDecision: clone(this.lastDecision),
      stats: { ...this.stats }
    };
  }
}

function installFarmAreaPressureHotfix(runtime, options = {}) {
  return new FarmAreaPressureHotfix(runtime, options);
}

module.exports = {
  FarmAreaPressureHotfix,
  installFarmAreaPressureHotfix,
  FARM_AREA_PRESSURE_MODE,
  areaKey
};
