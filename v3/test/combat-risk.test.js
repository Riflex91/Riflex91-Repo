'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CombatRiskGate } = require('../src/farmer/combat-risk');
const { Runtime } = require('../src/runtime');
const { GameAdapter } = require('../src/game/adapter');
const { EventLog } = require('../src/core/event-log');

function snapshot(overrides = {}) {
  return {
    character: { name: 'R1', hp: 1000, max_hp: 1000, ...overrides.character },
    entities: overrides.entities || []
  };
}

test('CombatRiskGate allows a healthy neutral target with no learned danger', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'goo', hp: 100, max_hp: 100, target: null };
  const result = gate.evaluate(target, snapshot({ entities: [target] }), null, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'RISK_ACCEPTABLE');
});

test('CombatRiskGate blocks a new pull while another monster already attacks the character', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm2', mtype: 'bee', hp: 100, max_hp: 100, target: null };
  const aggressor = { id: 'm1', mtype: 'goo', hp: 100, max_hp: 100, target: 'R1' };
  const result = gate.evaluate(target, snapshot({ entities: [aggressor, target] }), null, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'ADDITIONAL_AGGRO');
  assert.equal(result.signals.additionalAggro, 1);
});

test('CombatRiskGate never abandons an already engaged target', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'goo', hp: 100, max_hp: 100, target: 'R1' };
  const other = { id: 'm2', mtype: 'bee', hp: 100, max_hp: 100, target: 'R1' };
  const result = gate.evaluate(target, snapshot({ character: { hp: 200 }, entities: [target, other] }), null, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'ALREADY_ENGAGED');
});

test('CombatRiskGate can reject a neutral target with strong learned death evidence', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'danger', hp: 100, max_hp: 100, target: null };
  const world = { performanceFor: () => ({ deathsPerHour: 3, confidence: 1 }) };
  const result = gate.evaluate(target, snapshot({ entities: [target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'LEARNED_DEATH_RISK');
});

test('CombatRiskGate does not reject unknown targets just because performance data is missing', () => {
  const gate = new CombatRiskGate();
  const target = { id: 'm1', mtype: 'unknown', hp: 100, max_hp: 100, target: null };
  const world = { performanceFor: () => null };
  const result = gate.evaluate(target, snapshot({ entities: [target] }), world, { fingerprint: 'solo:ranger' });
  assert.equal(result.allowed, true);
});

test('Runtime filters a new pull under live aggro but keeps the current attacker farmable', () => {
  let now = 40000;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 50, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 50, items: [], moving: false, speed: 40 },
    G: { monsters: { goo: { xp: 100 }, bee: { xp: 200 } }, maps: { main: {} } },
    parent: { entities: {
      current: { id: 'current', type: 'monster', mtype: 'goo', map: 'main', x: 30, y: 0, hp: 100, max_hp: 100, target: 'R1' },
      fresh: { id: 'fresh', type: 'monster', mtype: 'bee', map: 'main', x: 35, y: 0, hp: 100, max_hp: 100, target: null }
    }, party: {} }
  };
  const log = new EventLog({ now: () => now, runId: 'combat-risk-runtime-test' });
  const adapter = new GameAdapter({ root, parent: root.parent, log, mode: 'shadow', now: () => now });
  const runtime = new Runtime({ root, parent: root.parent, adapter, log, now: () => now });
  runtime.tick();

  assert.equal(runtime.farmerStatus().targetType, 'goo');
  assert.equal(runtime.status().combatRisk.lastRiskSkip.monsterType, 'bee');
  assert.ok(log.events.some((event) => event.event === 'FARMER_TARGET_RISK_REJECTED' && event.data && event.data.monsterType === 'bee'));
});
