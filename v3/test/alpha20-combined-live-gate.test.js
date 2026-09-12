'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha20CombinedLiveGate, ALPHA20_LIVE_GATE_ACK, REQUIRED_OBSERVATION_MS } = require('../src/ops/alpha20-combined-live-gate');
const { RELEASE_VERSION } = require('../src/release-version');
const { CONTROLLED_PARTY_LIFECYCLE_ACK } = require('../src/party/controlled-lifecycle-coordinator');
const { CONTROLLED_PALADIN_AURA_ACK } = require('../src/party/controlled-paladin-aura-executor');

function closedBreaker() {
  return { open: false, openUntil: null, reason: null, failuresInWindow: 0 };
}

function disabledStatus(extra = {}) {
  return { enabled: false, actionAuthority: false, stats: { attempts: 0 }, ...extra };
}

function fixture(options = {}) {
  const clock = { now: 1_000_000 };
  const gameLogs = [];
  const events = [];
  const members = options.members || [
    { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerA', ctype: 'ranger', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerB', ctype: 'ranger', level: 79, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerC', ctype: 'ranger', level: 78, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 }
  ];
  const lifecycleRows = options.lifecycleRows || [
    { name: 'RangerA', state: 'ACTIVE', active: true, currentScore: 0.84, projectedScore: 0.85 },
    { name: 'RangerB', state: 'ACTIVE', active: true, currentScore: 0.82, projectedScore: 0.83 },
    { name: 'RangerC', state: 'ACTIVE', active: true, currentScore: 0.80, projectedScore: 0.81 }
  ];
  const lifecycleState = {
    maxDevelopmentSlots: 1,
    stats: { evaluations: options.evaluations == null ? 1 : options.evaluations },
    characters: lifecycleRows
  };
  const controlledState = {
    enabled: false,
    actionAuthority: false,
    transitionAuthority: false,
    developmentRotationAuthority: false,
    maxDevelopmentSlots: 1,
    busy: false,
    operation: null,
    developmentSession: null,
    breaker: closedBreaker(),
    stats: { attempts: 0, committed: 0, aborted: 0, failedSafe: 0, rejected: 0, developmentRotations: 0, promotions: 0 },
    serverChangeAllowed: false,
    smartMoveAllowed: false,
    crossMapRoutingAllowed: false
  };
  const auraState = {
    enabled: false,
    actionAuthority: false,
    stats: { attempts: 0, changed: 0, rejected: 0 },
    allowedAuras: ['bulwark', 'sanctuary', 'zeal', 'warding']
  };
  const transitionState = { liveEnabled: false, active: null };
  const economy = {
    spaceRecovery: disabledStatus({ expansionPurchaseAuthority: false, emergencyReclaimAuthority: false }),
    consolidation: disabledStatus(),
    merchant: disabledStatus(),
    expansion: disabledStatus(),
    travel: disabledStatus()
  };
  const root = {
    character: { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', hp: 1000, max_hp: 1000, rip: false, target: null },
    parent: { entities: {} },
    game_log(message) { gameLogs.push(String(message)); },
    console: { log() {} }
  };
  let mode = 'shadow';
  let farmerEnabled = false;
  let executeCalls = 0;
  let planCalls = 0;

  const controlledPartyLifecycle = {
    status() { return JSON.parse(JSON.stringify(controlledState)); },
    breaker() { return JSON.parse(JSON.stringify(controlledState.breaker)); },
    configure(config = {}) {
      if (config.enabled !== true) return this.disable(config.reason || 'DISABLED');
      if (config.ack !== CONTROLLED_PARTY_LIFECYCLE_ACK) {
        controlledState.enabled = false;
        controlledState.actionAuthority = false;
        controlledState.transitionAuthority = false;
        controlledState.developmentRotationAuthority = false;
        controlledState.stats.rejected += 1;
        return { ...this.status(), enableRejected: 'WRONG_ACK' };
      }
      controlledState.enabled = true;
      controlledState.transitionAuthority = config.allowTransitions === true;
      controlledState.developmentRotationAuthority = controlledState.transitionAuthority && config.allowDevelopmentRotation === true;
      controlledState.actionAuthority = controlledState.transitionAuthority;
      return this.status();
    },
    disable() {
      controlledState.enabled = false;
      controlledState.actionAuthority = false;
      controlledState.transitionAuthority = false;
      controlledState.developmentRotationAuthority = false;
      transitionState.liveEnabled = false;
      return this.status();
    },
    plan(currentMembers, registryStatus, context) {
      planCalls += 1;
      if (!controlledState.enabled) return { planned: false, reason: 'CONTROLLED_PARTY_LIFECYCLE_DISABLED' };
      if (context.inCombat) return { planned: false, reason: 'ACTIVE_COMBAT' };
      const promotion = lifecycleState.characters.find((row) => row.state === 'PROMOTION_CANDIDATE' && row.active !== true);
      if (!promotion) return { planned: false, reason: 'NO_ELIGIBLE_LIFECYCLE_CHANGE' };
      const outgoing = currentMembers.filter((row) => row.ctype !== 'merchant').slice().sort((a, b) => a.level - b.level)[0];
      const merchant = currentMembers.find((row) => row.ctype === 'merchant');
      const targetNames = [merchant.name, ...currentMembers.filter((row) => row.ctype !== 'merchant' && row.name !== outgoing.name).map((row) => row.name), promotion.name];
      const byName = new Map(registryStatus.characters.map((row) => [row.name, row]));
      return {
        planned: true,
        kind: 'PROMOTION',
        incoming: promotion.name,
        outgoing: outgoing.name,
        targetNames,
        members: targetNames.map((name) => byName.get(name)).filter(Boolean),
        merchant,
        evidence: { incoming: promotion, outgoing: { name: outgoing.name, currentScore: 0.80 }, context: { currentNames: currentMembers.map((row) => row.name) } }
      };
    },
    async executePlan(plan) {
      executeCalls += 1;
      controlledState.stats.attempts += 1;
      if (options.transitionFails) {
        controlledState.stats.aborted += 1;
        return { executed: false, reason: 'VERIFY_FAILED', operation: { state: 'ABORTED' } };
      }
      controlledState.stats.committed += 1;
      const incoming = members.find((row) => row.name === plan.incoming) || { name: plan.incoming, ctype: 'rogue', level: 75, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 };
      const outgoingIndex = members.findIndex((row) => row.name === plan.outgoing);
      if (outgoingIndex >= 0) members[outgoingIndex] = incoming;
      return { executed: true, operation: { state: 'COMMITTED', plan }, transition: { executed: true } };
    }
  };

  const controlledPaladinAura = {
    status() { return JSON.parse(JSON.stringify(auraState)); },
    configure(config = {}) {
      if (config.enabled !== true) return this.disable();
      if (config.ack !== CONTROLLED_PALADIN_AURA_ACK) {
        auraState.stats.rejected += 1;
        auraState.enabled = false;
        auraState.actionAuthority = false;
        return { ...this.status(), enableRejected: 'WRONG_ACK' };
      }
      auraState.enabled = true;
      auraState.actionAuthority = true;
      return this.status();
    },
    disable() { auraState.enabled = false; auraState.actionAuthority = false; return this.status(); }
  };

  function economyExecutor(key) {
    return {
      status() { return JSON.parse(JSON.stringify(economy[key])); },
      disable() { economy[key].enabled = false; economy[key].actionAuthority = false; return this.status(); }
    };
  }

  const runtime = {
    root,
    now: () => clock.now,
    log: {
      emit(row) { events.push({ at: clock.now, ...row }); },
      list() { return events.slice(); }
    },
    adapter: { get mode() { return mode; } },
    globalSupervisor: { status: () => ({ state: options.supervisorState || 'HEALTHY' }) },
    lastSnapshot: { character: root.character, party: members.slice(1), entities: [] },
    currentEncounterFingerprint: { contentDisposition: 'KNOWN', monster: { mtype: 'goo' } },
    lastPartyDecisionAt: 0,
    partyLifecycle: { status: () => JSON.parse(JSON.stringify(lifecycleState)) },
    controlledPartyLifecycle,
    controlledPaladinAura,
    partyTransitions: {
      status: () => JSON.parse(JSON.stringify(transitionState)),
      setLiveEnabled(value) { transitionState.liveEnabled = value === true; return transitionState.liveEnabled; }
    },
    auraAutomationEnabled: false,
    controlledMerchantSpaceRecovery: economyExecutor('spaceRecovery'),
    controlledBankConsolidation: economyExecutor('consolidation'),
    controlledMerchant: economyExecutor('merchant'),
    controlledBankExpansion: economyExecutor('expansion'),
    controlledTravel: economyExecutor('travel'),
    transactionEngine: { status: () => ({ circuits: { SELL: closedBreaker(), BANK: closedBreaker() } }) },
    safeTravel: { breaker: closedBreaker },
    bankExpansionTransactions: { breaker: closedBreaker },
    merchantSpaceRecoveryJournal: { breaker: closedBreaker },
    characterRegistry: { status: () => ({ characters: members.slice() }) },
    _currentMembers() { return members.slice(); },
    _riskContext() { return options.highRisk ? { highRisk: true, unknown: false } : { highRisk: false, unknown: false }; },
    _verifyLifecycleTarget() { return true; },
    _alpha20EconomyEmergency() { return options.economyEmergency === true; },
    _partyDecisionCycle() { lifecycleState.stats.evaluations += 1; return null; },
    tick() { this.lastSnapshot.party = members.filter((row) => row.name !== 'MerchantA'); },
    status() {
      return {
        version: options.version || RELEASE_VERSION,
        mode,
        farmer: { enabled: farmerEnabled },
        party: {
          aura: { automationEnabled: this.auraAutomationEnabled },
          legacyTransitionBypassAllowed: false,
          legacyAuraBypassAllowed: false
        }
      };
    },
    farmerStatus() { return { enabled: farmerEnabled }; },
    setFarmerEnabled(value) { farmerEnabled = value === true; return farmerEnabled; },
    setMode(value) { mode = value === 'active' ? 'active' : 'shadow'; return mode; },
    configureControlledPartyLifecycle(config) {
      const lifecycle = controlledPartyLifecycle.configure(config);
      const aura = config.enabled && config.allowAuraChanges ? controlledPaladinAura.configure({ enabled: true, ack: config.auraAck }) : controlledPaladinAura.disable();
      return { lifecycle, aura };
    },
    _gameLog(message) { gameLogs.push(String(message)); }
  };

  const sleep = async (ms) => {
    clock.now += ms;
    if (typeof options.onSleep === 'function') options.onSleep({ ms, clock, events, runtime, lifecycleState, controlledState });
  };

  const gate = new Alpha20CombinedLiveGate({
    runtime,
    root,
    now: () => clock.now,
    testMode: options.testMode !== false,
    observationMs: options.observationMs == null ? 10 : options.observationMs,
    sampleMs: options.sampleMs == null ? 1 : options.sampleMs,
    sleep
  });

  return {
    gate,
    runtime,
    root,
    clock,
    gameLogs,
    events,
    members,
    lifecycleState,
    controlledState,
    auraState,
    transitionState,
    executeCalls: () => executeCalls,
    planCalls: () => planCalls
  };
}

test('Alpha.20 combined live gate requires its own exact acknowledgement', async () => {
  const f = fixture();
  const result = await f.gate.run({ ack: 'WRONG_ACK' });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'ALPHA20_LIVE_GATE_ACK_REQUIRED');
  assert.equal(f.executeCalls(), 0);
});

test('precheck rejects anything other than a real Merchant plus three combat characters with zero transition calls', async () => {
  const f = fixture({ members: [
    { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE' },
    { name: 'RangerA', ctype: 'ranger', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE' },
    { name: 'RangerB', ctype: 'ranger', level: 79, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE' }
  ] });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: true });
  assert.equal(result.pass, false);
  assert.ok(result.precheck.failures.includes('REAL_PARTY_MUST_BE_MERCHANT_PLUS_THREE_COMBAT'));
  assert.equal(f.executeCalls(), 0);
  assert.equal(f.controlledState.enabled, false);
  assert.equal(f.auraState.enabled, false);
});

test('wrong lifecycle and aura acknowledgements cannot leave live authority enabled', async () => {
  const f = fixture({ observationMs: 0 });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK });
  assert.equal(result.wrongAckProbe.pass, true);
  assert.equal(result.wrongAckProbe.lifecycle.enableRejected, 'WRONG_ACK');
  assert.equal(result.wrongAckProbe.aura.enableRejected, 'WRONG_ACK');
  assert.equal(f.controlledState.enabled, false);
  assert.equal(f.controlledState.transitionAuthority, false);
  assert.equal(f.auraState.enabled, false);
  assert.equal(f.executeCalls(), 0);
});

test('a real stable four-character production observation is confirmation eligible without fabricating a party change', async () => {
  const f = fixture({ testMode: false });
  const result = await f.gate.run({
    ack: ALPHA20_LIVE_GATE_ACK,
    allowControlledPartyTransition: true,
    allowDevelopmentRotation: false
  });
  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, true);
  assert.deepEqual(result.confirmationBlockers, []);
  assert.equal(result.precheck.party.valid, true);
  assert.equal(result.candidateProbe.state, 'NO_CHANGE_JUSTIFIED');
  assert.equal(result.transitionCanary.state, 'NOT_JUSTIFIED');
  assert.equal(result.transitionCanary.executed, false);
  assert.equal(result.passiveObservation.configuredObservationMs, REQUIRED_OBSERVATION_MS);
  assert.equal(result.passiveObservation.confirmationDurationSatisfied, true);
  assert.equal(result.passiveObservation.fourCharacterCoverage, true);
  assert.equal(result.passiveObservation.lifecycleEvaluationCoverage, true);
  assert.equal(f.executeCalls(), 0);
  assert.equal(result.finalSafeState.mode, 'shadow');
  assert.equal(result.finalSafeState.lifecycle.controlledEnabled, false);
  assert.equal(result.finalSafeState.lifecycle.auraEnabled, false);
});

test('shortened test mode can pass safety invariants but can never become confirmation eligible', async () => {
  const f = fixture({ observationMs: 5, sampleMs: 1 });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: true });
  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, false);
  assert.ok(result.confirmationBlockers.includes('FULL_10_MIN_OBSERVATION_NOT_SATISFIED'));
  assert.ok(result.confirmationBlockers.includes('TEST_MODE_NOT_CONFIRMATION_ELIGIBLE'));
});

test('a real Promotion candidate becomes a confirmation blocker when operator does not authorize the controlled transition', async () => {
  const candidate = { name: 'RogueA', ctype: 'rogue', level: 76, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 };
  const f = fixture({
    members: [
      { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
      { name: 'RangerA', ctype: 'ranger', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
      { name: 'RangerB', ctype: 'ranger', level: 79, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
      { name: 'RangerC', ctype: 'ranger', level: 78, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
      candidate
    ],
    lifecycleRows: [
      { name: 'RangerA', state: 'ACTIVE', active: true, currentScore: 0.84 },
      { name: 'RangerB', state: 'ACTIVE', active: true, currentScore: 0.82 },
      { name: 'RangerC', state: 'ACTIVE', active: true, currentScore: 0.80 },
      { name: 'RogueA', state: 'PROMOTION_CANDIDATE', active: false, currentScore: 0.90, promotionStreak: 3 }
    ],
    observationMs: 0
  });
  // _currentMembers must still represent the actual four-person party; registry may contain the candidate.
  f.runtime._currentMembers = () => f.members.filter((row) => row.name !== 'RogueA');
  f.runtime.characterRegistry.status = () => ({ characters: f.members.slice() });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: false });
  assert.equal(result.pass, true);
  assert.equal(result.confirmationEligible, false);
  assert.equal(result.transitionCanary.state, 'JUSTIFIED_NOT_AUTHORIZED');
  assert.ok(result.confirmationBlockers.includes('JUSTIFIED_PROMOTION_NOT_AUTHORIZED'));
  assert.equal(f.executeCalls(), 0);
});

test('an explicitly authorized real Promotion executes at most one controlled transition and returns every authority default-off', async () => {
  const current = [
    { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerA', ctype: 'ranger', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerB', ctype: 'ranger', level: 79, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerC', ctype: 'ranger', level: 78, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RogueA', ctype: 'rogue', level: 76, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 }
  ];
  const f = fixture({
    members: current,
    lifecycleRows: [
      { name: 'RangerA', state: 'ACTIVE', active: true, currentScore: 0.84 },
      { name: 'RangerB', state: 'ACTIVE', active: true, currentScore: 0.82 },
      { name: 'RangerC', state: 'ACTIVE', active: true, currentScore: 0.80 },
      { name: 'RogueA', state: 'PROMOTION_CANDIDATE', active: false, currentScore: 0.90, promotionStreak: 3 }
    ],
    observationMs: 3,
    sampleMs: 1
  });
  const actualParty = () => f.members.filter((row) => row.name !== 'RogueA').slice(0, 4);
  let before = true;
  f.runtime._currentMembers = () => before ? actualParty() : f.members.filter((row) => row.name !== 'RangerC').slice(0, 4);
  f.runtime.characterRegistry.status = () => ({ characters: f.members.slice() });
  const originalExecute = f.runtime.controlledPartyLifecycle.executePlan;
  f.runtime.controlledPartyLifecycle.executePlan = async (...args) => {
    const result = await originalExecute(...args);
    before = false;
    f.lifecycleState.characters = [
      { name: 'RangerA', state: 'ACTIVE', active: true, currentScore: 0.84 },
      { name: 'RangerB', state: 'ACTIVE', active: true, currentScore: 0.82 },
      { name: 'RangerC', state: 'BENCH', active: false, currentScore: 0.80 },
      { name: 'RogueA', state: 'ACTIVE', active: true, currentScore: 0.90 }
    ];
    return result;
  };
  const result = await f.gate.run({
    ack: ALPHA20_LIVE_GATE_ACK,
    allowControlledPartyTransition: true,
    allowDevelopmentRotation: false
  });
  assert.equal(result.transitionCanary.state, 'COMMITTED');
  assert.equal(result.transitionCanary.rawTransitionAttempts, 1);
  assert.equal(f.executeCalls(), 1);
  assert.equal(result.finalSafeState.lifecycle.controlledEnabled, false);
  assert.equal(result.finalSafeState.lifecycle.transitionAuthority, false);
  assert.equal(result.finalSafeState.lifecycle.auraEnabled, false);
  assert.equal(result.finalSafeState.legacy.transitionChildLive, false);
});

test('cross-map context never receives transition authority even with a real Promotion candidate and explicit budget', async () => {
  const rows = [
    { name: 'MerchantA', ctype: 'merchant', level: 80, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerA', ctype: 'ranger', level: 80, map: 'winterland', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerB', ctype: 'ranger', level: 79, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RangerC', ctype: 'ranger', level: 78, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 },
    { name: 'RogueA', ctype: 'rogue', level: 76, map: 'main', online: true, available: true, dead: false, presence: 'ONLINE', stateConfidence: 1 }
  ];
  const f = fixture({
    members: rows,
    lifecycleRows: [
      { name: 'RangerA', state: 'ACTIVE', active: true, currentScore: 0.84 },
      { name: 'RangerB', state: 'ACTIVE', active: true, currentScore: 0.82 },
      { name: 'RangerC', state: 'ACTIVE', active: true, currentScore: 0.80 },
      { name: 'RogueA', state: 'PROMOTION_CANDIDATE', active: false, currentScore: 0.90 }
    ],
    observationMs: 0
  });
  f.runtime._currentMembers = () => rows.slice(0, 4);
  f.runtime.characterRegistry.status = () => ({ characters: rows.slice() });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: true });
  assert.equal(result.transitionCanary.state, 'NOT_EXECUTED');
  assert.equal(result.transitionCanary.reason, 'CROSS_MAP_ROUTING_NOT_AUTHORIZED');
  assert.equal(result.transitionCanary.rawTransitionAttempts, 0);
  assert.equal(f.executeCalls(), 0);
});

test('more than one Development slot fails precheck before any controlled action', async () => {
  const f = fixture({
    lifecycleRows: [
      { name: 'RangerA', state: 'ACTIVE', active: true },
      { name: 'RangerB', state: 'DEVELOPMENT', active: false, projectedScore: 0.9 },
      { name: 'RangerC', state: 'DEVELOPMENT', active: false, projectedScore: 0.88 }
    ],
    observationMs: 0
  });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: true });
  assert.equal(result.pass, false);
  assert.ok(result.precheck.failures.includes('MULTIPLE_DEVELOPMENT_SLOTS'));
  assert.equal(f.executeCalls(), 0);
});

test('passive observation fails closed on a new ISO timestamped error event', async () => {
  let inserted = false;
  const f = fixture({
    observationMs: 5,
    sampleMs: 1,
    onSleep({ clock, events }) {
      if (!inserted) {
        inserted = true;
        events.push({ ts: new Date(clock.now).toISOString(), severity: 'error', component: 'synthetic', event: 'SYNTHETIC_ERROR' });
      }
    }
  });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: true });
  assert.equal(result.pass, false);
  assert.ok(result.passiveObservation.violations.some((row) => row.reason === 'ERROR_EVENT_DURING_PASSIVE_WINDOW'));
  assert.ok(result.passiveObservation.errorEvents.some((row) => row.event === 'SYNTHETIC_ERROR'));
  assert.equal(result.finalSafeState.lifecycle.controlledEnabled, false);
});

test('production countdown emits minute remaining messages plus start and completion without changing the gate duration', async () => {
  const f = fixture({ testMode: false });
  const result = await f.gate.run({ ack: ALPHA20_LIVE_GATE_ACK, allowControlledPartyTransition: true });
  assert.equal(result.pass, true);
  assert.equal(result.passiveObservation.configuredObservationMs, REQUIRED_OBSERVATION_MS);
  assert.ok(f.gameLogs.some((row) => row.includes('gestartet — 10 Minuten Beobachtung')));
  assert.ok(f.gameLogs.some((row) => row.includes('noch 9 Minuten')));
  assert.ok(f.gameLogs.some((row) => row.includes('noch 1 Minute')));
  assert.ok(f.gameLogs.some((row) => row.includes('Beobachtung abgeschlossen')));
  assert.equal(result.passiveObservation.countdown.remainingMs, 0);
  assert.equal(result.passiveObservation.countdown.completed, true);
});