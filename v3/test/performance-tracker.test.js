'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { PerformanceTracker, xpDelta } = require('../src/telemetry/performance-tracker');
const { WorldModel } = require('../src/world/world-model');
const { EventLog } = require('../src/core/event-log');

function snapshot({ xp, gold, hp, rip = false, potions, monsterHp, dead = false }) {
  return {
    character: {
      name: 'R1', ctype: 'ranger', level: 10, map: 'main',
      xp, gold, hp, max_hp: 1000, mp: 500, max_mp: 500,
      target: 'm1', rip,
      inventory: [{ index: 0, name: 'hpot1', q: potions }]
    },
    entities: [{ id: 'm1', mtype: 'goo', map: 'main', hp: monsterHp, max_hp: 100, dead }],
    objects: [],
    party: []
  };
}

test('PerformanceTracker measures EXP/gold/kill/death/potion/damage windows and records dominant monster', () => {
  let now = 0;
  const log = new EventLog({ now: () => now, runId: 'perf-test' });
  const world = new WorldModel({ now: () => now, log });
  const tracker = new PerformanceTracker({ now: () => now, log, windowMs: 10000, minRecordSeconds: 1 });

  tracker.observe(snapshot({ xp: 100, gold: 1000, hp: 1000, potions: 10, monsterHp: 100 }), { partyFingerprint: 'ranger:1', world, gameData: {} });
  now = 5000;
  tracker.observe(snapshot({ xp: 200, gold: 1100, hp: 900, potions: 9, monsterHp: 50 }), { partyFingerprint: 'ranger:1', world, gameData: {} });
  now = 10000;
  tracker.observe(snapshot({ xp: 300, gold: 1300, hp: 900, potions: 9, monsterHp: 0, dead: true }), { partyFingerprint: 'ranger:1', world, gameData: {} });

  const window = tracker.history.at(-1);
  assert.equal(window.monster, 'goo');
  assert.equal(window.xp, 200);
  assert.equal(window.gold, 300);
  assert.equal(window.kills, 1);
  assert.equal(window.potions, 1);
  assert.equal(window.damageTaken, 100);
  assert.equal(window.monsterHpLost, 100);
  const learned = world.performanceFor('goo', 'ranger:1');
  assert.equal(Math.round(learned.xpPerHour), 72000);
  assert.equal(Math.round(learned.goldPerHour), 108000);
});

test('xpDelta handles a level transition when G.levels is available', () => {
  assert.equal(xpDelta({ level: 10, xp: 900 }, { level: 11, xp: 100 }, { levels: { 10: 1000 } }), 200);
});
