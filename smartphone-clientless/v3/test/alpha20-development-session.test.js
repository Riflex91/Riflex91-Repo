'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PartyLifecycleStore, PartyLifecycleState } = require('../src/party/lifecycle-store');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_ACK } = require('../src/party/controlled-lifecycle-coordinator');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed));
  return {
    get: (key) => rows.get(key),
    set: (key, value) => { rows.set(key, value); return true; },
    rows
  };
}

function measuredDevelopmentInput() {
  return {
    characters: [
      { name: 'RangerA', ctype: 'ranger', level: 80, active: true, currentScore: 0.84, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.96, xpPerHour: 1000, projectedScore: 0.85, projectedProgress: 0.84, trainingSafetyScore: 0.96, expectedTrainingXpRatio: 1, gearReady: true, contentSafe: true },
      { name: 'RangerB', ctype: 'ranger', level: 79, active: true, currentScore: 0.82, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.95, xpPerHour: 980, projectedScore: 0.83, projectedProgress: 0.82, trainingSafetyScore: 0.95, expectedTrainingXpRatio: 1, gearReady: true, contentSafe: true },
      { name: 'RangerC', ctype: 'ranger', level: 78, active: false, currentScore: 0.78, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.94, xpPerHour: 950, projectedScore: 0.80, projectedProgress: 0.80, trainingSafetyScore: 0.94, expectedTrainingXpRatio: 1, gearReady: true, contentSafe: true },
      { name: 'RogueA', ctype: 'rogue', level: 76, active: true, currentScore: 0.89, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.96, xpPerHour: 920, projectedScore: 0.92, projectedProgress: 0.90, trainingSafetyScore: 0.96, expectedTrainingXpRatio: 1.1, gearReady: true, contentSafe: true }
    ],
    incumbentCurrentScore: 0.78,
    incumbentProjectedScore: 0.80,
    incumbentXpPerHour: 950,
    developmentCandidateName: 'RogueA',
    highRisk: false,
    economyEmergency: false
  };
}

function controlledFixture() {
  const originalMembers = [
    { name: 'MerchantA', ctype: 'merchant', level: 80, available: true },
    { name: 'RangerA', ctype: 'ranger', level: 80, available: true },
    { name: 'RangerB', ctype: 'ranger', level: 79, available: true },
    { name: 'RangerC', ctype: 'ranger', level: 78, available: true }
  ];
  const rogue = { name: 'RogueA', ctype: 'rogue', level: 76, available: true, dead: false };
  const trainingMembers = [originalMembers[0], originalMembers[1], originalMembers[2], rogue];
  const registryStatus = { characters: originalMembers.concat(rogue) };
  let rows = [
    { name: 'RangerA', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.84, projectedScore: 0.85, projectedProgress: 0.84, xpPerHour: 1000 },
    { name: 'RangerB', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.82, projectedScore: 0.83, projectedProgress: 0.82, xpPerHour: 980 },
    { name: 'RangerC', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.78, projectedScore: 0.80, projectedProgress: 0.80, xpPerHour: 950 },
    { name: 'RogueA', state: PartyLifecycleState.DEVELOPMENT, active: false, currentScore: null, projectedScore: 0.92, projectedProgress: 0.90, expectedTrainingXpRatio: 0.82, xpPerHour: 0 }
  ];
  const lifecycle = {
    status: () => ({ characters: rows, thresholds: { minTrainingExpectedXpRatio: 0.75 } }),
    setRows(value) { rows = value; }
  };
  return { originalMembers, trainingMembers, registryStatus, lifecycle };
}

function createControlled(options = {}) {
  const fixture = options.fixture || controlledFixture();
  const backing = options.storage || memoryStorage();
  const clock = options.clock || { now: 1_000_000 };
  let executeCalls = 0;
  let childLive = false;
  const transitions = options.transitions || {
    setLiveEnabled(value) { childLive = value === true; },
    async execute() { executeCalls += 1; return { executed: true, verified: true }; }
  };
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } },
    now: () => clock.now,
    storage: backing,
    lifecycle: fixture.lifecycle,
    transitions,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getEconomyEmergency: () => false,
    minTransitionIntervalMs: 60_000,
    maxDevelopmentRotationMs: 15 * 60_000,
    failureWindowMs: 10 * 60_000,
    failureThreshold: 3,
    circuitCooldownMs: 10 * 60_000
  });
  coordinator.configure({
    enabled: true,
    ack: CONTROLLED_PARTY_LIFECYCLE_ACK,
    allowTransitions: true,
    allowDevelopmentRotation: true
  });
  return {
    coordinator,
    fixture,
    backing,
    clock,
    executeCalls: () => executeCalls,
    childLive: () => childLive
  };
}

function contextFor(members) {
  return {
    currentNames: members.map((row) => row.name),
    inCombat: false,
    highRisk: false,
    emergency: false,
    requiresCrossMapRouting: false
  };
}

async function startDevelopmentRotation(setup) {
  const { coordinator, fixture } = setup;
  const context = contextFor(fixture.originalMembers);
  const plan = coordinator.plan(fixture.originalMembers, fixture.registryStatus, context);
  assert.equal(plan.planned, true);
  assert.equal(plan.kind, 'DEVELOPMENT_ROTATION');
  assert.equal(plan.incoming, 'RogueA');
  assert.equal(plan.outgoing, 'RangerC');
  const result = await coordinator.executePlan(plan, fixture.originalMembers, fixture.registryStatus, context);
  assert.equal(result.executed, true);
  assert.ok(result.developmentSession);
  assert.equal(result.developmentSession.candidate, 'RogueA');
  assert.deepEqual(new Set(result.developmentSession.originalNames), new Set(['MerchantA', 'RangerA', 'RangerB', 'RangerC']));
  assert.deepEqual(new Set(result.developmentSession.trainingNames), new Set(['MerchantA', 'RangerA', 'RangerB', 'RogueA']));
  return result.developmentSession;
}

test('only the active bounded Development candidate can graduate from measured current evidence', () => {
  const store = new PartyLifecycleStore({
    storage: memoryStorage(),
    minCurrentSamples: 8,
    minCurrentConfidence: 0.55,
    minPromotionSafety: 0.90,
    minPromotionXpRatio: 0.85,
    minPromotionGain: 0.05,
    promotionWindowsRequired: 3
  });
  const input = measuredDevelopmentInput();
  store.evaluate(input);
  assert.equal(store.get('RogueA').state, PartyLifecycleState.DEVELOPMENT);
  assert.equal(store.get('RogueA').promotionStreak, 1);
  store.evaluate(input);
  assert.equal(store.get('RogueA').state, PartyLifecycleState.DEVELOPMENT);
  assert.equal(store.get('RogueA').promotionStreak, 2);
  store.evaluate(input);
  const promoted = store.get('RogueA');
  assert.equal(promoted.active, true);
  assert.equal(promoted.state, PartyLifecycleState.PROMOTION_CANDIDATE);
  assert.equal(promoted.promotionStreak, 3);
  assert.ok(promoted.reasons.includes('ACTIVE_BOUNDED_DEVELOPMENT_SESSION'));

  const controlStore = new PartyLifecycleStore({ storage: memoryStorage(), promotionWindowsRequired: 2 });
  const withoutSession = { ...input, developmentCandidateName: null };
  controlStore.evaluate(withoutSession);
  controlStore.evaluate(withoutSession);
  assert.equal(controlStore.get('RogueA').state, PartyLifecycleState.ACTIVE);
  assert.equal(controlStore.get('RogueA').promotionStreak, 0);
});

test('successful Development rotation is time-bounded and returns to the exact original party', async () => {
  const setup = createControlled();
  const session = await startDevelopmentRotation(setup);
  assert.equal(setup.executeCalls(), 1);
  assert.equal(setup.childLive(), false);

  setup.clock.now += 5 * 60_000;
  const hold = setup.coordinator.plan(setup.fixture.trainingMembers, setup.fixture.registryStatus, contextFor(setup.fixture.trainingMembers));
  assert.equal(hold.planned, false);
  assert.equal(hold.reason, 'DEVELOPMENT_WINDOW_ACTIVE');
  assert.ok(hold.remainingMs > 0);
  assert.equal(setup.executeCalls(), 1);

  setup.clock.now = session.expiresAt;
  const returnPlan = setup.coordinator.plan(setup.fixture.trainingMembers, setup.fixture.registryStatus, contextFor(setup.fixture.trainingMembers));
  assert.equal(returnPlan.planned, true);
  assert.equal(returnPlan.kind, 'DEVELOPMENT_RETURN');
  assert.equal(returnPlan.incoming, 'RangerC');
  assert.equal(returnPlan.outgoing, 'RogueA');
  assert.deepEqual(new Set(returnPlan.targetNames), new Set(session.originalNames));

  const returned = await setup.coordinator.executePlan(returnPlan, setup.fixture.trainingMembers, setup.fixture.registryStatus, contextFor(setup.fixture.trainingMembers));
  assert.equal(returned.executed, true);
  assert.equal(setup.executeCalls(), 2);
  assert.equal(setup.childLive(), false);
  assert.equal(setup.coordinator.status().developmentSession, null);
  assert.equal(setup.coordinator.status().stats.developmentReturns, 1);
});

test('Development session survives restart and never blindly transitions while its window is still active', async () => {
  const backing = memoryStorage();
  const clock = { now: 2_000_000 };
  const first = createControlled({ storage: backing, clock });
  const session = await startDevelopmentRotation(first);
  assert.equal(first.executeCalls(), 1);

  clock.now += 2 * 60_000;
  let restartCalls = 0;
  let childLive = false;
  const restored = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } },
    now: () => clock.now,
    storage: backing,
    lifecycle: first.fixture.lifecycle,
    transitions: {
      setLiveEnabled(value) { childLive = value === true; },
      async execute() { restartCalls += 1; return { executed: true }; }
    },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    getEconomyEmergency: () => false,
    minTransitionIntervalMs: 60_000,
    maxDevelopmentRotationMs: 15 * 60_000
  });
  restored.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true, allowDevelopmentRotation: true });
  assert.ok(restored.status().developmentSession);
  assert.equal(restored.status().developmentSession.candidate, 'RogueA');

  const hold = restored.plan(first.fixture.trainingMembers, first.fixture.registryStatus, contextFor(first.fixture.trainingMembers));
  assert.equal(hold.planned, false);
  assert.equal(hold.reason, 'DEVELOPMENT_WINDOW_ACTIVE');
  assert.equal(restartCalls, 0);
  assert.equal(childLive, false);

  clock.now = session.expiresAt;
  const returnPlan = restored.plan(first.fixture.trainingMembers, first.fixture.registryStatus, contextFor(first.fixture.trainingMembers));
  assert.equal(returnPlan.planned, true);
  assert.equal(returnPlan.kind, 'DEVELOPMENT_RETURN');
  assert.equal(restartCalls, 0);
});

test('measured promotion during Development commits the training composition without an extra raw transition', async () => {
  const setup = createControlled();
  await startDevelopmentRotation(setup);
  assert.equal(setup.executeCalls(), 1);

  setup.fixture.lifecycle.setRows([
    { name: 'RangerA', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.84 },
    { name: 'RangerB', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.82 },
    { name: 'RangerC', state: PartyLifecycleState.BENCH, active: false, currentScore: 0.78 },
    { name: 'RogueA', state: PartyLifecycleState.PROMOTION_CANDIDATE, active: true, currentScore: 0.89, promotionStreak: 3 }
  ]);
  setup.clock.now += 3 * 60_000;
  const result = setup.coordinator.plan(setup.fixture.trainingMembers, setup.fixture.registryStatus, contextFor(setup.fixture.trainingMembers));
  assert.equal(result.planned, false);
  assert.equal(result.promoted, true);
  assert.equal(result.reason, 'DEVELOPMENT_PROMOTION_COMMITTED_NO_RAW_TRANSITION');
  assert.equal(setup.executeCalls(), 1);
  assert.equal(setup.coordinator.status().developmentSession, null);
  assert.equal(setup.coordinator.status().stats.developmentPromotions, 1);
});

test('unexpected party drift during Development fails closed once and never creates a blind recovery action', async () => {
  const setup = createControlled();
  await startDevelopmentRotation(setup);
  const drifted = [
    setup.fixture.originalMembers[0],
    setup.fixture.originalMembers[1],
    setup.fixture.trainingMembers[3],
    { name: 'MageUnexpected', ctype: 'mage', level: 70, available: true }
  ];
  const beforeCalls = setup.executeCalls();
  const first = setup.coordinator.plan(drifted, { characters: setup.fixture.registryStatus.characters.concat(drifted[3]) }, contextFor(drifted));
  assert.equal(first.planned, false);
  assert.equal(first.reason, 'DEVELOPMENT_SESSION_PARTY_DRIFT');
  assert.equal(setup.coordinator.breaker().failuresInWindow, 1);
  const second = setup.coordinator.plan(drifted, { characters: setup.fixture.registryStatus.characters.concat(drifted[3]) }, contextFor(drifted));
  assert.equal(second.planned, false);
  assert.equal(second.reason, 'DEVELOPMENT_SESSION_PARTY_DRIFT');
  assert.equal(setup.coordinator.breaker().failuresInWindow, 1);
  assert.equal(setup.executeCalls(), beforeCalls);
  assert.equal(setup.childLive(), false);
  assert.ok(setup.coordinator.status().developmentSession);
});

test('2500-cycle active Development soak stays bounded and performs no additional raw transitions', async () => {
  const setup = createControlled();
  const session = await startDevelopmentRotation(setup);
  setup.clock.now += 60_000;
  const callsAfterRotation = setup.executeCalls();
  for (let i = 0; i < 2500; i += 1) {
    const plan = setup.coordinator.plan(setup.fixture.trainingMembers, setup.fixture.registryStatus, contextFor(setup.fixture.trainingMembers));
    assert.equal(plan.planned, false);
    assert.equal(plan.reason, 'DEVELOPMENT_WINDOW_ACTIVE');
    assert.ok(plan.remainingMs > 0);
    assert.equal(setup.coordinator.status().developmentSession.candidate, 'RogueA');
    assert.equal(setup.executeCalls(), callsAfterRotation);
  }
  const status = setup.coordinator.status();
  assert.equal(status.developmentSession.expiresAt, session.expiresAt);
  assert.equal(status.stats.developmentRotations, 1);
  assert.equal(status.stats.developmentReturns, 0);
  assert.equal(status.breaker.open, false);
  assert.doesNotThrow(() => JSON.stringify(status));
});