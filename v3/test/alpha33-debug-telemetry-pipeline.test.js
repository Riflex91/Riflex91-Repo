'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BrowserBotClient, browserDispatcher } = require('../host/browser-bot-client');
const { ProductionHostHarness } = require('../host/production-host-harness');
const {
  SupabaseDebugTelemetrySink,
  sanitizeDebugPayload,
  REDACTED
} = require('../host/supabase-debug-telemetry');

function fakePage(aio) {
  const calls = [];
  return {
    calls,
    url: () => 'https://adventure.land/game',
    isClosed: () => false,
    async evaluate(fn, payload) {
      calls.push(JSON.parse(JSON.stringify(payload)));
      const previous = globalThis.AIO_V3;
      globalThis.AIO_V3 = aio;
      try { return await fn(payload); }
      finally {
        if (previous === undefined) delete globalThis.AIO_V3;
        else globalThis.AIO_V3 = previous;
      }
    }
  };
}

function passiveStatus(mode) {
  return { mode, gameplayActionAuthority: false, rawGameplayActionAuthority: false };
}

test('debug telemetry sanitizer preserves diagnostics while recursively redacting credentials and bounding cycles', () => {
  const cycle = { state: 'HEALTHY' };
  cycle.self = cycle;
  const sanitized = sanitizeDebugPayload({
    runId: 'run-1',
    health: cycle,
    nested: {
      api_token: 'token-secret',
      authorization: 'Bearer secret',
      serviceRoleKey: 'service-secret',
      cookie: 'session-secret',
      target: 'goo'
    }
  });
  assert.equal(sanitized.runId, 'run-1');
  assert.equal(sanitized.health.state, 'HEALTHY');
  assert.equal(sanitized.health.self, '[CIRCULAR]');
  assert.equal(sanitized.nested.api_token, REDACTED);
  assert.equal(sanitized.nested.authorization, REDACTED);
  assert.equal(sanitized.nested.serviceRoleKey, REDACTED);
  assert.equal(sanitized.nested.cookie, REDACTED);
  assert.equal(sanitized.nested.target, 'goo');
  const text = JSON.stringify(sanitized);
  assert.equal(text.includes('token-secret'), false);
  assert.equal(text.includes('service-secret'), false);
  assert.equal(text.includes('session-secret'), false);
});

test('Supabase debug sink posts sanitized read-only snapshots without exposing credentials in status', async () => {
  const calls = [];
  const sink = new SupabaseDebugTelemetrySink({
    url: 'https://project.supabase.co',
    key: 'host-only-service-key',
    table: 'aio_v3_debug_telemetry',
    now: () => 1_700_000_000_000,
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 201 };
    }
  });
  const result = await sink.publish({
    runId: 'run-debug',
    mode: 'observational-read-only',
    actionAuthority: false,
    bot: { farmer: { state: 'FARMING', target: 'goo' }, apiKey: 'must-not-leak' }
  });
  assert.equal(result.published, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://project.supabase.co/rest/v1/aio_v3_debug_telemetry');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.apikey, 'host-only-service-key');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.run_id, 'run-debug');
  assert.equal(body.payload.bot.farmer.target, 'goo');
  assert.equal(body.payload.bot.apiKey, REDACTED);
  assert.equal(calls[0].options.body.includes('must-not-leak'), false);
  const status = sink.status();
  assert.equal(status.credentialsExternal, true);
  assert.equal(status.credentialsExposed, false);
  assert.equal(status.urlExposed, false);
  assert.equal(status.actionAuthority, false);
  assert.equal(JSON.stringify(status).includes('host-only-service-key'), false);
  assert.equal(JSON.stringify(status).includes('project.supabase.co'), false);
});

test('unconfigured debug sink is inert and performs no network request', async () => {
  let calls = 0;
  const sink = new SupabaseDebugTelemetrySink({ fetch: async () => { calls += 1; } });
  const result = await sink.publish({ state: 'HEALTHY' });
  assert.equal(result.published, false);
  assert.equal(result.reason, 'DEBUG_TELEMETRY_NOT_CONFIGURED');
  assert.equal(calls, 0);
});

test('narrow browser bridge adds only the fixed read-only DEBUG_DIAGNOSTICS operation', async () => {
  const page = fakePage({
    operations: {},
    exportDiagnostics: () => JSON.stringify({ context: { runId: 'bridge-run' }, farmer: { state: 'FARMING' } })
  });
  const client = new BrowserBotClient({ page });
  const diagnostics = await client.debugDiagnostics();
  assert.equal(diagnostics.context.runId, 'bridge-run');
  assert.equal(diagnostics.farmer.state, 'FARMING');
  assert.deepEqual(page.calls.map((row) => row.operation), ['DEBUG_DIAGNOSTICS']);
  const status = client.status();
  assert.equal(status.allowedOperations.includes('DEBUG_DIAGNOSTICS'), true);
  assert.equal(status.arbitraryEvaluateExposed, false);
  assert.equal(status.genericInvokeExposed, false);
  assert.equal(client.evaluate, undefined);
  assert.equal(client.invoke, undefined);

  const previous = globalThis.AIO_V3;
  try {
    globalThis.AIO_V3 = { operations: {}, exportDiagnostics: () => '{broken' };
    assert.throws(() => browserDispatcher({ operation: 'DEBUG_DIAGNOSTICS' }), /DEBUG_DIAGNOSTICS_INVALID_JSON/);
    assert.throws(() => browserDispatcher({ operation: 'ATTACK' }), /HOST_OPERATION_NOT_ALLOWED/);
  } finally {
    if (previous === undefined) delete globalThis.AIO_V3;
    else globalThis.AIO_V3 = previous;
  }
});

test('ProductionHostHarness publishes diagnostics fail-open without changing controller tick result', async () => {
  const clock = { value: 1000 };
  const controllerResult = { status: { watchdog: { state: 'HEALTHY' } }, marker: 'controller-result' };
  let diagnosticsCalls = 0;
  let publishCalls = 0;
  const telemetrySink = {
    enabled: () => true,
    status: () => ({ mode: 'test-sink', configured: true, actionAuthority: false }),
    async publish(payload) {
      publishCalls += 1;
      assert.equal(payload.mode, 'observational-read-only');
      assert.equal(payload.actionAuthority, false);
      assert.equal(payload.gameplayActionAuthority, false);
      assert.equal(payload.bot.context.runId, 'run-host');
      throw new Error('simulated telemetry outage');
    }
  };
  const harness = new ProductionHostHarness({
    now: () => clock.value,
    telemetrySink,
    telemetryIntervalMs: 5000,
    botClient: {
      async debugDiagnostics() { diagnosticsCalls += 1; return { context: { runId: 'run-host' }, farmer: { state: 'FARMING' } }; },
      status: () => passiveStatus('test-bot-client')
    },
    launcher: { status: () => passiveStatus('test-launcher') },
    controller: {
      async tick() { return controllerResult; },
      status: () => passiveStatus('test-controller'),
      configureRestart: () => ({})
    },
    api: {
      status: () => ({ mode: 'test-api', actionAuthority: false }),
      start: async () => ({ started: true }),
      stop: async () => ({ stopped: true })
    }
  });

  const result = await harness.tick();
  assert.strictEqual(result, controllerResult);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(diagnosticsCalls, 1);
  assert.equal(publishCalls, 1);
  const status = harness.status();
  assert.equal(status.stats.tickFailures, 0);
  assert.equal(status.stats.telemetryFailures, 1);
  assert.equal(status.debugTelemetry.actionAuthority, false);
  assert.equal(status.gameplayActionAuthority, false);

  clock.value = 2000;
  const second = await harness.tick();
  assert.strictEqual(second, controllerResult);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(diagnosticsCalls, 1, 'telemetry interval must bound diagnostic polling');
});
