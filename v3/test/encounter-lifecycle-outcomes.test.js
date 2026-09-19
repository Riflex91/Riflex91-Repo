'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EncounterLifecycle,
  EncounterLifecycleState,
  EncounterOutcome
} = require('../src/autonomy/encounter-lifecycle');
const { AdaptivePullLearner } = require('../src/autonomy/adaptive-pull-learning');
const { PartyPerformanceStore } = require('../src/party/performance-store');
const { PartyTelemetryBridge } = require('../src/party/telemetry-bridge');
const { StrategicBrainV2, BRAIN_V2_INPUT_NAMES } = require('../src/brain/strategic-brain-v2');
const { SmartAoeState } = require('../src/autonomy/smart-aoe-planner');

function memoryStorage() {
  const rows = new Map();
  return {
    get: (key) => rows.get(key) || null,
    set: (key, value) => rows.set(key, value),
    getItem: (key) => rows.get(key) || null,
    setItem: (key, value) => rows.set(key, value)
  };
}

function member(name, ctype, hp = 1000, mp = 500) {
  return { name, ctype, level: 80, hp, max_hp: 1000, mp, max_mp: 500, map: 'main', gear: {}, skillUnlocks: [] };
}

function lifecycleFixture() {
  const clock = { value: 1000 };
  const warrior = member('WarriorA', 'warrior');
  const priest = member('PriestA', 'priest');
  let disposition = 'APPROVED';
  let perf = { id: 'perf-1', startedAt: 900, xp: 0, gold: 0, kills: 0, deaths: 0, potions: 0, damageTaken: 0, monsterHpLost: 0 };
  const adaptive = [];
  const brain = [];
  const snapshot = {
    character: warrior,
    party: [priest],
    entities: [{ id: 'g1', mtype: 'goo', hp: 400, max_hp: 400, target: 'WarriorA' }]
  };
  const team = { selfName: 'WarriorA', leaderName: 'WarriorA', names: ['WarriorA', 'PriestA'], members: [warrior, priest], complete: true, cohesive: true, healthReady: true };
  const runtime = {
    now: () => clock.value,
    lastSnapshot: snapshot,
    world: { fact: () => ({ value: disposition }) },
    adapter: {
      getGameData: () => ({ monsters: { goo: { hp: 400, attack: 40, frequency: 1, range: 20 } } }),
      stabilityStatus: () => ({ movement: { circuitOpen: false } })
    },
    performance: { status: () => ({ current: { ...perf, seconds: Math.max(0, (clock.value - perf.startedAt) / 1000), rates: {} }, recent: [] }) },
    characterCombatProfiles: { getCombatMode: () => 'smart_auto' },
    _currentMembers: () => [warrior, priest],
    partyTelemetry: { aggregate: () => ({ freshReports: 0, xpPerHour: 0, goldPerHour: 0, killsPerHour: 0, potionsPerHour: 0, retreats: 0, movementCircuits: 0, skillFailureBackoffs: 0, reports: [] }) },
    farmerStatus: () => ({ skillUsage: { activeFailureBackoffs: [] } }),
    adaptivePullLearner: { recordEncounterOutcome: (row) => { adaptive.push(row); return { profile: { samples: 1 } }; } },
    partyPerformance: { save: () => true },
    strategicBrainV2: { ingestEncounterOutcome: (row) => { brain.push(row); return { accepted: true, encounterId: row.encounterId, reward: 0.5 }; } },
    cloudControlPlane: { pendingFeedback: [] },
    partySkillEngine: { lastUse: null }
  };
  const tactical = {
    targetId: 'g1', primaryTargetId: 'g1', targetType: 'goo', targetIds: ['g1'], pullOwner: 'WarriorA',
    reason: 'TEST', aoe: null
  };
  const lifecycle = new EncounterLifecycle(runtime, { now: () => clock.value });
  runtime.encounterLifecycle = lifecycle;
  return {
    runtime, lifecycle, tactical, team, snapshot, clock, adaptive, brain,
    setDisposition: (value) => { disposition = value; },
    setPerf: (value) => { perf = { ...perf, ...value }; }
  };
}

test('EncounterLifecycle records leader-owned planner transitions and one primary success outcome', () => {
  const fx = lifecycleFixture();
  const started = fx.lifecycle.begin({ snapshot: fx.snapshot, team: fx.team, tacticalEncounter: fx.tactical });
  assert.ok(started && started.encounterId);
  assert.equal(fx.tactical.encounterId, started.encounterId);

  fx.tactical.aoe = { state: SmartAoeState.BUILD_PULL, pullCapacity: 4, desiredPullSize: 2, engagedCount: 1 };
  fx.clock.value += 1000;
  fx.lifecycle.observe({ snapshot: fx.snapshot, team: fx.team, tacticalEncounter: fx.tactical });

  fx.snapshot.entities.push({ id: 'g2', mtype: 'goo', hp: 400, max_hp: 400, target: 'PriestA' });
  fx.tactical.targetIds = ['g1', 'g2'];
  fx.tactical.aoe = { state: SmartAoeState.AOE_BURN, pullCapacity: 4, desiredPullSize: 2, engagedCount: 2, adaptivePull: { reason: 'SUSTAINABLE_XP_OPTIMUM', recommendedSize: 2, profiles: [{ size: 2, confidence: 0.77 }] } };
  fx.runtime.partySkillEngine.lastUse = { at: fx.clock.value + 500, skill: 'cleave', kind: 'aoe', targetId: 'g1', targetCount: 2, executed: true };
  fx.clock.value += 1000;
  fx.setPerf({ xp: 120, gold: 15, kills: 1, potions: 1, damageTaken: 200 });
  fx.lifecycle.observe({ snapshot: fx.snapshot, team: fx.team, tacticalEncounter: fx.tactical });

  fx.tactical.aoe = { ...fx.tactical.aoe, state: SmartAoeState.FINISH, engagedCount: 0 };
  fx.snapshot.entities = [];
  fx.clock.value += 1000;
  fx.setPerf({ xp: 240, gold: 30, kills: 2, potions: 1, damageTaken: 250 });
  const outcome = fx.lifecycle.finish({ snapshot: fx.snapshot, team: fx.team, tacticalEncounter: fx.tactical, reason: 'TARGETS_RESOLVED' });

  assert.equal(outcome.outcome, EncounterOutcome.SUCCESS);
  assert.equal(outcome.lifecycleState, EncounterLifecycleState.RESOLVED);
  assert.equal(outcome.maxEngaged, 2);
  assert.equal(outcome.hardCapacity, 4);
  assert.equal(outcome.desiredPullSize, 2);
  assert.equal(outcome.skillExecutions, 1);
  assert.equal(outcome.aoeSkillExecutions, 1);
  assert.equal(outcome.adaptiveRecommendation, 'SUSTAINABLE_XP_OPTIMUM');
  assert.equal(outcome.adaptiveConfidence, 0.77);
  assert.ok(outcome.xp >= 240);
  assert.equal(outcome.learningEligible, true);
  assert.deepEqual(outcome.plannerStateTransitions.map((row) => row.state), ['CREATED', 'BUILDING', 'ACTIVE', 'FINISHING', 'RESOLVED']);
  assert.equal(fx.adaptive.length, 1);
  assert.equal(fx.brain.length, 1);
  assert.equal(fx.runtime.cloudControlPlane.pendingFeedback.length, 1);
  assert.equal(fx.lifecycle.status().current, null);
});

test('EncounterLifecycle is fail-closed for content drift and only the combat leader can own a lifecycle', () => {
  const fx = lifecycleFixture();
  const followerTeam = { ...fx.team, selfName: 'PriestA' };
  assert.equal(fx.lifecycle.begin({ snapshot: fx.snapshot, team: followerTeam, tacticalEncounter: fx.tactical }), null);
  fx.lifecycle.begin({ snapshot: fx.snapshot, team: fx.team, tacticalEncounter: fx.tactical });
  fx.tactical.aoe = { state: SmartAoeState.AOE_BURN, pullCapacity: 3, desiredPullSize: 2, engagedCount: 1 };
  fx.setDisposition('QUARANTINED');
  fx.clock.value += 1000;
  const outcome = fx.lifecycle.finish({ snapshot: fx.snapshot, team: fx.team, tacticalEncounter: fx.tactical, reason: 'CONTENT_CHANGED' });
  assert.equal(outcome.outcome, EncounterOutcome.CONTENT_DRIFT);
  assert.equal(outcome.learningEligible, false);
});

test('AdaptivePullLearner records final encounter once and suppresses window learning when lifecycle is primary', () => {
  const clock = { value: 5000 };
  const store = new PartyPerformanceStore({ storage: memoryStorage(), now: () => clock.value });
  const runtime = { now: () => clock.value, partyPerformance: store, encounterLifecycle: { primaryOutcomeAttribution: true } };
  const learner = new AdaptivePullLearner(runtime, { storage: memoryStorage() });
  runtime.adaptivePullLearner = learner;
  const recorded = learner.recordEncounterOutcome({
    schemaVersion: 1, encounterId: 'enc-1', outcome: 'SUCCESS', learningEligible: true,
    pullContextFingerprint: 'pullctx::abc', partyFingerprint: 'party::abc', maxEngaged: 4,
    durationSeconds: 40, xp: 1000, gold: 50, kills: 4, deaths: 0, retreats: 0, nearDeaths: 0,
    hpPotions: 2, mpPotions: 0, movementFailures: 0, skillFailures: 0, safetyMargin: 0.8, score: 0.9
  });
  assert.ok(recorded && recorded.profile);
  assert.equal(recorded.pullSize, 4);
  assert.equal(recorded.profile.samples, 1);
  assert.equal(learner.status().stats.encounterRecords, 1);
  assert.equal(learner.recordTelemetryWindow({}), null);
  assert.ok(learner.status().stats.recordSkips >= 1);
});

test('PartyTelemetryBridge carries only fresh leader-owned bounded encounter outcomes without protocol changes', () => {
  const now = 100000;
  const c = { name: 'WarriorA', ctype: 'warrior', level: 80, map: 'main', x: 1, y: 2, hp: 900, max_hp: 1000, mp: 400, max_mp: 500, inventory: [], isize: 42 };
  const bridge = new PartyTelemetryBridge({ root: { character: c }, now: () => now, trustedNames: ['WarriorA'] });
  const runtime = {
    now: () => now, lastSnapshot: { character: c, party: [], entities: [] },
    farmerStatus: () => ({}),
    adapter: { stabilityStatus: () => ({ movement: { circuitOpen: false } }) },
    lastEncounterOutcome: {
      schemaVersion: 1, encounterId: 'enc-fresh', leaderName: 'WarriorA', lifecycleState: 'RESOLVED', outcome: 'SUCCESS',
      monster: 'goo', map: 'main', combatMode: 'smart_auto', hardCapacity: 4, desiredPullSize: 3, maxEngaged: 3,
      durationSeconds: 30, xp: 500, gold: 20, kills: 3, deaths: 0, retreats: 0, nearDeaths: 0, potions: 1,
      skillExecutions: 4, aoeSkillExecutions: 2, movementFailures: 0, skillFailures: 0, safetyMargin: 0.8,
      adaptiveConfidence: 0.7, score: 0.85, learningEligible: true, startedAt: now - 30000, endedAt: now - 1000
    }
  };
  const report = bridge.buildLocalReport(runtime);
  assert.equal(report.protocol, 1);
  assert.equal(report.encounterOutcome.encounterId, 'enc-fresh');
  assert.equal(report.encounterOutcome.maxEngaged, 3);
  assert.equal(bridge.receive('WarriorA', report), true);
  assert.equal(bridge.encounterOutcomes().WarriorA.outcome, 'SUCCESS');
});

test('StrategicBrainV2 learns one bounded reward per encounter and exposes it to teacher requests', () => {
  const storage = memoryStorage();
  const runtime = {
    lastSnapshot: { character: { name: 'WarriorA', ctype: 'warrior', hp: 900, max_hp: 1000, mp: 400, max_mp: 500, inventory: [], isize: 42 }, entities: [] },
    performance: { status: () => ({ current: { rates: { xpPerHour: 1000, goldPerHour: 100, deathsPerHour: 0, damageTakenPerHour: 0 } } }) }
  };
  const brain = new StrategicBrainV2({ runtime, root: { localStorage: storage }, now: () => 123456 });
  runtime.brain = brain;
  brain.lastObservation = {
    quality: { state: 'healthy' },
    student: { action: 'continue', confidence: 0.8, entropy: 0.2, novelty: 0.1 },
    teacher: { source: 'deterministic' },
    inputs: Object.fromEntries(BRAIN_V2_INPUT_NAMES.map((name) => [name, 0.5]))
  };
  brain.pendingOutcome = { startedAt: 1, dueAt: 999999, action: 'continue', target: 'goo', confidence: 0.8, baseline: {} };
  const outcome = {
    schemaVersion: 1, encounterId: 'enc-brain', leaderName: 'WarriorA', outcome: 'SUCCESS', learningEligible: true,
    monster: 'goo', map: 'main', maxEngaged: 4, safetyMargin: 0.8, score: 0.9, endedAt: 123000
  };
  const learned = brain.ingestEncounterOutcome(outcome, { remote: false });
  assert.equal(learned.accepted, true);
  assert.equal(learned.trained, true);
  assert.equal(brain.pendingOutcome, null);
  assert.equal(brain.ingestEncounterOutcome(outcome).reason, 'ENCOUNTER_OUTCOME_DUPLICATE');
  const replay = brain.replay(20);
  assert.ok(replay.some((row) => row.source === 'encounter-outcome'));
  assert.equal(brain.teacherRequest('test').encounterOutcome.encounterId, 'enc-brain');
  assert.equal(brain.status().stats.encounterOutcomeRewards, 1);
});
