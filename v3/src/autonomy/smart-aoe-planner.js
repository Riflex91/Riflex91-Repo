'use strict';

const { CombatMode, normalizeCombatMode } = require('./combat-modes');
const { Capability } = require('./skill-semantics');

const SMART_AOE_PLANNER_MODE = 'deterministic-smart-aoe-planner-v1';

const SmartAoeState = Object.freeze({
  RECOVER: 'RECOVER',
  BUILD_PULL: 'BUILD_PULL',
  HOLD_PULL: 'HOLD_PULL',
  AOE_BURN: 'AOE_BURN',
  FINISH: 'FINISH',
  ABORT_PULL: 'ABORT_PULL'
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function ratio(value, max, fallback = 1) {
  const denominator = finite(max, 0);
  if (denominator <= 0) return fallback;
  return clamp(finite(value, 0) / denominator, 0, 1);
}

function liveRows(rows) {
  return (rows || []).filter((row) => row && !row.dead && !row.rip && finite(row.hp, 1) > 0);
}

function skillHasAoeCapability(skill) {
  const caps = new Set(skill && skill.capabilities || []);
  return caps.has(Capability.MULTI_TARGET_DAMAGE)
    || caps.has(Capability.RANGED_MULTI_TARGET_DAMAGE)
    || caps.has(Capability.VARIABLE_MULTI_TARGET_DAMAGE)
    || caps.has(Capability.AOE_DAMAGE);
}

class SmartAoePlanner {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.adaptivePullLearner = options.adaptivePullLearner || null;
    this.config = {
      hardMaxPull: Math.max(2, Math.min(12, finite(options.hardMaxPull, 8))),
      genericAoeCapacity: Math.max(2, Math.min(6, finite(options.genericAoeCapacity, 3))),
      minBuildHpRatio: clamp(finite(options.minBuildHpRatio, 0.82), 0.50, 0.99),
      minBuildMpRatio: clamp(finite(options.minBuildMpRatio, 0.45), 0.05, 0.95),
      emergencyHpRatio: clamp(finite(options.emergencyHpRatio, 0.35), 0.10, 0.70),
      emergencyMpRatio: clamp(finite(options.emergencyMpRatio, 0.08), 0, 0.40),
      maxAggregateProjectedDamageRatio: clamp(finite(options.maxAggregateProjectedDamageRatio, 0.95), 0.40, 2.0),
      finishAverageHpRatio: clamp(finite(options.finishAverageHpRatio, 0.22), 0.05, 0.60)
    };
    this.lastPlan = null;
    this.stats = {
      evaluations: 0,
      singleTargetPlans: 0,
      recoverPlans: 0,
      buildPlans: 0,
      holdPlans: 0,
      burnPlans: 0,
      finishPlans: 0,
      abortPlans: 0,
      candidateAllows: 0,
      candidateBlocks: 0
    };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'smart-aoe-planner', event, severity, reason, data }); } catch (_) {}
  }

  _aoeSkills(partyCapabilities) {
    const rows = [];
    for (const member of partyCapabilities && partyCapabilities.members || []) {
      for (const skill of member && member.skills || []) {
        if (!skill || skill.configuredReady !== true || !skillHasAoeCapability(skill)) continue;
        const minTargets = Math.max(1, Math.floor(finite(skill.parameters && skill.parameters.minTargets, 2)));
        const capacity = skill.targetCapacity == null
          ? this.config.genericAoeCapacity
          : Math.max(1, Math.floor(finite(skill.targetCapacity, 1)));
        rows.push({
          character: member.name,
          ctype: member.ctype,
          skill: skill.id,
          minTargets,
          capacity,
          capabilities: (skill.capabilities || []).slice()
        });
      }
    }
    return rows.sort((a, b) => b.capacity - a.capacity || a.minTargets - b.minTargets || a.skill.localeCompare(b.skill));
  }

  _resourceState(team) {
    const members = team && team.members || [];
    const hpRatios = members.map((row) => ratio(row.hp, row.max_hp, 1));
    const mpRatios = members.map((row) => ratio(row.mp, row.max_mp, 1));
    return {
      minHpRatio: hpRatios.length ? Math.min(...hpRatios) : 0,
      avgHpRatio: hpRatios.length ? hpRatios.reduce((a, b) => a + b, 0) / hpRatios.length : 0,
      minMpRatio: mpRatios.length ? Math.min(...mpRatios) : 0,
      avgMpRatio: mpRatios.length ? mpRatios.reduce((a, b) => a + b, 0) / mpRatios.length : 0
    };
  }

  _hardCapacity(mode, partyCapabilities, skills) {
    if (mode === CombatMode.SINGLE_TARGET) return 1;
    if (!partyCapabilities || partyCapabilities.catalogReady !== true) return 1;
    if (!partyCapabilities.combat || partyCapabilities.combat.aoeConfigured !== true) return 1;
    if (!skills.length) return 1;

    let capacity = Math.max(...skills.map((row) => row.capacity));
    const support = partyCapabilities.combat.configuredSupport || partyCapabilities.combat.support || {};
    const sustain = support.groupSustain === true || support.partyHeal === true;
    const control = support.aoeControl === true || support.aoeAggroControl === true;

    if (!sustain && !control) capacity = Math.min(capacity, 2);
    else if (!sustain || !control) capacity = Math.min(capacity, 3);

    return Math.max(1, Math.min(this.config.hardMaxPull, capacity));
  }

  _desiredSize(mode, capacity, skills) {
    if (mode === CombatMode.SINGLE_TARGET || capacity <= 1) return 1;
    const thresholds = skills.map((row) => row.minTargets).filter((value) => value > 1 && value <= capacity);
    if (!thresholds.length) return Math.min(capacity, 2);
    if (mode === CombatMode.AOE_PREFERRED) return Math.min(capacity, Math.max(...thresholds));
    return Math.min(capacity, Math.min(...thresholds));
  }

  planningProfile(mode, partyCapabilities) {
    const resolvedMode = normalizeCombatMode(mode, CombatMode.SMART_AUTO);
    const skills = this._aoeSkills(partyCapabilities);
    const hardCapacity = this._hardCapacity(resolvedMode, partyCapabilities, skills);
    const desiredPullSize = this._desiredSize(resolvedMode, hardCapacity, skills);
    return {
      combatMode: resolvedMode,
      configured: hardCapacity > 1 && !!(partyCapabilities && partyCapabilities.combat && partyCapabilities.combat.aoeConfigured),
      hardCapacity,
      desiredPullSize,
      skills: skills.map((row) => ({ ...row }))
    };
  }

  evaluate(input = {}) {
    this.stats.evaluations += 1;
    const mode = normalizeCombatMode(input.mode, CombatMode.SMART_AUTO);
    const team = input.team || null;
    const partyCapabilities = input.partyCapabilities || null;
    const engagedTargets = liveRows(input.engagedTargets);
    const evaluations = input.evaluations || [];
    const skills = this._aoeSkills(partyCapabilities);
    const resources = this._resourceState(team);
    const capacity = this._hardCapacity(mode, partyCapabilities, skills);
    const deterministicDesiredPullSize = this._desiredSize(mode, capacity, skills);
    let desiredPullSize = deterministicDesiredPullSize;
    let adaptivePull = null;
    if (this.adaptivePullLearner && typeof this.adaptivePullLearner.recommend === 'function' && mode !== CombatMode.SINGLE_TARGET) {
      try {
        adaptivePull = this.adaptivePullLearner.recommend({
          ...(input.learningContext || {}),
          combatMode: mode,
          hardCapacity: capacity,
          deterministicDesiredSize: deterministicDesiredPullSize
        });
        if (adaptivePull && Number.isFinite(Number(adaptivePull.recommendedSize))) {
          desiredPullSize = Math.max(1, Math.min(capacity, Math.floor(Number(adaptivePull.recommendedSize))));
        }
      } catch (error) {
        adaptivePull = { applied: false, reason: 'ADAPTIVE_PULL_ERROR', error: String(error && error.message || error) };
        desiredPullSize = deterministicDesiredPullSize;
      }
    }
    const engagedCount = engagedTargets.length;
    const averageEnemyHpRatio = engagedCount
      ? engagedTargets.reduce((sum, row) => sum + ratio(row.hp, row.max_hp || row.hp, 1), 0) / engagedCount
      : 1;
    const aggregateProjectedDamageRatio = evaluations.reduce((sum, row) => sum + Math.max(0, finite(row && row.projectedDamageRatio, 0)), 0);

    const hardSafetyReady = !!(team && team.complete && team.alive && team.sameMap && team.positionsKnown && team.cohesive);
    const emergency = resources.minHpRatio <= this.config.emergencyHpRatio
      || resources.minMpRatio <= this.config.emergencyMpRatio
      || aggregateProjectedDamageRatio > this.config.maxAggregateProjectedDamageRatio;
    const buildResourcesReady = resources.minHpRatio >= this.config.minBuildHpRatio
      && resources.minMpRatio >= this.config.minBuildMpRatio
      && team && team.healthReady !== false && team.manaReady !== false;

    let state = SmartAoeState.RECOVER;
    let reason = 'NO_ACTIVE_ENCOUNTER';
    let mayAddTarget = false;

    if (!hardSafetyReady) {
      state = engagedCount > 0 ? SmartAoeState.ABORT_PULL : SmartAoeState.RECOVER;
      reason = 'PARTY_SAFETY_NOT_READY';
    } else if (emergency && engagedCount > 0) {
      state = SmartAoeState.ABORT_PULL;
      reason = 'EMERGENCY_RESOURCE_OR_DAMAGE_RISK';
    } else if (mode === CombatMode.SINGLE_TARGET || capacity <= 1) {
      state = engagedCount > 0 ? SmartAoeState.FINISH : SmartAoeState.RECOVER;
      reason = mode === CombatMode.SINGLE_TARGET ? 'SINGLE_TARGET_MODE' : 'AOE_CAPABILITY_UNAVAILABLE';
      this.stats.singleTargetPlans += 1;
    } else if (engagedCount === 0) {
      if (buildResourcesReady) {
        state = SmartAoeState.BUILD_PULL;
        reason = 'READY_FOR_FIRST_TARGET';
        mayAddTarget = true;
      } else {
        state = SmartAoeState.RECOVER;
        reason = 'RESOURCES_BELOW_BUILD_THRESHOLD';
      }
    } else if (engagedCount > capacity) {
      state = SmartAoeState.ABORT_PULL;
      reason = 'ENGAGED_COUNT_EXCEEDS_HARD_CAPACITY';
    } else if (engagedCount === 1 && averageEnemyHpRatio <= this.config.finishAverageHpRatio) {
      state = SmartAoeState.FINISH;
      reason = 'PRIMARY_TARGET_NEAR_FINISH';
    } else if (engagedCount < desiredPullSize && buildResourcesReady) {
      state = SmartAoeState.BUILD_PULL;
      reason = 'BELOW_DESIRED_PULL_SIZE';
      mayAddTarget = true;
    } else if (engagedCount >= 2 && partyCapabilities && partyCapabilities.combat && partyCapabilities.combat.aoeConfigured) {
      state = SmartAoeState.AOE_BURN;
      reason = engagedCount >= desiredPullSize ? 'DESIRED_PULL_ESTABLISHED' : 'MULTI_TARGET_ALREADY_ENGAGED';
    } else {
      state = SmartAoeState.HOLD_PULL;
      reason = buildResourcesReady ? 'HOLD_CURRENT_ENGAGEMENT' : 'NO_MORE_TARGETS_UNTIL_RECOVERED';
    }

    if (state === SmartAoeState.RECOVER) this.stats.recoverPlans += 1;
    else if (state === SmartAoeState.BUILD_PULL) this.stats.buildPlans += 1;
    else if (state === SmartAoeState.HOLD_PULL) this.stats.holdPlans += 1;
    else if (state === SmartAoeState.AOE_BURN) this.stats.burnPlans += 1;
    else if (state === SmartAoeState.FINISH) this.stats.finishPlans += 1;
    else if (state === SmartAoeState.ABORT_PULL) this.stats.abortPlans += 1;

    const plan = {
      schemaVersion: 1,
      mode: SMART_AOE_PLANNER_MODE,
      at: this.now(),
      combatMode: mode,
      state,
      reason,
      hardSafetyReady,
      mayAddTarget,
      pullCapacity: capacity,
      deterministicDesiredPullSize,
      desiredPullSize,
      adaptivePull,
      engagedCount,
      averageEnemyHpRatio,
      aggregateProjectedDamageRatio,
      resources,
      aoeSkills: skills,
      partyCapabilityGeneration: partyCapabilities && partyCapabilities.generation || null
    };
    this.lastPlan = plan;
    return { ...plan, resources: { ...resources }, aoeSkills: skills.map((row) => ({ ...row })) };
  }

  evaluateCandidate(plan, evaluation) {
    const current = plan || this.lastPlan;
    if (!current || current.mayAddTarget !== true || current.state !== SmartAoeState.BUILD_PULL) {
      this.stats.candidateBlocks += 1;
      return { allowed: false, reason: 'PLANNER_NOT_BUILDING_PULL' };
    }
    if (current.engagedCount >= current.pullCapacity) {
      this.stats.candidateBlocks += 1;
      return { allowed: false, reason: 'PULL_CAPACITY_REACHED' };
    }
    if (!evaluation || evaluation.allowed !== true) {
      this.stats.candidateBlocks += 1;
      return { allowed: false, reason: evaluation && evaluation.reason || 'TARGET_EVALUATION_REJECTED' };
    }
    const projected = current.aggregateProjectedDamageRatio + Math.max(0, finite(evaluation.projectedDamageRatio, 0));
    if (projected > this.config.maxAggregateProjectedDamageRatio) {
      this.stats.candidateBlocks += 1;
      return { allowed: false, reason: 'AGGREGATE_PROJECTED_DAMAGE_TOO_HIGH', projectedDamageRatio: projected };
    }
    this.stats.candidateAllows += 1;
    return {
      allowed: true,
      reason: 'WITHIN_DYNAMIC_PULL_CAPACITY',
      projectedDamageRatio: projected,
      resultingCount: current.engagedCount + 1
    };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: SMART_AOE_PLANNER_MODE,
      config: { ...this.config },
      lastPlan: this.lastPlan ? {
        ...this.lastPlan,
        resources: { ...this.lastPlan.resources },
        aoeSkills: this.lastPlan.aoeSkills.map((row) => ({ ...row })),
        adaptivePull: this.lastPlan.adaptivePull ? JSON.parse(JSON.stringify(this.lastPlan.adaptivePull)) : null
      } : null,
      adaptivePullLearning: this.adaptivePullLearner && typeof this.adaptivePullLearner.status === 'function' ? this.adaptivePullLearner.status() : null,
      stats: { ...this.stats }
    };
  }
}

module.exports = { SmartAoePlanner, SmartAoeState, SMART_AOE_PLANNER_MODE };
