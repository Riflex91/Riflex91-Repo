'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DebugTelemetryExporter,
  DEFAULT_MIN_INTERVAL_MS,
  FAST_LANE_COOLDOWN_MS,
  FAST_LANE_DEDUPE_MS
} = require('../host/debug-telemetry-exporter');

function snapshot() {
  return { type: 'AIO_V3_DEBUG_SNAPSHOT', status: { health: { state: 'HEALTHY' } } };
}

function makeHarness() {
  let now = 100000;
  let rows = [{ seq: 1, event: 'HEARTBEAT', severity: 'info' }];
  let failPosts = false;
  const posts = [];
  const client = {
    debugSnapshot: async () => snapshot(),
    debugEvents: async (afterSeq, limit) => ({ events: rows.filter((row) => row.seq > afterSeq).slice(0, limit) })
  };
  const exporter = new DebugTelemetryExporter({
    now: () => now,
    endpoint: 'https://example.supabase.co/functions/v1/bot-debug-ingest',
    token: 'host-secret',
    botId: 'pi-main',
    fetch: async (_url, request) => {
      posts.push(JSON.parse(request.body));
      return failPosts ? { ok: false, status: 503 } : { ok: true, status: 200 };
    }
  });
  return {
    exporter,
    client,
    posts,
    get now() { return now; },
    set now(value) { now = value; },
    setRows(next) { rows = next; },
    failPosts(value) { failPosts = value; }
  };
}

test('critical self-healing signal bypasses the 120-second periodic telemetry interval after fast-lane cooldown', async () => {
  const h = makeHarness();
  const regular = await h.exporter.tick(h.client, { processRunning: true });
  assert.equal(regular.sent, true);
  assert.equal(h.exporter.status().minIntervalMs, DEFAULT_MIN_INTERVAL_MS);
  assert.equal(h.posts.length, 1);

  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'WATCHDOG_RESTART_REQUIRED', severity: 'error', reason: 'NO_PROGRESS', component: 'host-watchdog' }
  ]);
  h.now += FAST_LANE_COOLDOWN_MS;
  const urgent = await h.exporter.tick(h.client, { processRunning: true });

  assert.equal(urgent.sent, true);
  assert.equal(urgent.fastLane, true);
  assert.equal(urgent.fastLaneReason, 'CRITICAL_SIGNAL');
  assert.equal(h.posts.length, 2);
  assert.equal(h.exporter.status().lastEventSeq, 2);
  assert.equal(h.exporter.status().stats.fastLaneSuccesses, 1);
});

test('non-critical telemetry stays on the regular quota-safe cadence', async () => {
  const h = makeHarness();
  await h.exporter.tick(h.client);
  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'ROUTE_UPDATED', severity: 'info' }
  ]);
  h.now += FAST_LANE_COOLDOWN_MS;

  const result = await h.exporter.tick(h.client);
  assert.equal(result.sent, false);
  assert.equal(result.reason, 'DEBUG_TELEMETRY_BACKOFF');
  assert.equal(result.fastLaneReason, 'NO_CRITICAL_SIGNAL');
  assert.equal(h.posts.length, 1);
  assert.equal(h.exporter.status().lastEventSeq, 1);
});

test('fast lane deduplicates repeated critical fingerprints for ten minutes without consuming unsent events', async () => {
  const h = makeHarness();
  await h.exporter.tick(h.client);
  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'CLOUD_CONTROL_CYCLE_FAILED', severity: 'warning', reason: 'DISCONNECTED', component: 'cloud-control' }
  ]);
  h.now += FAST_LANE_COOLDOWN_MS;
  const firstCritical = await h.exporter.tick(h.client);
  assert.equal(firstCritical.fastLane, true);
  assert.equal(h.posts.length, 2);

  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'CLOUD_CONTROL_CYCLE_FAILED', severity: 'warning', reason: 'DISCONNECTED', component: 'cloud-control' },
    { seq: 3, event: 'CLOUD_CONTROL_CYCLE_FAILED', severity: 'warning', reason: 'DISCONNECTED', component: 'cloud-control' }
  ]);
  h.now += FAST_LANE_COOLDOWN_MS;
  const duplicate = await h.exporter.tick(h.client);

  assert.equal(duplicate.sent, false);
  assert.equal(duplicate.fastLaneReason, 'FAST_LANE_DEDUPED');
  assert.equal(h.posts.length, 2);
  assert.equal(h.exporter.status().lastEventSeq, 2);
  assert.equal(h.exporter.status().fastLane.dedupeMs, FAST_LANE_DEDUPE_MS);
  assert.equal(h.exporter.status().stats.fastLaneDedupeBlocks, 1);
});

test('global fast-lane cooldown suppresses bursts but permits a distinct critical signal after 30 seconds', async () => {
  const h = makeHarness();
  await h.exporter.tick(h.client);
  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'WATCHDOG_RESTART_REQUIRED', severity: 'error', reason: 'NO_PROGRESS', component: 'watchdog' }
  ]);
  h.now += FAST_LANE_COOLDOWN_MS;
  await h.exporter.tick(h.client);

  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'WATCHDOG_RESTART_REQUIRED', severity: 'error', reason: 'NO_PROGRESS', component: 'watchdog' },
    { seq: 3, event: 'RUNTIME_DISCONNECTED', severity: 'critical', reason: 'DISCONNECTED', component: 'runtime' }
  ]);
  h.now += 10000;
  const blocked = await h.exporter.tick(h.client);
  assert.equal(blocked.sent, false);
  assert.equal(blocked.fastLaneReason, 'FAST_LANE_COOLDOWN');
  assert.equal(h.posts.length, 2);

  h.now += FAST_LANE_COOLDOWN_MS - 10000;
  const allowed = await h.exporter.tick(h.client);
  assert.equal(allowed.sent, true);
  assert.equal(allowed.fastLane, true);
  assert.equal(h.posts.length, 3);
  assert.equal(h.exporter.status().lastEventSeq, 3);
});

test('failed fast-lane upload preserves the cursor and can retry after cooldown', async () => {
  const h = makeHarness();
  await h.exporter.tick(h.client);
  h.setRows([
    { seq: 1, event: 'HEARTBEAT', severity: 'info' },
    { seq: 2, event: 'RECOVERY_FAILED', severity: 'error', reason: 'SAFE_MODE', component: 'recovery' }
  ]);
  h.now += FAST_LANE_COOLDOWN_MS;
  h.failPosts(true);
  const failed = await h.exporter.tick(h.client);
  assert.equal(failed.sent, false);
  assert.equal(failed.fastLane, true);
  assert.equal(h.exporter.status().lastEventSeq, 1);
  assert.equal(h.exporter.status().stats.fastLaneFailures, 1);

  h.now += FAST_LANE_COOLDOWN_MS;
  h.failPosts(false);
  const retried = await h.exporter.tick(h.client);
  assert.equal(retried.sent, true);
  assert.equal(retried.fastLane, true);
  assert.equal(h.exporter.status().lastEventSeq, 2);
});

test('fast-lane request ceiling remains inside the four-exporter monthly budget', () => {
  const h = makeHarness();
  const policy = h.exporter.status().quotaPolicy;
  assert.equal(policy.projectedFastLaneCeilingFourExporters, 357120);
  assert.equal(policy.fastLaneCeilingWithinBudgetAtFourExporters, true);
});