'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlledPartyLifecycleCoordinator, CONTROLLED_PARTY_LIFECYCLE_ACK } = require('../src/party/controlled-lifecycle-coordinator');
const { PartyLifecycleState } = require('../src/party/lifecycle-store');

function storage() {
  const rows = new Map();
  return { get: (key) => rows.get(key), set: (key, value) => { rows.set(key, value); return true; }, rows };
}

function fixture() {
  const currentMembers = [
    { name: 'MerchantA', ctype: 'merchant', level: 80, available: true },
    { name: 'RangerA', ctype: 'ranger', level: 80, available: true },
    { name: 'RangerB', ctype: 'ranger', level: 79, available: true },
    { name: 'RangerC', ctype: 'ranger', level: 78, available: true }
  ];
  const incoming = { name: 'RogueA', ctype: 'rogue', level: 76, available: true, dead: false };
  const rows = [
    { name: 'RangerA', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.84 },
    { name: 'RangerB', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.82 },
    { name: 'RangerC', state: PartyLifecycleState.ACTIVE, active: true, currentScore: 0.78 },
    { name: 'RogueA', state: PartyLifecycleState.PROMOTION_CANDIDATE, active: false, currentScore: 0.89, projectedScore: 0.92 }
  ];
  return {
    currentMembers,
    registryStatus: { characters: currentMembers.concat(incoming) },
    lifecycle: { status: () => ({ characters: rows, thresholds: { minTrainingExpectedXpRatio: 0.75 } }) }
  };
}

function coordinator(options = {}) {
  const data = fixture();
  const root = { character: { name: 'MerchantA', ctype: 'merchant', level: 80 }, parent: { party: {} } };
  const transitions = options.transitions || { setLiveEnabled() {}, async execute() { return { executed: false, reason: 'VERIFY_FAILED', recovery: { recovered: true } }; } };
  const result = new ControlledPartyLifecycleCoordinator({
    root,
    now: options.now || (() => 1_000_000),
    storage: options.storage || storage(),
    lifecycle: data.lifecycle,
    transitions,
    getMode: options.getMode || (() => 'active'),
    getSupervisorStatus: options.getSupervisorStatus || (() => ({ state: 'HEALTHY' })),
    getEconomyEmergency: options.getEconomyEmergency || (() => false),
    minTransitionIntervalMs: 60_000,
    failureWindowMs: 600_000,
    failureThreshold: 3,
    circuitCooldownMs: 600_000
  });
  result.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  return { result, data };
}

test('three failed controlled transitions open a persistent circuit and block a fourth attempt', async () => {
  const backing = storage();
  let childLive = false;
  let executeCalls = 0;
  const transitions = {
    setLiveEnabled(value) { childLive = value === true; },
    async execute() { executeCalls += 1; return { executed: false, reason: 'VERIFY_FAILED', recovery: { recovered: true } }; }
  };
  const { result: c, data } = coordinator({ storage: backing, transitions });
  const plan = c.plan(data.currentMembers, data.registryStatus, {});
  assert.equal(plan.planned, true);
  for (let i = 0; i < 3; i += 1) {
    const attempt = await c.executePlan(plan, data.currentMembers, data.registryStatus, {});
    assert.equal(attempt.executed, false);
    assert.equal(childLive, false);
  }
  assert.equal(executeCalls, 3);
  assert.equal(c.breaker().open, true);
  assert.equal(c.status().actionAuthority, false);
  const fourth = await c.executePlan(plan, data.currentMembers, data.registryStatus, {});
  assert.equal(fourth.executed, false);
  assert.equal(fourth.reason, 'PARTY_LIFECYCLE_CIRCUIT_OPEN');
  assert.equal(executeCalls, 3);

  const restored = new ControlledPartyLifecycleCoordinator({
    root: { character: { name: 'MerchantA', ctype: 'merchant' }, parent: { party: {} } },
    now: () => 1_000_000,
    storage: backing,
    lifecycle: data.lifecycle,
    transitions: { setLiveEnabled() {} },
    getMode: () => 'active',
    getSupervisorStatus: () => ({ state: 'HEALTHY' }),
    failureWindowMs: 600_000,
    failureThreshold: 3,
    circuitCooldownMs: 600_000
  });
  assert.equal(restored.breaker().open, true);
  const enable = restored.configure({ enabled: true, ack: CONTROLLED_PARTY_LIFECYCLE_ACK, allowTransitions: true });
  assert.equal(enable.enabled, false);
  assert.equal(enable.enableRejected, 'PARTY_LIFECYCLE_CIRCUIT_OPEN');
});

test('high-risk, combat and economy emergency gates produce zero child transition calls', async () => {
  let executeCalls = 0;
  const transitions = { setLiveEnabled() {}, async execute() { executeCalls += 1; return { executed: true }; } };
  const { result: c, data } = coordinator({ transitions });
  for (const context of [{ highRisk: true }, { inCombat: true }, { emergency: true }]) {
    const plan = c.plan(data.currentMembers, data.registryStatus, context);
    assert.equal(plan.planned, false);
  }
  assert.equal(executeCalls, 0);

  const emergency = coordinator({ transitions, getEconomyEmergency: () => true });
  const plan = emergency.result.plan(emergency.data.currentMembers, emergency.data.registryStatus, {});
  assert.equal(plan.planned, false);
  assert.equal(plan.reason, 'ECONOMY_EMERGENCY');
  assert.equal(executeCalls, 0);
});

test('circuit automatically closes only after cooldown and failure window expiry', async () => {
  let now = 1_000_000;
  const { result: c, data } = coordinator({ now: () => now });
  const plan = c.plan(data.currentMembers, data.registryStatus, {});
  for (let i = 0; i < 3; i += 1) await c.executePlan(plan, data.currentMembers, data.registryStatus, {});
  const openedUntil = c.breaker().openUntil;
  assert.ok(openedUntil > now);
  now = openedUntil - 1;
  assert.equal(c.breaker().open, true);
  now = openedUntil;
  assert.equal(c.breaker().open, false);
  assert.equal(c.breaker().failuresInWindow, 0);
});
