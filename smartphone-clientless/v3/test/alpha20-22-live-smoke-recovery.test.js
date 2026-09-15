'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  installLocalFarmTerrainGuard,
  installCloudBackoff,
  installPersistenceBackoff,
  installCmQuotaBackoff
} = require('../src/reliability/alpha20-22-live-smoke-recovery');

function stats() {
  return { localFarmTerrainReroutes: 0, localFarmBlockedWaypoints: 0, cloudD1QuotaBackoffs: 0, cloudNetworkBackoffs: 0, cloudCyclesSuppressed: 0, persistenceCyclesSuppressed: 0, cmQuotaBackoffs: 0, cmQuotaSendsSuppressed: 0 };
}

function state() { return { cloudBackoffUntil: 0, cloudBackoffReason: null, networkFailureStreak: 0, cmBackoff: new Map() }; }

test('Alpha20.22 local farming reroutes a blocked direct step through a passable bounded waypoint', () => {
  const s = stats();
  const local = { _boundedDestination: () => ({ x: 120, y: 0, step: 120 }), status: () => ({ enabled: true }) };
  const runtime = { root: { can_move_to: (x, y) => Math.abs(y) > 10 && Math.hypot(x, y) <= 121 }, localFarming: local };
  assert.equal(installLocalFarmTerrainGuard(runtime, s), true);
  const next = local._boundedDestination({ x: 0, y: 0 }, { x: 1000, y: 0 });
  assert.ok(next);
  assert.equal(next.terrainAdjusted, true);
  assert.notEqual(Math.round(next.y), 0);
  assert.equal(runtime.root.can_move_to(next.x, next.y), true);
  assert.equal(s.localFarmTerrainReroutes, 1);
  assert.equal(local.status().alpha20_22.blockedDirectMoveNeverIssued, true);
});

test('Alpha20.22 local farming returns no waypoint when terrain probing cannot find a safe move', () => {
  const s = stats();
  const local = { _boundedDestination: () => ({ x: 120, y: 0, step: 120 }) };
  const runtime = { root: { can_move_to: () => false }, localFarming: local };
  installLocalFarmTerrainGuard(runtime, s);
  assert.equal(local._boundedDestination({ x: 0, y: 0 }, { x: 1000, y: 0 }), null);
  assert.equal(s.localFarmBlockedWaypoints, 1);
});

test('Alpha20.22 D1 quota response arms UTC reset backoff and suppresses cloud/persistence retry storms', async () => {
  let now = Date.UTC(2026, 8, 13, 16, 0, 0), cycleCalls = 0, persistenceTicks = 0;
  const s = stats(), st = state();
  const cloud = {
    now: () => now,
    async _post() { throw new Error('D1_DAILY_ROW_READ_LIMIT code 7500'); },
    async cycle() { cycleCalls += 1; return true; },
    status() { return { ready: true }; }
  };
  const persistence = { now: () => now, beforeTick() { persistenceTicks += 1; return true; }, status() { return {}; } };
  const runtime = { now: () => now, cloudControlPlane: cloud, cloudLongTermPersistence: persistence };
  installCloudBackoff(runtime, s, st); installPersistenceBackoff(runtime, s, st);
  await assert.rejects(() => cloud._post('/x', {}), /D1_DAILY_ROW_READ_LIMIT/);
  assert.equal(st.cloudBackoffReason, 'D1_DAILY_ROW_READ_LIMIT');
  assert.ok(st.cloudBackoffUntil > now);
  assert.equal(await cloud.cycle(), false);
  assert.equal(persistence.beforeTick(), false);
  assert.equal(cycleCalls, 0);
  assert.equal(persistenceTicks, 0);
  assert.equal(s.cloudCyclesSuppressed, 1);
  assert.equal(s.persistenceCyclesSuppressed, 1);
});

test('Alpha20.22 send_cm storage quota is backoff-only and never widens direct authority', async () => {
  let now = 1000, sends = 0;
  const s = stats(), st = state();
  const transport = {
    now: () => now,
    activeNames: () => [],
    async send() { sends += 1; throw new Error("Failed to execute 'setItem' on 'Storage': Setting the value of 'cm_My_Ranger2_x' exceeded the quota."); },
    status() { return { directRequiresObservedActive: true }; }
  };
  const runtime = { now: () => now, partyAccountCommunication: { transport } };
  installCmQuotaBackoff(runtime, s, st);
  const first = await transport.send('My_Ranger2', {}, {});
  const second = await transport.send('My_Ranger2', {}, {});
  assert.equal(first.delivered, false);
  assert.equal(second.delivered, false);
  assert.equal(second.reason, 'CM_STORAGE_QUOTA_BACKOFF');
  assert.equal(sends, 1);
  assert.equal(s.cmQuotaBackoffs, 1);
  assert.equal(s.cmQuotaSendsSuppressed, 1);
  const status = transport.status();
  assert.equal(status.directRequiresObservedActive, true);
  assert.equal(status.alpha20_22CmQuotaBackoff.directAuthorityWidened, false);
});

test('Alpha20.22 Worker keeps authenticated dashboard login usable when D1 daily row reads are exhausted', async () => {
  const mod = await import('../../cloudflare-dashboard/src/worker-alpha20-22.js');
  const quota = () => { const error = new Error("Your account has exceeded D1's free tier daily row read limit. [code: 7500]"); throw error; };
  const DB = { prepare() { return { bind() { return this; }, first: quota, all: quota, run: quota }; }, batch: quota };
  const env = { DB, READ_KEY: 'read-test', WRITE_KEY: 'write-test', ADMIN_KEY: 'admin-test' };
  const overview = await mod.default.fetch(new Request('https://dashboard.test/api/v3/overview', { headers: { 'x-aio-read-key': 'read-test' } }), env, {});
  assert.equal(overview.status, 200);
  const payload = await overview.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.database.available, false);
  assert.equal(payload.database.reason, 'D1_DAILY_ROW_READ_LIMIT');

  const runtime = await mod.default.fetch(new Request('https://dashboard.test/api/v3/runtime', { method: 'POST', headers: { origin: 'https://adventure.land', 'content-type': 'application/json' }, body: JSON.stringify({ writeKey: 'write-test', account: 'default', character: 'R1', status: { events: [] } }) }), env, {});
  assert.equal(runtime.status, 429);
  assert.equal(runtime.headers.get('access-control-allow-origin'), 'https://adventure.land');
  const runtimePayload = await runtime.json();
  assert.equal(runtimePayload.error, 'D1_DAILY_ROW_READ_LIMIT');
});
