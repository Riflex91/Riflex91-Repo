'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Runtime } = require('../src/runtime');
const { GameAdapter } = require('../src/game/adapter');
const { EventLog } = require('../src/core/event-log');
const { FarmerState } = require('../src/farmer/farmer-fsm');

test('Runtime removes only the active Farmer target when emergency disengage triggers', () => {
  let now = 40000;
  const root = {
    character: { name: 'R1', ctype: 'ranger', level: 50, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0, hp: 500, max_hp: 1000, mp: 500, max_mp: 500, xp: 100, gold: 50, items: [], moving: false, speed: 40 },
    G: { monsters: { goo: { xp: 100 } }, maps: { main: {} } },
    parent: { entities: {
      m1: { id: 'm1', type: 'monster', mtype: 'goo', map: 'main', x: 20, y: 0, hp: 100, max_hp: 100, target: 'R1' },
      m2: { id: 'm2', type: 'monster', mtype: 'goo', map: 'main', x: 30, y: 0, hp: 100, max_hp: 100, target: 'R1' }
    }, party: {} }
  };
  const log = new EventLog({ now: () => now, runId: 'emergency-runtime-test' });
  const adapter = new GameAdapter({ root, parent: root.parent, log, mode: 'active', now: () => now });
  const runtime = new Runtime({ root, parent: root.parent, adapter, log, now: () => now });
  const snap = adapter.snapshot();
  const profile = runtime._partyProfile(snap);
  runtime.lastSnapshot = snap;
  runtime.farmer.state = FarmerState.ENGAGE;
  runtime.farmer.targetId = 'm1';
  runtime.farmer.targetType = 'goo';

  const farmSnapshot = runtime._farmSnapshot(snap, root.G, profile);
  assert.equal(farmSnapshot.entities.some((entity) => entity.id === 'm1'), false);
  assert.equal(farmSnapshot.entities.some((entity) => entity.id === 'm2'), true);
  assert.equal(runtime.lastEmergencyDisengage.reason, 'MULTI_AGGRO_LOW_HP');
  assert.ok(log.events.some((event) => event.event === 'FARMER_EMERGENCY_DISENGAGE'));
});
