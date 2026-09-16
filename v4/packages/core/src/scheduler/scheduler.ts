import type { Clock } from '../time/clock.js';
import type { EventWriter } from '../events/event.js';
import type {
  SchedulerSnapshot,
  TaskDefinition,
  TaskSnapshot,
  TaskState,
  TaskStepResult,
} from './task.js';

interface RuntimeTask<Context> {
  readonly definition: TaskDefinition<Context>;
  readonly createdAt: number;
  state: TaskState;
  retries: number;
  startedAt: number | null;
  updatedAt: number;
  lastProgressAt: number | null;
  lastProgressToken: unknown;
  reason: string | null;
  stableWait: boolean;
  waitingSince: number | null;
}

export interface SchedulerOptions {
  readonly clock: Clock;
  readonly events?: EventWriter;
  readonly completedCapacity?: number;
}

export class Scheduler<Context = unknown> {
  private readonly clock: Clock;
  private readonly events: EventWriter | undefined;
  private readonly completedCapacity: number;
  private readonly queue: RuntimeTask<Context>[] = [];
  private readonly activeByOwner = new Map<string, RuntimeTask<Context>>();
  private readonly completed: RuntimeTask<Context>[] = [];

  constructor(options: SchedulerOptions) {
    this.clock = options.clock;
    this.events = options.events;
    this.completedCapacity = Math.max(1, Math.floor(options.completedCapacity ?? 200));
  }

  submit(definition: TaskDefinition<Context>): TaskSnapshot {
    validateDefinition(definition);
    const owner = definition.owner ?? 'local';

    if (definition.key !== undefined) {
      const duplicate = this.findDuplicate(owner, definition.key);
      if (duplicate) return snapshotOf(duplicate);
    }

    const now = this.clock.now();
    const task: RuntimeTask<Context> = {
      definition,
      createdAt: now,
      state: 'queued',
      retries: 0,
      startedAt: null,
      updatedAt: now,
      lastProgressAt: null,
      lastProgressToken: undefined,
      reason: null,
      stableWait: false,
      waitingSince: null,
    };

    this.queue.push(task);
    this.emit(task, 'TASK_QUEUED', 'info', undefined, {
      priority: priorityOf(task),
      key: definition.key ?? null,
    });
    return snapshotOf(task);
  }

  cancelOwner(owner: string, reason = 'CANCELLED'): void {
    const active = this.activeByOwner.get(owner);
    if (active) {
      active.state = 'cancelled';
      active.reason = reason;
      active.updatedAt = this.clock.now();
      try {
        active.definition.onCancel?.(reason);
      } catch {
        // Cancellation cleanup is best-effort; scheduler state must remain consistent.
      }
      this.emit(active, 'TASK_CANCELLED', 'warn', reason);
      this.finish(active);
    }

    const queued = this.queue.filter((task) => ownerOf(task) === owner);
    for (const task of queued) {
      this.removeFromQueue(task);
      task.state = 'cancelled';
      task.reason = reason;
      task.updatedAt = this.clock.now();
      this.emit(task, 'TASK_CANCELLED', 'warn', reason);
      this.remember(task);
    }
  }

  tick(context: Context): void {
    const now = this.clock.now();
    for (const owner of this.owners()) {
      this.maybePreempt(owner, now);
      let active = this.activeByOwner.get(owner);

      if (!active) {
        const next = this.nextForOwner(owner);
        if (next && this.start(next, context, now)) active = next;
      }

      if (active) this.run(active, context, now);
    }
  }

  snapshot(): SchedulerSnapshot {
    return {
      queued: [...this.queue].sort(compareTasks).map(snapshotOf),
      active: [...this.activeByOwner.values()].sort(compareTasks).map(snapshotOf),
      completed: this.completed.map(snapshotOf),
    };
  }

  private findDuplicate(owner: string, key: string): RuntimeTask<Context> | undefined {
    return this.queue.find((task) => ownerOf(task) === owner && task.definition.key === key)
      ?? [...this.activeByOwner.values()].find(
        (task) => ownerOf(task) === owner && task.definition.key === key,
      );
  }

  private owners(): string[] {
    return [...new Set([
      ...this.queue.map(ownerOf),
      ...this.activeByOwner.keys(),
    ])].sort();
  }

  private nextForOwner(owner: string): RuntimeTask<Context> | undefined {
    const next = this.queue
      .filter((task) => ownerOf(task) === owner)
      .sort(compareTasks)[0];
    if (!next) return undefined;
    this.removeFromQueue(next);
    return next;
  }

  private start(task: RuntimeTask<Context>, context: Context, now: number): boolean {
    if (task.definition.precondition) {
      let accepted = false;
      try {
        accepted = task.definition.precondition(context) !== false;
      } catch (error) {
        this.failRetryable(task, now, `PRECONDITION_ERROR:${errorText(error)}`);
        return false;
      }

      if (!accepted) {
        task.state = 'waiting';
        task.reason = 'PRECONDITION_FALSE';
        task.updatedAt = now;
        this.queue.push(task);
        this.emit(task, 'TASK_WAITING', 'info', task.reason);
        return false;
      }
    }

    task.state = 'running';
    task.startedAt ??= now;
    task.updatedAt = now;
    task.lastProgressAt = now;
    task.reason = null;
    task.stableWait = false;
    task.waitingSince = null;
    this.activeByOwner.set(ownerOf(task), task);
    this.emit(task, 'TASK_STARTED', 'info', undefined, { priority: priorityOf(task) });
    return true;
  }

  private run(task: RuntimeTask<Context>, context: Context, now: number): void {
    const startedAt = task.startedAt ?? now;
    if (now - startedAt > timeoutOf(task)) {
      this.failRetryable(task, now, 'TASK_TIMEOUT');
      return;
    }

    let result: TaskStepResult;
    try {
      result = task.definition.step(context, snapshotOf(task));
    } catch (error) {
      this.failRetryable(task, now, `STEP_ERROR:${errorText(error)}`, 'error');
      return;
    }

    task.updatedAt = now;
    this.observeProgress(task, result, now);

    const state = result.state ?? 'running';
    const reason = result.reason ?? null;

    if (state === 'waiting' && result.stable === true) {
      const enteringStableWait = !task.stableWait || task.reason !== reason;
      task.state = 'waiting';
      task.reason = reason ?? 'STABLE_WAIT';
      task.stableWait = true;
      task.waitingSince ??= now;
      if (enteringStableWait) {
        this.emit(task, 'TASK_STABLE_WAIT', 'info', task.reason, {
          waitingSince: task.waitingSince,
        });
      }
      return;
    }

    if (task.stableWait) {
      task.stableWait = false;
      task.waitingSince = null;
      task.lastProgressAt = now;
      this.emit(task, 'TASK_RESUMED', 'info', reason ?? 'STABLE_WAIT_RESOLVED');
    }

    if (state === 'running' || state === 'waiting') {
      task.state = state;
      task.reason = reason;
      const lastProgressAt = task.lastProgressAt ?? now;
      if (now - lastProgressAt > stallOf(task)) {
        this.failRetryable(task, now, 'NO_PROGRESS');
      }
      return;
    }

    task.state = state;
    task.reason = reason;
    task.stableWait = false;
    task.waitingSince = null;

    if (state === 'succeeded') {
      this.emit(task, 'TASK_SUCCEEDED', 'info', reason ?? undefined);
      this.finish(task);
      return;
    }

    if (state === 'cancelled') {
      this.emit(task, 'TASK_CANCELLED', 'warn', reason ?? undefined);
      this.finish(task);
      return;
    }

    if (state === 'failed-fatal') {
      this.emit(task, 'TASK_FAILED', 'error', reason ?? 'FAILED_FATAL');
      this.finish(task);
      return;
    }

    this.retryOrFinish(task, now, reason ?? 'FAILED_RETRYABLE');
  }

  private observeProgress(task: RuntimeTask<Context>, result: TaskStepResult, now: number): void {
    if (!Object.prototype.hasOwnProperty.call(result, 'progressToken')) return;
    if (Object.is(task.lastProgressToken, result.progressToken)) return;
    task.lastProgressToken = result.progressToken;
    task.lastProgressAt = now;
    this.emit(task, 'TASK_PROGRESS', 'debug', undefined, {
      progressToken: result.progressToken,
    });
  }

  private failRetryable(
    task: RuntimeTask<Context>,
    now: number,
    reason: string,
    severity: 'warn' | 'error' = 'warn',
  ): void {
    task.state = 'failed-retryable';
    task.reason = reason;
    task.updatedAt = now;
    this.emit(task, reason === 'NO_PROGRESS' ? 'TASK_STALLED' : 'TASK_FAILED', severity, reason);
    this.retryOrFinish(task, now, reason);
  }

  private retryOrFinish(task: RuntimeTask<Context>, now: number, reason: string): void {
    this.activeByOwner.delete(ownerOf(task));
    if (task.retries < maxRetriesOf(task)) {
      task.retries += 1;
      task.state = 'queued';
      task.reason = null;
      task.startedAt = null;
      task.updatedAt = now;
      task.lastProgressAt = null;
      task.lastProgressToken = undefined;
      task.stableWait = false;
      task.waitingSince = null;
      this.queue.push(task);
      this.emit(task, 'TASK_RETRY_QUEUED', 'warn', reason, {
        retry: task.retries,
        maxRetries: maxRetriesOf(task),
      });
      return;
    }

    task.state = 'failed-retryable';
    task.reason = reason;
    this.remember(task);
  }

  private maybePreempt(owner: string, now: number): void {
    const active = this.activeByOwner.get(owner);
    if (!active || active.definition.interruptible === false) return;

    const queued = this.queue
      .filter((task) => ownerOf(task) === owner)
      .sort(compareTasks)[0];
    if (!queued || priorityOf(queued) <= priorityOf(active)) return;

    active.state = 'queued';
    active.updatedAt = now;
    active.reason = 'HIGHER_PRIORITY_TASK';
    active.stableWait = false;
    active.waitingSince = null;
    this.activeByOwner.delete(owner);
    this.queue.push(active);
    this.emit(active, 'TASK_PREEMPTED', 'warn', active.reason, {
      byTaskId: queued.definition.id,
      byPriority: priorityOf(queued),
    });
  }

  private finish(task: RuntimeTask<Context>): void {
    this.activeByOwner.delete(ownerOf(task));
    this.remember(task);
  }

  private remember(task: RuntimeTask<Context>): void {
    this.completed.push(task);
    if (this.completed.length > this.completedCapacity) {
      this.completed.splice(0, this.completed.length - this.completedCapacity);
    }
  }

  private removeFromQueue(task: RuntimeTask<Context>): void {
    const index = this.queue.indexOf(task);
    if (index >= 0) this.queue.splice(index, 1);
  }

  private emit(
    task: RuntimeTask<Context>,
    type: string,
    severity: 'debug' | 'info' | 'warn' | 'error',
    reason?: string,
    payload: Record<string, unknown> = {},
  ): void {
    if (!this.events) return;
    this.events.append({
      component: 'scheduler',
      type,
      severity,
      actorId: ownerOf(task),
      taskId: task.definition.id,
      ...(reason === undefined ? {} : { reason }),
      payload: {
        taskType: task.definition.type,
        ...payload,
      },
    });
  }
}

function snapshotOf<Context>(task: RuntimeTask<Context>): TaskSnapshot {
  return {
    id: task.definition.id,
    key: task.definition.key ?? null,
    type: task.definition.type,
    owner: ownerOf(task),
    priority: priorityOf(task),
    state: task.state,
    retries: task.retries,
    maxRetries: maxRetriesOf(task),
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    updatedAt: task.updatedAt,
    lastProgressAt: task.lastProgressAt,
    reason: task.reason,
    stableWait: task.stableWait,
    waitingSince: task.waitingSince,
    metadata: task.definition.metadata ?? {},
  };
}

function ownerOf<Context>(task: RuntimeTask<Context>): string {
  return task.definition.owner ?? 'local';
}

function priorityOf<Context>(task: RuntimeTask<Context>): number {
  return finiteOr(task.definition.priority, 0);
}

function maxRetriesOf<Context>(task: RuntimeTask<Context>): number {
  return Math.max(0, Math.floor(finiteOr(task.definition.maxRetries, 0)));
}

function stallOf<Context>(task: RuntimeTask<Context>): number {
  return Math.max(1, finiteOr(task.definition.stallMs, 15_000));
}

function timeoutOf<Context>(task: RuntimeTask<Context>): number {
  return Math.max(1, finiteOr(task.definition.timeoutMs, 120_000));
}

function compareTasks<Context>(left: RuntimeTask<Context>, right: RuntimeTask<Context>): number {
  return priorityOf(right) - priorityOf(left)
    || left.createdAt - right.createdAt
    || left.definition.id.localeCompare(right.definition.id);
}

function validateDefinition<Context>(definition: TaskDefinition<Context>): void {
  if (!definition.id.trim()) throw new TypeError('task id must not be empty');
  if (!definition.type.trim()) throw new TypeError('task type must not be empty');
  if (typeof definition.step !== 'function') throw new TypeError('task step must be a function');
}

function finiteOr(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : value;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
