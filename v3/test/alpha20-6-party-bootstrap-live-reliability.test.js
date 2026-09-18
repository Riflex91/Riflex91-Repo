'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetSafety } = require('../src/farmer/target-safety');
const { ContentSafetyGate } = require('../src/farmer/content-safety');
const { AccountCharacterTransport } = require('../src/party/account-character-transport');
const { ControlledPartyBootstrap, PartyBootstrapAction } = require('../src/party/controlled-party-bootstrap');
const { installFarmerTravelSafetyHotfix } = require('../src/farmer/farmer-travel-safety-hotfix');
const { installContentDriftStorageHotfix } = require('../src/content/content-drift-storage-hotfix');

function policyWorld(initial = {}) {
  const facts = new Map(Object.entries(initial));
  return {
    entities: new Map(),
    hasEntity: () => true,
    fact(type, id, name) {
      const row = facts.get(`${type}:${id}`) || {};
      return { value: row[name] };
    },
    observeEntity(type, id, values) {
      const key = `${type}:${id}`;
      facts.set(key, { ...(facts.get(key) || {}), ...values });
      this.entities.set(key, { type, id });
    }
  };
}

function activeFour() {
  return { Merch: 'self', R1: 'code', R2: 'code', R3: 'code' };
}

function bootstrapRoot(active = activeFour(), partyNames = ['Merch']) {
  const party = Object.fromEntries(partyNames.map((name) => [name, { name }]));
  const root = {
    character: { name: 'Merch', ctype: 'merchant' },
    party,
    party_list: partyNames.slice(),
    get_active_characters: () => ({ ...active }),
    send_party_invite(name) {
      this.party[name] = { name };
      if (!this.party_list.includes(name)) this.party_list.push(name);
    }
  };
  root.parent = root;
  return root;
}

test('dangerous special fairies are non-removable target exclusions', () => {
  const safety = new TargetSafety();
  for (const mtype of ['redfairy', 'greenfairy', 'bluefairy']) {
    const result = safety.evaluate({ mtype }, { monsters: {} });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'DANGEROUS_SPECIAL_FAIRY');
    assert.equal(safety.remove(mtype), false);
  }
});

test('content safety hard-quarantines dangerous fairies even when old world state says LEGACY_ALLOWED', () => {
  const world = policyWorld({
    'monster-policy:bluefairy': {
      contentSafetyDisposition: 'LEGACY_ALLOWED',
      contentSafetyReason: 'PRE_ALPHA_8_12_KNOWN'
    }
  });
  const gate = new ContentSafetyGate({ now: () => 1234 });
  const result = gate.evaluate({ mtype: 'bluefairy' }, world);
  assert.equal(result.allowed, false);
  assert.equal(result.disposition, 'QUARANTINED');
  assert.equal(result.reason, 'BUILT_IN_DANGEROUS_SPECIAL');
  assert.equal(world.fact('monster-policy', 'bluefairy', 'contentSafetyDisposition').value, 'QUARANTINED');
  assert.equal(gate.approve(world, 'bluefairy').disposition, 'QUARANTINED');
});

test('farmer target travel is clamped to a bounded step instead of one huge raw move', () => {
  let now = 10000;
  let move = null;
  const farmer = {
    config: { moveCooldownMs: 0 },
    lastActionAt: 0,
    now: () => now,
    _targetAllowed: () => true,
    _engagementRange: () => 100,
    _block(reason) { throw new Error(`unexpected block:${reason}`); },
    _clearTarget() {},
    _transition() {},
    _event() {}
  };
  const runtime = { farmer };
  const hotfix = installFarmerTravelSafetyHotfix(runtime, { maxStep: 120, minStep: 50, stepSeconds: 2 });
  farmer._travel({
    snapshot: { character: { x: 0, y: 0, speed: 60 } },
    party: null,
    adapter: { command(action, args) { assert.equal(action, 'move'); move = args; return { executed: true }; } }
  }, { id: 'target', mtype: 'crab', x: 1000, y: 0, hp: 1000, dead: false });
  assert.ok(move);
  assert.ok(Math.hypot(move[0], move[1]) <= 120.0001);
  assert.equal(hotfix.status().stats.boundedMoves, 1);
  assert.ok(hotfix.status().lastMove.rawTravel > hotfix.status().lastMove.step);
  now += 1;
});

test('same-account transport prefers command_character and never touches send_cm when direct IPC works', async () => {
  let direct = 0;
  let cm = 0;
  const root = {
    character: { name: 'Merch' },
    get_active_characters: () => ({ Merch: 'self', R1: 'code' }),
    command_character(name, code) {
      assert.equal(name, 'R1');
      assert.match(code, /__AIO_TEST_RECEIVE/);
      direct += 1;
    },
    send_cm() { cm += 1; throw new Error('should not use CM'); }
  };
  root.parent = root;
  const transport = new AccountCharacterTransport({ root });
  const result = await transport.send('R1', { hello: true }, { receiver: '__AIO_TEST_RECEIVE', sender: 'Merch' });
  assert.equal(result.transport, 'command_character');
  assert.equal(direct, 1);
  assert.equal(cm, 0);
});

test('party bootstrap is a zero-action no-op for an already correct Merchant plus three party', () => {
  const root = bootstrapRoot(activeFour(), ['Merch', 'R1', 'R2', 'R3']);
  let authorized = 0;
  const controlLease = {
    merchantName: 'Merch',
    setTrustedNames() {},
    setMerchantName(name) { this.merchantName = name; },
    authorizeIncoming() { authorized += 1; throw new Error('must not authorize'); }
  };
  const runtime = { root, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  const bootstrap = new ControlledPartyBootstrap({ runtime, root, controlLease });
  bootstrap.resume();
  const status = bootstrap.tick();
  assert.equal(status.ready, true);
  assert.equal(status.state, 'READY');
  assert.equal(authorized, 0);
  assert.equal(status.stats.invitesSent, 0);
});

test('party bootstrap repairs a full trusted party by making the wrong current leader leave before Merchant rebuilds', async () => {
  const root = {
    character: { name: 'R1', ctype: 'ranger' },
    party: Object.fromEntries(['R1', 'Merch', 'R2', 'R3'].map((name) => [name, { name }])),
    party_list: ['R1', 'Merch', 'R2', 'R3'],
    get_active_characters: () => ({ Merch: 'code', R1: 'self', R2: 'code', R3: 'code' }),
    leave_party() {
      delete this.party.R1;
      this.party_list = this.party_list.filter((name) => name !== 'R1');
      return { success: true };
    }
  };
  root.parent = root;
  const lease = {
    merchantName: 'Merch',
    setTrustedNames() {},
    setMerchantName(name) { this.merchantName = name; }
  };
  const runtime = { root, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  const bootstrap = new ControlledPartyBootstrap({
    runtime,
    root,
    controlLease: lease,
    desiredRoster: ['Merch', 'R1', 'R2', 'R3'],
    merchantName: 'Merch',
    pollMs: 10,
    verifyTimeoutMs: 250
  });
  bootstrap.resume();

  const first = bootstrap.tick();
  assert.equal(first.ready, false);
  assert.equal(first.state, 'REPAIRING');
  assert.equal(first.leaderRepairAuthority, true);
  assert.equal(first.inFlight, true);
  assert.deepEqual(bootstrap.farmingGate('R1'), {
    allowed: false,
    reason: 'NON_MERCHANT_PARTY_LEADER_REPAIR_REQUIRED',
    full: true
  });

  assert.equal(await bootstrap.waitForIdle(1000), true);
  assert.deepEqual(root.party_list, ['Merch', 'R2', 'R3']);
  assert.equal(bootstrap.status().stats.leaderRepairLeaves, 1);
  assert.equal(bootstrap.status().stats.leaderRepairVerified, 1);
  assert.equal(bootstrap.status().lastResult.action, 'LEAVE_FOR_MERCHANT_LEADERSHIP');

  const after = bootstrap.tick();
  assert.equal(after.ready, false);
  assert.equal(after.reason, 'WAITING_FOR_MERCHANT_BOOTSTRAP');
  assert.equal(after.observed.partyNames.includes('R1'), false);
  assert.equal(bootstrap.farmingGate('R1').allowed, false);
  bootstrap.cancel();
});

test('party bootstrap lets only the observed wrong leader perform the leave repair', () => {
  let leaves = 0;
  const root = {
    character: { name: 'R2', ctype: 'ranger' },
    party: Object.fromEntries(['R1', 'Merch', 'R2', 'R3'].map((name) => [name, { name }])),
    party_list: ['R1', 'Merch', 'R2', 'R3'],
    get_active_characters: () => ({ Merch: 'code', R1: 'code', R2: 'self', R3: 'code' }),
    leave_party() { leaves += 1; return { success: true }; }
  };
  root.parent = root;
  const lease = { merchantName: 'Merch', setTrustedNames() {}, setMerchantName() {} };
  const runtime = { root, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  const bootstrap = new ControlledPartyBootstrap({
    runtime,
    root,
    controlLease: lease,
    desiredRoster: ['Merch', 'R1', 'R2', 'R3'],
    merchantName: 'Merch'
  });
  bootstrap.resume();

  const status = bootstrap.tick();
  assert.equal(status.ready, false);
  assert.equal(status.state, 'REPAIRING');
  assert.equal(status.reason, 'WAITING_FOR_CURRENT_PARTY_LEADER_R1');
  assert.equal(status.leaderRepairAuthority, false);
  assert.equal(status.inFlight, false);
  assert.equal(leaves, 0);
  assert.equal(bootstrap.farmingGate('R2').reason, 'NON_MERCHANT_PARTY_LEADER_REPAIR_REQUIRED');
  bootstrap.cancel();
});

test('party leader repair advances deterministically through non-Merchant leaders until Merchant is first', async () => {
  const shared = {
    party: Object.fromEntries(['R1', 'R2', 'Merch', 'R3'].map((name) => [name, { name }])),
    party_list: ['R1', 'R2', 'Merch', 'R3']
  };
  const makeBootstrap = (localName) => {
    const root = {
      character: { name: localName, ctype: 'ranger' },
      parent: shared,
      get_active_characters: () => ({
        Merch: localName === 'Merch' ? 'self' : 'code',
        R1: localName === 'R1' ? 'self' : 'code',
        R2: localName === 'R2' ? 'self' : 'code',
        R3: localName === 'R3' ? 'self' : 'code'
      }),
      leave_party() {
        delete shared.party[localName];
        shared.party_list = shared.party_list.filter((name) => name !== localName);
        return { success: true };
      }
    };
    const lease = { merchantName: 'Merch', setTrustedNames() {}, setMerchantName() {} };
    const runtime = { root, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
    const bootstrap = new ControlledPartyBootstrap({
      runtime,
      root,
      controlLease: lease,
      desiredRoster: ['Merch', 'R1', 'R2', 'R3'],
      merchantName: 'Merch',
      pollMs: 10,
      verifyTimeoutMs: 250
    });
    bootstrap.resume();
    return bootstrap;
  };

  const r1 = makeBootstrap('R1');
  r1.tick();
  assert.equal(await r1.waitForIdle(1000), true);
  assert.deepEqual(shared.party_list, ['R2', 'Merch', 'R3']);
  r1.cancel();

  const r2 = makeBootstrap('R2');
  r2.tick();
  assert.equal(await r2.waitForIdle(1000), true);
  assert.deepEqual(shared.party_list, ['Merch', 'R3']);
  assert.equal(shared.party_list[0], 'Merch');
  r2.cancel();
});

test('party leader repair fails closed when leave_party is unavailable', async () => {
  const root = {
    character: { name: 'R1', ctype: 'ranger' },
    party: Object.fromEntries(['R1', 'Merch', 'R2', 'R3'].map((name) => [name, { name }])),
    party_list: ['R1', 'Merch', 'R2', 'R3'],
    get_active_characters: () => ({ Merch: 'code', R1: 'self', R2: 'code', R3: 'code' })
  };
  root.parent = root;
  const lease = { merchantName: 'Merch', setTrustedNames() {}, setMerchantName() {} };
  const runtime = { root, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  const bootstrap = new ControlledPartyBootstrap({
    runtime,
    root,
    controlLease: lease,
    desiredRoster: ['Merch', 'R1', 'R2', 'R3'],
    merchantName: 'Merch',
    retryBaseMs: 1000
  });
  bootstrap.resume();
  const first = bootstrap.tick();
  assert.equal(first.ready, false);
  assert.equal(first.inFlight, true);
  assert.equal(await bootstrap.waitForIdle(1000), true);
  const failed = bootstrap.status();
  assert.equal(failed.ready, false);
  assert.equal(failed.state, 'BACKOFF');
  assert.equal(failed.reason, 'RETRY_PARTY_LEADER_REPAIR_R1');
  assert.equal(failed.stats.leaderRepairFailures, 1);
  assert.deepEqual(root.party_list, ['R1', 'Merch', 'R2', 'R3']);
  bootstrap.cancel();
});

test('party bootstrap verifies and invites only missing active owned characters, one at a time', async () => {
  const root = bootstrapRoot(activeFour(), ['Merch']);
  const invited = [];
  root.send_party_invite = (name) => {
    invited.push(name);
    root.party[name] = { name };
    root.party_list.push(name);
  };
  let bootstrap;
  let receiver = null;
  const transport = {
    localName: () => 'Merch',
    activeCharacters: () => activeFour(),
    ownedNames: () => ['Merch', 'R1', 'R2', 'R3'],
    installDirectReceiver(name, fn) { receiver = fn; return true; },
    status: () => ({ mode: 'test' }),
    async send(target, payload) {
      if (payload.action === PartyBootstrapAction.HELLO_CHALLENGE) {
        queueMicrotask(() => bootstrap.receive(target, {
          type: 'aio-v3-party-bootstrap',
          protocol: 1,
          action: PartyBootstrapAction.HELLO_ACK,
          merchantName: 'Merch',
          target,
          nonce: payload.nonce,
          at: Date.now()
        }));
      }
      return { delivered: true, transport: 'test' };
    }
  };
  const authorized = [];
  const controlLease = {
    merchantName: 'Merch',
    setTrustedNames(names) { this.trusted = names.slice(); },
    setMerchantName(name) { this.merchantName = name; },
    async authorizeIncoming(name) { authorized.push(name); return { authorized: true }; }
  };
  const runtime = { root, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  bootstrap = new ControlledPartyBootstrap({ runtime, root, controlLease, transport, pollMs: 50, ackTimeoutMs: 1000, verifyTimeoutMs: 1000 });
  assert.ok(receiver);
  bootstrap.resume();
  for (let i = 0; i < 3; i += 1) {
    bootstrap.tick();
    assert.equal(await bootstrap.waitForIdle(2000), true);
  }
  const final = bootstrap.tick();
  assert.equal(final.ready, true);
  assert.deepEqual(invited, ['R1', 'R2', 'R3']);
  assert.deepEqual(authorized, ['R1', 'R2', 'R3']);
  assert.deepEqual(controlLease.trusted, ['Merch', 'R1', 'R2', 'R3']);
});

test('party bootstrap fails closed for foreign party members and impossible active-character count', () => {
  const foreignRoot = bootstrapRoot(activeFour(), ['Merch', 'Stranger']);
  const lease = { merchantName: 'Merch', setTrustedNames() {}, setMerchantName() {}, authorizeIncoming() { throw new Error('no'); } };
  const runtime = { root: foreignRoot, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  const foreign = new ControlledPartyBootstrap({ runtime, root: foreignRoot, controlLease: lease });
  foreign.resume();
  assert.equal(foreign.tick().reason, 'FOREIGN_OR_INACTIVE_PARTY_MEMBER_PRESENT');
  assert.equal(foreign.status().stats.invitesSent, 0);

  const tooManyRoot = bootstrapRoot({ Merch: 'self', R1: 'code', R2: 'code', R3: 'code', R4: 'code' }, ['Merch']);
  const runtime2 = { root: tooManyRoot, now: () => Date.now(), adapter: { mode: 'active' }, characterRegistry: { status: () => ({ characters: [] }) } };
  const tooMany = new ControlledPartyBootstrap({ runtime: runtime2, root: tooManyRoot, controlLease: lease });
  tooMany.resume();
  assert.equal(tooMany.tick().reason, 'ACTIVE_CHARACTER_LIMIT_EXCEEDED');
  assert.equal(tooMany.status().stats.invitesSent, 0);
});

test('content-drift quota failure preserves semantic records and blocks subsequent writes', () => {
  const records = new Map();
  for (let i = 0; i < 800; i += 1) records.set(`r${i}`, { lifecycle: 'OBSERVED', lastSeenAt: i });
  let writes = 0;
  const monitor = {
    capacity: 2048,
    records,
    stats: { saveErrors: 0 },
    save() {
      writes += 1;
      this.stats.saveErrors += 1;
      return false;
    }
  };
  const runtime = { contentDrift: monitor, now: () => 1000, log: null };
  const hotfix = installContentDriftStorageHotfix(runtime);
  assert.equal(monitor.save({ force: true }), false);
  assert.equal(monitor.records.size, 800);
  assert.equal(monitor.capacity, 2048);
  assert.equal(hotfix.status().sessionWriteBlocked, true);
  assert.equal(hotfix.status().semanticRecordPruningAllowedForQuotaRecovery, false);
  assert.equal(monitor.save({ force: true }), false);
  assert.equal(writes, 1);
  assert.equal(monitor.records.size, 800);
});
