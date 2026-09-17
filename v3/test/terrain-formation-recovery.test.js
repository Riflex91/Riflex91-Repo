'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TeamCohesionDeadlockHotfix,
  terrainRecoveryOwner
} = require('../src/reliability/team-cohesion-deadlock-hotfix');

function stats() {
  return {
    leaderRecoveryAttempts: 0,
    leaderRecoveryMoves: 0,
    leaderRecoveryShadowMoves: 0,
    leaderRecoveryTerrainHolds: 0,
    leaderRecoverySafetyHolds: 0,
    terrainRecoveryTriggers: 0,
    terrainRecoveryMoves: 0,
    terrainRecoveryShadowMoves: 0,
    terrainRecoveryPeerHolds: 0,
    terrainRecoverySafetyHolds: 0,
    terrainRecoveryFailures: 0,
    terrainRecoveryCompletions: 0,
    terrainRecoveryTimeouts: 0,
    terrainRecoveryUnexpectedMapChanges: 0
  };
}

function teamState(selfName, positions = {}) {
  const defaults = {
    Leader: { x: 0, y: 0 },
    Ranger2: { x: 300, y: 0 },
    Ranger3: { x: 420, y: 0 }
  };
  const merged = { ...defaults, ...positions };
  const members = ['Leader', 'Ranger2', 'Ranger3'].map((name) => ({ name, map: 'main', ...merged[name] }));
  const leader = members[0];
  const self = members.find((row) => row.name === selfName);
  return {
    members,
    leaderName: 'Leader',
    leader,
    selfName,
    self,
    complete: true,
    alive: true,
    sameMap: true,
    positionsKnown: true,
    cohesive: false,
    maxPairDistance: 420
  };
}

function makeOwner() {
  let now = 1000;
  const commands = [];
  let localMoves = 0;
  const team = {
    __terrainRecoveryInstalled: false,
    lastDecision: null,
    _followLeader() {
      localMoves += 1;
      return true;
    }
  };
  const owner = Object.create(TeamCohesionDeadlockHotfix.prototype);
  Object.assign(owner, {
    runtime: {
      root: { smart_move() {}, stop() {} },
      adapter: {
        command(action, args) {
          commands.push({ action, args });
          if (action === 'smart_move') return { executed: true, value: Promise.resolve({ success: true }) };
          return { executed: true };
        }
      },
      farmer: { state: 'SELECT_TARGET' },
      lastSnapshot: null,
      pendingEmergencyRetreat: false
    },
    team,
    now: () => now,
    log: { emit() {} },
    cohesionRadius: 150,
    appliedFollowRadius: 60,
    terrainRecoveryNoProgressMs: 5000,
    terrainRecoveryMinProgress: 12,
    terrainRecoveryCooldownMs: 8000,
    terrainRecoveryTimeoutMs: 45000,
    terrainRecoveryStopRadius: 60,
    formationProgress: new Map(),
    activeTerrainRecovery: null,
    nextTerrainRecoveryId: 1,
    stats: stats()
  });
  return {
    owner,
    team,
    commands,
    setNow(value) { now = value; },
    localMoves: () => localMoves
  };
}

function contextFor(team) {
  return {
    snapshot: {
      character: { name: team.selfName, ctype: 'ranger', map: 'main', x: team.self.x, y: team.self.y, target: null, rip: false },
      entities: []
    }
  };
}

test('terrain recovery owner is deterministic and hands off only after the earlier follower rejoins', () => {
  const split = teamState('Ranger2');
  assert.equal(terrainRecoveryOwner(split, 60).name, 'Ranger2');

  const ranger2Recovered = teamState('Ranger3', { Ranger2: { x: 45, y: 0 } });
  assert.equal(terrainRecoveryOwner(ranger2Recovered, 60).name, 'Ranger3');
});

test('stalled formation follow escalates to one same-map smart_move and suppresses local oscillation', async () => {
  const { owner, team, commands, setNow, localMoves } = makeOwner();
  assert.equal(owner._installFollowerTerrainRecovery(), true);

  const first = teamState('Ranger2');
  team._followLeader(contextFor(first), first, 'REGROUP_WITH_TEAM_LEADER');
  assert.equal(localMoves(), 1);
  assert.equal(commands.length, 0);

  setNow(6500);
  const stalled = teamState('Ranger2');
  team._followLeader(contextFor(stalled), stalled, 'REGROUP_WITH_TEAM_LEADER');
  assert.equal(localMoves(), 1, 'terrain recovery must replace another local wall-bounce move');
  assert.equal(commands.length, 1);
  assert.equal(commands[0].action, 'smart_move');
  assert.deepEqual(commands[0].args[0], { map: 'main', x: 0, y: 0 });
  assert.equal(owner.activeTerrainRecovery.ownerName, 'Ranger2');
  assert.equal(owner.stats.terrainRecoveryMoves, 1);

  setNow(7000);
  team._followLeader(contextFor(stalled), stalled, 'REGROUP_WITH_TEAM_LEADER');
  assert.equal(commands.filter((row) => row.action === 'smart_move').length, 1);
  assert.equal(localMoves(), 1);

  await Promise.resolve();
  const recovered = teamState('Ranger2', { Ranger2: { x: 45, y: 0 } });
  setNow(7500);
  team._followLeader(contextFor(recovered), recovered, 'FOLLOW_TEAM_LEADER');
  assert.equal(owner.activeTerrainRecovery, null);
  assert.equal(owner.stats.terrainRecoveryCompletions, 1);
  assert.equal(commands.at(-1).action, 'stop');
});

test('a stalled non-owner follower holds while the deterministic recovery owner routes', () => {
  const { owner, team, commands, setNow, localMoves } = makeOwner();
  owner._installFollowerTerrainRecovery();

  const ranger3 = teamState('Ranger3');
  team._followLeader(contextFor(ranger3), ranger3, 'REGROUP_WITH_TEAM_LEADER');
  assert.equal(localMoves(), 1);

  setNow(6500);
  team._followLeader(contextFor(ranger3), ranger3, 'REGROUP_WITH_TEAM_LEADER');
  assert.equal(localMoves(), 1);
  assert.equal(commands.length, 0);
  assert.equal(owner.stats.terrainRecoveryPeerHolds, 1);
  assert.equal(team.lastDecision.reason, 'WAITING_FOR_TERRAIN_RECOVERY_OWNER');
  assert.equal(team.lastDecision.recoveryOwnerName, 'Ranger2');
});

test('combat or emergency safety prevents terrain smart_move escalation', () => {
  const { owner, team, commands, setNow } = makeOwner();
  owner._installFollowerTerrainRecovery();

  const ranger2 = teamState('Ranger2');
  team._followLeader(contextFor(ranger2), ranger2, 'REGROUP_WITH_TEAM_LEADER');
  setNow(6500);
  const context = contextFor(ranger2);
  context.snapshot.character.target = 'monster-1';
  team._followLeader(context, ranger2, 'REGROUP_WITH_TEAM_LEADER');

  assert.equal(commands.some((row) => row.action === 'smart_move'), false);
  assert.equal(owner.stats.terrainRecoverySafetyHolds, 1);
});
