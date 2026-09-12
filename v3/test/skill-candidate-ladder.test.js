'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SkillUsagePolicy } = require('../src/farmer/skill-usage');
const { SkillFarmerController } = require('../src/farmer/skill-farmer');
const { FarmerState } = require('../src/farmer/farmer-fsm');

function character(overrides = {}) {
  return {
    name: 'R1', ctype: 'ranger', level: 70, map: 'main',
    x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    range: 120, speed: 40, frequency: 2, rip: false,
    inventory: [],
    ...overrides
  };
}

function monster(overrides = {}) {
  return {
    id: 'm1', mtype: 'goo', map: 'main', x: 70, y: 0,
    hp: 1000, max_hp: 1000, target: 'R1', dead: false,
    ...overrides
  };
}

function safeSkill(name, damageMultiplier, mp, cooldown = 1000) {
  return {
    type: 'skill', class: ['ranger'], hostile: true, target: true,
    name, mp, level: 1, cooldown, damage_multiplier: damageMultiplier
  };
}

function skillSet() {
  return {
    burst: safeSkill('Burst', 2.0, 200, 3000),
    steady: safeSkill('Steady', 1.5, 60, 1500),
    quick: safeSkill('Quick', 1.2, 20, 500),
    mark: {
      type: 'skill', class: ['ranger'], hostile: true, target: true,
      name: 'Mark', mp: 10, level: 1, cooldown: 500
    }
  };
}

function planner() {
  return { rank: (rows) => rows.map((row, index) => ({ ...row, score: 1 - index * 0.1 })) };
}

test('SkillUsagePolicy ranks only the existing safe direct-damage pool deterministically', () => {
  const policy = new SkillUsagePolicy();
  const candidates = policy.candidates(character(), { skills: skillSet() });
  assert.deepEqual(candidates.map((skill) => skill.id), ['burst', 'steady', 'quick']);
  assert.equal(candidates.some((skill) => skill.id === 'mark'), false);
  assert.equal(policy.status().fallbackEnabled, true);
});

test('SkillUsagePolicy falls back to a cheaper safe skill when MP reserve blocks higher ranks', () => {
  const policy = new SkillUsagePolicy({ mpReserveRatio: 0.30 });
  const snapshot = { character: character({ mp: 180, max_mp: 500 }) };
  const result = policy.evaluate(snapshot, monster(), { skills: skillSet() }, {
    canUseSkill: () => true,
    isSkillInRange: () => true
  });

  assert.equal(result.useSkill, true);
  assert.equal(result.reason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.equal(result.skill.id, 'quick');
  assert.equal(result.candidateRank, 3);
  assert.deepEqual(result.rejectedCandidates.map((entry) => entry.reason), ['MP_RESERVE', 'MP_RESERVE']);
  assert.equal(result.reserveMp, 150);
  assert.equal(result.mpAfter, 160);
});

test('SkillUsagePolicy falls back when the top safe skill is on cooldown or otherwise unavailable', () => {
  const policy = new SkillUsagePolicy();
  const result = policy.evaluate({ character: character() }, monster(), { skills: skillSet() }, {
    canUseSkill: (id) => id !== 'burst',
    isSkillInRange: () => true
  });

  assert.equal(result.useSkill, true);
  assert.equal(result.reason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.equal(result.skill.id, 'steady');
  assert.equal(result.candidateRank, 2);
  assert.equal(result.rejectedCandidates[0].skill, 'burst');
  assert.equal(result.rejectedCandidates[0].reason, 'SKILL_COOLDOWN_OR_REQUIREMENT');
});

test('SkillUsagePolicy falls back when the top safe skill is out of range', () => {
  const policy = new SkillUsagePolicy();
  const result = policy.evaluate({ character: character() }, monster(), { skills: skillSet() }, {
    canUseSkill: () => true,
    isSkillInRange: (_targetId, skillId) => skillId !== 'burst'
  });

  assert.equal(result.useSkill, true);
  assert.equal(result.reason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.equal(result.skill.id, 'steady');
  assert.equal(result.candidateRank, 2);
  assert.equal(result.rejectedCandidates[0].reason, 'SKILL_OUT_OF_RANGE');
});

test('SkillUsagePolicy preserves the primary rejection reason when no safe candidate is usable', () => {
  const policy = new SkillUsagePolicy();
  const result = policy.evaluate({ character: character() }, monster(), { skills: skillSet() }, {
    canUseSkill: () => false,
    isSkillInRange: () => true
  });

  assert.equal(result.useSkill, false);
  assert.equal(result.reason, 'SKILL_COOLDOWN_OR_REQUIREMENT');
  assert.equal(result.skill.id, 'burst');
  assert.equal(result.candidateRank, null);
  assert.equal(result.rejectedCandidates.length, 3);
});

test('SkillFarmer executes the safe fallback candidate and records ladder telemetry', () => {
  let now = 10000;
  const commands = [];
  const target = monster();
  const farmer = new SkillFarmerController({
    now: () => now,
    planner: planner(),
    attackIntervalMs: 250,
    kitingMoveCooldownMs: 250
  });
  const context = {
    snapshot: { observedAt: now, character: character(), entities: [target], party: [] },
    adapter: {
      mode: 'active',
      getGameData: () => ({ monsters: { goo: { xp: 100 } }, skills: skillSet() }),
      canAttack: () => true,
      canUseSkill: (id) => id !== 'burst',
      isSkillInRange: () => true,
      command: (action, args = []) => {
        commands.push({ action, args });
        return { executed: true };
      }
    },
    world: { performanceFor: () => null },
    party: { members: [{ name: 'R1' }], fingerprint: 'ranger:1' },
    runtime: {}
  };

  farmer.step(context);
  farmer.step(context);
  assert.equal(farmer.state, FarmerState.ENGAGE);
  now += 1000;
  context.snapshot.observedAt = now;
  farmer.step(context);

  assert.equal(commands.at(-1).action, 'use_skill');
  assert.deepEqual(commands.at(-1).args, ['steady', 'm1']);

  const status = farmer.status().skillUsage;
  assert.equal(status.selectedSkill, 'steady');
  assert.equal(status.lastDecision.reason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.equal(status.lastDecision.candidateCount, 3);
  assert.equal(status.lastDecision.candidateRank, 2);
  assert.equal(status.lastDecision.rejectedCandidates[0].skill, 'burst');
  assert.equal(status.lastUse.skill, 'steady');
  assert.equal(status.lastUse.selectionReason, 'SAFE_DIRECT_DAMAGE_FALLBACK_SKILL');
  assert.equal(status.lastUse.candidateRank, 2);
});
