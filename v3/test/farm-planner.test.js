'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { FarmPlanner } = require('../src/planner/farm-planner');

test('FarmPlanner rejects unsafe death rate before optimizing EXP and gold', () => {
  const planner = new FarmPlanner({ maxDeathsPerHour: 0.25, explorationWeight: 0 });
  const ranked = planner.rank([
    { id: 'danger', xpPerHour: 9000000, goldPerHour: 900000, deathsPerHour: 2, confidence: 1, travelSeconds: 0 },
    { id: 'safe', xpPerHour: 2000000, goldPerHour: 100000, deathsPerHour: 0, confidence: 1, travelSeconds: 20 }
  ]);
  assert.deepEqual(ranked.map((r) => r.id), ['safe']);
});

test('FarmPlanner values EXP/h above Gold/h and uses travel only as a penalty/tie-breaker', () => {
  const planner = new FarmPlanner({ maxDeathsPerHour: 1, explorationWeight: 0, maxTravelSeconds: 1000 });
  const ranked = planner.rank([
    { id: 'xp', xpPerHour: 3000000, goldPerHour: 100000, deathsPerHour: 0, confidence: 1, travelSeconds: 100 },
    { id: 'gold', xpPerHour: 1800000, goldPerHour: 500000, deathsPerHour: 0, confidence: 1, travelSeconds: 5 }
  ]);
  assert.equal(ranked[0].id, 'xp');
});
