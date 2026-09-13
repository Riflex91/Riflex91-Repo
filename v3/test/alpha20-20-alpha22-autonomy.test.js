'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MarketValueOracle,
  MerchantEconomyAutonomy,
  installCombatContinuity,
  installCombatLootHandoff,
  installQuotaSafeBroadcastFallback,
  median,
  gradeForLevel,
  isQuotaError
} = require('../src/reliability/alpha20-20-alpha22-autonomy');

test('alpha22 math helpers are deterministic', () => {
  assert.equal(median([9, 1, 5]), 5);
  assert.equal(median([1, 3, 7, 9]), 5);
  assert.equal(gradeForLevel({ grades: [3, 7] }, 2), 0);
  assert.equal(gradeForLevel({ grades: [3, 7] }, 3), 1);
  assert.equal(gradeForLevel({ grades: [3, 7] }, 8), 2);
  assert.equal(isQuotaError(new Error('Storage exceeded the quota')), true);
  assert.equal(isQuotaError(new Error('Character not found')), false);
});

test('market value oracle combines player asks and bids and falls back to game data', () => {
  let now = 1000;
  const root = {
    G: { items: { ore: { g: 20 }, gem: { g: 500 } } },
    parent: {
      entities: {
        a: { name: 'SellerA', slots: [{ name: 'ore', price: 100, q: 10 }] },
        b: { name: 'SellerB', slots: [{ name: 'ore', price: 120, q: 5 }] },
        c: { name: 'Buyer', slots: [{ name: 'ore', price: 80, q: 20, b: true }] }
      }
    }
  };
  const oracle = new MarketValueOracle({ root, now: () => now });
  oracle.observe();
  const quote = oracle.quote('ore', 0);
  assert.equal(quote.medianAsk, 110);
  assert.equal(quote.maxBid, 80);
  assert.equal(quote.fairValue, 95);
  assert.equal(quote.source, 'market-spread');
  const fallback = oracle.quote('gem', 0);
  assert.equal(fallback.fairValue, 500);
  assert.equal(fallback.source, 'game-data-fallback');
});

test('combat continuity finishes an already damaged encounter without opening a fresh pull', () => {
  const target = { id: 'm1', mtype: 'goo', hp: 50, max_hp: 100, target: null };
  const snapshot = { character: { name: 'Farmer', hp: 1000, max_hp: 1000 }, entities: [target] };
  const farmer = {
    targetId: 'm1',
    _selectTarget: () => null,
    _safeLiveMonsters: () => [target]
  };
  const state = { complete: true, alive: true, sameMap: true, positionsKnown: true, names: ['Farmer', 'Friend'] };
  const team = {
    _team: () => state,
    _localSupply: () => ({ ready: true }),
    _combatGate: () => ({ allowed: false, team: state, reason: 'TEAM_NOT_COHESIVE' })
  };
  const stats = { combatGateContinuations: 0, combatFallbackSelections: 0 };
  assert.equal(installCombatContinuity({ farmer, teamCombatCohesionHotfix: team }, stats), true);
  const selection = farmer._selectTarget({ snapshot, party: [] });
  assert.equal(selection.target.id, 'm1');
  assert.equal(selection.ranking.source, 'alpha20.20-active-encounter-continuation');
  const gate = team._combatGate({ snapshot }, target, 'ENGAGE');
  assert.equal(gate.allowed, true);
  assert.equal(gate.reason, 'ACTIVE_ENCOUNTER_CONTINUATION');
});

test('combat loot handoff opens only a healthy active-engage window', () => {
  const farmer = { state: 'ENGAGE', targetId: 'm1' };
  const logistics = { _safeForOutbound: () => false };
  const runtime = { farmer, controlledPartyLogistics: logistics, pendingEmergencyRetreat: false };
  const stats = { combatLootWindows: 0 };
  installCombatLootHandoff(runtime, stats);
  const healthy = {
    character: { name: 'Farmer', hp: 800, max_hp: 1000 },
    entities: [{ id: 'm1', mtype: 'goo', hp: 70, max_hp: 100 }]
  };
  assert.equal(logistics._safeForOutbound(healthy), true);
  healthy.character.hp = 600;
  assert.equal(logistics._safeForOutbound(healthy), false);
});

test('quota fallback uses trusted BroadcastChannel delivery with ACK', async () => {
  class FakeBroadcastChannel {
    static channels = new Map();
    constructor(name) {
      this.name = name;
      const rows = FakeBroadcastChannel.channels.get(name) || [];
      rows.push(this);
      FakeBroadcastChannel.channels.set(name, rows);
    }
    postMessage(data) {
      for (const peer of FakeBroadcastChannel.channels.get(this.name) || []) {
        if (peer === this || typeof peer.onmessage !== 'function') continue;
        queueMicrotask(() => peer.onmessage({ data }));
      }
    }
  }

  function makeRuntime(local) {
    const root = { character: { name: local }, BroadcastChannel: FakeBroadcastChannel };
    const transport = {
      localName: () => local,
      isOwned: (name) => ['A', 'B'].includes(name),
      send: async () => { throw new Error('Storage exceeded the quota'); }
    };
    return { root, now: () => Date.now(), partyAccountCommunication: { transport } };
  }

  const a = makeRuntime('A');
  const b = makeRuntime('B');
  let received = null;
  b.root.__AIO_V3_TEST = (sender, payload) => { received = { sender, payload }; };
  const statsA = { broadcastFallbacks: 0, broadcastAcks: 0, broadcastReceived: 0, broadcastRejected: 0, broadcastTimeouts: 0 };
  const statsB = { broadcastFallbacks: 0, broadcastAcks: 0, broadcastReceived: 0, broadcastRejected: 0, broadcastTimeouts: 0 };
  assert.equal(installQuotaSafeBroadcastFallback(a, statsA), true);
  assert.equal(installQuotaSafeBroadcastFallback(b, statsB), true);
  const result = await a.partyAccountCommunication.transport.send('B', { hello: 'world' }, { sender: 'A', receiver: '__AIO_V3_TEST' });
  assert.equal(result.delivered, true);
  assert.equal(result.acknowledged, true);
  assert.deepEqual(received, { sender: 'A', payload: { hello: 'world' } });
  assert.equal(statsA.broadcastAcks, 1);
  assert.equal(statsB.broadcastReceived, 1);
});

test('alpha22 item classification sells only low-risk material and retains valuable/protected loot', () => {
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', items: [], isize: 42, gold: 5000000 },
    G: { items: { ore: { type: 'material', s: 9999, g: 10 }, raregear: { type: 'weapon', upgrade: { attack: 1 }, g: 1000 } } }
  };
  const runtime = { root, adapter: { mode: 'active', getGameData: () => root.G } };
  const oracle = { quote: (name) => name === 'raregear' ? { fairValue: 2000000, source: 'market-ask' } : { fairValue: 10, source: 'game-data-fallback' }, status: () => ({}) };
  const autonomy = new MerchantEconomyAutonomy(runtime, oracle);
  const reservations = { goals: [], keys: new Set() };
  assert.equal(autonomy.classifyItem({ name: 'ore', q: 10 }, reservations).disposition, 'SELL');
  assert.equal(autonomy.classifyItem({ name: 'ore', q: 10, l: true }, reservations).disposition, 'KEEP');
  assert.equal(autonomy.classifyItem({ name: 'raregear' }, reservations).disposition, 'BANK');
});
