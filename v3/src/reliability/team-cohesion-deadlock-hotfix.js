'use strict';

const { installAlpha2015CombatLogisticsHotfix } = require('./alpha20-15-combat-logistics-hotfix');
const { patchAlpha2015LogisticsFairness } = require('./alpha20-15-logistics-fairness-hotfix');
const { installIntegratedPartyControl } = require('./integrated-party-control');

const TEAM_COHESION_DEADLOCK_MODE = 'pairwise-safe-team-formation-v2';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function distance(a, b) {
  const ax = finite(a && a.x);
  const ay = finite(a && a.y);
  const bx = finite(b && b.x);
  const by = finite(b && b.y);
  if ([ax, ay, bx, by].some((value) => value == null)) return Infinity;
  return Math.hypot(ax - bx, ay - by);
}

function maxPairDistance(members = [], overrideName = null, overridePoint = null) {
  let max = 0;
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = overrideName && members[i].name === overrideName ? { ...members[i], ...overridePoint } : members[i];
      const b = overrideName && members[j].name === overrideName ? { ...members[j], ...overridePoint } : members[j];
      const d = distance(a, b);
      if (!Number.isFinite(d)) return Infinity;
      max = Math.max(max, d);
    }
  }
  return max;
}

function bestLeaderRecoveryWaypoint(team, options = {}) {
  if (!team || !team.leaderName || !team.self || team.selfName !== team.leaderName) return null;
  const members = Array.isArray(team.members) ? team.members.filter((row) => row && finite(row.x) != null && finite(row.y) != null) : [];
  if (members.length < 2) return null;
  const leader = members.find((row) => row.name === team.leaderName) || team.self;
  const currentMax = maxPairDistance(members);
  const cohesionRadius = Math.max(60, finite(options.cohesionRadius, 150));
  if (!Number.isFinite(currentMax) || currentMax <= cohesionRadius) return null;

  const maxStep = Math.max(20, finite(options.maxStep, 60));
  const minImprovement = Math.max(2, finite(options.minImprovement, 6));
  const canMoveTo = typeof options.canMoveTo === 'function' ? options.canMoveTo : () => true;
  const followers = members.filter((row) => row.name !== team.leaderName);
  if (!followers.length) return null;

  const centroid = {
    x: followers.reduce((sum, row) => sum + Number(row.x), 0) / followers.length,
    y: followers.reduce((sum, row) => sum + Number(row.y), 0) / followers.length
  };
  const farthest = followers.slice().sort((a, b) => distance(leader, b) - distance(leader, a))[0];
  const targets = [farthest, centroid];
  const candidates = [];

  for (const target of targets) {
    const base = Math.atan2(Number(target.y) - Number(leader.y), Number(target.x) - Number(leader.x));
    const required = Math.max(8, currentMax - cohesionRadius + minImprovement);
    const step = Math.min(maxStep, required);
    for (const offsetDeg of [0, 15, -15, 30, -30, 45, -45, 65, -65, 90, -90]) {
      const angle = base + offsetDeg * Math.PI / 180;
      const point = {
        x: Number(leader.x) + Math.cos(angle) * step,
        y: Number(leader.y) + Math.sin(angle) * step
      };
      if (!canMoveTo(point.x, point.y)) continue;
      const nextMax = maxPairDistance(members, team.leaderName, point);
      const improvement = currentMax - nextMax;
      if (improvement < minImprovement) continue;
      candidates.push({ ...point, step, offsetDeg, currentMax, nextMax, improvement });
    }
  }

  return candidates.sort((a, b) =>
    b.improvement - a.improvement ||
    a.nextMax - b.nextMax ||
    Math.abs(a.offsetDeg) - Math.abs(b.offsetDeg)
  )[0] || null;
}

class TeamCohesionDeadlockHotfix {
  constructor(runtime, options = {}) {
    if (!runtime || !runtime.teamCombatCohesionHotfix) throw new Error('team combat cohesion required');
    this.runtime = runtime;
    this.team = runtime.teamCombatCohesionHotfix;
    this.log = runtime.log || null;
    this.now = runtime.now || (() => Date.now());
    this.margin = Math.max(12, Math.min(50, finite(options.margin, 30)));
    this.requestedFollowRadius = Math.max(35, Math.min(80, finite(options.followRadius, 60)));
    this.previousFollowRadius = finite(this.team.followRadius, 85);
    this.cohesionRadius = Math.max(90, finite(this.team.cohesionRadius, 150));

    this.maxPairwiseSafeLeaderRadius = Math.max(35, (this.cohesionRadius - this.margin) / 2);
    this.appliedFollowRadius = Math.min(this.previousFollowRadius, this.requestedFollowRadius, this.maxPairwiseSafeLeaderRadius);
    this.team.followRadius = this.appliedFollowRadius;
    this.previousFollowStep = finite(this.team.followStep, 70);
    this.appliedFollowStep = Math.max(25, Math.min(this.previousFollowStep, this.appliedFollowRadius * 1.1));
    this.team.followStep = this.appliedFollowStep;

    this.leaderRecoveryMaxStep = Math.max(25, Math.min(90, finite(options.leaderRecoveryMaxStep, 60)));
    this.leaderRecoveryCooldownMs = Math.max(600, finite(options.leaderRecoveryCooldownMs, 1200));
    this.leaderRecoveryMinImprovement = Math.max(3, finite(options.leaderRecoveryMinImprovement, 6));
    this.lastLeaderRecoveryAt = -Infinity;
    this.lastLeaderRecovery = null;
    this.stats = {
      leaderRecoveryAttempts: 0,
      leaderRecoveryMoves: 0,
      leaderRecoveryShadowMoves: 0,
      leaderRecoveryTerrainHolds: 0,
      leaderRecoverySafetyHolds: 0
    };

    // Keep the proven Alpha20.15 fixes first. The integrated suite then patches
    // communication/logistics/farm prototypes before those instances are created
    // later in the production runtime constructor, while tactical combat,
    // movement and skills wrap the already-created Farmer/team controllers.
    // Minimal test/runtime fixtures intentionally omit Farmer/local-farm surfaces;
    // diagnostics must not turn that absence into a startup failure.
    this.alpha20_15 = installAlpha2015CombatLogisticsHotfix(runtime);
    this.alpha20_15_fairness = patchAlpha2015LogisticsFairness();
    const hasIntegratedRuntimeSurfaces = !!(runtime.farmer && runtime.localFarming);
    this.alpha20_16_19 = hasIntegratedRuntimeSurfaces ? installIntegratedPartyControl(runtime) : null;
    this.alpha20_16_19SkippedReason = hasIntegratedRuntimeSurfaces ? null : 'INTEGRATED_RUNTIME_SURFACES_UNAVAILABLE';
    if (hasIntegratedRuntimeSurfaces) this._installLeaderRecovery();

    this.installedAt = this.now();
    this._event('TEAM_COHESION_DEADLOCK_HOTFIX_INSTALLED', 'warn', 'PAIRWISE_RADIUS_AND_BOUNDED_LEADER_RECOVERY', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'team-cohesion-deadlock-hotfix', event, severity, reason, data }); } catch (_) {}
  }

  _canMoveTo(x, y) {
    const root = this.runtime.root || globalThis;
    const parent = root && root.parent || root;
    const fn = root && root.can_move_to || parent && parent.can_move_to;
    if (typeof fn !== 'function') return true;
    try { return fn.call(root, x, y) !== false; } catch (_) { return false; }
  }

  _movementAvailable() {
    const adapter = this.runtime.adapter;
    if (!adapter || typeof adapter.command !== 'function') return false;
    if (typeof adapter.stabilityStatus !== 'function') return true;
    try {
      const movement = adapter.stabilityStatus().movement || {};
      return movement.circuitOpen !== true && !movement.pendingOutcomeId;
    } catch (_) {
      return false;
    }
  }

  _combatOrSafetyBusy(snapshot) {
    if (!snapshot || !snapshot.character || snapshot.character.rip || snapshot.character.dead) return true;
    if (this.runtime.pendingEmergencyRetreat) return true;
    const c = snapshot.character;
    if (c.target) return true;
    if ((snapshot.entities || []).some((entity) => entity && entity.mtype && !entity.dead && String(entity.target || '') === String(c.name || ''))) return true;
    const farmer = this.runtime.farmer;
    return !!(farmer && ['ENGAGE', 'TRAVEL', 'RECOVER'].includes(farmer.state));
  }

  _installLeaderRecovery() {
    const local = this.runtime.localFarming;
    if (!local || typeof local.tick !== 'function' || local.__teamLeaderDeadlockRecoveryInstalled) return false;
    const baseTick = local.tick.bind(local);
    local.tick = (context = {}) => {
      const result = baseTick(context);
      if (!result || result.reason !== 'WAITING_FOR_TEAM_COHESION') return result;
      const snapshot = context.snapshot || this.runtime.lastSnapshot;
      if (!snapshot || !snapshot.character) return result;

      let team = null;
      try { team = typeof this.team._team === 'function' ? this.team._team(snapshot) : this.team.lastTeam; } catch (_) {}
      if (!team || team.selfName !== team.leaderName || !team.complete || !team.alive || !team.sameMap || !team.positionsKnown || team.cohesive) return result;

      if (this._combatOrSafetyBusy(snapshot) || !this._movementAvailable()) {
        this.stats.leaderRecoverySafetyHolds += 1;
        return result;
      }
      if (this.now() - this.lastLeaderRecoveryAt < this.leaderRecoveryCooldownMs) return result;

      const waypoint = bestLeaderRecoveryWaypoint(team, {
        cohesionRadius: this.cohesionRadius,
        maxStep: this.leaderRecoveryMaxStep,
        minImprovement: this.leaderRecoveryMinImprovement,
        canMoveTo: (x, y) => this._canMoveTo(x, y)
      });
      this.stats.leaderRecoveryAttempts += 1;
      if (!waypoint) {
        this.stats.leaderRecoveryTerrainHolds += 1;
        return result;
      }

      const command = this.runtime.adapter.command('move', [waypoint.x, waypoint.y]);
      this.lastLeaderRecoveryAt = this.now();
      if (command && (command.executed || command.coalesced)) this.stats.leaderRecoveryMoves += 1;
      if (command && command.shadow) this.stats.leaderRecoveryShadowMoves += 1;
      this.lastLeaderRecovery = {
        at: this.now(),
        leaderName: team.leaderName,
        currentMaxPairDistance: waypoint.currentMax,
        projectedMaxPairDistance: waypoint.nextMax,
        improvement: waypoint.improvement,
        x: waypoint.x,
        y: waypoint.y,
        step: waypoint.step,
        executed: !!(command && command.executed),
        shadow: !!(command && command.shadow),
        coalesced: !!(command && command.coalesced),
        resultReason: command && command.reason || null
      };
      const decision = {
        at: this.now(),
        action: command && command.shadow ? 'SHADOW_MOVE' : command && (command.executed || command.coalesced) ? 'MOVE' : 'HOLD',
        reason: 'TEAM_COHESION_LEADER_RECOVERY',
        leaderName: team.leaderName,
        maxPairDistance: waypoint.currentMax,
        projectedMaxPairDistance: waypoint.nextMax
      };
      local.lastDecision = decision;
      this.team.lastDecision = {
        ...decision,
        action: 'FORMATION_LEADER_RECOVERY',
        x: waypoint.x,
        y: waypoint.y
      };
      this._event('TEAM_COHESION_LEADER_RECOVERY', 'info', 'BOUNDED_PROGRESS_TOWARD_COHESION', this.lastLeaderRecovery);
      return decision;
    };
    local.__teamLeaderDeadlockRecoveryInstalled = true;
    return true;
  }

  status() {
    return {
      schemaVersion: 4,
      mode: TEAM_COHESION_DEADLOCK_MODE,
      installedAt: this.installedAt || null,
      cohesionRadius: this.cohesionRadius,
      margin: this.margin,
      previousFollowRadius: this.previousFollowRadius,
      requestedFollowRadius: this.requestedFollowRadius,
      maxPairwiseSafeLeaderRadius: this.maxPairwiseSafeLeaderRadius,
      appliedFollowRadius: this.appliedFollowRadius,
      theoreticalOppositeFollowerDistance: this.appliedFollowRadius * 2,
      previousFollowStep: this.previousFollowStep,
      appliedFollowStep: this.appliedFollowStep,
      pairwiseSteadyFormationFitsGate: this.appliedFollowRadius * 2 <= this.cohesionRadius - this.margin + 0.0001,
      boundedLeaderRecovery: {
        enabled: !!(this.runtime.localFarming && this.runtime.localFarming.__teamLeaderDeadlockRecoveryInstalled),
        maxStep: this.leaderRecoveryMaxStep,
        cooldownMs: this.leaderRecoveryCooldownMs,
        minProjectedImprovement: this.leaderRecoveryMinImprovement,
        last: this.lastLeaderRecovery ? { ...this.lastLeaderRecovery } : null,
        stats: { ...this.stats }
      },
      alpha20_15: this.alpha20_15 && typeof this.alpha20_15.status === 'function' ? this.alpha20_15.status() : null,
      alpha20_15FairItemGoldScheduling: !!this.alpha20_15_fairness,
      alpha20_16_19: this.alpha20_16_19 && typeof this.alpha20_16_19.status === 'function' ? this.alpha20_16_19.status() : null,
      alpha20_16_19SkippedReason: this.alpha20_16_19SkippedReason
    };
  }
}

function installTeamCohesionDeadlockHotfix(runtime, options = {}) {
  return new TeamCohesionDeadlockHotfix(runtime, options);
}

module.exports = {
  TeamCohesionDeadlockHotfix,
  installTeamCohesionDeadlockHotfix,
  TEAM_COHESION_DEADLOCK_MODE,
  maxPairDistance,
  bestLeaderRecoveryWaypoint
};
