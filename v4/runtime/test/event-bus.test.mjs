import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../../build/kernel/event-bus.js';

function event(sequence, type = 'TEST') {
  return { id: `e-${sequence}`, sequence, timestamp: sequence, type, source: 'test', traceId: 'trace-1', payload: {} };
}

test('EventBus delivers in registration order and isolates subscriber failures', () => {
  const bus = new EventBus();
  const seen = [];
  bus.subscribe('TEST', () => { seen.push('first'); throw new Error('boom'); });
  bus.subscribe('TEST', () => seen.push('second'));
  bus.subscribe('*', () => seen.push('wildcard'));

  const report = bus.publish(event(1));
  assert.deepEqual(seen, ['first', 'second', 'wildcard']);
  assert.equal(report.delivered, 3);
  assert.equal(report.errors.length, 1);
});

test('EventBus rejects non-monotonic event sequences', () => {
  const bus = new EventBus();
  bus.publish(event(2));
  assert.throws(() => bus.publish(event(2)), /increase monotonically/);
  assert.throws(() => bus.publish(event(1)), /increase monotonically/);
});
