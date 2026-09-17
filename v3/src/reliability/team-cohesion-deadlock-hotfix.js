'use strict';

const { installAlpha2015CombatLogisticsHotfix } = require('./alpha20-15-combat-logistics-hotfix');
const { patchAlpha2015LogisticsFairness } = require('./alpha20-15-logistics-fairness-hotfix');
const { installIntegratedPartyControl } = require('./integrated-party-control');
const { installAlpha27CombatMerchantConvergence } = require('./alpha27-combat-merchant-convergence');

const TEAM_COHESION_DEADLOCK_MODE = 'pairwise-safe-team-formation-v3-terrain-recovery';

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

function terrainRecoveryOwner(team, stopRadius = 60) {
  if (!team || !team.leaderName || !team.leader || !Array.isArray(team.members)) return null;
  return team.members
    .filter((row) => row && row.name !== team.leaderName && distance(row, team.leader) > stopRadius)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))[0] || null;
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

    this.terrainRecoveryNoProgressMs = Math.max(2500, finite(options.terrainRecoveryNoProgressMs, 5000));
    this.terrainRecoveryMinProgress = Math.max(4, finite(options.terrainRecoveryMinProgress, 12));
    this.terrainRecoveryCooldownMs = Math.max(2500, finite(options.terrainRecoveryCooldownMs, 8000));
    this.terrainRecoveryTimeoutMs = Math.max(10000, finite(options.terrainRecoveryTimeoutMs, 45000));
    this.terrainRecoveryStopRadius = Math.max(35, Math.min(this.cohesionRadius - 10, finite(options.terrainRecoveryStopRadius, this.appliedFollowRadius)));
    this.formationProgress = new Map();
    this.activeTerrainRecovery = null;
    this.nextTerrainRecoveryId = 1;

    this.stats = {
      leaderRecoveryAttempts: 0,
      leaderRecoveryMoves: 0,
      leaderRecoveryShadowMoves: 0,
      leaderRecoveryTerrainHolds: 0,
      leaderRecoverySafetyHolds: 0,
      terrainRecoveryTriggers: 0,
      terrainRecoveryMoves: 0,
      terrainRecoveryShadowMoves: 0,
      terrainRecoveryPeerHolds: 0,
      terrainRecoverySafetyHolds: 0,
      terrainRecoveryFailures: 0,
      terrainRecoveryCompletions: 0,
      terrainRecoveryTimeouts: 0,
      terrainRecoveryUnexpectedMapChanges: 0
    };

    this.alpha20_15 = installAlpha2015CombatLogisticsHotfix(runtime);
    this.alpha20_15_fairness = patchAlpha2015LogisticsFairness();
    const hasIntegratedRuntimeSurfaces = !!(runtime.farmer && runtime.localFarming);
    this.alpha20_16_19 = hasIntegratedRuntimeSurfaces ? installIntegratedPartyControl(runtime) : null;
    this.alpha20_16_19SkippedReason = hasIntegratedRuntimeSurfaces ? null : 'INTEGRATED_RUNTIME_SURFACES_UNAVAILABLE';
    if (hasIntegratedRuntimeSurfaces) {
      this._installLeaderRecovery();
      this._installFollowerTerrainRecovery();
    }

    this.installedAt = this.now();
    this._event('TEAM_COHESION_DEADLOCK_HOTFIX_INSTALLED', 'warn', 'PAIRWISE_RADIUS_AND_TERRAIN_RECOVERY', this.status());
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

  _progressState(name, currentDistance) {
    const key = String(name || '');
    let row = this.formationProgress.get(key);
    if (!row) {
      row = {
        bestDistance: currentDistance,
        lastMeaningfulProgressAt: this.now(),
        lastRecoveryAt: -Infinity,
        lastObservedDistance: currentDistance
      };
      this.formationProgress.set(key, row);
      return row;
    }
    if (Number.isFinite(currentDistance) && (!Number.isFinite(row.bestDistance) || currentDistance <= row.bestDistance - this.terrainRecoveryMinProgress)) {
      row.bestDistance = currentDistance;
      row.lastMeaningfulProgressAt = this.now();
    }
    row.lastObservedDistance = currentDistance;
    return row;
  }

  _resetProgress(name, currentDistance) {
    const row = this._progressState(name, currentDistance);
    row.bestDistance = currentDistance;
    row.lastMeaningfulProgressAt = this.now();
    row.lastObservedDistance = currentDistance;
    return row;
  }

  _stopTerrainRecovery(reason, data = {}) {
    const active = this.activeTerrainRecovery;
    if (!active) return false;
    const adapter = this.runtime.adapter;
    if (adapter && typeof adapter.command === 'function') {
      try { adapter.command('stop', ['smart']); } catch (_) {}
    }
    this.activeTerrainRecovery = null;
    this._event('TEAM_TERRAIN_RECOVERY_STOPPED', 'warn', reason, { ...active, ...data });
    return true;
  }

  _startTerrainRecovery(context, team, reason) {
    const snapshot = context && context.snapshot || this.runtime.lastSnapshot;
    if (!snapshot || !snapshot.character || !team || !team.self || !team.leader) return false;
    if (this._combatOrSafetyBusy(snapshot) || !this._movementAvailable()) {
      this.stats.terrainRecoverySafetyHolds += 1;
      return false;
    }
    if (!team.sameMap || !team.positionsKnown || snapshot.character.map == null) return false;
    if (finite(team.leader.x) == null || finite(team.leader.y) == null) return false;

    const adapter = this.runtime.adapter;
    if (!adapter || typeof adapter.command !== 'function') return false;
    const destination = {
      map: snapshot.character.map,
      x: Number(team.leader.x),
      y: Number(team.leader.y)
    };
    const id = `terrain-recovery-${this.nextTerrainRecoveryId++}`;
    const startedAt = this.now();
    const command = adapter.command('smart_move', [destination]);
    this.stats.terrainRecoveryTriggers += 1;

    if (!command || (!command.executed && !command.shadow && !command.coalesced)) {
      this.stats.terrainRecoveryFailures += 1;
      this._event('TEAM_TERRAIN_RECOVERY_FAILED', 'warn', command && command.reason || 'SMART_MOVE_NOT_EXECUTED', {
        id,
        ownerName: team.selfName,
        leaderName: team.leaderName,
        destination,
        triggerReason: reason || null
      });
      return false;
    }

    if (command.shadow) this.stats.terrainRecoveryShadowMoves += 1;
    else this.stats.terrainRecoveryMoves += 1;
    this.activeTerrainRecovery = {
      id,
      ownerName: team.selfName,
      leaderName: team.leaderName,
      map: snapshot.character.map,
      destination,
      startedAt,
      startDistance: distance(team.self, team.leader),
      triggerReason: reason || null,
      settled: false,
      settledReason: null
    };

    const value = command.value;
    if (value && typeof value.then === 'function') {
      Promise.resolve(value).then((response) => {
        if (!this.activeTerrainRecovery || this.activeTerrainRecovery.id !== id) return;
        this.activeTerrainRecovery.settled = true;
        this.activeTerrainRecovery.settledReason = response && response.failed === true
          ? String(response.reason || 'SMART_MOVE_FAILED')
          : 'SMART_MOVE_RESOLVED';
      }).catch((error) => {
        if (!this.activeTerrainRecovery || this.activeTerrainRecovery.id !== id) return;
        this.stats.terrainRecoveryFailures += 1;
        this.activeTerrainRecovery.settled = true;
        this.activeTerrainRecovery.settledReason = String(error && error.message || error || 'SMART_MOVE_REJECTED');
      });
    }

    this._event('TEAM_TERRAIN_RECOVERY_STARTED', 'warn', 'FORMATION_LOCAL_PROGRESS_STALLED', {
      ...this.activeTerrainRecovery,
      sameMapOnly: true,
      serverChangeAllowed: false
    });
    return true;
  }

  _installFollowerTerrainRecovery() {
    if (!this.team || typeof this.team._followLeader !== 'function' || this.team.__terrainRecoveryInstalled) return false;
    const baseFollow = this.team._followLeader.bind(this.team);
    this.team._followLeader = (context, team, reason) => {
      if (!team || !team.self || !team.leader || team.selfName === team.leaderName) return baseFollow(context, team, reason);
      const snapshot = context && context.snapshot || this.runtime.lastSnapshot;
      const d = distance(team.self, team.leader);
      const progress = this._progressState(team.selfName, d);

      if (d <= this.terrainRecoveryStopRadius || team.cohesive) {
        if (this.activeTerrainRecovery && this.activeTerrainRecovery.ownerName === team.selfName) {
          this.stats.terrainRecoveryCompletions += 1;
          this._stopTerrainRecovery('FORMATION_COHESION_RECOVERED', { finalDistance: d });
        }
        this._resetProgress(team.selfName, d);
        return baseFollow(context, team, reason);
      }

      const active = this.activeTerrainRecovery;
      if (active && active.ownerName === team.selfName) {
        if (snapshot && snapshot.character && String(snapshot.character.map || '') !== String(active.map || '')) {
          this.stats.terrainRecoveryUnexpectedMapChanges += 1;
          this._stopTerrainRecovery('UNEXPECTED_MAP_CHANGE', { observedMap: snapshot.character.map || null });
          progress.lastRecoveryAt = this.now();
          return true;
        }
        if (this._combatOrSafetyBusy(snapshot)) {
          this.stats.terrainRecoverySafetyHolds += 1;
          this._stopTerrainRecovery('COMBAT_OR_SAFETY_PREEMPTION', { finalDistance: d });
          progress.lastRecoveryAt = this.now();
          return true;
        }
        if (active.settled && active.settledReason && active.settledReason !== 'SMART_MOVE_RESOLVED') {
          this._stopTerrainRecovery('SMART_MOVE_FAILED', { failure: active.settledReason, finalDistance: d });
          progress.lastRecoveryAt = this.now();
          this._resetProgress(team.selfName, d);
          return true;
        }
        if (this.now() - active.startedAt >= this.terrainRecoveryTimeoutMs) {
          this.stats.terrainRecoveryTimeouts += 1;
          this._stopTerrainRecovery('TERRAIN_RECOVERY_TIMEOUT', { finalDistance: d });
          progress.lastRecoveryAt = this.now();
          this._resetProgress(team.selfName, d);
          return true;
        }
        return true;
      }

      const stalledFor = this.now() - progress.lastMeaningfulProgressAt;
      if (stalledFor >= this.terrainRecoveryNoProgressMs) {
        const owner = terrainRecoveryOwner(team, this.terrainRecoveryStopRadius);
        if (owner && String(owner.name) !== String(team.selfName)) {
          this.stats.terrainRecoveryPeerHolds += 1;
          this.team.lastDecision = {
            at: this.now(),
            action: 'FORMATION_HOLD',
            reason: 'WAITING_FOR_TERRAIN_RECOVERY_OWNER',
            leaderName: team.leaderName,
            recoveryOwnerName: owner.name,
            distance: d
          };
          return true;
        }
        if (owner && this.now() - progress.lastRecoveryAt >= this.terrainRecoveryCooldownMs) {
          progress.lastRecoveryAt = this.now();
          if (this._startTerrainRecovery(context, team, reason)) return true;
        }
      }

      return baseFollow(context, team, reason);
    };
    this.team.__terrainRecoveryInstalled = true;
    return true;
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
      this.lastLeaderRecoveryAt = this.now();

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
      schemaVersion: 5,
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
      terrainRecovery: {
        enabled: !!(this.team && this.team.__terrainRecoveryInstalled),
        sameMapOnly: true,
        serverChangeAllowed: false,
        deterministicSingleFollowerOwner: true,
        noProgressMs: this.terrainRecoveryNoProgressMs,
        minMeaningfulProgress: this.terrainRecoveryMinProgress,
        cooldownMs: this.terrainRecoveryCooldownMs,
        timeoutMs: this.terrainRecoveryTimeoutMs,
        stopRadius: this.terrainRecoveryStopRadius,
        active: this.activeTerrainRecovery ? { ...this.activeTerrainRecovery } : null,
        stats: {
          triggers: this.stats.terrainRecoveryTriggers,
          moves: this.stats.terrainRecoveryMoves,
          shadowMoves: this.stats.terrainRecoveryShadowMoves,
          peerHolds: this.stats.terrainRecoveryPeerHolds,
          safetyHolds: this.stats.terrainRecoverySafetyHolds,
          failures: this.stats.terrainRecoveryFailures,
          completions: this.stats.terrainRecoveryCompletions,
          timeouts: this.stats.terrainRecoveryTimeouts,
          unexpectedMapChanges: this.stats.terrainRecoveryUnexpectedMapChanges
        }
      },
      alpha20_15: this.alpha20_15 && typeof this.alpha20_15.status === 'function' ? this.alpha20_15.status() : null,
      alpha20_15FairItemGoldScheduling: !!this.alpha20_15_fairness,
      alpha20_16_19: this.alpha20_16_19 && typeof this.alpha20_16_19.status === 'function' ? this.alpha20_16_19.status() : null,
      alpha20_16_19SkippedReason: this.alpha20_16_19SkippedReason
    };
  }
}

function installTeamCohesionDeadlockHotfix(runtime, options = {}) {
  const hotfix = new TeamCohesionDeadlockHotfix(runtime, options);
  if (runtime) runtime.teamCohesionDeadlockHotfix = hotfix;
  try {
    installAlpha27CombatMerchantConvergence(runtime, { ...(options.alpha27 || {}), deadlock: hotfix });
  } catch (error) {
    if (runtime && runtime.log && typeof runtime.log.emit === 'function') {
      runtime.log.emit({
        component: 'alpha27-combat-merchant-convergence',
        event: 'ALPHA27_INSTALL_FAILED_SAFE',
        severity: 'error',
        reason: 'INSTALLATION_FAILED',
        data: { message: String(error && error.message || error).slice(0, 240) }
      });
    }
  }
  return hotfix;
}

module.exports = {
  TeamCohesionDeadlockHotfix,
  installTeamCohesionDeadlockHotfix,
  TEAM_COHESION_DEADLOCK_MODE,
  maxPairDistance,
  bestLeaderRecoveryWaypoint,
  terrainRecoveryOwner
};
