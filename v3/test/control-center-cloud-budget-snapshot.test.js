'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CloudControlPlane } = require('../src/control/cloud-control-plane');
const { reserveCloudRequest, PER_CHARACTER_DAILY_REQUEST_BUDGET } = require('../src/control/cloud-free-tier-budget');

function memoryStorage() {
  const rows = new Map();
  return {
    get length() { return rows.size; },
    key(index) { return Array.from(rows.keys())[index] || null; },
    getItem(key) { return rows.has(key) ? rows.get(key) : null; },
    setItem(key, value) { rows.set(key, String(value)); },
    removeItem(key) { rows.delete(key); }
  };
}

test('runtime snapshot exposes only the safe Cloudflare free-tier budget needed by the dashboard', () => {
  const now = 1_800_000_000_000;
  const root = { localStorage: memoryStorage(), fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }) };
  const runtime = {
    root,
    now: () => now,
    lastSnapshot: { character: { name: 'My_Merchant', ctype: 'merchant', level: 40, hp: 100, max_hp: 100, mp: 100, max_mp: 100, gold: 1 } },
    adapter: { mode: 'active' },
    log: { list: () => [] },
    performance: { status: () => ({ current: {} }) }
  };
  const control = { get: (key, fallback) => key === 'cloud.enabled' ? true : fallback, status: () => ({ revision: 1 }) };
  const brain = { status: () => ({ mode: 'shadow' }) };

  for (let i = 0; i < 3; i += 1) reserveCloudRequest({ root, character: 'My_Merchant', now });

  const cloud = new CloudControlPlane({ runtime, root, now: runtime.now, controlPlane: control, brain });
  cloud.configure({ baseUrl: 'https://example.workers.dev', writeKey: 'must-never-leave-runtime', account: 'default' });
  const snapshot = cloud._runtimeSnapshot();

  assert.equal(snapshot.cloud.freeTierBudget.used, 3);
  assert.equal(snapshot.cloud.freeTierBudget.limit, PER_CHARACTER_DAILY_REQUEST_BUDGET);
  assert.equal(snapshot.cloud.freeTierBudget.remaining, PER_CHARACTER_DAILY_REQUEST_BUDGET - 3);
  assert.equal(snapshot.cloud.ready, true);
  assert.equal(snapshot.cloud.enabledBySettings, true);
  assert.equal(JSON.stringify(snapshot).includes('must-never-leave-runtime'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot.cloud, 'configured'), false);
});
