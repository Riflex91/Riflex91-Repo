'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TargetSafety } = require('../src/farmer/target-safety');
const { ContentSafetyGate } = require('../src/farmer/content-safety');
const { AccountCharacterTransport } = require('../src/party/account-character-transport');
const { ControlledPartyBootstrap, PartyBootstrapAction } = require('../src/party/controlled-party-bootstrap');
const { installFarmerTravelSafetyHotfix } = require('../src/reliability/farmer-travel-safety-hotfix');
const { installContentDriftStorageHotfix } = require('../src/reliability/content-drift-storage-hotfix');

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

test('content-drift quota recovery compacts only its own bounded record set and retries once', () => {
  const records = new Map();
  for (let i = 0; i < 800; i += 1) records.set(`r${i}`, { lifecycle: 'OBSERVED', lastSeenAt: i });
  const monitor = {
    capacity: 2048,
    records,
    stats: { saveErrors: 0 },
    _prune() {
      while (this.records.size > this.capacity) this.records.delete(this.records.keys().next().value);
    },
    save() {
      if (this.records.size > 400) {
        this.stats.saveErrors += 1;
        return false;
      }
      return true;
    }
  };
  const runtime = { contentDrift: monitor, now: () => 1000, log: null };
  const hotfix = installContentDriftStorageHotfix(runtime, { maxRecordsAfterQuota: 384 });
  assert.equal(monitor.save({ force: true }), true);
  assert.ok(monitor.records.size <= 384);
  assert.equal(hotfix.status().stats.compactions, 1);
  assert.equal(hotfix.status().stats.retrySuccesses, 1);
});
