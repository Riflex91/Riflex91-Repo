'use strict';

const PARTY_PERFORMANCE_SCHEMA_VERSION = 1;
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value, 0))); }
class PartyPerformanceStore {
  constructor(options = {}) {
    this.root = options.root || globalThis; this.storage = options.storage || null; this.log = options.log || null; this.now = options.now || (() => Date.now());
    this.key = options.key || 'AIO_V3_PARTY_PERFORMANCE'; this.capacity = Math.max(32, Math.min(4096, Number(options.capacity) || 512));
    this.halfLifeMs = Math.max(60 * 60 * 1000, Math.min(90 * 24 * 60 * 60 * 1000, Number(options.halfLifeMs) || 7 * 24 * 60 * 60 * 1000));
    this.minSaveMs = Math.max(5000, Math.min(10 * 60 * 1000, Number(options.minSaveMs) || 30000));
    this.records = new Map(); this.loaded = false; this.dirty = false; this.lastSavedAt = 0; this.stats = { samples: 0, loads: 0, loadFailures: 0, saves: 0, saveFailures: 0, evicted: 0 };
  }
  _event(event, data = {}, severity = 'info', reason = null) { if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-performance', event, severity, reason, data }); }
  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    return null;
  }
  _key(encounterKey, partyKey) { return `${encounterKey || 'unknown-encounter'}::${partyKey || 'unknown-party'}`; }
  _sanitize(record) {
    if (!record || typeof record !== 'object') return null; const encounterKey = String(record.encounterKey || ''); const partyKey = String(record.partyKey || ''); if (!encounterKey || !partyKey) return null;
    return { encounterKey, partyKey, samples: Math.max(0, finite(record.samples)), combatSeconds: Math.max(0, finite(record.combatSeconds)), xp: Math.max(0, finite(record.xp)), gold: finite(record.gold), damage: Math.max(0, finite(record.damage)), kills: Math.max(0, finite(record.kills)), deaths: Math.max(0, finite(record.deaths)), retreats: Math.max(0, finite(record.retreats)), nearDeaths: Math.max(0, finite(record.nearDeaths)), recoverySeconds: Math.max(0, finite(record.recoverySeconds)), hpPotions: Math.max(0, finite(record.hpPotions)), mpPotions: Math.max(0, finite(record.mpPotions)), merchantTrips: Math.max(0, finite(record.merchantTrips)), skillFailures: Math.max(0, finite(record.skillFailures)), movementFailures: Math.max(0, finite(record.movementFailures)), disconnects: Math.max(0, finite(record.disconnects)), safetyMarginSum: Math.max(0, finite(record.safetyMarginSum)), safetyMarginSamples: Math.max(0, finite(record.safetyMarginSamples)), scoreEwma: clamp01(record.scoreEwma), scoreVariance: Math.max(0, finite(record.scoreVariance)), updatedAt: Math.max(0, finite(record.updatedAt)), firstSeenAt: Math.max(0, finite(record.firstSeenAt)) };
  }
  load() {
    if (this.loaded) return false; this.loaded = true; const backend = this._backend(); if (!backend) return false;
    try { const raw = backend.get(this.key); if (!raw) return false; const data = typeof raw === 'string' ? JSON.parse(raw) : raw; if (!data || data.schemaVersion !== PARTY_PERFORMANCE_SCHEMA_VERSION || !Array.isArray(data.records)) throw new Error('unsupported party performance schema'); for (const row of data.records.slice(-this.capacity)) { const clean = this._sanitize(row); if (clean) this.records.set(this._key(clean.encounterKey, clean.partyKey), clean); } this.stats.loads += 1; this._event('PARTY_PERFORMANCE_RESTORED', { records: this.records.size }); return true; }
    catch (error) { this.records.clear(); this.stats.loadFailures += 1; this._event('PARTY_PERFORMANCE_RESTORE_FAILED', { message: String(error && error.message || error) }, 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA'); return false; }
  }
  _prune() { if (this.records.size <= this.capacity) return; const rows = [...this.records.entries()].sort((a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0)); const count = this.records.size - this.capacity; for (let i = 0; i < count; i += 1) this.records.delete(rows[i][0]); this.stats.evicted += count; }
  record(encounterKey, partyKey, sample = {}) {
    if (!encounterKey || !partyKey) return null; const key = this._key(encounterKey, partyKey); const now = this.now(); const current = this.records.get(key) || this._sanitize({ encounterKey, partyKey, firstSeenAt: now, updatedAt: now });
    const weight = Math.max(1, finite(sample.samples, 1)); const score = clamp01(sample.score == null ? current.scoreEwma : sample.score); const alpha = Math.max(0.02, Math.min(0.5, finite(sample.ewmaAlpha, 0.12))); const oldEwma = current.scoreEwma; const nextEwma = current.samples > 0 ? oldEwma * (1 - alpha) + score * alpha : score; const delta = score - oldEwma;
    current.scoreVariance = current.samples > 0 ? Math.max(0, current.scoreVariance * (1 - alpha) + delta * delta * alpha) : 0; current.scoreEwma = clamp01(nextEwma); current.samples += weight;
    current.combatSeconds += Math.max(0, finite(sample.combatSeconds || sample.seconds)); current.xp += Math.max(0, finite(sample.xp)); current.gold += finite(sample.gold); current.damage += Math.max(0, finite(sample.damage)); current.kills += Math.max(0, finite(sample.kills)); current.deaths += Math.max(0, finite(sample.deaths)); current.retreats += Math.max(0, finite(sample.retreats)); current.nearDeaths += Math.max(0, finite(sample.nearDeaths)); current.recoverySeconds += Math.max(0, finite(sample.recoverySeconds)); current.hpPotions += Math.max(0, finite(sample.hpPotions)); current.mpPotions += Math.max(0, finite(sample.mpPotions)); current.merchantTrips += Math.max(0, finite(sample.merchantTrips)); current.skillFailures += Math.max(0, finite(sample.skillFailures)); current.movementFailures += Math.max(0, finite(sample.movementFailures)); current.disconnects += Math.max(0, finite(sample.disconnects));
    if (sample.safetyMargin != null) { current.safetyMarginSum += clamp01(sample.safetyMargin); current.safetyMarginSamples += 1; } current.updatedAt = now; this.records.set(key, current); this.stats.samples += 1; this.dirty = true; this._prune(); this._event('PARTY_SAMPLE_COMPLETED', { encounterKey, partyKey, score: current.scoreEwma, samples: current.samples }); return this.profile(encounterKey, partyKey);
  }
  profile(encounterKey, partyKey) {
    const raw = this.records.get(this._key(encounterKey, partyKey)); if (!raw) return null; const hours = raw.combatSeconds / 3600; const ageMs = Math.max(0, this.now() - raw.updatedAt); const freshness = Math.pow(0.5, ageMs / this.halfLifeMs); const evidence = 1 - Math.exp(-Math.max(raw.combatSeconds / 900, raw.samples / 8)); const confidence = clamp01(evidence * freshness);
    return { ...raw, xpPerHour: hours > 0 ? raw.xp / hours : 0, goldPerHour: hours > 0 ? raw.gold / hours : 0, deathsPerHour: hours > 0 ? raw.deaths / hours : 0, retreatsPerHour: hours > 0 ? raw.retreats / hours : 0, recoverySecondsPerHour: hours > 0 ? raw.recoverySeconds / hours : 0, hpPotionsPerHour: hours > 0 ? raw.hpPotions / hours : 0, mpPotionsPerHour: hours > 0 ? raw.mpPotions / hours : 0, avgSafetyMargin: raw.safetyMarginSamples > 0 ? raw.safetyMarginSum / raw.safetyMarginSamples : null, freshness, confidence, uncertainty: 1 - confidence, ageMs };
  }
  save(options = {}) {
    if (!this.dirty && options.force !== true) return false; if (!options.force && this.now() - this.lastSavedAt < this.minSaveMs) return false; const backend = this._backend(); if (!backend) return false;
    try { const serialized = JSON.stringify({ schemaVersion: PARTY_PERFORMANCE_SCHEMA_VERSION, savedAt: this.now(), records: [...this.records.values()] }); backend.set(this.key, serialized); this.lastSavedAt = this.now(); this.dirty = false; this.stats.saves += 1; this._event('PARTY_PERFORMANCE_SAVED', { records: this.records.size, bytes: serialized.length }); return true; }
    catch (error) { this.stats.saveFailures += 1; this._event('PARTY_PERFORMANCE_SAVE_FAILED', { message: String(error && error.message || error) }, 'warn', 'PERSISTENCE_WRITE_ERROR'); return false; }
  }
  status(limit = 32) { const rows = [...this.records.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, Math.max(0, Math.min(128, Number(limit) || 32))); return { schemaVersion: PARTY_PERFORMANCE_SCHEMA_VERSION, capacity: this.capacity, size: this.records.size, halfLifeMs: this.halfLifeMs, loaded: this.loaded, dirty: this.dirty, stats: { ...this.stats }, recent: rows.map((row) => this.profile(row.encounterKey, row.partyKey)) }; }
}
module.exports = { PartyPerformanceStore, PARTY_PERFORMANCE_SCHEMA_VERSION };
