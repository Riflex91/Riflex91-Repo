'use strict';

const KnowledgeState = Object.freeze({ UNKNOWN: 'UNKNOWN', KNOWN_TRUE: 'KNOWN_TRUE', KNOWN_FALSE: 'KNOWN_FALSE' });
const EvidenceKind = Object.freeze({ OBSERVED: 'OBSERVED', INFERRED: 'INFERRED', HYPOTHESIS: 'HYPOTHESIS' });

function key(type, id) { return `${type}:${id}`; }
function perfKey(monster, fingerprint) { return `${monster}::${fingerprint || 'unknown-party'}`; }

class WorldModel {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.entities = new Map();
    this.performance = new Map();
  }

  observeEntity(type, id, attributes = {}, meta = {}) {
    if (!type || !id) return null;
    const k = key(type, id);
    const current = this.entities.get(k) || { type, id: String(id), facts: {}, firstSeenAt: this.now(), lastSeenAt: 0 };
    current.lastSeenAt = this.now();
    for (const [name, value] of Object.entries(attributes)) {
      current.facts[name] = {
        state: value === undefined || value === null ? KnowledgeState.UNKNOWN : (typeof value === 'boolean' ? (value ? KnowledgeState.KNOWN_TRUE : KnowledgeState.KNOWN_FALSE) : KnowledgeState.KNOWN_TRUE),
        value: value === undefined ? null : value,
        confidence: Math.max(0, Math.min(1, Number(meta.confidence == null ? 1 : meta.confidence))),
        evidence: meta.evidence || EvidenceKind.OBSERVED,
        samples: (current.facts[name] && current.facts[name].samples || 0) + 1,
        updatedAt: this.now()
      };
    }
    this.entities.set(k, current);
    return current;
  }

  hypothesis(type, id, fact, value, confidence = 0.25) {
    return this.observeEntity(type, id, { [fact]: value }, { evidence: EvidenceKind.HYPOTHESIS, confidence });
  }

  fact(type, id, factName) {
    const entity = this.entities.get(key(type, id));
    return entity && entity.facts[factName] || { state: KnowledgeState.UNKNOWN, value: null, confidence: 0, evidence: null, samples: 0, updatedAt: null };
  }

  recordPerformance(monster, fingerprint, sample = {}) {
    if (!monster) return null;
    const k = perfKey(monster, fingerprint);
    const current = this.performance.get(k) || { monster, fingerprint: fingerprint || 'unknown-party', seconds: 0, xp: 0, gold: 0, kills: 0, deaths: 0, potions: 0, windows: 0, updatedAt: 0 };
    current.seconds += Math.max(0, Number(sample.seconds) || 0);
    current.xp += Math.max(0, Number(sample.xp) || 0);
    current.gold += Math.max(0, Number(sample.gold) || 0);
    current.kills += Math.max(0, Number(sample.kills) || 0);
    current.deaths += Math.max(0, Number(sample.deaths) || 0);
    current.potions += Math.max(0, Number(sample.potions) || 0);
    current.windows += 1;
    current.updatedAt = this.now();
    this.performance.set(k, current);
    if (this.log) this.log.emit({ component: 'world', event: 'PERFORMANCE_WINDOW_RECORDED', data: { monster, fingerprint: current.fingerprint, seconds: sample.seconds || 0, xp: sample.xp || 0, gold: sample.gold || 0, kills: sample.kills || 0, deaths: sample.deaths || 0 } });
    return this.performanceFor(monster, fingerprint);
  }

  performanceFor(monster, fingerprint) {
    const p = this.performance.get(perfKey(monster, fingerprint));
    if (!p) return null;
    const hours = p.seconds / 3600;
    return {
      ...p,
      xpPerHour: hours > 0 ? p.xp / hours : 0,
      goldPerHour: hours > 0 ? p.gold / hours : 0,
      deathsPerHour: hours > 0 ? p.deaths / hours : 0,
      killsPerHour: hours > 0 ? p.kills / hours : 0,
      confidence: Math.max(0, Math.min(1, p.seconds / 1800))
    };
  }

  summary() {
    const evidence = { OBSERVED: 0, INFERRED: 0, HYPOTHESIS: 0, UNKNOWN: 0 };
    for (const entity of this.entities.values()) {
      for (const fact of Object.values(entity.facts)) {
        if (fact.state === KnowledgeState.UNKNOWN) evidence.UNKNOWN += 1;
        else evidence[fact.evidence] = (evidence[fact.evidence] || 0) + 1;
      }
    }
    return { entities: this.entities.size, performanceProfiles: this.performance.size, evidence };
  }

  serialize() {
    return JSON.stringify({ schemaVersion: 1, entities: [...this.entities.entries()], performance: [...this.performance.entries()] });
  }

  restore(serialized) {
    const data = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
    if (!data || data.schemaVersion !== 1) throw new Error('unsupported world model schema');
    this.entities = new Map(data.entities || []);
    this.performance = new Map(data.performance || []);
  }
}

module.exports = { WorldModel, KnowledgeState, EvidenceKind };
