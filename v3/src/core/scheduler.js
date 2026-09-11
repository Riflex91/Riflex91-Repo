'use strict';

const { TaskState } = require('./task');

class Scheduler {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.log = options.log || null;
    this.queue = [];
    this.activeByOwner = new Map();
    this.completed = [];
    this.completedCapacity = Math.max(20, Number(options.completedCapacity) || 200);
  }

  _event(task, event, severity = 'info', reason = null, data = {}) {
    if (!this.log) return;
    this.log.emit({ component: 'scheduler', event, severity, taskId: task.id, character: task.owner, reason, data: { type: task.type, ...data } });
  }

  submit(task) {
    if (!task || !task.id) throw new Error('valid task required');
    if (task.key) {
      const duplicate = this.queue.find((t) => t.owner === task.owner && t.key === task.key) ||
        [...this.activeByOwner.values()].find((t) => t.owner === task.owner && t.key === task.key);
      if (duplicate) return duplicate;
    }
    this.queue.push(task);
    this._event(task, 'TASK_QUEUED', 'info', null, { priority: task.priority, key: task.key });
    return task;
  }

  cancelOwner(owner, reason = 'CANCELLED') {
    const active = this.activeByOwner.get(owner);
    if (active) {
      active.state = TaskState.CANCELLED;
      active.reason = reason;
      try { if (active.onCancel) active.onCancel(reason); } catch (_) {}
      this._event(active, 'TASK_CANCELLED', 'warn', reason);
      this._finish(active);
    }
    const removed = this.queue.filter((t) => t.owner === owner);
    this.queue = this.queue.filter((t) => t.owner !== owner);
    for (const task of removed) {
      task.state = TaskState.CANCELLED;
      task.reason = reason;
      this._event(task, 'TASK_CANCELLED', 'warn', reason);
      this._remember(task);
    }
  }

  _remember(task) {
    this.completed.push({ id: task.id, key: task.key, type: task.type, owner: task.owner, state: task.state, reason: task.reason, retries: task.retries, startedAt: task.startedAt, updatedAt: task.updatedAt });
    if (this.completed.length > this.completedCapacity) this.completed.splice(0, this.completed.length - this.completedCapacity);
  }

  _finish(task) {
    this.activeByOwner.delete(task.owner);
    this._remember(task);
  }

  _nextForOwner(owner) {
    const candidates = this.queue.filter((t) => t.owner === owner);
    candidates.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    const task = candidates[0];
    if (!task) return null;
    this.queue.splice(this.queue.indexOf(task), 1);
    return task;
  }

  _owners() {
    return [...new Set([...this.queue.map((t) => t.owner), ...this.activeByOwner.keys()])];
  }

  _start(task, now, context) {
    if (task.precondition) {
      let ok = false;
      try { ok = task.precondition(context) !== false; } catch (error) {
        task.state = TaskState.FAILED_RETRYABLE;
        task.reason = `PRECONDITION_ERROR:${error && error.message || error}`;
        this._event(task, 'TASK_PRECONDITION_ERROR', 'warn', task.reason);
        this._retryOrFinish(task, now);
        return false;
      }
      if (!ok) {
        task.state = TaskState.WAITING;
        task.reason = 'PRECONDITION_FALSE';
        task.updatedAt = now;
        this.queue.push(task);
        this._event(task, 'TASK_WAITING', 'info', task.reason);
        return false;
      }
    }
    task.state = TaskState.RUNNING;
    task.startedAt = task.startedAt || now;
    task.updatedAt = now;
    task.lastProgressAt = now;
    if (task.progress) {
      try { task.lastProgressToken = task.progress(context); } catch (_) {}
    }
    this.activeByOwner.set(task.owner, task);
    this._event(task, 'TASK_STARTED', 'info', null, { priority: task.priority });
    return true;
  }

  _retryOrFinish(task, now) {
    this.activeByOwner.delete(task.owner);
    if (task.state === TaskState.FAILED_RETRYABLE && task.retries < task.maxRetries) {
      task.retries += 1;
      task.state = TaskState.QUEUED;
      task.updatedAt = now;
      task.startedAt = null;
      task.lastProgressAt = null;
      task.reason = null;
      this.queue.push(task);
      this._event(task, 'TASK_RETRY_QUEUED', 'warn', null, { retry: task.retries, maxRetries: task.maxRetries });
      return;
    }
    this._remember(task);
  }

  _observeProgress(task, context, now) {
    if (!task.progress) return;
    let token;
    try { token = task.progress(context); } catch (error) {
      this._event(task, 'TASK_PROGRESS_ERROR', 'warn', String(error && error.message || error));
      return;
    }
    if (token !== task.lastProgressToken) {
      task.lastProgressToken = token;
      task.lastProgressAt = now;
      this._event(task, 'TASK_PROGRESS', 'info', null, { progress: token });
    }
  }

  _run(task, context, now) {
    if (now - task.startedAt > task.timeoutMs) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = 'TASK_TIMEOUT';
      this._event(task, 'TASK_FAILED', 'warn', task.reason);
      this._retryOrFinish(task, now);
      return;
    }
    this._observeProgress(task, context, now);
    if (now - task.lastProgressAt > task.stallMs) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = 'NO_PROGRESS';
      this._event(task, 'TASK_STALLED', 'warn', task.reason, { stallMs: now - task.lastProgressAt, progress: task.lastProgressToken });
      this._retryOrFinish(task, now);
      return;
    }

    let result;
    try { result = task.step(context, task); } catch (error) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = `STEP_ERROR:${error && error.message || error}`;
      this._event(task, 'TASK_FAILED', 'error', task.reason);
      this._retryOrFinish(task, now);
      return;
    }
    task.updatedAt = now;
    const state = typeof result === 'string' ? result : result && result.state;
    const reason = result && typeof result === 'object' ? result.reason || null : null;
    if (!state || state === TaskState.RUNNING || state === TaskState.WAITING) {
      if (state === TaskState.WAITING) task.state = TaskState.WAITING;
      else task.state = TaskState.RUNNING;
      return;
    }
    if (!Object.values(TaskState).includes(state)) throw new Error(`unknown task state ${state}`);
    task.state = state;
    task.reason = reason;
    if (state === TaskState.SUCCEEDED) this._event(task, 'TASK_SUCCEEDED', 'info', reason);
    else if (state === TaskState.CANCELLED) this._event(task, 'TASK_CANCELLED', 'warn', reason);
    else this._event(task, 'TASK_FAILED', state === TaskState.FAILED_FATAL ? 'error' : 'warn', reason);
    this._retryOrFinish(task, now);
  }

  _maybePreempt(owner, now) {
    const active = this.activeByOwner.get(owner);
    if (!active || !active.interruptible) return;
    const queued = this.queue.filter((t) => t.owner === owner).sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)[0];
    if (!queued || queued.priority <= active.priority) return;
    active.state = TaskState.QUEUED;
    active.updatedAt = now;
    this.activeByOwner.delete(owner);
    this.queue.push(active);
    this._event(active, 'TASK_PREEMPTED', 'warn', 'HIGHER_PRIORITY_TASK', { byTaskId: queued.id, byPriority: queued.priority });
  }

  tick(context = {}) {
    const now = this.now();
    for (const owner of this._owners()) {
      this._maybePreempt(owner, now);
      let active = this.activeByOwner.get(owner);
      if (!active) {
        const next = this._nextForOwner(owner);
        if (next && this._start(next, now, context)) active = next;
      }
      if (active) this._run(active, context, now);
    }
  }

  snapshot() {
    return {
      queued: this.queue.map((t) => ({ id: t.id, key: t.key, type: t.type, owner: t.owner, priority: t.priority, state: t.state, retries: t.retries })),
      active: [...this.activeByOwner.values()].map((t) => ({ id: t.id, key: t.key, type: t.type, owner: t.owner, priority: t.priority, state: t.state, reason: t.reason, retries: t.retries, startedAt: t.startedAt, lastProgressAt: t.lastProgressAt, progress: t.lastProgressToken })),
      completed: this.completed.slice()
    };
  }
}

module.exports = { Scheduler };
