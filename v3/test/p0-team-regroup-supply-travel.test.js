'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SafeTravelController } = require('../src/travel/safe-travel');
const { TeamCombatCohesionHotfix } = require('../src/party/team-combat-cohesion-hotfix');
const { Alpha28CrossMapFarmerProgression, SHARED_OBJECTIVE, TEAM_REGROUP_KIND } = require('../src/reliability/alpha28-cross-map-farmer');
const { Alpha20_5MerchantRuntime } = require('../src/autonomy/alpha20-5-merchant-runtime');

function gameData() {
  return { maps: { main: {}, winterland: {} }, monsters: { tortoise: {} }, npcs: {}, items: {}, skills: {}, events: {} };
}

function travelSnapshot(map = 'main', x = 0, y = 0) {
  return { character: { name: 'My_Merchant', ctype: 'merchant', map, x, y, real_x: x, real_y: y } };
}

function driftedMap(map) {
  return { requiresRevalidation(category, id) { return category === 'maps' && String(id) === String(map); } };
}

test('SafeTravel only accepts a drifted destination with a fresh approved map attestation', () => {
  let now = 100000;
  const travel = new SafeTravelController({ now: () => now });
  const baseContext = { gameData: gameData(), contentDrift: driftedMap('winterland'), snapshot: travelSnapshot('main') };

  const blocked = travel.plan({ destination: 'winterland' }, baseContext);
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.reason, 'DESTINATION_MAP_REQUIRES_REVALIDATION');

  const fresh = travel.plan({ destination: 'winterland' }, {
    ...baseContext,
    destinationMapAttestation: {
      map: 'winterland',
      trusted: true,
      source: 'trusted-owned-farmer-service',
      observedAt: now - 1000,
      maxAgeMs: 25000,
      subject: 'My_Ranger2'
    }
  });
  assert.equal(fresh.accepted, true);
  assert.equal(fresh.plan.reason, 'SAFE_PLAN_CREATED_WITH_TRUSTED_MAP_ATTESTATION');
  assert.equal(fresh.plan.destinationMapAttestation.source, 'trusted-owned-farmer-service');
  assert.equal(travel.status().stats.attestedMapPlans, 1);

  const stale = travel.plan({ destination: 'winterland' }, {
    ...baseContext,
    destinationMapAttestation: {
      map: 'winterland',
      trusted: true,
      source: 'trusted-owned-farmer-service',
      observedAt: now - 30001,
      maxAgeMs: 25000,
      subject: 'My_Ranger2'
    }
  });
  assert.equal(stale.reason, 'DESTINATION_MAP_REQUIRES_REVALIDATION');

  const unapprovedSource = travel.plan({ destination: 'winterland' }, {
    ...baseContext,
    destinationMapAttestation: {
      map: 'winterland',
      trusted: true,
      source: 'arbitrary-bypass',
      observedAt: now,
      maxAgeMs: 25000
    }
  });
  assert.equal(unapprovedSource.reason, 'DESTINATION_MAP_REQUIRES_REVALIDATION');
});

test('team formation never converts a cross-map leader position into a local move command', () => {
  const hotfix = Object.create(TeamCombatCohesionHotfix.prototype);
  hotfix.now = () => 1234;
  hotfix.stats = { incompleteTeamBlocks: 0 };
  hotfix._event = () => {};
  let moveCommands = 0;
  const context = { adapter: { command() { moveCommands += 1; return { executed: true }; } } };
  const team = {
    selfName: 'My_Ranger2',
    leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger2', map: 'winterland', x: -200, y: -700 },
    leader: { name: 'My_Ranger1', map: 'main', x: -87, y: 673 }
  };

  assert.equal(hotfix._followLeader(context, team, 'LOCAL_POTION_SUPPLY_INCOMPLETE'), true);
  assert.equal(moveCommands, 0);
  assert.equal(hotfix.lastDecision.reason, 'CROSS_MAP_REGROUP_REQUIRED');
  assert.equal(hotfix.lastDecision.leaderMap, 'main');
  assert.equal(hotfix.lastDecision.memberMap, 'winterland');
});

test('cohesive leader still delegates to the base safe target selector and can open a new target', () => {
  const target = { id: 'tortoise-1', mtype: 'tortoise', target: null, max_hp: 100, dead: false, rip: false };
  let baseSelections = 0;
  const farmer = {
    _selectTarget() { baseSelections += 1; return { target, ranking: { monster: 'tortoise', score: 10 } }; },
    _safeLiveMonsters() { return [target]; },
    _travel() {},
    _engage() {},
    kiting: null
  };
  const localFarming = { tick() { return { action: 'HOLD', reason: 'TEST' }; } };
  const party = {
    My_Merchant: { name: 'My_Merchant', type: 'merchant', map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100 },
    My_Ranger1: { name: 'My_Ranger1', type: 'ranger', map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, target: null },
    My_Ranger2: { name: 'My_Ranger2', type: 'ranger', map: 'main', x: 20, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, target: null },
    My_Ranger3: { name: 'My_Ranger3', type: 'ranger', map: 'main', x: -20, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100, target: null }
  };
  const root = { parent: { party } };
  const runtime = {
    farmer,
    localFarming,
    root,
    now: () => 1000,
    log: { emit() {} },
    adapter: {},
    partyBootstrap: {
      merchantName: 'My_Merchant',
      trustedRosterNames() { return ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']; }
    }
  };
  const hotfix = new TeamCombatCohesionHotfix(runtime);
  const snapshot = {
    character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 100, max_hp: 100, mp: 100, max_mp: 100 },
    entities: [target],
    party: [
      { name: 'My_Ranger1', type: 'ranger' },
      { name: 'My_Ranger2', type: 'ranger' },
      { name: 'My_Ranger3', type: 'ranger' }
    ]
  };

  const selection = farmer._selectTarget({ snapshot, party: [] });
  assert.equal(baseSelections, 1);
  assert.equal(selection.target.id, 'tortoise-1');
  assert.equal(hotfix.lastDecision.action, 'TARGET_LEADER_SELECT');
  assert.equal(hotfix.stats.leaderSelections, 1);
});

test('Alpha28 leader publishes a TEAM_REGROUP objective when verified farmers are split across maps', () => {
  const now = 200000;
  const parent = { party: {} };
  const sent = [];
  const snapshot = {
    character: { name: 'My_Ranger1', ctype: 'ranger', map: 'main', x: -87, y: 673, hp: 100, max_hp: 100 },
    entities: []
  };
  const team = {
    selfName: 'My_Ranger1',
    leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger1', map: 'main', x: -87, y: 673 },
    leader: { name: 'My_Ranger1', map: 'main', x: -87, y: 673 },
    members: [
      { name: 'My_Ranger1', map: 'main', x: -87, y: 673 },
      { name: 'My_Ranger2', map: 'winterland', x: -200, y: -700 },
      { name: 'My_Ranger3', map: 'winterland', x: -250, y: -705 }
    ],
    complete: true,
    alive: true,
    positionsKnown: true,
    sameMap: false,
    cohesive: false
  };
  const runtime = {
    root: { character: snapshot.character, parent },
    lastSnapshot: snapshot,
    adapter: { mode: 'active', getGameData: () => gameData() },
    farmer: { state: 'ASSESS', targetId: null },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    teamCombatCohesionHotfix: { _team: () => team },
    partyAccountCommunication: {
      transport: {
        installDirectReceiver() { return true; },
        send(name, objective) { sent.push({ name, objective }); return true; }
      }
    }
  };
  const stats = { crossMapObjectivesPublished: 0, crossMapObjectivesReceived: 0, crossMapTravelAttempts: 0, crossMapTravelCompleted: 0, crossMapTravelFailedSafe: 0 };
  const module = new Alpha28CrossMapFarmerProgression(runtime, { now: () => now, log: { emit() {} }, stats });

  assert.equal(module.tick(), true);
  const objective = parent[SHARED_OBJECTIVE];
  assert.equal(objective.kind, TEAM_REGROUP_KIND);
  assert.equal(objective.map, 'main');
  assert.equal(objective.leaderName, 'My_Ranger1');
  assert.equal(objective.crossMapAuthorizedBy, 'alpha28-controlled-farmer-travel');
  assert.deepEqual(sent.map((row) => row.name).sort(), ['My_Ranger2', 'My_Ranger3']);
  assert.equal(stats.crossMapRegroupObjectivesPublished, 1);
});

test('merchant service travel passes the fresh owned-farmer report as a scoped map attestation', async () => {
  const runtime = Object.create(Alpha20_5MerchantRuntime.prototype);
  runtime.merchantServiceAllowTravel = true;
  runtime.controlledTravel = { status: () => ({ enabled: true }) };
  runtime.lastMerchantRouteDecision = { route: 'SMART_MOVE' };
  runtime.merchantServicePlanner = { reportTtlMs: 25000 };
  let captured = null;
  runtime.planTravel = (request, context) => {
    captured = { request, context };
    return { accepted: true, plan: { id: 'travel-1' } };
  };
  runtime.executeTravelPlan = async (id) => ({ completed: true, id });

  const result = await runtime._executeMerchantTravel({
    id: 'service-1',
    sourceReportAt: 99000,
    target: { name: 'My_Ranger3', map: 'winterland', x: -250, y: -705 }
  });

  assert.equal(result.completed, true);
  assert.equal(captured.request.destination.map, 'winterland');
  assert.equal(captured.context.destinationMapAttestation.trusted, true);
  assert.equal(captured.context.destinationMapAttestation.source, 'trusted-owned-farmer-service');
  assert.equal(captured.context.destinationMapAttestation.observedAt, 99000);
  assert.equal(captured.context.destinationMapAttestation.subject, 'My_Ranger3');
});
