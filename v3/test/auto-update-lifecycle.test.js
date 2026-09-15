'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_REPO_RAW,
  SafeAutoUpdater
} = require('../src/ops/safe-auto-updater');
const { ACTIVE_CLOUDFLARE_BASE_URL } = require('../src/control/cloud-free-tier-budget');

function runtimeApi(version, { running = true, startedAt = 1000 } = {}) {
  const runtime = { timer: running ? {} : null, startedAt, lastHeartbeat: startedAt + 1 };
  return {
    version,
    __runtime: runtime,
    status: () => ({ version, running }),
    stop() { runtime.timer = null; return true; },
    start() { runtime.timer = {}; return true; }
  };
}

function updaterRuntime(root, overrides = {}) {
  return {
    root,
    now: () => 100000,
    lastSnapshot: { character: { name: 'Farmer', hp: 100, max_hp: 100 }, entities: [] },
    ...overrides
  };
}

test('default auto-update source is the existing public Cloudflare worker release mirror', () => {
  assert.equal(DEFAULT_REPO_RAW, `${ACTIVE_CLOUDFLARE_BASE_URL}/v3`);
  assert.match(DEFAULT_REPO_RAW, /^https:\/\/aio-bot-dashboard\..+\.workers\.dev\/v3$/);
});

test('reload succeeds only after a new running API with the expected release version appears', async () => {
  const oldApi = runtimeApi('1.0.0');
  let oldStops = 0;
  let oldStarts = 0;
  oldApi.stop = () => { oldStops += 1; oldApi.__runtime.timer = null; return true; };
  oldApi.start = () => { oldStarts += 1; oldApi.__runtime.timer = {}; return true; };
  const root = { AIO_V3: oldApi, setTimeout, clearTimeout };
  root.parent = root;
  root.load_code = async () => {
    root.AIO_V3 = runtimeApi('1.0.1', { startedAt: 100100 });
    return true;
  };
  const updater = new SafeAutoUpdater(updaterRuntime(root), {
    localVersion: '1.0.0',
    reloadHandshakeTimeoutMs: 100,
    reloadHandshakePollMs: 5
  });

  const handshake = await updater._reloadSavedCode({ slot: 7 }, '1.0.1');
  assert.equal(handshake.ok, true);
  assert.equal(handshake.apiVersion, '1.0.1');
  assert.equal(root.AIO_V3.version, '1.0.1');
  assert.equal(oldStops, 1);
  assert.equal(oldStarts, 0);
  assert.equal(updater.stats.reloads, 1);
  assert.equal(updater.stats.reloadHandshakeSuccesses, 1);
  assert.equal(updater.stats.rollbacks, 0);
});

test('silent load_code success without a new runtime fails handshake and restarts the previous runtime', async () => {
  const oldApi = runtimeApi('1.0.0');
  let oldStops = 0;
  let oldStarts = 0;
  oldApi.stop = () => { oldStops += 1; oldApi.__runtime.timer = null; return true; };
  oldApi.start = () => { oldStarts += 1; oldApi.__runtime.timer = {}; return true; };
  const root = { AIO_V3: oldApi, setTimeout, clearTimeout, load_code: async () => true };
  root.parent = root;
  const updater = new SafeAutoUpdater(updaterRuntime(root), {
    localVersion: '1.0.0',
    reloadHandshakeTimeoutMs: 50,
    reloadHandshakePollMs: 5
  });

  await assert.rejects(() => updater._reloadSavedCode({ slot: 7 }, '1.0.1'), /NEW_RELEASE_BOOT_NOT_CONFIRMED/);
  assert.equal(root.AIO_V3, oldApi);
  assert.equal(oldStops, 1);
  assert.equal(oldStarts, 1);
  assert.equal(updater.stats.reloadHandshakeFailures, 1);
  assert.equal(updater.stats.rollbacks, 1);
});

test('bundle validation rejects a bundle whose embedded release differs from the pending version', () => {
  const root = { fetch: async () => ({ ok: true, text: async () => '' }) };
  root.parent = root;
  const updater = new SafeAutoUpdater(updaterRuntime(root), { localVersion: '1.0.0' });
  const body = `/* Adventure Land AiO Bot 1.0.2 */\nconst RELEASE_VERSION = '1.0.1';\nAIO_V3\n${'x'.repeat(10000)}`;
  const validation = updater._validateBundle(body, '1.0.2');
  assert.equal(validation.ok, false);
  assert.equal(validation.embeddedVersion, '1.0.1');
});

test('pending update drain blocks new farmer/economy/logistics work while preserving active combat and transfer verification', async () => {
  let farmerBaseCalls = 0;
  let economyBaseCalls = 0;
  let logisticsBaseCalls = 0;
  let outboundVerifications = 0;
  const farmer = {
    state: 'SELECT_TARGET',
    targetId: 'idle-target',
    targetType: 'goo',
    step() { farmerBaseCalls += 1; return { state: 'RUNNING', reason: 'BASE' }; },
    status() { return { state: this.state }; },
    _clearTarget() { this.targetId = null; this.targetType = null; },
    _transition(next, reason) { this.state = next; this.stateReason = reason; }
  };
  const economy = {
    now: () => 100000,
    busy: false,
    lastDecision: null,
    async cycle() { economyBaseCalls += 1; return true; },
    status() { return { busy: this.busy }; }
  };
  const logistics = {
    now: () => 100000,
    lastDecision: null,
    tick() { logisticsBaseCalls += 1; return { action: 'BASE' }; },
    _prune() {},
    _isMerchant() { return false; },
    _verifyPendingOutbound() { outboundVerifications += 1; },
    status() { return { pendingSupply: null, pendingGrant: null, pendingOutbound: { kind: 'item' } }; }
  };
  const root = {};
  root.parent = root;
  const runtime = updaterRuntime(root, { farmer, economyEquipmentAutonomyV2: economy, controlledPartyLogistics: logistics });
  const updater = new SafeAutoUpdater(runtime, { localVersion: '1.0.0' });
  updater.pendingVersion = '1.0.1';
  updater._setDrainActive(true, 'TEST');

  const adapter = { mode: 'active' };
  const idleSnapshot = {
    character: { name: 'Farmer', hp: 100, max_hp: 100 },
    entities: [{ id: 'idle-target', mtype: 'goo', hp: 100, target: null }]
  };
  const held = farmer.step({ snapshot: idleSnapshot, adapter });
  assert.equal(held.reason, 'AUTO_UPDATE_DRAIN');
  assert.equal(farmerBaseCalls, 0);
  assert.equal(farmer.targetId, null);

  assert.equal(await economy.cycle(), false);
  assert.equal(economyBaseCalls, 0);
  assert.equal(economy.lastDecision.reason, 'AUTO_UPDATE_DRAIN');

  logistics.tick(idleSnapshot);
  assert.equal(logisticsBaseCalls, 0);
  assert.equal(outboundVerifications, 1);
  assert.equal(logistics.lastDecision.reason, 'AUTO_UPDATE_DRAIN');

  const aggroSnapshot = {
    character: { name: 'Farmer', hp: 100, max_hp: 100 },
    entities: [{ id: 'aggro', mtype: 'bee', hp: 100, target: 'Farmer' }]
  };
  farmer.step({ snapshot: aggroSnapshot, adapter });
  assert.equal(farmerBaseCalls, 1, 'existing incoming combat must still be handled during the drain');
  assert.equal(farmer.targetId, 'aggro');

  updater._setDrainActive(false, 'TEST_DONE');
  assert.equal(await economy.cycle(), true);
  assert.equal(economyBaseCalls, 1);
});
