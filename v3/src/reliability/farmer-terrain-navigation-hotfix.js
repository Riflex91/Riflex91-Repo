'use strict';

const FARMER_TERRAIN_NAVIGATION_MODE = 'terrain-aware-bounded-farmer-navigation-v1';

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
    this.blockedTargets = new Map();
    this.lastDecision = null;
    this.stats = {
      travelCalls: 0,
      directWaypoints: 0,
      alternateWaypoints: 0,
      noReachableWaypoint: 0,
      movementCircuitReselects: 0,
      temporarilyFilteredTargets: 0
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
    this.installed = true;
    this._event('FARMER_TERRAIN_NAVIGATION_HOTFIX_INSTALLED', 'info');
  }

  status() {
    this._pruneBlocked();
    return {
      schemaVersion: 1,
      mode: FARMER_TERRAIN_NAVIGATION_MODE,
      installed: this.installed,
      canMoveToAvailable: !!this._canMoveFn(),
      blockedTargetMs: this.blockedTargetMs,
      minProgress: this.minProgress,
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
