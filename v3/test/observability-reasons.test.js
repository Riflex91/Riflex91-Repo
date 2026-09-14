'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventLog, normalizeReason } = require('../src/core/event-log');
const { FlightRecorder } = require('../src/ops/flight-recorder');

test('normalizeReason keeps scalar reasons stable and preserves structured details', () => {
  assert.deepEqual(normalizeReason('NO_TARGET'), { reason: 'NO_TARGET', reasonDetails: null });
  assert.deepEqual(normalizeReason(404), { reason: '404', reasonDetails: null });

  const normalized = normalizeReason({ code: 'TARGET_BLOCKED', monster: 'goo', threshold: 0.4, api_token: 'secret' });
  assert.equal(normalized.reason, 'TARGET_BLOCKED');
  assert.deepEqual(normalized.reasonDetails, {
    code: 'TARGET_BLOCKED',
    monster: 'goo',
    threshold: 0.4,
    api_token: '[redacted]'
  });
});

test('normalizeReason never collapses arbitrary objects to [object Object]', () => {
  const normalized = normalizeReason({ observed: 'unexpected-shape', nested: { value: 1 } });
  assert.equal(normalized.reason, 'STRUCTURED_REASON');
  assert.notEqual(normalized.reason, '[object Object]');
  assert.deepEqual(normalized.reasonDetails, { observed: 'unexpected-shape', nested: { value: 1 } });
});

test('EventLog exposes a stable reason code plus structured reason details', () => {
  const log = new EventLog({ now: () => 1000, runId: 'reason-test' });
  const event = log.emit({
    component: 'combat',
    event: 'TARGET_REJECTED',
    reason: { reason: 'CONTENT_QUARANTINED', monster: 'mystery', evidence: { source: 'drift-guard' } }
  });

  assert.equal(event.reason, 'CONTENT_QUARANTINED');
  assert.deepEqual(event.reasonDetails, {
    reason: 'CONTENT_QUARANTINED',
    monster: 'mystery',
    evidence: { source: 'drift-guard' }
  });
  assert.equal(log.query({ reason: 'CONTENT_QUARANTINED' }).length, 1);
  assert.equal(log.summary().reasons.CONTENT_QUARANTINED, 1);
  assert.equal(Object.prototype.hasOwnProperty.call(log.summary().reasons, '[object Object]'), false);
});

test('FlightRecorder incidents preserve structured reasons without lossy string coercion', () => {
  const recorder = new FlightRecorder({ now: () => 1234 });
  const incident = recorder.markIncident({
    type: 'PARTY_DEGRADED',
    severity: 'warn',
    reason: { code: 'MEMBER_STALE', member: 'RangerA', ageMs: 9000 },
    data: { partySize: 3 }
  });

  assert.equal(incident.reason, 'MEMBER_STALE');
  assert.notEqual(incident.reason, '[object Object]');
  assert.deepEqual(incident.reasonDetails, { code: 'MEMBER_STALE', member: 'RangerA', ageMs: 9000 });
  assert.deepEqual(incident.data, { partySize: 3 });
  assert.equal(recorder.status().recentIncidents[0].reason, 'MEMBER_STALE');
});
