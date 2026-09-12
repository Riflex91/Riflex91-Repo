'use strict';

const { ContentSafetyGate } = require('./content-safety');

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function hpRatio(snapshot) {
  const c = snapshot && snapshot.character;
  if (!c) return 1;
  const maxHp = Number(c.max_hp) || 0;
  if (maxHp <= 0) return 1;
  return clamp01((Number(c.hp) || 0) / maxHp);
}

class CombatRiskGate {
  constructor(options = {}) {
    this.threshold = Math.max(0.1, Math.min(1, Number(options.threshold) || 0.65));
    this.recoveryHpRatio = Math.max(0.1, Math.min(1, Number(options.recoveryHpRatio) || 0.75));
    this.lowHpWeight = Math.max(0, Math.min(1, Number(options.lowHpWeight) || 0.45));
    this.additionalAggroWeight = Math.max(0, Math.min(1, Number(options.additionalAggroWeight) || 0.70));
    this.deathRiskWeight = Math.max(0, Math.min(1, Number(options.deathRiskWeight) || 0.65));
    this.deathRateReference = Math.max(0.1, Number(options.deathRateReference) || 2);
    this.minLearnedConfidence = Math.max(0, Math.min(1, Number(options.minLearnedConfidence) || 0.25));
    this.contentSafety = options.contentSafety || new ContentSafetyGate({ log: options.log, now: options.now });
    this.lastWorld = null;
  }

  approveMonsterType(world, mtype) {
    return this.contentSafety.approve(world || this.lastWorld, mtype);
  }

  quarantineMonsterType(world, mtype) {
    return this.contentSafety.quarantine(world || this.lastWorld, mtype);
  }

  _additionalAggro(snapshot, entity) {
    const c = snapshot && snapshot.character;
    if (!c || !c.name) return 0;
    const targetId = entity && entity.id != null ? String(entity.id) : null;
    return (snapshot.entities || []).filter((other) => {
      if (!other || !other.mtype || other.dead || (other.hp != null && Number(other.hp) <= 0)) return false;
      if (targetId != null && String(other.id) === targetId) return false;
      return other.target === c.name;
    }).length;
  }

  evaluate(entity, snapshot, world, party) {
    if (!entity || !entity.mtype || !snapshot || !snapshot.character) {
      return { allowed: true, score: 0, reason: 'RISK_NOT_APPLICABLE', signals: {} };
    }

    if (world) this.lastWorld = world;
    const content = this.contentSafety.evaluate(entity, world || this.lastWorld);
    if (!content.allowed) {
      return {
        allowed: false,
        score: 1,
        threshold: this.threshold,
        reason: content.reason,
        signals: {
          contentDisposition: content.disposition || null,
          contentReason: content.cause || content.reason,
          monsterType: content.monsterType || entity.mtype
        }
      };
    }

    // Existing combat is not abandoned by the ordinary risk score, but unknown
    // content was already filtered above so ALREADY_ENGAGED cannot bypass quarantine.
    if (entity.target) {
      return {
        allowed: true,
        score: 0,
        reason: 'ALREADY_ENGAGED',
        signals: { claimedBy: entity.target, contentDisposition: content.disposition || null }
      };
    }

    const signals = { contentDisposition: content.disposition || null };
    let score = 0;
    let primaryReason = 'RISK_ACCEPTABLE';

    const currentHpRatio = hpRatio(snapshot);
    signals.hpRatio = Number(currentHpRatio.toFixed(3));
    if (currentHpRatio < this.recoveryHpRatio) {
      const deficit = clamp01((this.recoveryHpRatio - currentHpRatio) / this.recoveryHpRatio);
      const contribution = deficit * this.lowHpWeight;
      score += contribution;
      signals.lowHpContribution = Number(contribution.toFixed(3));
      if (contribution > 0) primaryReason = 'LOW_HP';
    }

    const additionalAggro = this._additionalAggro(snapshot, entity);
    signals.additionalAggro = additionalAggro;
    if (additionalAggro > 0) {
      const contribution = Math.min(1, additionalAggro) * this.additionalAggroWeight;
      score += contribution;
      signals.additionalAggroContribution = Number(contribution.toFixed(3));
      primaryReason = 'ADDITIONAL_AGGRO';
    }

    const fingerprint = party && party.fingerprint || null;
    let learned = null;
    if (world && typeof world.performanceFor === 'function') {
      try { learned = world.performanceFor(entity.mtype, fingerprint); } catch (_) { learned = null; }
    }
    if (learned) {
      const confidence = clamp01(learned.confidence);
      const deathsPerHour = Math.max(0, Number(learned.deathsPerHour) || 0);
      signals.learnedConfidence = Number(confidence.toFixed(3));
      signals.deathsPerHour = Number(deathsPerHour.toFixed(3));
      if (confidence >= this.minLearnedConfidence && deathsPerHour > 0) {
        const scaled = clamp01(deathsPerHour / this.deathRateReference);
        const contribution = scaled * this.deathRiskWeight * confidence;
        score += contribution;
        signals.deathRiskContribution = Number(contribution.toFixed(3));
        if (contribution >= this.additionalAggroWeight * 0.5 && primaryReason === 'RISK_ACCEPTABLE') primaryReason = 'LEARNED_DEATH_RISK';
      }
    }

    score = clamp01(score);
    const allowed = score < this.threshold;
    if (!allowed && primaryReason === 'RISK_ACCEPTABLE') primaryReason = 'RISK_THRESHOLD_EXCEEDED';
    return {
      allowed,
      score: Number(score.toFixed(3)),
      threshold: this.threshold,
      reason: allowed ? 'RISK_ACCEPTABLE' : primaryReason,
      signals
    };
  }

  status() {
    return {
      threshold: this.threshold,
      recoveryHpRatio: this.recoveryHpRatio,
      minLearnedConfidence: this.minLearnedConfidence,
      deathRateReference: this.deathRateReference,
      contentSafety: this.contentSafety.status(this.lastWorld)
    };
  }
}

module.exports = { CombatRiskGate };
