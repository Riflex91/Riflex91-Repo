'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BrowserBotClient, browserDispatcher } = require('../host/browser-bot-client');
const { DebugTelemetryExporter } = require('../host/debug-telemetry-exporter');
const { ProductionHostHarness } = require('../host/production-host-harness');

function pageWithOperations(operations) {
  return {
    calls: [],
    url: () => 'https://adventure.land/game',
    isClosed: () => false,
    async evaluate(fn, payload) {
      this.calls.push(JSON.parse(JSON.stringify(payload)));
      const previous = globalThis.AIO_V3;
      globalThis.AIO_V3 = { operations };
      try { return await fn(payload); }
      finally {
        if (previous === undefined) delete globalThis.AIO_V3;
        else globalThis.AIO_V3 = previous;
      }
    }
  };
}

function memoryAlertStore() {
  return {
    load: () => ({ schemaVersion: 1, records: [] }),
    save: () => true,
    status: () => ({ mode: 'memory-test-store' })
  };
}

test('narrow browser bridge exposes bounded read-only debug snapshot and cursor-based events', async () => {
  const rows = Array.from({ length: 8 }, (_, index) => ({ seq: index + 1, event: `E${index + 1}`, data: { ok: true } }));
  const operations = {
    status: () => ({ health: { state: 'HEALTHY' }, control: { actionAuthority: false } }),
    hostHeartbeat: () => ({ type: 'heartbeat', character: { name: 'MerchantA', map: 'main' } }),
    reconciliationStatus: () => ({ observedClean: true, actionAuthority: false }),
    peekTelemetry: () => rows
  };
  const page = pageWithOperations(operations);
  const client = new BrowserBotClient({ page });

  const snapshot = await client.debugSnapshot();
  assert.equal(snapshot.type, 'AIO_V3_DEBUG_SNAPSHOT');
  assert.equal(snapshot.status.health.state, 'HEALTHY');
  assert.equal(snapshot.heartbeat.character.name, 'MerchantA');
  assert.equal(snapshot.reconciliation.actionAuthority, false);

  const events = await client.debugEvents(4, 2);
  assert.deepEqual(events.events.map((row) => row.seq), [5, 6]);
  assert.deepEqual(page.calls.map((row) => row.operation), ['DEBUG_SNAPSHOT', 'DEBUG_EVENTS']);
  assert.deepEqual(client.status().readOnlyDebugOperations, ['DEBUG_SNAPSHOT', 'DEBUG_EVENTS']);
  assert.equal(client.status().allAllowedOperations.length, 6);
  assert.equal(client.status().arbitraryEvaluateExposed, false);
  assert.equal(client.status().genericInvokeExposed, false);
  assert.equal(client.status().gameplayActionAuthority, false);
});

test('serialized browser dispatcher has no Node closure dependency for debug events', () => {
  const serialized = browserDispatcher.toString();
  assert.equal(serialized.includes('MAX_DEBUG_EVENTS'), false);
  const detachedDispatcher = Function(`return (${serialized});`)();
  const previous = globalThis.AIO_V3;
  globalThis.AIO_V3 = { operations: { peekTelemetry: () => [{ seq: 1 }, { seq: 2 }] } };
  try {
    const result = detachedDispatcher({ operation: 'DEBUG_EVENTS', afterSeq: 0, limit: 1 });
    assert.deepEqual(result.events, [{ seq: 1 }]);
  } finally {
    if (previous === undefined) delete globalThis.AIO_V3;
    else globalThis.AIO_V3 = previous;
  }
});

test('debug telemetry exporter advances event cursor only after successful authenticated HTTPS upload', async () => {
  let now = 10000;
  const posts = [];
  const botClient = {
    debugSnapshot: async () => ({ type: 'AIO_V3_DEBUG_SNAPSHOT', status: { health: { state: 'HEALTHY' } } }),
    debugEvents: async (afterSeq, limit) => ({ events: [{ seq: afterSeq + 1, event: 'A' }, { seq: afterSeq + 2, event: 'B' }].slice(0, limit) })
  };
  const exporter = new DebugTelemetryExporter({
    now: () => now,
    endpoint: 'https://example.supabase.co/functions/v1/bot-debug-ingest',
    token: 'host-only-secret',
    botId: 'pi-main',
    minIntervalMs: 1000,
    fetch: async (url, request) => {
      posts.push({ url, request: { ...request, signal: undefined } });
      return { ok: true, status: 200 };
    }
  });

  const first = await exporter.tick(botClient, { processRunning: true, restartCount: 3 });
  assert.equal(first.sent, true);
  assert.equal(first.maxSeq, 2);
  assert.equal(exporter.status().lastEventSeq, 2);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].request.headers.authorization, 'Bearer host-only-secret');
  const body = JSON.parse(posts[0].request.body);
  assert.equal(body.botId, 'pi-main');
  assert.equal(body.host.processRunning, true);
  assert.equal(body.host.restartCount, 3);
  assert.deepEqual(body.events.map((row) => row.seq), [1, 2]);
  assert.equal(JSON.stringify(exporter.status()).includes('host-only-secret'), false);

  now += 1000;
  await exporter.tick(botClient);
  assert.equal(exporter.status().lastEventSeq, 4);
});

test('failed telemetry upload keeps cursor, backs off, and never throws into bot host control flow', async () => {
  let now = 20000;
  const exporter = new DebugTelemetryExporter({
    now: () => now,
    endpoint: 'https://example.supabase.co/functions/v1/bot-debug-ingest',
    token: 'secret',
    minIntervalMs: 1000,
    maxBackoffMs: 8000,
    fetch: async () => ({ ok: false, status: 503 })
  });
  const client = {
    debugSnapshot: async () => ({ ok: true }),
    debugEvents: async () => ({ events: [{ seq: 1, event: 'X' }] })
  };

  const failed = await exporter.tick(client);
  assert.equal(failed.sent, false);
  assert.equal(failed.reason, 'DEBUG_TELEMETRY_FAILED');
  assert.equal(exporter.status().lastEventSeq, 0);
  assert.equal(exporter.status().failuresInRow, 1);

  now += 500;
  const backedOff = await exporter.tick(client);
  assert.equal(backedOff.reason, 'DEBUG_TELEMETRY_BACKOFF');
  assert.equal(exporter.status().lastEventSeq, 0);
});

test('production host telemetry is optional and isolated from controller tick result', async () => {
  let telemetryCalls = 0;
  const launcher = {
    status: () => ({ running: true, stats: { restarts: 2 } }),
    start: async () => ({ started: true }),
    stop: async () => ({ stopped: true }),
    restart: async () => ({ restarted: true })
  };
  const controller = {
    tick: async () => ({ watchdog: { state: 'HEALTHY' } }),
    status: () => ({ state: 'HEALTHY' }),
    configureRestart: () => ({})
  };
  const api = {
    start: async () => ({ started: true }),
    stop: async () => ({ stopped: true }),
    status: () => ({ running: false })
  };
  const telemetryExporter = {
    tick: async (_client, host) => { telemetryCalls += 1; assert.equal(host.processRunning, true); throw new Error('network-down'); },
    status: () => ({ enabled: true, actionAuthority: false, secretsExposedToBrowser: false })
  };
  const harness = new ProductionHostHarness({
    launcher,
    controller,
    api,
    botClient: { status: () => ({ mode: 'narrow-browser-bot-client' }) },
    alertStore: memoryAlertStore(),
    telemetryExporter
  });

  const result = await harness.tick();
  assert.equal(result.watchdog.state, 'HEALTHY');
  assert.equal(telemetryCalls, 1);
  assert.equal(harness.status().lastTickError, null);
  assert.equal(harness.status().lastTelemetryResult.reason, 'DEBUG_TELEMETRY_ISOLATED_FAILURE');
  assert.equal(harness.status().gameplayActionAuthority, false);
  assert.equal(harness.status().debugTelemetry.actionAuthority, false);
});

test('debug telemetry requires HTTPS and never exposes a browser-side inbound command channel', () => {
  assert.throws(() => new DebugTelemetryExporter({ endpoint: 'http://example.com/ingest', token: 'x' }), /DEBUG_TELEMETRY_HTTPS_REQUIRED/);
  const disabled = new DebugTelemetryExporter({ endpoint: 'https://example.com/ingest' });
  const status = disabled.status();
  assert.equal(status.enabled, false);
  assert.equal(status.inboundCommandChannel, false);
  assert.equal(status.secretsExposedToBrowser, false);
  assert.equal(status.rawGameplayActionAuthority, false);
});
