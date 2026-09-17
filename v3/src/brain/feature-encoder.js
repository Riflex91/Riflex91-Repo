'use strict';

const { finite, clamp01, ratio } = require('../core/numeric');

const FEATURE_SCHEMA_VERSION = 1;
const FEATURE_NAMES = Object.freeze([
  'xpRate',
  'goldRate',
  'survival',
  'confidence',
  'travelEfficiency',
  'measuredEvidence',
  'hpReserve',
  'mpReserve',
  'currentPlanAffinity'
]);

function candidateId(candidate) {
  if (!candidate) return null;
  if (candidate.id != null && String(candidate.id)) return String(candidate.id);
  if (candidate.monster != null && String(candidate.monster)) return String(candidate.monster);
  return null;
}

class StrategicFeatureEncoder {
  constructor(options = {}) {
    this.maxDeathsPerHour = Math.max(0.01, Math.min(10, finite(options.maxDeathsPerHour, 0.25)));
    this.maxTravelSeconds = Math.max(30, Math.min(3600, finite(options.maxTravelSeconds, 600)));
  }

  encodeCandidates(context = {}) {
    const snapshot = context.snapshot || {};
    const character = snapshot.character || {};
    const candidates = Array.isArray(context.candidates) ? context.candidates.filter(Boolean) : [];
    const currentPlan = context.currentPlan || null;
    const usable = candidates.filter((candidate) => candidateId(candidate));
    if (!usable.length) return [];

    const maxXp = Math.max(1, ...usable.map((candidate) => Math.max(0, finite(candidate.xpPerHour, 0))));
    const maxGold = Math.max(1, ...usable.map((candidate) => Math.max(0, finite(candidate.goldPerHour, 0))));
    const hpReserve = ratio(character.hp, character.max_hp, 0);
    const mpReserve = ratio(character.mp, character.max_mp, 0);

    return usable.map((candidate) => {
      const id = candidateId(candidate);
      const deaths = Math.max(0, finite(candidate.deathsPerHour, 0));
      const travel = Math.max(0, finite(candidate.travelSeconds, this.maxTravelSeconds));
      const source = String(candidate.source || '');
      const planMatches = !!currentPlan && (
        (currentPlan.id != null && String(currentPlan.id) === id) ||
        (currentPlan.monster != null && candidate.monster != null && String(currentPlan.monster) === String(candidate.monster))
      );
      const features = {
        xpRate: clamp01(Math.max(0, finite(candidate.xpPerHour, 0)) / maxXp),
        goldRate: clamp01(Math.max(0, finite(candidate.goldPerHour, 0)) / maxGold),
        survival: clamp01(1 - deaths / this.maxDeathsPerHour),
        confidence: clamp01(candidate.confidence == null ? 0 : candidate.confidence),
        travelEfficiency: clamp01(1 - travel / this.maxTravelSeconds),
        measuredEvidence: source.startsWith('measured') ? 1 : 0,
        hpReserve,
        mpReserve,
        currentPlanAffinity: planMatches ? 1 : 0
      };
      return {
        id,
        monster: candidate.monster != null ? String(candidate.monster) : null,
        map: candidate.map != null ? String(candidate.map) : null,
        schemaVersion: FEATURE_SCHEMA_VERSION,
        features,
        vector: FEATURE_NAMES.map((name) => features[name])
      };
    });
  }

  status() {
    return {
      schemaVersion: FEATURE_SCHEMA_VERSION,
      featureNames: FEATURE_NAMES.slice(),
      maxDeathsPerHour: this.maxDeathsPerHour,
      maxTravelSeconds: this.maxTravelSeconds
    };
  }
}

module.exports = {
  FEATURE_SCHEMA_VERSION,
  FEATURE_NAMES,
  StrategicFeatureEncoder,
  candidateId,
  clamp01
};
