import assert from 'node:assert/strict';
import test from 'node:test';

import { EventJournal } from '../../packages/core/src/events/event-journal.js';
import { Scheduler } from '../../packages/core/src/scheduler/scheduler.js';
import { ManualClock } from '../../packages/core/src/time/clock.js';

interface TestContext {
  ready: boolean;
}

test('scheduler starts the highest-priority task first for an owner', () => {
  const clock = new ManualClock(100);
  const journal = new EventJournal({ clock, runId: 'priority-test' });
  const scheduler = new Scheduler<TestContext>({ clock, events: journal });
  const order: string[] = [];

  scheduler.submit({
    id: 'low',
    type: 'test',
    owner: 'mage',
    priority: 1,
    step() {
      order.push('low');
      return { state: 'succeeded' };
    },
  });
  scheduler.submit({
    id: 'high',
    type: 'test',
    owner: 'mage',
    priority: 10,
    step() {
      order.push('high');
      return { state: 'succeeded' };
    },
  });

  scheduler.tick({ ready: true });
  scheduler.tick({ ready: true });

  assert.deepEqual(order, ['high', 'low']);
  assert.deepEqual(
    scheduler.snapshot().completed.map((task) => task.id),
    ['high', 'low'],
  );
});

test('stable wait is exempt from stall detection and resumes cleanly', () => {
  const clock = new ManualClock(0);
  const journal = new EventJournal({ clock, runId: 'stable-wait-test' });
  const scheduler = new Scheduler<TestContext>({ clock, events: journal });

  scheduler.submit({
    id: 'waiter',
    type: 'wait-for-condition',
    owner: 'warrior',
    stallMs: 100,
    timeoutMs: 10_000,
    step(context) {
      if (!context.ready) {
        return { state: 'waiting', stable: true, reason: 'AWAITING_SIGNAL' };
      }
      return { state: 'succeeded', reason: 'SIGNAL_RECEIVED' };
    },
  });

  scheduler.tick({ ready: false });
  clock.advance(1_000);
  scheduler.tick({ ready: false });

  const waiting = scheduler.snapshot().active[0];
  assert.equal(waiting?.state, 'waiting');
  assert.equal(waiting?.stableWait, true);
  assert.equal(waiting?.retries, 0);

  scheduler.tick({ ready: true });

  const completed = scheduler.snapshot().completed[0];
  assert.equal(completed?.state, 'succeeded');
  assert.equal(completed?.reason, 'SIGNAL_RECEIVED');
  assert.equal(journal.query({ type: 'TASK_STALLED' }).length, 0);
  assert.equal(journal.query({ type: 'TASK_RESUMED' }).length, 1);
});

test('stalled tasks retry deterministically and can recover', () => {
  const clock = new ManualClock(0);
  const journal = new EventJournal({ clock, runId: 'retry-test' });
  const scheduler = new Scheduler<TestContext>({ clock, events: journal });

  scheduler.submit({
    id: 'retrying',
    type: 'retry-test',
    owner: 'ranger',
    maxRetries: 1,
    stallMs: 100,
    timeoutMs: 10_000,
    step(_context, task) {
      if (task.retries > 0) return { state: 'succeeded', reason: 'RECOVERED' };
      return { state: 'running', progressToken: 'same' };
    },
  });

  scheduler.tick({ ready: true });
  clock.advance(150);
  scheduler.tick({ ready: true });

  const queuedAfterStall = scheduler.snapshot().queued[0];
  assert.equal(queuedAfterStall?.id, 'retrying');
  assert.equal(queuedAfterStall?.retries, 1);

  scheduler.tick({ ready: true });

  const completed = scheduler.snapshot().completed[0];
  assert.equal(completed?.state, 'succeeded');
  assert.equal(completed?.retries, 1);
  assert.equal(journal.query({ type: 'TASK_STALLED' }).length, 1);
  assert.equal(journal.query({ type: 'TASK_RETRY_QUEUED' }).length, 1);
});
