'use strict';

const ADVANCED_PARTY_MOVEMENT_MODE = 'class-aware-group-formation-v1';

function finite(value, fallback = null) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function lower(value) { return String(value == null ? '' : value).trim().toLowerCase(); }
function distance(a, b) {
  const ax = finite(a && a.x); const ay = finite(a && a.y); const bx = finite(b && b.x); const by = finite(b && b.y);
  return ax == null || ay == null || bx == null || by == null ? Infinity : Math.hypot(ax - bx, ay - by);
}
function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }

class AdvancedPartyMovement {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.teamCombatCohesionHotfix || !runtime.farmerTerrainNavigationHotfix) throw new Error('team cohesion and terrain navigation required');
    this.runtime = runtime;
    this.team = runtime.teamCombatCohesionHotfix;
    this.terrain = runtime.farmerTerrainNavigationHotfix;
    this.now = runtime.now || (() => Date.now());
    this.log = runtime.log || null;
    this.config = {
      maxStep: clamp(finite(options.maxStep, 120), 50, 120),
      slotTolerance: clamp(finite(options.slotTolerance, 22), 10, 45),
      stuckMs: Math.max(2500, finite(options.stuckMs, 5000)),
      stuckDistance: clamp(finite(options.stuckDistance, 95), 70, 135),
      orbitStepDeg: clamp(finite(options.orbitStepDeg, 18), 8, 35),
      rangerOrbitOffsetDeg: clamp(finite(options.rangerOrbitOffsetDeg, 22), 10, 35)
    };
    this.sharedOrbitDirection = 1;
    this.memberMotion = new Map();
    this.stuckMembers = [];
    this.lastFormation = null;
    this.lastKite = null;
    this.stats = { formationWaypoints: 0, terrainAlternatives: 0, orbitWaypoints: 0, orbitReversals: 0, stuckDetections: 0, regroupHolds: 0, pathSteps: 0 };
    this.installed = false;
    this.install();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'advanced-party-movement', event, severity, reason, data }); } catch (_) {}
  }

  _canMoveTo(x, y) {
    const root = this.runtime.root || globalThis; const parent = root && root.parent || root;
    const fn = root && root.can_move_to || parent && parent.can_move_to;
    if (typeof fn !== 'function') return true;
    try { return fn.call(root, x, y) !== false; } catch (_) { return false; }
  }

  _targetForTeam(team) {
    const snapshot = this.runtime.lastSnapshot;
    const id = this.runtime.tacticalPartyCombat && this.runtime.tacticalPartyCombat.encounter && this.runtime.tacticalPartyCombat.encounter.targetId || team && team.leaderTargetId;
    if (!id) return null;
    return (snapshot && snapshot.entities || []).find((row) => row && String(row.id) === String(id)) || null;
  }

  _facing(team) {
    const target = this._targetForTeam(team);
    if (target && team && team.leader && finite(target.x) != null && finite(target.y) != null) return Math.atan2(Number(target.y) - Number(team.leader.y), Number(target.x) - Number(team.leader.x));
    const plan = this.runtime.localFarming && this.runtime.localFarming.currentPlan;
    if (plan && team && team.leader && finite(plan.x) != null && finite(plan.y) != null) return Math.atan2(Number(plan.y) - Number(team.leader.y), Number(plan.x) - Number(team.leader.x));
    return 0;
  }

  _slot(team, member) {
    const ctype = lower(member && member.ctype);
    const followers = (team.members || []).filter((row) => row.name !== team.leaderName);
    const sameClass = followers.filter((row) => lower(row.ctype) === ctype).sort((a, b) => a.name.localeCompare(b.name));
    const classIndex = Math.max(0, sameClass.findIndex((row) => row.name === member.name));
    const side = classIndex % 2 === 0 ? -1 : 1;
    let forward = -25; let lateral = side * 28;
    if (ctype === 'warrior' || ctype === 'paladin') { forward = 32; lateral = side * 20; }
    else if (ctype === 'rogue') { forward = 10; lateral = side * 32; }
    else if (ctype === 'priest') { forward = -55; lateral = side * 16; }
    else if (ctype === 'ranger' || ctype === 'mage') { forward = -38; lateral = side * 32; }
    return { forward, lateral, ctype };
  }

  _desiredFormationPoint(team, member) {
    const facing = this._facing(team); const slot = this._slot(team, member);
    const fx = Math.cos(facing); const fy = Math.sin(facing); const lx = -fy; const ly = fx;
    return { x: Number(team.leader.x) + fx * slot.forward + lx * slot.lateral, y: Number(team.leader.y) + fy * slot.forward + ly * slot.lateral, facing, ...slot };
  }

  _boundedReachableStep(character, desired) {
    const d = distance(character, desired);
    if (!Number.isFinite(d) || d <= this.config.slotTolerance) return null;
    const step = Math.min(this.config.maxStep, Math.max(8, d));
    const base = Math.atan2(desired.y - Number(character.y), desired.x - Number(character.x));
    for (const offsetDeg of [0, 15, -15, 30, -30, 45, -45, 65, -65, 90, -90]) {
      const angle = base + offsetDeg * Math.PI / 180;
      const x = Number(character.x) + Math.cos(angle) * step;
      const y = Number(character.y) + Math.sin(angle) * step;
      if (!this._canMoveTo(x, y)) continue;
      if (offsetDeg) this.stats.terrainAlternatives += 1;
      return { x, y, step, offsetDeg, distance: d };
    }
    return null;
  }

  _observeMotion(team) {
    const now = this.now(); const stuck = [];
    const cohesionRadius = Math.max(
      this.config.stuckDistance,
      finite(this.team && this.team.cohesionRadius, this.config.stuckDistance)
    );
    for (const member of team && team.members || []) {
      const prior = this.memberMotion.get(member.name);
      const moved = prior && distance(prior, member) > 3;
      const row = { x: member.x, y: member.y, at: now, lastMovedAt: moved ? now : (prior && prior.lastMovedAt || now) };
      this.memberMotion.set(member.name, row);
      // A stationary follower inside the accepted team-cohesion radius is not
      // stuck. Marking it as such used to turn a geometrically valid formation
      // into a permanent regroup state that the leader recovery could not fix.
      if (member.name !== team.leaderName
        && distance(member, team.leader) > cohesionRadius
        && now - row.lastMovedAt >= this.config.stuckMs) stuck.push(member.name);
    }
    const newDetection = stuck.length && !this.stuckMembers.length;
    this.stuckMembers = stuck;
    if (newDetection) {
      this.stats.stuckDetections += 1;
      this._event('PARTY_FORMATION_STUCK_DETECTED', 'warn', 'GROUP_REGROUP_REQUIRED', { stuckMembers: stuck.slice() });
    }
    return stuck;
  }

  _orbitPoint(character, target, team) {
    const range = Math.max(1, finite(character.range, 100));
    const radius = clamp(range * 0.78, 55, 115);
    const leaderAngle = Math.atan2(Number(team.leader.y) - Number(target.y), Number(team.leader.x) - Number(target.x));
    const followers = (team.members || []).filter((row) => row.name !== team.leaderName).sort((a, b) => a.name.localeCompare(b.name));
    const index = followers.findIndex((row) => row.name === team.selfName);
    const offset = team.selfName === team.leaderName ? 0 : (index % 2 === 0 ? -this.config.rangerOrbitOffsetDeg : this.config.rangerOrbitOffsetDeg);
    const angle = leaderAngle + (offset + this.sharedOrbitDirection * this.config.orbitStepDeg) * Math.PI / 180;
    return { x: Number(target.x) + Math.cos(angle) * radius, y: Number(target.y) + Math.sin(angle) * radius, radius, angle, offsetDeg: offset };
  }

  _boundedPoint(character, point) {
    const d = distance(character, point); if (!Number.isFinite(d)) return null;
    if (d <= this.config.maxStep) return { ...point, step: d };
    const angle = Math.atan2(point.y - Number(character.y), point.x - Number(character.x));
    return { ...point, x: Number(character.x) + Math.cos(angle) * this.config.maxStep, y: Number(character.y) + Math.sin(angle) * this.config.maxStep, step: this.config.maxStep };
  }

  _reachableOrbit(character, target, team) {
    const desired = this._orbitPoint(character, target, team);
    const bounded = this._boundedPoint(character, desired);
    if (bounded && this._canMoveTo(bounded.x, bounded.y)) return bounded;
    for (const extra of [15, -15, 30, -30, 45, -45]) {
      const angle = desired.angle + extra * Math.PI / 180;
      const alternate = this._boundedPoint(character, { ...desired, x: Number(target.x) + Math.cos(angle) * desired.radius, y: Number(target.y) + Math.sin(angle) * desired.radius, angle });
      if (alternate && this._canMoveTo(alternate.x, alternate.y)) { this.stats.terrainAlternatives += 1; return alternate; }
    }
    this.sharedOrbitDirection *= -1; this.stats.orbitReversals += 1;
    const reversed = this._boundedPoint(character, this._orbitPoint(character, target, team));
    return reversed && this._canMoveTo(reversed.x, reversed.y) ? reversed : null;
  }

  install() {
    if (this.installed || this.team.__advancedPartyMovementInstalled) return false;
    const baseTeam = this.team._team.bind(this.team);
    this.team._team = (snapshot) => {
      const result = baseTeam(snapshot);
      const stuck = this._observeMotion(result);
      if (stuck.length && result && result.cohesive === false) {
        result.regroupRequired = true;
        result.stuckMembers = stuck.slice();
        this.stats.regroupHolds += result.selfName === result.leaderName ? 1 : 0;
      }
      return result;
    };

    const baseFollow = this.team._followWaypoint.bind(this.team);
    this.team._followWaypoint = (character, leader) => {
      const state = this.team.lastTeam;
      if (!state || !state.self || state.selfName === state.leaderName || state.leaderName !== leader.name) return baseFollow(character, leader);
      const desired = this._desiredFormationPoint(state, state.self);
      const waypoint = this._boundedReachableStep(character, desired);
      if (!waypoint) return distance(character, desired) <= this.config.slotTolerance ? null : baseFollow(character, leader);
      this.stats.formationWaypoints += 1; this.stats.pathSteps += 1;
      this.lastFormation = { at: this.now(), member: state.selfName, leader: state.leaderName, desired, waypoint };
      return waypoint;
    };

    const kiting = this.runtime.farmer && this.runtime.farmer.kiting;
    if (kiting && typeof kiting.evaluate === 'function') {
      const baseKite = kiting.evaluate.bind(kiting);
      kiting.evaluate = (character, target) => {
        const decision = baseKite(character, target);
        if (!decision || !decision.shouldMove) return decision;
        const snapshot = this.runtime.lastSnapshot;
        const team = snapshot && snapshot.character ? this.team._team(snapshot) : null;
        if (!team || !team.complete || !team.self || !target) return decision;
        for (const member of team.members) this.terrain.orbitDirectionByCharacter.set(member.name, this.sharedOrbitDirection);
        const waypoint = this._reachableOrbit(character, target, team);
        if (!waypoint) return { ...decision, shouldMove: false, reason: 'GROUP_ORBIT_TERRAIN_BLOCKED', terrainBlocked: true };
        this.stats.orbitWaypoints += 1; this.stats.pathSteps += 1;
        this.lastKite = { at: this.now(), targetId: target.id || null, member: team.selfName, leader: team.leaderName, sharedOrbitDirection: this.sharedOrbitDirection, x: waypoint.x, y: waypoint.y, radius: waypoint.radius, step: waypoint.step };
        return { ...decision, x: waypoint.x, y: waypoint.y, step: waypoint.step, reason: 'GROUP_FORMATION_ORBIT', groupOrbit: true };
      };
    }

    this.team.__advancedPartyMovementInstalled = true;
    this.installed = true;
    this._event('ADVANCED_PARTY_MOVEMENT_INSTALLED', 'info', null, { ...this.config });
    return true;
  }

  status() {
    return { schemaVersion: 1, mode: ADVANCED_PARTY_MOVEMENT_MODE, installed: this.installed, merchantExcludedFromCombatFormation: true, boundedLocalPathfinder: true, maxStep: this.config.maxStep, sharedOrbitDirection: this.sharedOrbitDirection, stuckMembers: this.stuckMembers.slice(), lastFormation: this.lastFormation, lastKite: this.lastKite, config: { ...this.config }, stats: { ...this.stats } };
  }
}

function installAdvancedPartyMovement(runtime, options = {}) { return new AdvancedPartyMovement(runtime, options); }
module.exports = { AdvancedPartyMovement, installAdvancedPartyMovement, ADVANCED_PARTY_MOVEMENT_MODE };
