'use strict';

const { LocalFarmPlanner } = require('./local-farm-planner');

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratio(value, max) {
  const denominator = Number(max) || 0;
  if (denominator <= 0) return 1;
  return Math.max(0, Math.min(1, (Number(value) || 0) / denominator));
}

function distance(a, b) {
  const ax = a && finite(a.x);
  const ay = a && finite(a.y);
  const bx = b && finite(b.x);
  const by = b && finite(b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

class LocalFarmOrchestrator {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.planner = options.planner || new LocalFarmPlanner({ log: this.log });
    this.enabled = options.enabled !== false;
    this.config = {
      minHoldMs: Math.max(5000, Number(options.minHoldMs) || 20000),
      planLeaseMs: Math.max(30000, Number(options.planLeaseMs) || 120000),
      noProgressMs: Math.max(5000, Number(options.noProgressMs) || 15000),
      replanCooldownMs: Math.max(2000, Number(options.replanCooldownMs) || 10000),
      arrivalRadius: Math.max(40, Number(options.arrivalRadius) || 100),
      stepSeconds: Math.max(0.5, Math.min(4, Number(options.stepSeconds) || 2.5)),
      minStep: Math.max(20, Number(options.minStep) || 50),
      maxStep: Math.max(60, Number(options.maxStep) || 120),
      moveCooldownMs: Math.max(500, Number(options.moveCooldownMs) || 1200),
      maxPlanFailures: Math.max(1, Math.min(5, Number(options.maxPlanFailures) || 3)),
      engageHpRatio: Math.max(0.45, Math.min(0.95, Number(options.engageHpRatio) || 0.7))
    };
    this.currentPlan = null;
    this.lastPlan = null;
    this.lastMove = null;
    this.lastAbort = null;
    this.lastDecision = null;
    this.lastActionAt = -Infinity;
    this.cooldownUntil = 0;
    this.planSeq = 0;
    this.stats = {
      plansCreated: 0,
      plansCompleted: 0,
      plansAborted: 0,
      movesRequested: 0,
      shadowMoves: 0,
      noProgressAborts: 0,
      leaseAborts: 0,
      circuitWaits: 0,
      visibleMonsterYields: 0
    };
  }

  _event(event, severity, reason, data = {}) {
    if (!this.log) return;
    this.log.emit({
      component: 'local-farming',
      event,
      severity: severity || 'info',
      reason: reason || null,
      data: {
        planId: this.currentPlan && this.currentPlan.id || null,
        monster: this.currentPlan && this.currentPlan.monster || null,
        ...data
      }
    });
  }

  _visibleMonsters(snapshot) {
    const c = snapshot && snapshot.character;
    if (!c) return [];
    return (snapshot.entities || []).filter((entity) => {
      if (!entity || !entity.mtype || entity.dead || (entity.hp != null && Number(entity.hp) <= 0)) return false;
      if (entity.map && c.map && entity.map !== c.map) return false;
      return true;
    });
  }

  _selfAggro(snapshot) {
    const name = snapshot && snapshot.character && snapshot.character.name;
    if (!name) return [];
    return (snapshot.entities || []).filter((entity) => entity && entity.mtype && !entity.dead && entity.target === name);
  }

  _canReposition(runtime, snapshot, visibleMonsters) {
    if (!this.enabled) return { allowed: false, reason: 'LOCAL_FARMING_DISABLED' };
    if (!snapshot || !snapshot.character) return { allowed: false, reason: 'SNAPSHOT_UNAVAILABLE' };
    const c = snapshot.character;
    if (c.rip) return { allowed: false, reason: 'CHARACTER_DEAD' };
    if (ratio(c.hp, c.max_hp) < this.config.engageHpRatio) return { allowed: false, reason: 'HP_RECOVERY_REQUIRED' };
    if (this._selfAggro(snapshot).length) return { allowed: false, reason: 'SELF_AGGRO_PRESENT' };
    if (visibleMonsters && visibleMonsters.length) return { allowed: false, reason: 'VISIBLE_MONSTER_PRESENT' };
    const farmer = runtime && runtime.farmer;
    if (farmer && farmer.targetId) return { allowed: false, reason: 'FARMER_TARGET_ACTIVE' };
    if (farmer && ['ENGAGE', 'TRAVEL', 'RECOVER'].includes(farmer.state)) return { allowed: false, reason: `FARMER_${farmer.state}` };
    const adapter = runtime && runtime.adapter;
    if (adapter && typeof adapter.stabilityStatus === 'function') {
      const movement = adapter.stabilityStatus().movement || {};
      if (movement.circuitOpen) return { allowed: false, reason: 'MOVEMENT_CIRCUIT_OPEN', movement };
      if (movement.pendingOutcomeId) return { allowed: false, reason: 'MOVE_OUTCOME_PENDING', movement };
    }
    return { allowed: true, reason: 'LOCAL_REPOSITION_ALLOWED' };
  }

  _makePlan(candidate, now) {
    const plan = {
      id: `local-farm-${now}-${++this.planSeq}`,
      monster: candidate.monster,
      map: candidate.map,
      x: candidate.x,
      y: candidate.y,
      spawnIndex: candidate.spawnIndex,
      source: candidate.source,
      contentDisposition: candidate.contentDisposition,
      score: Number(candidate.score) || 0,
      createdAt: now,
      holdUntil: now + this.config.minHoldMs,
      leaseUntil: now + this.config.planLeaseMs,
      lastProgressAt: now,
      lastDistance: null,
      bestDistance: null,
      moveAttempts: 0,
      failures: 0,
      state: 'TRAVELLING'
    };
    this.stats.plansCreated += 1;
    this.currentPlan = plan;
    this.lastPlan = { ...plan };
    this._event('LOCAL_FARM_PLAN_CREATED', 'info', 'KNOWN_SPAWN_SELECTED', {
      map: plan.map,
      x: Math.round(plan.x),
      y: Math.round(plan.y),
      score: Number(plan.score.toFixed(5)),
      leaseUntil: plan.leaseUntil,
      holdUntil: plan.holdUntil,
      contentDisposition: plan.contentDisposition
    });
    return plan;
  }

  _abort(reason, now, data = {}) {
    if (!this.currentPlan) return false;
    const aborted = { ...this.currentPlan, abortedAt: now, abortReason: reason };
    this.lastAbort = aborted;
    this.lastPlan = aborted;
    this.currentPlan = null;
    this.cooldownUntil = now + this.config.replanCooldownMs;
    this.stats.plansAborted += 1;
    if (reason === 'NO_PROGRESS') this.stats.noProgressAborts += 1;
    if (reason === 'PLAN_LEASE_EXPIRED') this.stats.leaseAborts += 1;
    this._event('LOCAL_FARM_PLAN_ABORTED', 'warn', reason, data);
    return true;
  }

  _complete(reason, now, data = {}) {
    if (!this.currentPlan) return false;
    const completed = { ...this.currentPlan, completedAt: now, completionReason: reason, state: 'HOLDING' };
    this.lastPlan = completed;
    this.currentPlan = completed;
    this.stats.plansCompleted += 1;
    this._event('LOCAL_FARM_PLAN_REACHED', 'info', reason, data);
    return true;
  }

  _choosePlan(runtime, snapshot, gameData, world, party, now) {
    const ranked = this.planner.rank(snapshot, gameData, world, party, runtime && runtime.planner);
    if (!ranked.length) return null;
    const top = ranked[0];
    if (!this.currentPlan) return this._makePlan(top, now);
    if (this.currentPlan.map !== snapshot.character.map) {
      this._abort('MAP_CHANGED', now, { map: snapshot.character.map });
      return null;
    }
    if (now >= this.currentPlan.leaseUntil) {
      this._abort('PLAN_LEASE_EXPIRED', now);
      return null;
    }
    if (now < this.currentPlan.holdUntil) return this.currentPlan;
    const currentRank = ranked.find((row) => row.monster === this.currentPlan.monster && row.spawnIndex === this.currentPlan.spawnIndex);
    if (!currentRank || this.planner.materiallyBetter(currentRank, top)) {
      const previous = this.currentPlan;
      this.currentPlan = null;
      const next = this._makePlan(top, now);
      this._event('LOCAL_FARM_PLAN_SWITCHED', 'info', 'MATERIAL_IMPROVEMENT', {
        previousPlanId: previous.id,
        previousMonster: previous.monster,
        previousScore: Number(previous.score || 0),
        nextScore: Number(next.score || 0)
      });
      return next;
    }
    return this.currentPlan;
  }

  _updateProgress(plan, snapshot, now) {
    const d = distance(snapshot.character, plan);
    if (!Number.isFinite(d)) return { distance: Infinity, progressed: false };
    const previous = plan.lastDistance;
    const best = plan.bestDistance;
    const progressed = best == null || d <= best - 8;
    plan.lastDistance = d;
    if (best == null || d < best) plan.bestDistance = d;
    if (progressed) plan.lastProgressAt = now;
    if (previous == null) plan.lastProgressAt = now;
    return { distance: d, progressed };
  }

  _boundedDestination(character, plan) {
    const cx = finite(character.x);
    const cy = finite(character.y);
    if (cx == null || cy == null) return null;
    const dx = Number(plan.x) - cx;
    const dy = Number(plan.y) - cy;
    const len = Math.hypot(dx, dy);
    if (!Number.isFinite(len) || len <= 0) return { x: cx, y: cy, step: 0 };
    const speed = Math.max(1, Number(character.speed) || 40);
    const desired = speed * this.config.stepSeconds;
    const step = Math.min(len, Math.max(this.config.minStep, Math.min(this.config.maxStep, desired)));
    return {
      x: cx + (dx / len) * step,
      y: cy + (dy / len) * step,
      step
    };
  }

  tick(context = {}) {
    const runtime = context.runtime;
    const snapshot = context.snapshot;
    const world = context.world;
    const party = context.party;
    const gameData = context.gameData || runtime && runtime.adapter && runtime.adapter.getGameData && runtime.adapter.getGameData() || {};
    const now = this.now();
    const visibleMonsters = this._visibleMonsters(snapshot);

    if (visibleMonsters.length) {
      this.stats.visibleMonsterYields += 1;
      this.lastDecision = { at: now, action: 'YIELD', reason: 'VISIBLE_MONSTER_PRESENT', visibleCount: visibleMonsters.length };
      return this.lastDecision;
    }

    const gate = this._canReposition(runtime, snapshot, visibleMonsters);
    if (!gate.allowed) {
      if (gate.reason === 'MOVEMENT_CIRCUIT_OPEN') this.stats.circuitWaits += 1;
      this.lastDecision = { at: now, action: 'WAIT', reason: gate.reason };
      return this.lastDecision;
    }

    if (now < this.cooldownUntil) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'REPLAN_COOLDOWN', cooldownUntil: this.cooldownUntil };
      return this.lastDecision;
    }

    const plan = this._choosePlan(runtime, snapshot, gameData, world, party, now);
    if (!plan) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'NO_APPROVED_LOCAL_SPAWN' };
      return this.lastDecision;
    }

    const progress = this._updateProgress(plan, snapshot, now);
    if (progress.distance <= this.config.arrivalRadius) {
      if (plan.state !== 'HOLDING') this._complete('SPAWN_RADIUS_REACHED', now, { distance: Math.round(progress.distance) });
      this.lastDecision = { at: now, action: 'HOLD', reason: 'SPAWN_RADIUS_REACHED', distance: progress.distance, planId: plan.id };
      return this.lastDecision;
    }

    if (runtime && runtime.adapter && runtime.adapter.mode !== 'shadow' && now - plan.lastProgressAt >= this.config.noProgressMs && plan.moveAttempts > 0) {
      this._abort('NO_PROGRESS', now, { distance: Math.round(progress.distance), moveAttempts: plan.moveAttempts });
      this.lastDecision = { at: now, action: 'ABORT', reason: 'NO_PROGRESS' };
      return this.lastDecision;
    }

    if (now - this.lastActionAt < this.config.moveCooldownMs) {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'MOVE_COOLDOWN', planId: plan.id };
      return this.lastDecision;
    }

    const destination = this._boundedDestination(snapshot.character, plan);
    if (!destination) {
      plan.failures += 1;
      if (plan.failures >= this.config.maxPlanFailures) this._abort('POSITION_UNAVAILABLE', now);
      this.lastDecision = { at: now, action: 'WAIT', reason: 'POSITION_UNAVAILABLE', failures: plan.failures };
      return this.lastDecision;
    }

    const adapter = runtime && runtime.adapter;
    if (!adapter || typeof adapter.command !== 'function') {
      this.lastDecision = { at: now, action: 'WAIT', reason: 'ADAPTER_UNAVAILABLE' };
      return this.lastDecision;
    }

    const result = adapter.command('move', [destination.x, destination.y]);
    this.lastActionAt = now;
    plan.moveAttempts += 1;
    if (result.shadow) this.stats.shadowMoves += 1;
    if (result.executed) this.stats.movesRequested += 1;
    if (!result.executed && !result.shadow && !result.coalesced) plan.failures += 1;
    if (plan.failures >= this.config.maxPlanFailures) this._abort('MOVE_FAILURE_BUDGET_EXHAUSTED', now, { failures: plan.failures, reason: result.reason || null });

    this.lastMove = {
      at: now,
      planId: plan.id,
      monster: plan.monster,
      x: destination.x,
      y: destination.y,
      step: destination.step,
      result: {
        executed: !!result.executed,
        shadow: !!result.shadow,
        coalesced: !!result.coalesced,
        reason: result.reason || null,
        outcomeId: result.outcomeId || null,
        outcomeState: result.outcomeState || null
      }
    };
    this._event('LOCAL_FARM_MOVE_REQUESTED', 'info', result.shadow ? 'SHADOW_LOCAL_REPOSITION' : 'LOCAL_REPOSITION', {
      x: Math.round(destination.x),
      y: Math.round(destination.y),
      step: Math.round(destination.step),
      distance: Math.round(progress.distance),
      moveAttempts: plan.moveAttempts,
      result: this.lastMove.result
    });
    this.lastDecision = {
      at: now,
      action: result.shadow ? 'SHADOW_MOVE' : (result.executed ? 'MOVE' : 'WAIT'),
      reason: result.reason || (result.shadow ? 'SHADOW' : 'MOVE_REQUESTED'),
      planId: plan.id,
      distance: progress.distance
    };
    return this.lastDecision;
  }

  status() {
    return {
      enabled: this.enabled,
      scope: 'same-map-known-approved-spawns-only',
      navigation: 'bounded-local-move-only',
      smartMoveAllowed: false,
      mapChangeAllowed: false,
      config: { ...this.config },
      currentPlan: this.currentPlan ? { ...this.currentPlan } : null,
      lastPlan: this.lastPlan ? { ...this.lastPlan } : null,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      lastAbort: this.lastAbort ? { ...this.lastAbort } : null,
      lastDecision: this.lastDecision ? { ...this.lastDecision } : null,
      cooldownUntil: this.cooldownUntil,
      stats: { ...this.stats }
    };
  }
}

module.exports = { LocalFarmOrchestrator };
