'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventLog } = require('../src/core/event-log');

test('EventLog redacts secrets and keeps a bounded ring buffer', () => {
  let now = 1000;
  const log = new EventLog({ capacity: 100, now: () => ++now, runId: 'test-run' });
  for (let i = 0; i < 105; i++) log.emit({ event: 'X', data: { i, writeKey: 'never-store-me', nested: { api_token: 'secret' } } });
  assert.equal(log.events.length, 100);
  assert.equal(log.events[0].data.i, 5);
  assert.equal(log.events[99].data.writeKey, '[redacted]');
  assert.equal(log.events[99].data.nested.api_token, '[redacted]');
  const bundle = JSON.parse(log.exportBundle({ authorization: 'hidden' }));
  assert.equal(bundle.context.authorization, '[redacted]');
});

test('EventLog supports structured filtering without changing the legacy numeric API', () => {
  const log = new EventLog({ now: () => 1000, runId: 'query-test' });
  log.emit({ component: 'performance', event: 'WINDOW', severity: 'info' });
  log.emit({ component: 'persistence', event: 'SAVE', severity: 'warn', reason: 'TEST' });
  assert.equal(log.query({ component: 'performance', limit: 10 }).length, 1);
  assert.equal(log.query({ severity: 'warn', reason: 'TEST', limit: 10 })[0].event, 'SAVE');
  assert.equal(log.query(1).length, 1);
});
