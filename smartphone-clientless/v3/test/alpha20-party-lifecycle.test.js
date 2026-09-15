'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PartyLifecycleStore, PartyLifecycleState } = require('../src/party/lifecycle-store');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_ACK, PartyLifecycleOperationState } = require('../src/party/controlled-lifecycle-coordinator');
const { ControlledPaladinAuraExecutor, CONTROLLED_PALADIN_AURA_ACK } = require('../src/party/controlled-paladin-aura-executor');
const { MinuteCountdownReporter } = require('../src/ops/minute-countdown-reporter');

function memoryStorage(seed = {}) {
  const rows = new Map(Object.entries(seed));
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; }, rows };
}

function baseCharacters(extra = []) {
  return [
    { name: 'RangerA', ctype: 'ranger', level: 80, active: true, currentScore: 0.82, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.96, xpPerHour: 1000, projectedScore: 0.84, projectedProgress: 0.84, trainingSafetyScore: 0.96, expectedTrainingXpRatio: 1, gearReady: true, contentSafe: true },
    { name: 'RangerB', ctype: 'ranger', level: 79, active: true, currentScore: 0.80, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.95, xpPerHour: 980, projectedScore: 0.82, projectedProgress: 0.82, trainingSafetyScore: 0.95, expectedTrainingXpRatio: 1, gearReady: true, contentSafe: true },
    { name: 'RangerC', ctype: 'ranger', level: 78, active: true, currentScore: 0.78, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.94, xpPerHour: 950, projectedScore: 0.80, projectedProgress: 0.80, trainingSafetyScore: 0.94, expectedTrainingXpRatio: 1, gearReady: true, contentSafe: true },
    ...extra
  ];
}

function evaluate(store, extra, overrides = {}) {
  return store.evaluate({
    characters: baseCharacters(extra),
    incumbentCurrentScore: 0.78,
    incumbentProjectedScore: 0.80,
    incumbentXpPerHour: 950,
    highRisk: false,
    economyEmergency: false,
    ...overrides
  });
}

function controlledPartyFixture(options = {}) {
  const currentMembers = [
    { name: 'MerchantA', ctype: 'merchant', level: 80, available: true },
    { name: 'RangerA', ctype: 'ranger', level: 80, available: true },
    { name: 'RangerB', ctype: 'ranger', level: 79, available: true },
    { name: 'RangerC', ctype: 'ranger', level: 78, available: true }
  ];
  const incoming = { name: 'RogueA', ctype: 'rogue', level: 76, available: true, dead: false };
  const registryStatus = { characters: currentMembers.concat(incoming) };
  const rows = [
    { name: 'RangerA', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.84, projectedScore: 0.85 },
    { name: 'RangerB', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.82, projectedScore: 0.83 },
    { name: 'RangerC', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.78, projectedScore: 0.80 },
    options.development
      ? { name: 'RogueA', state: PartyLifecycleState.DEVELOPMENT, active: false, currentScore: null, projectedScore: 0.92, expectedTrainingXpRatio: 0.82 }
      : { name: 'RogueA', state: PartyLifecycleState.PROMOTION_CANDIDATE, active: false, currentScore: 0.89, projectedScore: 0.92, expectedTrainingXpRatio: 1.05 }
  ];
  return {
    currentMembers,
    registryStatus,
    lifecycle: { status: () => ({ characters: rows, thresholds: { minTrainingExpectedXpRatio: 0.75 } }) }
  };
}

test('projected superiority creates DEVELOPMENT only and can never directly promote', () => {
  const store = new PartyLifecycleStore({ storage: memoryStorage(), minCurrentSamples: 8, promotionWindowsRequired: 3 });
  evaluate(store, [{
    name: 'RogueDev', ctype: 'rogue', level: 34, active: false,
    currentScore: null, currentConfidence: 0, currentSamples: 0, survivalScore: null, xpPerHour: 0,
    projectedScore: 0.93, projectedProgress: 0.76, trainingSafetyScore: 0.95, expectedTrainingXpRatio: 0.95,
    gearReady: false, contentSafe: true
  }]);
  const rogue = store.get('RogueDev');
  assert.equal(rogue.state, PartyLifecycleState.DEVELOPMENT);
  assert.equal(rogue.promotionStreak, 0);
  assert.ok(rogue.reasons.includes('PROJECTED_SUPERIORITY_ONLY_PLANNING'));
  assert.ok(rogue.reasons.includes('CURRENT_EVIDENCE_NOT_READY'));
});

test('projected superiority without explicit >=90% training safety remains BENCH', () => {
  const store = new PartyLifecycleStore({ storage: memoryStorage(), minTrainingSafety: 0.90 });
  const candidate = {
    name: 'RogueUnsafe', ctype: 'rogue', level: 50, active: false,
    currentScore: null, currentConfidence: 0, currentSamples: 0, survivalScore: null, xpPerHour: 0,
    projectedScore: 0.94, projectedProgress: 0.82, expectedTrainingXpRatio: 0.95,
    gearReady: false, contentSafe: true
  };
  evaluate(store, [candidate]);
  assert.equal(store.get('RogueUnsafe').state, PartyLifecycleState.BENCH);
  assert.ok(store.get('RogueUnsafe').reasons.includes('TRAINING_SAFETY_GATE'));
  evaluate(store, [{ ...candidate, trainingSafetyScore: 0.899 }]);
  assert.equal(store.get('RogueUnsafe').state, PartyLifecycleState.BENCH);
  evaluate(store, [{ ...candidate, trainingSafetyScore: 0.90 }]);
  assert.equal(store.get('RogueUnsafe').state, PartyLifecycleState.DEVELOPMENT);
});

test('only one DEVELOPMENT slot is ever assigned', () => {
  const store = new PartyLifecycleStore({ storage: memoryStorage() });
  evaluate(store, [
    { name: 'RogueA', ctype: 'rogue', level: 40, active: false, currentScore: null, currentConfidence: 0, currentSamples: 0, survivalScore: null, projectedScore: 0.94, projectedProgress: 0.78, trainingSafetyScore: 0.95, expectedTrainingXpRatio: 0.97, gearReady: false, contentSafe: true },
    { name: 'MageA', ctype: 'mage', level: 45, active: false, currentScore: null, currentConfidence: 0, currentSamples: 0, survivalScore: null, projectedScore: 0.90, projectedProgress: 0.77, trainingSafetyScore: 0.96, expectedTrainingXpRatio: 0.96, gearReady: false, contentSafe: true }
  ]);
  const development = store.list().filter((row) => row.state === PartyLifecycleState.DEVELOPMENT);
  assert.equal(development.length, 1);
  assert.equal(development[0].name, 'RogueA');
  assert.equal(store.status().maxDevelopmentSlots, 1);
});

test('permanent promotion requires real current superiority for sustained windows', () => {
  const store = new PartyLifecycleStore({ storage: memoryStorage(), promotionWindowsRequired: 3, minPromotionGain: 0.05, minPromotionXpRatio: 0.85 });
  const candidate = {
    name: 'RogueReady', ctype: 'rogue', level: 76, active: false,
    currentScore: 0.88, currentConfidence: 0.82, currentSamples: 18, survivalScore: 0.96, xpPerHour: 920,
    projectedScore: 0.91, projectedProgress: 0.90, trainingSafetyScore: 0.96, expectedTrainingXpRatio: 1.1, gearReady: true, contentSafe: true
  };
  evaluate(store, [candidate]);
  assert.notEqual(store.get('RogueReady').state, PartyLifecycleState.PROMOTION_CANDIDATE);
  evaluate(store, [candidate]);
  assert.notEqual(store.get('RogueReady').state, PartyLifecycleState.PROMOTION_CANDIDATE);
  evaluate(store, [candidate]);
  const ready = store.get('RogueReady');
  assert.equal(ready.state, PartyLifecycleState.PROMOTION_CANDIDATE);
  assert.equal(ready.promotionStreak, 3);
  assert.ok(ready.currentScore > 0.78);
});

test('high-risk or economy emergency context suppresses development and resets promotion streak', () => {
  const store = new PartyLifecycleStore({ storage: memoryStorage(), promotionWindowsRequired: 2 });
  const candidate = { name: 'RogueA', ctype: 'rogue', level: 70, active: false, currentScore: 0.9, currentConfidence: 0.9, currentSamples: 20, survivalScore: 0.98, xpPerHour: 1000, projectedScore: 0.95, projectedProgress: 0.9, trainingSafetyScore: 0.98, expectedTrainingXpRatio: 1.1, gearReady: true, contentSafe: true };
  evaluate(store, [candidate]);
  assert.equal(store.get('RogueA').promotionStreak, 1);
  evaluate(store, [candidate], { highRisk: true });
  const highRisk = store.get('RogueA');
  assert.equal(highRisk.promotionStreak, 0);
  assert.equal(highRisk.state, PartyLifecycleState.BENCH);
  evaluate(store, [{ ...candidate, currentScore: null, currentConfidence: 0, currentSamples: 0, survivalScore: null }], { economyEmergency: true });
  assert.equal(store.get('RogueA').state, PartyLifecycleState.BENCH);
});

test('controlled lifecycle is default-off, exact-ack gated and has independent development authority', () => {
  const root = { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } };
  const transitions = { setLiveEnabled() {}, status: () => ({}) };
  const coordinator = new ControlledPartyLifecycleCoordinator({ root, lifecycle: { status: () => ({ characters: [], thresholds: { minTrainingExpectedXpRatio: 0.75 } }) }, transitions, getMode: () => 'active', getSupervisorStatus: () => ({ state: 'HEALTHY' }) });
  assert.equal(coordinator.status().enabled, false);
  const wrong = coordinator.configure({ enabled: true, ack: 'WRONG', allowTransitions: true, allowDevelopmentRotation: true });
  assert.equal(wrong.enabled, false);
  assert.equal(wrong.actionAuthority, false);
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  assert.equal(coordinator.status().transitionAuthority, true);
  assert.equal(coordinator.status().developmentRotationAuthority, false);
});

test('promotion planner uses current measured superiority and selects the weakest incumbent', () => {
  const fixture = controlledPartyFixture();
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } },
    now: () => 1_000_000,
    storage: memoryStorage(),
    lifecycle: fixture.lifecycle,
    transitions: { setLiveEnabled() {} },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  const plan = coordinator.plan(fixture.currentMembers, fixture.registryStatus, {});
  assert.equal(plan.planned, true);
  assert.equal(plan.kind, 'PROMOTION');
  assert.equal(plan.incoming, 'RogueA');
  assert.equal(plan.outgoing, 'RangerC');
  assert.equal(plan.targetNames.length, 4);
  assert.equal(new Set(plan.targetNames).size, 4);
});

test('DEVELOPMENT rotation cannot plan without its own explicit authority', () => {
  const fixture = controlledPartyFixture({ development: true });
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } },
    now: () => 1_000_000,
    storage: memoryStorage(),
    lifecycle: fixture.lifecycle,
    transitions: { setLiveEnabled() {} },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true, allowDevelopmentRotation: false });
  assert.equal(coordinator.plan(fixture.currentMembers, fixture.registryStatus, {}).planned, false);
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true, allowDevelopmentRotation: true });
  const plan = coordinator.plan(fixture.currentMembers, fixture.registryStatus, {});
  assert.equal(plan.planned, true);
  assert.equal(plan.kind, 'DEVELOPMENT_ROTATION');
});

test('transition failure always removes child live authority and records an abort', async () => {
  const fixture = controlledPartyFixture();
  let childLive = false;
  let executeCalls = 0;
  const transitions = {
    setLiveEnabled(value) { childLive = value === true; },
    async execute() { executeCalls += 1; return { executed: false, reason: 'POSTCONDITION_VERIFY_TIMEOUT', recovery: { recovered: true } }; }
  };
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } },
    now: () => 1_000_000,
    storage: memoryStorage(),
    lifecycle: fixture.lifecycle,
    transitions,
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  const plan = coordinator.plan(fixture.currentMembers, fixture.registryStatus, {});
  const result = await coordinator.executePlan(plan, fixture.currentMembers, fixture.registryStatus, {});
  assert.equal(result.executed, false);
  assert.equal(result.operation.state, PartyLifecycleOperationState.ABORTED);
  assert.equal(executeCalls, 1);
  assert.equal(childLive, false);
  assert.equal(coordinator.status().busy, false);
});

test('restart reconciliation never blindly retries an uncertain transition', () => {
  const storage = memoryStorage();
  storage.set('AIO_V3_PARTY_LIFECYCLE_OPERATION', JSON.stringify({
    schemaVersion: 1,
    savedAt: 1,
    lastTransitionAt: 0,
    operation: {
      id: 'op-1', state: PartyLifecycleOperationState.EXECUTING,
      plan: { targetNames: ['MerchantA', 'RangerA', 'RangerB', 'RogueA'], evidence: { context: { currentNames: ['MerchantA', 'RangerA', 'RangerB', 'RangerC'] } } }
    }
  }));
  let executeCalls = 0;
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant' }, parent: { party: {} } },
    storage,
    lifecycle: { status: () => ({ characters: [], thresholds: { minTrainingExpectedXpRatio: 0.75 } }) },
    transitions: { setLiveEnabled() {}, execute: async () => { executeCalls += 1; return { executed: true }; } },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  assert.equal(coordinator.status().operation.state, PartyLifecycleOperationState.RECOVERING);
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  const reconciled = coordinator.reconcile(['MerchantA', 'RangerA', 'RangerB', 'RangerC']);
  assert.equal(reconciled.reconciled, true);
  assert.equal(reconciled.operation.state, PartyLifecycleOperationState.ABORTED);
  assert.equal(reconciled.operation.reason, 'RESTART_ORIGINAL_STATE_OBSERVED');
  assert.equal(executeCalls, 0);
});

test('controlled Paladin aura is exact-ack gated and only executes one known aura through adapter', () => {
  let calls = 0;
  const root = { character: { name: 'PalA', ctype: 'paladin', level: 80 }, parent: {} };
  const auraPolicy = { lastAura: null, noteApplied(aura) { this.lastAura = aura; } };
  const executor = new ControlledPaladinAuraExecutor({
    root,
    auraPolicy,
    adapter: { command(name, args) { calls += 1; assert.equal(name, 'use_skill'); assert.deepEqual(args, ['paladin_aura', 'bulwark']); return { executed: true }; } },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  executor.configure({ enabled: true, ack: 'WRONG' });
  assert.equal(executor.status().enabled, false);
  executor.configure({ enabled: true, ack: CONTROLLED_PALADIN_AURA_ACK });
  const result = executor.execute({ aura: 'bulwark', canSwitch: true }, { inCombat: false, highRisk: false, emergency: false });
  assert.equal(result.executed, true);
  assert.equal(calls, 1);
  assert.equal(auraPolicy.lastAura, 'bulwark');
  const duplicate = executor.execute({ aura: 'bulwark', canSwitch: true }, {});
  assert.equal(duplicate.executed, false);
  assert.equal(calls, 1);
});

test('minute countdown reports remaining time without owning or changing test timing', () => {
  let now = 1000;
  const messages = [];
  const countdown = new MinuteCountdownReporter({ now: () => now, emit: (message) => messages.push(message), label: 'Alpha.20 Live Gate' });
  countdown.start(10 * 60 * 1000);
  assert.equal(messages.length, 1);
  now += 60 * 1000;
  const first = countdown.tick();
  assert.equal(first.minutes, 9);
  assert.match(messages.at(-1), /noch 9 Minuten/);
  now += 8 * 60 * 1000;
  const nearEnd = countdown.tick();
  assert.equal(nearEnd.minutes, 1);
  now += 60 * 1000;
  const complete = countdown.tick();
  assert.equal(complete.type, 'complete');
  assert.equal(countdown.status().completed, true);
});

test('3000-cycle lifecycle soak stays bounded and never allocates more than one development slot', () => {
  let now = 0;
  const store = new PartyLifecycleStore({ now: () => ++now, storage: memoryStorage(), capacity: 16, promotionWindowsRequired: 4 });
  for (let i = 0; i < 3000; i += 1) {
    const extras = [];
    for (let j = 0; j < 8; j += 1) extras.push({
      name: `Bench${j}`, ctype: j % 2 ? 'rogue' : 'mage', level: 30 + j, active: false,
      currentScore: null, currentConfidence: 0, currentSamples: 0, survivalScore: null, xpPerHour: 0,
      projectedScore: 0.86 + j / 1000, projectedProgress: 0.70 + j / 100, trainingSafetyScore: 0.91 + j / 1000, expectedTrainingXpRatio: 0.8 + j / 100,
      gearReady: false, contentSafe: true
    });
    evaluate(store, extras);
    assert.ok(store.list().filter((row) => row.state === PartyLifecycleState.DEVELOPMENT).length <= 1);
    assert.ok(store.list().length <= 16);
  }
  const status = store.status();
  assert.equal(status.stats.evaluations, 3000);
  assert.ok(status.characters.length <= 16);
});

test('2200-cycle controlled planner soak never creates malformed party targets or bypasses authority', () => {
  const fixture = controlledPartyFixture({ development: true });
  let now = 1_000_000;
  const coordinator = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } },
    now: () => now++,
    storage: memoryStorage(),
    lifecycle: fixture.lifecycle,
    transitions: { setLiveEnabled() {} },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  coordinator.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true, allowDevelopmentRotation: true });
  for (let i = 0; i < 2200; i += 1) {
    const plan = coordinator.plan(fixture.currentMembers, fixture.registryStatus, {});
    assert.equal(plan.planned, true);
    assert.equal(plan.kind, 'DEVELOPMENT_ROTATION');
    assert.equal(plan.targetNames.length, 4);
    assert.equal(new Set(plan.targetNames).size, 4);
    assert.ok(plan.targetNames.includes('MerchantA'));
  }
  coordinator.disable('SOAK_COMPLETE');
  assert.equal(coordinator.status().actionAuthority, false);
  assert.equal(coordinator.status().transitionAuthority, false);
  assert.equal(coordinator.status().developmentRotationAuthority, false);
});
