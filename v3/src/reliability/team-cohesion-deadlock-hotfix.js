'use strict';

const { installAlpha2015CombatLogisticsHotfix } = require('./alpha20-15-combat-logistics-hotfix');
const { patchAlpha2015LogisticsFairness } = require('./alpha20-15-logistics-fairness-hotfix');
const { installIntegratedPartyControl } = require('./integrated-party-control');

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

    this.maxPairwiseSafeLeaderRadius = Math.max(35, (this.cohesionRadius - this.margin) / 2);
    this.appliedFollowRadius = Math.min(this.previousFollowRadius, this.requestedFollowRadius, this.maxPairwiseSafeLeaderRadius);
    this.team.followRadius = this.appliedFollowRadius;
    this.previousFollowStep = finite(this.team.followStep, 70);
    this.appliedFollowStep = Math.max(25, Math.min(this.previousFollowStep, this.appliedFollowRadius * 1.1));
    this.team.followStep = this.appliedFollowStep;

    // Keep the proven Alpha20.15 fixes first. The integrated suite then patches
    // communication/logistics/farm prototypes before those instances are created
    // later in the runtime constructor, while tactical combat/movement/skills can
    // immediately wrap the already-created Farmer and team controllers.
    this.alpha20_15 = installAlpha2015CombatLogisticsHotfix(runtime);
    this.alpha20_15_fairness = patchAlpha2015LogisticsFairness();
    this.alpha20_16_19 = installIntegratedPartyControl(runtime);

    this.installedAt = this.now();
    this._event('TEAM_COHESION_DEADLOCK_HOTFIX_INSTALLED', 'warn', 'PAIRWISE_RADIUS_GEOMETRY_FIXED', this.status());
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'team-cohesion-deadlock-hotfix', event, severity, reason, data }); } catch (_) {}
  }

  status() {
    return {
      schemaVersion: 3,
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
      alpha20_15FairItemGoldScheduling: !!this.alpha20_15_fairness,
      alpha20_16_19: this.alpha20_16_19 && typeof this.alpha20_16_19.status === 'function' ? this.alpha20_16_19.status() : null
    };
  }
}

function installTeamCohesionDeadlockHotfix(runtime, options = {}) {
  return new TeamCohesionDeadlockHotfix(runtime, options);
}

module.exports = { TeamCohesionDeadlockHotfix, installTeamCohesionDeadlockHotfix, TEAM_COHESION_DEADLOCK_MODE };
