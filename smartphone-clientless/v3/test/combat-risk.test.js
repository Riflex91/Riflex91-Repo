'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CombatRiskGate } = require('../src/farmer/combat-risk');
const { Runtime } = require('../src/runtime');
const { GameAdapter } = require('../src/game/adapter');
const { EventLog } = require('../src/core/event-log');
const { WorldModel, EvidenceKind } = require('../src/world/world-model');

function snapshot(overrides = {}) {
  return {
    character: { name: 'R1', hp: 1000, max_hp: 1000, ...overrides.character },
    entities: overrides.entities || []
  };
}

function knownWorld(...types) {
  const world = new WorldModel();
  for (const type of types) world.observeEntity('monster', type, { maps: ['main'] }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  return world;
}

test('CombatRiskGate allows a healthy legacy-known neutral target with no learned danger', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'goo', hp: 100, max_hp: 100, target: null };
  const world = knownWorld('goo');
  const result = gate.evaluate(target, snapshot({ entities: [target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'RISK_ACCEPTABLE');
});

test('CombatRiskGate blocks a new pull while another monster already attacks the character', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm2', mtype: 'bee', hp: 100, max_hp: 100, target: null };
  const aggressor = { id: 'm1', mtype: 'goo', hp: 100, max_hp: 100, target: 'R1' };
  const world = knownWorld('goo', 'bee');
  const result = gate.evaluate(target, snapshot({ entities: [aggressor, target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'ADDITIONAL_AGGRO');
  assert.equal(result.signals.additionalAggro, 1);
});

test('CombatRiskGate keeps a known already engaged target eligible', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'goo', hp: 100, max_hp: 100, target: 'R1' };
  const other = { id: 'm2', mtype: 'bee', hp: 100, max_hp: 100, target: 'R1' };
  const world = knownWorld('goo', 'bee');
  const result = gate.evaluate(target, snapshot({ character: { hp: 200 }, entities: [target, other] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'ALREADY_ENGAGED');
});

test('CombatRiskGate quarantines unknown content even when it is already engaged', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'boss1', mtype: 'brandnewboss', hp: 1000000, max_hp: 1000000, target: 'R1' };
  const world = new WorldModel();
  const result = gate.evaluate(target, snapshot({ entities: [target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'CONTENT_QUARANTINED');
  assert.equal(result.signals.contentDisposition, 'QUARANTINED');
});

test('CombatRiskGate can reject a known neutral target with strong learned death evidence', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'danger', hp: 100, max_hp: 100, target: null };
  const world = knownWorld('danger');
  world.performanceFor = () => ({ deathsPerHour: 3, confidence: 1 });
  const result = gate.evaluate(target, snapshot({ entities: [target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'LEARNED_DEATH_RISK');
});

test('CombatRiskGate quarantines a truly unknown target instead of treating missing data as neutral', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'unknown', hp: 100, max_hp: 100, target: null };
  const world = new WorldModel();
  const result = gate.evaluate(target, snapshot({ entities: [target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'CONTENT_QUARANTINED');
});

test('Runtime filters unknown high-XP content before Discovery can make it known', () => {
  let now = 40000;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 50, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 50, items: [], moving: false, speed: 40 },
    G: { monsters: { goo: { xp: 100 }, brandnewboss: { xp: 999999 } }, maps: { main: {} }, skills: {} },
    parent: { entities: {
      safe: { id: 'safe', type: 'monster', mtype: 'goo', map: 'main', x: 30, y: 0, hp: 100, max_hp: 100, target: null },
      boss: { id: 'boss', type: 'monster', mtype: 'brandnewboss', map: 'main', x: 35, y: 0, hp: 1000000, max_hp: 1000000, target: null }
    }, party: {} }
  };
  const log = new EventLog({ now: () => now, runId: 'content-safety-runtime-test' });
  const adapter = new GameAdapter({ root, parent: root.parent, log, mode: 'shadow', now: () => now });
  const world = knownWorld('goo');
  const runtime = new Runtime({ root, parent: root.parent, adapter, log, world, now: () => now });

  runtime.tick();
  assert.equal(runtime.farmerStatus().targetType, 'goo');
  assert.equal(runtime.status().combatRisk.lastRiskSkip.monsterType, 'brandnewboss');
  assert.equal(runtime.status().combatRisk.lastRiskSkip.reason, 'CONTENT_QUARANTINED');

  // Discovery now knows the boss, but the persistent policy must keep it quarantined.
  now += 250;
  runtime.tick();
  assert.equal(runtime.farmerStatus().targetType, 'goo');
  assert.ok(runtime.status().combatRisk.contentSafety.quarantined.some((row) => row.monsterType === 'brandnewboss'));
  assert.ok(log.events.some((event) => event.event === 'CONTENT_MONSTER_QUARANTINED' && event.data && event.data.monsterType === 'brandnewboss'));
});
