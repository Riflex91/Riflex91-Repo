'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RetreatFarmerController } = require('../src/farmer/retreat-farmer');
const { FarmerState } = require('../src/farmer/farmer-fsm');
const { CombatEmergencyGate } = require('../src/farmer/combat-emergency');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 50, map: 'main',
    x: 0, y: 0, hp: 500, max_hp: 1000, mp: 500, max_mp: 500,
    range: 128, speed: 40, frequency: 2, rip: false,
    inventory: [{ index: 0, name: 'hpot0', q: 10 }],
    ...overrides
  };
}

function adapter(commands) {
  return {
    mode: 'active',
    getGameData: () => ({ monsters: {}, skills: {} }),
    command: (action, args = []) => {
      commands.push({ action, args });
      if (action === 'use_hp') return { executed: false, reason: 'COMMAND_UNAVAILABLE' };
      return { executed: true };
    }
  };
}

function pendingRetreatRuntime() {
  let pending = {
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
  return {
    takeEmergencyRetreat: () => {
      const value = pending;
      pending = null;
      return value;
    }
  };
}

test('RetreatFarmer consumes an armed retreat before TRAVEL can move toward the target', () => {
  const commands = [];
  const farmer = new RetreatFarmerController({
    now: () => 10000,
    kitingEnabled: false,
    skillUsageEnabled: false
  });
  farmer.state = FarmerState.TRAVEL;
  farmer.targetId = 'current';
  farmer.targetType = 'tortoise';

  const context = {
    snapshot: {
      observedAt: 10000,
      character: character(),
      entities: [{ id: 'current', mtype: 'tortoise', x: 180, y: 0, hp: 100, dead: false, target: 'R1' }],
      party: []
    },
    adapter: adapter(commands),
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: pendingRetreatRuntime()
  };

  farmer.step(context);

  const moves = commands.filter((entry) => entry.action === 'move');
  assert.equal(moves.length, 1);
  assert.ok(moves[0].args[0] < 0, 'retreat move should go away from the east-side threat');
  assert.ok(moves[0].args[1] < 0, 'retreat move should go away from the north-side threat');
  assert.equal(farmer.state, FarmerState.RECOVER);
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.status().safeRetreat.lastMove.emergencyReason, 'MULTI_AGGRO_LOW_HP');
});

test('RetreatFarmer detects emergency from the runtime raw snapshot while filtered snapshot is in TRAVEL', () => {
  const commands = [];
  const rawSnapshot = {
    observedAt: 10000,
    character: character({ hp: 500 }),
    entities: [
      { id: 'current', mtype: 'tortoise', x: 40, y: 0, hp: 100, dead: false, target: 'R1' },
      { id: 'other', mtype: 'snake', x: 0, y: 35, hp: 100, dead: false, target: 'R1' }
    ],
    party: []
  };

  let emergencyNotes = 0;
  const runtime = {
    lastSnapshot: rawSnapshot,
    pendingEmergencyRetreat: null,
    combatEmergency: new CombatEmergencyGate(),
    _noteEmergencyDisengage(entity, emergency, snapshot) {
      emergencyNotes += 1;
      this.pendingEmergencyRetreat = {
        at: 10000,
        reason: emergency.reason,
        hpRatio: emergency.signals.hpRatio,
        sourceTargetId: entity.id,
        sourceTargetType: entity.mtype,
        threats: snapshot.entities
          .filter((candidate) => String(candidate.id) === String(entity.id) || candidate.target === snapshot.character.name)
          .map((candidate) => ({
            id: String(candidate.id),
            mtype: candidate.mtype,
            x: candidate.x,
            y: candidate.y,
            target: candidate.target
          }))
      };
    },
    takeEmergencyRetreat() {
      const value = this.pendingEmergencyRetreat;
      this.pendingEmergencyRetreat = null;
      return value;
    }
  };

  const farmer = new RetreatFarmerController({
    now: () => 10000,
    kitingEnabled: false,
    skillUsageEnabled: false
  });
  farmer.state = FarmerState.TRAVEL;
  farmer.targetId = 'current';
  farmer.targetType = 'tortoise';

  const context = {
    // Simulates the scheduler-facing snapshot after safety/risk filtering.
    snapshot: { ...rawSnapshot, entities: [] },
    adapter: adapter(commands),
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime
  };

  farmer.step(context);

  assert.equal(emergencyNotes, 1);
  assert.equal(commands.filter((entry) => entry.action === 'move').length, 1);
  assert.equal(farmer.state, FarmerState.RECOVER);
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.status().safeRetreat.lastMove.emergencyReason, 'MULTI_AGGRO_LOW_HP');

  farmer.step(context);
  assert.equal(emergencyNotes, 1, 'clearing the target must prevent a repeated emergency episode');
  assert.equal(commands.filter((entry) => entry.action === 'move').length, 1, 'safe retreat remains one-shot');
});
