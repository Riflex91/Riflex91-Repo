import test from 'node:test';
import assert from 'node:assert/strict';
import {
  archiveNdjson,
  archiveObjectKey,
  filterImportantEvents,
  isImportantEvent,
  redactDeep,
  sha256Hex
} from '../src/r2-log-policy.js';

test('R2 log policy keeps warnings, errors and safety semantics for D1', () => {
  const events = [
    { severity: 'info', component: 'farmer', event: 'TICK', reason: 'NORMAL' },
    { severity: 'warn', component: 'party', event: 'COHESION_HOLD', reason: 'DISTANCE' },
    { severity: 'info', component: 'content-drift', event: 'CONTENT_QUARANTINED', reason: 'UNKNOWN_CONTENT' },
    { severity: 'error', component: 'merchant', event: 'TRANSACTION_FAILED', reason: 'VERIFY_FAILED' }
  ];
  const filtered = filterImportantEvents(events);
  assert.equal(filtered.length, 3);
  assert.equal(isImportantEvent(events[0]), false);
  assert.equal(isImportantEvent(events[1]), true);
  assert.equal(isImportantEvent(events[2]), true);
  assert.equal(isImportantEvent(events[3]), true);
});

test('R2 archive redacts secret-shaped fields but preserves structured event data', () => {
  const clean = redactDeep({
    ok: true,
    token: 'secret-token',
    nested: { writeKey: 'secret-write-key', value: 42 }
  });
  assert.deepEqual(clean, {
    ok: true,
    token: '[REDACTED]',
    nested: { writeKey: '[REDACTED]', value: 42 }
  });
});

test('R2 archive key is account/character/time partitioned and stable for the same batch id', async () => {
  const receivedAt = Date.UTC(2026, 8, 14, 12, 34, 56);
  const events = [{ at: receivedAt, severity: 'info', component: 'farmer', event: 'TICK', data: { x: 1 } }];
  const batchId = (await sha256Hex(JSON.stringify(events))).slice(0, 24);
  const first = archiveObjectKey({ account: 'default', character: 'Ranger 1', receivedAt, events, batchId });
  const second = archiveObjectKey({ account: 'default', character: 'Ranger 1', receivedAt: receivedAt + 5000, events, batchId });
  assert.equal(first, second);
  assert.match(first, /^logs\/default\/Ranger_1\/2026\/09\/14\/12\//);
  assert.match(first, /\.ndjson$/);
});

test('R2 archive NDJSON contains one header and every event', () => {
  const receivedAt = Date.UTC(2026, 8, 14, 12, 34, 56);
  const events = [
    { at: receivedAt, severity: 'info', component: 'a', event: 'ONE', data: { n: 1 } },
    { at: receivedAt + 1, severity: 'info', component: 'b', event: 'TWO', data: { n: 2 } }
  ];
  const lines = archiveNdjson({ account: 'default', character: 'Mage', receivedAt, events }).trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].type, 'aio-v3-r2-log-batch');
  assert.equal(lines[0].eventCount, 2);
  assert.equal(lines[1].event, 'ONE');
  assert.equal(lines[2].event, 'TWO');
});

test('runtime archive writes all events to R2 while forwarded request keeps only important events', async () => {
  const { archiveRuntimeEvents, filteredRuntimeRequest } = await import('../src/worker-r2-logs.js');
  const puts = [];
  const env = {
    LOG_ARCHIVE: {
      async put(key, value, options) { puts.push({ key, value, options }); }
    }
  };
  const body = {
    account: 'default',
    character: 'Ranger1',
    status: {
      events: [
        { at: Date.UTC(2026, 8, 14, 12, 0, 0), severity: 'info', component: 'farmer', event: 'TICK', reason: 'NORMAL' },
        { at: Date.UTC(2026, 8, 14, 12, 0, 1), severity: 'warn', component: 'party', event: 'TEAM_HOLD', reason: 'TEAM_NOT_COHESIVE' }
      ]
    }
  };
  const archived = await archiveRuntimeEvents(body, env);
  assert.equal(archived.ok, true);
  assert.equal(archived.archived, true);
  assert.equal(puts.length, 1);
  assert.match(puts[0].key, /^logs\/default\/Ranger1\//);
  assert.equal(puts[0].value.trim().split('\n').length, 3);

  const original = new Request('https://example.test/api/v3/runtime', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-test': 'keep' },
    body: JSON.stringify(body)
  });
  const forwarded = filteredRuntimeRequest(original, body);
  const forwardedBody = await forwarded.json();
  assert.equal(forwardedBody.status.events.length, 1);
  assert.equal(forwardedBody.status.events[0].severity, 'warn');
  assert.equal(forwarded.headers.get('x-test'), 'keep');
});
