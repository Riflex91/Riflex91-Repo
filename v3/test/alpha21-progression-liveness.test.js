'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  outboundWork,
  boundedReachableMove,
  actionableRendezvousRows,
  patchControlledPartyLogisticsRendezvous,
  patchEconomyV2PartyStarvation
} = require('../src/reliability/alpha21-liveness-guards');
const {
  bestLeaderRecoveryWaypoint,
  maxPairDistance
} = require('../src/reliability/team-cohesion-deadlock-hotfix');
const {
  evaluateProgressionReadiness,
  progressionGoalScore,
  enumerateProgressionCandidates
} = require('../src/reliability/alpha21-progression-intelligence');
const { ControlledPartyLogistics, Action } = require('../src/reliability/controlled-party-logistics');
const { EconomyEquipmentAutonomyV2, HomePhase } = require('../src/reliability/economy-equipment-autonomy-v2');

test('empty logistics work never creates a rendezvous request', () => {
  patchControlledPartyLogisticsRendezvous();
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.pendingOffer = null;
  logistics.pendingGrant = null;
  logistics.pendingOutbound = null;
  logistics.config = { farmerGoldReserve: 1000 };
  logistics._safeLootCandidate = () => null;
  logistics.now = () => 100;
  logistics.rendezvousRequests = new Map();
  logistics.lastDecision = null;

  const snapshot = { character: { name: 'Farmer', gold: 1000, inventory: [] } };
  assert.deepEqual(outboundWork(logistics, snapshot), { hasWork: false, goldSurplus: 0, item: null });
  assert.equal(logistics._offerOutbound(snapshot), false);
  assert.equal(logistics.rendezvousRequests.size, 0);
  assert.equal(logistics.lastDecision.reason, 'NO_OUTBOUND_TRANSFER_WORK');
});

test('status requests never become merchant rendezvous work but actionable requests do', () => {
  patchControlledPartyLogisticsRendezvous();
  const logistics = Object.create(ControlledPartyLogistics.prototype);
  logistics.rendezvousRequests = new Map();
  logistics.now = () => 5000;

  assert.equal(logistics._rememberRendezvous('Farmer', {
    action: Action.STATUS_REQUEST, map: 'main', x: 100, y: 100
  }), false);
  assert.equal(logistics.rendezvousRequests.size, 0);

  logistics._rememberRendezvous('Farmer', {
    action: Action.RENDEZVOUS, reason: 'OUTBOUND_TRANSFER', map: 'main', x: 100, y: 100
  });
  const row = logistics.rendezvousRequests.get('Farmer');
  assert.equal(row.action, Action.RENDEZVOUS);
  assert.equal(row.workReason, 'OUTBOUND_TRANSFER');
});

test('blocked rendezvous rows are not actionable home-service preemption work', () => {
  const logistics = {
    config: { rendezvousRequestTtlMs: 15000 },
    rendezvousRequests: new Map([
      ['blocked', { name: 'blocked', action: Action.RENDEZVOUS, at: 1000, blockedUntil: 9000 }],
      ['ready', { name: 'ready', action: Action.SUPPLY_REQUEST, at: 2000, blockedUntil: 0 }]
    ])
  };
  assert.deepEqual(actionableRendezvousRows(logistics, 5000).map((row) => row.name), ['ready']);
});

test('merchant rendezvous movement chooses a reachable bounded alternative', () => {
  const move = boundedReachableMove(
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    {
      maxStep: 60,
      stopDistance: 20,
      canMoveTo: (x, y) => Math.abs(y) > 1
    }
  );
  assert.ok(move);
  assert.notEqual(move.offsetDeg, 0);
  assert.ok(move.step <= 60);
  assert.ok(move.nextDistance < move.distance);
});

test('failed or blocked rendezvous cannot starve merchant home service', async () => {
  patchEconomyV2PartyStarvation();
  const transitions = [];
  const economy = Object.create(EconomyEquipmentAutonomyV2.prototype);
  economy.runtime = {
    adapter: { stabilityStatus: () => ({ movement: { circuitOpen: false, pendingOutcomeId: null } }) },
    lastSnapshot: { character: { name: 'Merchant', ctype: 'merchant' } },
    controlledPartyLogistics: {
      config: { rendezvousRequestTtlMs: 15000 },
      rendezvousRequests: new Map([['Farmer', {
        name: 'Farmer', action: Action.RENDEZVOUS, at: 900, blockedUntil: 2000
      }]]),
      _rendezvousMerchant: () => {
        throw new Error('blocked rendezvous must not attempt movement');
      }
    }
  };
  economy.now = () => 1000;
  economy.stats = { partyPreemptions: 0 };
  economy._transition = (phase, reason, data) => transitions.push({ phase, reason, data });
  economy.lastDecision = null;

  const acted = await economy._partyService({
    priority: 75,
    reason: 'LOGISTICS_RENDEZVOUS',
    report: { name: 'Farmer' }
  });
  assert.equal(acted, false);
  assert.equal(transitions[0].phase, HomePhase.TOWN_RETURN);
  assert.equal(transitions[0].reason, 'RENDEZVOUS_DEFERRED_HOME_SERVICE_CONTINUES');
  assert.equal(economy.lastDecision.reason, 'FAILED_RENDEZVOUS_MUST_NOT_STARVE_HOME_SERVICE');
  assert.equal(economy.stats.partyPreemptions, 0);
});

test('leader recovery waypoint makes bounded progress without giving followers farm authority', () => {
  const team = {
    leaderName: 'A',
    selfName: 'A',
    self: { name: 'A', x: 0, y: 0 },
    members: [
      { name: 'A', x: 0, y: 0 },
      { name: 'B', x: 210, y: 0 },
      { name: 'C', x: 170, y: 20 }
    ]
  };
  const before = maxPairDistance(team.members);
  const waypoint = bestLeaderRecoveryWaypoint(team, {
    cohesionRadius: 150,
    maxStep: 60,
    minImprovement: 5,
    canMoveTo: () => true
  });
  assert.ok(waypoint);
  assert.ok(waypoint.step <= 60);
  assert.ok(waypoint.nextMax < before);
  assert.ok(waypoint.improvement >= 5);

  const followerView = { ...team, selfName: 'B', self: team.members[1] };
  assert.equal(bestLeaderRecoveryWaypoint(followerView, { cohesionRadius: 150 }), null);
});

test('Alpha21 recognizes a live-data promotion without a hard level guide', () => {
  const result = evaluateProgressionReadiness({
    currentProfile: {
      windows: 6,
      confidence: 0.8,
      killsPerHour: 120,
      xpPerHour: 12000,
      deathsPerHour: 0,
      damageTakenPerHour: 1200,
      potionsPerHour: 20
    },
    currentMeta: { hp: 100, attack: 10, frequency: 1, xp: 100 },
    candidateMeta: { hp: 130, attack: 12, frequency: 1, xp: 190 },
    teamMaxHp: 6000
  });
  assert.equal(result.evidenceReady, true);
  assert.equal(result.ready, true);
  assert.ok(result.difficultyRatio > 1);
  assert.ok(result.projectedEfficiencyRatio > 1);
  assert.ok(result.readinessScore >= 0.70);
});

test('Alpha21 rejects a difficulty jump that exceeds bounded party readiness', () => {
  const result = evaluateProgressionReadiness({
    currentProfile: {
      windows: 6,
      confidence: 0.9,
      killsPerHour: 100,
      xpPerHour: 10000,
      deathsPerHour: 0.02,
      damageTakenPerHour: 1500,
      potionsPerHour: 25
    },
    currentMeta: { hp: 100, attack: 10, frequency: 1, xp: 100 },
    candidateMeta: { hp: 2000, attack: 150, frequency: 1.5, xp: 1000 },
    teamMaxHp: 6000
  });
  assert.equal(result.ready, false);
  assert.ok(result.difficultyRatio > 1.85 || result.projectedTtkSeconds > 75);
});

test('gear goals follow the actual Alpha21 bottleneck', () => {
  const tanky = { improvement: 5, survivalImprovement: 12 };
  const damage = { improvement: 15, survivalImprovement: 1 };
  assert.ok(progressionGoalScore(tanky, 'SURVIVAL') > progressionGoalScore(damage, 'SURVIVAL'));
  assert.ok(progressionGoalScore(damage, 'DPS') > progressionGoalScore(tanky, 'DPS'));
});

test('progression candidates remain fail-closed and use approved world content only', () => {
  const profiles = {
    'goo::ranger:3': {
      windows: 8, confidence: 0.9, killsPerHour: 120, xpPerHour: 12000,
      deathsPerHour: 0, damageTakenPerHour: 1000, potionsPerHour: 10
    }
  };
  const world = {
    performanceFor: (monster, fingerprint) => profiles[`${monster}::${fingerprint}`] || null,
    fact: (type, id) => ({
      value: id === 'snake' ? 'APPROVED' : id === 'goo' ? 'APPROVED' : 'UNKNOWN'
    })
  };
  const gameData = {
    monsters: {
      goo: { hp: 100, attack: 10, xp: 100 },
      snake: { hp: 125, attack: 11, xp: 185 },
      dangerousUnknown: { hp: 120, attack: 12, xp: 300 }
    },
    maps: {
      main: { monsters: [{ type: 'goo', boundary: [0, 0, 40, 40] }] },
      forest: {
        monsters: [
          { type: 'snake', boundary: [100, 100, 140, 140] },
          { type: 'dangerousUnknown', boundary: [200, 200, 240, 240] }
        ]
      }
    }
  };
  const rows = enumerateProgressionCandidates(
    gameData,
    world,
    'ranger:3',
    { map: 'main', monster: 'goo', spawnIndex: 0 },
    { teamMaxHp: 6000 }
  );
  assert.ok(rows.some((row) => row.monster === 'snake'));
  assert.ok(!rows.some((row) => row.monster === 'dangerousUnknown'));
});

test('Alpha21 does not contain direct smart-move authority for cross-map progression', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/reliability/alpha21-progression-intelligence.js'), 'utf8');
  assert.doesNotMatch(source, /smart_move\s*\(/);
  assert.match(source, /CROSS_MAP_PROGRESSION_REQUIRES_AUTHORIZED_FARMER_TRAVEL/);
  assert.match(source, /directSmartMoveAuthority:\s*false/);
});
