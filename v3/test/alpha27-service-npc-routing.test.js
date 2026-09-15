'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { serviceNpcId } = require('../src/reliability/alpha27-atomic-service');
const { mutationFixture } = require('./alpha27-convergence-test-helpers');

function gameData(type = 'UPGRADE') {
  const items = type === 'COMPOUND'
    ? { ring: { compound: true, g: 1000, grades: [] }, cscroll0: { g: 100 }, hpot0: { g: 20 }, mpot0: { g: 30 } }
    : { sword: { upgrade: true, g: 1000, grades: [] }, scroll0: { g: 100 }, hpot0: { g: 20 }, mpot0: { g: 30 } };
  return {
    items,
    monsters: {},
    maps: { main: {} },
    npcs: {
      newupgrade: { role: 'newupgrade' },
      fancypots: { role: 'merchant', items: ['hpot0', 'mpot0', 'hpot1', 'mpot1'] },
      scrolls: { role: 'merchant', items: ['scroll0', 'cscroll0', 'scroll1', 'cscroll1'] }
    }
  };
}

test('service NPC resolver maps mutation aliases and shop items to canonical Adventure Land NPC ids', () => {
  const gd = gameData();
  assert.equal(serviceNpcId('upgrade', gd), 'newupgrade');
  assert.equal(serviceNpcId('compound', gd), 'newupgrade');
  assert.equal(serviceNpcId('newupgrade', gd), 'newupgrade');
  assert.equal(serviceNpcId('mpot0', gd), 'fancypots');
  assert.equal(serviceNpcId('hpot0', gd), 'fancypots');
  assert.equal(serviceNpcId('scroll0', gd), 'scrolls');
  assert.equal(serviceNpcId('cscroll0', gd), 'scrolls');
  assert.equal(serviceNpcId('bank', gd), null);
});

test('20.45 regression: upgrade resolves newupgrade through find_npc before any smart_move/raw upgrade', async () => {
  const { runtime, convergence, engine, ledger, root } = mutationFixture('UPGRADE');
  runtime.adapter.getGameData = () => gameData('UPGRADE');
  const order = [];
  root.find_npc = (id) => {
    order.push(`find:${id}`);
    return id === 'newupgrade' ? { map: 'main', in: 'main', x: -207, y: -220 } : null;
  };
  root.smart_move = async (destination) => {
    order.push({ travel: destination });
    if (destination === 'upgrade' || destination === 'compound') return { failed: true, reason: 'invalid' };
    return { success: true };
  };
  const baseUpgrade = root.upgrade;
  root.upgrade = async (...args) => { order.push('upgrade'); return baseUpgrade(...args); };

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(order[0], 'find:newupgrade');
  assert.deepEqual(order[1], { travel: { map: 'main', in: 'main', x: -207, y: -220 } });
  assert.equal(order[2], 'upgrade');
  assert.equal(engine.transactions.get(planned.transaction.id).state, 'COMMITTED');
});

test('20.45 regression: compound uses the same newupgrade NPC location', async () => {
  const { runtime, convergence, engine, ledger, root } = mutationFixture('COMPOUND');
  runtime.adapter.getGameData = () => gameData('COMPOUND');
  const destinations = [];
  root.find_npc = (id) => id === 'newupgrade' ? { map: 'main', x: -207, y: -220 } : null;
  root.smart_move = async (destination) => { destinations.push(destination); return { success: true }; };

  const planned = engine.planAtomic({ type: 'COMPOUND', character: 'Merchant', indices: [0, 1, 2] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.deepEqual(destinations[0], { map: 'main', x: -207, y: -220 });
});

test('party potion restock travel resolves mpot0 to fancypots and uses controlled coordinate travel when available', async () => {
  const { runtime, convergence, root } = mutationFixture('UPGRADE');
  runtime.adapter.getGameData = () => gameData('UPGRADE');
  root.find_npc = (id) => id === 'fancypots' ? { map: 'main', in: 'main', x: 56, y: -122 } : null;
  let plannedRequest = null;
  runtime.planTravel = (request) => {
    plannedRequest = request;
    return { accepted: true, plan: { id: 'travel-potions' } };
  };
  runtime.executeTravelPlan = async (id) => ({ completed: id === 'travel-potions' });

  const result = await convergence.atomic.namedServiceTravel('mpot0');

  assert.equal(result.ok, true);
  assert.equal(result.controlled, true);
  assert.deepEqual(plannedRequest.destination, { map: 'main', in: 'main', x: 56, y: -122 });
  assert.equal(plannedRequest.metadata.npcId, 'fancypots');
  assert.equal(plannedRequest.metadata.requestedDestination, 'mpot0');
});

test('scroll procurement travel resolves scroll0 to the scroll merchant', async () => {
  const { runtime, convergence, root } = mutationFixture('UPGRADE');
  runtime.adapter.getGameData = () => gameData('UPGRADE');
  root.find_npc = (id) => id === 'scrolls' ? { map: 'main', x: -465, y: -71 } : null;
  let destination = null;
  root.smart_move = async (target) => { destination = target; return { success: true }; };

  const result = await convergence.atomic.namedServiceTravel('scroll0');

  assert.equal(result.ok, true);
  assert.deepEqual(destination, { map: 'main', x: -465, y: -71 });
  assert.equal(result.resolved.npcId, 'scrolls');
});

test('known NPC resolution never falls back to the original invalid action/item alias', () => {
  const { runtime, convergence, root } = mutationFixture('UPGRADE');
  runtime.adapter.getGameData = () => gameData('UPGRADE');
  root.find_npc = () => null;

  assert.equal(convergence.atomic.resolveServiceDestination('upgrade').destination, 'newupgrade');
  assert.equal(convergence.atomic.resolveServiceDestination('compound').destination, 'newupgrade');
  assert.equal(convergence.atomic.resolveServiceDestination('mpot0').destination, 'fancypots');
  assert.equal(convergence.atomic.resolveServiceDestination('scroll0').destination, 'scrolls');
});
