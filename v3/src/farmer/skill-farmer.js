'use strict';

const { KitingFarmerController } = require('./kiting-farmer');
const { SkillUsagePolicy } = require('./skill-usage');
const { TargetReassessmentPolicy } = require('./target-reassessment');

class SkillFarmerController extends KitingFarmerController {
  constructor(options = {}) {
    super(options);
    this.skillUsage = options.skillUsage || new SkillUsagePolicy({
      enabled: options.skillUsageEnabled !== false,
      mpReserveRatio: options.skillUsageMpReserveRatio,
      minIntervalMs: options.skillUsageMinIntervalMs,
      maxCommandAttempts: options.skillUsageMaxCommandAttempts,
      failureBackoffMs: options.skillUsageFailureBackoffMs,
      failureBackoffMultiplier: options.skillUsageFailureBackoffMultiplier,
      failureBackoffMaxMs: options.skillUsageFailureBackoffMaxMs,
      failureStreakResetMs: options.skillUsageFailureStreakResetMs
    });
    this.targetReassessment = options.targetReassessment || new TargetReassessmentPolicy({
      enabled: options.targetReassessmentEnabled !== false,
      minIntervalMs: options.targetReassessmentMinIntervalMs,
      switchCooldownMs: options.targetReassessmentSwitchCooldownMs,
      selfAggroSwitchFactor: options.targetReassessmentSelfAggroSwitchFactor,
      selfAggroThreatSwitchFactor: options.targetReassessmentSelfAggroThreatSwitchFactor
    });
    this.lastSkillAttemptAt = -Infinity;
    this.selectedSkill = null;
    this.lastSkillUse = null;
    this.lastSkillDecision = null;
    this.lastSkillExecution = null;
    this.skillFailureBackoffs = new Map();
    this.skillFailureHistory = new Map();
    this.lastSkillBackoff = null;
    this.lastSkillFailureRecovery = null;
    this.lastReassessmentAt = -Infinity;
    this.lastTargetSwitchAt = -Infinity;
    this.lastReassessmentDecision = null;
    this.lastTargetSwitch = null;
  }

  _updateSelectedSkill(context) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;
    const gameData = context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const selected = character ? this.skillUsage.select(character, gameData) : null;
    this.selectedSkill = selected ? selected.id : null;
    return { selected, gameData };
  }

  _shadowStep(context) {
    this._updateSelectedSkill(context);
    return super._shadowStep(context);
  }

  _maybeReassessTarget(context, target) {
    const now = this.now();
    if (now - this.lastReassessmentAt < this.targetReassessment.minIntervalMs) return target;
    this.lastReassessmentAt = now;

    const gameData = context && context.adapter && context.adapter.getGameData ? context.adapter.getGameData() || {} : {};
    const decision = this.targetReassessment.evaluate(context && context.snapshot, target, gameData);
    const round = (value) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)) : null;
    const baseRecord = {
      at: now,
      reason: decision.reason,
      currentTargetId: target && target.id || null,
      currentTargetType: target && target.mtype || null,
      currentTargetOwner: decision.currentTargetOwner == null ? (target && target.target || null) : decision.currentTargetOwner,
      candidateTargetId: decision.target && decision.target.id || null,
      candidateTargetType: decision.target && decision.target.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: round(decision.currentDistance),
      candidateDistance: round(decision.targetDistance),
      switchThresholdDistance: round(decision.switchThresholdDistance),
      currentThreatScore: round(decision.currentThreatScore),
      candidateThreatScore: round(decision.targetThreatScore),
      threatSwitchThreshold: round(decision.threatSwitchThreshold)
    };

    if (!decision.switchTarget || !decision.target) {
      this.lastReassessmentDecision = baseRecord;
      return target;
    }

    const sinceSwitch = now - this.lastTargetSwitchAt;
    if (sinceSwitch < this.targetReassessment.switchCooldownMs) {
      this.lastReassessmentDecision = {
        ...baseRecord,
        reason: 'TARGET_SWITCH_COOLDOWN',
        cooldownRemainingMs: Math.max(0, this.targetReassessment.switchCooldownMs - sinceSwitch)
      };
      return target;
    }

    const previousTargetId = target && target.id || null;
    const previousTargetType = target && target.mtype || null;
    const next = decision.target;
    this.targetId = String(next.id);
    this.targetType = next.mtype || null;
    this.lastTargetSwitchAt = now;
    this.lastReassessmentDecision = baseRecord;
    this.lastTargetSwitch = {
      at: now,
      reason: decision.reason,
      fromTargetId: previousTargetId,
      fromTargetType: previousTargetType,
      toTargetId: next.id || null,
      toTargetType: next.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: baseRecord.currentDistance,
      distance: baseRecord.candidateDistance,
      switchThresholdDistance: baseRecord.switchThresholdDistance,
      currentThreatScore: baseRecord.currentThreatScore,
      threatScore: baseRecord.candidateThreatScore,
      threatSwitchThreshold: baseRecord.threatSwitchThreshold
    };

    this._event('FARMER_TARGET_REASSESSED', 'info', decision.reason, {
      previousTargetId,
      previousTargetType,
      nextTargetId: next.id || null,
      nextTargetType: next.mtype || null,
      attackerCount: Number(decision.attackerCount) || 0,
      currentDistance: this.lastTargetSwitch.currentDistance,
      distance: this.lastTargetSwitch.distance,
      switchThresholdDistance: this.lastTargetSwitch.switchThresholdDistance,
      currentThreatScore: this.lastTargetSwitch.currentThreatScore,
      threatScore: this.lastTargetSwitch.threatScore,
      threatSwitchThreshold: this.lastTargetSwitch.threatSwitchThreshold
    });

    return next;
  }

  _skillDecisionRecord(decision, target) {
    return {
      at: this.now(),
      reason: decision.reason,
      preflightReason: decision.reason,
      skill: decision.skill ? decision.skill.id : null,
      targetId: target && target.id || null,
      targetType: target && target.mtype || null,
      mp: decision.mp == null ? null : Number(decision.mp),
      reserveMp: decision.reserveMp == null ? null : Number(decision.reserveMp.toFixed(2)),
      mpAfter: decision.mpAfter == null ? null : Number(decision.mpAfter.toFixed(2)),
      candidateCount: Number(decision.candidateCount) || 0,
      candidateRank: decision.candidateRank == null ? null : Number(decision.candidateRank),
      rejectedCandidates: Array.isArray(decision.rejectedCandidates)
        ? decision.rejectedCandidates.map((entry) => ({
          skill: entry.skill || null,
          rank: Number(entry.rank) || null,
          reason: entry.reason || null,
          mpAfter: entry.mpAfter == null ? null : Number(Number(entry.mpAfter).toFixed(2))
        }))
        : [],
      executionAttempts: [],
      executionOutcome: null,
      executionFallbackUsed: false
    };
  }

  _executionAttemptRecord(attempt, decision, result) {
    return {
      attempt,
      skill: decision.skill ? decision.skill.id : null,
      candidateRank: decision.candidateRank == null ? null : Number(decision.candidateRank),
      selectionReason: decision.reason || null,
      result: result && result.executed ? 'executed' : (result && result.shadow ? 'shadow' : 'failed'),
      failureReason: result && !result.executed && !result.shadow ? (result.reason || 'SKILL_COMMAND_FAILED') : null
    };
  }

  _pruneSkillFailureState(now = this.now()) {
    for (const [skillId, record] of this.skillFailureBackoffs.entries()) {
      if (!record || Number(record.expiresAt) <= now) this.skillFailureBackoffs.delete(skillId);
    }
    for (const [skillId, record] of this.skillFailureHistory.entries()) {
      if (!record || now - Number(record.lastFailureAt) >= this.skillUsage.failureStreakResetMs) {
        this.skillFailureHistory.delete(skillId);
      }
    }
  }

  _pruneSkillFailureBackoffs(now = this.now()) {
    this._pruneSkillFailureState(now);
  }

  _activeSkillFailureBackoffIds(now = this.now()) {
    this._pruneSkillFailureState(now);
    return [...this.skillFailureBackoffs.keys()];
  }

  _skillFailureBackoffStatus(now = this.now()) {
    this._pruneSkillFailureState(now);
    return [...this.skillFailureBackoffs.values()]
      .sort((a, b) => Number(a.expiresAt) - Number(b.expiresAt) || String(a.skill).localeCompare(String(b.skill)))
      .map((record) => ({
        skill: record.skill,
        reason: record.reason,
        at: record.at,
        expiresAt: record.expiresAt,
        remainingMs: Math.max(0, Number(record.expiresAt) - now),
        failureStreak: Number(record.failureStreak) || 1,
        backoffMs: Number(record.backoffMs) || this.skillUsage.failureBackoffMs
      }));
  }

  _skillFailureHistoryStatus(now = this.now()) {
    this._pruneSkillFailureState(now);
    return [...this.skillFailureHistory.values()]
      .sort((a, b) => Number(b.lastFailureAt) - Number(a.lastFailureAt) || String(a.skill).localeCompare(String(b.skill)))
      .map((record) => ({
        skill: record.skill,
        failureStreak: Number(record.failureStreak) || 0,
        firstFailureAt: record.firstFailureAt,
        lastFailureAt: record.lastFailureAt,
        lastBackoffMs: record.lastBackoffMs,
        resetsInMs: Math.max(0, this.skillUsage.failureStreakResetMs - (now - Number(record.lastFailureAt)))
      }));
  }

  _nextSkillFailureRecord(skillId, now = this.now()) {
    const id = String(skillId);
    this._pruneSkillFailureState(now);
    const previous = this.skillFailureHistory.get(id) || null;
    const failureStreak = previous ? Number(previous.failureStreak) + 1 : 1;
    const backoffMs = this.skillUsage.failureBackoffForStreak(failureStreak);
    const record = {
      skill: id,
      failureStreak,
      firstFailureAt: previous ? previous.firstFailureAt : now,
      lastFailureAt: now,
      lastBackoffMs: backoffMs
    };
    this.skillFailureHistory.set(id, record);
    return record;
  }

  _resetSkillFailureState(skill, now = this.now()) {
    if (!skill || !skill.id) return null;
    const id = String(skill.id);
    this._pruneSkillFailureState(now);
    const history = this.skillFailureHistory.get(id) || null;
    const backoff = this.skillFailureBackoffs.get(id) || null;
    if (!history && !backoff) return null;

    this.skillFailureHistory.delete(id);
    this.skillFailureBackoffs.delete(id);
    const recovery = {
      at: now,
      skill: id,
      reason: 'COMMAND_SUCCEEDED',
      previousFailureStreak: history
        ? Number(history.failureStreak) || 0
        : (backoff ? Number(backoff.failureStreak) || 0 : 0)
    };
    this.lastSkillFailureRecovery = recovery;
    this._event('FARMER_SKILL_FAILURE_STREAK_RESET', 'info', 'COMMAND_SUCCEEDED', recovery);
    return recovery;
  }

  _armSkillFailureBackoff(skill, result, now = this.now()) {
    if (!skill || !skill.id || !this.skillUsage.canRetryCommandFailure(result)) return null;
    const failure = this._nextSkillFailureRecord(skill.id, now);
    const record = {
      skill: String(skill.id),
      reason: String(result.reason || 'COMMAND_FAILED'),
      at: now,
      expiresAt: now + failure.lastBackoffMs,
      failureStreak: failure.failureStreak,
      backoffMs: failure.lastBackoffMs
    };
    this.skillFailureBackoffs.set(record.skill, record);
    this.lastSkillBackoff = { ...record };
    this._event('FARMER_SKILL_BACKOFF_ARMED', 'warn', 'SKILL_COMMAND_BACKOFF', {
      skill: record.skill,
      commandReason: record.reason,
      backoffMs: record.backoffMs,
      baseBackoffMs: this.skillUsage.failureBackoffMs,
      maxBackoffMs: this.skillUsage.failureBackoffMaxMs,
      failureStreak: record.failureStreak,
      escalated: record.failureStreak > 1,
      expiresAt: record.expiresAt
    });
    return record;
  }

  _engage(context, target) {
    const snapshot = context && context.snapshot;
    const character = snapshot && snapshot.character;

    if (snapshot && character && target && !target.dead && !(target.hp != null && target.hp <= 0)) {
      const recovery = this._needsRecovery(snapshot);
      const targetAllowed = this._targetAllowed(target, snapshot, context.party);

      if (!character.rip && !recovery.hpUnsafe && targetAllowed) {
        target = this._maybeReassessTarget(context, target);
        const reassessedTargetAllowed = this._targetAllowed(target, snapshot, context.party);

        if (reassessedTargetAllowed) {
          const kiteDecision = this.kiting.evaluate(character, target);
          if (kiteDecision.shouldMove) return super._engage(context, target);

          const { gameData } = this._updateSelectedSkill(context);
          const decision = this.skillUsage.evaluate(snapshot, target, gameData, context.adapter, {
            backoffSkillIds: this._activeSkillFailureBackoffIds(this.now())
          });
          if (decision.skill) this.selectedSkill = decision.skill.id;
          this.lastSkillDecision = this._skillDecisionRecord(decision, target);

          if (decision.useSkill && decision.skill) {
            const now = this.now();
            if (now - this.lastSkillAttemptAt >= this.skillUsage.minIntervalMs) {
              this.lastSkillAttemptAt = now;
              const attemptedSkillIds = [];
              const executionAttempts = [];
              let attemptDecision = decision;
              let executionOutcome = null;

              for (let attempt = 1; attempt <= this.skillUsage.maxCommandAttempts; attempt += 1) {
                if (!attemptDecision || !attemptDecision.useSkill || !attemptDecision.skill) break;

                const skill = attemptDecision.skill;
                this.selectedSkill = skill.id;
                const result = context.adapter.command('use_skill', [skill.id, String(target.id)]);
                executionAttempts.push(this._executionAttemptRecord(attempt, attemptDecision, result));

                if (result.executed || result.shadow) {
                  const failureRecovery = result.executed ? this._resetSkillFailureState(skill, now) : null;
                  const executionReason = attempt === 1
                    ? attemptDecision.reason
                    : 'SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK';
                  executionOutcome = executionReason;
                  this.lastActionAt = now;
                  this.lastSkillDecision = {
                    ...this._skillDecisionRecord(attemptDecision, target),
                    reason: executionReason,
                    preflightReason: attemptDecision.reason,
                    executionAttempts,
                    executionOutcome,
                    executionFallbackUsed: attempt > 1
                  };
                  this.lastSkillExecution = {
                    at: now,
                    targetId: target.id || null,
                    targetType: target.mtype || null,
                    outcome: executionOutcome,
                    attempts: executionAttempts.slice()
                  };
                  this.lastSkillUse = {
                    at: now,
                    skill: skill.id,
                    skillName: skill.name,
                    targetId: target.id || null,
                    targetType: target.mtype || null,
                    mpCost: skill.mp,
                    damageMultiplier: skill.damageMultiplier,
                    selectionReason: attemptDecision.reason,
                    executionReason,
                    candidateRank: attemptDecision.candidateRank == null ? null : Number(attemptDecision.candidateRank),
                    executionAttempt: attempt,
                    failureStreakReset: !!failureRecovery,
                    previousFailureStreak: failureRecovery ? failureRecovery.previousFailureStreak : 0
                  };
                  this._event('FARMER_SKILL_USED', 'info', executionReason, {
                    skill: skill.id,
                    skillName: skill.name,
                    targetId: target.id || null,
                    targetType: target.mtype || null,
                    mpCost: skill.mp,
                    damageMultiplier: skill.damageMultiplier,
                    mpAfter: Number(attemptDecision.mpAfter.toFixed(2)),
                    reserveMp: Number(attemptDecision.reserveMp.toFixed(2)),
                    candidateCount: Number(attemptDecision.candidateCount) || 0,
                    candidateRank: attemptDecision.candidateRank == null ? null : Number(attemptDecision.candidateRank),
                    selectionReason: attemptDecision.reason,
                    executionAttempt: attempt,
                    executionFallbackUsed: attempt > 1,
                    failureStreakReset: !!failureRecovery,
                    previousFailureStreak: failureRecovery ? failureRecovery.previousFailureStreak : 0,
                    rejectedCandidates: this.lastSkillDecision.rejectedCandidates,
                    executionAttempts: executionAttempts.slice()
                  });
                  return;
                }

                attemptedSkillIds.push(skill.id);
                const retryable = this.skillUsage.canRetryCommandFailure(result);
                const backoffRecord = retryable ? this._armSkillFailureBackoff(skill, result, now) : null;
                const withinAttemptLimit = attempt < this.skillUsage.maxCommandAttempts;
                let nextDecision = null;
                if (retryable && withinAttemptLimit) {
                  nextDecision = this.skillUsage.evaluate(snapshot, target, gameData, context.adapter, {
                    skipSkillIds: attemptedSkillIds,
                    backoffSkillIds: this._activeSkillFailureBackoffIds(now)
                  });
                }
                const willRetry = !!(nextDecision && nextDecision.useSkill && nextDecision.skill);

                this._event('FARMER_SKILL_USE_FAILED', 'warn', result.reason || 'SKILL_COMMAND_FAILED', {
                  skill: skill.id,
                  targetId: target.id || null,
                  targetType: target.mtype || null,
                  selectionReason: attemptDecision.reason,
                  candidateRank: attemptDecision.candidateRank == null ? null : Number(attemptDecision.candidateRank),
                  executionAttempt: attempt,
                  retryable,
                  willRetry,
                  maxCommandAttempts: this.skillUsage.maxCommandAttempts,
                  backoffArmed: !!backoffRecord,
                  backoffMs: backoffRecord ? backoffRecord.backoffMs : 0,
                  failureStreak: backoffRecord ? backoffRecord.failureStreak : 0
                });

                if (!retryable) {
                  executionOutcome = 'SKILL_COMMAND_NON_RETRYABLE';
                  break;
                }
                if (!withinAttemptLimit) {
                  executionOutcome = 'SKILL_COMMAND_FALLBACK_EXHAUSTED';
                  break;
                }
                if (!willRetry) {
                  executionOutcome = 'NO_SAFE_EXECUTION_FALLBACK';
                  break;
                }

                attemptDecision = nextDecision;
              }

              this.lastSkillDecision = {
                ...this.lastSkillDecision,
                executionAttempts,
                executionOutcome: executionOutcome || 'SKILL_COMMAND_FALLBACK_EXHAUSTED',
                executionFallbackUsed: executionAttempts.length > 1
              };
              this.lastSkillExecution = {
                at: now,
                targetId: target.id || null,
                targetType: target.mtype || null,
                outcome: this.lastSkillDecision.executionOutcome,
                attempts: executionAttempts.slice()
              };
            }
          }
        }
      }
    }

    return super._engage(context, target);
  }

  status() {
    return {
      ...super.status(),
      skillUsage: {
        ...this.skillUsage.status(),
        selectedSkill: this.selectedSkill,
        lastUse: this.lastSkillUse,
        lastDecision: this.lastSkillDecision,
        lastExecution: this.lastSkillExecution,
        activeFailureBackoffs: this._skillFailureBackoffStatus(),
        recentFailureStreaks: this._skillFailureHistoryStatus(),
        lastBackoff: this.lastSkillBackoff,
        lastFailureRecovery: this.lastSkillFailureRecovery
      },
      targetReassessment: {
        ...this.targetReassessment.status(),
        lastDecision: this.lastReassessmentDecision,
        lastSwitch: this.lastTargetSwitch
      }
    };
  }
}

module.exports = { SkillFarmerController };
