'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ControlledPartyBootstrap, PartyBootstrapAction } = require('../src/party/controlled-party-bootstrap');
const { installPartyBootstrapFarmerGate } = require('../src/party/party-bootstrap-farmer-gate');
const { WorldPersistence } = require('../src/world/persistence');

const ROSTER = ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3'];

function partyObject(names) {
  return Object.fromEntries(names.map((name) => [name, { name }]));
}

test('live regression: local-only get_active_characters does not classify trusted party members as foreign', () => {
  const root = {
    character: { name: 'My_Merchant', ctype: 'merchant' },
    party: partyObject(['My_Merchant', 'My_Ranger1', 'My_Ranger2']),
    party_list: ['My_Ranger2', 'My_Merchant', 'My_Ranger1'],
    get_active_characters: () => ({ My_Merchant: 'self' })
  };
  root.parent = root;
  const lease = {
    installed: true,
    merchantName: 'My_Merchant',
    setTrustedNames(names) { this.trusted = names.slice(); },
    setMerchantName(name) { this.merchantName = name; },
    install() { this.installed = true; return true; },
    uninstall() { this.installed = false; return true; }
  };
  const runtime = {
    root,
    now: () => Date.now(),
    adapter: { mode: 'active' },
    characterRegistry: { status: () => ({ characters: [] }) }
  };
  const bootstrap = new ControlledPartyBootstrap({ runtime, root, controlLease: lease, desiredRoster: ROSTER });
  bootstrap.resume();
  const status = bootstrap.tick();
  assert.deepEqual(status.observed.foreignPartyNames, []);
  assert.deepEqual(status.desiredRoster, ROSTER);
  assert.equal(status.inFlight, true);
  bootstrap.cancel();
});

test('live regression: Merchant repairs missing trusted ranger even when active API only exposes Merchant', async () => {
  const root = {
    character: { name: 'My_Merchant', ctype: 'merchant' },
    party: partyObject(['My_Merchant', 'My_Ranger1', 'My_Ranger2']),
    party_list: ['My_Ranger2', 'My_Merchant', 'My_Ranger1'],
    get_active_characters: () => ({ My_Merchant: 'self' }),
    send_party_invite(name) {
      this.party[name] = { name };
      if (!this.party_list.includes(name)) this.party_list.push(name);
    }
  };
  root.parent = root;

  let bootstrap;
  const transport = {
    trusted: [],
    setTrustedNames(names) { this.trusted = names.slice(); },
    localName: () => 'My_Merchant',
    activeCharacters: () => ({ My_Merchant: 'self' }),
    activeNames: () => ['My_Merchant'],
    installDirectReceiver(name, handler) { root[name] = handler; return true; },
    uninstallDirectReceiver(name, handler, previous) {
      if (root[name] === handler) root[name] = previous;
      return true;
    },
    status: () => ({ mode: 'test', trustedNames: ROSTER.slice() }),
    async send(target, payload) {
      assert.ok(ROSTER.includes(target));
      if (payload.action === PartyBootstrapAction.HELLO_CHALLENGE) {
        queueMicrotask(() => bootstrap.receive(target, {
          type: 'aio-v3-party-bootstrap',
          protocol: 1,
          action: PartyBootstrapAction.HELLO_ACK,
          merchantName: 'My_Merchant',
          target,
          nonce: payload.nonce,
          at: Date.now()
        }));
      }
      return { delivered: true, transport: 'test' };
    }
  };
  const authorized = [];
  const lease = {
    installed: true,
    merchantName: 'My_Merchant',
    setTrustedNames(names) { this.trusted = names.slice(); },
    setMerchantName(name) { this.merchantName = name; },
    install() { this.installed = true; return true; },
    uninstall() { this.installed = false; return true; },
    async authorizeIncoming(name) {
      authorized.push(name);
      return { authorized: true };
    }
  };
  const runtime = {
    root,
    now: () => Date.now(),
    adapter: { mode: 'active' },
    characterRegistry: { status: () => ({ characters: [] }) }
  };
  bootstrap = new ControlledPartyBootstrap({
    runtime,
    root,
    controlLease: lease,
    transport,
    desiredRoster: ROSTER,
    pollMs: 50,
    ackTimeoutMs: 1000,
    verifyTimeoutMs: 1000
  });
  bootstrap.resume();
  bootstrap.tick();
  assert.equal(await bootstrap.waitForIdle(2000), true);
  const final = bootstrap.tick();
  assert.equal(final.ready, true);
  assert.equal(final.reason, 'FULL_TRUSTED_PARTY_NON_MERCHANT_LEADER');
  assert.deepEqual(root.party_list, ['My_Ranger2', 'My_Merchant', 'My_Ranger1', 'My_Ranger3']);
  assert.deepEqual(authorized, ['My_Ranger3']);
  assert.deepEqual(lease.trusted, ROSTER);
  bootstrap.cancel();
});

test('farmer gate allows a trusted Merchant partial party during bounded repair but still blocks strangers', () => {
  let originalSteps = 0;
  const root = {
    character: { name: 'My_Ranger2', ctype: 'ranger' },
    party: partyObject(['My_Merchant', 'My_Ranger1', 'My_Ranger2']),
    party_list: ['My_Ranger2', 'My_Merchant', 'My_Ranger1'],
    get_active_characters: () => ({ My_Ranger2: 'self' })
  };
  root.parent = root;
  const farmer = {
    step() { originalSteps += 1; return { state: 'RUNNING', reason: 'ORIGINAL_RAN' }; }
  };
  const runtime = {
    root,
    farmer,
    lastSnapshot: { character: root.character },
    now: () => Date.now(),
    adapter: { mode: 'active' },
    characterRegistry: { status: () => ({ characters: [] }) }
  };
  const lease = {
    installed: true,
    merchantName: 'My_Merchant',
    setTrustedNames() {},
    setMerchantName() {},
    install() { this.installed = true; },
    uninstall() { this.installed = false; }
  };
  const bootstrap = new ControlledPartyBootstrap({ runtime, root, controlLease: lease, desiredRoster: ROSTER });
  bootstrap.resume();
  bootstrap.tick();
  const gate = installPartyBootstrapFarmerGate(runtime, bootstrap);

  const allowed = farmer.step({ snapshot: runtime.lastSnapshot });
  assert.equal(allowed.reason, 'ORIGINAL_RAN');
  assert.equal(originalSteps, 1);
  assert.equal(gate.status().stats.trustedPartialAllows, 1);

  root.party.Stranger = { name: 'Stranger' };
  root.party_list.push('Stranger');
  bootstrap.tick();
  const blocked = farmer.step({ snapshot: runtime.lastSnapshot });
  assert.equal(blocked.reason, 'PARTY_BOOTSTRAP_NOT_READY');
  assert.equal(originalSteps, 1);
  assert.equal(gate.status().lastGate.reason, 'FOREIGN_PARTY_MEMBER_PRESENT');
  bootstrap.cancel();
});

test('STOP -> START restores CM handler chain without recursion or duplicate forwarding', () => {
  let legacyCalls = 0;
  const legacy = () => { legacyCalls += 1; };
  const root = {
    character: { name: 'My_Merchant', ctype: 'merchant' },
    party: partyObject(['My_Merchant']),
    party_list: ['My_Merchant'],
    get_active_characters: () => ({ My_Merchant: 'self' }),
    on_cm: legacy
  };
  root.parent = root;

  const lease = {
    installed: false,
    previous: null,
    wrapper: null,
    merchantName: 'My_Merchant',
    setTrustedNames() {},
    setMerchantName() {},
    authorizeIncoming: async () => ({ authorized: true }),
    install() {
      if (this.installed) return false;
      this.previous = root.on_cm;
      const self = this;
      this.wrapper = function leaseWrapper() {
        if (self.previous) return self.previous.apply(this, arguments);
      };
      root.on_cm = this.wrapper;
      this.installed = true;
      return true;
    },
    uninstall() {
      if (!this.installed) return false;
      if (root.on_cm === this.wrapper) root.on_cm = this.previous;
      this.installed = false;
      this.previous = null;
      this.wrapper = null;
      return true;
    }
  };
  lease.install();

  const runtime = {
    root,
    now: () => Date.now(),
    adapter: { mode: 'active' },
    characterRegistry: { status: () => ({ characters: [] }) }
  };
  const bootstrap = new ControlledPartyBootstrap({ runtime, root, controlLease: lease, desiredRoster: ROSTER });
  bootstrap.resume();

  root.on_cm('someone', { type: 'ordinary' });
  assert.equal(legacyCalls, 1);

  bootstrap.cancel('TEST_STOP');
  assert.equal(root.on_cm, legacy);
  bootstrap.resume();
  root.on_cm('someone', { type: 'ordinary' });
  assert.equal(legacyCalls, 2);

  bootstrap.cancel('TEST_STOP_2');
  assert.equal(root.on_cm, legacy);
});

test('world persistence suppresses every later write after quota failure, including forced STOP writes', () => {
  let writes = 0;
  const quota = Object.assign(new Error('Setting the value exceeded the quota'), { name: 'QuotaExceededError' });
  const storage = {
    get: () => null,
    set() { writes += 1; throw quota; }
  };
  const persistence = new WorldPersistence({ storage, now: () => 100000 });
  const world = { revision: 1, serialize: () => '{"ok":true}', restore() {} };

  assert.equal(persistence.maybeSave(world, { force: true }), false);
  assert.equal(writes, 1);
  assert.equal(persistence.status().quotaBlocked, true);
  assert.equal(persistence.maybeSave(world, { force: true }), false);
  assert.equal(persistence.maybeSave(world), false);
  assert.equal(writes, 1);
});

test('world persistence preflight blocks near-full Adventure Land localStorage before calling set()', () => {
  let setCalls = 0;
  const values = new Map([
    ['huge', 'x'.repeat(1200)],
    ['csstore_AIO_V3_WORLD_MODEL', 'old']
  ]);
  const keys = [...values.keys()];
  const localStorage = {
    get length() { return keys.length; },
    key(index) { return keys[index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem() { throw new Error('not used'); }
  };
  const root = {
    localStorage,
    get: () => null,
    set() { setCalls += 1; throw new Error('set should have been preflight-blocked'); }
  };
  const persistence = new WorldPersistence({
    root,
    now: () => 100000,
    storageHighWatermarkChars: 1000
  });
  const world = { revision: 1, serialize: () => 'y'.repeat(600000), restore() {} };
  assert.equal(persistence.maybeSave(world, { force: true }), false);
  assert.equal(setCalls, 0);
  assert.equal(persistence.status().quotaBlocked, true);
  assert.equal(persistence.status().preflightQuotaBlocks, 1);
});
