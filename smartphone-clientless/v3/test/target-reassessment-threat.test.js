'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetReassessmentPolicy, threatScore } = require('../src/farmer/target-reassessment');
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

function monster(id, mtype, overrides = {}) {
  return {
    id, mtype, map: 'main', x: 70, y: 0,
    hp: 100, max_hp: 100, target: 'R1', dead: false,
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

function gameData(overrides = {}) {
  return {
    monsters: {
      low: { attack: 100, frequency: 1, xp: 100 },
      medium: { attack: 120, frequency: 1, xp: 100 },
      high: { attack: 100, frequency: 1.5, xp: 100 },
      equal: { attack: 150, frequency: 1, xp: 100 },
      ...overrides
    },
    skills: {}
  };
}

function context(snap, data, commands = []) {
  return {
    snapshot: snap,
    adapter: {
      mode: 'active',
      getGameData: () => data,
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

test('threatScore uses monster attack multiplied by frequency and stays null when metadata is incomplete', () => {
  const data = gameData({ incomplete: { attack: 100 } });
  assert.equal(threatScore(monster('a', 'high'), data), 150);
  assert.equal(threatScore(monster('b', 'incomplete'), data), null);
  assert.equal(threatScore(monster('c', 'missing'), data), null);
});

test('TargetReassessmentPolicy switches to a materially higher-threat self attacker even when it is not closer enough for alpha.8.6', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', 'low', { x: 60 });
  const higher = monster('higher', 'high', { x: 55 });
  const result = policy.evaluate(snapshot([current, higher]), current, gameData());

  assert.equal(result.switchTarget, true);
  assert.equal(result.reason, 'HIGHER_SELF_AGGRO_THREAT');
  assert.equal(result.target.id, 'higher');
  assert.equal(result.currentThreatScore, 100);
  assert.equal(result.targetThreatScore, 150);
  assert.equal(result.threatSwitchThreshold, 125);
  assert.equal(result.switchThresholdDistance, 42);
  assert.equal(result.targetDistance, 55);
});

test('TargetReassessmentPolicy does not switch for a threat increase below the 25 percent threshold when distance is also stable', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', 'low', { x: 60 });
  const modest = monster('modest', 'medium', { x: 50 });
  const result = policy.evaluate(snapshot([current, modest]), current, gameData());

  assert.equal(result.switchTarget, false);
  assert.equal(result.reason, 'CURRENT_SELF_AGGRO_STABLE');
  assert.equal(result.currentThreatScore, 100);
  assert.equal(result.targetThreatScore, 120);
});

test('TargetReassessmentPolicy preserves alpha.8.6 distance fallback when threat metadata is missing', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', 'unknown-a', { x: 90 });
  const closer = monster('closer', 'unknown-b', { x: 30 });
  const result = policy.evaluate(snapshot([current, closer]), current, { monsters: {}, skills: {} });

  assert.equal(result.switchTarget, true);
  assert.equal(result.reason, 'CLOSER_SELF_AGGRO_PRIORITY');
  assert.equal(result.target.id, 'closer');
  assert.equal(result.currentThreatScore, null);
  assert.equal(result.targetThreatScore, null);
});

test('TargetReassessmentPolicy chooses the highest known threat alternative and uses distance as its tie-breaker', () => {
  const policy = new TargetReassessmentPolicy();
  const current = monster('current', 'low', { x: 60 });
  const highFar = monster('high-far', 'high', { x: 70 });
  const equalNear = monster('equal-near', 'equal', { x: 45 });
  const result = policy.evaluate(snapshot([current, highFar, equalNear]), current, gameData());

  assert.equal(result.switchTarget, true);
  assert.equal(result.reason, 'HIGHER_SELF_AGGRO_THREAT');
  assert.equal(result.target.id, 'equal-near');
  assert.equal(result.targetThreatScore, 150);
});

test('SkillFarmerController passes live game data into reassessment and exposes threat telemetry on the actual switch', () => {
  const commands = [];
  const current = monster('current', 'low', { x: 60 });
  const higher = monster('higher', 'high', { x: 55 });
  const snap = snapshot([current, higher]);
  const farmer = new SkillFarmerController({
    now: () => 10000,
    kitingEnabled: false,
    skillUsageEnabled: false,
    targetReassessmentMinIntervalMs: 250,
    targetReassessmentSwitchCooldownMs: 1000,
    attackIntervalMs: 250
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'current';
  farmer.targetType = 'low';

  farmer._engage(context(snap, gameData(), commands), current);

  assert.equal(farmer.targetId, 'higher');
  assert.equal(commands.at(-1).action, 'attack');
  assert.deepEqual(commands.at(-1).args, ['higher']);
  const status = farmer.status().targetReassessment;
  assert.equal(status.selfAggroThreatSwitchFactor, 1.25);
  assert.equal(status.lastSwitch.reason, 'HIGHER_SELF_AGGRO_THREAT');
  assert.equal(status.lastSwitch.currentThreatScore, 100);
  assert.equal(status.lastSwitch.threatScore, 150);
  assert.equal(status.lastSwitch.threatSwitchThreshold, 125);
});

test('SkillFarmerController switch cooldown still blocks an otherwise valid higher-threat switch', () => {
  let now = 10000;
  const current = monster('current', 'low', { x: 60 });
  const higher = monster('higher', 'high', { x: 55 });
  const snap = snapshot([current, higher]);
  const farmer = new SkillFarmerController({
    now: () => now,
    kitingEnabled: false,
    skillUsageEnabled: false,
    targetReassessmentMinIntervalMs: 250,
    targetReassessmentSwitchCooldownMs: 2500
  });
  farmer.state = FarmerState.ENGAGE;
  farmer.targetId = 'current';
  farmer.targetType = 'low';
  farmer.lastTargetSwitchAt = now - 500;

  const resolved = farmer._maybeReassessTarget(context(snap, gameData()), current);

  assert.equal(resolved.id, 'current');
  assert.equal(farmer.targetId, 'current');
  assert.equal(farmer.status().targetReassessment.lastDecision.reason, 'TARGET_SWITCH_COOLDOWN');
  assert.equal(farmer.status().targetReassessment.lastDecision.currentThreatScore, 100);
  assert.equal(farmer.status().targetReassessment.lastDecision.candidateThreatScore, 150);
  assert.ok(farmer.status().targetReassessment.lastDecision.cooldownRemainingMs > 0);
});
