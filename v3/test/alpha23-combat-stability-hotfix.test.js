'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installCohesionInvariantRepair, installCommittedPullContinuation, installCombatFormationHold, installAggroAuthoritativeKiting } = require('../src/reliability/alpha23-combat-stability-hotfix');

test('repairs impossible false cohesion when pair distance is within configured radius', () => {
  const team = { cohesionRadius: 150, _team: () => ({ complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: false, maxPairDistance: 133.286 }) };
  const stats = { cohesionInvariantRepairs: 0 };
  assert.equal(installCohesionInvariantRepair({ teamCombatCohesionHotfix: team }, stats), true);
  assert.equal(team._team({}).cohesive, true);
  assert.equal(stats.cohesionInvariantRepairs, 1);
});

test('committed safe pull continues across mild cohesion drift but untracked fresh target stays blocked', () => {
  const farmer = { targetId: 'tracked-1' };
  const state = { complete: true, alive: true, sameMap: true, positionsKnown: true, cohesive: false, maxPairDistance: 182, selfName: 'My_Ranger1', leaderName: 'My_Ranger1', leaderTargetId: 'tracked-1', names: ['My_Ranger1','My_Ranger2','My_Ranger3'] };
  const team = { cohesionRadius: 150, _combatGate: () => ({ allowed: false, team: state, reason: 'TEAM_NOT_COHESIVE' }), _localSupply: () => ({ ready: true }), _team: () => state };
  const stats = { committedPullContinuations: 0 };
  installCommittedPullContinuation({ farmer, teamCombatCohesionHotfix: team }, stats, { committedPullExtraRadius: 60 });
  const committed = team._combatGate({ snapshot: {} }, { id: 'tracked-1', hp: 9600 }, 'TRAVEL');
  assert.equal(committed.allowed, true);
  assert.equal(committed.reason, 'COMMITTED_SAFE_PULL_CONTINUATION');
  assert.equal(stats.committedPullContinuations, 1);
  const fresh = team._combatGate({ snapshot: {} }, { id: 'fresh-2', hp: 9600 }, 'TRAVEL');
  assert.equal(fresh.allowed, false);
});

test('only the farmer with active monster aggro may kite', () => {
  let baseCalls = 0;
  const kiting = { evaluate: () => { baseCalls += 1; return { shouldMove: true, x: 10, y: 20 }; } };
  const runtime = { farmer: { kiting }, lastSnapshot: { character: { name: 'My_Ranger2' }, entities: [{ id: 'm1', mtype: 'squigtoad', hp: 10, target: 'My_Ranger1' }] } };
  const stats = { nonAggroKiteBlocks: 0, aggroAuthorizedKites: 0 };
  installAggroAuthoritativeKiting(runtime, stats);
  const blocked = kiting.evaluate({ name: 'My_Ranger2' }, { id: 'm1' });
  assert.equal(blocked.shouldMove, false);
  assert.equal(blocked.reason, 'NO_SELF_AGGRO_KITE_HOLD');
  runtime.lastSnapshot.entities[0].target = 'My_Ranger2';
  const allowed = kiting.evaluate({ name: 'My_Ranger2' }, { id: 'm1' });
  assert.equal(allowed.shouldMove, true);
  assert.equal(allowed.aggroAuthorized, true);
  assert.equal(baseCalls, 2);
});

test('formation follow is held during active encounter unless a hard regroup is necessary', () => {
  let baseCalls = 0;
  const farmer = { targetId: 'm1', state: 'ENGAGE' };
  const team = { cohesionRadius: 150, _followLeader: () => { baseCalls += 1; return 'moved'; } };
  const runtime = { farmer, teamCombatCohesionHotfix: team, now: () => 1000, lastSnapshot: { character: { name: 'My_Ranger2' }, entities: [{ id: 'm1', mtype: 'squigtoad', hp: 100 }] } };
  const stats = { combatFormationHolds: 0, hardRegroupsAllowed: 0 };
  installCombatFormationHold(runtime, stats, { hardRegroupExtraRadius: 45 });
  const near = { selfName: 'My_Ranger2', leaderName: 'My_Ranger1', self: { x: 0, y: 0 }, leader: { x: 100, y: 0 } };
  assert.equal(team._followLeader({ snapshot: runtime.lastSnapshot }, near, 'FOLLOW_TEAM_LEADER'), true);
  assert.equal(baseCalls, 0);
  assert.equal(team.lastDecision.reason, 'ACTIVE_ENCOUNTER_FIRE_POSITION');
  const far = { ...near, leader: { x: 230, y: 0 } };
  assert.equal(team._followLeader({ snapshot: runtime.lastSnapshot }, far, 'REGROUP_WITH_TEAM_LEADER'), 'moved');
  assert.equal(baseCalls, 1);
  assert.equal(stats.combatFormationHolds, 1);
  assert.equal(stats.hardRegroupsAllowed, 1);
});
