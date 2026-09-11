'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Runtime } = require('../src/runtime');
const { GameAdapter } = require('../src/game/adapter');
const { EventLog } = require('../src/core/event-log');

test('Runtime observes a fake Adventure Land character without issuing active commands', () => {
  let now = 10000;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 50, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 50, items: [], moving: false, speed: 40 },
    G: { monsters: { goo: { xp: 100 } }, maps: { main: {} } },
    parent: { entities: { m1: { id: 'm1', type: 'monster', mtype: 'goo', map: 'main', x: 40, y: 0, hp: 100, max_hp: 100 } }, party: {} }
  };
  const log = new EventLog({ now: () => now, runId: 'runtime-test' });
  const adapter = new GameAdapter({ root, parent: root.parent, log, mode: 'shadow', now: () => now });
  const runtime = new Runtime({ root, parent: root.parent, adapter, log, now: () => now });
  runtime.tick();
  const status = runtime.status();
  assert.equal(status.mode, 'shadow');
  assert.equal(status.character.name, 'R1');
  assert.ok(status.world.entities >= 2);
  assert.ok(status.world.entityTypes.monster >= 1);
  assert.ok(log.events.some((e) => e.event === 'FARM_TARGET_RANKED'));
  const result = adapter.command('attack', ['m1']);
  assert.equal(result.shadow, true);
  const economy = adapter.command('sell', [0]);
  assert.equal(economy.reason, 'ACTION_NOT_ALLOWED_IN_ALPHA');
});
