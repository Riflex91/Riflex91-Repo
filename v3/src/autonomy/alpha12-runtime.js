'use strict';

const { Alpha11Runtime } = require('./alpha11-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { createPartyFingerprint, createEncounterFingerprint, dominantMonster } = require('../party/fingerprints');
const { PartyPerformanceStore } = require('../party/performance-store');
const { PartyOrchestrator } = require('../party/orchestrator');
const { PaladinAuraPolicy } = require('../party/paladin-aura-policy');
const { PartyTelemetryBridge } = require('../party/telemetry-bridge');
const { PartyTransitionController } = require('../party/transition-controller');
const { BackgroundExecutionGuard } = require('../ops/background-execution-guard');
function finite(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }
function composeAlpha12Runtime(options = {}) {
this.log.version = RELEASE_VERSION; this.partyDecisionMs = Math.max(2000, Math.min(60000, Number(options.partyDecisionMs) || 5000)); this.lastPartyDecisionAt = -Infinity; this.lastPerformanceSampleAt = null; this.currentPartyFingerprint = null; this.currentEncounterFingerprint = null; this.lastPartyDecision = null; this.lastAuraRecommendation = null; this.lastAuraExecution = null; this.auraAutomationEnabled = options.partyAuraAutomationEnabled === true;
    this.partyPerformance = options.partyPerformance || new PartyPerformanceStore({ root: this.root, storage: options.partyPerformanceStorage || options.storage, log: this.log, now: this.now, capacity: options.partyPerformanceCapacity, halfLifeMs: options.partyPerformanceHalfLifeMs, minSaveMs: options.partyPerformanceSaveMs }); this.partyPerformance.load();
    this.partyOrchestrator = options.partyOrchestrator || new PartyOrchestrator({ now: this.now, log: this.log, weights: options.partyScoreWeights, minScoreGain: options.partyMinScoreGain, minSwitchIntervalMs: options.partyMinSwitchIntervalMs, minRecommendedConfidence: options.partyMinRecommendedConfidence, maxCandidates: options.partyMaxCandidates, explorationEnabled: options.partyExplorationEnabled === true }); this.auraPolicy = options.auraPolicy || new PaladinAuraPolicy({ now: this.now, minHoldMs: options.partyAuraMinHoldMs });
    const roster = this.characterRegistry.status().characters || []; const configuredMerchant = options.partyMerchantName || roster.find((row) => row.ctype === 'merchant')?.name || null;
    this.partyTelemetry = options.partyTelemetry || new PartyTelemetryBridge({ root: this.root, adapter: this.adapter, now: this.now, log: this.log, merchantName: configuredMerchant, trustedNames: roster.map((row) => row.name), sendIntervalMs: options.partyTelemetrySendMs, reportTtlMs: options.partyTelemetryTtlMs, capacity: options.partyTelemetryCapacity }); this.partyTelemetry.installReceiver();
    this.partyTransitions = options.partyTransitions || new PartyTransitionController({ root: this.root, adapter: this.adapter, now: this.now, log: this.log, liveEnabled: options.partyTransitionsEnabled === true, merchantName: configuredMerchant, codeSlots: options.partyCodeSlots, stepTimeoutMs: options.partyTransitionStepTimeoutMs, transitionLeaseMs: options.partyTransitionLeaseMs, pollMs: options.partyTransitionPollMs });
    this.backgroundExecution = options.backgroundExecution || new BackgroundExecutionGuard({ root: this.root, now: this.now, log: this.log, expectedTickMs: this.tickMs, driftThresholdMs: options.backgroundDriftThresholdMs, rearmCooldownMs: options.backgroundRearmCooldownMs, enabled: options.backgroundExecutionGuardEnabled !== false });
}

class Alpha12Runtime extends Alpha11Runtime {
  constructor(options = {}) {
    super(options);
    composeAlpha12Runtime.call(this, options);
  }
  start() { const started = super.start(); this.backgroundExecution.start(); return started; }
  stop() { if (this.adaptivePullLearner && typeof this.adaptivePullLearner.save === 'function') this.adaptivePullLearner.save(); this.partyPerformance.save({ force: true }); return super.stop(); }
  _contentDisposition(mtype) { if (!mtype || !this.world || typeof this.world.fact !== 'function') return 'UNKNOWN'; const fact = this.world.fact('monster-policy', mtype, 'contentSafetyDisposition'); return fact && fact.value || 'UNKNOWN'; }
  _currentMembers(snapshot) {
    if (!snapshot || !snapshot.character) return []; const names = new Set([snapshot.character.name]); for (const member of snapshot.party || []) if (member && member.name) names.add(member.name); const status = this.characterRegistry.status(); const byName = new Map(status.characters.map((row) => [row.name, row])); const result = [];
    for (const name of names) { const row = byName.get(name); if (row) result.push(row); else if (name === snapshot.character.name) result.push({ name, ctype: snapshot.character.ctype, level: snapshot.character.level, map: snapshot.character.map, stateConfidence: 1, online: true, available: !snapshot.character.rip, dead: !!snapshot.character.rip, stats: { hp: snapshot.character.hp, max_hp: snapshot.character.max_hp, mp: snapshot.character.mp, max_mp: snapshot.character.max_mp }, skillUnlocks: [] }); } return result;
  }
  _encounter(snapshot, gameData) {
    const monster = dominantMonster(snapshot) || (this.localFarming && this.localFarming.status().currentPlan && this.localFarming.status().currentPlan.monster) || null; const distances = []; for (const entity of snapshot.entities || []) { if (!entity || entity.mtype !== monster || entity.x == null || entity.y == null || snapshot.character.x == null || snapshot.character.y == null) continue; distances.push(Math.hypot(entity.x - snapshot.character.x, entity.y - snapshot.character.y)); }
    const levels = this._currentMembers(snapshot).map((row) => Number(row.level) || 0).filter((value) => value > 0); const avgLevel = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    return createEncounterFingerprint({ snapshot, gameData, monster, contentDisposition: this._contentDisposition(monster), avgDistance: distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : null, spawnDensity: monster ? (snapshot.entities || []).filter((entity) => entity && entity.mtype === monster && !entity.dead).length : 0, partyLevelBand: Math.floor(avgLevel / 10) * 10 });
  }
  _riskContext(snapshot, encounter) {
    const c = snapshot.character; const hpRatio = c.max_hp > 0 ? c.hp / c.max_hp : 1; const telemetry = this.partyTelemetry.aggregate(this._currentMembers(snapshot).map((row) => row.name)); const unknown = encounter.contentDisposition === 'QUARANTINED' || encounter.contentDisposition === 'UNKNOWN';
    return { unknown, highRisk: unknown || telemetry.emergencies > 0 || telemetry.deathsPerHour >= 1 || hpRatio < 0.45, mediumRisk: telemetry.deathsPerHour > 0 || telemetry.retreats > 0 || hpRatio < 0.7, lowSurvivalMargin: hpRatio < 0.6 || (telemetry.minHpRatio != null && telemetry.minHpRatio < 0.55), mpStarvation: telemetry.minMpRatio != null && telemetry.minMpRatio < 0.2, statusPressure: false, elementalPressure: false };
  }
  _recordCurrentPerformance(snapshot, encounter, currentMembers, currentFingerprint) {
    if (!currentFingerprint || !encounter || !encounter.monster || !encounter.monster.mtype) return; const now = this.now(); const elapsedMs = this.lastPerformanceSampleAt == null ? 0 : now - this.lastPerformanceSampleAt; this.lastPerformanceSampleAt = now; if (elapsedMs < 1000 || elapsedMs > 60000) return; const names = currentMembers.map((row) => row.name); const aggregate = this.partyTelemetry.aggregate(names); const local = this.partyTelemetry.buildLocalReport(this);
    if (local && !aggregate.reports.some((row) => row.name === local.name)) { aggregate.freshReports += 1; for (const key of ['xpPerHour', 'goldPerHour', 'killsPerHour', 'deathsPerHour', 'potionsPerHour', 'damageTakenPerHour']) aggregate[key] += local.rates[key]; aggregate.minHpRatio = aggregate.minHpRatio == null ? local.hpRatio : Math.min(aggregate.minHpRatio, local.hpRatio); aggregate.minMpRatio = aggregate.minMpRatio == null ? local.mpRatio : Math.min(aggregate.minMpRatio, local.mpRatio); if (local.safety.retreat) aggregate.retreats += 1; if (local.safety.emergency) aggregate.emergencies += 1; if (local.safety.movementCircuitOpen) aggregate.movementCircuits += 1; aggregate.skillFailureBackoffs += local.safety.skillFailureBackoffs; }
    if (aggregate.freshReports <= 0) return; const hours = elapsedMs / 3600000; const progressNorm = clamp01(Math.log1p(Math.max(0, aggregate.xpPerHour)) / Math.log(6000001)); const safetyMargin = aggregate.minHpRatio == null ? 0.5 : aggregate.minHpRatio; const score = clamp01(safetyMargin * 0.6 + progressNorm * 0.4 - Math.min(0.5, aggregate.deathsPerHour * 0.35));
    this.partyPerformance.record(encounter.key, currentFingerprint.key, { seconds: elapsedMs / 1000, xp: aggregate.xpPerHour * hours, gold: aggregate.goldPerHour * hours, kills: aggregate.killsPerHour * hours, deaths: aggregate.deathsPerHour * hours, hpPotions: aggregate.potionsPerHour * hours, damage: 0, retreats: aggregate.retreats, nearDeaths: aggregate.minHpRatio != null && aggregate.minHpRatio < 0.25 ? 1 : 0, movementFailures: aggregate.movementCircuits, skillFailures: aggregate.skillFailureBackoffs, safetyMargin, score });
    if (this.adaptivePullLearner && typeof this.adaptivePullLearner.recordTelemetryWindow === 'function') {
      try {
        this.adaptivePullLearner.recordTelemetryWindow({
          snapshot,
          currentMembers,
          encounterFingerprint: encounter,
          partyFingerprint: currentFingerprint,
          aggregate,
          elapsedMs
        });
      } catch (error) {
        this.log.emit({ component: 'adaptive-pull-learning', event: 'ADAPTIVE_PULL_SAMPLE_FAILED', severity: 'warn', reason: 'TELEMETRY_RECORD_ERROR', data: { message: String(error && error.message || error) } });
      }
    }
    this.partyPerformance.save();
  }
  _maybeApplyAura(snapshot, encounter, risk, currentMembers) {
    const localName = snapshot.character.name; const local = currentMembers.find((row) => row.name === localName); const paladin = currentMembers.find((row) => row.ctype === 'paladin') || null; const recommendation = this.auraPolicy.recommend({ paladin, encounter, risk }); this.lastAuraRecommendation = recommendation; if (!recommendation.aura || !local || local.ctype !== 'paladin' || paladin.name !== local.name) return; if (!this.auraAutomationEnabled || this.adapter.mode !== 'active' || recommendation.canSwitch === false) return; if (this.auraPolicy.lastAura === recommendation.aura) return; const result = this.adapter.command('use_skill', ['paladin_aura', recommendation.aura]); this.lastAuraExecution = { at: this.now(), aura: recommendation.aura, result: { executed: !!result.executed, reason: result.reason || null, shadow: !!result.shadow } }; if (result.executed) { this.auraPolicy.noteApplied(recommendation.aura); this.log.emit({ component: 'party-aura', event: 'PALADIN_AURA_CHANGED', data: { aura: recommendation.aura, reason: recommendation.reason } }); }
  }
  _maybeStartTransition(snapshot, decision, currentMembers) {
    if (!decision || decision.decision !== 'WOULD_SWITCH' || !decision.recommended || this.partyTransitions.active) return; if (!this.partyTransitions.liveEnabled || this.adapter.mode !== 'active') return; const recommendedNames = new Set(decision.recommended.members.map((row) => row.name)); const status = this.characterRegistry.status(); const planMembers = status.characters.filter((row) => recommendedNames.has(row.name)); if (planMembers.length !== 4) return; const merchant = planMembers.find((row) => row.ctype === 'merchant'); if (!merchant) return; const c = snapshot.character; const inCombat = !!c.target || (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name); const requiresCrossMapRouting = planMembers.some((member) => member.map && c.map && member.map !== c.map && member.online === true);
    Promise.resolve(this.partyTransitions.execute({ members: planMembers, merchant }, { runtimeMode: this.adapter.mode, currentMembers, registryStatus: status, inCombat, emergency: !!this.pendingEmergencyRetreat, requiresCrossMapRouting, verifyTargetState: (targetNames) => { const latest = this.characterRegistry.status(); const byName = new Map(latest.characters.map((row) => [row.name, row])); return targetNames.every((name) => { const row = byName.get(name); if (!row || row.dead === true) return false; if (row.online === false || row.presence === 'STALE') return false; if (row.map && c.map && row.map !== c.map) return false; const hp = row.stats && Number(row.stats.hp); const maxHp = row.stats && Number(row.stats.max_hp); if (Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0 && hp / maxHp < 0.5) return false; return true; }); } })).then((result) => { if (result && result.executed) this.partyOrchestrator.noteSwitch(); }).catch((error) => { this.log.emit({ component: 'party-transition', event: 'PARTY_SWITCH_ABORTED', severity: 'error', reason: 'UNHANDLED_TRANSITION_ERROR', data: { message: String(error && error.message || error) } }); });
  }
  _partyDecisionCycle() {
    const snapshot = this.lastSnapshot; if (!snapshot || !snapshot.character) return null; const gameData = this.adapter.getGameData() || {}; const registryStatus = this.characterRegistry.status(); const rosterNames = registryStatus.characters.map((row) => row.name); this.partyTelemetry.setTrustedNames(rosterNames); const merchant = registryStatus.characters.find((row) => row.ctype === 'merchant'); if (merchant) { this.partyTelemetry.setMerchantName(merchant.name); this.partyTransitions.setMerchantName(merchant.name); }
    const currentMembers = this._currentMembers(snapshot); const currentFingerprint = createPartyFingerprint(currentMembers, { aura: this.auraPolicy.lastAura }); const encounter = this._encounter(snapshot, gameData); this.currentPartyFingerprint = currentFingerprint; this.currentEncounterFingerprint = encounter; this._recordCurrentPerformance(snapshot, encounter, currentMembers, currentFingerprint); const decision = this.partyOrchestrator.decide({ snapshot, gameData, registryStatus, currentMembers, encounter, performanceStore: this.partyPerformance, switchCostSeconds: 180 }); this.lastPartyDecision = decision; const risk = this._riskContext(snapshot, encounter); this._maybeApplyAura(snapshot, encounter, risk, currentMembers); this._maybeStartTransition(snapshot, decision, currentMembers); return decision;
  }
  tick() { this.backgroundExecution.noteTick(); super.tick(); this.partyTelemetry.tick(this); const now = this.now(); if (now - this.lastPartyDecisionAt < this.partyDecisionMs) return; this.lastPartyDecisionAt = now; this._partyDecisionCycle(); }
  setPartyTransitionsEnabled(enabled) { return this.partyTransitions.setLiveEnabled(enabled); }
  setPartyAuraAutomationEnabled(enabled) { this.auraAutomationEnabled = enabled === true; return this.auraAutomationEnabled; }
  setPartyExplorationEnabled(enabled) { return this.partyOrchestrator.setExplorationEnabled(enabled); }
  setPartyCodeSlots(slots) { return this.partyTransitions.setCodeSlots(slots); }
  status() {
    const base = super.status(); return { ...base, version: RELEASE_VERSION, backgroundExecution: this.backgroundExecution.status(), party: { ...(base.party || {}), mode: 'adaptive-orchestrator', actionAuthority: (this.adapter.mode === 'active' && (this.partyTransitions.liveEnabled || this.auraAutomationEnabled)), strategicBrainAuthority: false, decisionIntervalMs: this.partyDecisionMs, fingerprints: { party: this.currentPartyFingerprint, encounter: this.currentEncounterFingerprint }, orchestrator: this.partyOrchestrator.status(), decision: this.lastPartyDecision, performance: this.partyPerformance.status(16), telemetry: this.partyTelemetry.status(), aura: { automationEnabled: this.auraAutomationEnabled, recommendation: this.lastAuraRecommendation, execution: this.lastAuraExecution, policy: this.auraPolicy.status() }, transition: this.partyTransitions.status() } };
  }
  exportDiagnostics() { const base = JSON.parse(super.exportDiagnostics()); base.context = base.context || {}; base.context.backgroundExecution = this.backgroundExecution.status(); base.context.party = this.status().party; return JSON.stringify(base, null, 2); }
}
module.exports = { Alpha12Runtime, composeAlpha12Runtime };
