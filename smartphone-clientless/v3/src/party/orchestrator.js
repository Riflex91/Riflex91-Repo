'use strict';

const base = require('./orchestrator-base');
const { createPartyFingerprint } = require('./fingerprints');

function clamp01(value) {
  const number = Number(value);
  return Math.max(0, Math.min(1, Number.isFinite(number) ? number : 0));
}

class PartyOrchestrator extends base.PartyOrchestrator {
  candidates(registryStatus) {
    const chars = (registryStatus && registryStatus.characters || []).filter((entry) => entry
      && entry.dead !== true
      && entry.available !== false
      && entry.stateConfidence >= 0.3
      && (entry.online === true || entry.primarySource === 'configured' || entry.presence === 'OFFLINE'));
    const merchants = chars.filter((entry) => entry.ctype === 'merchant');
    const combat = chars.filter((entry) => base.COMBAT_CLASSES.has(entry.ctype));
    const out = [];

    for (const merchant of merchants) {
      for (let combatCount = 1; combatCount <= Math.min(3, combat.length); combatCount += 1) {
        for (const group of base.combinations(combat, combatCount)) {
          const members = [merchant, ...group];
          const fingerprint = createPartyFingerprint(members);
          out.push({ id: fingerprint.key, merchant, combat: group, members, fingerprint });
          if (out.length >= this.maxCandidates) return out;
        }
      }
    }
    return out;
  }

  _theory(candidate, encounter) {
    const theory = super._theory(candidate, encounter);
    const combatCount = Array.isArray(candidate && candidate.combat) ? candidate.combat.length : 0;
    if (combatCount >= 3) return theory;
    const capacity = clamp01(combatCount / 3);

    // The original priors were calibrated for three combat characters. Keep
    // those priors, but conservatively discount smaller teams so fixed base
    // bonuses cannot make a reduced-capability party look artificially best.
    theory.survival = clamp01(theory.survival * (0.82 + 0.18 * capacity));
    theory.progress = clamp01(theory.progress * (0.62 + 0.38 * capacity));
    theory.controllability = clamp01(theory.controllability * (0.88 + 0.12 * capacity));
    theory.synergy = clamp01(theory.synergy * (0.58 + 0.42 * capacity));
    theory.confidence = clamp01(theory.confidence * (0.72 + 0.28 * capacity));
    theory.reasons = [...new Set([...(theory.reasons || []), 'REDUCED_COMBAT_CAPACITY'])];
    return theory;
  }
}

module.exports = {
  PartyOrchestrator,
  COMBAT_CLASSES: base.COMBAT_CLASSES,
  DEFAULT_WEIGHTS: base.DEFAULT_WEIGHTS,
  combinations: base.combinations
};
