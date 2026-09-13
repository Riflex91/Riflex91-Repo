'use strict';

const { installAlpha2015CombatLogisticsHotfix } = require('./alpha20-15-combat-logistics-hotfix');
const { patchAlpha2015LogisticsFairness } = require('./alpha20-15-logistics-fairness-hotfix');

const TEAM_COHESION_DEADLOCK_MODE = 'pairwise-safe-team-formation-v1';

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

    // The previous 85 follow radius could place two followers on opposite sides
    // of the leader at almost 170 distance while the pairwise cohesion gate was
    // 150. That creates a stable deadlock: both followers think they are close
    // enough to the leader while the leader still sees a non-cohesive party.
    // Keep the stricter pairwise gate and make every steady follower position
    // geometrically capable of satisfying it instead.
    this.maxPairwiseSafeLeaderRadius = Math.max(35, (this.cohesionRadius - this.margin) / 2);
    this.appliedFollowRadius = Math.min(this.previousFollowRadius, this.requestedFollowRadius, this.maxPairwiseSafeLeaderRadius);
    this.team.followRadius = this.appliedFollowRadius;

    // A formation step larger than the full desired diameter can overshoot a
    // compact regroup in crowded terrain. Keep the existing bounded path search
    // but cap one regroup step to a conservative multiple of the new radius.
    this.previousFollowStep = finite(this.team.followStep, 70);
    this.appliedFollowStep = Math.max(25, Math.min(this.previousFollowStep, this.appliedFollowRadius * 1.1));
    this.team.followStep = this.appliedFollowStep;

    // Alpha20.15 is intentionally installed from this already-proven hook so it
    // runs after team target selection exists but before party logistics is
    // constructed. That lets us harden synthetic team rankings and patch the
    // bounded logistics prototype without widening generic economy authority.
    this.alpha20_15 = installAlpha2015CombatLogisticsHotfix(runtime);
    this.alpha20_15_fairness = patchAlpha2015LogisticsFairness();

    this.installedAt = this.now();
    this._event('TEAM_COHESION_DEADLOCK_HOTFIX_INSTALLED', 'warn', 'PAIRWISE_RADIUS_GEOMETRY_FIXED', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'team-cohesion-deadlock-hotfix', event, severity, reason, data }); } catch (_) {}
  }

  status() {
    return {
      schemaVersion: 2,
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
      alpha20_15: this.alpha20_15 && typeof this.alpha20_15.status === 'function' ? this.alpha20_15.status() : null,
      alpha20_15FairItemGoldScheduling: !!this.alpha20_15_fairness
    };
  }
}

function installTeamCohesionDeadlockHotfix(runtime, options = {}) {
  return new TeamCohesionDeadlockHotfix(runtime, options);
}

module.exports = {
  TeamCohesionDeadlockHotfix,
  installTeamCohesionDeadlockHotfix,
  TEAM_COHESION_DEADLOCK_MODE
};
