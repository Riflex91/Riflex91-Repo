'use strict';

const { createPartyFingerprint, createPullLearningFingerprint } = require('../party/fingerprints');
const { SmartAoeState } = require('./smart-aoe-planner');

const ENCOUNTER_LIFECYCLE_MODE = 'leader-owned-encounter-outcome-v1';
const ENCOUNTER_OUTCOME_SCHEMA_VERSION = 1;
const EncounterLifecycleState = Object.freeze({
  CREATED: 'CREATED', BUILDING: 'BUILDING', ACTIVE: 'ACTIVE',
  FINISHING: 'FINISHING', RESOLVED: 'RESOLVED', ABORTED: 'ABORTED'
});
const EncounterOutcome = Object.freeze({
  SUCCESS: 'SUCCESS', SAFE_ABORT: 'SAFE_ABORT', DEATH: 'DEATH',
  INTERRUPTED: 'INTERRUPTED', CONTENT_DRIFT: 'CONTENT_DRIFT', PARTY_FAILURE: 'PARTY_FAILURE'
});

function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp(value, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, finite(value, lo))); }
function ratio(value, max) { const m = finite(max); return m > 0 ? clamp(finite(value) / m) : null; }
function clone(value, fallback = null) { try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; } }
function rounded(value, digits = 4) { const p = 10 ** digits; return Math.round(finite(value) * p) / p; }

class EncounterLifecycle {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.now = options.now || runtime.now || (() => Date.now());
    this.log = options.log || runtime.log || null;
    this.historyCapacity = Math.max(8, Math.min(256, Math.floor(finite(options.historyCapacity, 64))));
    this.primaryOutcomeAttribution = true;
    this.current = null;
    this.lastOutcome = null;
    this.history = [];
    this.sequence = 0;
    this.performanceCursors = new Map();
    this.peerState = new Map();
    this.lastSkillKey = null;
    this.lastObservedAt = 0;
    this.lastIncidentState = { retreat: false, movement: false, skillFailure: false, nearDeath: false };
    this.stats = { created: 0, observations: 0, finalized: 0, successful: 0, safeAborts: 0, deaths: 0, interrupted: 0, contentDrift: 0, partyFailures: 0, leaderSkips: 0, adaptiveRecords: 0, brainOutcomes: 0, cloudFeedback: 0 };
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    if (!this.log || typeof this.log.emit !== 'function') return;
    try { this.log.emit({ component: 'encounter-lifecycle', event, severity, reason, data }); } catch (_) {}
  }

  _isLeader(team, snapshot) {
    const c = snapshot && snapshot.character;
    return !!(c && String(c.ctype || '').toLowerCase() !== 'merchant' && team && team.selfName && team.leaderName && String(team.selfName) === String(team.leaderName));
  }

  _members(snapshot, team) {
    try {
      if (this.runtime && typeof this.runtime._currentMembers === 'function') {
        const rows = this.runtime._currentMembers(snapshot);
        if (Array.isArray(rows) && rows.length) return rows;
      }
    } catch (_) {}
    const rows = Array.isArray(team && team.members) ? team.members.slice() : [];
    const c = snapshot && snapshot.character;
    if (c && c.name && !rows.some((row) => row && String(row.name) === String(c.name))) rows.push(c);
    return rows;
  }

  _contentDisposition(mtype) {
    if (!mtype) return 'UNKNOWN';
    try {
      const fact = this.runtime.world && typeof this.runtime.world.fact === 'function'
        ? this.runtime.world.fact('monster-policy', String(mtype), 'contentSafetyDisposition')
        : null;
      return fact && fact.value ? String(fact.value) : 'UNKNOWN';
    } catch (_) { return 'UNKNOWN'; }
  }

  _combatMode(snapshot) {
    try {
      const c = snapshot && snapshot.character;
      if (c && this.runtime.characterCombatProfiles && typeof this.runtime.characterCombatProfiles.getCombatMode === 'function') {
        return this.runtime.characterCombatProfiles.getCombatMode(c.name);
      }
    } catch (_) {}
    return 'smart_auto';
  }

  _transition(state, plannerState = null, reason = null) {
    if (!this.current || !state) return;
    const rows = this.current.plannerStateTransitions;
    const last = rows[rows.length - 1];
    if (last && last.state === state && last.plannerState === plannerState) return;
    this.current.lifecycleState = state;
    rows.push({ at: this.now(), state, plannerState: plannerState || null, reason: reason || null });
    if (rows.length > 32) rows.splice(0, rows.length - 32);
  }

  _performanceRows() {
    try {
      const status = this.runtime.performance && typeof this.runtime.performance.status === 'function' ? this.runtime.performance.status() : null;
      const rows = [];
      for (const row of status && Array.isArray(status.recent) ? status.recent : []) if (row && row.id) rows.push(row);
      if (status && status.current && status.current.id) rows.push(status.current);
      return rows;
    } catch (_) { return []; }
  }

  _capturePerformance() {
    if (!this.current) return;
    const keys = ['xp', 'gold', 'kills', 'deaths', 'potions', 'damageTaken', 'monsterHpLost'];
    for (const row of this._performanceRows()) {
      if (!row || !row.id || finite(row.startedAt) < this.current.startedAt - 1000) continue;
      const previous = this.performanceCursors.get(String(row.id)) || {};
      for (const key of keys) {
        const value = finite(row[key]);
        const before = finite(previous[key]);
        const delta = key === 'gold' ? value - before : Math.max(0, value - before);
        if (delta) this.current.metrics[key] += delta;
      }
      this.performanceCursors.set(String(row.id), Object.fromEntries(keys.map((key) => [key, finite(row[key])])));
    }
  }

  _partyRatios(snapshot, team) {
    const members = this._members(snapshot, team);
    let minHp = null; let minMp = null;
    for (const row of members) {
      const stats = row && row.stats && typeof row.stats === 'object' ? row.stats : row;
      if (!stats) continue;
      const hp = ratio(stats.hp, stats.max_hp); const mp = ratio(stats.mp, stats.max_mp);
      if (hp != null) minHp = minHp == null ? hp : Math.min(minHp, hp);
      if (mp != null) minMp = minMp == null ? mp : Math.min(minMp, mp);
    }
    return { members, minHp, minMp };
  }

  _peerAggregate(team) {
    try {
      if (!this.runtime.partyTelemetry || typeof this.runtime.partyTelemetry.aggregate !== 'function') return null;
      const self = team && team.selfName ? String(team.selfName) : null;
      const names = (team && team.names || []).map(String).filter((name) => name && name !== self);
      return this.runtime.partyTelemetry.aggregate(names);
    } catch (_) { return null; }
  }

  _capturePeerProgress(team, now) {
    if (!this.current) return;
    const aggregate = this._peerAggregate(team);
    const elapsedHours = Math.max(0, Math.min(30, (now - (this.lastObservedAt || now)) / 1000)) / 3600;
    if (aggregate && elapsedHours > 0) {
      this.current.metrics.xp += Math.max(0, finite(aggregate.xpPerHour)) * elapsedHours;
      this.current.metrics.gold += finite(aggregate.goldPerHour) * elapsedHours;
      this.current.metrics.kills += Math.max(0, finite(aggregate.killsPerHour)) * elapsedHours;
      this.current.metrics.potions += Math.max(0, finite(aggregate.potionsPerHour)) * elapsedHours;
      this.current.observability.maxFreshPeerReports = Math.max(this.current.observability.maxFreshPeerReports, finite(aggregate.freshReports));
    }
    for (const report of aggregate && aggregate.reports || []) {
      if (!report || !report.name) continue;
      const before = this.peerState.get(String(report.name)) || { rip: false };
      if (!before.rip && report.rip === true) this.current.metrics.deaths += 1;
      this.peerState.set(String(report.name), { rip: report.rip === true, at: finite(report.at, now) });
    }
  }

  _captureSkillUse() {
    if (!this.current) return;
    const use = this.runtime.partySkillEngine && this.runtime.partySkillEngine.lastUse;
    if (!use || use.executed !== true || finite(use.at) < this.current.startedAt) return;
    const key = [finite(use.at), use.skill || '', use.targetId || '', use.targetCount || ''].join(':');
    if (key === this.lastSkillKey) return;
    this.lastSkillKey = key;
    this.current.metrics.skillExecutions += 1;
    if (use.kind === 'aoe' || use.kind === 'aoe-control') this.current.metrics.aoeSkillExecutions += 1;
    const skill = String(use.skill || 'unknown').slice(0, 64);
    this.current.metrics.skills[skill] = (this.current.metrics.skills[skill] || 0) + 1;
  }

  _captureIncidents(team, minHp) {
    if (!this.current) return;
    let localMovement = false; let localSkillFailure = false;
    try {
      const movement = this.runtime.adapter && typeof this.runtime.adapter.stabilityStatus === 'function' ? this.runtime.adapter.stabilityStatus().movement : null;
      localMovement = !!(movement && movement.circuitOpen);
    } catch (_) {}
    try {
      const farmer = this.runtime && typeof this.runtime.farmerStatus === 'function' ? this.runtime.farmerStatus() : null;
      localSkillFailure = !!(farmer && farmer.skillUsage && Array.isArray(farmer.skillUsage.activeFailureBackoffs) && farmer.skillUsage.activeFailureBackoffs.length);
    } catch (_) {}
    const aggregate = this._peerAggregate(team);
    const next = {
      retreat: !!this.runtime.pendingEmergencyRetreat || !!(aggregate && finite(aggregate.retreats) > 0),
      movement: localMovement || !!(aggregate && finite(aggregate.movementCircuits) > 0),
      skillFailure: localSkillFailure || !!(aggregate && finite(aggregate.skillFailureBackoffs) > 0),
      nearDeath: minHp != null && minHp < 0.25
    };
    if (next.retreat && !this.lastIncidentState.retreat) this.current.metrics.retreats += 1;
    if (next.movement && !this.lastIncidentState.movement) this.current.metrics.movementFailures += 1;
    if (next.skillFailure && !this.lastIncidentState.skillFailure) this.current.metrics.skillFailures += 1;
    if (next.nearDeath && !this.lastIncidentState.nearDeath) this.current.metrics.nearDeaths += 1;
    this.lastIncidentState = next;
  }

  begin(context = {}) {
    const snapshot = context.snapshot || this.runtime.lastSnapshot;
    const team = context.team; const tactical = context.tacticalEncounter;
    if (!snapshot || !snapshot.character || !tactical || !this._isLeader(team, snapshot)) { this.stats.leaderSkips += 1; return null; }
    if (this.current) this.finish({ snapshot, team, tacticalEncounter: context.previousEncounter || tactical, reason: 'ENCOUNTER_REPLACED', outcome: EncounterOutcome.INTERRUPTED });
    const members = this._members(snapshot, team);
    const party = createPartyFingerprint(members);
    const disposition = this._contentDisposition(tactical.targetType);
    const gameData = this.runtime.adapter && typeof this.runtime.adapter.getGameData === 'function' ? this.runtime.adapter.getGameData() || {} : {};
    const pull = createPullLearningFingerprint({ snapshot, gameData, monster: tactical.targetType, currentMembers: members, contentDisposition: disposition });
    const now = this.now();
    const id = `encounter-${now.toString(36)}-${(++this.sequence).toString(36)}`;
    const initial = this._partyRatios(snapshot, team);
    this.current = {
      schemaVersion: ENCOUNTER_OUTCOME_SCHEMA_VERSION, encounterId: id, lifecycleState: EncounterLifecycleState.CREATED,
      leaderName: String(team.leaderName), character: String(snapshot.character.name), partyFingerprint: party.key,
      pullContextFingerprint: pull.key, contentDisposition: disposition, monster: tactical.targetType || null,
      map: snapshot.character.map || null, combatMode: this._combatMode(snapshot), startedAt: now, updatedAt: now,
      selectedReason: tactical.reason || context.reason || null, hardCapacity: 1, desiredPullSize: 1,
      maxEngaged: Math.max(1, (tactical.targetIds || []).length || 1), adaptiveRecommendation: null, adaptiveConfidence: 0,
      metrics: { xp: 0, gold: 0, kills: 0, deaths: 0, retreats: 0, nearDeaths: 0, hpPotions: 0, mpPotions: 0, potions: 0, damageTaken: 0, monsterHpLost: 0, skillExecutions: 0, aoeSkillExecutions: 0, movementFailures: 0, skillFailures: 0, minHpRatio: initial.minHp, minMpRatio: initial.minMp, skills: {} },
      plannerStateTransitions: [{ at: now, state: EncounterLifecycleState.CREATED, plannerState: null, reason: 'ENCOUNTER_SELECTED' }],
      observability: { expectedPeerReports: Math.max(0, (team.names || []).length - 1), maxFreshPeerReports: 0 }
    };
    tactical.encounterId = id; tactical.lifecycleState = EncounterLifecycleState.CREATED;
    this.performanceCursors.clear(); this.peerState.clear(); this.lastSkillKey = null; this.lastObservedAt = now;
    this.lastIncidentState = { retreat: false, movement: false, skillFailure: false, nearDeath: false };
    this.stats.created += 1;
    this._event('ENCOUNTER_CREATED', 'info', tactical.reason || null, { encounterId: id, monster: this.current.monster, partyFingerprint: party.key, pullContextFingerprint: pull.key });
    this.observe({ snapshot, team, tacticalEncounter: tactical, reason: 'BEGIN' });
    return clone(this.current);
  }

  observe(context = {}) {
    if (!this.current) return null;
    const snapshot = context.snapshot || this.runtime.lastSnapshot; const team = context.team; const tactical = context.tacticalEncounter;
    if (!snapshot || !snapshot.character || !tactical || !this._isLeader(team, snapshot)) return null;
    if (tactical.encounterId && tactical.encounterId !== this.current.encounterId) return null;
    const now = this.now();
    const latestDisposition = this._contentDisposition(this.current.monster);
    if (latestDisposition === 'UNKNOWN' || latestDisposition === 'QUARANTINED' || this.current.contentDisposition === 'UNKNOWN') this.current.contentDisposition = latestDisposition;
    this._capturePerformance(); this._capturePeerProgress(team, now);
    const ratios = this._partyRatios(snapshot, team);
    if (ratios.minHp != null) this.current.metrics.minHpRatio = this.current.metrics.minHpRatio == null ? ratios.minHp : Math.min(this.current.metrics.minHpRatio, ratios.minHp);
    if (ratios.minMp != null) this.current.metrics.minMpRatio = this.current.metrics.minMpRatio == null ? ratios.minMp : Math.min(this.current.metrics.minMpRatio, ratios.minMp);
    this._captureSkillUse(); this._captureIncidents(team, ratios.minHp);

    const aoe = tactical.aoe || {};
    this.current.hardCapacity = Math.max(1, Math.floor(finite(aoe.pullCapacity, this.current.hardCapacity)));
    this.current.desiredPullSize = Math.max(1, Math.min(this.current.hardCapacity, Math.floor(finite(aoe.desiredPullSize, this.current.desiredPullSize))));
    this.current.maxEngaged = Math.max(this.current.maxEngaged, Math.floor(finite(aoe.engagedCount, (tactical.targetIds || []).length || 1)));
    const adaptive = aoe.adaptivePull && typeof aoe.adaptivePull === 'object' ? aoe.adaptivePull : null;
    if (adaptive) {
      this.current.adaptiveRecommendation = adaptive.reason || null;
      const profile = Array.isArray(adaptive.profiles) ? adaptive.profiles.find((row) => Number(row && row.size) === Number(adaptive.recommendedSize)) : null;
      this.current.adaptiveConfidence = Math.max(this.current.adaptiveConfidence, clamp(profile && profile.confidence));
    }
    let state = this.current.lifecycleState;
    if (aoe.state === SmartAoeState.BUILD_PULL) state = EncounterLifecycleState.BUILDING;
    else if (aoe.state === SmartAoeState.HOLD_PULL || aoe.state === SmartAoeState.AOE_BURN) state = EncounterLifecycleState.ACTIVE;
    else if (aoe.state === SmartAoeState.FINISH) state = EncounterLifecycleState.FINISHING;
    else if (aoe.state === SmartAoeState.ABORT_PULL) state = EncounterLifecycleState.ABORTED;
    this._transition(state, aoe.state || null, context.reason || null);
    tactical.lifecycleState = state;
    this.current.updatedAt = now;
    this.lastObservedAt = now;
    this.stats.observations += 1;
    return clone(this.current);
  }

  _liveTrackedTargets(snapshot, tactical) {
    const ids = new Set((tactical && tactical.targetIds || []).map(String));
    if (tactical && tactical.targetId != null) ids.add(String(tactical.targetId));
    return (snapshot && snapshot.entities || []).filter((row) => row && ids.has(String(row.id)) && !row.dead && finite(row.hp, 1) > 0);
  }

  _inferOutcome(snapshot, team, tactical) {
    if (snapshot && snapshot.character && snapshot.character.rip) return EncounterOutcome.DEATH;
    if (this.current.contentDisposition === 'UNKNOWN' || this.current.contentDisposition === 'QUARANTINED') return EncounterOutcome.CONTENT_DRIFT;
    if (tactical && tactical.aoe && tactical.aoe.state === SmartAoeState.ABORT_PULL) return EncounterOutcome.SAFE_ABORT;
    if (this.runtime.pendingEmergencyRetreat) return EncounterOutcome.SAFE_ABORT;
    if (team && (team.complete === false || team.cohesive === false || team.healthReady === false)) return EncounterOutcome.PARTY_FAILURE;
    return this._liveTrackedTargets(snapshot, tactical).length ? EncounterOutcome.INTERRUPTED : EncounterOutcome.SUCCESS;
  }

  _score(outcome, seconds) {
    const safety = this.current.metrics.minHpRatio == null ? 0.5 : clamp(this.current.metrics.minHpRatio);
    const xpPerHour = seconds > 0 ? Math.max(0, finite(this.current.metrics.xp)) / (seconds / 3600) : 0;
    const progress = clamp(Math.log1p(xpPerHour) / Math.log(6000001));
    const penalty = outcome === EncounterOutcome.DEATH ? 0.75 : outcome === EncounterOutcome.PARTY_FAILURE ? 0.45 : outcome === EncounterOutcome.SAFE_ABORT ? 0.18 : outcome === EncounterOutcome.INTERRUPTED ? 0.12 : 0;
    return clamp(safety * 0.65 + progress * 0.35 - penalty);
  }

  finish(context = {}) {
    if (!this.current) return null;
    const snapshot = context.snapshot || this.runtime.lastSnapshot; const team = context.team; const tactical = context.tacticalEncounter || {};
    if (!snapshot || !snapshot.character || !this._isLeader(team, snapshot)) { this.stats.leaderSkips += 1; return null; }
    this.observe({ snapshot, team, tacticalEncounter: tactical, reason: context.reason || 'FINAL_OBSERVATION' });
    const outcome = Object.values(EncounterOutcome).includes(context.outcome) ? context.outcome : this._inferOutcome(snapshot, team, tactical);
    const now = this.now(); const durationMs = Math.max(0, now - this.current.startedAt); const seconds = durationMs / 1000;
    if (outcome === EncounterOutcome.DEATH) this.current.metrics.deaths = Math.max(1, this.current.metrics.deaths);
    if (outcome === EncounterOutcome.SAFE_ABORT) this.current.metrics.retreats = Math.max(1, this.current.metrics.retreats);
    if (outcome === EncounterOutcome.SUCCESS) this.current.metrics.kills = Math.max(this.current.metrics.kills, this.current.maxEngaged);
    this._transition(outcome === EncounterOutcome.SUCCESS ? EncounterLifecycleState.RESOLVED : EncounterLifecycleState.ABORTED, tactical && tactical.aoe && tactical.aoe.state || null, context.reason || outcome);
    const final = {
      schemaVersion: ENCOUNTER_OUTCOME_SCHEMA_VERSION, mode: ENCOUNTER_LIFECYCLE_MODE,
      encounterId: this.current.encounterId, lifecycleState: this.current.lifecycleState, outcome, reason: context.reason || outcome,
      leaderName: this.current.leaderName, partyFingerprint: this.current.partyFingerprint, pullContextFingerprint: this.current.pullContextFingerprint,
      contentDisposition: this.current.contentDisposition, monster: this.current.monster, map: this.current.map, combatMode: this.current.combatMode,
      hardCapacity: this.current.hardCapacity, desiredPullSize: this.current.desiredPullSize, maxEngaged: this.current.maxEngaged,
      startedAt: this.current.startedAt, endedAt: now, durationMs, durationSeconds: rounded(seconds, 3),
      xp: rounded(this.current.metrics.xp, 3), gold: rounded(this.current.metrics.gold, 3), kills: rounded(this.current.metrics.kills, 3),
      deaths: rounded(this.current.metrics.deaths, 3), retreats: this.current.metrics.retreats, nearDeaths: this.current.metrics.nearDeaths,
      minHpRatio: this.current.metrics.minHpRatio == null ? null : rounded(this.current.metrics.minHpRatio),
      minMpRatio: this.current.metrics.minMpRatio == null ? null : rounded(this.current.metrics.minMpRatio),
      hpPotions: rounded(this.current.metrics.potions, 3), mpPotions: 0, potions: rounded(this.current.metrics.potions, 3), potionAttribution: 'COMBINED_TELEMETRY',
      damageTaken: rounded(this.current.metrics.damageTaken, 3), skillExecutions: this.current.metrics.skillExecutions,
      aoeSkillExecutions: this.current.metrics.aoeSkillExecutions, skills: { ...this.current.metrics.skills },
      movementFailures: this.current.metrics.movementFailures, skillFailures: this.current.metrics.skillFailures,
      safetyMargin: this.current.metrics.minHpRatio == null ? 0.5 : rounded(this.current.metrics.minHpRatio),
      adaptiveRecommendation: this.current.adaptiveRecommendation, adaptiveConfidence: rounded(this.current.adaptiveConfidence),
      plannerStateTransitions: clone(this.current.plannerStateTransitions, []), score: rounded(this._score(outcome, seconds)),
      learningEligible: !['UNKNOWN', 'QUARANTINED'].includes(this.current.contentDisposition) && ![EncounterOutcome.INTERRUPTED, EncounterOutcome.CONTENT_DRIFT].includes(outcome),
      observability: { ...this.current.observability }
    };
    this.lastOutcome = final; this.runtime.lastEncounterOutcome = clone(final); this.history.push(clone(final));
    if (this.history.length > this.historyCapacity) this.history.splice(0, this.history.length - this.historyCapacity);
    this.current = null; this.performanceCursors.clear(); this.peerState.clear(); this.lastObservedAt = now;
    this.stats.finalized += 1;
    if (outcome === EncounterOutcome.SUCCESS) this.stats.successful += 1;
    else if (outcome === EncounterOutcome.SAFE_ABORT) this.stats.safeAborts += 1;
    else if (outcome === EncounterOutcome.DEATH) this.stats.deaths += 1;
    else if (outcome === EncounterOutcome.INTERRUPTED) this.stats.interrupted += 1;
    else if (outcome === EncounterOutcome.CONTENT_DRIFT) this.stats.contentDrift += 1;
    else if (outcome === EncounterOutcome.PARTY_FAILURE) this.stats.partyFailures += 1;

    let adaptiveRecord = null; let brainOutcome = null;
    try {
      if (this.runtime.adaptivePullLearner && typeof this.runtime.adaptivePullLearner.recordEncounterOutcome === 'function') {
        adaptiveRecord = this.runtime.adaptivePullLearner.recordEncounterOutcome(final);
        if (adaptiveRecord) this.stats.adaptiveRecords += 1;
      }
      if (this.runtime.partyPerformance && typeof this.runtime.partyPerformance.save === 'function') this.runtime.partyPerformance.save();
    } catch (_) {}
    try {
      const brain = this.runtime.strategicBrainV2 || this.runtime.brain;
      if (brain && typeof brain.ingestEncounterOutcome === 'function') {
        brainOutcome = brain.ingestEncounterOutcome(final, { remote: false });
        if (brainOutcome && brainOutcome.accepted === true) {
          this.stats.brainOutcomes += 1;
          const cloud = this.runtime.cloudControlPlane;
          if (cloud && Array.isArray(cloud.pendingFeedback)) { cloud.pendingFeedback.push(brainOutcome); this.stats.cloudFeedback += 1; }
        }
      }
    } catch (_) {}
    this._event('ENCOUNTER_OUTCOME_FINALIZED', outcome === EncounterOutcome.DEATH ? 'warn' : 'info', final.reason, {
      encounterId: final.encounterId, outcome: final.outcome, durationSeconds: final.durationSeconds, monster: final.monster,
      maxEngaged: final.maxEngaged, xp: final.xp, gold: final.gold, deaths: final.deaths, retreats: final.retreats,
      nearDeaths: final.nearDeaths, safetyMargin: final.safetyMargin, score: final.score,
      adaptiveRecorded: !!adaptiveRecord, brainAccepted: !!(brainOutcome && brainOutcome.accepted)
    });
    return clone(final);
  }

  status() {
    return { schemaVersion: ENCOUNTER_OUTCOME_SCHEMA_VERSION, mode: ENCOUNTER_LIFECYCLE_MODE, primaryOutcomeAttribution: true, leaderFinalizesOnly: true, current: clone(this.current), lastOutcome: clone(this.lastOutcome), recent: this.history.slice(-12).map((row) => clone(row)), stats: { ...this.stats } };
  }
}

function installEncounterLifecycle(runtime, options = {}) {
  if (!runtime) throw new Error('runtime required');
  if (runtime.encounterLifecycle) return runtime.encounterLifecycle;
  const lifecycle = new EncounterLifecycle(runtime, options);
  runtime.encounterLifecycle = lifecycle;
  return lifecycle;
}

module.exports = { EncounterLifecycle, installEncounterLifecycle, ENCOUNTER_LIFECYCLE_MODE, ENCOUNTER_OUTCOME_SCHEMA_VERSION, EncounterLifecycleState, EncounterOutcome };
