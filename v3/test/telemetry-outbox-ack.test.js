'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TelemetryOutbox } = require('../src/ops/telemetry-outbox');

function logFrom(rows) {
  return {
    query({ sinceSeq, limit }) {
      return rows.filter((row) => Number(row.seq) > Number(sinceSeq || 0)).slice(0, limit);
    }
  };
}

test('ackThrough removes only telemetry at or below the accepted sequence', () => {
  const outbox = new TelemetryOutbox({ capacity: 100 });
  outbox.capture(logFrom(Array.from({ length: 5 }, (_, index) => ({ seq: index + 1, event: `E${index + 1}` }))));

  assert.deepEqual(outbox.peek(5).map((row) => row.seq), [1, 2, 3, 4, 5]);
  const result = outbox.ackThrough(3);

  assert.equal(result.acknowledged, 3);
  assert.equal(result.lastAcknowledgedSeq, 3);
  assert.equal(result.remaining, 2);
  assert.deepEqual(outbox.peek(5).map((row) => row.seq), [4, 5]);

  const status = outbox.status();
  assert.equal(status.queued, 2);
  assert.equal(status.acknowledged, 3);
  assert.equal(status.oldestQueuedSeq, 4);
  assert.equal(status.newestQueuedSeq, 5);
});

test('ackThrough is idempotent for an already acknowledged sequence', () => {
  const outbox = new TelemetryOutbox({ capacity: 100 });
  outbox.capture(logFrom([{ seq: 10 }, { seq: 11 }, { seq: 12 }]));
  assert.equal(outbox.ackThrough(11).acknowledged, 2);
  assert.equal(outbox.ackThrough(11).acknowledged, 0);
  assert.deepEqual(outbox.peek(10).map((row) => row.seq), [12]);
});

test('ackThrough never removes newer unsent telemetry after overflow', () => {
  const rows = Array.from({ length: 150 }, (_, index) => ({ seq: index + 1 }));
  const outbox = new TelemetryOutbox({ capacity: 100 });
  outbox.capture(logFrom(rows));

  assert.equal(outbox.status().dropped, 50);
  assert.equal(outbox.status().oldestQueuedSeq, 51);
  const result = outbox.ackThrough(80);
  assert.equal(result.acknowledged, 30);
  assert.equal(outbox.status().oldestQueuedSeq, 81);
  assert.equal(outbox.status().newestQueuedSeq, 150);
});

test('ackThrough rejects invalid cursors', () => {
  const outbox = new TelemetryOutbox({ capacity: 100 });
  assert.throws(() => outbox.ackThrough(-1), /TELEMETRY_ACK_SEQ_INVALID/);
  assert.throws(() => outbox.ackThrough(Number.NaN), /TELEMETRY_ACK_SEQ_INVALID/);
});
