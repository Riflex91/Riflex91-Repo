'use strict';

const FARMER_TERRAIN_NAVIGATION_MODE = 'terrain-aware-bounded-farmer-navigation-v2';

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if (ax == null || ay == null || bx == null || by == null) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function sign(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return fallback;
  return n < 0 ? -1 : 1;
}

class FarmerTerrainNavigationHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.farmer) throw new Error('runtime farmer required');
    this.runtime = runtime;
    this.farmer = runtime.farmer;
    this.root = runtime.root || globalThis;
    this.parent = this.root && this.root.parent || this.root;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.minStep = Math.max(20, Number(options.minStep) || 50);
    this.maxStep = Math.max(this.minStep, Number(options.maxStep) || 120);
    this.stepSeconds = Math.max(0.5, Math.min(4, Number(options.stepSeconds) || 2));
    this.blockedTargetMs = Math.max(2000, Number(options.blockedTargetMs) || 12000);
    this.minProgress = Math.max(2, Number(options.minProgress) || 8);
    this.kiteTooCloseFactor = Math.max(0.5, Math.min(0.78, Number(options.kiteTooCloseFactor) || 0.62));
    this.kiteDesiredFactor = Math.max(this.kiteTooCloseFactor + 0.08, Math.min(0.92, Number(options.kiteDesiredFactor) || 0.86));
    this.kiteMaxStepFactor = Math.max(0.35, Math.min(0.7, Number(options.kiteMaxStepFactor) || 0.5));
    this.kiteMinProgress = Math.max(1, Number(options.kiteMinProgress) || 2);
    this.skillMpReserveRatio = Math.max(0, Math.min(0.25, Number(options.skillMpReserveRatio) || 0));
    this.skillMinIntervalMs = Math.max(250, Number(options.skillMinIntervalMs) || 250);
    this.blockedTargets = new Map();
    this.orbitDirectionByCharacter = new Map();
    this.lastDecision = null;
    this.lastKiteDecision = null;
    this.lastRetreatDecision = null;
    this.skillPolicy = null;
    this.stats = {
      travelCalls: 0,
      directWaypoints: 0,
      alternateWaypoints: 0,
      noReachableWaypoint: 0,
      movementCircuitReselects: 0,
      temporarilyFilteredTargets: 0,
      kiteEvaluations: 0,
      kiteOrbitalWaypoints: 0,
      kiteRadialWaypoints: 0,
      kiteNoReachableWaypoint: 0,
      kiteDirectionSwitches: 0,
      retreatEvaluations: 0,
      retreatAlternateWaypoints: 0,
      retreatNoReachableWaypoint: 0,
      skillPolicyHardened: 0
    };
    this.installed = false;
    this._install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'farmer-terrain-navigation', event, severity, reason, data }); } catch (_) {}
  }

  _canMoveFn() {
    const fn = this.root && this.root.can_move_to || this.parent && this.parent.can_move_to;
    return typeof fn === 'function' ? fn : null;
  }

  _canMoveTo(x, y) {
    const fn = this._canMoveFn();
    if (!fn) return null;
    try { return fn.call(this.root, x, y) !== false; } catch (_) { return false; }
  }

  _boundedStep(character, travel) {
    const speed = Math.max(1, Number(character && character.speed) || 40);
    const desired = Math.max(this.minStep, Math.min(this.maxStep, speed * this.stepSeconds));
    return Math.min(Math.max(0, travel), desired);
  }

  _pruneBlocked() {
    const now = this.now();
    for (const [id, until] of this.blockedTargets.entries()) if (until <= now) this.blockedTargets.delete(id);
  }

  _markTargetBlocked(target, reason) {
    if (!target || target.id == null) return;
    const id = String(target.id);
    const until = this.now() + this.blockedTargetMs;
    this.blockedTargets.set(id, until);
    this.lastDecision = { at: this.now(), reason, targetId: id, targetType: target.mtype || null, blockedUntil: until };
    this._event('FARMER_TARGET_PATH_TEMPORARILY_BLOCKED', 'warn', reason, { ...this.lastDecision });
  }

  _waypoint(character, target, step) {
    const cx = Number(character.x);
    const cy = Number(character.y);
    const tx = Number(target.x);
    const ty = Number(target.y);
    const dx = tx - cx;
    const dy = ty - cy;
    const len = Math.max(1, Math.hypot(dx, dy));
    const baseAngle = Math.atan2(dy, dx);
    const direct = { x: cx + Math.cos(baseAngle) * step, y: cy + Math.sin(baseAngle) * step, offsetDeg: 0, step };
    const directAllowed = this._canMoveTo(direct.x, direct.y);
    if (directAllowed !== false) {
      this.stats.directWaypoints += 1;
      return direct;
    }

    const offsets = [15, -15, 30, -30, 45, -45, 60, -60, 90, -90];
    const scales = [1, 0.75, 0.5];
    const currentDistance = Math.hypot(tx - cx, ty - cy);
    let best = null;
    for (const scale of scales) {
      const scaledStep = Math.max(Math.min(step * scale, this.maxStep), Math.min(this.minStep, step));
      for (const offsetDeg of offsets) {
        const angle = baseAngle + offsetDeg * Math.PI / 180;
        const x = cx + Math.cos(angle) * scaledStep;
        const y = cy + Math.sin(angle) * scaledStep;
        if (this._canMoveTo(x, y) !== true) continue;
        const afterDistance = Math.hypot(tx - x, ty - y);
        const progress = currentDistance - afterDistance;
        if (progress < this.minProgress) continue;
        const candidate = { x, y, offsetDeg, step: scaledStep, progress };
        if (!best || candidate.progress > best.progress || (candidate.progress === best.progress && Math.abs(candidate.offsetDeg) < Math.abs(best.offsetDeg))) best = candidate;
      }
    }
    if (best) this.stats.alternateWaypoints += 1;
    return best;
  }

  _initialOrbitDirection(name) {
    const text = String(name || 'local');
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) hash = ((hash * 31) + text.charCodeAt(i)) | 0;
    return (Math.abs(hash) % 2) ? 1 : -1;
  }

  _orbitDirection(character) {
    const name = String(character && character.name || 'local');
    if (!this.orbitDirectionByCharacter.has(name)) this.orbitDirectionByCharacter.set(name, this._initialOrbitDirection(name));
    return this.orbitDirectionByCharacter.get(name);
  }

  _setOrbitDirection(character, direction) {
    const name = String(character && character.name || 'local');
    const previous = this._orbitDirection(character);
    const next = sign(direction, previous);
    if (next !== previous) this.stats.kiteDirectionSwitches += 1;
    this.orbitDirectionByCharacter.set(name, next);
    return next;
  }

  _kiteWaypoint(character, target, decision) {
    if (!this._canMoveFn()) return { x: decision.x, y: decision.y, offsetDeg: 0, step: decision.step, terrainAware: false };
    const cx = finite(character && character.x);
    const cy = finite(character && character.y);
    const tx = finite(target && target.x);
    const ty = finite(target && target.y);
    if (cx == null || cy == null || tx == null || ty == null) return null;

    const currentDistance = Math.hypot(cx - tx, cy - ty);
    const range = Math.max(1, Number(decision.range) || Number(character.range) || 1);
    const desiredDistance = Math.min(range * 0.92, Math.max(currentDistance + this.kiteMinProgress, Number(decision.desiredDistance) || range * this.kiteDesiredFactor));
    const outwardAngle = Math.atan2(cy - ty, cx - tx);
    const preferredDirection = this._orbitDirection(character);
    const offsets = [
      preferredDirection * 50,
      preferredDirection * 35,
      preferredDirection * 70,
      preferredDirection * 90,
      0,
      -preferredDirection * 50,
      -preferredDirection * 35,
      -preferredDirection * 70,
      -preferredDirection * 90
    ];
    const scales = [1, 0.75, 0.5];
    let best = null;

    for (const scale of scales) {
      const step = Math.max(1, Number(decision.step) * scale);
      for (const offsetDeg of offsets) {
        const angle = outwardAngle + offsetDeg * Math.PI / 180;
        const x = cx + Math.cos(angle) * step;
        const y = cy + Math.sin(angle) * step;
        if (this._canMoveTo(x, y) !== true) continue;
        const afterDistance = Math.hypot(x - tx, y - ty);
        const progress = afterDistance - currentDistance;
        if (progress < this.kiteMinProgress && currentDistance + this.kiteMinProgress < desiredDistance) continue;
        if (afterDistance > range * 0.96) continue;
        const candidateDirection = offsetDeg === 0 ? preferredDirection : sign(offsetDeg, preferredDirection);
        const switched = offsetDeg !== 0 && candidateDirection !== preferredDirection;
        const radialPenalty = offsetDeg === 0 ? 14 : 0;
        const switchPenalty = switched ? 8 : 0;
        const orbitShapePenalty = offsetDeg === 0 ? 0 : Math.abs(Math.abs(offsetDeg) - 50) * 0.04;
        const scalePenalty = (1 - scale) * 4;
        const score = Math.abs(desiredDistance - afterDistance) + radialPenalty + switchPenalty + orbitShapePenalty + scalePenalty;
        const candidate = { x, y, offsetDeg, step, afterDistance, progress, score, direction: candidateDirection, terrainAware: true };
        if (!best || candidate.score < best.score - 0.001 || (Math.abs(candidate.score - best.score) < 0.001 && Math.abs(candidate.offsetDeg) < Math.abs(best.offsetDeg))) best = candidate;
      }
    }

    if (best && best.offsetDeg !== 0) this._setOrbitDirection(character, best.direction);
    return best;
  }

  _threatDistance(point, threats) {
    let nearest = Infinity;
    for (const threat of threats || []) {
      if (!threat || threat.x == null || threat.y == null) continue;
      nearest = Math.min(nearest, Math.hypot(Number(point.x) - Number(threat.x), Number(point.y) - Number(threat.y)));
    }
    return nearest;
  }

  _retreatWaypoint(character, threats, decision) {
    if (!this._canMoveFn()) return { x: decision.x, y: decision.y, offsetDeg: 0, step: decision.step, terrainAware: false };
    if (this._canMoveTo(decision.x, decision.y) === true) return { x: decision.x, y: decision.y, offsetDeg: 0, step: decision.step, terrainAware: true };
    const cx = finite(character && character.x);
    const cy = finite(character && character.y);
    if (cx == null || cy == null) return null;
    const dx = Number(decision.x) - cx;
    const dy = Number(decision.y) - cy;
    const rawStep = Math.max(1, Math.hypot(dx, dy));
    const baseAngle = Math.atan2(dy, dx);
    const currentThreatDistance = this._threatDistance({ x: cx, y: cy }, threats);
    const offsets = [30, -30, 45, -45, 60, -60, 75, -75, 90, -90];
    const scales = [1, 0.75, 0.5];
    let best = null;
    for (const scale of scales) {
      const step = rawStep * scale;
      for (const offsetDeg of offsets) {
        const angle = baseAngle + offsetDeg * Math.PI / 180;
        const x = cx + Math.cos(angle) * step;
        const y = cy + Math.sin(angle) * step;
        if (this._canMoveTo(x, y) !== true) continue;
        const threatDistance = this._threatDistance({ x, y }, threats);
        if (Number.isFinite(currentThreatDistance) && Number.isFinite(threatDistance) && threatDistance <= currentThreatDistance + 1) continue;
        const score = (Number.isFinite(threatDistance) ? threatDistance : 0) - Math.abs(offsetDeg) * 0.02 - (1 - scale) * 2;
        const candidate = { x, y, offsetDeg, step, threatDistance, score, terrainAware: true };
        if (!best || candidate.score > best.score) best = candidate;
      }
    }
    return best;
  }

  _installKiting() {
    const kiting = this.farmer && this.farmer.kiting;
    if (!kiting || typeof kiting.evaluate !== 'function' || kiting.__terrainOrbitInstalled) return false;
    kiting.tooCloseFactor = Math.max(Number(kiting.tooCloseFactor) || 0, this.kiteTooCloseFactor);
    kiting.desiredFactor = Math.max(Number(kiting.desiredFactor) || 0, this.kiteDesiredFactor);
    kiting.maxStepFactor = Math.max(Number(kiting.maxStepFactor) || 0, this.kiteMaxStepFactor);
    const baseEvaluate = kiting.evaluate.bind(kiting);
    kiting.evaluate = (character, target) => {
      const decision = baseEvaluate(character, target);
      if (!decision || !decision.shouldMove) return decision;
      this.stats.kiteEvaluations += 1;
      const waypoint = this._kiteWaypoint(character, target, decision);
      if (!waypoint) {
        this.stats.kiteNoReachableWaypoint += 1;
        this.lastKiteDecision = {
          at: this.now(), reason: 'KITE_TERRAIN_BLOCKED', targetId: target && target.id || null,
          targetType: target && target.mtype || null, distance: decision.distance, desiredDistance: decision.desiredDistance
        };
        this._event('FARMER_KITE_TERRAIN_BLOCKED', 'warn', 'NO_REACHABLE_KITE_WAYPOINT', { ...this.lastKiteDecision });
        return { ...decision, shouldMove: false, reason: 'KITE_TERRAIN_BLOCKED', terrainBlocked: true };
      }
      if (waypoint.offsetDeg === 0) this.stats.kiteRadialWaypoints += 1;
      else this.stats.kiteOrbitalWaypoints += 1;
      this.lastKiteDecision = {
        at: this.now(), reason: waypoint.offsetDeg === 0 ? 'KITE_RADIAL_WAYPOINT' : 'KITE_ORBITAL_WAYPOINT',
        targetId: target && target.id || null, targetType: target && target.mtype || null,
        distance: decision.distance, desiredDistance: decision.desiredDistance,
        afterDistance: waypoint.afterDistance == null ? null : Number(waypoint.afterDistance.toFixed(2)),
        offsetDeg: waypoint.offsetDeg, step: waypoint.step, x: waypoint.x, y: waypoint.y,
        orbitDirection: this._orbitDirection(character), terrainAware: waypoint.terrainAware
      };
      return { ...decision, x: waypoint.x, y: waypoint.y, step: waypoint.step, orbitOffsetDeg: waypoint.offsetDeg, orbitDirection: this._orbitDirection(character), terrainAware: waypoint.terrainAware };
    };
    kiting.__terrainOrbitInstalled = true;
    return true;
  }

  _installSafeRetreat() {
    const safeRetreat = this.farmer && this.farmer.safeRetreat;
    if (!safeRetreat || typeof safeRetreat.evaluate !== 'function' || safeRetreat.__terrainRetreatInstalled) return false;
    const baseEvaluate = safeRetreat.evaluate.bind(safeRetreat);
    safeRetreat.evaluate = (character, threats) => {
      const decision = baseEvaluate(character, threats);
      if (!decision || !decision.shouldMove) return decision;
      this.stats.retreatEvaluations += 1;
      const waypoint = this._retreatWaypoint(character, threats, decision);
      if (!waypoint) {
        this.stats.retreatNoReachableWaypoint += 1;
        this.lastRetreatDecision = { at: this.now(), reason: 'RETREAT_TERRAIN_BLOCKED', threatCount: decision.threatCount || 0 };
        this._event('FARMER_SAFE_RETREAT_TERRAIN_BLOCKED', 'warn', 'NO_REACHABLE_RETREAT_WAYPOINT', { ...this.lastRetreatDecision });
        return { ...decision, shouldMove: false, reason: 'RETREAT_TERRAIN_BLOCKED', terrainBlocked: true };
      }
      if (waypoint.offsetDeg !== 0) this.stats.retreatAlternateWaypoints += 1;
      this.lastRetreatDecision = {
        at: this.now(), reason: waypoint.offsetDeg === 0 ? 'RETREAT_DIRECT_WAYPOINT' : 'RETREAT_ALTERNATE_WAYPOINT',
        threatCount: decision.threatCount || 0, offsetDeg: waypoint.offsetDeg,
        step: waypoint.step, x: waypoint.x, y: waypoint.y, terrainAware: waypoint.terrainAware
      };
      return { ...decision, x: waypoint.x, y: waypoint.y, step: waypoint.step, terrainOffsetDeg: waypoint.offsetDeg, terrainAware: waypoint.terrainAware };
    };
    safeRetreat.__terrainRetreatInstalled = true;
    return true;
  }

  _installSkillPolicy() {
    const skillUsage = this.farmer && this.farmer.skillUsage;
    if (!skillUsage || skillUsage.__aggressiveSafeRotationInstalled) return false;
    const previousReserve = Number(skillUsage.mpReserveRatio) || 0;
    const previousInterval = Number(skillUsage.minIntervalMs) || 750;
    skillUsage.mpReserveRatio = this.skillMpReserveRatio;
    skillUsage.minIntervalMs = Math.min(previousInterval, this.skillMinIntervalMs);
    skillUsage.__aggressiveSafeRotationInstalled = true;
    this.skillPolicy = {
      previousReserveRatio: previousReserve,
      reserveRatio: skillUsage.mpReserveRatio,
      previousMinIntervalMs: previousInterval,
      minIntervalMs: skillUsage.minIntervalMs,
      selection: 'all-ready-safe-direct-damage-candidates-via-existing-cooldown-fallback'
    };
    this.stats.skillPolicyHardened += 1;
    this._event('FARMER_SAFE_OFFENSIVE_SKILL_ROTATION_ENABLED', 'info', 'LIVE_COOLDOWN_ROTATION', { ...this.skillPolicy });
    return true;
  }

  _installTargetFilter() {
    const farmer = this.farmer;
    if (typeof farmer._safeLiveMonsters !== 'function' || farmer.__terrainTargetFilterInstalled) return;
    const base = farmer._safeLiveMonsters.bind(farmer);
    farmer._safeLiveMonsters = (snapshot, party) => {
      this._pruneBlocked();
      const rows = base(snapshot, party);
      if (!Array.isArray(rows) || !this.blockedTargets.size) return rows;
      const filtered = rows.filter((entity) => !entity || entity.id == null || !this.blockedTargets.has(String(entity.id)));
      this.stats.temporarilyFilteredTargets += Math.max(0, rows.length - filtered.length);
      return filtered;
    };
    farmer.__terrainTargetFilterInstalled = true;
  }

  _installTravel() {
    const farmer = this.farmer;
    if (farmer.__terrainNavigationHotfixInstalled) return;
    farmer.__terrainNavigationHotfixInstalled = true;
    farmer._travel = (context, target) => {
      this.stats.travelCalls += 1;
      const snapshot = context && context.snapshot;
      const c = snapshot && snapshot.character;
      if (!snapshot || !c) {
        farmer._block('TARGET_POSITION_UNKNOWN');
        return;
      }
      if (!target || target.dead || (target.hp != null && Number(target.hp) <= 0)) {
        farmer._clearTarget('TARGET_GONE');
        farmer._transition('REASSESS', 'TARGET_GONE');
        return;
      }
      if (!farmer._targetAllowed(target, snapshot, context.party)) {
        farmer._clearTarget('TARGET_POLICY_REJECTED');
        farmer._transition('REASSESS', 'TARGET_POLICY_REJECTED');
        return;
      }

      const engageRange = farmer._engagementRange(snapshot);
      const d = distance(c, target);
      if (d <= engageRange) {
        farmer._transition('ENGAGE', 'IN_RANGE', { distance: Math.round(d), engageRange: Math.round(engageRange) });
        return;
      }
      if (!Number.isFinite(d) || target.x == null || target.y == null || c.x == null || c.y == null) {
        farmer._block('TARGET_POSITION_UNKNOWN');
        return;
      }

      const now = farmer.now();
      if (now - farmer.lastActionAt < farmer.config.moveCooldownMs) return;
      const desiredRange = Math.max(20, engageRange * 0.9);
      const rawTravel = Math.max(0, d - desiredRange);
      const step = this._boundedStep(c, rawTravel);
      const waypoint = this._waypoint(c, target, step);
      if (!waypoint) {
        this.stats.noReachableWaypoint += 1;
        this._markTargetBlocked(target, 'NO_REACHABLE_BOUNDED_WAYPOINT');
        farmer._clearTarget('TARGET_PATH_LOCALLY_BLOCKED');
        farmer._transition('REASSESS', 'TARGET_PATH_LOCALLY_BLOCKED');
        return;
      }

      const result = context.adapter.command('move', [waypoint.x, waypoint.y]);
      farmer.lastActionAt = now;
      if (!result.executed && !result.shadow && !result.coalesced) {
        if (result.reason === 'MOVEMENT_CIRCUIT_OPEN' || result.reason === 'COMMAND_FAILED') {
          this.stats.movementCircuitReselects += 1;
          this._markTargetBlocked(target, result.reason);
          farmer._clearTarget('MOVEMENT_FAILURE_RESELECT');
          farmer._transition('REASSESS', 'MOVEMENT_FAILURE_RESELECT');
          return;
        }
        farmer._block(result.reason === 'COMMAND_UNAVAILABLE' ? 'MOVE_COMMAND_UNAVAILABLE' : 'MOVE_COMMAND_FAILED');
        return;
      }

      this.lastDecision = {
        at: now,
        reason: waypoint.offsetDeg ? 'ALTERNATE_REACHABLE_WAYPOINT' : 'DIRECT_REACHABLE_WAYPOINT',
        targetId: target.id == null ? null : String(target.id),
        targetType: target.mtype || null,
        distance: d,
        engageRange,
        rawTravel,
        step: waypoint.step,
        x: waypoint.x,
        y: waypoint.y,
        offsetDeg: waypoint.offsetDeg,
        coalesced: !!result.coalesced
      };
      farmer._event('FARMER_MOVE_REQUESTED', 'info', 'TARGET_OUT_OF_RANGE', {
        x: Math.round(waypoint.x),
        y: Math.round(waypoint.y),
        distance: Math.round(d),
        engageRange: Math.round(engageRange),
        boundedStep: Math.round(waypoint.step),
        rawTravel: Math.round(rawTravel),
        terrainOffsetDeg: waypoint.offsetDeg
      });
    };
  }

  _install() {
    this._installTargetFilter();
    this._installTravel();
    this._installKiting();
    this._installSafeRetreat();
    this._installSkillPolicy();
    this.installed = true;
    this._event('FARMER_TERRAIN_NAVIGATION_HOTFIX_INSTALLED', 'info', 'COMBAT_MOVEMENT_V2', {
      kiteTooCloseFactor: this.kiteTooCloseFactor,
      kiteDesiredFactor: this.kiteDesiredFactor,
      skillMpReserveRatio: this.skillMpReserveRatio,
      skillMinIntervalMs: this.skillMinIntervalMs
    });
  }

  status() {
    this._pruneBlocked();
    return {
      schemaVersion: 2,
      mode: FARMER_TERRAIN_NAVIGATION_MODE,
      installed: this.installed,
      canMoveToAvailable: !!this._canMoveFn(),
      blockedTargetMs: this.blockedTargetMs,
      minProgress: this.minProgress,
      combatMovement: {
        orbitalKiting: true,
        terrainAwareKiting: true,
        terrainAwareEmergencyRetreat: true,
        kiteTooCloseFactor: this.kiteTooCloseFactor,
        kiteDesiredFactor: this.kiteDesiredFactor,
        kiteMaxStepFactor: this.kiteMaxStepFactor,
        orbitDirectionByCharacter: [...this.orbitDirectionByCharacter.entries()].map(([name, direction]) => ({ name, direction })),
        lastKiteDecision: this.lastKiteDecision ? { ...this.lastKiteDecision } : null,
        lastRetreatDecision: this.lastRetreatDecision ? { ...this.lastRetreatDecision } : null
      },
      skillRotation: this.skillPolicy ? { ...this.skillPolicy } : null,
      blockedTargets: [...this.blockedTargets.entries()].map(([id, until]) => ({ id, until, remainingMs: Math.max(0, until - this.now()) })),
      lastDecision: this.lastDecision ? { ...this.lastDecision } : null,
      stats: { ...this.stats }
    };
  }
}

function installFarmerTerrainNavigationHotfix(runtime, options = {}) {
  return new FarmerTerrainNavigationHotfix(runtime, options);
}

module.exports = { FarmerTerrainNavigationHotfix, installFarmerTerrainNavigationHotfix, FARMER_TERRAIN_NAVIGATION_MODE };
