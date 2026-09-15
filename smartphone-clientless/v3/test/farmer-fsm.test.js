'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FarmerController, FarmerState, TargetPolicy } = require('../src/farmer/farmer-fsm');

function snapshot(overrides = {}) {
  return {
    observedAt: overrides.observedAt || 10000,
    character: {
      name: 'R1', ctype: 'ranger', level: 50, map: 'main',
      x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
      range: 120, speed: 40, frequency: 2, rip: false,
      inventory: [{ index: 0, name: 'hpot0', q: 10 }, { index: 1, name: 'mpot0', q: 10 }],
      ...overrides.character
    },
    entities: overrides.entities || [
      { id: 'm1', mtype: 'goo', map: 'main', x: 40, y: 0, hp: 100, max_hp: 100, target: null, dead: false }
    ],
    party: []
  };
}

function context({ mode = 'active', snap = snapshot(), commands = [], partyMembers = [{ name: 'R1' }] } = {}) {
  const adapter = {
    mode,
    getGameData: () => ({ monsters: { goo: { xp: 100 }, crab: { xp: 80 } } }),
    canAttack: () => true,
    command: (action, args = []) => {
      commands.push({ action, args });
      return mode === 'active' ? { executed: true } : { executed: false, shadow: true };
    }
  };
  return {
    snapshot: snap,
    adapter,
    world: { performanceFor: () => null },
    party: { members: partyMembers, fingerprint: 'ranger:1' },
    runtime: {}
  };
}

function planner() {
  return {
    rank: (rows) => rows.map((row, index) => ({ ...row, score: 1 - index * 0.1 }))
  };
}

test('Farmer runs a shadow plan without issuing game commands', () => {
  let now = 10000;
  const commands = [];
  const farmer = new FarmerController({ now: () => now, planner: planner() });
  const ctx = context({ mode: 'shadow', commands });
  const result = farmer.step(ctx);
  assert.equal(result.state, 'RUNNING');
  assert.equal(commands.length, 0);
  assert.equal(farmer.status().targetType, 'goo');
  assert.equal(farmer.status().shadowPlanRevision, 1);
});

test('Farmer selects a safe nearby target and attacks through the adapter', () => {
  let now = 10000;
  const commands = [];
  const farmer = new FarmerController({ now: () => now, planner: planner(), attackIntervalMs: 250 });
  const ctx = context({ commands });

  farmer.step(ctx);
  assert.equal(farmer.state, FarmerState.SELECT_TARGET);
  farmer.step(ctx);
  assert.equal(farmer.state, FarmerState.ENGAGE);
  assert.equal(farmer.targetId, 'm1');

  now += 1000;
  farmer.step(ctx);
  assert.equal(commands.at(-1).action, 'attack');
  assert.deepEqual(commands.at(-1).args, ['m1']);
});

test('Farmer defaults to party-only and skips a monster claimed by an unrelated player', () => {
  const farmer = new FarmerController({ now: () => 10000, planner: planner() });
  const snap = snapshot({ entities: [{ id: 'm1', mtype: 'goo', map: 'main', x: 20, y: 0, hp: 100, max_hp: 100, target: 'OtherPlayer', dead: false }] });
  const ctx = context({ snap });
  assert.equal(farmer.status().targetPolicy, TargetPolicy.PARTY_ONLY);
  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.state, FarmerState.REASSESS);
});

test('party-only allows a monster claimed by a current party member', () => {
  const farmer = new FarmerController({ now: () => 10000, planner: planner() });
  const snap = snapshot({ entities: [{ id: 'm1', mtype: 'goo', map: 'main', x: 20, y: 0, hp: 100, max_hp: 100, target: 'PartyMate', dead: false }] });
  const ctx = context({ snap, partyMembers: [{ name: 'R1' }, { name: 'PartyMate' }] });
  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.targetId, 'm1');
  assert.equal(farmer.state, FarmerState.ENGAGE);
});

test('avoid skips party-claimed monsters but still allows monsters targeting self', () => {
  const farmer = new FarmerController({ now: () => 10000, planner: planner(), targetPolicy: 'avoid' });
  const snap = snapshot({ entities: [
    { id: 'party', mtype: 'goo', map: 'main', x: 10, y: 0, hp: 100, max_hp: 100, target: 'PartyMate', dead: false },
    { id: 'self', mtype: 'goo', map: 'main', x: 30, y: 0, hp: 100, max_hp: 100, target: 'R1', dead: false }
  ] });
  const ctx = context({ snap, partyMembers: [{ name: 'R1' }, { name: 'PartyMate' }] });
  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.targetId, 'self');
});

test('allow permits a monster claimed by an unrelated player', () => {
  const farmer = new FarmerController({ now: () => 10000, planner: planner(), targetPolicy: 'allow' });
  const snap = snapshot({ entities: [{ id: 'm1', mtype: 'goo', map: 'main', x: 20, y: 0, hp: 100, max_hp: 100, target: 'OtherPlayer', dead: false }] });
  const ctx = context({ snap });
  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.targetId, 'm1');
});

test('changing target policy clears a now-disallowed live target and forces reassessment', () => {
  let now = 10000;
  const commands = [];
  const farmer = new FarmerController({ now: () => now, planner: planner(), targetPolicy: 'allow', attackIntervalMs: 250 });
  const snap = snapshot({ entities: [{ id: 'm1', mtype: 'goo', map: 'main', x: 20, y: 0, hp: 100, max_hp: 100, target: 'OtherPlayer', dead: false }] });
  const ctx = context({ snap, commands });
  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.targetId, 'm1');
  assert.equal(farmer.setTargetPolicy('party-only'), 'party-only');
  assert.equal(farmer.targetId, null);
  assert.equal(farmer.state, FarmerState.REASSESS);
  now += 1000;
  farmer.step(ctx);
  farmer.step(ctx);
  assert.equal(farmer.targetId, null);
  assert.equal(commands.length, 0);
});

test('Farmer rejects unknown target policies', () => {
  const farmer = new FarmerController({ now: () => 10000, planner: planner() });
  assert.throws(() => farmer.setTargetPolicy('anything-goes'), /target policy must be one of/);
});

test('Farmer recovers with an HP potion before selecting combat', () => {
  let now = 5000;
  const commands = [];
  const farmer = new FarmerController({ now: () => now, planner: planner(), potionCooldownMs: 500 });
  const snap = snapshot({ character: { hp: 400, max_hp: 1000 } });
  const ctx = context({ snap, commands });

  farmer.step(ctx);
  assert.equal(farmer.state, FarmerState.RECOVER);
  now += 1000;
  farmer.step(ctx);
  assert.ok(commands.some((entry) => entry.action === 'use_hp'));
});

test('Farmer blocks low HP combat when no HP potion is available', () => {
  const farmer = new FarmerController({ now: () => 10000, planner: planner() });
  const snap = snapshot({ character: { hp: 300, max_hp: 1000, inventory: [{ index: 0, name: 'mpot0', q: 5 }] } });
  const ctx = context({ snap });
  farmer.step(ctx);
  assert.equal(farmer.state, FarmerState.BLOCKED);
  assert.equal(farmer.stateReason, 'LOW_HP_NO_POTION');
});
