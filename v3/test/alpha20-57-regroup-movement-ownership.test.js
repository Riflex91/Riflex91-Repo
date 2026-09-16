'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TeamCombatCohesionHotfix } = require('../src/reliability/team-combat-cohesion-hotfix');
const { Alpha28CrossMapFarmerProgression, TEAM_REGROUP_KIND } = require('../src/reliability/alpha28-cross-map-farmer');
const {
  HOLD_REASON,
  installAlpha2057RegroupMovementOwnership
} = require('../src/reliability/alpha20-57-regroup-movement-ownership');

function stats() {
  return {
    crossMapObjectivesPublished: 0,
    crossMapObjectivesReceived: 0,
    crossMapTravelAttempts: 0,
    crossMapTravelCompleted: 0,
    crossMapTravelFailedSafe: 0
  };
}

function regroupObjective() {
  return {
    id: 'alpha28-regroup-live-ranger3',
    kind: TEAM_REGROUP_KIND,
    leaderName: 'My_Ranger1',
    map: 'main',
    x: -87,
    y: 673,
    createdAt: 1000,
    expiresAt: 16000,
    crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
  };
}

test('active Alpha28 regroup owns follower movement and suppresses competing formation move commands', async () => {
  assert.equal(installAlpha2057RegroupMovementOwnership(), true);

  let resolveSmartMove;
  let planState = 'TRAVELLING';
  let moveCommands = 0;
  const events = [];
  const root = {
    character: { name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: -52, y: -256, hp: 100, max_hp: 100 },
    smart_move() {
      return new Promise((resolve) => { resolveSmartMove = resolve; });
    },
    stop() { return true; }
  };
  const runtime = {
    root,
    adapter: { getGameData: () => ({ maps: { main: {} }, monsters: {} }) },
    safeTravel: {
      plan(request) {
        return { accepted: true, plan: { id: 'travel-live-ranger3', target: request.destination } };
      },
      startControlled() { return { started: true }; },
      observe() { planState = 'COMPLETED'; },
      get() { return { state: planState }; },
      failSafe() { planState = 'FAILED_SAFE'; return true; }
    },
    localFarming: null,
    progressionIntelligence: null
  };
  const crossMap = new Alpha28CrossMapFarmerProgression(runtime, {
    now: () => 2000,
    log: { emit(event) { events.push(event); } },
    stats: stats()
  });
  const objective = regroupObjective();
  crossMap.receivedObjective = objective;
  runtime.alpha28LiveAuthorityLiveness = { crossMap };

  const travelPromise = crossMap._execute(objective, {
    character: { name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: -52, y: -256 }
  });
  await Promise.resolve();
  assert.equal(crossMap.busy, true);
  assert.equal(crossMap.activePlanId, 'travel-live-ranger3');
  assert.equal(crossMap.activeObjectiveId, objective.id);

  const cohesion = Object.create(TeamCombatCohesionHotfix.prototype);
  cohesion.runtime = runtime;
  cohesion.now = () => 2001;
  cohesion.lastFormationMoveAt = -Infinity;
  cohesion.followCooldownMs = 0;
  cohesion.followRadius = 120;
  cohesion.followStep = 80;
  cohesion.stats = { followerHolds: 0, followerMoves: 0 };
  cohesion.root = { can_move_to: () => true };
  cohesion.parent = cohesion.root;
  cohesion._event = (event, severity, reason, data) => events.push({ event, severity, reason, data });

  const team = {
    selfName: 'My_Ranger3',
    leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger3', map: 'main', x: -52, y: -256 },
    leader: { name: 'My_Ranger1', map: 'main', x: -87, y: 673 }
  };
  const context = {
    adapter: {
      command(name) {
        if (name === 'move') moveCommands += 1;
        return { executed: true };
      }
    }
  };

  assert.equal(cohesion._followLeader(context, team, 'REGROUP_WITH_TEAM_LEADER'), true);
  assert.equal(moveCommands, 0);
  assert.equal(cohesion.lastDecision.action, 'FORMATION_HOLD');
  assert.equal(cohesion.lastDecision.reason, HOLD_REASON);
  assert.equal(cohesion.lastDecision.planId, 'travel-live-ranger3');
  assert.equal(events.filter((row) => row.event === 'TEAM_FORMATION_MOVE_SUPPRESSED').length, 1);

  // Repeated cohesion ticks remain suppressed without spamming the suppression event.
  assert.equal(cohesion._followLeader(context, team, 'REGROUP_WITH_TEAM_LEADER'), true);
  assert.equal(moveCommands, 0);
  assert.equal(events.filter((row) => row.event === 'TEAM_FORMATION_MOVE_SUPPRESSED').length, 1);

  resolveSmartMove({ ok: true });
  assert.equal(await travelPromise, true);
  assert.equal(crossMap.busy, false);
  assert.equal(planState, 'COMPLETED');
});

test('formation movement resumes after Alpha28 regroup releases movement authority', () => {
  assert.equal(installAlpha2057RegroupMovementOwnership(), true);
  let moveCommands = 0;
  const cohesion = Object.create(TeamCombatCohesionHotfix.prototype);
  cohesion.runtime = {
    alpha28LiveAuthorityLiveness: {
      crossMap: {
        busy: false,
        activePlanId: null,
        activeObjectiveId: null,
        receivedObjective: regroupObjective()
      }
    }
  };
  cohesion.now = () => 3000;
  cohesion.lastFormationMoveAt = -Infinity;
  cohesion.followCooldownMs = 0;
  cohesion.followRadius = 120;
  cohesion.followStep = 80;
  cohesion.stats = { followerHolds: 0, followerMoves: 0 };
  cohesion.root = { can_move_to: () => true };
  cohesion.parent = cohesion.root;
  cohesion._event = () => {};

  const team = {
    selfName: 'My_Ranger3',
    leaderName: 'My_Ranger1',
    self: { name: 'My_Ranger3', map: 'main', x: -52, y: -256 },
    leader: { name: 'My_Ranger1', map: 'main', x: -87, y: 673 }
  };
  const context = {
    adapter: {
      command(name) {
        if (name === 'move') moveCommands += 1;
        return { executed: true };
      }
    }
  };

  assert.equal(cohesion._followLeader(context, team, 'REGROUP_WITH_TEAM_LEADER'), true);
  assert.equal(moveCommands, 1);
  assert.equal(cohesion.lastDecision.action, 'FORMATION_FOLLOW');
});

test('smart_move object rejection keeps a meaningful reason and emits structured failure telemetry', async () => {
  assert.equal(installAlpha2057RegroupMovementOwnership(), true);

  const events = [];
  let failedReason = null;
  const root = {
    character: { name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: -52, y: -256, hp: 100, max_hp: 100 },
    smart_move() {
      return Promise.reject({
        code: 'MOVE_SUPERSEDED',
        reason: 'FORMATION_MOVE_INTERRUPTED',
        status: 'cancelled'
      });
    },
    stop() { return true; }
  };
  const runtime = {
    root,
    adapter: { getGameData: () => ({ maps: { main: {} }, monsters: {} }) },
    safeTravel: {
      plan(request) {
        return { accepted: true, plan: { id: 'travel-rejected', target: request.destination } };
      },
      startControlled() { return { started: true }; },
      observe() {},
      get() { return { state: 'FAILED_SAFE' }; },
      failSafe(id, reason) { failedReason = reason; return true; }
    },
    localFarming: null,
    progressionIntelligence: null
  };
  const crossMap = new Alpha28CrossMapFarmerProgression(runtime, {
    now: () => 4000,
    log: { emit(event) { events.push(event); } },
    stats: stats()
  });
  const objective = regroupObjective();
  crossMap.receivedObjective = objective;

  assert.equal(await crossMap._execute(objective, {
    character: { name: 'My_Ranger3', ctype: 'ranger', map: 'main', x: -52, y: -256 }
  }), false);

  assert.equal(failedReason, 'MOVE_SUPERSEDED: FORMATION_MOVE_INTERRUPTED');
  assert.equal(crossMap.lastAction.reason, 'MOVE_SUPERSEDED: FORMATION_MOVE_INTERRUPTED');
  assert.notEqual(crossMap.lastAction.reason, '[object Object]');

  const rejection = events.find((row) => row.event === 'ALPHA28_SMART_MOVE_REJECTED');
  assert.ok(rejection);
  assert.equal(rejection.reason, 'MOVE_SUPERSEDED: FORMATION_MOVE_INTERRUPTED');
  assert.equal(rejection.data.source, 'rejection');
  assert.equal(rejection.data.failure.type, 'object');
  assert.equal(rejection.data.failure.code, 'MOVE_SUPERSEDED');
  assert.equal(rejection.data.failure.reason, 'FORMATION_MOVE_INTERRUPTED');
});
