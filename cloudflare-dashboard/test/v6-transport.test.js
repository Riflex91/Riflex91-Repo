import test from 'node:test';
import assert from 'node:assert/strict';

import freeTierWorker from '../src/worker-free-tier.js';
import {
  GENERATION,
  PROTOCOL,
  RUNTIME_STATUS_VISIBLE_MS,
  ensureV6Schema,
  handleV6Request,
  legacyTransportBlocked
} from '../src/worker-v6-transport.js';

function fakeDb() {
  const calls = [];
  const db = {
    calls,
    prepare(sql) {
      const statement = {
        sql,
        args: [],
        bind(...args) { this.args = args; calls.push({ kind: 'bind', sql, args }); return this; },
        async all() { calls.push({ kind: 'all', sql, args: this.args }); return { results: [] }; },
        async first() { calls.push({ kind: 'first', sql, args: this.args }); return null; },
        async run() { calls.push({ kind: 'run', sql, args: this.args }); return { meta: { changes: 1 } }; }
      };
      return statement;
    },
    async batch(statements) {
      calls.push({ kind: 'batch', statements: statements.map(row => ({ sql: row.sql, args: row.args })) });
      return statements.map(() => ({ meta: { changes: 1 } }));
    }
  };
  return db;
}

function v6Request(overrides = {}) {
  const body = {
    schemaVersion: 1,
    type: 'ALBOT_V6_RUNTIME_PUSH',
    generation: GENERATION,
    bridgeProtocol: PROTOCOL,
    botId: 'albot-v6-main',
    account: 'default',
    character: 'FarmerA',
    status: {
      schemaVersion: 1,
      type: 'ALBOT_V6_DEBUG_SNAPSHOT',
      identity: {
        product: 'AL Bot',
        generation: GENERATION,
        bridgeProtocol: PROTOCOL,
        runtimeVersion: '0.22.7-h22',
        transportOnly: true,
        gameplayActionAuthority: false,
        acceptsLegacyGenerations: false
      },
      character: { name: 'FarmerA', ctype: 'ranger' },
      status: { product: 'AL Bot', version: '0.22.7-h22', running: true }
    },
    events: [{ seq: 1, severity: 'info', component: 'runtime', event: 'log', reason: 'boot' }],
    ...overrides.body
  };
  const headers = {
    'content-type': 'application/json',
    'x-albot-write-key': 'v6-secret',
    'x-albot-bot-id': 'albot-v6-main',
    'x-albot-generation': '6',
    'x-albot-bridge-protocol': PROTOCOL,
    ...overrides.headers
  };
  return new Request('https://dashboard.test/api/v6/runtime', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
}

test('legacy bot transport routes are retired while historical/admin reads stay available', () => {
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/runtime', { method: 'POST' })), true);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/sync', { method: 'GET' })), true);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/persistence/load', { method: 'POST' })), true);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/brain/teacher', { method: 'POST' })), true);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/overview')), false);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/events')), false);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/settings')), false);
  assert.equal(legacyTransportBlocked(new Request('https://x/api/v3/settings', { method: 'PATCH' })), false);
});

test('free-tier entrypoint blocks legacy runtime writes before the old worker', async () => {
  const response = await freeTierWorker.fetch(
    new Request('https://dashboard.test/api/v3/runtime', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    }),
    {},
    { waitUntil() {} }
  );
  assert.equal(response.status, 410);
  const payload = await response.json();
  assert.equal(payload.requiredGeneration, 6);
  assert.equal(payload.requiredProtocol, PROTOCOL);
  assert.equal(payload.historicalReadOnly, true);
});

test('V6 overview only exposes recent runtime rows', async () => {
  const DB = fakeDb();
  const response = await handleV6Request(
    new Request('https://dashboard.test/api/v6/overview?account=default', {
      headers: { 'x-aio-read-key': 'read-secret' }
    }),
    { DB, READ_KEY: 'read-secret' }
  );
  assert.equal(response.status, 200);
  const runtimeRead = DB.calls.find(row =>
    row.kind === 'all'
    && /FROM v6_runtime_status/.test(String(row.sql || '')));
  assert.ok(runtimeRead);
  assert.match(runtimeRead.sql, /received_at>=\?/);
  assert.equal(runtimeRead.args.length, 2);
  const cutoffAge = Date.now() - Number(runtimeRead.args[1]);
  assert.ok(cutoffAge >= RUNTIME_STATUS_VISIBLE_MS - 5000);
  assert.ok(cutoffAge <= RUNTIME_STATUS_VISIBLE_MS + 5000);
  assert.equal(RUNTIME_STATUS_VISIBLE_MS, 5 * 60 * 1000);
});

test('V6 transport bootstraps its D1 tables through the Worker binding', async () => {
  const DB = fakeDb();
  await ensureV6Schema({ DB });

  const createRuns = DB.calls.filter(row => row.kind === 'run' && /^CREATE (TABLE|INDEX) IF NOT EXISTS/i.test(String(row.sql || '').trim()));
  assert.equal(createRuns.length, 5);
  assert.ok(createRuns.some(row => /CREATE TABLE IF NOT EXISTS v6_runtime_status/.test(row.sql)));
  assert.ok(createRuns.some(row => /CREATE TABLE IF NOT EXISTS v6_runtime_events/.test(row.sql)));

  const countAfterFirst = DB.calls.length;
  await ensureV6Schema({ DB });
  assert.equal(DB.calls.length, countAfterFirst);
});

test('V6 runtime endpoint requires the generation-locked bridge identity and dedicated secret', async () => {
  const DB = fakeDb();
  const env = { DB, ALBOT_V6_WRITE_KEY: 'v6-secret' };

  const accepted = await handleV6Request(v6Request(), env);
  assert.equal(accepted.status, 200);
  const payload = await accepted.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.generation, 6);
  assert.equal(payload.protocol, PROTOCOL);
  assert.equal(payload.character, 'FarmerA');
  assert.ok(DB.calls.some(row => row.kind === 'batch'));
  assert.ok(DB.calls.some(row => String(row.sql || '').includes('v6_runtime_status')));
  const retention = DB.calls.find(row => row.kind === 'run' && String(row.sql || '').includes('DELETE FROM v6_runtime_events'));
  assert.ok(retention);
  assert.match(retention.sql, /WHERE event_at<\?/);
  assert.equal(retention.args.length, 1);

  const wrongGeneration = await handleV6Request(v6Request({
    headers: { 'x-albot-generation': '5' }
  }), { DB: fakeDb(), ALBOT_V6_WRITE_KEY: 'v6-secret' });
  assert.equal(wrongGeneration.status, 403);

  const wrongSecret = await handleV6Request(v6Request({
    headers: { 'x-albot-write-key': 'legacy-secret' }
  }), { DB: fakeDb(), ALBOT_V6_WRITE_KEY: 'v6-secret' });
  assert.equal(wrongSecret.status, 401);
});

test('V6 runtime transport preserves the bounded V3 terrain tile table', async () => {
  const DB = fakeDb();
  const request = v6Request();
  const body = await request.clone().json();
  body.account = 'terrain-array-test';
  body.character = 'TerrainFarmer';
  body.status.character = { name: 'TerrainFarmer', ctype: 'ranger', map: 'main' };
  body.status.terrain = {
    map: 'main',
    encoding: 'base36-all-v2',
    t: Array.from({ length: 500 }, (_, index) => ['pack_20', index, 0, 32, 32]),
    pc: '0,0,0',
    gc: [],
    ac: '',
    s: { pack_20: '/images/pack_20.png' }
  };

  const accepted = await handleV6Request(new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body)
  }), { DB, ALBOT_V6_WRITE_KEY: 'v6-secret' });

  assert.equal(accepted.status, 200);
  const runtimeBatch = DB.calls.find(row =>
    row.kind === 'batch'
    && row.statements.some(statement => /INSERT INTO v6_runtime_status/.test(statement.sql)));
  assert.ok(runtimeBatch);
  const runtimeStatement = runtimeBatch.statements.find(statement => /INSERT INTO v6_runtime_status/.test(statement.sql));
  assert.ok(runtimeStatement);
  const stored = JSON.parse(runtimeStatement.args[4]);
  assert.equal(stored.terrain.t.length, 500);
  assert.equal(stored.terrain.encoding, 'base36-all-v2');
});

test('V6 runtime endpoint rejects a payload whose snapshot claims legacy compatibility', async () => {
  const request = v6Request();
  const body = await request.clone().json();
  body.status.identity.acceptsLegacyGenerations = true;
  const rejected = await handleV6Request(new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body)
  }), { DB: fakeDb(), ALBOT_V6_WRITE_KEY: 'v6-secret' });

  assert.equal(rejected.status, 400);
  const payload = await rejected.json();
  assert.match(payload.error, /V6 transport snapshot/);
});

test('throttled V6 runtime writes still persist event batches before returning 202', async () => {
  const DB = fakeDb();
  const env = { DB, ALBOT_V6_WRITE_KEY: 'v6-secret' };
  const body = {
    account: 'throttle-test',
    character: 'ThrottleFarmer',
    events: [{ seq: 901, severity: 'warn', component: 'runtime', event: 'tick', reason: 'persist-me' }]
  };

  const first = await handleV6Request(v6Request({ body }), env);
  assert.equal(first.status, 200);

  DB.calls.length = 0;
  const second = await handleV6Request(v6Request({ body }), env);
  assert.equal(second.status, 202);
  const payload = await second.json();
  assert.equal(payload.throttled, true);
  assert.equal(payload.eventCount, 1);
  assert.equal(payload.eventsPersisted, 1);

  const batch = DB.calls.find(row => row.kind === 'batch');
  assert.ok(batch);
  assert.equal(batch.statements.length, 1);
  assert.match(batch.statements[0].sql, /INSERT OR IGNORE INTO v6_runtime_events/);
  assert.doesNotMatch(batch.statements[0].sql, /v6_runtime_status/);
});
