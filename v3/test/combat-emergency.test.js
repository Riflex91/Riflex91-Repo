'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CombatEmergencyGate } = require('../src/farmer/combat-emergency');

function snapshot({ hp = 1000, attackers = 1 } = {}) {
  const entities = [];
  for (let i = 0; i < attackers; i += 1) {
    entities.push({ id: `m${i + 1}`, mtype: 'goo', hp: 100, max_hp: 100, dead: false, target: 'R1' });
  }
  return {
    character: { name: 'R1', hp, max_hp: 1000 },
    entities
  };
}

test('critical HP triggers emergency disengage', () => {
  const gate = new CombatEmergencyGate();
  const snap = snapshot({ hp: 340, attackers: 1 });
  const result = gate.evaluate(snap, snap.entities[0]);
  assert.equal(result.triggered, true);
  assert.equal(result.reason, 'CRITICAL_HP');
});

test('multiple attackers plus low HP trigger emergency disengage', () => {
  const gate = new CombatEmergencyGate();
  const snap = snapshot({ hp: 500, attackers: 2 });
  const result = gate.evaluate(snap, snap.entities[0]);
  assert.equal(result.triggered, true);
  assert.equal(result.reason, 'MULTI_AGGRO_LOW_HP');
  assert.equal(result.signals.attackers, 2);
});

test('multiple attackers at healthy HP do not trigger emergency disengage', () => {
  const gate = new CombatEmergencyGate();
  const snap = snapshot({ hp: 900, attackers: 3 });
  const result = gate.evaluate(snap, snap.entities[0]);
  assert.equal(result.triggered, false);
  assert.equal(result.reason, 'EMERGENCY_CLEAR');
});

test('single attacker above critical HP does not trigger emergency disengage', () => {
  const gate = new CombatEmergencyGate();
  const snap = snapshot({ hp: 500, attackers: 1 });
  const result = gate.evaluate(snap, snap.entities[0]);
  assert.equal(result.triggered, false);
});
