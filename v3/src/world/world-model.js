'use strict';

const KnowledgeState = Object.freeze({ UNKNOWN: 'UNKNOWN', KNOWN_TRUE: 'KNOWN_TRUE', KNOWN_FALSE: 'KNOWN_FALSE' });
const EvidenceKind = Object.freeze({ OBSERVED: 'OBSERVED', INFERRED: 'INFERRED', HYPOTHESIS: 'HYPOTHESIS' });

function key(type, id) { return `${type}:${id}`; }
function perfKey(monster, fingerprint) { return `${monster}::${fingerprint || 'unknown-party'}`; }

class WorldModel {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.maxEntities = Math.max(100, Number(options.maxEntities) || 5000);
    this.maxPerformanceProfiles = Math.max(50, Number(options.maxPerformanceProfiles) || 1000);
    this.entities = new Map();
    this.performance = new Map();
    this.revision = 0;
  }

  hasEntity(type, id) { return this.entities.has(key(type, id)); }
  entity(type, id) { return this.entities.get(key(type, id)) || null; }

  _touch() { this.revision += 1; }

  _pruneEntities() {
    if (this.entities.size <= this.maxEntities) return;
    const removable = [...this.entities.entries()].sort((a, b) => (a[1].lastSeenAt || 0) - (b[1].lastSeenAt || 0));
    const count = this.entities.size - this.maxEntities;
    for (let i = 0; i < count; i++) this.entities.delete(removable[i][0]);
    if (this.log && count > 0) this.log.emit({ component: 'world', event: 'WORLD_ENTITIES_PRUNED', severity: 'warn', data: { count, maxEntities: this.maxEntities } });
  }

  _prunePerformance() {
    if (this.performance.size <= this.maxPerformanceProfiles) return;
    const removable = [...this.performance.entries()].sort((a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0));
    const count = this.performance.size - this.maxPerformanceProfiles;
    for (let i = 0; i < count; i++) this.performance.delete(removable[i][0]);
    if (this.log && count > 0) this.log.emit({ component: 'world', event: 'WORLD_PERFORMANCE_PRUNED', severity: 'warn', data: { count, maxPerformanceProfiles: this.maxPerformanceProfiles } });
  }

  observeEntity(type, id, attributes = {}, meta = {}) {
    if (!type || !id) return null;
    const k = key(type, id);
    const now = this.now();
    const current = this.entities.get(k) || { type, id: String(id), facts: {}, firstSeenAt: now, lastSeenAt: 0 };
    current.lastSeenAt = now;
    for (const [name, value] of Object.entries(attributes)) {
      current.facts[name] = {
        state: value === undefined || value === null ? KnowledgeState.UNKNOWN : (typeof value === 'boolean' ? (value ? KnowledgeState.KNOWN_TRUE : KnowledgeState.KNOWN_FALSE) : KnowledgeState.KNOWN_TRUE),
        value: value === undefined ? null : value,
        confidence: Math.max(0, Math.min(1, Number(meta.confidence == null ? 1 : meta.confidence))),
        evidence: meta.evidence || EvidenceKind.OBSERVED,
        samples: (current.facts[name] && current.facts[name].samples || 0) + 1,
        updatedAt: now
      };
    }
    this.entities.set(k, current);
    this._touch();
    this._pruneEntities();
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
    const current = this.performance.get(k) || {
      monster,
      fingerprint: fingerprint || 'unknown-party',
      seconds: 0,
      xp: 0,
      gold: 0,
      kills: 0,
      deaths: 0,
      potions: 0,
      damageTaken: 0,
      monsterHpLost: 0,
      windows: 0,
      updatedAt: 0
    };
    current.seconds += Math.max(0, Number(sample.seconds) || 0);
    current.xp += Math.max(0, Number(sample.xp) || 0);
    current.gold += Number(sample.gold) || 0;
    current.kills += Math.max(0, Number(sample.kills) || 0);
    current.deaths += Math.max(0, Number(sample.deaths) || 0);
    current.potions += Math.max(0, Number(sample.potions) || 0);
    current.damageTaken += Math.max(0, Number(sample.damageTaken) || 0);
    current.monsterHpLost += Math.max(0, Number(sample.monsterHpLost) || 0);
    current.windows += 1;
    current.updatedAt = this.now();
    this.performance.set(k, current);
    this._touch();
    this._prunePerformance();
    if (this.log) this.log.emit({
      component: 'world',
      event: 'PERFORMANCE_WINDOW_RECORDED',
      data: {
        monster,
        fingerprint: current.fingerprint,
        seconds: sample.seconds || 0,
        xp: sample.xp || 0,
        gold: sample.gold || 0,
        kills: sample.kills || 0,
        deaths: sample.deaths || 0,
        potions: sample.potions || 0,
        damageTaken: sample.damageTaken || 0,
        monsterHpLost: sample.monsterHpLost || 0
      }
    });
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
      potionsPerHour: hours > 0 ? p.potions / hours : 0,
      damageTakenPerHour: hours > 0 ? p.damageTaken / hours : 0,
      monsterHpLostPerHour: hours > 0 ? p.monsterHpLost / hours : 0,
      confidence: Math.max(0, Math.min(1, p.seconds / 1800))
    };
  }

  summary() {
    const evidence = { OBSERVED: 0, INFERRED: 0, HYPOTHESIS: 0, UNKNOWN: 0 };
    const entityTypes = {};
    for (const entity of this.entities.values()) {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
      for (const fact of Object.values(entity.facts)) {
        if (fact.state === KnowledgeState.UNKNOWN) evidence.UNKNOWN += 1;
        else evidence[fact.evidence] = (evidence[fact.evidence] || 0) + 1;
      }
    }
    return { entities: this.entities.size, entityTypes, performanceProfiles: this.performance.size, evidence, revision: this.revision };
  }

  diagnosticsSnapshot(limit = 100) {
    const n = Math.max(0, Number(limit) || 0);
    return {
      summary: this.summary(),
      recentEntities: [...this.entities.values()].sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)).slice(0, n),
      performance: [...this.performance.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, n).map((p) => this.performanceFor(p.monster, p.fingerprint))
    };
  }

  serialize() {
    return JSON.stringify({
      schemaVersion: 2,
      revision: this.revision,
      entities: [...this.entities.entries()],
      performance: [...this.performance.entries()]
    });
  }

  restore(serialized) {
    const data = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
    if (!data || (data.schemaVersion !== 1 && data.schemaVersion !== 2)) throw new Error('unsupported world model schema');
    this.entities = new Map(data.entities || []);
    this.performance = new Map(data.performance || []);
    this.revision = Math.max(0, Number(data.revision) || 0);
    this._pruneEntities();
    this._prunePerformance();
    return this.summary();
  }
}

module.exports = { WorldModel, KnowledgeState, EvidenceKind };
