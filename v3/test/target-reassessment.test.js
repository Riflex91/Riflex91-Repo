'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetReassessmentPolicy } = require('../src/farmer/target-reassessment');
const { SkillFarmerController } = require('../src/farmer/skill-farmer');
const { FarmerState } = require('../src/farmer/farmer-fsm');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 50, map: 'main',
    x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    range: 128, speed: 40, frequency: 2, rip: false,
    inventory: [{ index: 0, name: 'hpot0', q: 10 }],
    ...overrides
  };
}

function monster(id, overrides = {}) {
  return {
    id, mtype: 'goo', map: 'main', x: 70, y: 0,
    hp: 100, max_hp: 100, target: null, dead: false,
    ...overrides
  };
}

function snapshot(entities, overrides = {}) {
  return {
    observedAt: 10000,
    character: character(overrides.character),
    entities,
    party: []
  };
}

function context(snap, commands = []) {
  return {
    snapshot: snap,
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { goo: { xp: 100 } }, skills: {} }),
      canAttack: () => true,
      command: (action, args = []) => {
        commands.push({ action, args });
        return { executed: true };
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: {}
  };
}

test('TargetReassessmentPolicy keeps the current target when it already attacks self', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', { x: 80, target: 'R1' });
  const closer = monster('closer', { x: 20, target: 'R1' });
  const result = policy.evaluate(snapshot([current, closer]), current);

  assert.equal(result.switchTarget, false);
  assert.equal(result.reason, 'CURRENT_TARGET_SELF_AGGRO');
  assert.equal(result.attackerCount, 2);
});

test('TargetReassessmentPolicy switches from a non-self-focused target to the nearest self attacker', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', { x: 60, target: null });
  const far = monster('far', { x: 90, target: 'R1' });
  const near = monster('near', { x: 35, target: 'R1' });
  const result = policy.evaluate(snapshot([current, far, near]), current);

  assert.equal(result.switchTarget, true);
  assert.equal(result.reason, 'SELF_AGGRO_PRIORITY');
  assert.equal(result.target.id, 'near');
  assert.equal(result.attackerCount, 2);
  assert.equal(result.targetDistance, 35);
});

test('TargetReassessmentPolicy keeps current target when there is no self-aggro alternative', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', { target: null });
  const partyTarget = monster('party', { target: 'PartyMate' });
  const result = policy.evaluate(snapshot([current, partyTarget]), current);

  assert.equal(result.switchTarget, false);
  assert.equal(result.reason, 'NO_SELF_AGGRO_ALTERNATIVE');
});

test('SkillFarmerController attacks the reassessed self-aggressor in the same engage tick', () => {
  let now = 10000;
  const commands = [];
  const current = monster('current', { x: 75, target: null });
  const attacker = monster('attacker', { x: 60, target: 'R1' });
  const snap = snapshot([current, attacker]);
  const farmer = new SkillFarmerController({
    now: () => now,
    kitingEnabled: false,
    skillUsageEnabled: false,
    targetReassessmentMinIntervalMs: 250,
    targetReassessmentSwitchCooldownMs: 1000,
    attackIntervalMs: 250
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'current';
  farmer.targetType = 'goo';

  farmer._engage(context(snap, commands), current);

  assert.equal(farmer.targetId, 'attacker');
  assert.equal(commands.at(-1).action, 'attack');
  assert.deepEqual(commands.at(-1).args, ['attacker']);
  assert.equal(farmer.status().targetReassessment.lastSwitch.fromTargetId, 'current');
  assert.equal(farmer.status().targetReassessment.lastSwitch.toTargetId, 'attacker');
});

test('SkillFarmerController switch cooldown blocks a second immediate reassessment switch', () => {
  let now = 10000;
  const first = monster('first', { target: null });
  const attacker = monster('attacker', { x: 40, target: 'R1' });
  const snap = snapshot([first, attacker]);
  const farmer = new SkillFarmerController({
    now: () => now,
    kitingEnabled: false,
    skillUsageEnabled: false,
    targetReassessmentMinIntervalMs: 250,
    targetReassessmentSwitchCooldownMs: 2500
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'old';
  farmer.lastTargetSwitchAt = now - 500;

  const resolved = farmer._maybeReassessTarget(context(snap), first);

  assert.equal(resolved.id, 'first');
  assert.equal(farmer.targetId, 'old');
  assert.equal(farmer.status().targetReassessment.lastDecision.reason, 'TARGET_SWITCH_COOLDOWN');
  assert.ok(farmer.status().targetReassessment.lastDecision.cooldownRemainingMs > 0);
});

test('SkillFarmerController keeps recovery ahead of target reassessment', () => {
  const commands = [];
  const current = monster('current', { target: null });
  const attacker = monster('attacker', { x: 35, target: 'R1' });
  const snap = snapshot([current, attacker], { character: { hp: 400, max_hp: 1000 } });
  const farmer = new SkillFarmerController({
    now: () => 10000,
    kitingEnabled: false,
    skillUsageEnabled: false,
    targetReassessmentMinIntervalMs: 250
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'current';
  farmer.targetType = 'goo';

  farmer._engage(context(snap, commands), current);

  assert.equal(farmer.targetId, 'current');
  assert.equal(farmer.status().targetReassessment.lastSwitch, null);
});
