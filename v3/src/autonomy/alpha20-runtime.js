'use strict';

const { Alpha19Runtime } = require('./alpha19-runtime');
const { RELEASE_VERSION } = require('../release-version');
const { PartyLifecycleStore } = require('../party/lifecycle-store');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_ACK } = require('../party/controlled-lifecycle-coordinator');
const { ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_ACK } = require('../party/controlled-paladin-aura-executor');

const SUPERVISOR_ALLOWED = new Set(['HEALTHY', 'WATCH']);

function finite(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, finite(value))); }

class Alpha20Runtime extends Alpha19Runtime {
  constructor(options = {}) {
    super(options);
    this.log.version = RELEASE_VERSION;

    // Alpha.12 legacy live switches are never used directly in Alpha.20.
    // Alpha.20 re-authorizes them only inside a bounded controlled operation.
    this.partyTransitions.setLiveEnabled(false);
    this.auraAutomationEnabled = false;

    this.partyLifecycle = options.partyLifecycle || new PartyLifecycleStore({
      root: this.root,
      storage: options.partyLifecycleStorage || options.storage,
      key: options.partyLifecycleStorageKey,
      now: this.now,
      log: this.log,
      capacity: options.partyLifecycleCapacity,
      minCurrentSamples: options.partyLifecycleMinCurrentSamples,
      minCurrentConfidence: options.partyLifecycleMinCurrentConfidence,
      minPromotionSafety: options.partyLifecycleMinPromotionSafety,
      minPromotionXpRatio: options.partyLifecycleMinPromotionXpRatio,
      minPromotionGain: options.partyLifecycleMinPromotionGain,
      minProjectedGain: options.partyLifecycleMinProjectedGain,
      minTrainingSafety: options.partyLifecycleMinTrainingSafety,
      minTrainingExpectedXpRatio: options.partyLifecycleMinTrainingExpectedXpRatio,
      promotionWindowsRequired: options.partyLifecyclePromotionWindowsRequired
    });
    this.partyLifecycle.load();

    this.controlledPartyLifecycle = options.controlledPartyLifecycle || new ControlledPartyLifecycleCoordinator({
      root: this.root,
      now: this.now,
      log: this.log,
      storage: options.partyLifecycleOperationStorage || options.storage,
      storageKey: options.partyLifecycleOperationStorageKey,
      lifecycle: this.partyLifecycle,
      transitions: this.partyTransitions,
      auraPolicy: this.auraPolicy,
      adapter: this.adapter,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getEconomyEmergency: () => this._alpha20EconomyEmergency(),
      minTransitionIntervalMs: options.partyLifecycleMinTransitionIntervalMs
    });

    this.controlledPaladinAura = options.controlledPaladinAura || new ControlledPaladinAuraExecutor({
      root: this.root,
      now: this.now,
      log: this.log,
      adapter: this.adapter,
      auraPolicy: this.auraPolicy,
      getMode: () => this.adapter.mode,
      getSupervisorStatus: () => this.globalSupervisor.status(),
      getEconomyEmergency: () => this._alpha20EconomyEmergency()
    });
    this.lastLifecyclePlan = null;
    this.lastLifecycleExecution = null;
  }

  _announce(message, event) {
    const normalized = String(message).replace(/\[AIO v3 [^\]]+\]/g, `[AIO v3 ${RELEASE_VERSION}]`);
    this.log.emit({ component: 'runtime', event, data: { message: normalized, visibleMirror: !!this.visibleStatusEnabled } });
    this._gameLog(normalized);
    return true;
  }

  _alpha20EconomyEmergency() {
    const recovery = this.controlledMerchantSpaceRecovery && this.controlledMerchantSpaceRecovery.status ? this.controlledMerchantSpaceRecovery.status() : null;
    const capacity = this.bankCapacity && this.bankCapacity.status ? this.bankCapacity.status() : null;
    return !!(
      recovery && recovery.busy ||
      recovery && recovery.journal && recovery.journal.breaker && recovery.journal.breaker.open ||
      capacity && capacity.workGate && capacity.workGate.blockInventoryProducingWork === true
    );
  }

  _measuredScore(row) {
    if (!row || !row.measured) return null;
    const weights = this.partyOrchestrator.weights || {};
    return clamp01(['survival', 'progress', 'controllability', 'synergy'].reduce((sum, key) => sum + clamp01(row.measured[key]) * finite(weights[key]), 0));
  }

  _lifecycleEvidence(snapshot, currentMembers, registryStatus, encounter, risk) {
    const context = { snapshot, gameData: this.adapter.getGameData() || {}, registryStatus, currentMembers, encounter, performanceStore: this.partyPerformance };
    const scored = this.partyOrchestrator.candidates(registryStatus).map((candidate) => this.partyOrchestrator.score(candidate, context));
    const activeNames = new Set(currentMembers.filter((row) => row.ctype !== 'merchant').map((row) => row.name));
    const combat = (registryStatus.characters || []).filter((row) => row && row.ctype !== 'merchant');
    const rows = [];

    for (const character of combat) {
      const containing = scored.filter((row) => row.candidate.combat.some((member) => member.name === character.name) && !row.hardSafetyRejected);
      const projected = containing.slice().sort((a, b) => b.score - a.score || b.confidence - a.confidence)[0] || null;
      const measuredRows = containing.filter((row) => row.measured && row.profile && Number(row.profile.samples) > 0).sort((a, b) => finite(b.measured.confidence) - finite(a.measured.confidence) || finite(a.profile.ageMs) - finite(b.profile.ageMs));
      const measured = measuredRows[0] || null;
      const equipment = character.equipment && typeof character.equipment === 'object' ? character.equipment : {};
      rows.push({
        name: character.name,
        ctype: character.ctype,
        level: character.level,
        active: activeNames.has(character.name),
        currentScore: measured ? this._measuredScore(measured) : null,
        currentConfidence: measured ? measured.measured.confidence : 0,
        currentSamples: measured && measured.profile ? measured.profile.samples : 0,
        survivalScore: measured ? measured.measured.survival : null,
        xpPerHour: measured && measured.profile ? measured.profile.xpPerHour : 0,
        projectedScore: projected ? projected.score : null,
        projectedProgress: projected ? projected.components.progress : null,
        expectedTrainingXpRatio: null,
        gearReady: Object.keys(equipment).length > 0 && finite(character.stateConfidence) >= 0.75,
        contentSafe: encounter && encounter.contentDisposition !== 'UNKNOWN' && encounter.contentDisposition !== 'QUARANTINED'
      });
    }

    const active = rows.filter((row) => row.active);
    const activeCurrent = active.map((row) => row.currentScore).filter((value) => value != null);
    const activeProjected = active.map((row) => row.projectedScore).filter((value) => value != null);
    const activeProgress = active.map((row) => row.projectedProgress).filter((value) => value != null && value > 0);
    const activeXp = active.map((row) => row.xpPerHour).filter((value) => value > 0);
    const incumbentCurrentScore = activeCurrent.length === active.length && active.length ? Math.min(...activeCurrent) : null;
    const incumbentProjectedScore = activeProjected.length ? Math.min(...activeProjected) : null;
    const incumbentProjectedProgress = activeProgress.length ? Math.min(...activeProgress) : null;
    const incumbentXpPerHour = activeXp.length ? Math.min(...activeXp) : 0;
    for (const row of rows) {
      row.expectedTrainingXpRatio = row.projectedProgress != null && incumbentProjectedProgress > 0 ? row.projectedProgress / incumbentProjectedProgress : null;
    }
    return {
      characters: rows,
      incumbentCurrentScore,
      incumbentProjectedScore,
      incumbentXpPerHour,
      highRisk: !!(risk && (risk.highRisk || risk.unknown)),
      economyEmergency: this._alpha20EconomyEmergency()
    };
  }

  _maybeApplyAura(snapshot, encounter, risk, currentMembers) {
    const localName = snapshot && snapshot.character && snapshot.character.name;
    const local = currentMembers.find((row) => row.name === localName);
    const paladin = currentMembers.find((row) => row.ctype === 'paladin') || null;
    const recommendation = this.auraPolicy.recommend({ paladin, encounter, risk });
    this.lastAuraRecommendation = recommendation;
    if (!local || local.ctype !== 'paladin' || !paladin || paladin.name !== local.name) return recommendation;
    const c = snapshot.character;
    const inCombat = !!c.target || (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name);
    const result = this.controlledPaladinAura.execute(recommendation, {
      inCombat,
      highRisk: !!(risk && (risk.highRisk || risk.unknown)),
      emergency: !!this.pendingEmergencyRetreat
    });
    if (result && result.executed) this.lastAuraExecution = result;
    return recommendation;
  }

  // Alpha.20 never lets the old projected party recommendation directly execute a switch.
  _maybeStartTransition() { return null; }

  _verifyLifecycleTarget(targetNames, snapshot) {
    const latest = this.characterRegistry.status();
    const byName = new Map((latest.characters || []).map((row) => [row.name, row]));
    return targetNames.every((name) => {
      const row = byName.get(name);
      if (!row || row.dead === true || row.online === false || row.presence === 'STALE') return false;
      if (row.map && snapshot.character.map && row.map !== snapshot.character.map) return false;
      const hp = row.stats && Number(row.stats.hp);
      const maxHp = row.stats && Number(row.stats.max_hp);
      return !(Number.isFinite(hp) && Number.isFinite(maxHp) && maxHp > 0 && hp / maxHp < 0.5);
    });
  }

  _partyDecisionCycle() {
    const decision = super._partyDecisionCycle();
    const snapshot = this.lastSnapshot;
    if (!snapshot || !snapshot.character || !this.currentEncounterFingerprint) return decision;
    const registryStatus = this.characterRegistry.status();
    const currentMembers = this._currentMembers(snapshot);
    const risk = this._riskContext(snapshot, this.currentEncounterFingerprint);
    const evidence = this._lifecycleEvidence(snapshot, currentMembers, registryStatus, this.currentEncounterFingerprint, risk);
    this.partyLifecycle.evaluate(evidence);
    this.partyLifecycle.save();

    const c = snapshot.character;
    const inCombat = !!c.target || (snapshot.entities || []).some((entity) => entity && !entity.dead && entity.target === c.name);
    const context = {
      currentNames: currentMembers.map((row) => row.name),
      inCombat,
      highRisk: evidence.highRisk,
      emergency: !!this.pendingEmergencyRetreat,
      requiresCrossMapRouting: currentMembers.some((member) => member.map && c.map && member.map !== c.map && member.online === true),
      verifyTargetState: (targetNames) => this._verifyLifecycleTarget(targetNames, snapshot)
    };
    this.lastLifecyclePlan = this.controlledPartyLifecycle.plan(currentMembers, registryStatus, context);
    if (this.lastLifecyclePlan && this.lastLifecyclePlan.planned && !this.controlledPartyLifecycle.busy) {
      Promise.resolve(this.controlledPartyLifecycle.executePlan(this.lastLifecyclePlan, currentMembers, registryStatus, context))
        .then((result) => { this.lastLifecycleExecution = result; if (result && result.executed) this.partyOrchestrator.noteSwitch(); })
        .catch((error) => {
          this.lastLifecycleExecution = { executed: false, reason: 'UNHANDLED_ALPHA20_TRANSITION_ERROR', error: String(error && error.message || error) };
          this.log.emit({ component: 'alpha20-party-lifecycle', event: 'PARTY_LIFECYCLE_EXECUTION_ERROR', severity: 'error', reason: 'UNHANDLED_ALPHA20_TRANSITION_ERROR', data: { message: String(error && error.message || error) } });
        });
    }
    return decision;
  }

  configureControlledPartyLifecycle(config = {}) {
    if (config.enabled === true) {
      const gate = this._liveEnableGate();
      if (!gate.allowed) {
        this.controlledPartyLifecycle.disable(gate.reason);
        this.controlledPaladinAura.disable(gate.reason);
        return { lifecycle: { ...this.controlledPartyLifecycle.status(), enableRejected: gate.reason }, aura: this.controlledPaladinAura.status() };
      }
    }
    const lifecycle = this.controlledPartyLifecycle.configure({
      enabled: config.enabled === true,
      ack: config.ack,
      allowTransitions: config.allowTransitions === true,
      allowDevelopmentRotation: config.allowDevelopmentRotation === true,
      allowAuraChanges: false,
      reason: config.reason
    });
    let aura;
    if (config.enabled === true && config.allowAuraChanges === true) aura = this.controlledPaladinAura.configure({ enabled: true, ack: config.auraAck });
    else aura = this.controlledPaladinAura.disable(config.reason || 'AURA_NOT_AUTHORIZED');
    return { lifecycle, aura };
  }

  reconcilePartyLifecycle() {
    const snapshot = this.lastSnapshot;
    const names = snapshot ? this._currentMembers(snapshot).map((row) => row.name) : [];
    return this.controlledPartyLifecycle.reconcile(names);
  }

  // Legacy setters are intentionally closed so old Alpha.12 switches cannot bypass Alpha.20.
  setPartyTransitionsEnabled() {
    this.partyTransitions.setLiveEnabled(false);
    return false;
  }
  setPartyAuraAutomationEnabled() {
    this.auraAutomationEnabled = false;
    return false;
  }

  _guardControlledAuthority() {
    const base = super._guardControlledAuthority();
    const supervisor = this.globalSupervisor.status();
    let reason = null;
    if (this.adapter.mode !== 'active') reason = 'RUNTIME_NOT_ACTIVE';
    else if (!SUPERVISOR_ALLOWED.has(String(supervisor.state || ''))) reason = 'SUPERVISOR_NOT_HEALTHY';
    if (reason) {
      if (this.controlledPartyLifecycle.status().enabled) this.controlledPartyLifecycle.disable(reason);
      if (this.controlledPaladinAura.status().enabled) this.controlledPaladinAura.disable(reason);
    }
    return { ...base, partyLifecycleGuardReason: reason };
  }

  setMode(mode) {
    const resolved = super.setMode(mode);
    if (resolved !== 'active') {
      this.controlledPartyLifecycle.disable('RUNTIME_LEFT_ACTIVE_MODE');
      this.controlledPaladinAura.disable('RUNTIME_LEFT_ACTIVE_MODE');
    }
    return resolved;
  }

  stop() {
    this.controlledPartyLifecycle.disable('RUNTIME_STOP');
    this.controlledPaladinAura.disable('RUNTIME_STOP');
    this.partyLifecycle.save({ force: true });
    this.controlledPartyLifecycle.save();
    return super.stop();
  }

  status() {
    const base = super.status();
    return {
      ...base,
      version: RELEASE_VERSION,
      party: {
        ...(base.party || {}),
        lifecycle: this.partyLifecycle.status(),
        controlledLifecycle: this.controlledPartyLifecycle.status(),
        controlledAura: this.controlledPaladinAura.status(),
        lifecyclePlan: this.lastLifecyclePlan,
        lifecycleExecution: this.lastLifecycleExecution,
        legacyTransitionBypassAllowed: false,
        legacyAuraBypassAllowed: false
      },
      alpha20: {
        adaptivePartyLifecycle: true,
        statuses: ['ACTIVE', 'BENCH', 'DEVELOPMENT', 'PROMOTION_CANDIDATE'],
        currentScoreRequiredForPromotion: true,
        projectedScorePlanningOnly: true,
        maxDevelopmentSlots: 1,
        controlledLifecycleAck: CONTROLLED_PARTY_LIFECYCLE_ACK,
        controlledAuraAck: CONTROLLED_PALADIN_AURA_ACK,
        transitionAuthorityDefault: false,
        developmentRotationAuthorityDefault: false,
        auraAuthorityDefault: false,
        crossMapRoutingAuthority: false,
        smartMoveAuthority: false,
        serverChangeAuthority: false,
        brainGameplayAuthority: false
      }
    };
  }

  exportDiagnostics() {
    const base = JSON.parse(super.exportDiagnostics());
    base.context = base.context || {};
    base.context.partyLifecycle = this.partyLifecycle.status();
    base.context.controlledPartyLifecycle = this.controlledPartyLifecycle.status();
    base.context.controlledPaladinAura = this.controlledPaladinAura.status();
    return JSON.stringify(base, null, 2);
  }
}

module.exports = { Alpha20Runtime };
