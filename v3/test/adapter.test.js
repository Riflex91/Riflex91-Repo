'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { GameAdapter } = require('../src/game/adapter');

test('GameAdapter resolves attack target ids to live Adventure Land entities', () => {
  const raw = { id: 'm1', type: 'monster', mtype: 'goo', hp: 100, max_hp: 100, real_x: 10, real_y: 20 };
  let attacked = null;
  let checked = null;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 1, map: 'main', hp: 100, max_hp: 100, mp: 100, max_mp: 100, items: [] },
    parent: { entities: { m1: raw }, party: {} },
    G: { monsters: {}, maps: {} },
    attack: (target) => { attacked = target; },
    can_attack: (target) => { checked = target; return true; }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  assert.equal(adapter.canAttack('m1'), true);
  assert.equal(checked, raw);
  const result = adapter.command('attack', ['m1']);
  assert.equal(result.executed, true);
  assert.equal(attacked, raw);
});

test('GameAdapter snapshot exposes generic combat range, speed and frequency', () => {
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 1, map: 'main', hp: 100, max_hp: 100, mp: 100, max_mp: 100, range: 135, speed: 48, frequency: 1.7, items: [] },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: {} }
  };
  const adapter = new GameAdapter({ root, parent: root.parent });
  const snap = adapter.snapshot();
  assert.equal(snap.character.range, 135);
  assert.equal(snap.character.speed, 48);
  assert.equal(snap.character.frequency, 1.7);
});

test('GameAdapter falls back to Adventure Land use_hp_or_mp for logical potion actions', () => {
  const calls = [];
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 1, map: 'main', hp: 50, max_hp: 100, mp: 100, max_mp: 100, items: [{ name: 'hpot0', q: 10 }] },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: {} },
    use_hp_or_mp: () => { calls.push('use_hp_or_mp'); }
  };
  const adapter = new GameAdapter({ root, parent: root.parent, mode: 'active' });
  const result = adapter.command('use_hp');
  assert.equal(result.executed, true);
  assert.equal(result.resolvedAction, 'use_hp_or_mp');
  assert.deepEqual(calls, ['use_hp_or_mp']);
});
