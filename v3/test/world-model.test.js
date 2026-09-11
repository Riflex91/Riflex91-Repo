'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { WorldModel, KnowledgeState, EvidenceKind } = require('../src/world/world-model');

test('WorldModel keeps unknown distinct from false and records evidence', () => {
  const world = new WorldModel({ now: () => 1000 });
  assert.equal(world.fact('npc', 'x', 'accepts_shell').state, KnowledgeState.UNKNOWN);
  world.observeEntity('npc', 'x', { accepts_shell: false }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  const fact = world.fact('npc', 'x', 'accepts_shell');
  assert.equal(fact.state, KnowledgeState.KNOWN_FALSE);
  assert.equal(fact.value, false);
  assert.equal(fact.evidence, EvidenceKind.OBSERVED);
});

test('WorldModel aggregates performance per party fingerprint', () => {
  const world = new WorldModel({ now: () => 1000 });
  world.recordPerformance('croc', 'ranger:3|merchant:1', { seconds: 60, xp: 40000, gold: 3000, kills: 20, deaths: 0 });
  world.recordPerformance('croc', 'ranger:3|merchant:1', { seconds: 60, xp: 50000, gold: 4000, kills: 25, deaths: 1 });
  const p = world.performanceFor('croc', 'ranger:3|merchant:1');
  assert.equal(Math.round(p.xpPerHour), 2700000);
  assert.equal(Math.round(p.goldPerHour), 210000);
  assert.equal(p.kills, 45);
  assert.equal(p.deaths, 1);
});
