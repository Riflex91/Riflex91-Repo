'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Scheduler } = require('../src/core/scheduler');
const { createTask, TaskState } = require('../src/core/task');

test('Scheduler runs only one task per owner and prefers higher priority', () => {
  let now = 1000;
  const scheduler = new Scheduler({ now: () => now });
  const ran = [];
  scheduler.submit(createTask({ id: 'low', owner: 'R1', type: 'LOW', priority: 1, step: () => { ran.push('low'); return TaskState.SUCCEEDED; } }));
  scheduler.submit(createTask({ id: 'high', owner: 'R1', type: 'HIGH', priority: 10, step: () => { ran.push('high'); return TaskState.SUCCEEDED; } }));
  scheduler.tick({});
  assert.deepEqual(ran, ['high']);
  scheduler.tick({});
  assert.deepEqual(ran, ['high', 'low']);
});

test('Scheduler detects no-progress stalls and retries deterministically', () => {
  let now = 0;
  const scheduler = new Scheduler({ now: () => now });
  const task = createTask({ id: 'stall', owner: 'R1', type: 'MOVE', stallMs: 1000, maxRetries: 1, progress: () => 'same', step: () => TaskState.RUNNING });
  scheduler.submit(task);
  scheduler.tick({});
  now = 1101;
  scheduler.tick({});
  assert.equal(task.retries, 1);
  assert.equal(task.state, TaskState.QUEUED);
  now = 1200;
  scheduler.tick({});
  assert.equal(task.state, TaskState.RUNNING);
  now = 2301;
  scheduler.tick({});
  assert.equal(task.state, TaskState.FAILED_RETRYABLE);
  assert.equal(scheduler.completed.at(-1).reason, 'NO_PROGRESS');
});

test('Scheduler de-duplicates tasks by owner and key', () => {
  const scheduler = new Scheduler({ now: () => 1000 });
  const a = createTask({ id: 'a', key: 'farm', owner: 'R1', type: 'FARM', step: () => TaskState.RUNNING });
  const b = createTask({ id: 'b', key: 'farm', owner: 'R1', type: 'FARM', step: () => TaskState.RUNNING });
  assert.equal(scheduler.submit(a), a);
  assert.equal(scheduler.submit(b), a);
  assert.equal(scheduler.queue.length, 1);
});
