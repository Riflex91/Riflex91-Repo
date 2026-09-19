'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CloudControlPlane } = require('../src/control/cloud-control-plane');

test('cloud cycle enforces 15s runtime and 30s config minimum intervals', async () => {
  let now = 100000;
  const root = { fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }) };
  const control = {
    revision: 0,
    get(key, fallback) {
      if (key === 'cloud.enabled') return true;
      if (key === 'cloud.runtimePushMs') return 2000;
      if (key === 'cloud.configPullMs') return 5000;
      return fallback;
    }
  };
  const runtime = {
    root,
    lastSnapshot: { character: { name: 'Heartbeat_Test', ctype: 'ranger' } },
    now: () => now
  };
  const cloud = new CloudControlPlane({ runtime, controlPlane: control, root, now: () => now, fetch: root.fetch });
  cloud.credentials = { baseUrl: 'https://example.com', writeKey: 'test', account: 'default' };

  let runtimePushes = 0;
  let configPulls = 0;
  cloud.pushRuntime = async () => { runtimePushes += 1; cloud.lastRuntimePushAt = now; return true; };
  cloud.syncState = async () => { configPulls += 1; cloud.lastConfigPullAt = now; return true; };

  await cloud.cycle();
  assert.equal(runtimePushes, 1);
  assert.equal(configPulls, 1);

  now += 14000;
  await cloud.cycle();
  assert.equal(runtimePushes, 1);
  assert.equal(configPulls, 1);

  now += 1000;
  await cloud.cycle();
  assert.equal(runtimePushes, 2);
  assert.equal(configPulls, 1);

  now += 15000;
  await cloud.cycle();
  assert.equal(runtimePushes, 3);
  assert.equal(configPulls, 2);
});


test('runtime heartbeat keeps the large Automation catalog on a dedicated infrequent channel', async () => {
  let now = 100000;
  const root = {};
  const runtime = {
    root,
    lastSnapshot: { character: { name: 'Merchant_Test', ctype: 'merchant' } },
    now: () => now
  };
  const cloud = new CloudControlPlane({ runtime, root, now: () => now, fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }) });
  cloud.credentials = { baseUrl: 'https://example.com', writeKey: 'test', account: 'default' };
  const catalog = Array.from({ length: 627 }, (_, index) => ({ id: 'item-' + index, name: 'Item ' + index }));
  catalog.push({ id: 'partyhat', name: 'Party Hat' });
  cloud._runtimeSnapshot = () => ({
    character: { name: 'Merchant_Test', ctype: 'merchant' },
    automationCatalogVersion: 3,
    automationCatalogCount: catalog.length,
    automationCatalog: catalog
  });

  const calls = [];
  cloud._post = async (path, body) => { calls.push({ path, body }); return { ok: true }; };

  await cloud.pushRuntime();
  assert.deepEqual(calls.map(row => row.path), ['/api/v3/runtime', '/api/v3/automation-catalog']);
  assert.equal(Object.prototype.hasOwnProperty.call(calls[0].body.status, 'automationCatalog'), false);
  assert.equal(calls[0].body.status.automationCatalogCount, 628);
  assert.equal(calls[1].body.catalog.length, 628);
  assert.equal(calls[1].body.catalog.at(-1).id, 'partyhat');

  now += 15000;
  await cloud.pushRuntime();
  assert.deepEqual(calls.map(row => row.path), ['/api/v3/runtime', '/api/v3/automation-catalog', '/api/v3/runtime']);
  assert.equal(cloud.stats.automationCatalogSkips, 1);

  now += 30 * 60 * 1000 + 1;
  await cloud.pushRuntime();
  assert.equal(calls.filter(row => row.path === '/api/v3/automation-catalog').length, 2);
  assert.equal(cloud.stats.automationCatalogPushes, 2);
});

test('Automation catalog upload failure does not invalidate a successful runtime heartbeat', async () => {
  const runtime = { root: {}, lastSnapshot: { character: { name: 'Merchant_Test', ctype: 'merchant' } } };
  const cloud = new CloudControlPlane({ runtime, root: runtime.root, now: () => 100000, fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }) });
  cloud.credentials = { baseUrl: 'https://example.com', writeKey: 'test', account: 'default' };
  cloud._runtimeSnapshot = () => ({ character: { name: 'Merchant_Test', ctype: 'merchant' }, automationCatalogVersion: 3, automationCatalogCount: 1, automationCatalog: [{ id: 'partyhat' }] });
  cloud._post = async (path) => {
    if (path === '/api/v3/automation-catalog') throw new Error('catalog too large');
    return { ok: true };
  };

  const result = await cloud.pushRuntime();
  assert.deepEqual(result, { ok: true });
  assert.equal(cloud.stats.runtimePushes, 1);
  assert.equal(cloud.stats.automationCatalogFailures, 1);
});
// The dedicated catalog cadence intentionally keeps master data off the 15-second heartbeat.\n