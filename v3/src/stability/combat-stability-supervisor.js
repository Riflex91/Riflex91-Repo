'use strict';

const { CommandOutcomeState } = require('../game/command-outcomes');

class CombatStabilitySupervisor {
  constructor(options = {}) {
    this.runtime = options.runtime || null;
    this.adapter = options.adapter || this.runtime && this.runtime.adapter || null;
    this.log = options.log || this.runtime && this.runtime.log || null;
    this.now = options.now || (() => Date.now());
    this.capacity = Math.max(20, Number(options.capacity) || 100);
    this.recent = [];
    this.counts = { CONFIRMED: 0, TIMED_OUT: 0 };
    this.skillTimeouts = 0;
    this.attackTimeoutStreak = 0;
    this.lastAttackOutcome = null;
  }

  _event(event, severity, reason, data) {
    if (!this.log) return;
    this.log.emit({ component: 'stability', event, severity: severity || 'info', reason: reason || null, data: data || {} });
  }

  _remember(outcome) {
    this.recent.push({
      id: outcome.id,
      action: outcome.action,
      state: outcome.state,
      reason: outcome.reason,
      issuedAt: outcome.issuedAt,
      confirmedAt: outcome.confirmedAt,
      observed: outcome.observed || null
    });
    if (this.recent.length > this.capacity) this.recent.splice(0, this.recent.length - this.capacity);
  }

  _restorePreviousSkillStreak(skillId, outcome) {
    const farmer = this.runtime && this.runtime.farmer;
    if (!farmer || !farmer.skillFailureHistory || !skillId) return;
    const recovery = farmer.lastSkillFailureRecovery;
    if (!recovery || String(recovery.skill) !== String(skillId)) return;
    if (Number(recovery.at) < Number(outcome.issuedAt) - 50) return;
    const previous = Math.max(0, Number(recovery.previousFailureStreak) || 0);
    if (!previous) return;
    farmer.skillFailureHistory.set(String(skillId), {
      skill: String(skillId),
      failureStreak: previous,
      firstFailureAt: Number(outcome.issuedAt) - 1,
      lastFailureAt: Number(outcome.issuedAt) - 1,
      lastBackoffMs: farmer.skillUsage && farmer.skillUsage.failureBackoffForStreak
        ? farmer.skillUsage.failureBackoffForStreak(previous)
        : 0
    });
  }

  _handleSkill(outcome) {
    const farmer = this.runtime && this.runtime.farmer;
    const skillId = outcome.args && outcome.args[0] != null ? String(outcome.args[0]) : null;
    if (!farmer || !skillId) return;

    if (outcome.state === CommandOutcomeState.CONFIRMED) {
      if (typeof farmer._resetSkillFailureState === 'function') farmer._resetSkillFailureState({ id: skillId }, this.now());
      this._event('SKILL_OUTCOME_CONFIRMED', 'info', outcome.reason, { outcomeId: outcome.id, skill: skillId, observed: outcome.observed || null });
      return;
    }

    if (outcome.state === CommandOutcomeState.TIMED_OUT) {
      this.skillTimeouts += 1;
      this._restorePreviousSkillStreak(skillId, outcome);
      let backoff = null;
      if (typeof farmer._armSkillFailureBackoff === 'function') {
        backoff = farmer._armSkillFailureBackoff({ id: skillId }, { executed: false, reason: 'COMMAND_FAILED' }, this.now());
      }
      this._event('SKILL_OUTCOME_TIMED_OUT', 'warn', 'COMMAND_OUTCOME_TIMEOUT', {
        outcomeId: outcome.id,
        skill: skillId,
        backoffArmed: !!backoff,
        failureStreak: backoff && backoff.failureStreak || 0,
        backoffMs: backoff && backoff.backoffMs || 0
      });
    }
  }

  _handleAttack(outcome) {
    this.lastAttackOutcome = {
      id: outcome.id,
      state: outcome.state,
      reason: outcome.reason,
      at: outcome.confirmedAt
    };
    if (outcome.state === CommandOutcomeState.CONFIRMED) this.attackTimeoutStreak = 0;
    else if (outcome.state === CommandOutcomeState.TIMED_OUT) this.attackTimeoutStreak += 1;
    this._event(
      outcome.state === CommandOutcomeState.CONFIRMED ? 'ATTACK_OUTCOME_CONFIRMED' : 'ATTACK_OUTCOME_TIMED_OUT',
      outcome.state === CommandOutcomeState.CONFIRMED ? 'info' : 'warn',
      outcome.reason,
      { outcomeId: outcome.id, timeoutStreak: this.attackTimeoutStreak }
    );
  }

  process() {
    if (!this.adapter || typeof this.adapter.takeCommandOutcomes !== 'function') return [];
    const outcomes = this.adapter.takeCommandOutcomes(200);
    for (const outcome of outcomes) {
      this._remember(outcome);
      this.counts[outcome.state] = (this.counts[outcome.state] || 0) + 1;
      if (outcome.action === 'use_skill') this._handleSkill(outcome);
      if (outcome.action === 'attack') this._handleAttack(outcome);
    }
    return outcomes;
  }

  status() {
    return {
      counts: { ...this.counts },
      skillTimeouts: this.skillTimeouts,
      attackTimeoutStreak: this.attackTimeoutStreak,
      lastAttackOutcome: this.lastAttackOutcome,
      recent: this.recent.slice()
    };
  }
}

module.exports = { CombatStabilitySupervisor };
