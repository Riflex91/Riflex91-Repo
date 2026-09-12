'use strict';

const PARTY_LIFECYCLE_SCHEMA_VERSION = 1;
const PARTY_LIFECYCLE_MODE = 'planning-controlled-default-off';
const PartyLifecycleState = Object.freeze({
  ACTIVE: 'ACTIVE',
  BENCH: 'BENCH',
  DEVELOPMENT: 'DEVELOPMENT',
  PROMOTION_CANDIDATE: 'PROMOTION_CANDIDATE'
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

class PartyLifecycleStore {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.storage = options.storage || null;
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.key = options.key || 'AIO_V3_PARTY_LIFECYCLE';
    this.capacity = Math.max(4, Math.min(64, Number(options.capacity) || 32));
    this.minCurrentSamples = Math.max(2, Math.min(100, Number(options.minCurrentSamples) || 8));
    this.minCurrentConfidence = Math.max(0.1, Math.min(1, finite(options.minCurrentConfidence, 0.55)));
    this.minPromotionSafety = Math.max(0.5, Math.min(1, finite(options.minPromotionSafety, 0.90)));
    this.minPromotionXpRatio = Math.max(0.5, Math.min(2, finite(options.minPromotionXpRatio, 0.85)));
    this.minPromotionGain = Math.max(0.01, Math.min(0.5, finite(options.minPromotionGain, 0.05)));
    this.minProjectedGain = Math.max(0.01, Math.min(0.5, finite(options.minProjectedGain, 0.04)));
    this.minTrainingSafety = Math.max(0.5, Math.min(1, finite(options.minTrainingSafety, 0.90)));
    this.minTrainingExpectedXpRatio = Math.max(0.5, Math.min(1.5, finite(options.minTrainingExpectedXpRatio, 0.75)));
    this.promotionWindowsRequired = Math.max(2, Math.min(20, Number(options.promotionWindowsRequired) || 3));
    this.maxDevelopmentSlots = 1;
    this.records = new Map();
    this.loaded = false;
    this.dirty = false;
    this.lastEvaluation = null;
    this.stats = { evaluations: 0, loads: 0, loadFailures: 0, saves: 0, saveFailures: 0, promotionsReady: 0, developmentSelections: 0, evicted: 0 };
  }

  _event(event, data = {}, severity = 'info', reason = null) {
    if (this.log && typeof this.log.emit === 'function') this.log.emit({ component: 'party-lifecycle', event, data, severity, reason });
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    const localStorage = this.root && this.root.localStorage;
    if (localStorage && typeof localStorage.getItem === 'function' && typeof localStorage.setItem === 'function') return { get: (key) => localStorage.getItem(key), set: (key, value) => localStorage.setItem(key, value) };
    return null;
  }

  _sanitize(row) {
    if (!row || typeof row !== 'object' || !row.name) return null;
    const state = Object.values(PartyLifecycleState).includes(row.state) ? row.state : PartyLifecycleState.BENCH;
    return {
      name: String(row.name),
      ctype: row.ctype ? String(row.ctype) : null,
      level: Math.max(0, finite(row.level)),
      state,
      active: row.active === true,
      currentScore: row.currentScore == null ? null : clamp01(row.currentScore),
      currentConfidence: clamp01(row.currentConfidence),
      currentSamples: Math.max(0, finite(row.currentSamples)),
      projectedScore: row.projectedScore == null ? null : clamp01(row.projectedScore),
      projectedProgress: row.projectedProgress == null ? null : clamp01(row.projectedProgress),
      trainingSafetyScore: row.trainingSafetyScore == null ? null : clamp01(row.trainingSafetyScore),
      survivalScore: row.survivalScore == null ? null : clamp01(row.survivalScore),
      xpPerHour: Math.max(0, finite(row.xpPerHour)),
      xpRatioToIncumbent: row.xpRatioToIncumbent == null ? null : Math.max(0, finite(row.xpRatioToIncumbent)),
      expectedTrainingXpRatio: row.expectedTrainingXpRatio == null ? null : Math.max(0, finite(row.expectedTrainingXpRatio)),
      gearReady: row.gearReady === true,
      contentSafe: row.contentSafe === true,
      promotionStreak: Math.max(0, Math.floor(finite(row.promotionStreak))),
      reasons: Array.isArray(row.reasons) ? row.reasons.map(String).slice(0, 24) : [],
      updatedAt: Math.max(0, finite(row.updatedAt)),
      firstSeenAt: Math.max(0, finite(row.firstSeenAt))
    };
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.key);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== PARTY_LIFECYCLE_SCHEMA_VERSION || !Array.isArray(data.records)) throw new Error('unsupported party lifecycle schema');
      for (const row of data.records.slice(-this.capacity)) {
        const clean = this._sanitize(row);
        if (clean) this.records.set(clean.name, clean);
      }
      this.stats.loads += 1;
      this._event('PARTY_LIFECYCLE_RESTORED', { records: this.records.size });
      return true;
    } catch (error) {
      this.records.clear();
      this.stats.loadFailures += 1;
      this._event('PARTY_LIFECYCLE_RESTORE_FAILED', { message: String(error && error.message || error) }, 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA');
      return false;
    }
  }

  _prune() {
    if (this.records.size <= this.capacity) return;
    const rows = [...this.records.values()].sort((a, b) => a.updatedAt - b.updatedAt);
    const count = this.records.size - this.capacity;
    for (let i = 0; i < count; i += 1) this.records.delete(rows[i].name);
    this.stats.evicted += count;
  }

  evaluate(input = {}) {
    const now = this.now();
    const characters = Array.isArray(input.characters) ? input.characters.filter((row) => row && row.name && row.ctype !== 'merchant') : [];
    const incumbentCurrentScore = input.incumbentCurrentScore == null ? null : clamp01(input.incumbentCurrentScore);
    const incumbentProjectedScore = input.incumbentProjectedScore == null ? null : clamp01(input.incumbentProjectedScore);
    const incumbentXpPerHour = Math.max(0, finite(input.incumbentXpPerHour));
    const highRisk = input.highRisk === true;
    const economyEmergency = input.economyEmergency === true;

    const next = [];
    for (const raw of characters) {
      const old = this.records.get(String(raw.name));
      const currentScore = raw.currentScore == null ? null : clamp01(raw.currentScore);
      const currentConfidence = clamp01(raw.currentConfidence);
      const currentSamples = Math.max(0, finite(raw.currentSamples));
      const projectedScore = raw.projectedScore == null ? null : clamp01(raw.projectedScore);
      const projectedProgress = raw.projectedProgress == null ? null : clamp01(raw.projectedProgress);
      const trainingSafetyScore = raw.trainingSafetyScore == null ? null : clamp01(raw.trainingSafetyScore);
      const survivalScore = raw.survivalScore == null ? null : clamp01(raw.survivalScore);
      const xpPerHour = Math.max(0, finite(raw.xpPerHour));
      const xpRatioToIncumbent = incumbentXpPerHour > 0 ? xpPerHour / incumbentXpPerHour : null;
      const expectedTrainingXpRatio = raw.expectedTrainingXpRatio == null ? null : Math.max(0, finite(raw.expectedTrainingXpRatio));
      const gearReady = raw.gearReady === true;
      const contentSafe = raw.contentSafe === true;
      const active = raw.active === true;
      const reasons = [];

      const measuredReady = currentScore != null && currentSamples >= this.minCurrentSamples && currentConfidence >= this.minCurrentConfidence;
      const promotionSuperior = measuredReady && incumbentCurrentScore != null && currentScore >= incumbentCurrentScore + this.minPromotionGain;
      const promotionSafe = survivalScore != null && survivalScore >= this.minPromotionSafety && contentSafe && !highRisk && !economyEmergency;
      const promotionProgress = xpRatioToIncumbent != null && xpRatioToIncumbent >= this.minPromotionXpRatio;
      const qualifiesPromotionWindow = !active && promotionSuperior && promotionSafe && promotionProgress && gearReady;
      const promotionStreak = qualifiesPromotionWindow ? Math.min(1000, (old && old.promotionStreak || 0) + 1) : 0;

      if (!measuredReady) reasons.push('CURRENT_EVIDENCE_NOT_READY');
      if (projectedScore != null && incumbentProjectedScore != null && projectedScore > incumbentProjectedScore) reasons.push('PROJECTED_SUPERIORITY_ONLY_PLANNING');
      if (trainingSafetyScore == null || trainingSafetyScore < this.minTrainingSafety) reasons.push('TRAINING_SAFETY_GATE');
      if (survivalScore == null || survivalScore < this.minPromotionSafety) reasons.push('PROMOTION_SURVIVAL_GATE');
      if (!gearReady) reasons.push('PROMOTION_GEAR_NOT_READY');
      if (!contentSafe) reasons.push('CONTENT_NOT_SAFE');
      if (highRisk) reasons.push('HIGH_RISK_CONTEXT');
      if (economyEmergency) reasons.push('ECONOMY_EMERGENCY');
      if (xpRatioToIncumbent == null || xpRatioToIncumbent < this.minPromotionXpRatio) reasons.push('PROMOTION_XP_RATIO_GATE');
      if (!promotionSuperior) reasons.push('CURRENT_SUPERIORITY_NOT_PROVEN');
      if (qualifiesPromotionWindow && promotionStreak < this.promotionWindowsRequired) reasons.push('PROMOTION_HYSTERESIS_BUILDING');

      next.push(this._sanitize({
        name: raw.name,
        ctype: raw.ctype,
        level: raw.level,
        state: active ? PartyLifecycleState.ACTIVE : (qualifiesPromotionWindow && promotionStreak >= this.promotionWindowsRequired ? PartyLifecycleState.PROMOTION_CANDIDATE : PartyLifecycleState.BENCH),
        active,
        currentScore,
        currentConfidence,
        currentSamples,
        projectedScore,
        projectedProgress,
        trainingSafetyScore,
        survivalScore,
        xpPerHour,
        xpRatioToIncumbent,
        expectedTrainingXpRatio,
        gearReady,
        contentSafe,
        promotionStreak,
        reasons,
        firstSeenAt: old && old.firstSeenAt || now,
        updatedAt: now
      }));
    }

    const development = next
      .filter((row) => !row.active && row.state !== PartyLifecycleState.PROMOTION_CANDIDATE)
      .filter((row) => row.projectedScore != null && incumbentProjectedScore != null && row.projectedScore >= incumbentProjectedScore + this.minProjectedGain)
      .filter((row) => row.trainingSafetyScore != null && row.trainingSafetyScore >= this.minTrainingSafety)
      .filter((row) => row.expectedTrainingXpRatio != null && row.expectedTrainingXpRatio >= this.minTrainingExpectedXpRatio)
      .filter((row) => row.contentSafe && !highRisk && !economyEmergency)
      .sort((a, b) => (b.projectedScore || 0) - (a.projectedScore || 0) || b.level - a.level || a.name.localeCompare(b.name))
      .slice(0, this.maxDevelopmentSlots);
    const developmentNames = new Set(development.map((row) => row.name));
    for (const row of next) {
      if (developmentNames.has(row.name)) {
        row.state = PartyLifecycleState.DEVELOPMENT;
        row.reasons = [...new Set(row.reasons.concat('BOUNDED_DEVELOPMENT_SLOT'))];
      }
      this.records.set(row.name, row);
    }

    this._prune();
    this.dirty = true;
    this.stats.evaluations += 1;
    this.stats.promotionsReady += next.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE).length;
    this.stats.developmentSelections += development.length;
    this.lastEvaluation = {
      at: now,
      highRisk,
      economyEmergency,
      incumbentCurrentScore,
      incumbentProjectedScore,
      incumbentXpPerHour,
      developmentSlotsUsed: development.length,
      promotionCandidates: next.filter((row) => row.state === PartyLifecycleState.PROMOTION_CANDIDATE).map((row) => row.name),
      development: development.map((row) => row.name)
    };
    this._event('PARTY_LIFECYCLE_EVALUATED', clone(this.lastEvaluation));
    return this.status();
  }

  get(name) { const row = this.records.get(String(name)); return row ? clone(row) : null; }
  list() { return [...this.records.values()].sort((a, b) => (a.state === PartyLifecycleState.ACTIVE ? -1 : 0) - (b.state === PartyLifecycleState.ACTIVE ? -1 : 0) || a.name.localeCompare(b.name)).map(clone); }

  save(options = {}) {
    if (!this.dirty && options.force !== true) return false;
    const backend = this._backend();
    if (!backend) return false;
    try {
      backend.set(this.key, JSON.stringify({ schemaVersion: PARTY_LIFECYCLE_SCHEMA_VERSION, savedAt: this.now(), records: [...this.records.values()] }));
      this.dirty = false;
      this.stats.saves += 1;
      return true;
    } catch (error) {
      this.stats.saveFailures += 1;
      this._event('PARTY_LIFECYCLE_SAVE_FAILED', { message: String(error && error.message || error) }, 'warn', 'PERSISTENCE_WRITE_ERROR');
      return false;
    }
  }

  status() {
    const rows = this.list();
    return {
      schemaVersion: PARTY_LIFECYCLE_SCHEMA_VERSION,
      mode: PARTY_LIFECYCLE_MODE,
      actionAuthority: false,
      directGameplayActionAccess: false,
      maxDevelopmentSlots: this.maxDevelopmentSlots,
      thresholds: {
        minCurrentSamples: this.minCurrentSamples,
        minCurrentConfidence: this.minCurrentConfidence,
        minPromotionSafety: this.minPromotionSafety,
        minPromotionXpRatio: this.minPromotionXpRatio,
        minPromotionGain: this.minPromotionGain,
        minProjectedGain: this.minProjectedGain,
        minTrainingSafety: this.minTrainingSafety,
        minTrainingExpectedXpRatio: this.minTrainingExpectedXpRatio,
        promotionWindowsRequired: this.promotionWindowsRequired
      },
      lastEvaluation: clone(this.lastEvaluation),
      counts: Object.fromEntries(Object.values(PartyLifecycleState).map((state) => [state, rows.filter((row) => row.state === state).length])),
      characters: rows,
      stats: { ...this.stats }
    };
  }
}

module.exports = { PartyLifecycleStore, PartyLifecycleState, PARTY_LIFECYCLE_SCHEMA_VERSION, PARTY_LIFECYCLE_MODE };
