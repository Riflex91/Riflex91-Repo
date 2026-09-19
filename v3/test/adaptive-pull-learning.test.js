'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AdaptivePullLearner } = require('../src/autonomy/adaptive-pull-learning');
const { SmartAoePlanner, SmartAoeState } = require('../src/autonomy/smart-aoe-planner');
const { CombatMode } = require('../src/autonomy/combat-modes');
const { PartyPerformanceStore } = require('../src/party/performance-store');
const { createPullLearningFingerprint } = require('../src/party/fingerprints');

function storage() {
  const rows = new Map();
  return {
    get(key) { return rows.get(String(key)); },
    set(key, value) { rows.set(String(key), value); return true; },
    rows
  };
}

function snapshot() {
  return {
    character: {
      name: 'WarriorA', ctype: 'warrior', level: 80, map: 'main',
      hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000
    },
    entities: [
      { id: 'm1', mtype: 'goo', hp: 1000, max_hp: 1000, target: 'WarriorA' }
    ],
    party: []
  };
}

function members() {
  return [
    { name: 'WarriorA', ctype: 'warrior', level: 80, gear: {}, skillUnlocks: ['cleave', 'agitate'] },
    { name: 'RangerA', ctype: 'ranger', level: 80, gear: {}, skillUnlocks: ['3shot', '5shot'] },
    { name: 'PriestA', ctype: 'priest', level: 80, gear: {}, skillUnlocks: ['heal', 'partyheal'] }
  ];
}

function partyFingerprint() {
  return { key: 'party:test:warrior-ranger-priest' };
}

function encounterFingerprint(disposition = 'SAFE') {
  return {
    monster: { mtype: 'goo' },
    contentDisposition: disposition,
    partyLevelBand: 80,
    event: null
  };
}

function runtime(nowRef, store, mem = storage()) {
  const snap = snapshot();
  const rt = {
    root: {},
    now: () => nowRef.value,
    log: { emit() {} },
    partyPerformance: store,
    adapter: {
      getGameData: () => ({
        monsters: { goo: { hp: 1000, attack: 80, frequency: 1, armor: 0, resistance: 0 } }
      })
    },
    teamCombatCohesionHotfix: {
      _team: () => ({
        selfName: 'WarriorA',
        leaderName: 'WarriorA',
        names: ['WarriorA', 'RangerA', 'PriestA'],
        members: members(),
        complete: true,
        alive: true,
        sameMap: true,
        positionsKnown: true,
        cohesive: true,
        healthReady: true,
        manaReady: true
      })
    }
  };
  return { rt, snap, mem };
}

function baseKey(rt, snap, disposition = 'SAFE') {
  return createPullLearningFingerprint({
    snapshot: snap,
    gameData: rt.adapter.getGameData(),
    monster: 'goo',
    currentMembers: members(),
    partyLevelBand: 80,
    contentDisposition: disposition
  }).key;
}

function seed(store, encounterKey, partyKey, size, options = {}) {
  const seconds = options.seconds == null ? 90 : options.seconds;
  const samples = options.samples == null ? 12 : options.samples;
  const xpPerHour = options.xpPerHour == null ? 100000 : options.xpPerHour;
  const hours = seconds / 3600;
  return store.record(`${encounterKey}::pull=${size}`, partyKey, {
    samples,
    seconds,
    xp: xpPerHour * hours,
    gold: (options.goldPerHour || 0) * hours,
    deaths: options.deaths || 0,
    retreats: options.retreats || 0,
    nearDeaths: options.nearDeaths || 0,
    safetyMargin: options.safetyMargin == null ? 0.70 : options.safetyMargin,
    score: options.score == null ? 0.8 : options.score
  });
}

test('adaptive learner selects a sustainably faster observed pull size without exceeding the deterministic hard capacity', () => {
  const nowRef = { value: 1_000_000 };
  const store = new PartyPerformanceStore({ storage: storage(), now: () => nowRef.value });
  const { rt, snap, mem } = runtime(nowRef, store);
  const learner = new AdaptivePullLearner(rt, {
    storage: mem,
    minSamples: 8,
    minCombatSeconds: 40,
    minConfidence: 0.20,
    strongSamples: 24
  });
  const key = baseKey(rt, snap);
  const party = partyFingerprint().key;
  seed(store, key, party, 2, { xpPerHour: 100000, samples: 12, seconds: 90, safetyMargin: 0.72 });
  seed(store, key, party, 3, { xpPerHour: 120000, samples: 12, seconds: 90, safetyMargin: 0.68 });

  const result = learner.recommend({
    snapshot: snap,
    currentMembers: members(),
    monster: 'goo',
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    hardCapacity: 4,
    deterministicDesiredSize: 2,
    combatMode: CombatMode.SMART_AUTO,
    isLeader: true
  });

  assert.equal(result.reason, 'SUSTAINABLE_XP_OPTIMUM');
  assert.equal(result.recommendedSize, 3);
  assert.ok(result.recommendedSize <= result.hardCapacity);
  assert.equal(result.probe, null);
});

test('reliable risk evidence reduces pull size even when the deterministic planner requested a larger pull', () => {
  const nowRef = { value: 1_000_000 };
  const store = new PartyPerformanceStore({ storage: storage(), now: () => nowRef.value });
  const { rt, snap, mem } = runtime(nowRef, store);
  const learner = new AdaptivePullLearner(rt, {
    storage: mem,
    minSamples: 8,
    minCombatSeconds: 40,
    minConfidence: 0.20
  });
  const key = baseKey(rt, snap);
  const party = partyFingerprint().key;
  seed(store, key, party, 2, { xpPerHour: 95000, samples: 12, seconds: 90, safetyMargin: 0.72 });
  seed(store, key, party, 3, {
    xpPerHour: 150000,
    samples: 12,
    seconds: 90,
    safetyMargin: 0.20,
    retreats: 1,
    nearDeaths: 1
  });

  const result = learner.recommend({
    snapshot: snap,
    currentMembers: members(),
    monster: 'goo',
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    hardCapacity: 5,
    deterministicDesiredSize: 3,
    combatMode: CombatMode.AOE_PREFERRED,
    isLeader: true
  });

  assert.equal(result.reason, 'RISK_EVIDENCE_REDUCED_PULL');
  assert.equal(result.recommendedSize, 2);
  assert.equal(result.applied, true);
});

test('unknown next pull size is explored only one step for a bounded persisted window after strong safe evidence', () => {
  const nowRef = { value: 2_000_000 };
  const store = new PartyPerformanceStore({ storage: storage(), now: () => nowRef.value });
  const mem = storage();
  const { rt, snap } = runtime(nowRef, store, mem);
  const learner = new AdaptivePullLearner(rt, {
    storage: mem,
    minSamples: 8,
    minCombatSeconds: 40,
    minConfidence: 0.20,
    strongSamples: 24,
    strongCombatSeconds: 120,
    strongConfidence: 0.40,
    strongSafetyMargin: 0.60,
    probeDurationMs: 30000,
    probeCooldownMs: 600000
  });
  const key = baseKey(rt, snap);
  const party = partyFingerprint().key;
  seed(store, key, party, 2, { xpPerHour: 100000, samples: 30, seconds: 300, safetyMargin: 0.80 });

  const first = learner.recommend({
    snapshot: snap,
    currentMembers: members(),
    monster: 'goo',
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    hardCapacity: 5,
    deterministicDesiredSize: 2,
    combatMode: CombatMode.SMART_AUTO,
    isLeader: true
  });
  assert.equal(first.reason, 'BOUNDED_EXPLORATION_START');
  assert.equal(first.recommendedSize, 3);
  assert.equal(first.probe.size, 3);

  const restored = new AdaptivePullLearner(rt, {
    storage: mem,
    minSamples: 8,
    minCombatSeconds: 40,
    minConfidence: 0.20,
    strongSamples: 24,
    strongCombatSeconds: 120,
    strongConfidence: 0.40,
    strongSafetyMargin: 0.60,
    probeDurationMs: 30000,
    probeCooldownMs: 600000
  });
  nowRef.value += 10000;
  const during = restored.recommend({
    snapshot: snap,
    currentMembers: members(),
    monster: 'goo',
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    hardCapacity: 5,
    deterministicDesiredSize: 2,
    combatMode: CombatMode.SMART_AUTO,
    isLeader: true
  });
  assert.equal(during.reason, 'BOUNDED_EXPLORATION_WINDOW');
  assert.equal(during.recommendedSize, 3);

  nowRef.value += 25000;
  const after = restored.recommend({
    snapshot: snap,
    currentMembers: members(),
    monster: 'goo',
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    hardCapacity: 5,
    deterministicDesiredSize: 2,
    combatMode: CombatMode.SMART_AUTO,
    isLeader: true
  });
  assert.equal(after.recommendedSize, 2);
  assert.notEqual(after.reason, 'BOUNDED_EXPLORATION_START');
});

test('content that is unknown or quarantined never records or applies adaptive pull learning', () => {
  const nowRef = { value: 1_000_000 };
  const store = new PartyPerformanceStore({ storage: storage(), now: () => nowRef.value });
  const { rt, snap, mem } = runtime(nowRef, store);
  const learner = new AdaptivePullLearner(rt, { storage: mem, minSamples: 4, minCombatSeconds: 20, minConfidence: 0.1 });
  rt.adaptivePullLearner = learner;
  rt.tacticalPartyCombat = {
    encounter: {
      targetType: 'goo',
      targetIds: ['m1', 'm2'],
      aoe: { state: SmartAoeState.AOE_BURN, engagedCount: 2 }
    }
  };

  const recorded = learner.recordTelemetryWindow({
    snapshot: snap,
    currentMembers: members(),
    encounterFingerprint: encounterFingerprint('UNKNOWN'),
    partyFingerprint: partyFingerprint(),
    aggregate: { freshReports: 3, xpPerHour: 100000, goldPerHour: 0, killsPerHour: 100, deathsPerHour: 0, potionsPerHour: 0, minHpRatio: 0.9 },
    elapsedMs: 5000
  });
  assert.equal(recorded, null);

  const recommendation = learner.recommend({
    snapshot: snap,
    currentMembers: members(),
    encounterFingerprint: encounterFingerprint('QUARANTINED'),
    partyFingerprint: partyFingerprint(),
    hardCapacity: 5,
    deterministicDesiredSize: 2,
    combatMode: CombatMode.SMART_AUTO,
    isLeader: true
  });
  assert.equal(recommendation.reason, 'CONTENT_NOT_VALIDATED_FOR_LEARNING');
  assert.equal(recommendation.recommendedSize, 2);
});

test('telemetry recording is leader-only and stores pull-size-specific evidence in the existing PartyPerformanceStore', () => {
  const nowRef = { value: 1_000_000 };
  const store = new PartyPerformanceStore({ storage: storage(), now: () => nowRef.value });
  const { rt, snap, mem } = runtime(nowRef, store);
  const learner = new AdaptivePullLearner(rt, { storage: mem });
  rt.adaptivePullLearner = learner;
  rt.tacticalPartyCombat = {
    encounter: {
      targetType: 'goo',
      targetIds: ['m1', 'm2', 'm3'],
      aoe: { state: SmartAoeState.AOE_BURN, engagedCount: 3 }
    }
  };

  const result = learner.recordTelemetryWindow({
    snapshot: snap,
    currentMembers: members(),
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    aggregate: {
      freshReports: 3,
      xpPerHour: 144000,
      goldPerHour: 3600,
      killsPerHour: 120,
      deathsPerHour: 0,
      potionsPerHour: 12,
      minHpRatio: 0.75,
      minMpRatio: 0.50,
      retreats: 0,
      movementCircuits: 0,
      skillFailureBackoffs: 0
    },
    elapsedMs: 5000
  });

  assert.equal(result.pullSize, 3);
  assert.ok(result.profile);
  assert.equal(result.profile.samples, 1);
  assert.equal(result.profile.xpPerHour, 144000);

  rt.teamCombatCohesionHotfix._team = () => ({ selfName: 'RangerA', leaderName: 'WarriorA' });
  const follower = learner.recordTelemetryWindow({
    snapshot: snap,
    currentMembers: members(),
    encounterFingerprint: encounterFingerprint(),
    partyFingerprint: partyFingerprint(),
    aggregate: { freshReports: 3, xpPerHour: 999999, minHpRatio: 1 },
    elapsedMs: 5000
  });
  assert.equal(follower, null);
  assert.equal(result.profile.samples, 1);
});

test('SmartAoePlanner clamps even an over-optimistic adaptive recommendation to its deterministic hard capacity', () => {
  const learner = {
    recommend: () => ({ applied: true, reason: 'TEST_OVERSHOOT', recommendedSize: 99 }),
    status: () => ({ mode: 'test' })
  };
  const planner = new SmartAoePlanner({ adaptivePullLearner: learner, now: () => 1000 });
  const team = {
    members: [
      { hp: 5000, max_hp: 5000, mp: 1800, max_mp: 2000 },
      { hp: 3000, max_hp: 3000, mp: 2000, max_mp: 2200 }
    ],
    complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: true,
    healthReady: true, manaReady: true
  };
  const caps = {
    generation: 1,
    catalogReady: true,
    members: [{
      name: 'RangerA', ctype: 'ranger',
      skills: [{
        id: '5shot', configuredReady: true, targetCapacity: 5,
        parameters: { minTargets: 4 },
        capabilities: ['multi_target_damage', 'ranged_multi_target_damage']
      }]
    }],
    combat: {
      aoeConfigured: true,
      configuredSupport: { groupSustain: true, aoeAggroControl: true }
    }
  };

  const plan = planner.evaluate({
    mode: CombatMode.SMART_AUTO,
    team,
    partyCapabilities: caps,
    engagedTargets: [{ id: 'm1', hp: 1000, max_hp: 1000, mtype: 'goo' }],
    evaluations: [{ allowed: true, projectedDamageRatio: 0.05 }],
    learningContext: { isLeader: true }
  });

  assert.equal(plan.pullCapacity, 5);
  assert.equal(plan.desiredPullSize, 5);
  assert.equal(plan.deterministicDesiredPullSize, 4);
  assert.equal(plan.state, SmartAoeState.BUILD_PULL);
});
