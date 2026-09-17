'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyCombatStyle,
  tankProfile,
  installMerchantMovementAuthority,
  installAdaptiveRangePositioning,
  installKiteAwareRisk,
  installEfficiencyAwareTargeting
} = require('../src/reliability/alpha24-adaptive-range-risk-logistics-hotfix');

function stats() {
  return {
    nonServiceRendezvousBlocks: 0,
    inRangeRendezvousClears: 0,
    logisticsMovementAuthorityBlocks: 0,
    softRendezvousDeferrals: 0,
    urgentPartyNeedsObserved: 0,
    rangedEngagementRangeEvaluations: 0,
    rangedFirePositionMoves: 0,
    kiteRiskOverrides: 0,
    targetEfficiencyEvaluations: 0,
    killTimeRejects: 0,
    adaptiveRiskBudgetUses: 0
  };
}

test('merchant ignores status-only rendezvous noise and defers soft rendezvous during home service', () => {
  let baseMoves = 0;
  const logistics = {
    rendezvousRequests: new Map(),
    _character: () => ({ name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0 }),
    _withinTransferRange: (a, b) => a.map === b.map && Math.hypot(a.x - b.x, a.y - b.y) <= 380,
    _rememberRendezvous(sender, data) { this.rendezvousRequests.set(sender, { name: sender, map: data.map, x: data.x, y: data.y, at: 1000 }); return true; },
    _rendezvousMerchant() { baseMoves += 1; return true; }
  };
  const economy = {
    phase: 'BANK_TRAVEL',
    _active: () => true,
    _need: () => ({ reason: 'LOGISTICS_RENDEZVOUS', report: { name: 'My_Ranger1' }, priority: 75 })
  };
  const runtime = { controlledPartyLogistics: logistics, economyEquipmentAutonomyV2: economy };
  const s = stats();
  assert.equal(installMerchantMovementAuthority(runtime, s), true);
  assert.equal(logistics._rememberRendezvous('My_Ranger1', { action: 'STATUS_REQUEST', map: 'main', x: 600, y: 0 }), false);
  assert.equal(logistics.rendezvousRequests.size, 0);
  assert.equal(s.nonServiceRendezvousBlocks, 1);
  assert.equal(logistics._rememberRendezvous('My_Ranger1', { action: 'RENDEZVOUS', map: 'main', x: 600, y: 0 }), true);
  assert.equal(logistics.rendezvousRequests.size, 1);
  assert.equal(economy._need(), null);
  assert.equal(s.softRendezvousDeferrals, 1);
  economy.phase = 'STANDBY';
  assert.equal(economy._need().reason, 'LOGISTICS_RENDEZVOUS');
  assert.equal(logistics._rendezvousMerchant({}), false);
  assert.equal(baseMoves, 0);
  assert.equal(s.logisticsMovementAuthorityBlocks, 1);
});

test('in-range service evidence clears stale rendezvous instead of extending it', () => {
  const logistics = {
    rendezvousRequests: new Map([['My_Ranger2', { name: 'My_Ranger2', map: 'main', x: 500, y: 0, at: 1 }]]),
    _character: () => ({ name: 'My_Merchant', ctype: 'merchant', map: 'main', x: 0, y: 0 }),
    _withinTransferRange: (a, b) => a.map === b.map && Math.hypot(a.x - b.x, a.y - b.y) <= 380,
    _rememberRendezvous() { throw new Error('base should not be called for in-range service'); },
    _rendezvousMerchant: () => false
  };
  const s = stats();
  installMerchantMovementAuthority({ controlledPartyLogistics: logistics }, s);
  assert.equal(logistics._rememberRendezvous('My_Ranger2', { action: 'LOOT_OFFER', map: 'main', x: 100, y: 0 }), false);
  assert.equal(logistics.rendezvousRequests.has('My_Ranger2'), false);
  assert.equal(s.inRangeRendezvousClears, 1);
});

test('ranged classes use near-maximum engagement and kiting range', () => {
  const farmer = {
    kiting: { tooCloseFactor: 0.52, desiredFactor: 0.70 },
    _engagementRange: () => 102.4,
    _engage: () => 'base',
    _needsRecovery: () => ({ hpUnsafe: false })
  };
  const runtime = { farmer, now: () => 1000, root: {}, lastSnapshot: null };
  const s = stats();
  installAdaptiveRangePositioning(runtime, s);
  const ranger = { name: 'My_Ranger1', ctype: 'ranger', range: 128, speed: 59 };
  assert.equal(classifyCombatStyle(ranger), 'ranged');
  assert.ok(Math.abs(farmer._engagementRange({ character: ranger }) - 120.32) < 0.001);
  assert.equal(farmer.kiting.tooCloseFactor, 0.84);
  assert.equal(farmer.kiting.desiredFactor, 0.92);
  assert.equal(s.rangedEngagementRangeEvaluations, 1);
});

test('non-aggro ranger repositions outward and continues the firing pipeline in the same cycle', () => {
  const commands = [];
  let baseEngages = 0;
  const farmer = {
    kiting: { tooCloseFactor: 0.52, desiredFactor: 0.70 },
    lastActionAt: 0,
    _engagementRange: () => 100,
    _needsRecovery: () => ({ hpUnsafe: false }),
    _engage: () => { baseEngages += 1; return 'base'; },
    _event: () => {}
  };
  const runtime = { farmer, now: () => 5000, root: { can_move_to: () => true } };
  const s = stats();
  installAdaptiveRangePositioning(runtime, s);
  const character = { name: 'My_Ranger2', ctype: 'ranger', range: 140, speed: 60, x: 20, y: 0, hp: 3000, max_hp: 3000 };
  const target = { id: 'm1', mtype: 'crab', hp: 1000, x: 0, y: 0, target: 'My_Ranger1' };
  const context = { snapshot: { character, party: [{ name: 'My_Ranger1', ctype: 'ranger' }], entities: [target] }, adapter: { command: (name, args) => { commands.push({ name, args }); return { executed: true }; } } };
  const result = farmer._engage(context, target);
  assert.equal(result, 'base');
  assert.equal(commands.length, 1);
  assert.equal(commands[0].name, 'move');
  assert.equal(baseEngages, 1);
  assert.equal(farmer.lastActionAt, 0);
  assert.equal(s.rangedFirePositionMoves, 1);
});

test('kite-capable ranged tank can accept bounded extra aggro but content safety remains absolute', () => {
  let response = {
    allowed: false,
    score: 0.70,
    threshold: 0.65,
    reason: 'ADDITIONAL_AGGRO',
    signals: { hpRatio: 1, additionalAggro: 1, additionalAggroContribution: 0.70, deathsPerHour: 0 }
  };
  const combatRisk = { threshold: 0.65, evaluate: () => response };
  const snapshot = {
    character: { name: 'My_Ranger1', ctype: 'ranger', range: 128, speed: 59, hp: 3743, max_hp: 3743 },
    party: [
      { name: 'My_Ranger1', ctype: 'ranger' },
      { name: 'My_Ranger2', ctype: 'ranger' },
      { name: 'My_Ranger3', ctype: 'ranger' }
    ],
    entities: []
  };
  const runtime = { combatRisk, farmer: {}, lastSnapshot: snapshot, adapter: { getGameData: () => ({ monsters: { squigtoad: { range: 25, speed: 35 } } }) } };
  const s = stats();
  installKiteAwareRisk(runtime, s);
  const target = { id: 'm1', mtype: 'squigtoad', hp: 9600, x: 0, y: 0 };
  const profile = tankProfile(runtime, target, snapshot);
  assert.equal(profile.combatStyle, 'ranged');
  assert.equal(profile.kiteCapable, true);
  const allowed = combatRisk.evaluate(target, snapshot, {}, {});
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.reason, 'KITE_MITIGATED_RISK_ACCEPTABLE');
  assert.equal(s.kiteRiskOverrides, 1);

  response = { allowed: false, score: 1, threshold: 0.65, reason: 'CONTENT_QUARANTINED', signals: { contentDisposition: 'QUARANTINED' } };
  const blocked = combatRisk.evaluate({ ...target, id: 'm2' }, snapshot, {}, {});
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'CONTENT_QUARANTINED');
});

test('efficiency targeting rejects two-minute monsters while retaining efficient ranged-party targets', () => {
  const snapshot = {
    character: { name: 'My_Ranger1', ctype: 'ranger', attack: 100, frequency: 1, range: 128, speed: 59 },
    party: [
      { name: 'My_Ranger1', ctype: 'ranger' },
      { name: 'My_Ranger2', ctype: 'ranger' },
      { name: 'My_Ranger3', ctype: 'ranger' }
    ],
    entities: []
  };
  const farmer = {
    _candidateRows: () => ({
      rows: [
        { id: 'quick', monster: 'quick', xpPerHour: 6000, goldPerHour: 0, deathsPerHour: 0, confidence: 0.05, source: 'estimate-live' },
        { id: 'slow', monster: 'slow', xpPerHour: 600000, goldPerHour: 0, deathsPerHour: 0, confidence: 0.05, source: 'estimate-live' }
      ],
      monsters: []
    }),
    planner: { maxDeathsPerHour: 0.25, rank: (rows) => rows.filter((x) => !x.unsafe) }
  };
  const runtime = {
    farmer,
    lastSnapshot: snapshot,
    adapter: { getGameData: () => ({ monsters: { quick: { hp: 2500, xp: 100 }, slow: { hp: 22000, xp: 10000 } } }) }
  };
  const s = stats();
  installEfficiencyAwareTargeting(runtime, s, { hardMaxKillSeconds: 75, softKillSeconds: 30 });
  const result = farmer._candidateRows({ snapshot });
  const quick = result.rows.find((x) => x.monster === 'quick');
  const slow = result.rows.find((x) => x.monster === 'slow');
  assert.equal(quick.unsafe, false);
  assert.ok(quick.expectedKillSeconds < 30);
  assert.equal(slow.unsafe, true);
  assert.equal(slow.inefficiencyReason, 'EXPECTED_KILL_TIME_TOO_LONG');
  assert.ok(slow.expectedKillSeconds > 75);
  assert.equal(s.killTimeRejects, 1);
});