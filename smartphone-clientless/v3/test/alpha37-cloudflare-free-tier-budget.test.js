'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ACTIVE_CLOUDFLARE_BASE_URL,
  SYSTEM_DAILY_REQUEST_TARGET,
  INFRASTRUCTURE_DAILY_REQUEST_RESERVE,
  BOT_DAILY_REQUEST_BUDGET,
  PER_CHARACTER_DAILY_REQUEST_BUDGET,
  STORAGE_KEY,
  readCloudRequestBudget,
  reserveCloudRequest
} = require('../src/control/cloud-free-tier-budget');

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

test('Cloudflare guard targets the active Worker with 95% total headroom and an infrastructure reserve', () => {
  assert.equal(ACTIVE_CLOUDFLARE_BASE_URL, 'https://aio-bot-dashboard.hansijuergenlul.workers.dev');
  assert.equal(SYSTEM_DAILY_REQUEST_TARGET, 95000);
  assert.equal(INFRASTRUCTURE_DAILY_REQUEST_RESERVE, 5000);
  assert.equal(BOT_DAILY_REQUEST_BUDGET, 90000);
  assert.equal(PER_CHARACTER_DAILY_REQUEST_BUDGET * 4, 90000);
});

test('cloud request budget is persistent per character and fails closed at its limit', () => {
  const root = { localStorage: memoryStorage() };
  const now = Date.UTC(2026, 8, 14, 12, 0, 0);
  assert.equal(reserveCloudRequest({ root, character: 'Mage', now, limit: 2 }).ok, true);
  assert.equal(reserveCloudRequest({ root, character: 'Mage', now, limit: 2 }).ok, true);
  const blocked = reserveCloudRequest({ root, character: 'Mage', now, limit: 2 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'DAILY_CHARACTER_BUDGET_EXHAUSTED');
  assert.equal(readCloudRequestBudget({ root, character: 'Mage', now, limit: 2 }).remaining, 0);
});

test('budget resets on the next UTC day and blocks when persistent storage is unavailable', () => {
  const root = { localStorage: memoryStorage() };
  const firstDay = Date.UTC(2026, 8, 14, 23, 59, 0);
  const nextDay = Date.UTC(2026, 8, 15, 0, 1, 0);
  assert.equal(reserveCloudRequest({ root, character: 'Ranger', now: firstDay, limit: 1 }).ok, true);
  assert.equal(reserveCloudRequest({ root, character: 'Ranger', now: firstDay, limit: 1 }).ok, false);
  assert.equal(reserveCloudRequest({ root, character: 'Ranger', now: nextDay, limit: 1 }).ok, true);
  assert.equal(reserveCloudRequest({ root: {}, character: 'Ranger', now: nextDay, limit: 1 }).reason, 'PERSISTENT_STORAGE_UNAVAILABLE');
});

test('budget fails closed when persisted accounting is corrupt, invalid, or from the future', () => {
  const store = memoryStorage();
  const root = { localStorage: store };
  const now = Date.UTC(2026, 8, 14, 12, 0, 0);

  store.setItem(STORAGE_KEY, '{broken-json');
  assert.equal(reserveCloudRequest({ root, character: 'Priest', now, limit: 2 }).reason, 'PERSISTENT_STORAGE_UNAVAILABLE');

  store.setItem(STORAGE_KEY, JSON.stringify({ day: '2026-09-14', counts: { Priest: -1 } }));
  assert.equal(reserveCloudRequest({ root, character: 'Priest', now, limit: 2 }).reason, 'PERSISTENT_STORAGE_UNAVAILABLE');

  store.setItem(STORAGE_KEY, JSON.stringify({ day: '2026-09-15', counts: { Priest: 0 } }));
  assert.equal(reserveCloudRequest({ root, character: 'Priest', now, limit: 2 }).reason, 'PERSISTENT_STORAGE_UNAVAILABLE');
});

test('CloudControlPlane defaults to the active Worker when only a write key is configured and reserves requests', async () => {
  const { CloudControlPlane } = require('../src/control/cloud-control-plane');
  const root = {
    localStorage: memoryStorage(),
    AIO_V3_CLOUD_CONFIG: { writeKey: 'test-write-key' },
    fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
  };
  const runtime = { root, lastSnapshot: { character: { name: 'Mage', ctype: 'mage' } } };
  const control = { get(key, fallback) { return key === 'cloud.enabled' ? true : fallback; } };
  const cloud = new CloudControlPlane({ runtime, controlPlane: control, root, fetch: root.fetch, now: () => Date.UTC(2026, 8, 14, 12, 0, 0) });
  assert.equal(cloud.status().configured.baseUrl, ACTIVE_CLOUDFLARE_BASE_URL);
  await cloud._post('/api/v3/runtime', { account: 'default' });
  assert.equal(cloud.status().stats.cloudRequestsReserved, 1);
  assert.equal(cloud.status().freeTierBudget.used, 1);
});
