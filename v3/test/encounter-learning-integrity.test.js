'use strict';

// Final integrity gate: generated runtime bundle must remain stable on this user-authored PR head.\n// Fresh-main final integrity gate: PR #388 must pass without another generated runtime change.

const test = require('node:test');
const assert = require('node:assert/strict');

const { TacticalPartyCombat } = require('../src/autonomy/tactical-party-combat');
const { CombatMode } = require('../src/autonomy/combat-modes');
const { SmartAoeState } = require('../src/autonomy/smart-aoe-planner');
const { StrategicBrainV2 } = require('../src/brain/strategic-brain-v2');
const { AdaptivePullLearner } = require('../src/autonomy/adaptive-pull-learning');
const { PartyPerformanceStore } = require('../src/party/performance-store');
const { PartyTelemetryBridge } = require('../src/party/telemetry-bridge');
const { PerformanceTracker } = require('../src/telemetry/performance-tracker');
const { EncounterLifecycle } = require('../src/autonomy/encounter-lifecycle');
const { Alpha25ControlCenterBrain } = require('../src/reliability/alpha25-control-center-brain');

function localStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); },
    rows
  };
}

function kvStorage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; },
    rows
  };
}

function partyCapabilities() {
  return {
    generation: 1,
    catalogReady: true,
    members: [
      {
        name: 'WarriorA',
        ctype: 'warrior',
        skills: [{ id: 'cleave', configuredReady: true, targetCapacity: 3, parameters: { minTargets: 2 }, capabilities: ['aoe_damage'] }]
      },
      {
        name: 'RangerA',
        ctype: 'ranger',
        skills: [{ id: '3shot', configuredReady: true, targetCapacity: 3, parameters: { minTargets: 2 }, capabilities: ['multi_target_damage'] }]
      }
    ],
    combat: {
      aoePotential: true,
      aoeConfigured: true,
      support: { groupSustain: true, aoeAggroControl: true },
      configuredSupport: { groupSustain: true, aoeAggroControl: true }
    }
  };
}

function monster(id, target, mtype = 'goo') {
  return { id, mtype, hp: 1000, max_hp: 1000, attack: 50, frequency: 1, map: 'main', x: 30, y: 0, target };
}

test('AoE encounter promotes an already-tracked survivor without changing encounter identity', () => {
  const primary = monster('m1', 'WarriorA');
  const survivor = monster('m2', 'RangerA');
  const snapshot = {
    character: { name: 'WarriorA', ctype: 'warrior', hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000, attack: 500, frequency: 1, range: 70, map: 'main', x: 0, y: 0 },
    entities: [primary, survivor],
    party: []
  };
  const team = {
    selfName: 'WarriorA', leaderName: 'WarriorA', names: ['WarriorA', 'RangerA'],
    members: [
      snapshot.character,
      { name: 'RangerA', ctype: 'ranger', hp: 3000, max_hp: 3000, mp: 1200, max_mp: 1500, attack: 450, frequency: 1, range: 120, map: 'main', x: 10, y: 0 }
    ],
    complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true, healthReady: true, manaReady: true
  };
  const farmer = {
    _selectTarget: () => ({ target: primary, ranking: { score: 1 } }),
    _maybeReassessTarget: (_context, target) => target,
    _safeLiveMonsters: () => snapshot.entities,
    _targetAllowed: () => true
  };
  const teamModule = {
    _team: () => team,
    _candidateAllowed: (_context, target) => snapshot.entities.some((row) => row && row.id === target.id && !row.dead),
    _sharedAggro: () => snapshot.entities.find((row) => row && row.target && team.names.includes(String(row.target))) || null
  };
  const runtime = {
    farmer,
    teamCombatCohesionHotfix: teamModule,
    now: () => 1000,
    log: { emit() {} },
    lastSnapshot: snapshot,
    characterCombatProfiles: { getCombatMode: () => CombatMode.SMART_AUTO },
    partyCapabilityResolver: { status: () => partyCapabilities() },
    adapter: { getGameData: () => ({ monsters: { goo: { hp: 1000, attack: 50, frequency: 1 }, bee: { hp: 1000, attack: 50, frequency: 1 } } }) }
  };

  const tactical = new TacticalPartyCombat(runtime);
  tactical._setEncounter(primary, tactical.evaluateTarget(primary, team, snapshot), 'TEST', team, snapshot);
  tactical.encounter.encounterId = 'enc-preserved';
  assert.deepEqual(tactical.encounter.targetIds.sort(), ['m1', 'm2']);

  primary.dead = true;
  primary.hp = 0;
  const unrelatedNewAggro = monster('b1', 'RangerA', 'bee');
  snapshot.entities.push(unrelatedNewAggro);

  tactical._refreshEncounterPlan(snapshot, team);

  assert.equal(tactical.encounter.encounterId, 'enc-preserved');
  assert.equal(tactical.encounter.primaryTargetId, 'm2');
  assert.equal(tactical.encounter.targetId, 'm2');
  assert.notEqual(tactical.encounter.primaryTargetId, 'b1');
  assert.equal(tactical.status().stats.primaryPromotions, 1);
});

function encounterOutcome(id, overrides = {}) {
  return {
    schemaVersion: 1,
    encounterId: id,
    leaderName: 'WarriorA',
    lifecycleState: 'RESOLVED',
    outcome: 'SUCCESS',
    monster: 'goo',
    map: 'main',
    hardCapacity: 4,
    desiredPullSize: 3,
    maxEngaged: 3,
    durationSeconds: 20,
    xp: 100,
    gold: 10,
    kills: 1,
    deaths: 0,
    retreats: 0,
    nearDeaths: 0,
    safetyMargin: 0.8,
    score: 0.9,
    learningEligible: true,
    startedAt: 1000,
    endedAt: 2000,
    ...overrides
  };
}

test('StrategicBrainV2 persists the bounded encounter dedupe ring across restart', () => {
  const storage = localStorage();
  const root = { localStorage: storage };
  const runtime = {
    root,
    now: () => 3000,
    lastSnapshot: { character: { name: 'WarriorA', ctype: 'warrior', hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, inventory: [], isize: 42 }, party: [], entities: [] },
    performance: { status: () => ({ current: { rates: {} }, recent: [] }) }
  };
  const first = new StrategicBrainV2({ runtime, root, now: runtime.now });
  const learned = first.ingestEncounterOutcome(encounterOutcome('enc-once'));
  assert.equal(learned.accepted, true);
  assert.ok(first.exportState().seenEncounterOutcomes.includes('enc-once'));

  const restored = new StrategicBrainV2({ runtime, root, now: runtime.now });
  const duplicate = restored.ingestEncounterOutcome(encounterOutcome('enc-once'));
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, 'ENCOUNTER_OUTCOME_DUPLICATE');
  assert.equal(restored.status().student.outcomes, 1);
});

test('generic brain outcome waits for its active encounter and is suppressed by the discrete encounter result', () => {
  let now = 5000;
  const root = { localStorage: localStorage() };
  const runtime = {
    root,
    now: () => now,
    lastSnapshot: { character: { name: 'WarriorA', ctype: 'warrior', hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, inventory: [], isize: 42 }, party: [], entities: [] },
    performance: { status: () => ({ current: { rates: { xpPerHour: 1000, goldPerHour: 100 } }, recent: [] }) },
    encounterLifecycle: { current: { encounterId: 'enc-generic' } }
  };
  const brain = new StrategicBrainV2({ runtime, root, now: () => now });
  brain.pendingOutcome = {
    startedAt: 1000,
    dueAt: now,
    action: 'continue',
    target: 'goo',
    confidence: 0.8,
    baseline: brain.captureMetrics(),
    encounterId: 'enc-generic'
  };

  assert.equal(brain.tickOutcome(), null);
  assert.ok(brain.pendingOutcome);
  assert.equal(brain.status().stats.genericOutcomeAttributionDeferrals, 1);

  runtime.encounterLifecycle.current = null;
  const learned = brain.ingestEncounterOutcome(encounterOutcome('enc-generic', { endedAt: now }));
  assert.equal(learned.accepted, true);
  assert.equal(brain.pendingOutcome, null);
  assert.equal(brain.status().student.outcomes, 1);
  assert.ok(brain.status().stats.genericOutcomeAttributionSuppressions >= 1);

  now += 10000;
  assert.equal(brain.tickOutcome(), null);
  assert.equal(brain.status().student.outcomes, 1);
});

test('AdaptivePullLearner persists encounter IDs before mutation and rejects the same encounter after restart', () => {
  const now = { value: 10000 };
  const perfStorage = kvStorage();
  const learnerStorage = kvStorage();
  const performance = new PartyPerformanceStore({ storage: perfStorage, now: () => now.value });
  const runtime = { now: () => now.value, partyPerformance: performance, root: {} };
  const outcome = encounterOutcome('enc-adaptive', {
    pullContextFingerprint: 'pullctx::goo',
    partyFingerprint: 'party::team',
    learningMetrics: { xp: 70, gold: 7, kills: 0.35, hpPotions: 1, mpPotions: 2 }
  });

  const first = new AdaptivePullLearner(runtime, { storage: learnerStorage, performanceStore: performance });
  const record = first.recordEncounterOutcome(outcome);
  assert.ok(record);
  assert.equal(record.sample.xp, 70);
  assert.equal(record.sample.kills, 0.35);
  assert.equal(record.sample.hpPotions, 1);
  assert.equal(record.sample.mpPotions, 2);

  const restored = new AdaptivePullLearner(runtime, { storage: learnerStorage, performanceStore: performance });
  assert.equal(restored.recordEncounterOutcome(outcome), null);
  assert.equal(restored.status().stats.encounterDuplicates, 1);
  const profile = performance.profile('pullctx::goo::pull=3', 'party::team');
  assert.equal(profile.samples, 1);
});

test('PartyTelemetryBridge keeps protocol v1 while carrying a bounded ordered encounter history', () => {
  const now = 1_000_000;
  const character = { name: 'WarriorA', ctype: 'warrior', level: 80, map: 'main', x: 1, y: 2, hp: 900, max_hp: 1000, mp: 400, max_mp: 500, inventory: [], isize: 42 };
  const sender = new PartyTelemetryBridge({
    root: { character },
    now: () => now,
    trustedNames: ['WarriorA'],
    encounterOutcomeHistoryLimit: 4,
    encounterOutcomeMaxAgeMs: 600000
  });
  const runtime = {
    now: () => now,
    lastSnapshot: { character, party: [], entities: [] },
    farmerStatus: () => ({}),
    adapter: { stabilityStatus: () => ({ movement: { circuitOpen: false } }) },
    encounterLifecycle: {
      history: [
        encounterOutcome('enc-old', { endedAt: now - 3000, startedAt: now - 23000 }),
        encounterOutcome('enc-new', { endedAt: now - 1000, startedAt: now - 21000 })
      ],
      lastOutcome: encounterOutcome('enc-new', { endedAt: now - 1000, startedAt: now - 21000 })
    },
    lastEncounterOutcome: encounterOutcome('enc-new', { endedAt: now - 1000, startedAt: now - 21000 })
  };

  const report = sender.buildLocalReport(runtime);
  assert.equal(report.protocol, 1);
  assert.equal(report.encounterOutcome.encounterId, 'enc-new');
  assert.deepEqual(report.encounterOutcomes.map((row) => row.encounterId), ['enc-new', 'enc-old']);

  const receiver = new PartyTelemetryBridge({
    root: { character },
    now: () => now,
    trustedNames: ['WarriorA'],
    encounterOutcomeHistoryLimit: 4,
    encounterOutcomeMaxAgeMs: 600000
  });
  assert.equal(receiver.receive('WarriorA', report), true);
  assert.deepEqual(receiver.encounterOutcomeList().map((row) => row.encounterId), ['enc-old', 'enc-new']);
  assert.equal(receiver.encounterOutcomes().WarriorA.encounterId, 'enc-new');
});

test('Alpha25 merchant ingests every unseen remote encounter in chronological order', () => {
  const seen = [];
  const feedback = [];
  const alpha25 = Object.create(Alpha25ControlCenterBrain.prototype);
  alpha25.runtime = {
    lastSnapshot: { character: { name: 'My_Merchant', ctype: 'merchant' } },
    partyTelemetry: {
      encounterOutcomeList: () => [
        encounterOutcome('enc-3', { endedAt: 3000 }),
        encounterOutcome('enc-1', { endedAt: 1000 }),
        encounterOutcome('enc-2', { endedAt: 2000 })
      ]
    }
  };
  alpha25.brain = {
    ingestEncounterOutcome(row) {
      if (seen.includes(row.encounterId)) return { accepted: false, reason: 'ENCOUNTER_OUTCOME_DUPLICATE', encounterId: row.encounterId };
      seen.push(row.encounterId);
      return { accepted: true, encounterId: row.encounterId };
    },
    tickOutcome: () => null
  };
  alpha25.cloud = { pendingFeedback: feedback, cycle: () => null };
  alpha25.now = () => 5000;
  alpha25.lastCycleAt = 5000;
  alpha25.progressionPolicyTarget = null;
  alpha25._syncLateProgressionPolicy = () => false;
  alpha25.stats = { ticks: 0, outcomes: 0, remoteEncounterOutcomes: 0, remoteEncounterOutcomeBatches: 0, remoteEncounterOutcomeSkips: 0, cloudCyclesStarted: 0, cloudCycleErrors: 0, localPatches: 0, remoteExtendedPatches: 0, extendedSettingsApplied: 0, lateProgressionPolicySyncs: 0 };

  assert.equal(alpha25.beforeTick(), true);
  assert.deepEqual(seen, ['enc-1', 'enc-2', 'enc-3']);
  assert.deepEqual(feedback.map((row) => row.encounterId), ['enc-1', 'enc-2', 'enc-3']);
  assert.equal(alpha25.stats.remoteEncounterOutcomes, 3);
  assert.equal(alpha25.stats.remoteEncounterOutcomeBatches, 1);

  assert.equal(alpha25.beforeTick(), false);
  assert.equal(alpha25.stats.remoteEncounterOutcomes, 3);
});

test('PerformanceTracker splits HP and MP potion use without changing total potion accounting', () => {
  let now = 0;
  const tracker = new PerformanceTracker({ now: () => now, windowMs: 60000 });
  const snap = (hpCount, mpCount) => ({
    character: {
      name: 'R1', ctype: 'ranger', level: 80, map: 'main',
      xp: 0, gold: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      inventory: [
        { index: 0, name: 'hpot1', q: hpCount },
        { index: 1, name: 'mpot1', q: mpCount }
      ]
    },
    entities: [],
    party: []
  });

  tracker.observe(snap(10, 10), { partyFingerprint: 'party::split', gameData: {} });
  now = 1000;
  tracker.observe(snap(8, 9), { partyFingerprint: 'party::split', gameData: {} });

  const current = tracker.status().current;
  assert.equal(current.hpPotions, 2);
  assert.equal(current.mpPotions, 1);
  assert.equal(current.potions, 3);
  assert.equal(current.rates.hpPotionsPerHour, 7200);
  assert.equal(current.rates.mpPotionsPerHour, 3600);
});

test('EncounterLifecycle baselines pre-existing performance and discounts peer-rate estimates for learning', () => {
  let now = 1000;
  let perf = {
    id: 'perf-1', startedAt: 0,
    xp: 100, gold: 10, kills: 5, deaths: 0,
    potions: 0, hpPotions: 0, mpPotions: 0,
    damageTaken: 0, monsterHpLost: 0
  };
  const warrior = { name: 'WarriorA', ctype: 'warrior', level: 80, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, map: 'main', gear: {}, skillUnlocks: [] };
  const snapshot = { character: warrior, party: [], entities: [monster('g1', 'WarriorA')] };
  const team = {
    selfName: 'WarriorA', leaderName: 'WarriorA', names: ['WarriorA', 'RangerA'],
    members: [warrior, { name: 'RangerA', ctype: 'ranger', hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, map: 'main' }],
    complete: true, cohesive: true, healthReady: true
  };
  const runtime = {
    now: () => now,
    lastSnapshot: snapshot,
    world: { fact: () => ({ value: 'APPROVED' }) },
    adapter: {
      getGameData: () => ({ monsters: { goo: { hp: 1000, attack: 50, frequency: 1 } } }),
      stabilityStatus: () => ({ movement: { circuitOpen: false } })
    },
    performance: { status: () => ({ current: { ...perf, rates: {} }, recent: [] }) },
    characterCombatProfiles: { getCombatMode: () => CombatMode.SMART_AUTO },
    partyTelemetry: {
      aggregate: () => ({
        freshReports: 1,
        xpPerHour: 3600,
        goldPerHour: 0,
        killsPerHour: 3600,
        deathsPerHour: 0,
        potionsPerHour: 0,
        hpPotionsPerHour: 0,
        mpPotionsPerHour: 0,
        retreats: 0,
        movementCircuits: 0,
        skillFailureBackoffs: 0,
        reports: [{ name: 'RangerA', rip: false, at: now }]
      })
    },
    farmerStatus: () => ({ skillUsage: { activeFailureBackoffs: [] } }),
    partySkillEngine: { lastUse: null }
  };
  const lifecycle = new EncounterLifecycle(runtime, { now: () => now });
  runtime.encounterLifecycle = lifecycle;
  const tactical = {
    targetId: 'g1', primaryTargetId: 'g1', targetType: 'goo',
    targetIds: ['g1'], pullOwner: 'WarriorA', reason: 'TEST',
    aoe: { state: SmartAoeState.AOE_BURN, pullCapacity: 4, desiredPullSize: 3, engagedCount: 3 }
  };

  lifecycle.begin({ snapshot, team, tacticalEncounter: tactical });
  now = 2000;
  perf = { ...perf, xp: 150, gold: 15, hpPotions: 2, mpPotions: 1, potions: 3 };
  lifecycle.observe({ snapshot, team, tacticalEncounter: tactical });

  snapshot.entities = [];
  tactical.aoe = { ...tactical.aoe, state: SmartAoeState.FINISH, engagedCount: 0 };
  const outcome = lifecycle.finish({ snapshot, team, tacticalEncounter: tactical, reason: 'TARGETS_RESOLVED' });

  assert.equal(outcome.maxEngaged, 3);
  assert.equal(outcome.evidence.exact.xp, 50);
  assert.equal(outcome.evidence.exact.kills, 0);
  assert.equal(outcome.evidence.peerRateEstimate.xp, 1);
  assert.equal(outcome.evidence.peerRateEstimate.kills, 1);
  assert.equal(outcome.xp, 51);
  assert.equal(outcome.kills, 1);
  assert.equal(outcome.learningMetrics.xp, 50.35);
  assert.equal(outcome.learningMetrics.kills, 0.35);
  assert.equal(outcome.hpPotions, 2);
  assert.equal(outcome.mpPotions, 1);
  assert.equal(outcome.killAttribution, 'LOCAL_CONFIRMED_PLUS_PEER_RATE_ESTIMATE');
  assert.equal(outcome.progressAttribution, 'LOCAL_EXACT_PLUS_PEER_RATE_ESTIMATE');
  assert.equal(outcome.learningMetrics.policy, 'LOCAL_EXACT_PLUS_DISCOUNTED_PEER_RATE_ESTIMATE');
});
