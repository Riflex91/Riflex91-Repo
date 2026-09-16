import assert from 'node:assert/strict';
import test from 'node:test';

import { EventJournal } from '../../packages/core/src/events/event-journal.js';
import { ManualClock } from '../../packages/core/src/time/clock.js';

test('event journal sequences, sanitizes and bounds retained events', () => {
  const clock = new ManualClock(1_000);
  const journal = new EventJournal({ clock, runId: 'run-test', capacity: 2 });

  journal.append({
    component: 'runtime',
    type: 'BOOT',
    payload: { token: 'secret', nested: { value: 1 } },
  });
  clock.advance(25);
  journal.append({ component: 'runtime', type: 'READY', severity: 'info' });
  clock.advance(25);
  journal.append({ component: 'scheduler', type: 'TASK_STARTED', taskId: 'task-1' });

  const rows = journal.list(10);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.sequence), [2, 3]);
  assert.deepEqual(rows.map((row) => row.occurredAt), [1_025, 1_050]);
  assert.equal(journal.summary().firstSequence, 2);

  const firstEvent = journal.query({ afterSequence: 0, limit: 10 })[0];
  assert.equal(firstEvent?.sequence, 2);

  const redactionJournal = new EventJournal({ clock, runId: 'redaction-test' });
  const redacted = redactionJournal.append({
    component: 'runtime',
    type: 'SECRET_CHECK',
    payload: { apiKey: 'do-not-store', safe: 'ok' },
  });
  assert.deepEqual(redacted.payload, { apiKey: '[redacted]', safe: 'ok' });
});

test('event journal replay is ordered and sink failures are isolated', () => {
  const clock = new ManualClock(50);
  const journal = new EventJournal({
    clock,
    runId: 'run-replay',
    sink: {
      write() {
        throw new Error('sink unavailable');
      },
    },
  });

  journal.append({ component: 'runtime', type: 'ONE' });
  journal.append({ component: 'runtime', type: 'TWO' });
  journal.append({ component: 'runtime', type: 'THREE' });

  const replayed: number[] = [];
  const count = journal.replay((event) => replayed.push(event.sequence), 1);

  assert.equal(count, 2);
  assert.deepEqual(replayed, [2, 3]);
});
