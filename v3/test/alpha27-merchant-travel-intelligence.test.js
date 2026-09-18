'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installAlpha27MerchantTravelIntelligence, serviceNpcCandidates } = require('../src/reliability/alpha27-merchant-travel-intelligence');
const { mutationFixture } = require('./alpha27-convergence-test-helpers');

function liveLikeGameData(type = 'UPGRADE') {
  const items = type === 'COMPOUND'
    ? { ring: { compound: true, g: 1000, grades: [] }, cscroll0: { g: 100 }, mpot0: { g: 30 }, hpot0: { g: 20 } }
    : { sword: { upgrade: true, g: 1000, grades: [] }, scroll0: { g: 100 }, mpot0: { g: 30 }, hpot0: { g: 20 } };
  return {
    items,
    monsters: {},
    maps: { main: { spawns: [[0, 0]] } },
    npcs: {
      pots: { role: 'merchant', items: ['hpot0', 'mpot0'] },
      fancypots: { role: 'merchant', items: ['hpot0', 'mpot0', 'hpot1', 'mpot1'] },
      scrolls: { role: 'merchant', items: ['scroll0', 'cscroll0', 'scroll1', 'cscroll1'] },
      newupgrade: { role: 'newupgrade' }
    }
  };
}

function install(type = 'UPGRADE', options = {}) {
  const fixture = mutationFixture(type, options);
  fixture.runtime.adapter.getGameData = () => liveLikeGameData(type);
  const intelligence = installAlpha27MerchantTravelIntelligence(fixture.runtime, fixture.convergence);
  return { ...fixture, intelligence };
}

test('live 20.46 regression: duplicate potion sellers resolve to the locatable NPC instead of first G.npcs match', () => {
  const { convergence, root } = install();
  root.find_npc = (id) => id === 'fancypots' ? { map: 'main', in: 'main', x: 56, y: -122 } : null;

  assert.deepEqual(serviceNpcCandidates('mpot0', liveLikeGameData()), ['pots', 'fancypots']);
  const resolved = convergence.atomic.resolveServiceDestination('mpot0');

  assert.equal(resolved.ok, true);
  assert.equal(resolved.npcId, 'fancypots');
  assert.equal(resolved.source, 'FIND_NPC_LOCATABLE_CANDIDATE');
  assert.deepEqual(resolved.destination, { map: 'main', in: 'main', x: 56, y: -122 });
});

test('ambiguous shop NPCs fail closed when no candidate can be located', async () => {
  const { convergence, root, intelligence } = install();
  root.find_npc = () => null;
  let smartMoves = 0;
  root.smart_move = async () => { smartMoves += 1; return { success: true }; };

  const result = await convergence.atomic.namedServiceTravel('mpot0');

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'SERVICE_NPC_LOCATION_UNRESOLVED');
  assert.equal(smartMoves, 0);
  assert.equal(intelligence.status().ambiguousNpcFailClosed, 1);
});

test('missing scroll is bought after verified vendor travel even when can_buy remains false', async () => {
  const { convergence, engine, ledger, root } = install('UPGRADE', { missingScroll: true });
  root.find_npc = (id) => {
    if (id === 'scrolls') return { map: 'main', x: -464, y: -96 };
    if (id === 'newupgrade') return { map: 'main', x: -204, y: -129 };
    return null;
  };
  root.can_buy = () => false;
  const moves = [];
  root.smart_move = async (target) => { moves.push(target); return { success: true }; };
  let buys = 0;
  root.buy = async (name, q) => {
    buys += 1;
    root.character.gold -= 100 * q;
    root.character.items[1] = { name, level: 0, q };
    return { success: true, name, q };
  };

  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);

  assert.equal(result.committed, true);
  assert.equal(buys, 1);
  assert.deepEqual(moves[0], { map: 'main', x: -464, y: -96 });
  assert.deepEqual(moves[1], { map: 'main', x: -204, y: -129 });
  assert.equal(engine.transactions.get(planned.transaction.id).state, 'COMMITTED');
});

test('party potion restock travels once and buys in the same cycle without trusting can_buy false', async () => {
  const { runtime, convergence, root } = install();
  root.find_npc = (id) => id === 'fancypots' ? { map: 'main', x: 56, y: -122 } : null;
  root.can_buy = () => false;
  const moves = [];
  root.smart_move = async (target) => { moves.push(target); return { success: true }; };
  root.character.items = [];
  let bought = 0;
  root.buy = async (name, q) => {
    bought += q;
    root.character.items[0] = { name, q, level: 0 };
    return { success: true, name, q };
  };
  runtime.merchantServicePlanner = { merchantPotionReserve: 80, targetPotionCount: 240 };
  runtime.lastMerchantServicePlan = { kind: 'RESTOCK_REQUIRED', need: { family: 'mp', preferred: 'mpot0' } };

  const result = await convergence.merchant.restockPartyPotions();

  assert.equal(result, true);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0], { map: 'main', x: 56, y: -122 });
  assert.equal(bought, 500);
  assert.equal(convergence.stats.potionRestocks, 1);
  assert.equal(convergence.merchant.lastMerchantAction.result, 'COMMITTED');
});

test('distant same-map service chooses town teleport when estimated faster, then smart-moves the final leg', async () => {
  const { convergence, root, intelligence } = install();
  root.character.x = 1200;
  root.character.y = 0;
  root.character.speed = 50;
  root.find_npc = (id) => id === 'fancypots' ? { map: 'main', x: 50, y: 0 } : null;
  let townCalls = 0;
  root.town = async () => {
    townCalls += 1;
    root.character.x = 0;
    root.character.y = 0;
    return { success: true };
  };
  const moves = [];
  root.smart_move = async (target) => { moves.push(target); return { success: true }; };

  const result = await convergence.atomic.namedServiceTravel('mpot0');
  const status = intelligence.status();

  assert.equal(result.ok, true);
  assert.equal(result.strategy.strategy, 'TOWN_THEN_SMART_MOVE');
  assert.equal(townCalls, 1);
  assert.deepEqual(moves, [{ map: 'main', x: 50, y: 0 }]);
  assert.equal(status.townTeleports, 1);
  assert.equal(status.strategySelections.TOWN_THEN_SMART_MOVE, 1);
  assert.ok(status.lastStrategy.estimatedSavingsMs >= 1500);
});

test('nearby service keeps smart_move and does not waste time channeling town', async () => {
  const { convergence, root, intelligence } = install();
  // 150 units away: outside the 108-unit interaction buffer, but still
  // close enough that smart_move should beat a town teleport.
  root.character.x = 200;
  root.character.y = 0;
  root.character.speed = 50;
  root.find_npc = (id) => id === 'fancypots' ? { map: 'main', x: 50, y: 0 } : null;
  let townCalls = 0;
  root.town = async () => { townCalls += 1; return { success: true }; };
  const moves = [];
  root.smart_move = async (target) => { moves.push(target); return { success: true }; };

  const result = await convergence.atomic.namedServiceTravel('mpot0');

  assert.equal(result.ok, true);
  assert.equal(result.strategy.strategy, 'SMART_MOVE');
  assert.equal(townCalls, 0);
  assert.deepEqual(moves, [{ map: 'main', x: 50, y: 0 }]);
  assert.equal(intelligence.status().strategySelections.SMART_MOVE, 1);
});
