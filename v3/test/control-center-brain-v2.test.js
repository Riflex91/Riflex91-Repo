'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ControlPlaneConfig } = require('../src/control/control-plane-config');
const { TinyStrategyNetwork, StrategicBrainV2, BRAIN_V2_ACTIONS, BRAIN_V2_INPUT_NAMES } = require('../src/brain/strategic-brain-v2');
const { Alpha25ControlCenterBrain } = require('../src/reliability/alpha25-control-center-brain');

function memoryStorage() {
  const rows = new Map();
  return { getItem: (k) => rows.has(k) ? rows.get(k) : null, setItem: (k, v) => rows.set(k, String(v)), removeItem: (k) => rows.delete(k) };
}

function runtimeFixture(nowRef = { value: 1_000_000 }) {
  const root = { localStorage: memoryStorage(), fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }) };
  const performance = {
    rates: { xpPerHour: 500000, goldPerHour: 50000, deathsPerHour: 0, damageTakenPerHour: 1000 },
    status() { return { current: { rates: { ...this.rates } }, recent: [] }; }
  };
  const runtime = {
    root,
    now: () => nowRef.value,
    log: { rows: [], emit(row) { this.rows.push(row); }, list() { return this.rows.slice(-100); } },
    adapter: { mode: 'active' },
    lastSnapshot: {
      character: { name: 'My_Merchant', ctype: 'merchant', level: 40, map: 'main', x: 0, y: 0, hp: 2000, max_hp: 2000, mp: 1500, max_mp: 1500, gold: 1000000, range: 90, speed: 45, attack: 300, isize: 42, inventory: [] },
      party: [
        { name: 'My_Ranger1', ctype: 'ranger', hp: 3000, max_hp: 3000 },
        { name: 'My_Ranger2', ctype: 'ranger', hp: 3000, max_hp: 3000 },
        { name: 'My_Ranger3', ctype: 'ranger', hp: 3000, max_hp: 3000 }
      ],
      entities: []
    },
    performance,
    combatRisk: { threshold: 0.65 },
    farmer: { status: () => ({ state: 'ASSESS' }), config: {}, setTargetPolicy(v) { this.targetPolicy = v; return v; } },
    merchantEconomyAutonomy: { cfg: {} },
    economyEquipmentAutonomyV2: { marketHistory: { maxItems: 96, maxSamplesPerItem: 48 }, status: () => ({ marketDecisions: [], homeService: { phase: 'STANDBY' } }) },
    characterRegistry: { status: () => ({ characters: [{ name: 'My_Merchant', ctype: 'merchant' }, { name: 'My_Ranger1', ctype: 'ranger' }, { name: 'My_Ranger2', ctype: 'ranger' }, { name: 'My_Ranger3', ctype: 'ranger' }] }) },
    gearProgression: { list: () => [] },
    world: { status: () => ({ confidence: 0.8 }) },
    brain: { observe: () => ({ recommendation: { id: 'main:squigtoad' } }), status: () => ({ mode: 'shadow' }), replay: () => [] },
    setFarmerTargetPolicy(v) { return this.farmer.setTargetPolicy(v); }
  };
  return runtime;
}

function context(runtime) {
  return {
    snapshot: runtime.lastSnapshot,
    candidates: [
      { id: 'main:squigtoad', monster: 'squigtoad', xpPerHour: 1_500_000, goldPerHour: 120000, deathsPerHour: 0, confidence: 0.8, travelSeconds: 10, expectedKillSeconds: 12 },
      { id: 'main:crab', monster: 'crab', xpPerHour: 800000, goldPerHour: 40000, deathsPerHour: 0, confidence: 0.9, travelSeconds: 30, expectedKillSeconds: 18 }
    ],
    teacherRanking: [{ id: 'main:squigtoad', monster: 'squigtoad', xpPerHour: 1_500_000, goldPerHour: 120000, confidence: 0.8, travelSeconds: 10 }],
    currentPlan: { id: 'main:crab', monster: 'crab' }
  };
}

test('control plane enforces locked safety settings and hot-applies bounded settings', () => {
  const runtime = runtimeFixture();
  const control = new ControlPlaneConfig({ root: runtime.root, now: runtime.now, log: runtime.log });
  const patch = control.patch({
    'combat.riskThreshold': 0.73,
    'party.commandCharacterActiveOnly': false,
    'brain.directExecutorAccess': true,
    'farming.targetPolicy': 'safe-any'
  }, { source: 'test' });
  assert.equal(control.get('combat.riskThreshold'), 0.73);
  assert.equal(control.get('party.commandCharacterActiveOnly'), true);
  assert.equal(control.get('brain.directExecutorAccess'), false);
  assert.equal(patch.rejected.length, 2);
  const applied = control.applyHot(runtime, patch.changed);
  assert.equal(runtime.combatRisk.threshold, 0.73);
  assert.equal(runtime.farmer.targetPolicy, 'safe-any');
  assert.ok(applied.applied.includes('combat.riskThreshold'));
});

test('tiny 32x24x5 student produces normalized strategy probabilities and learns', () => {
  const net = new TinyStrategyNetwork();
  assert.equal(BRAIN_V2_INPUT_NAMES.length, 32);
  assert.equal(BRAIN_V2_ACTIONS.length, 5);
  const input = Array(32).fill(0.5);
  const before = net.forward(input).probs;
  assert.ok(Math.abs(before.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const target = [0, 1, 0, 0, 0];
  for (let i = 0; i < 20; i += 1) net.train(input, target, 0.03);
  const after = net.forward(input).probs;
  assert.ok(after[1] > before[1]);
});

test('strategic brain v2 distills deterministic and remote teachers without action authority', () => {
  const runtime = runtimeFixture();
  const control = new ControlPlaneConfig({ root: runtime.root, now: runtime.now, log: runtime.log });
  const brain = new StrategicBrainV2({ runtime, root: runtime.root, now: runtime.now, log: runtime.log, controlPlane: control, legacyBrain: runtime.brain });
  const first = brain.observe(context(runtime));
  assert.equal(first.mode, 'shadow');
  assert.equal(first.actionAuthority, false);
  assert.equal(brain.status().architecture.inputs, 32);
  assert.equal(brain.status().architecture.hidden, 24);
  assert.equal(brain.status().architecture.outputs, 5);
  assert.equal(brain.ingestTeacher({ action: 'continue', target: 'squigtoad', confidence: 0.92, scores: { continue: 0.85, change_farm_target: 0.05, replan_merchant: 0.04, explore: 0.03, wait: 0.03 }, reason: 'stable', lesson: 'Keep efficient safe farm.' }), true);
  const second = brain.observe({ ...context(runtime), currentPlan: { id: 'main:squigtoad', monster: 'squigtoad' } });
  assert.equal(second.teacher.source, 'cloudflare');
  assert.equal(brain.status().directActionAccess, false);
  assert.equal(brain.status().policies.dangerousContentCannotBeOverridden, true);
});

test('brain outcome reward and league state are persisted locally', () => {
  const clock = { value: 5_000_000 };
  const runtime = runtimeFixture(clock);
  const control = new ControlPlaneConfig({ root: runtime.root, now: runtime.now, log: runtime.log, initial: { 'brain.outcomeWindowMs': 15000, 'brain.championMinSamples': 32 } });
  const brain = new StrategicBrainV2({ runtime, root: runtime.root, now: runtime.now, log: runtime.log, controlPlane: control, legacyBrain: runtime.brain });
  brain.observe(context(runtime));
  clock.value += 16000;
  runtime.performance.rates.xpPerHour = 900000;
  runtime.performance.rates.goldPerHour = 90000;
  const outcome = brain.tickOutcome();
  assert.ok(outcome);
  assert.ok(outcome.reward > 0);
  assert.equal(brain.status().student.outcomes, 1);
  assert.ok(brain.status().diary.entries.some((x) => x.kind === 'outcome'));
});

test('Alpha25 exposes control, brain and cloud status without exposing write key', () => {
  const runtime = runtimeFixture();
  const alpha25 = new Alpha25ControlCenterBrain(runtime);
  const cloud = alpha25.configureCloud({ baseUrl: 'https://example.workers.dev', writeKey: 'super-secret-write-key', account: 'test' });
  assert.equal(runtime.brain, runtime.strategicBrainV2);
  assert.equal(alpha25.status().policies.brainDirectExecutorAccess, false);
  assert.equal(cloud.configured.writeKeyPresent, true);
  assert.equal(JSON.stringify(cloud).includes('super-secret-write-key'), false);
  assert.equal(alpha25.controlPlane.get('cloud.enabled'), true);
});

test('explicit global cloud config enables the control plane without exposing the write key', () => {
  const runtime = runtimeFixture();
  runtime.root.AIO_V3_CLOUD_CONFIG = { baseUrl: 'https://example.workers.dev', writeKey: 'global-super-secret', account: 'prod' };
  const alpha25 = new Alpha25ControlCenterBrain(runtime);
  const status = alpha25.status();
  assert.equal(alpha25.controlPlane.get('cloud.enabled'), true);
  assert.equal(status.cloud.explicitGlobalConfig, true);
  assert.equal(status.cloud.ready, true);
  assert.equal(JSON.stringify(status).includes('global-super-secret'), false);
});

test('remote settings reuse the same extended live-apply path as local settings', async () => {
  const runtime = runtimeFixture();
  const alpha25 = new Alpha25ControlCenterBrain(runtime);
  alpha25.configureCloud({ baseUrl: 'https://example.workers.dev', writeKey: 'remote-secret', account: 'test' });
  alpha25.cloud.fetchFn = async (url) => {
    if (url.endsWith('/api/v3/sync')) return { ok: true, json: async () => ({ ok: true, settings: { revision: 2, updatedAt: runtime.now(), values: { 'merchant.potionLow': 321, 'merchant.targetFreeSlots': 17, 'economy.keepValue': 7654321 } } }) };
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await alpha25.cloud.syncState();
  assert.equal(runtime.merchantEconomyAutonomy.cfg.potionLow, 321);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.targetSlots, 17);
  assert.equal(runtime.merchantEconomyAutonomy.cfg.keepValue, 7654321);
  assert.equal(alpha25.cloud.status().stats.extendedConfigChanges, 3);
});

test('brain outcome evaluation has one owner and cloud cycle never evaluates it again', async () => {
  const runtime = runtimeFixture();
  const alpha25 = new Alpha25ControlCenterBrain(runtime);
  let calls = 0;
  alpha25.brain.tickOutcome = () => { calls += 1; return null; };
  alpha25.beforeTick();
  assert.equal(calls, 1);
  alpha25.configureCloud({ baseUrl: 'https://example.workers.dev', writeKey: 'single-owner-secret', account: 'test' });
  alpha25.cloud.lastRuntimePushAt = runtime.now();
  alpha25.cloud.lastConfigPullAt = runtime.now();
  alpha25.brain.shouldAskTeacher = () => false;
  await alpha25.cloud.cycle();
  assert.equal(calls, 1);
  assert.equal(alpha25.status().policies.outcomeEvaluationHasSingleOwner, true);
});
