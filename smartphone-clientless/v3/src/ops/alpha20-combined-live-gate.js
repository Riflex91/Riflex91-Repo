'use strict';

const { RELEASE_VERSION } = require('../release-version');
const { MinuteCountdownReporter } = require('./minute-countdown-reporter');
const { CONTROLLED_PARTY_LIFECYCLE_ACK } = require('../party/controlled-lifecycle-coordinator');
const { CONTROLLED_PALADIN_AURA_ACK } = require('../party/controlled-paladin-aura-executor');

const ALPHA20_LIVE_GATE_ACK = 'ALPHA20_FULL_LIVE_GATE';
const REQUIRED_OBSERVATION_MS = 10 * 60 * 1000;
const DEFAULT_SAMPLE_MS = 5000;
const ALLOWED_SUPERVISOR = new Set(['HEALTHY', 'WATCH']);
const COMBAT_CLASSES = new Set(['warrior', 'paladin', 'rogue', 'ranger', 'mage', 'priest']);
const ALLOWED_PLAN_KINDS = new Set(['PROMOTION', 'DEVELOPMENT_ROTATION', 'DEVELOPMENT_RETURN']);

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function delta(after, before, key) {
  return Math.max(0, finite(after && after[key], 0) - finite(before && before[key], 0));
}

function unique(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

function sameNames(left, right) {
  const a = unique(left).sort();
  const b = unique(right).sort();
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

class Alpha20CombinedLiveGate {
  constructor(options = {}) {
    this.runtime = options.runtime;
    this.root = options.root || this.runtime && this.runtime.root || globalThis;
    this.now = options.now || this.runtime && this.runtime.now || (() => Date.now());
    this.testMode = options.testMode === true;
    this.observationMs = this.testMode
      ? Math.max(0, finite(options.observationMs, 0))
      : REQUIRED_OBSERVATION_MS;
    this.sampleMs = this.testMode
      ? Math.max(1, finite(options.sampleMs, 1))
      : DEFAULT_SAMPLE_MS;
    this.sleep = options.sleep || ((ms) => new Promise((resolve) => {
      const setTimer = this.root && this.root.setTimeout || setTimeout;
      setTimer(resolve, ms);
    }));
    this.running = false;
    this.phase = 'IDLE';
    this.startedAt = null;
    this.lastResult = null;
    this.lastResultText = null;
    this._savedDecisionAt = null;
    this.countdown = new MinuteCountdownReporter({
      now: this.now,
      label: 'Alpha.20 Live Gate',
      emit: (message) => this._countdownMessage(message)
    });
  }

  _event(event, severity = 'info', reason = null, data = {}) {
    const log = this.runtime && this.runtime.log;
    if (log && typeof log.emit === 'function') log.emit({ component: 'alpha20-live-gate', event, severity, reason, data });
  }

  _gameLog(message) {
    const runtime = this.runtime;
    if (runtime && typeof runtime._gameLog === 'function') {
      try { runtime._gameLog(message); return true; } catch (_) {}
    }
    const fn = this.root && (this.root.game_log || this.root.parent && this.root.parent.game_log);
    if (typeof fn === 'function') {
      try { fn(message); return true; } catch (_) {}
    }
    return false;
  }

  _countdownMessage(message) {
    const text = `[AIO v3 ${RELEASE_VERSION}] ${message}`;
    this._gameLog(text);
    this._event('ALPHA20_LIVE_GATE_COUNTDOWN', 'info', null, { message: text, countdown: this.countdown ? this.countdown.status() : null });
  }

  _character() {
    return this.root && (this.root.character || this.root.parent && this.root.parent.character) || null;
  }

  _inCombat() {
    const character = this._character() || {};
    if (character.target) return true;
    const entities = this.root && (this.root.parent && this.root.parent.entities || this.root.entities) || {};
    const self = new Set([character.name, character.id].filter(Boolean).map(String));
    return Object.values(entities).some((entity) => entity && entity.target && self.has(String(entity.target)));
  }

  _farmerEnabled() {
    const runtime = this.runtime;
    const status = runtime && runtime.farmerStatus ? runtime.farmerStatus() : runtime && runtime.status ? runtime.status().farmer : null;
    return !!(status && status.enabled);
  }

  _controlledEconomySnapshot() {
    const runtime = this.runtime;
    const read = (value) => value && typeof value.status === 'function' ? value.status() : null;
    return {
      spaceRecovery: read(runtime && runtime.controlledMerchantSpaceRecovery),
      consolidation: read(runtime && runtime.controlledBankConsolidation),
      merchant: read(runtime && runtime.controlledMerchant),
      expansion: read(runtime && runtime.controlledBankExpansion),
      travel: read(runtime && runtime.controlledTravel)
    };
  }

  _circuits() {
    const runtime = this.runtime;
    const tx = runtime && runtime.transactionEngine && runtime.transactionEngine.status ? runtime.transactionEngine.status() : {};
    const lifecycle = runtime && runtime.controlledPartyLifecycle && runtime.controlledPartyLifecycle.breaker
      ? runtime.controlledPartyLifecycle.breaker() : null;
    return {
      partyLifecycle: lifecycle,
      sell: tx && tx.circuits && tx.circuits.SELL || null,
      bank: tx && tx.circuits && tx.circuits.BANK || null,
      travel: runtime && runtime.safeTravel && runtime.safeTravel.breaker ? runtime.safeTravel.breaker() : null,
      bankExpansion: runtime && runtime.bankExpansionTransactions && runtime.bankExpansionTransactions.breaker ? runtime.bankExpansionTransactions.breaker() : null,
      spaceRecovery: runtime && runtime.merchantSpaceRecoveryJournal && runtime.merchantSpaceRecoveryJournal.breaker ? runtime.merchantSpaceRecoveryJournal.breaker() : null
    };
  }

  _currentMembers() {
    const runtime = this.runtime;
    if (!runtime || !runtime.lastSnapshot) return [];
    if (typeof runtime._currentMembers === 'function') {
      try { return runtime._currentMembers(runtime.lastSnapshot) || []; } catch (_) { return []; }
    }
    return [];
  }

  _partyShape(members = this._currentMembers()) {
    const clean = (members || []).filter((row) => row && row.name);
    const names = clean.map((row) => String(row.name));
    const merchants = clean.filter((row) => String(row.ctype || '').toLowerCase() === 'merchant');
    const combat = clean.filter((row) => COMBAT_CLASSES.has(String(row.ctype || '').toLowerCase()));
    const stale = clean.filter((row) => row.dead === true || row.online === false || row.presence === 'STALE' || row.available === false);
    return {
      valid: clean.length === 4 && new Set(names).size === 4 && merchants.length === 1 && combat.length === 3 && stale.length === 0,
      names,
      members: clone(clean.map((row) => ({
        name: row.name,
        ctype: row.ctype || null,
        level: finite(row.level, 0),
        map: row.map || null,
        online: row.online == null ? null : row.online === true,
        presence: row.presence || null,
        dead: row.dead === true,
        available: row.available == null ? null : row.available !== false,
        stateConfidence: row.stateConfidence == null ? null : finite(row.stateConfidence, 0)
      }))),
      merchantCount: merchants.length,
      combatCount: combat.length,
      invalidMembers: stale.map((row) => row.name)
    };
  }

  _lifecycleSnapshot() {
    const runtime = this.runtime;
    const status = runtime && runtime.partyLifecycle && runtime.partyLifecycle.status ? runtime.partyLifecycle.status() : null;
    const controlled = runtime && runtime.controlledPartyLifecycle && runtime.controlledPartyLifecycle.status ? runtime.controlledPartyLifecycle.status() : null;
    const aura = runtime && runtime.controlledPaladinAura && runtime.controlledPaladinAura.status ? runtime.controlledPaladinAura.status() : null;
    const rows = status && Array.isArray(status.characters) ? status.characters : [];
    const development = rows.filter((row) => row && row.state === 'DEVELOPMENT');
    const promotions = rows.filter((row) => row && row.state === 'PROMOTION_CANDIDATE' && row.active !== true);
    return {
      lifecycle: clone(status),
      controlled: clone(controlled),
      aura: clone(aura),
      developmentCount: development.length,
      developmentCandidates: development.map((row) => row.name),
      promotionCandidates: promotions.map((row) => row.name),
      activeCombat: rows.filter((row) => row && row.active === true).map((row) => row.name)
    };
  }

  _transitionChildSnapshot() {
    const runtime = this.runtime;
    const transition = runtime && runtime.partyTransitions && runtime.partyTransitions.status ? runtime.partyTransitions.status() : null;
    return clone(transition);
  }

  _safeStateSnapshot() {
    const runtime = this.runtime;
    const status = runtime && runtime.status ? runtime.status() : {};
    const supervisor = runtime && runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : status.supervisor || {};
    const economy = this._controlledEconomySnapshot();
    const lifecycle = this._lifecycleSnapshot();
    const party = this._partyShape();
    const transitionChild = this._transitionChildSnapshot();
    return {
      at: this.now(),
      version: status.version || null,
      mode: status.mode || runtime && runtime.adapter && runtime.adapter.mode || null,
      farmerEnabled: this._farmerEnabled(),
      supervisorState: supervisor && supervisor.state || null,
      economyEmergency: runtime && typeof runtime._alpha20EconomyEmergency === 'function' ? !!runtime._alpha20EconomyEmergency() : false,
      party,
      lifecycle: {
        developmentCount: lifecycle.developmentCount,
        developmentCandidates: lifecycle.developmentCandidates,
        promotionCandidates: lifecycle.promotionCandidates,
        activeCombat: lifecycle.activeCombat,
        evaluations: finite(lifecycle.lifecycle && lifecycle.lifecycle.stats && lifecycle.lifecycle.stats.evaluations, 0),
        maxDevelopmentSlots: finite(lifecycle.lifecycle && lifecycle.lifecycle.maxDevelopmentSlots, 0),
        controlledEnabled: !!(lifecycle.controlled && lifecycle.controlled.enabled),
        transitionAuthority: !!(lifecycle.controlled && lifecycle.controlled.transitionAuthority),
        developmentRotationAuthority: !!(lifecycle.controlled && lifecycle.controlled.developmentRotationAuthority),
        developmentSession: clone(lifecycle.controlled && lifecycle.controlled.developmentSession || null),
        breaker: clone(lifecycle.controlled && lifecycle.controlled.breaker || null),
        auraEnabled: !!(lifecycle.aura && lifecycle.aura.enabled),
        auraAuthority: !!(lifecycle.aura && lifecycle.aura.actionAuthority)
      },
      legacy: {
        transitionChildLive: !!(transitionChild && transitionChild.liveEnabled),
        auraAutomationEnabled: !!(status.party && status.party.aura && status.party.aura.automationEnabled),
        transitionBypassAllowed: !!(status.party && status.party.legacyTransitionBypassAllowed),
        auraBypassAllowed: !!(status.party && status.party.legacyAuraBypassAllowed)
      },
      controlledEconomy: {
        spaceRecoveryEnabled: !!(economy.spaceRecovery && economy.spaceRecovery.enabled),
        consolidationEnabled: !!(economy.consolidation && economy.consolidation.enabled),
        merchantEnabled: !!(economy.merchant && economy.merchant.enabled),
        expansionEnabled: !!(economy.expansion && economy.expansion.enabled),
        travelEnabled: !!(economy.travel && economy.travel.enabled),
        expansionPurchaseAuthority: !!(economy.spaceRecovery && economy.spaceRecovery.expansionPurchaseAuthority),
        emergencyReclaimAuthority: !!(economy.spaceRecovery && economy.spaceRecovery.emergencyReclaimAuthority)
      },
      circuits: this._circuits()
    };
  }

  _refreshShadowEvidence() {
    const runtime = this.runtime;
    if (!runtime) return;
    try { if (typeof runtime.tick === 'function') runtime.tick(); } catch (_) {}
    try {
      if (runtime.lastSnapshot && typeof runtime._partyDecisionCycle === 'function') runtime._partyDecisionCycle();
    } catch (_) {}
  }

  async _normalizeSafeState(reason = 'ALPHA20_LIVE_GATE_SAFE_STATE') {
    const runtime = this.runtime;
    if (!runtime) return;
    try { if (runtime.controlledPartyLifecycle && runtime.controlledPartyLifecycle.disable) runtime.controlledPartyLifecycle.disable(reason); } catch (_) {}
    try { if (runtime.controlledPaladinAura && runtime.controlledPaladinAura.disable) runtime.controlledPaladinAura.disable(reason); } catch (_) {}
    try { if (runtime.partyTransitions && runtime.partyTransitions.setLiveEnabled) runtime.partyTransitions.setLiveEnabled(false); } catch (_) {}
    try { runtime.auraAutomationEnabled = false; } catch (_) {}
    try { if (runtime.controlledMerchantSpaceRecovery && runtime.controlledMerchantSpaceRecovery.disable) runtime.controlledMerchantSpaceRecovery.disable(reason); } catch (_) {}
    try { if (runtime.controlledBankConsolidation && runtime.controlledBankConsolidation.disable) runtime.controlledBankConsolidation.disable(reason); } catch (_) {}
    try { if (runtime.controlledBankExpansion && runtime.controlledBankExpansion.disable) runtime.controlledBankExpansion.disable(reason); } catch (_) {}
    try { if (runtime.controlledMerchant && runtime.controlledMerchant.disable) runtime.controlledMerchant.disable(reason); } catch (_) {}
    try { if (runtime.controlledTravel && runtime.controlledTravel.disable) await Promise.resolve(runtime.controlledTravel.disable(reason)).catch(() => {}); } catch (_) {}
    try { if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false); } catch (_) {}
    try { if (runtime.setMode) runtime.setMode('shadow'); } catch (_) {}
  }

  _precheck() {
    const runtime = this.runtime;
    const character = this._character();
    const status = runtime && runtime.status ? runtime.status() : {};
    const supervisor = runtime && runtime.globalSupervisor && runtime.globalSupervisor.status ? runtime.globalSupervisor.status() : {};
    const lifecycle = this._lifecycleSnapshot();
    const party = this._partyShape();
    const child = this._transitionChildSnapshot();
    const failures = [];
    if (!runtime) failures.push('RUNTIME_UNAVAILABLE');
    if (!character) failures.push('CHARACTER_UNAVAILABLE');
    if (character && String(character.ctype || character.type || '').toLowerCase() !== 'merchant') failures.push('MERCHANT_CONTROLLER_REQUIRED');
    if (character && (character.rip === true || character.dead === true)) failures.push('MERCHANT_DEAD');
    if (this._inCombat()) failures.push('MERCHANT_IN_COMBAT');
    if (String(status.version || '') !== RELEASE_VERSION) failures.push('RELEASE_VERSION_MISMATCH');
    if (!ALLOWED_SUPERVISOR.has(String(supervisor && supervisor.state || ''))) failures.push('SUPERVISOR_NOT_HEALTHY');
    if (!party.valid) failures.push('REAL_PARTY_MUST_BE_MERCHANT_PLUS_THREE_COMBAT');
    if (!lifecycle.lifecycle) failures.push('PARTY_LIFECYCLE_UNAVAILABLE');
    if (lifecycle.lifecycle && finite(lifecycle.lifecycle.maxDevelopmentSlots, 0) !== 1) failures.push('DEVELOPMENT_SLOT_BOUNDARY_INVALID');
    if (lifecycle.developmentCount > 1) failures.push('MULTIPLE_DEVELOPMENT_SLOTS');
    if (!lifecycle.controlled) failures.push('CONTROLLED_PARTY_LIFECYCLE_UNAVAILABLE');
    if (lifecycle.controlled && lifecycle.controlled.enabled) failures.push('PARTY_LIFECYCLE_NOT_DEFAULT_OFF');
    if (lifecycle.controlled && lifecycle.controlled.actionAuthority) failures.push('PARTY_LIFECYCLE_AUTHORITY_NOT_DEFAULT_OFF');
    if (lifecycle.controlled && lifecycle.controlled.developmentSession) failures.push('PREEXISTING_DEVELOPMENT_SESSION');
    if (lifecycle.controlled && lifecycle.controlled.operation && lifecycle.controlled.operation.state === 'RECOVERING') failures.push('PARTY_LIFECYCLE_RECONCILIATION_REQUIRED');
    if (lifecycle.controlled && lifecycle.controlled.breaker && lifecycle.controlled.breaker.open) failures.push('PARTY_LIFECYCLE_CIRCUIT_OPEN');
    if (!lifecycle.aura) failures.push('CONTROLLED_AURA_UNAVAILABLE');
    if (lifecycle.aura && (lifecycle.aura.enabled || lifecycle.aura.actionAuthority)) failures.push('AURA_NOT_DEFAULT_OFF');
    if (child && child.liveEnabled) failures.push('LEGACY_TRANSITION_CHILD_ENABLED');
    if (status.party && status.party.legacyTransitionBypassAllowed !== false) failures.push('LEGACY_TRANSITION_BYPASS_INVARIANT_FAILED');
    if (status.party && status.party.legacyAuraBypassAllowed !== false) failures.push('LEGACY_AURA_BYPASS_INVARIANT_FAILED');
    if (runtime && typeof runtime._alpha20EconomyEmergency === 'function' && runtime._alpha20EconomyEmergency()) failures.push('ECONOMY_EMERGENCY_ACTIVE');
    for (const [name, breaker] of Object.entries(this._circuits())) if (breaker && breaker.open) failures.push(`${String(name).toUpperCase()}_CIRCUIT_OPEN`);
    return {
      pass: failures.length === 0,
      failures: unique(failures),
      character: character ? { name: character.name || null, ctype: character.ctype || character.type || null, level: finite(character.level, 0), map: character.map || null } : null,
      supervisor: clone(supervisor),
      party,
      lifecycle,
      transitionChild: child,
      status: { version: status.version || null, mode: status.mode || null }
    };
  }

  _wrongAckProbe() {
    const runtime = this.runtime;
    const lifecycle = runtime && runtime.controlledPartyLifecycle;
    const aura = runtime && runtime.controlledPaladinAura;
    if (!lifecycle || typeof lifecycle.configure !== 'function') return { pass: false, reason: 'CONTROLLED_PARTY_LIFECYCLE_UNAVAILABLE' };
    if (!aura || typeof aura.configure !== 'function') return { pass: false, reason: 'CONTROLLED_AURA_UNAVAILABLE' };
    const lifecycleResult = lifecycle.configure({ enabled: true, ack: 'WRONG_ALPHA20_LIVE_GATE_ACK', allowTransitions: true, allowDevelopmentRotation: true });
    const lifecycleStatus = lifecycle.status();
    const auraResult = aura.configure({ enabled: true, ack: 'WRONG_ALPHA20_AURA_ACK' });
    const auraStatus = aura.status();
    const pass = !lifecycleStatus.enabled && !lifecycleStatus.transitionAuthority && !lifecycleStatus.developmentRotationAuthority && !auraStatus.enabled && !auraStatus.actionAuthority;
    lifecycle.disable('ALPHA20_LIVE_GATE_WRONG_ACK_PROBE_COMPLETE');
    aura.disable('ALPHA20_LIVE_GATE_WRONG_ACK_PROBE_COMPLETE');
    return {
      pass,
      reason: pass ? 'WRONG_ACKS_REJECTED' : 'WRONG_ACK_UNEXPECTEDLY_ENABLED',
      lifecycle: clone(lifecycleResult),
      aura: clone(auraResult)
    };
  }

  _context(currentMembers = this._currentMembers()) {
    const runtime = this.runtime;
    const snapshot = runtime && runtime.lastSnapshot;
    const encounter = runtime && runtime.currentEncounterFingerprint;
    let risk = null;
    try { if (runtime && snapshot && encounter && typeof runtime._riskContext === 'function') risk = runtime._riskContext(snapshot, encounter); } catch (_) {}
    const character = snapshot && snapshot.character || this._character() || {};
    return {
      currentNames: currentMembers.map((row) => row.name),
      inCombat: this._inCombat(),
      highRisk: !risk || risk.highRisk === true || risk.unknown === true,
      emergency: !!(runtime && runtime.pendingEmergencyRetreat),
      requiresCrossMapRouting: currentMembers.some((member) => member && member.online === true && member.map && character.map && member.map !== character.map),
      verifyTargetState: (targetNames) => runtime && typeof runtime._verifyLifecycleTarget === 'function' ? runtime._verifyLifecycleTarget(targetNames, snapshot) : false
    };
  }

  _candidateProbe() {
    const lifecycle = this._lifecycleSnapshot();
    const rows = lifecycle.lifecycle && lifecycle.lifecycle.characters || [];
    const promotions = rows.filter((row) => row && row.state === 'PROMOTION_CANDIDATE' && row.active !== true);
    const development = rows.filter((row) => row && row.state === 'DEVELOPMENT' && row.active !== true);
    return {
      pass: lifecycle.developmentCount <= 1,
      state: promotions.length ? 'PROMOTION_JUSTIFIED' : development.length ? 'DEVELOPMENT_AVAILABLE' : 'NO_CHANGE_JUSTIFIED',
      promotionCandidates: clone(promotions),
      developmentCandidates: clone(development),
      lifecycleEvaluations: finite(lifecycle.lifecycle && lifecycle.lifecycle.stats && lifecycle.lifecycle.stats.evaluations, 0),
      activeCombat: lifecycle.activeCombat.slice()
    };
  }

  _suppressAutomaticPartyDecisions() {
    const runtime = this.runtime;
    if (!runtime) return;
    this._savedDecisionAt = runtime.lastPartyDecisionAt;
    runtime.lastPartyDecisionAt = Number.POSITIVE_INFINITY;
  }

  _restoreAutomaticPartyDecisions() {
    const runtime = this.runtime;
    if (!runtime) return;
    runtime.lastPartyDecisionAt = this.now();
    this._savedDecisionAt = null;
  }

  async _transitionCanary(candidateProbe, config = {}) {
    const runtime = this.runtime;
    if (!runtime || !runtime.controlledPartyLifecycle) return { pass: false, state: 'FAILED', coverageSatisfied: false, reason: 'CONTROLLED_PARTY_LIFECYCLE_UNAVAILABLE', executed: false };
    const promotionsExist = !!(candidateProbe && candidateProbe.promotionCandidates && candidateProbe.promotionCandidates.length);
    if (config.allowControlledPartyTransition !== true) {
      return {
        pass: true,
        state: promotionsExist ? 'JUSTIFIED_NOT_AUTHORIZED' : 'NOT_JUSTIFIED',
        coverageSatisfied: false,
        reason: promotionsExist ? 'JUSTIFIED_PROMOTION_NOT_AUTHORIZED' : 'NO_CONTROLLED_PROMOTION_REQUIRED',
        executed: false,
        rawTransitionAttempts: 0
      };
    }

    const currentMembers = this._currentMembers();
    const registryStatus = runtime.characterRegistry && runtime.characterRegistry.status ? runtime.characterRegistry.status() : { characters: [] };
    const context = this._context(currentMembers);
    if (context.inCombat || context.highRisk || context.emergency || (typeof runtime._alpha20EconomyEmergency === 'function' && runtime._alpha20EconomyEmergency())) {
      return { pass: true, state: 'NOT_EXECUTED', coverageSatisfied: false, reason: 'UNSAFE_CONTEXT_NO_TRANSITION', context: clone({ ...context, verifyTargetState: undefined }), executed: false, rawTransitionAttempts: 0 };
    }
    if (context.requiresCrossMapRouting) {
      return { pass: true, state: 'NOT_EXECUTED', coverageSatisfied: false, reason: 'CROSS_MAP_ROUTING_NOT_AUTHORIZED', context: clone({ ...context, verifyTargetState: undefined }), executed: false, rawTransitionAttempts: 0 };
    }

    const before = runtime.controlledPartyLifecycle.status();
    let enableResult = null;
    let plan = null;
    let execution = null;
    this._suppressAutomaticPartyDecisions();
    try {
      runtime.setMode('active');
      enableResult = runtime.configureControlledPartyLifecycle({
        enabled: true,
        ack: CONTROLLED_PARTY_LIFECYCLE_ACK,
        allowTransitions: true,
        allowDevelopmentRotation: config.allowDevelopmentRotation === true,
        allowAuraChanges: false
      });
      const enabled = enableResult && enableResult.lifecycle;
      if (!enabled || enabled.enabled !== true || enabled.transitionAuthority !== true) {
        return { pass: false, state: 'FAILED', coverageSatisfied: false, reason: enabled && enabled.enableRejected || 'CONTROLLED_PARTY_ENABLE_FAILED', enabled: clone(enableResult), executed: false, rawTransitionAttempts: 0 };
      }
      plan = runtime.controlledPartyLifecycle.plan(currentMembers, registryStatus, context);
      if (!plan || plan.planned !== true) {
        return {
          pass: true,
          state: 'NOT_JUSTIFIED',
          coverageSatisfied: false,
          reason: plan && plan.reason || 'NO_ELIGIBLE_LIFECYCLE_CHANGE',
          enabled: clone(enableResult),
          plan: clone(plan),
          executed: false,
          rawTransitionAttempts: 0
        };
      }
      if (!ALLOWED_PLAN_KINDS.has(String(plan.kind || ''))) {
        return { pass: false, state: 'FAILED', coverageSatisfied: false, reason: 'UNKNOWN_PARTY_PLAN_KIND', plan: clone(plan), executed: false, rawTransitionAttempts: 0 };
      }
      if (plan.kind === 'DEVELOPMENT_ROTATION' && config.allowDevelopmentRotation !== true) {
        return { pass: false, state: 'FAILED', coverageSatisfied: false, reason: 'DEVELOPMENT_ROTATION_BYPASSED_EXPLICIT_BUDGET', plan: clone(plan), executed: false, rawTransitionAttempts: 0 };
      }
      if (plan.kind === 'DEVELOPMENT_RETURN') {
        return { pass: false, state: 'FAILED', coverageSatisfied: false, reason: 'PREEXISTING_DEVELOPMENT_RETURN_UNEXPECTED', plan: clone(plan), executed: false, rawTransitionAttempts: 0 };
      }
      execution = await runtime.controlledPartyLifecycle.executePlan(plan, currentMembers, registryStatus, context);
      const after = runtime.controlledPartyLifecycle.status();
      const attempts = delta(after.stats, before.stats, 'attempts');
      const committed = !!(execution && execution.executed === true && execution.operation && execution.operation.state === 'COMMITTED');
      const invariantFailures = [];
      if (attempts > 1) invariantFailures.push('MORE_THAN_ONE_CONTROLLED_TRANSITION_ATTEMPT');
      if (attempts > 0 && config.allowControlledPartyTransition !== true) invariantFailures.push('TRANSITION_WITHOUT_EXPLICIT_BUDGET');
      if (plan.kind === 'DEVELOPMENT_ROTATION' && !after.developmentSession) invariantFailures.push('DEVELOPMENT_SESSION_NOT_PERSISTED');
      if (plan.kind === 'PROMOTION' && after.developmentSession) invariantFailures.push('PROMOTION_CREATED_DEVELOPMENT_SESSION');
      return {
        pass: committed && invariantFailures.length === 0,
        state: committed ? 'COMMITTED' : 'FAILED',
        coverageSatisfied: committed,
        reason: execution && execution.reason || (committed ? 'CONTROLLED_PARTY_TRANSITION_COMMITTED' : 'CONTROLLED_PARTY_TRANSITION_FAILED'),
        enabled: clone(enableResult),
        plan: clone(plan),
        execution: clone(execution),
        executed: committed,
        rawTransitionAttempts: attempts,
        developmentSession: clone(after.developmentSession),
        invariantFailures
      };
    } finally {
      try { runtime.controlledPartyLifecycle.disable('ALPHA20_LIVE_GATE_CANARY_COMPLETE'); } catch (_) {}
      try { runtime.controlledPaladinAura.disable('ALPHA20_LIVE_GATE_CANARY_COMPLETE'); } catch (_) {}
      try { runtime.partyTransitions.setLiveEnabled(false); } catch (_) {}
      try { runtime.setMode('shadow'); } catch (_) {}
      try { if (runtime.setFarmerEnabled) runtime.setFarmerEnabled(false); } catch (_) {}
      this._restoreAutomaticPartyDecisions();
    }
  }

  _eventsSince(at) {
    const log = this.runtime && this.runtime.log;
    const rows = log && typeof log.list === 'function' ? log.list(5000) : [];
    return rows.filter((row) => {
      if (!row) return false;
      if (row.at != null && Number.isFinite(Number(row.at))) return Number(row.at) >= at;
      if (row.timestamp != null && Number.isFinite(Number(row.timestamp))) return Number(row.timestamp) >= at;
      if (row.ts != null) {
        const parsed = Date.parse(String(row.ts));
        return Number.isFinite(parsed) && parsed >= at;
      }
      return false;
    });
  }

  _sampleViolations(snapshot) {
    const violations = [];
    if (!snapshot) return ['STATUS_UNAVAILABLE'];
    if (snapshot.mode !== 'shadow') violations.push('RUNTIME_LEFT_SHADOW');
    if (snapshot.farmerEnabled) violations.push('FARMER_ENABLED_DURING_PASSIVE_OBSERVATION');
    if (!ALLOWED_SUPERVISOR.has(String(snapshot.supervisorState || ''))) violations.push('SUPERVISOR_DEGRADED_DURING_OBSERVATION');
    if (snapshot.economyEmergency) violations.push('ECONOMY_EMERGENCY_DURING_OBSERVATION');
    if (!snapshot.party || !snapshot.party.valid) violations.push('FOUR_CHARACTER_PARTY_INVALID_DURING_OBSERVATION');
    const life = snapshot.lifecycle || {};
    if (life.maxDevelopmentSlots !== 1) violations.push('DEVELOPMENT_SLOT_BOUNDARY_INVALID');
    if (life.developmentCount > 1) violations.push('MULTIPLE_DEVELOPMENT_SLOTS');
    if (life.controlledEnabled) violations.push('CONTROLLED_PARTY_ENABLED_DURING_OBSERVATION');
    if (life.transitionAuthority) violations.push('PARTY_TRANSITION_AUTHORITY_DURING_OBSERVATION');
    if (life.developmentRotationAuthority) violations.push('DEVELOPMENT_AUTHORITY_DURING_OBSERVATION');
    if (life.auraEnabled || life.auraAuthority) violations.push('AURA_AUTHORITY_DURING_OBSERVATION');
    if (life.breaker && life.breaker.open) violations.push('PARTY_LIFECYCLE_CIRCUIT_OPEN');
    const legacy = snapshot.legacy || {};
    if (legacy.transitionChildLive) violations.push('LEGACY_TRANSITION_CHILD_ENABLED');
    if (legacy.auraAutomationEnabled) violations.push('LEGACY_AURA_AUTOMATION_ENABLED');
    if (legacy.transitionBypassAllowed) violations.push('LEGACY_TRANSITION_BYPASS_ALLOWED');
    if (legacy.auraBypassAllowed) violations.push('LEGACY_AURA_BYPASS_ALLOWED');
    const economy = snapshot.controlledEconomy || {};
    for (const key of ['spaceRecoveryEnabled', 'consolidationEnabled', 'merchantEnabled', 'expansionEnabled', 'travelEnabled', 'expansionPurchaseAuthority', 'emergencyReclaimAuthority']) {
      if (economy[key]) violations.push(`ECONOMY_${key.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()}_DURING_OBSERVATION`);
    }
    for (const [name, breaker] of Object.entries(snapshot.circuits || {})) if (breaker && breaker.open) violations.push(`${String(name).toUpperCase()}_CIRCUIT_OPEN`);
    return unique(violations);
  }

  async _observeWindow() {
    const runtime = this.runtime;
    const startedAt = this.now();
    const beforeLifecycle = runtime.controlledPartyLifecycle.status();
    const beforeAura = runtime.controlledPaladinAura.status();
    const beforeEconomy = this._controlledEconomySnapshot();
    const beforeEconomyStats = {
      spaceRecovery: clone(beforeEconomy.spaceRecovery && beforeEconomy.spaceRecovery.stats || {}),
      consolidation: clone(beforeEconomy.consolidation && beforeEconomy.consolidation.stats || {}),
      merchant: clone(beforeEconomy.merchant && beforeEconomy.merchant.stats || {}),
      expansion: clone(beforeEconomy.expansion && beforeEconomy.expansion.stats || {}),
      travel: clone(beforeEconomy.travel && beforeEconomy.travel.stats || {})
    };
    const samples = [];
    const violations = [];
    let elapsed = 0;
    this.countdown.start(this.observationMs, 'Alpha.20 Live Gate');
    do {
      this._refreshShadowEvidence();
      const snapshot = this._safeStateSnapshot();
      const sampleViolations = this._sampleViolations(snapshot);
      for (const reason of sampleViolations) violations.push({ at: this.now(), reason });
      samples.push(snapshot);
      this.countdown.tick(this.now());
      if (this.observationMs <= 0 || elapsed >= this.observationMs) break;
      const step = Math.min(this.sampleMs, this.observationMs - elapsed);
      await this.sleep(step);
      elapsed += step;
    } while (elapsed <= this.observationMs);
    this.countdown.tick(this.now());

    const finishedAt = this.now();
    const afterLifecycle = runtime.controlledPartyLifecycle.status();
    const afterAura = runtime.controlledPaladinAura.status();
    const afterEconomy = this._controlledEconomySnapshot();
    const unexpectedActionDeltas = {
      partyTransitionAttempts: delta(afterLifecycle.stats, beforeLifecycle.stats, 'attempts'),
      auraAttempts: delta(afterAura.stats, beforeAura.stats, 'attempts'),
      spaceRecoveryAttempts: delta(afterEconomy.spaceRecovery && afterEconomy.spaceRecovery.stats, beforeEconomyStats.spaceRecovery, 'attempts'),
      consolidationAttempts: delta(afterEconomy.consolidation && afterEconomy.consolidation.stats, beforeEconomyStats.consolidation, 'attempts'),
      merchantAttempts: delta(afterEconomy.merchant && afterEconomy.merchant.stats, beforeEconomyStats.merchant, 'attempts'),
      expansionAttempts: delta(afterEconomy.expansion && afterEconomy.expansion.stats, beforeEconomyStats.expansion, 'attempts'),
      travelAttempts: delta(afterEconomy.travel && afterEconomy.travel.stats, beforeEconomyStats.travel, 'attempts')
    };
    for (const [key, value] of Object.entries(unexpectedActionDeltas)) if (value > 0) violations.push({ at: finishedAt, reason: `${key.replace(/Attempts$/, '').toUpperCase()}_ATTEMPT_DURING_PASSIVE_WINDOW` });
    const events = this._eventsSince(startedAt);
    const errorEvents = events.filter((row) => String(row && row.severity || '').toLowerCase() === 'error');
    if (errorEvents.length) violations.push({ at: finishedAt, reason: 'ERROR_EVENT_DURING_PASSIVE_WINDOW' });
    const first = samples[0] || null;
    const last = samples[samples.length - 1] || null;
    const fourCharacterCoverage = samples.length > 0 && samples.every((row) => row && row.party && row.party.valid);
    const lifecycleEvaluationCoverage = !!(last && last.lifecycle && last.lifecycle.evaluations > 0 && last.lifecycle.maxDevelopmentSlots === 1 && last.lifecycle.activeCombat.length === 3);
    return {
      pass: violations.length === 0,
      startedAt,
      finishedAt,
      requiredObservationMs: REQUIRED_OBSERVATION_MS,
      configuredObservationMs: this.observationMs,
      confirmationDurationSatisfied: !this.testMode && this.observationMs >= REQUIRED_OBSERVATION_MS,
      sampleCount: samples.length,
      fourCharacterCoverage,
      lifecycleEvaluationCoverage,
      firstSample: clone(first),
      lastSample: clone(last),
      violations: clone(violations),
      errorEvents: clone(errorEvents.slice(-50)),
      unexpectedActionDeltas,
      countdown: this.countdown.status(finishedAt)
    };
  }

  _resultText(result) {
    return `=== ALPHA20 FULL LIVE GATE RESULT BEGIN ===\n${JSON.stringify(result, null, 2)}\n=== ALPHA20 FULL LIVE GATE RESULT END ===`;
  }

  _publish(result) {
    this.lastResult = clone(result);
    const text = this._resultText(result);
    this.lastResultText = text;
    try { this.root.AIO_V3_ALPHA20_LIVE_GATE_RESULT = clone(result); } catch (_) {}
    try { this.root.AIO_V3_ALPHA20_LIVE_GATE_RESULT_TEXT = text; } catch (_) {}
    const consoles = [this.root && this.root.console, this.root && this.root.parent && this.root.parent.console].filter(Boolean);
    for (const target of consoles) {
      try { if (target && typeof target.log === 'function') target.log(text); } catch (_) {}
    }
    this._gameLog(`[AIO v3 ${RELEASE_VERSION}] ALPHA20 LIVE GATE ${result.pass ? 'PASS' : 'FAIL'} | confirmationEligible=${result.confirmationEligible} | transition=${result.transitionCanary && result.transitionCanary.state || 'n/a'}`);
    return text;
  }

  async run(config = {}) {
    if (this.running) return { accepted: false, reason: 'ALPHA20_LIVE_GATE_ALREADY_RUNNING', status: this.status() };
    if (config.ack !== ALPHA20_LIVE_GATE_ACK) return { accepted: false, reason: 'ALPHA20_LIVE_GATE_ACK_REQUIRED', requiredAck: ALPHA20_LIVE_GATE_ACK };
    if (!this.runtime) return { accepted: false, reason: 'RUNTIME_UNAVAILABLE' };

    this.running = true;
    this.phase = 'SAFE_STATE';
    this.startedAt = this.now();
    this.lastResult = null;
    this.lastResultText = null;
    this._event('ALPHA20_LIVE_GATE_STARTED', 'warn', 'EXPLICIT_OPERATOR_ACK', {
      observationMs: this.observationMs,
      allowControlledPartyTransition: config.allowControlledPartyTransition === true,
      allowDevelopmentRotation: config.allowDevelopmentRotation === true,
      auraExecutionAuthority: false,
      testMode: this.testMode
    });
    this._gameLog(`[AIO v3 ${RELEASE_VERSION}] Alpha.20 Live Gate gestartet.`);

    let result;
    try {
      await this._normalizeSafeState();
      this._refreshShadowEvidence();
      this.phase = 'PRECHECK';
      const precheck = this._precheck();
      const wrongAckProbe = this._wrongAckProbe();
      const candidateProbe = this._candidateProbe();
      if (!precheck.pass || !wrongAckProbe.pass || !candidateProbe.pass) {
        result = {
          schemaVersion: 1,
          release: RELEASE_VERSION,
          pass: false,
          confirmationEligible: false,
          confirmationBlockers: ['PRECHECK_FAILED'],
          startedAt: this.startedAt,
          finishedAt: this.now(),
          testMode: this.testMode,
          precheck,
          wrongAckProbe,
          candidateProbe,
          transitionCanary: { pass: false, state: 'NOT_RUN', coverageSatisfied: false, reason: 'PRECHECK_FAILED', executed: false },
          passiveObservation: null,
          finalSafeState: this._safeStateSnapshot()
        };
        return result;
      }

      this.phase = 'OPTIONAL_CONTROLLED_TRANSITION';
      const transitionCanary = await this._transitionCanary(candidateProbe, config);
      await this._normalizeSafeState('ALPHA20_LIVE_GATE_POST_CANARY_SAFE_STATE');

      this.phase = 'PASSIVE_OBSERVATION';
      const passiveObservation = await this._observeWindow();
      await this._normalizeSafeState('ALPHA20_LIVE_GATE_FINAL_SAFE_STATE');
      const finalSafeState = this._safeStateSnapshot();
      const finalViolations = this._sampleViolations(finalSafeState);
      const pass = precheck.pass && wrongAckProbe.pass && candidateProbe.pass && transitionCanary.pass && passiveObservation.pass && finalViolations.length === 0;
      const confirmationBlockers = [];
      if (!passiveObservation.fourCharacterCoverage) confirmationBlockers.push('FOUR_CHARACTER_COVERAGE_NOT_SATISFIED');
      if (!passiveObservation.lifecycleEvaluationCoverage) confirmationBlockers.push('LIFECYCLE_EVALUATION_COVERAGE_NOT_SATISFIED');
      if (candidateProbe.promotionCandidates.length > 0 && !transitionCanary.coverageSatisfied) confirmationBlockers.push(transitionCanary.reason || 'JUSTIFIED_PROMOTION_NOT_EXERCISED');
      if (!passiveObservation.confirmationDurationSatisfied) confirmationBlockers.push('FULL_10_MIN_OBSERVATION_NOT_SATISFIED');
      if (this.testMode) confirmationBlockers.push('TEST_MODE_NOT_CONFIRMATION_ELIGIBLE');
      const confirmationEligible = pass && confirmationBlockers.length === 0;
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass,
        confirmationEligible,
        confirmationBlockers: unique(confirmationBlockers),
        startedAt: this.startedAt,
        finishedAt: this.now(),
        testMode: this.testMode,
        policy: {
          requiredAck: ALPHA20_LIVE_GATE_ACK,
          controlledPartyTransitionExplicitlyAllowed: config.allowControlledPartyTransition === true,
          developmentRotationExplicitlyAllowed: config.allowDevelopmentRotation === true,
          auraExecutionAuthority: false,
          remoteAuraExecutionForbidden: true,
          forcedCandidate: false,
          forcedPerformanceEvidence: false,
          crossMapRoutingAuthority: false,
          smartMoveAuthority: false,
          serverChangeAuthority: false,
          brainGameplayAuthority: false,
          maxDevelopmentSlots: 1,
          maxControlledTransitionAttempts: 1,
          observationRequiredMs: REQUIRED_OBSERVATION_MS
        },
        precheck,
        wrongAckProbe,
        candidateProbe,
        transitionCanary,
        auraCoverage: {
          boundaryCovered: wrongAckProbe.pass,
          liveExecutionAttempted: false,
          reason: 'MERCHANT_GATE_CANNOT_EXECUTE_REMOTE_PALADIN_AURA',
          requiredAck: CONTROLLED_PALADIN_AURA_ACK
        },
        passiveObservation,
        finalSafeState,
        finalViolations
      };
      return result;
    } catch (error) {
      result = {
        schemaVersion: 1,
        release: RELEASE_VERSION,
        pass: false,
        confirmationEligible: false,
        confirmationBlockers: ['UNCAUGHT_GATE_ERROR'],
        startedAt: this.startedAt,
        finishedAt: this.now(),
        testMode: this.testMode,
        error: String(error && error.message || error),
        finalSafeState: null
      };
      this._event('ALPHA20_LIVE_GATE_FAILED', 'error', 'UNCAUGHT_GATE_ERROR', { message: result.error });
      return result;
    } finally {
      try { await this._normalizeSafeState('ALPHA20_LIVE_GATE_FINALLY_SAFE_STATE'); } catch (_) {}
      this._restoreAutomaticPartyDecisions();
      if (result) {
        result.finishedAt = result.finishedAt == null ? this.now() : result.finishedAt;
        result.finalSafeState = result.finalSafeState || this._safeStateSnapshot();
        this._publish(result);
        this._event('ALPHA20_LIVE_GATE_FINISHED', result.pass ? 'info' : 'error', result.pass ? 'PASS' : 'FAIL', {
          confirmationEligible: result.confirmationEligible,
          transitionState: result.transitionCanary && result.transitionCanary.state || null
        });
      }
      this.phase = 'COMPLETE';
      this.running = false;
    }
  }

  status() {
    return {
      schemaVersion: 1,
      release: RELEASE_VERSION,
      requiredAck: ALPHA20_LIVE_GATE_ACK,
      running: this.running,
      phase: this.phase,
      startedAt: this.startedAt,
      observationMs: this.observationMs,
      requiredObservationMs: REQUIRED_OBSERVATION_MS,
      testMode: this.testMode,
      countdown: this.countdown.status(),
      lastResult: clone(this.lastResult)
    };
  }

  result() { return clone(this.lastResult); }
  resultText() { return this.lastResultText; }
}

module.exports = {
  Alpha20CombinedLiveGate,
  ALPHA20_LIVE_GATE_ACK,
  REQUIRED_OBSERVATION_MS
};