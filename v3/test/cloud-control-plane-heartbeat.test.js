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
