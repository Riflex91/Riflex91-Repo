'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  installCloudTransportAuthority,
  installDemandDrivenRendezvous,
  scheduleGuiCollapsedStart,
  hasOutboundTransferWork
} = require('../src/reliability/alpha26-cloud-update-logistics-ui-hotfix');
const { SafeAutoUpdater, compareVersions, releaseVersionFromSource } = require('../src/ops/safe-auto-updater');

function controlFixture() {
  const values = { 'cloud.enabled': false, 'combat.riskThreshold': 0.65 };
  return {
    values,
    get(key, fallback) { return this.values[key] == null ? fallback : this.values[key]; },
    patch(input = {}, meta = {}) {
      const changed = [];
      for (const [key, value] of Object.entries(input)) {
        if (this.values[key] !== value) { this.values[key] = value; changed.push({ key, value, hot: true }); }
      }
      return { changed, rejected: [], revision: 1, updatedAt: 1, source: meta.source || 'test' };
    }
  };
}

test('valid local cloud credentials auto-enable and remote D1 cannot disable transport', () => {
  const controlPlane = controlFixture();
  const runtime = {
    controlPlane,
    cloudControlPlane: { autoEnableSuggested: false, status: () => ({ ready: true }) },
    alpha25ControlCenterBrain: {
      patchSettings(values, source) { return controlPlane.patch(values, { source }); }
    }
  };
  const stats = { cloudAutoEnables: 0, remoteCloudTransportOverridesIgnored: 0 };
  assert.equal(installCloudTransportAuthority(runtime, stats), true);
  assert.equal(controlPlane.get('cloud.enabled'), true);
  assert.equal(runtime.cloudControlPlane.autoEnableSuggested, true);
  const patch = controlPlane.patch({ 'cloud.enabled': false, 'combat.riskThreshold': 0.71 }, { source: 'cloudflare-d1' });
  assert.equal(controlPlane.get('cloud.enabled'), true);
  assert.equal(controlPlane.get('combat.riskThreshold'), 0.71);
  assert.equal(stats.remoteCloudTransportOverridesIgnored, 1);
  assert.equal(patch.changed.some((row) => row.key === 'cloud.enabled'), false);
});

test('rendezvous is sent only when a farmer really has transferable work', async () => {
  let sends = 0;
  const snapshot = { character: { name: 'My_Ranger1', ctype: 'ranger', gold: 100000, inventory: [{ name: 'hpot0', q: 100 }] } };
  const logistics = {
    __alpha26DemandDrivenRendezvous: false,
    config: { farmerGoldReserve: 250000 },
    now: () => 123,
    adapter: { snapshot: () => snapshot },
    _isMerchant: () => false,
    _safeLootDescriptor(item) { return item && item.name === 'seashell' ? { ok: true } : { ok: false }; },
    _send: async () => { sends += 1; return { delivered: true }; },
    lastDecision: null
  };
  const runtime = { controlledPartyLogistics: logistics, lastSnapshot: snapshot };
  const stats = { emptyRendezvousBlocks: 0 };
  assert.equal(hasOutboundTransferWork(logistics, snapshot), false);
  installDemandDrivenRendezvous(runtime, stats);
  const blocked = await logistics._send('My_Merchant', 'RENDEZVOUS', { map: 'main', x: 1, y: 1 });
  assert.equal(blocked.reason, 'NO_OUTBOUND_TRANSFER_WORK');
  assert.equal(sends, 0);
  assert.equal(stats.emptyRendezvousBlocks, 1);

  snapshot.character.gold = 500000;
  assert.equal(hasOutboundTransferWork(logistics, snapshot), true);
  await logistics._send('My_Merchant', 'RENDEZVOUS', { map: 'main', x: 1, y: 1 });
  assert.equal(sends, 1);

  snapshot.character.gold = 100000;
  snapshot.character.inventory.push({ name: 'seashell', q: 20 });
  await logistics._send('My_Merchant', 'RENDEZVOUS', { map: 'main', x: 1, y: 1 });
  assert.equal(sends, 2);
});

test('GUI collapsed-start scheduler collapses an already-created monitor', () => {
  let collapsed = 0;
  const ui = {
    minimized: false,
    container: {},
    _setMinimized(value) { this.minimized = value === true; collapsed += 1; },
    show() { return { shown: true }; }
  };
  const root = { AIO_V3: { __debugUI: ui }, setTimeout(fn) { fn(); return 1; } };
  const runtime = { root };
  assert.equal(scheduleGuiCollapsedStart(runtime), true);
  assert.equal(ui.minimized, true);
  assert.ok(collapsed >= 1);
});

test('version parser understands alpha release sequence', () => {
  assert.equal(releaseVersionFromSource("const RELEASE_VERSION = '3.0.0-alpha.20.21';"), '3.0.0-alpha.20.21');
  assert.equal(compareVersions('3.0.0-alpha.20.21', '3.0.0-alpha.20.20'), 1);
  assert.equal(compareVersions('3.0.0-alpha.20.20', '3.0.0-alpha.20.20'), 0);
  assert.equal(compareVersions('3.0.0-alpha.20.19', '3.0.0-alpha.20.20'), -1);
});

test('safe auto updater defers in danger, then saves active slot and reloads newer validated bundle', async () => {
  const clock = { value: 1_000_000 };
  const calls = { save: [], load: [], stop: 0 };
  const remoteVersion = '3.0.0-alpha.20.21';
  const bundle = `/* Adventure Land AiO Bot ${remoteVersion} */\n(function(){ var AIO_V3 = true; })();\n${'x'.repeat(12000)}`;
  const root = {
    AIO_V3: { version: '3.0.0-alpha.20.20', stop() { calls.stop += 1; } },
    get_active_code_slot: () => 7,
    load_code: async (slot) => { calls.load.push(slot); root.AIO_V3 = { version: remoteVersion }; return true; },
    api_call: async (name, payload) => { calls.save.push({ name, payload }); return { success: true }; }
  };
  const runtime = {
    root,
    now: () => clock.value,
    lastSnapshot: { character: { name: 'My_Ranger1', ctype: 'ranger', hp: 4000, max_hp: 4000, rip: false, target: null }, entities: [] },
    farmer: { status: () => ({ state: 'ASSESS' }) },
    transactionEngine: { status: () => ({ active: 0, recovering: 0 }) },
    economyEquipmentAutonomyV2: { status: () => ({ busy: false }) },
    controlledPartyLogistics: { status: () => ({ pendingSupply: null, pendingGrant: null, pendingOutbound: null }) },
    log: { emit() {} }
  };
  const updater = new SafeAutoUpdater(runtime, {
    localVersion: '3.0.0-alpha.20.20',
    now: runtime.now,
    root,
    fetch: async (url) => ({
      ok: true,
      status: 200,
      text: async () => url.endsWith('/src/release-version.js')
        ? `const RELEASE_VERSION = '${remoteVersion}';`
        : bundle
    })
  });

  assert.equal(await updater.check(), true);
  assert.equal(updater.pendingVersion, remoteVersion);
  assert.equal(await updater.applyPending(), false, 'safe hold window must elapse first');
  clock.value += 9000;
  assert.equal(await updater.applyPending(), true);
  assert.equal(calls.save.length, 1);
  assert.equal(calls.save[0].name, 'save_code');
  assert.equal(calls.save[0].payload.slot, 7);
  assert.ok(calls.save[0].payload.code.includes(remoteVersion));
  assert.deepEqual(calls.load, [7]);
  assert.equal(calls.stop, 1);
  assert.equal(updater.status().lastApply.reloaded, true);
});

test('safe auto updater never applies while local character has active aggro', async () => {
  const clock = { value: 2_000_000 };
  const root = { get_active_code_slot: () => 1, api_call: async () => true, load_code: async () => true };
  const runtime = {
    root,
    now: () => clock.value,
    lastSnapshot: {
      character: { name: 'My_Ranger1', ctype: 'ranger', hp: 4000, max_hp: 4000, rip: false, target: null },
      entities: [{ id: 'm1', mtype: 'squigtoad', hp: 1000, target: 'My_Ranger1' }]
    },
    farmer: { status: () => ({ state: 'ASSESS' }) },
    transactionEngine: { status: () => ({ active: 0, recovering: 0 }) },
    economyEquipmentAutonomyV2: { status: () => ({ busy: false }) },
    controlledPartyLogistics: { status: () => ({}) },
    log: { emit() {} }
  };
  const updater = new SafeAutoUpdater(runtime, { localVersion: '3.0.0-alpha.20.20', now: runtime.now, root, fetch: async () => ({ ok: true, text: async () => '' }) });
  updater.pendingVersion = '3.0.0-alpha.20.21';
  updater.safeSince = clock.value - 60000;
  assert.equal(updater.safety().safe, false);
  assert.ok(updater.safety().reasons.includes('ACTIVE_AGGRO'));
  assert.equal(await updater.applyPending(), false);
});
