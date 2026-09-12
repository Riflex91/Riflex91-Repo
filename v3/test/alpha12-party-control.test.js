'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Alpha12Runtime,
  PartyControlLease,
  PartyTransitionController,
  BackgroundExecutionGuard,
  PARTY_CONTROL_PROTOCOL,
  PARTY_CONTROL_TYPE,
  PartyControlAction
} = require('../src');

function member(name, ctype) {
  return {
    name,
    ctype,
    level: 70,
    online: true,
    available: true,
    presence: 'ONLINE',
    primarySource: 'self',
    stateConfidence: 1,
    dead: false,
    stats: { hp: 3000, max_hp: 3000, mp: 1000, max_mp: 1000 }
  };
}

test('Party control lease requires a trusted Merchant CM handshake and consumes the invite lease exactly once', async () => {
  let accepted = 0;
  const merchantRoot = { character: { name: 'Merch' } };
  const childRoot = {
    character: { name: 'P' },
    accept_party_invite(name) {
      assert.equal(name, 'Merch');
      accepted += 1;
    }
  };

  merchantRoot.send_cm = async (name, data) => {
    assert.equal(name, 'P');
    childRoot.on_cm('Merch', data);
  };
  childRoot.send_cm = async (name, data) => {
    assert.equal(name, 'Merch');
    merchantRoot.on_cm('P', data);
  };

  const trusted = ['Merch', 'P'];
  const merchant = new PartyControlLease({ root: merchantRoot, merchantName: 'Merch', trustedNames: trusted, ackTimeoutMs: 1000, pollMs: 50 });
  const child = new PartyControlLease({ root: childRoot, merchantName: 'Merch', trustedNames: trusted, ackTimeoutMs: 1000, pollMs: 50 });
  merchant.install();
  child.install();

  const authorization = await merchant.authorizeIncoming('P', 'tx-1');
  assert.equal(authorization.authorized, true);
  assert.equal(child.status().activeLease.transactionId, 'tx-1');

  childRoot.on_party_invite('Merch');
  assert.equal(accepted, 1);
  assert.equal(child.status().activeLease, null);

  childRoot.on_party_invite('Merch');
  assert.equal(accepted, 1);
  assert.equal(child.status().stats.inviteRejected, 1);
  assert.equal(merchant.status().stats.leaseAcksReceived, 1);
});

test('Party control lease rejects forged, mismatched and expired control envelopes', () => {
  let now = 10000;
  const root = { character: { name: 'P' }, send_cm() {} };
  const lease = new PartyControlLease({ root, now: () => now, merchantName: 'Merch', trustedNames: ['Merch', 'P'], leaseMs: 5000 });
  lease.install();

  const base = {
    type: PARTY_CONTROL_TYPE,
    protocol: PARTY_CONTROL_PROTOCOL,
    action: PartyControlAction.ALLOW_PARTY_INVITE,
    merchantName: 'Merch',
    target: 'P',
    transactionId: 'tx',
    issuedAt: now,
    expiresAt: now + 4000
  };
  assert.equal(lease.receive('Evil', base), false);
  assert.equal(lease.receive('Merch', { ...base, target: 'Other' }), false);
  now += 6000;
  assert.equal(lease.receive('Merch', base), false);
  assert.equal(lease.status().activeLease, null);
  assert.ok(lease.status().stats.controlRejected >= 3);
});

test('Transition controller binds invite authorization to the transaction before inviting the incoming character', async () => {
  const active = { Merch: 'self', R1: 'code', R2: 'code', R3: 'code' };
  const party = { R1: {}, R2: {}, R3: {} };
  const authorized = [];
  const controlLease = {
    status: () => ({ installed: true, merchantName: 'Merch' }),
    setMerchantName() {},
    async authorizeIncoming(name, transactionId) { authorized.push({ name, transactionId }); return { authorized: true }; }
  };
  const root = {
    character: { name: 'Merch' },
    parent: { party },
    get_active_characters: () => ({ ...active }),
    stop_character(name) { delete active[name]; delete party[name]; },
    async start_character(name) { active[name] = 'code'; },
    async send_party_invite(name) { party[name] = {}; }
  };
  const controller = new PartyTransitionController({
    root,
    merchantName: 'Merch',
    liveEnabled: true,
    codeSlots: { R1: 1, R2: 1, R3: 1, P: 1 },
    controlLease,
    pollMs: 100,
    stepTimeoutMs: 3000
  });
  const plan = { merchant: { name: 'Merch' }, members: [member('Merch', 'merchant'), member('R1', 'ranger'), member('R2', 'ranger'), member('P', 'paladin')] };
  const result = await controller.execute(plan, {
    runtimeMode: 'active',
    currentMembers: ['Merch', 'R1', 'R2', 'R3'],
    registryStatus: { characters: [] },
    inCombat: false,
    emergency: false,
    requiresCrossMapRouting: false,
    verifyTargetState: () => true
  });
  assert.equal(result.executed, true);
  assert.deepEqual(authorized.map((row) => row.name), ['P']);
  assert.match(authorized[0].transactionId, /^party-transition-/);
  assert.equal(controller.status().controlLeaseBound, true);
});

test('Failed incoming start rolls back the old party and authorizes the rollback invite', async () => {
  const active = { Merch: 'self', R1: 'code', R2: 'code', R3: 'code' };
  const party = { R1: {}, R2: {}, R3: {} };
  const authorized = [];
  const controlLease = {
    status: () => ({ installed: true, merchantName: 'Merch' }),
    setMerchantName() {},
    async authorizeIncoming(name, transactionId) { authorized.push({ name, transactionId }); return { authorized: true }; }
  };
  const root = {
    character: { name: 'Merch' },
    parent: { party },
    get_active_characters: () => ({ ...active }),
    stop_character(name) { delete active[name]; delete party[name]; },
    async start_character(name) {
      if (name === 'P') throw new Error('synthetic start failure');
      active[name] = 'code';
    },
    async send_party_invite(name) { party[name] = {}; }
  };
  const controller = new PartyTransitionController({
    root,
    merchantName: 'Merch',
    liveEnabled: true,
    codeSlots: { R1: 1, R2: 1, R3: 1, P: 1 },
    controlLease,
    pollMs: 100,
    stepTimeoutMs: 3000
  });
  const plan = { merchant: { name: 'Merch' }, members: [member('Merch', 'merchant'), member('R1', 'ranger'), member('R2', 'ranger'), member('P', 'paladin')] };
  const result = await controller.execute(plan, {
    runtimeMode: 'active',
    currentMembers: ['Merch', 'R1', 'R2', 'R3'],
    registryStatus: { characters: [] },
    inCombat: false,
    emergency: false,
    requiresCrossMapRouting: false,
    verifyTargetState: () => true
  });
  assert.equal(result.executed, false);
  assert.equal(result.recovery.recovered, true);
  assert.equal(active.R3, 'code');
  assert.ok(party.R3);
  assert.equal(active.P, undefined);
  assert.equal(authorized.length, 1);
  assert.equal(authorized[0].name, 'R3');
  assert.match(authorized[0].transactionId, /:rollback$/);
});

test('Hardened Alpha12 runtime installs the control lease, keeps Party authority default-off and normalizes visible release version tags', () => {
  const visible = [];
  const storage = { get: () => null, set() {} };
  const root = {
    character: { name: 'Merch', ctype: 'merchant', level: 70, map: 'main', real_x: 0, real_y: 0, hp: 2000, max_hp: 2000, mp: 1000, max_mp: 1000, xp: 0, gold: 0, items: [], slots: {}, speed: 40, rip: false },
    parent: { entities: {}, party: {} },
    G: { monsters: {}, maps: { main: {} }, skills: {} },
    performance_trick() {}
  };
  const runtime = new Alpha12Runtime({
    root,
    parent: root.parent,
    mode: 'shadow',
    storage,
    characterRoster: [
      { name: 'Merch', ctype: 'merchant', level: 70, available: true },
      { name: 'R1', ctype: 'ranger', level: 70, available: true },
      { name: 'R2', ctype: 'ranger', level: 70, available: true },
      { name: 'R3', ctype: 'ranger', level: 70, available: true }
    ],
    partyMerchantName: 'Merch'
  });
  runtime._gameLog = (message) => { visible.push(String(message)); return true; };
  runtime._announce('[AIO v3 3.0.0-alpha.8.13] TEST', 'TEST_RELEASE_VERSION_NORMALIZATION');
  const status = runtime.status();
  assert.equal(status.version, '3.0.0-alpha.12.0');
  assert.equal(status.party.actionAuthority, false);
  assert.equal(status.party.transition.liveEnabled, false);
  assert.equal(status.party.transition.controlLeaseBound, true);
  assert.equal(status.party.controlLease.installed, true);
  assert.equal(status.party.controlLease.merchantName, 'Merch');
  assert.ok(visible.some((line) => line.includes('[AIO v3 3.0.0-alpha.12.0]')));
  assert.ok(visible.every((line) => !line.includes('3.0.0-alpha.8.13')));
  runtime.stop();
  assert.equal(runtime.partyControlLease.status().installed, false);
});

test('Background execution guard removes visibility/focus listeners on stop while keeping performance_trick best-effort', () => {
  const events = new Map();
  let calls = 0;
  const document = {
    addEventListener(name, fn) { events.set(`doc:${name}`, fn); },
    removeEventListener(name, fn) { if (events.get(`doc:${name}`) === fn) events.delete(`doc:${name}`); }
  };
  const root = {
    document,
    performance_trick() { calls += 1; },
    addEventListener(name, fn) { events.set(`root:${name}`, fn); },
    removeEventListener(name, fn) { if (events.get(`root:${name}`) === fn) events.delete(`root:${name}`); }
  };
  const guard = new BackgroundExecutionGuard({ root });
  assert.equal(guard.start().armed, true);
  assert.equal(calls, 1);
  assert.equal(guard.status().listenersInstalled, true);
  guard.stop();
  assert.equal(guard.status().listenersInstalled, false);
  assert.equal(events.size, 0);
});
