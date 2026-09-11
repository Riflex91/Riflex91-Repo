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


test('Runtime emits visible Adventure Land startup/ready/status messages without changing shadow mode', () => {
  let now = 20000;
  const messages = [];
  const root = {
    game_log: (message) => messages.push(message),
    character: { name: 'VisibleRanger', ctype: 'ranger', level: 42, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, hp: 900, max_hp: 900, mp: 400, max_mp: 400, xp: 100, gold: 50, items: [], moving: false, speed: 40 },
    G: { monsters: {}, maps: { main: {} } },
    parent: { entities: {}, party: {} }
  };
  const log = new EventLog({ now: () => now, runId: 'visible-status-test' });
  const adapter = new GameAdapter({ root, parent: root.parent, log, mode: 'shadow', now: () => now });
  const runtime = new Runtime({ root, parent: root.parent, adapter, log, now: () => now, tickMs: 1000 });

  assert.equal(runtime.start(), true);
  assert.equal(runtime.status().mode, 'shadow');
  assert.ok(messages.some((message) => message.includes('STARTED') && message.includes('mode=shadow')));
  assert.equal(messages.filter((message) => message.includes('READY')).length, 1);
  assert.ok(messages.some((message) => message.includes('VisibleRanger') && message.includes('map=main')));

  runtime.tick();
  assert.equal(messages.filter((message) => message.includes('READY')).length, 1);

  const status = runtime.showStatus();
  assert.equal(status.character.name, 'VisibleRanger');
  assert.ok(messages.some((message) => message.includes('STATUS') && message.includes('observing only')));
  assert.ok(log.events.some((event) => event.event === 'VISIBLE_STARTUP'));
  assert.ok(log.events.some((event) => event.event === 'VISIBLE_READY'));
  assert.ok(log.events.some((event) => event.event === 'VISIBLE_STATUS'));
  runtime.stop();
});


test('Runtime config keeps HP potion recovery active through the 75 percent recovery threshold', () => {
  const runtime = new Runtime({ root: { parent: { entities: {}, party: {} }, G: { monsters: {}, maps: {} } } });
  assert.equal(runtime.farmer.config.recoverHpRatio, 0.75);
  assert.equal(runtime.farmer.config.useHpRatio, 0.75);
});

test('Runtime planner and Farmer safety ignore Target Automatron', () => {
  let now = 30000;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 50, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 50, items: [], moving: false, speed: 40 },
    G: { monsters: { target: { name: 'Target Automatron', xp: 0 }, goo: { xp: 100 } }, maps: { main: {} } },
    parent: { entities: {
      training: { id: 'training', type: 'monster', name: 'Target Automatron', mtype: 'target', map: 'main', x: 5, y: 0, hp: 999999, max_hp: 999999 },
      m1: { id: 'm1', type: 'monster', mtype: 'goo', map: 'main', x: 40, y: 0, hp: 100, max_hp: 100 }
    }, party: {} }
  };
  const log = new EventLog({ now: () => now, runId: 'automatron-safety-test' });
  const adapter = new GameAdapter({ root, parent: root.parent, log, mode: 'shadow', now: () => now });
  const runtime = new Runtime({ root, parent: root.parent, adapter, log, now: () => now });
  runtime.tick();
  assert.equal(runtime.farmerStatus().targetType, 'goo');
  assert.ok(runtime.farmerStatus().targetExclusions.includes('automatron'));
  const ranked = log.events.filter((event) => event.event === 'FARM_TARGET_RANKED');
  assert.ok(ranked.length > 0);
  assert.ok(ranked.every((event) => event.data && event.data.monster !== 'target'));
});
