'use strict';

const { CombatMode } = require('./combat-modes');
const { SmartAoeState } = require('./smart-aoe-planner');
const { createPullLearningFingerprint } = require('../party/fingerprints');

const ADAPTIVE_PULL_LEARNING_MODE = 'bounded-adaptive-pull-learning-v1';
const ADAPTIVE_PULL_STATE_SCHEMA_VERSION = 1;
const DEFAULT_STORAGE_KEY = 'AIO_V3_ADAPTIVE_PULL_LEARNING_V1';

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}
function clone(value, fallback = null) {
  if (value == null) return fallback;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

class AdaptivePullLearner {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = options.root || runtime.root || globalThis;
    this.now = options.now || runtime.now || (() => Date.now());
    this.log = options.log || runtime.log || null;
    this.performance = options.performanceStore || runtime.partyPerformance || null;
    this.storage = options.storage || null;
    this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
    this.enabled = options.enabled !== false;
    this.config = {
      minSamples: Math.max(4, Math.min(100, finite(options.minSamples, 12))),
      minCombatSeconds: Math.max(20, Math.min(3600, finite(options.minCombatSeconds, 60))),
      minConfidence: clamp(finite(options.minConfidence, 0.45), 0.1, 0.95),
      minSafetyMargin: clamp(finite(options.minSafetyMargin, 0.40), 0.15, 0.9),
      maxDeathsPerHour: Math.max(0, finite(options.maxDeathsPerHour, 0.50)),
      maxRetreatsPerHour: Math.max(0, finite(options.maxRetreatsPerHour, 1.50)),
      maxNearDeathsPerHour: Math.max(0, finite(options.maxNearDeathsPerHour, 3.0)),
      minXpGainRatio: clamp(finite(options.minXpGainRatio, 0.05), 0, 0.5),
      strongSamples: Math.max(8, Math.min(200, finite(options.strongSamples, 24))),
      strongCombatSeconds: Math.max(60, Math.min(7200, finite(options.strongCombatSeconds, 180))),
      strongConfidence: clamp(finite(options.strongConfidence, 0.65), 0.2, 0.98),
      strongSafetyMargin: clamp(finite(options.strongSafetyMargin, 0.65), 0.3, 0.95),
      probeDurationMs: Math.max(5000, Math.min(120000, finite(options.probeDurationMs, 30000))),
      probeCooldownMs: Math.max(60000, Math.min(24 * 60 * 60 * 1000, finite(options.probeCooldownMs, 10 * 60 * 1000)))
    };
    this.state = new Map();
    this.seenEncounterIds = [];
    this.loaded = false;
    this.lastRecommendation = null;
    this.stats = {
      records: 0,
      recordSkips: 0,
      encounterRecords: 0,
      encounterRecordSkips: 0,
      encounterDuplicates: 0,
      encounterDedupePersistenceBlocks: 0,
      recommendations: 0,
      learnedSelections: 0,
      riskReductions: 0,
      probesStarted: 0,
      probeWindows: 0,
      probeCooldownBlocks: 0,
      persistenceLoads: 0,
      persistenceSaves: 0,
      persistenceFailures: 0
    };
    this.load();
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'adaptive-pull-learning', event, severity, reason, data }); } catch (_) {}
  }

  _backend() {
    if (this.storage && typeof this.storage.get === 'function' && typeof this.storage.set === 'function') return this.storage;
    if (this.root && typeof this.root.get === 'function' && typeof this.root.set === 'function') {
      return { get: (key) => this.root.get(key), set: (key, value) => this.root.set(key, value) };
    }
    const ls = this.root && this.root.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
      return { get: (key) => ls.getItem(key), set: (key, value) => ls.setItem(key, value) };
    }
    return null;
  }

  load() {
    if (this.loaded) return false;
    this.loaded = true;
    const backend = this._backend();
    if (!backend) return false;
    try {
      const raw = backend.get(this.storageKey);
      if (!raw) return false;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data || data.schemaVersion !== ADAPTIVE_PULL_STATE_SCHEMA_VERSION || !Array.isArray(data.contexts)) {
        throw new Error('unsupported adaptive pull state schema');
      }
      for (const row of data.contexts) {
        if (!row || !row.key) continue;
        this.state.set(String(row.key), {
          key: String(row.key),
          lastProbeAt: Math.max(0, finite(row.lastProbeAt, 0)),
          probeSize: row.probeSize == null ? null : Math.max(1, Math.floor(finite(row.probeSize, 1))),
          probeUntil: Math.max(0, finite(row.probeUntil, 0)),
          lastRecommendedSize: row.lastRecommendedSize == null ? null : Math.max(1, Math.floor(finite(row.lastRecommendedSize, 1))),
          updatedAt: Math.max(0, finite(row.updatedAt, 0))
        });
      }
      this.seenEncounterIds = Array.isArray(data.seenEncounterIds)
        ? [...new Set(data.seenEncounterIds.map(String).filter(Boolean))].slice(-256)
        : [];
      this.stats.persistenceLoads += 1;
      return true;
    } catch (error) {
      this.state.clear();
      this.seenEncounterIds = [];
      this.stats.persistenceFailures += 1;
      this._event('ADAPTIVE_PULL_STATE_RESTORE_FAILED', 'warn', 'CORRUPT_OR_UNSUPPORTED_DATA', { message: String(error && error.message || error) });
      return false;
    }
  }

  save() {
    const backend = this._backend();
    if (!backend) return false;
    try {
      backend.set(this.storageKey, JSON.stringify({
        schemaVersion: ADAPTIVE_PULL_STATE_SCHEMA_VERSION,
        savedAt: this.now(),
        contexts: [...this.state.values()],
        seenEncounterIds: this.seenEncounterIds.slice(-256)
      }));
      this.stats.persistenceSaves += 1;
      return true;
    } catch (error) {
      this.stats.persistenceFailures += 1;
      this._event('ADAPTIVE_PULL_STATE_SAVE_FAILED', 'warn', 'PERSISTENCE_WRITE_ERROR', { message: String(error && error.message || error) });
      return false;
    }
  }

  _context(snapshot, currentMembers, monster = null, encounterFingerprint = null) {
    const gameData = this.runtime.adapter && typeof this.runtime.adapter.getGameData === 'function'
      ? this.runtime.adapter.getGameData() || {}
      : {};
    const resolvedMonster = monster
      || encounterFingerprint && encounterFingerprint.monster && encounterFingerprint.monster.mtype
      || null;
    return createPullLearningFingerprint({
      snapshot,
      gameData,
      monster: resolvedMonster,
      currentMembers,
      contentDisposition: encounterFingerprint && encounterFingerprint.contentDisposition || null,
      event: encounterFingerprint && encounterFingerprint.event || null,
      partyLevelBand: encounterFingerprint && encounterFingerprint.partyLevelBand
    });
  }

  _pullKey(baseKey, size) {
    return `${String(baseKey)}::pull=${Math.max(1, Math.floor(finite(size, 1)))}`;
  }

  _contextState(baseKey, partyKey) {
    const key = `${baseKey}::${partyKey}`;
    if (!this.state.has(key)) this.state.set(key, {
      key,
      lastProbeAt: 0,
      probeSize: null,
      probeUntil: 0,
      lastRecommendedSize: null,
      updatedAt: this.now()
    });
    return this.state.get(key);
  }

  _profile(baseKey, partyKey, size) {
    if (!this.performance || typeof this.performance.profile !== 'function') return null;
    return this.performance.profile(this._pullKey(baseKey, size), partyKey);
  }

  _profileView(profile, size) {
    if (!profile) return null;
    const hours = Math.max(0, finite(profile.combatSeconds, 0)) / 3600;
    const nearDeathsPerHour = hours > 0 ? finite(profile.nearDeaths, 0) / hours : 0;
    const reliable = finite(profile.samples, 0) >= this.config.minSamples
      && finite(profile.combatSeconds, 0) >= this.config.minCombatSeconds
      && finite(profile.confidence, 0) >= this.config.minConfidence;
    const sustainable = reliable
      && finite(profile.deathsPerHour, 0) <= this.config.maxDeathsPerHour
      && finite(profile.retreatsPerHour, 0) <= this.config.maxRetreatsPerHour
      && nearDeathsPerHour <= this.config.maxNearDeathsPerHour
      && (profile.avgSafetyMargin == null || finite(profile.avgSafetyMargin, 0) >= this.config.minSafetyMargin);
    const strongSafe = sustainable
      && finite(profile.samples, 0) >= this.config.strongSamples
      && finite(profile.combatSeconds, 0) >= this.config.strongCombatSeconds
      && finite(profile.confidence, 0) >= this.config.strongConfidence
      && finite(profile.deaths, 0) <= 0
      && finite(profile.retreats, 0) <= 0
      && finite(profile.nearDeaths, 0) <= 0
      && (profile.avgSafetyMargin == null || finite(profile.avgSafetyMargin, 0) >= this.config.strongSafetyMargin);
    return {
      size,
      samples: finite(profile.samples, 0),
      combatSeconds: finite(profile.combatSeconds, 0),
      xpPerHour: Math.max(0, finite(profile.xpPerHour, 0)),
      deathsPerHour: Math.max(0, finite(profile.deathsPerHour, 0)),
      retreatsPerHour: Math.max(0, finite(profile.retreatsPerHour, 0)),
      nearDeathsPerHour,
      avgSafetyMargin: profile.avgSafetyMargin == null ? null : finite(profile.avgSafetyMargin, 0),
      confidence: clamp(finite(profile.confidence, 0), 0, 1),
      reliable,
      sustainable,
      strongSafe
    };
  }

  profiles(context = {}) {
    const hardCapacity = Math.max(1, Math.floor(finite(context.hardCapacity, 1)));
    const base = this._context(context.snapshot, context.currentMembers || [], context.monster, context.encounterFingerprint);
    const partyKey = context.partyKey || context.partyFingerprint && context.partyFingerprint.key || null;
    if (!base || !base.key || !partyKey) return { base, partyKey, rows: [] };
    const rows = [];
    for (let size = 1; size <= hardCapacity; size += 1) {
      const view = this._profileView(this._profile(base.key, partyKey, size), size);
      if (view) rows.push(view);
    }
    return { base, partyKey, rows };
  }

  recordTelemetryWindow(context = {}) {
    if (this.runtime.encounterLifecycle && this.runtime.encounterLifecycle.primaryOutcomeAttribution === true) {
      this.stats.recordSkips += 1;
      return null;
    }
    if (!this.enabled || !this.performance || typeof this.performance.record !== 'function') {
      this.stats.recordSkips += 1;
      return null;
    }
    const snapshot = context.snapshot;
    const tactical = this.runtime.tacticalPartyCombat;
    const encounter = tactical && tactical.encounter;
    const plan = encounter && encounter.aoe;
    if (!snapshot || !snapshot.character || !encounter || !plan) {
      this.stats.recordSkips += 1;
      return null;
    }
    const team = this.runtime.teamCombatCohesionHotfix && typeof this.runtime.teamCombatCohesionHotfix._team === 'function'
      ? this.runtime.teamCombatCohesionHotfix._team(snapshot)
      : null;
    if (!team || team.selfName !== team.leaderName) {
      this.stats.recordSkips += 1;
      return null;
    }
    if (![SmartAoeState.AOE_BURN, SmartAoeState.HOLD_PULL, SmartAoeState.ABORT_PULL].includes(plan.state)) {
      this.stats.recordSkips += 1;
      return null;
    }
    const contentDisposition = context.encounterFingerprint && context.encounterFingerprint.contentDisposition || null;
    if (contentDisposition === 'UNKNOWN' || contentDisposition === 'QUARANTINED') {
      this.stats.recordSkips += 1;
      return null;
    }
    const partyFingerprint = context.partyFingerprint;
    if (!partyFingerprint || !partyFingerprint.key) {
      this.stats.recordSkips += 1;
      return null;
    }
    const pullSize = Math.max(1, Math.floor(finite(plan.engagedCount, (encounter.targetIds || []).length || 1)));
    const base = this._context(snapshot, context.currentMembers || [], encounter.targetType, context.encounterFingerprint);
    if (!base || !base.key) {
      this.stats.recordSkips += 1;
      return null;
    }
    const aggregate = context.aggregate || {};
    const elapsedMs = Math.max(1000, finite(context.elapsedMs, 0));
    const hours = elapsedMs / 3600000;
    const safetyMargin = aggregate.minHpRatio == null ? 0.5 : clamp(finite(aggregate.minHpRatio, 0.5), 0, 1);
    const progressNorm = clamp(Math.log1p(Math.max(0, finite(aggregate.xpPerHour, 0))) / Math.log(6000001), 0, 1);
    const abortPenalty = plan.state === SmartAoeState.ABORT_PULL ? 0.25 : 0;
    const score = clamp(safetyMargin * 0.65 + progressNorm * 0.35 - Math.min(0.6, finite(aggregate.deathsPerHour, 0) * 0.35) - abortPenalty, 0, 1);
    const sample = {
      seconds: elapsedMs / 1000,
      xp: Math.max(0, finite(aggregate.xpPerHour, 0)) * hours,
      gold: finite(aggregate.goldPerHour, 0) * hours,
      kills: Math.max(0, finite(aggregate.killsPerHour, 0)) * hours,
      deaths: Math.max(0, finite(aggregate.deathsPerHour, 0)) * hours,
      hpPotions: Math.max(0, finite(aggregate.potionsPerHour, 0)) * hours,
      retreats: plan.state === SmartAoeState.ABORT_PULL ? 1 : (finite(aggregate.retreats, 0) > 0 ? 1 : 0),
      nearDeaths: safetyMargin < 0.25 ? 1 : 0,
      movementFailures: Math.max(0, finite(aggregate.movementCircuits, 0)),
      skillFailures: Math.max(0, finite(aggregate.skillFailureBackoffs, 0)),
      safetyMargin,
      score
    };
    const profile = this.performance.record(this._pullKey(base.key, pullSize), partyFingerprint.key, sample);
    this.stats.records += 1;
    this._event('ADAPTIVE_PULL_SAMPLE_RECORDED', 'info', plan.state, {
      context: base.key,
      party: partyFingerprint.key,
      pullSize,
      score,
      safetyMargin,
      xpPerHour: finite(aggregate.xpPerHour, 0),
      profile: profile ? { samples: profile.samples, confidence: profile.confidence, xpPerHour: profile.xpPerHour } : null
    });
    return { base, partyKey: partyFingerprint.key, pullSize, sample, profile };
  }

  recommend(context = {}) {
    this.stats.recommendations += 1;
    const deterministicDesired = Math.max(1, Math.floor(finite(context.deterministicDesiredSize, 1)));
    const hardCapacity = Math.max(1, Math.floor(finite(context.hardCapacity, deterministicDesired)));
    const mode = context.combatMode || CombatMode.SMART_AUTO;
    const fallback = {
      applied: false,
      reason: 'DETERMINISTIC_BASELINE',
      recommendedSize: Math.min(hardCapacity, deterministicDesired),
      deterministicDesiredSize: deterministicDesired,
      hardCapacity,
      profiles: []
    };
    if (!this.enabled || mode === CombatMode.SINGLE_TARGET || hardCapacity <= 1 || context.isLeader === false) {
      this.lastRecommendation = fallback;
      return clone(fallback, null);
    }

    const contentDisposition = context.encounterFingerprint && context.encounterFingerprint.contentDisposition || null;
    if (contentDisposition === 'UNKNOWN' || contentDisposition === 'QUARANTINED') {
      const result = { ...fallback, reason: 'CONTENT_NOT_VALIDATED_FOR_LEARNING' };
      this.lastRecommendation = result;
      return clone(result, null);
    }

    const data = this.profiles({
      snapshot: context.snapshot,
      currentMembers: context.currentMembers || [],
      monster: context.monster,
      encounterFingerprint: context.encounterFingerprint,
      partyFingerprint: context.partyFingerprint,
      partyKey: context.partyKey,
      hardCapacity
    });
    if (!data.base || !data.base.key || !data.partyKey) {
      const result = { ...fallback, reason: 'LEARNING_CONTEXT_UNAVAILABLE' };
      this.lastRecommendation = result;
      return clone(result, null);
    }

    const views = data.rows;
    const reliable = views.filter((row) => row.reliable);
    const sustainable = reliable.filter((row) => row.sustainable);
    const baselineRisk = reliable.find((row) => row.size === Math.min(hardCapacity, deterministicDesired) && !row.sustainable) || null;

    let recommendedSize = Math.min(hardCapacity, deterministicDesired);
    let reason = 'DETERMINISTIC_BASELINE';
    let applied = false;

    if (sustainable.length) {
      const ordered = sustainable.slice().sort((a, b) => a.size - b.size);
      let best = ordered[0];
      for (const candidate of ordered.slice(1)) {
        const required = best.xpPerHour * (1 + this.config.minXpGainRatio);
        if (candidate.xpPerHour >= required) best = candidate;
      }
      recommendedSize = Math.min(hardCapacity, best.size);
      reason = 'SUSTAINABLE_XP_OPTIMUM';
      applied = recommendedSize !== deterministicDesired;
      if (applied) this.stats.learnedSelections += 1;

      if (baselineRisk) {
        const safer = sustainable.filter((row) => row.size < deterministicDesired)
          .sort((a, b) => b.xpPerHour - a.xpPerHour || a.size - b.size)[0];
        recommendedSize = recommendedSize < deterministicDesired
          ? recommendedSize
          : (safer ? safer.size : Math.max(1, deterministicDesired - 1));
        reason = 'RISK_EVIDENCE_REDUCED_PULL';
        applied = true;
        this.stats.riskReductions += 1;
      }
    } else if (baselineRisk) {
      recommendedSize = Math.max(1, deterministicDesired - 1);
      reason = 'RISK_EVIDENCE_REDUCED_PULL';
      applied = true;
      this.stats.riskReductions += 1;
    }

    const state = this._contextState(data.base.key, data.partyKey);
    const now = this.now();
    const activeProbeProfile = state.probeSize == null ? null : views.find((row) => row.size === state.probeSize) || null;
    const probeRisk = activeProbeProfile && activeProbeProfile.reliable && !activeProbeProfile.sustainable;
    if (state.probeSize != null && (now > state.probeUntil || baselineRisk || probeRisk)) {
      const cancellationReason = baselineRisk || probeRisk ? 'RISK_EVIDENCE' : 'PROBE_WINDOW_EXPIRED';
      state.probeSize = null;
      state.probeUntil = 0;
      state.updatedAt = now;
      this.save();
      if (cancellationReason === 'RISK_EVIDENCE') {
        this._event('ADAPTIVE_PULL_PROBE_CANCELLED', 'warn', cancellationReason, {
          context: data.base.key,
          party: data.partyKey
        });
      }
    }

    const knownAtRecommended = views.find((row) => row.size === recommendedSize) || null;
    const nextSize = Math.min(hardCapacity, recommendedSize + 1);
    const nextProfile = views.find((row) => row.size === nextSize) || null;
    const canProbe = nextSize > recommendedSize
      && knownAtRecommended && knownAtRecommended.strongSafe
      && (!nextProfile || !nextProfile.reliable)
      && now - finite(state.lastProbeAt, 0) >= this.config.probeCooldownMs
      && !baselineRisk;

    if (state.probeSize != null && now <= state.probeUntil && state.probeSize <= hardCapacity) {
      recommendedSize = state.probeSize;
      reason = 'BOUNDED_EXPLORATION_WINDOW';
      applied = true;
      this.stats.probeWindows += 1;
    } else if (canProbe) {
      state.lastProbeAt = now;
      state.probeSize = nextSize;
      state.probeUntil = now + this.config.probeDurationMs;
      state.updatedAt = now;
      recommendedSize = nextSize;
      reason = 'BOUNDED_EXPLORATION_START';
      applied = true;
      this.stats.probesStarted += 1;
      this.save();
      this._event('ADAPTIVE_PULL_PROBE_STARTED', 'warn', 'STRONG_SAFE_EVIDENCE', {
        context: data.base.key,
        party: data.partyKey,
        from: nextSize - 1,
        to: nextSize,
        until: state.probeUntil
      });
    } else if (nextSize > recommendedSize && knownAtRecommended && knownAtRecommended.strongSafe
      && now - finite(state.lastProbeAt, 0) < this.config.probeCooldownMs) {
      this.stats.probeCooldownBlocks += 1;
    }

    recommendedSize = Math.max(1, Math.min(hardCapacity, Math.floor(recommendedSize)));
    state.lastRecommendedSize = recommendedSize;
    state.updatedAt = now;
    const result = {
      applied,
      reason,
      recommendedSize,
      deterministicDesiredSize: deterministicDesired,
      hardCapacity,
      contextKey: data.base.key,
      partyKey: data.partyKey,
      probe: state.probeSize == null ? null : { size: state.probeSize, until: state.probeUntil, lastProbeAt: state.lastProbeAt },
      profiles: views
    };
    this.lastRecommendation = result;
    return clone(result, null);
  }


  recordEncounterOutcome(outcome = {}) {
    if (!this.enabled || !this.performance || typeof this.performance.record !== 'function' || !outcome || outcome.learningEligible !== true) {
      this.stats.encounterRecordSkips += 1;
      return null;
    }
    const baseKey = outcome.pullContextFingerprint ? String(outcome.pullContextFingerprint) : null;
    const partyKey = outcome.partyFingerprint ? String(outcome.partyFingerprint) : null;
    if (!baseKey || !partyKey || !outcome.encounterId) {
      this.stats.encounterRecordSkips += 1;
      return null;
    }
    const encounterId = String(outcome.encounterId);
    if (this.seenEncounterIds.includes(encounterId)) {
      this.stats.encounterRecordSkips += 1;
      this.stats.encounterDuplicates += 1;
      return null;
    }
    this.seenEncounterIds.push(encounterId);
    if (this.seenEncounterIds.length > 256) this.seenEncounterIds.splice(0, this.seenEncounterIds.length - 256);
    const backend = this._backend();
    if (!backend || !this.save()) {
      this.seenEncounterIds = this.seenEncounterIds.filter((id) => id !== encounterId);
      this.stats.encounterRecordSkips += 1;
      this.stats.encounterDedupePersistenceBlocks += 1;
      this._event('ADAPTIVE_PULL_ENCOUNTER_BLOCKED', 'warn', backend ? 'EXACTLY_ONCE_DEDUPE_PERSISTENCE_FAILED' : 'EXACTLY_ONCE_DEDUPE_STORAGE_UNAVAILABLE', { encounterId });
      return null;
    }

    const pullSize = Math.max(1, Math.min(12, Math.floor(finite(outcome.maxEngaged, outcome.desiredPullSize || 1))));
    const seconds = Math.max(0.001, finite(outcome.durationSeconds, finite(outcome.durationMs, 0) / 1000));
    const sample = {
      seconds,
      xp: Math.max(0, finite(outcome.learningMetrics && outcome.learningMetrics.xp, finite(outcome.xp, 0))),
      gold: finite(outcome.learningMetrics && outcome.learningMetrics.gold, finite(outcome.gold, 0)),
      kills: Math.max(0, finite(outcome.learningMetrics && outcome.learningMetrics.kills, finite(outcome.kills, 0))),
      deaths: Math.max(0, finite(outcome.deaths, 0)),
      hpPotions: Math.max(0, finite(outcome.learningMetrics && outcome.learningMetrics.hpPotions, finite(outcome.hpPotions, finite(outcome.potions, 0)))),
      mpPotions: Math.max(0, finite(outcome.learningMetrics && outcome.learningMetrics.mpPotions, finite(outcome.mpPotions, 0))),
      retreats: Math.max(0, finite(outcome.retreats, 0)),
      nearDeaths: Math.max(0, finite(outcome.nearDeaths, 0)),
      movementFailures: Math.max(0, finite(outcome.movementFailures, 0)),
      skillFailures: Math.max(0, finite(outcome.skillFailures, 0)),
      safetyMargin: clamp(finite(outcome.safetyMargin, 0.5), 0, 1),
      score: clamp(finite(outcome.score, 0.5), 0, 1)
    };
    const profile = this.performance.record(this._pullKey(baseKey, pullSize), partyKey, sample);
    this.stats.records += 1;
    this.stats.encounterRecords += 1;
    this._event('ADAPTIVE_PULL_ENCOUNTER_RECORDED', 'info', outcome.outcome || null, {
      encounterId,
      context: baseKey,
      party: partyKey,
      pullSize,
      score: sample.score,
      safetyMargin: sample.safetyMargin,
      seconds,
      profile: profile ? { samples: profile.samples, confidence: profile.confidence, xpPerHour: profile.xpPerHour } : null
    });
    return { base: { key: baseKey }, partyKey, pullSize, sample, profile, encounterId };
  }

  status() {
    return {
      schemaVersion: 1,
      mode: ADAPTIVE_PULL_LEARNING_MODE,
      enabled: this.enabled,
      actionAuthority: false,
      directGameplayActionAccess: false,
      boundedRecommendationAuthority: true,
      hardSafetyOverrideAuthority: false,
      deterministicCapacityRemainsAuthoritative: true,
      config: { ...this.config },
      lastRecommendation: clone(this.lastRecommendation, null),
      contexts: this.state.size,
      seenEncounterIds: this.seenEncounterIds.length,
      stats: { ...this.stats }
    };
  }
}

function installAdaptivePullLearner(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.adaptivePullLearner) return runtime.adaptivePullLearner;
  const learner = new AdaptivePullLearner(runtime, options);
  runtime.adaptivePullLearner = learner;
  return learner;
}

module.exports = {
  AdaptivePullLearner,
  installAdaptivePullLearner,
  ADAPTIVE_PULL_LEARNING_MODE,
  ADAPTIVE_PULL_STATE_SCHEMA_VERSION
};
