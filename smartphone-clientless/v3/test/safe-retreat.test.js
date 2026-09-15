'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SafeRetreatPolicy } = require('../src/farmer/safe-retreat');
const { RetreatFarmerController } = require('../src/farmer/retreat-farmer');
const { FarmerState } = require('../src/farmer/farmer-fsm');
const { Runtime } = require('../src/runtime');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 50, map: 'main',
    x: 0, y: 0, hp: 500, max_hp: 1000, mp: 500, max_mp: 500,
    range: 128, speed: 40, frequency: 2, rip: false,
    inventory: [{ index: 0, name: 'hpot0', q: 10 }],
    ...overrides
  };
}

test('SafeRetreatPolicy moves directly away from one threat', () => {
  const policy = new SafeRetreatPolicy();
  const decision = policy.evaluate(character(), [{ id: 'm1', x: 40, y: 0 }]);

  assert.equal(decision.shouldMove, true);
  assert.equal(decision.reason, 'EMERGENCY_THREAT_RETREAT');
  assert.ok(decision.x < 0);
  assert.equal(decision.y, 0);
  assert.equal(decision.step, 60);
  assert.equal(decision.threatCount, 1);
});

test('SafeRetreatPolicy moves away from the combined threat cluster', () => {
  const policy = new SafeRetreatPolicy();
  const decision = policy.evaluate(character(), [
    { id: 'east', x: 40, y: 0 },
    { id: 'north', x: 0, y: 40 }
  ]);

  assert.equal(decision.shouldMove, true);
  assert.ok(decision.x < 0);
  assert.ok(decision.y < 0);
  assert.equal(decision.threatCount, 2);
});

test('SafeRetreatPolicy skips movement when threat positions are unavailable', () => {
  const policy = new SafeRetreatPolicy();
  const decision = policy.evaluate(character(), [{ id: 'm1', x: null, y: null }]);

  assert.equal(decision.shouldMove, false);
  assert.equal(decision.reason, 'THREAT_POSITION_UNKNOWN');
});

test('Runtime arms active emergency retreat with current target and self attackers', () => {
  const runtime = new Runtime({
    mode: 'active',
    root: { parent: {}, character: null, G: {} }
  });
  const snap = {
    character: character(),
    entities: [
      { id: 'current', mtype: 'tortoise', x: 30, y: 0, hp: 100, dead: false, target: 'PartyMate' },
      { id: 'aggro', mtype: 'snake', x: 0, y: 25, hp: 100, dead: false, target: 'R1' },
      { id: 'neutral', mtype: 'goo', x: 50, y: 50, hp: 100, dead: false, target: null }
    ]
  };
  const current = snap.entities[0];

  runtime._armEmergencyRetreat(snap, current, {
    reason: 'MULTI_AGGRO_LOW_HP',
    signals: { hpRatio: 0.5 }
  }, 1234);

  const pending = runtime.takeEmergencyRetreat();
  assert.equal(pending.reason, 'MULTI_AGGRO_LOW_HP');
  assert.equal(pending.sourceTargetId, 'current');
  assert.deepEqual(pending.threats.map((threat) => threat.id).sort(), ['aggro', 'current']);
  assert.equal(runtime.takeEmergencyRetreat(), null);
});

test('Runtime only records the pending retreat and does not issue gameplay commands', () => {
  let commandCalls = 0;
  const runtime = new Runtime({
    adapter: {
      mode: 'active',
      command: () => {
        commandCalls += 1;
        return { executed: true };
      }
    },
    root: { parent: {}, character: null, G: {} }
  });
  const snap = {
    character: character(),
    entities: [{ id: 'current', mtype: 'tortoise', x: 30, y: 0, hp: 100, dead: false, target: 'R1' }]
  };

  runtime._armEmergencyRetreat(snap, snap.entities[0], {
    reason: 'CRITICAL_HP',
    signals: { hpRatio: 0.3 }
  }, 2000);

  assert.equal(commandCalls, 0);
  assert.equal(runtime.pendingEmergencyRetreat.sourceTargetId, 'current');
});

test('Runtime does not arm Safe Retreat while shadowing', () => {
  const runtime = new Runtime({
    mode: 'shadow',
    root: { parent: {}, character: null, G: {} }
  });
  const snap = {
    character: character(),
    entities: [{ id: 'current', mtype: 'tortoise', x: 30, y: 0, hp: 100, dead: false, target: 'R1' }]
  };

  runtime._armEmergencyRetreat(snap, snap.entities[0], {
    reason: 'CRITICAL_HP',
    signals: { hpRatio: 0.3 }
  }, 2000);

  assert.equal(runtime.takeEmergencyRetreat(), null);
});

function retreatContext({ commandResult = { executed: true }, commands = [] } = {}) {
  const pending = {
    at: 10000,
    reason: 'MULTI_AGGRO_LOW_HP',
    hpRatio: 0.5,
    sourceTargetId: 'current',
    sourceTargetType: 'tortoise',
    threats: [
      { id: 'current', mtype: 'tortoise', x: 35, y: 0, target: 'R1' },
      { id: 'other', mtype: 'snake', x: 0, y: 30, target: 'R1' }
    ]
  };
  let consumed = false;
  return {
    snapshot: { observedAt: 10000, character: character(), entities: [], party: [] },
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: {}, skills: {} }),
      command: (action, args = []) => {
        commands.push({ action, args });
        if (action === 'use_hp') return { executed: false, reason: 'COMMAND_UNAVAILABLE' };
        return commandResult;
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: {
      takeEmergencyRetreat: () => {
        if (consumed) return null;
        consumed = true;
        return pending;
      }
    }
  };
}

test('RetreatFarmer executes one safe retreat and transitions to recovery', () => {
  const commands = [];
  const farmer = new RetreatFarmerController({
    now: () => 10000,
    kitingEnabled: false,
    skillUsageEnabled: false
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'current';
  farmer.targetType = 'tortoise';
  const context = retreatContext({ commands });

  farmer.step(context);

  const move = commands.find((entry) => entry.action === 'move');
  assert.ok(move);
  assert.ok(move.args[0] < 0);
  assert.ok(move.args[1] < 0);
  assert.equal(farmer.state, FarmerState.RECOVER);
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.status().safeRetreat.lastMove.emergencyReason, 'MULTI_AGGRO_LOW_HP');

  farmer.step(context);
  assert.equal(commands.filter((entry) => entry.action === 'move').length, 1);
});

test('RetreatFarmer does not block when safe retreat movement fails', () => {
  const commands = [];
  const farmer = new RetreatFarmerController({
    now: () => 10000,
    kitingEnabled: false,
    skillUsageEnabled: false
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'current';
  farmer.targetType = 'tortoise';

  farmer.step(retreatContext({ commandResult: { executed: false, reason: 'COMMAND_FAILED' }, commands }));

  assert.equal(farmer.state, FarmerState.RECOVER);
  assert.notEqual(farmer.state, FarmerState.BLOCKED);
  assert.equal(farmer.status().safeRetreat.lastFailure.reason, 'COMMAND_FAILED');
});
