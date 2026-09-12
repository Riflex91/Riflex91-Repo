'use strict';

class KnowledgeAgingPolicy {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    // Production defaults remain deliberately long-lived (6h fresh / 72h stale),
    // while explicit configurations may use short windows for deterministic tests
    // and future controlled revalidation experiments.
    this.freshMs = Math.max(100, Number(options.freshMs) || 6 * 60 * 60 * 1000);
    this.staleMs = Math.max(this.freshMs + 100, Number(options.staleMs) || 72 * 60 * 60 * 1000);
    this.minFreshness = Math.max(0.05, Math.min(0.5, Number(options.minFreshness) || 0.15));
  }

  freshness(ageMs) {
    const age = Math.max(0, Number(ageMs) || 0);
    if (age <= this.freshMs) return 1;
    if (age >= this.staleMs) return this.minFreshness;
    const span = this.staleMs - this.freshMs;
    const t = (age - this.freshMs) / span;
    return 1 - t * (1 - this.minFreshness);
  }

  apply(record) {
    if (!record) return null;
    const now = this.now();
    const updatedAt = Number(record.updatedAt) || 0;
    const ageMs = updatedAt > 0 ? Math.max(0, now - updatedAt) : Infinity;
    const freshness = Number.isFinite(ageMs) ? this.freshness(ageMs) : this.minFreshness;
    const baseConfidence = Math.max(0, Math.min(1, Number(record.confidence) || 0));
    return {
      ...record,
      baseConfidence,
      confidence: Number((baseConfidence * freshness).toFixed(6)),
      freshness: Number(freshness.toFixed(6)),
      ageMs: Number.isFinite(ageMs) ? ageMs : null,
      stale: !Number.isFinite(ageMs) || ageMs >= this.staleMs,
      needsRevalidation: !Number.isFinite(ageMs) || ageMs > this.freshMs
    };
  }

  status(world) {
    let fresh = 0;
    let aging = 0;
    let stale = 0;
    if (world && world.performance instanceof Map) {
      for (const record of world.performance.values()) {
        const ageMs = record && record.updatedAt ? Math.max(0, this.now() - Number(record.updatedAt)) : Infinity;
        if (!Number.isFinite(ageMs) || ageMs >= this.staleMs) stale += 1;
        else if (ageMs > this.freshMs) aging += 1;
        else fresh += 1;
      }
    }
    return { freshMs: this.freshMs, staleMs: this.staleMs, minFreshness: this.minFreshness, profiles: { fresh, aging, stale } };
  }
}

function installKnowledgeAging(world, policy) {
  if (!world || !policy || world.__knowledgeAgingInstalled) return false;
  const basePerformanceFor = world.performanceFor.bind(world);
  world.performanceFor = (monster, fingerprint) => policy.apply(basePerformanceFor(monster, fingerprint));
  world.__knowledgeAgingInstalled = true;
  return true;
}

function installStaleRiskGuard(combatRisk, world, policy, options = {}) {
  if (!combatRisk || !world || !policy || combatRisk.__staleRiskGuardInstalled) return false;
  const weight = Math.max(0, Math.min(0.5, Number(options.weight) || 0.25));
  const baseEvaluate = combatRisk.evaluate.bind(combatRisk);
  combatRisk.evaluate = (entity, snapshot, currentWorld, party) => {
    const result = baseEvaluate(entity, snapshot, currentWorld, party);
    if (!entity || !entity.mtype || entity.target || !result || !result.allowed) return result;
    const fingerprint = party && party.fingerprint || null;
    let learned = null;
    try { learned = (currentWorld || world).performanceFor(entity.mtype, fingerprint); } catch (_) { learned = null; }
    if (!learned || !learned.needsRevalidation) return result;
    const baseConfidence = Math.max(0, Math.min(1, Number(learned.baseConfidence) || Number(learned.confidence) || 0));
    const contribution = weight * Math.max(0.25, baseConfidence);
    const score = Math.min(1, Math.max(0, Number(result.score) || 0) + contribution);
    const allowed = score < Number(result.threshold || combatRisk.threshold || 0.65);
    return {
      ...result,
      allowed,
      score: Number(score.toFixed(3)),
      reason: allowed ? 'RISK_ACCEPTABLE_STALE_KNOWLEDGE' : 'STALE_KNOWLEDGE_REVALIDATION_REQUIRED',
      signals: {
        ...(result.signals || {}),
        performanceAgeMs: learned.ageMs,
        performanceFreshness: learned.freshness,
        performanceNeedsRevalidation: true,
        staleKnowledgeContribution: Number(contribution.toFixed(3))
      }
    };
  };
  combatRisk.__staleRiskGuardInstalled = true;
  combatRisk.staleKnowledgeWeight = weight;
  const baseStatus = combatRisk.status.bind(combatRisk);
  combatRisk.status = () => ({ ...baseStatus(), staleKnowledgeWeight: weight, knowledgeAging: policy.status(world) });
  return true;
}

module.exports = { KnowledgeAgingPolicy, installKnowledgeAging, installStaleRiskGuard };
