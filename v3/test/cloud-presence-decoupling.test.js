'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installCloudPresenceDecoupling } = require('../src/control/cloud-presence-decoupling');

test('presence heartbeat runs with valid credentials while cloud control plane is disabled', async () => {
  let now = 100000;
  let pushes = 0;
  let baseCycles = 0;
  let enabled = false;
  const cloud = {
    control: { get(key, fallback) { if (key === 'cloud.enabled') return enabled; if (key === 'cloud.runtimePushMs') return 2000; return fallback; } },
    credentials: { baseUrl: 'https://example.test', writeKey: 'secret', account: 'default' },
    fetchFn: async () => ({ ok: true }),
    busy: false,
    lastRuntimePushAt: 0,
    lastSuccessAt: 0,
    lastError: null,
    stats: { failures: 0 },
    now: () => now,
    async pushRuntime() { pushes += 1; this.lastRuntimePushAt = now; this.lastSuccessAt = now; return true; },
    async cycle() { baseCycles += 1; return true; }
  };
  const runtime = { now: () => now, cloudControlPlane: cloud, log: { emit() {} } };

  const state = installCloudPresenceDecoupling(runtime);
  assert.equal(state.status().ready, true);
  assert.equal(state.status().controlPlaneEnabled, false);

  await cloud.cycle();
  assert.equal(pushes, 1);
  assert.equal(baseCycles, 0);

  now += 14999;
  await cloud.cycle();
  assert.equal(pushes, 1, '15s minimum heartbeat cadence must be preserved');

  now += 1;
  await cloud.cycle();
  assert.equal(pushes, 2);
  assert.equal(baseCycles, 0);

  enabled = true;
  await cloud.cycle();
  assert.equal(baseCycles, 1, 'enabled control plane must delegate to the original cycle');
});

test('presence heartbeat stays fail-closed without credentials', async () => {
  let pushes = 0;
  const cloud = {
    control: { get(key, fallback) { if (key === 'cloud.enabled') return false; return fallback; } },
    credentials: { baseUrl: '', writeKey: '', account: 'default' },
    fetchFn: async () => ({ ok: true }),
    busy: false,
    lastRuntimePushAt: 0,
    lastSuccessAt: 0,
    lastError: null,
    stats: { failures: 0 },
    now: () => 100000,
    async pushRuntime() { pushes += 1; return true; },
    async cycle() { return true; }
  };
  const runtime = { now: () => 100000, cloudControlPlane: cloud, log: { emit() {} } };
  const state = installCloudPresenceDecoupling(runtime);

  assert.equal(state.status().ready, false);
  assert.equal(await cloud.cycle(), false);
  assert.equal(pushes, 0);
});
