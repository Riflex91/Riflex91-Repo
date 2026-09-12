'use strict';

const { Scheduler } = require('./scheduler');
const { TaskState } = require('./task');

class StableScheduler extends Scheduler {
  constructor(options = {}) {
    super(options);
    this.stableWaitTransitions = 0;
    this.resumedTransitions = 0;
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

    let result;
    try {
      result = task.step(context, task);
    } catch (error) {
      task.state = TaskState.FAILED_RETRYABLE;
      task.reason = `STEP_ERROR:${error && error.message || error}`;
      this._event(task, 'TASK_FAILED', 'error', task.reason);
      this._retryOrFinish(task, now);
      return;
    }

    task.updatedAt = now;
    const state = typeof result === 'string' ? result : result && result.state;
    const reason = result && typeof result === 'object' ? result.reason || null : null;
    const stableWait = !!(result && typeof result === 'object' && result.stableWait === true);

    if (!state || state === TaskState.RUNNING || state === TaskState.WAITING) {
      if (state === TaskState.WAITING && stableWait) {
        const entering = task.state !== TaskState.WAITING || task.reason !== reason || task.stableWait !== true;
        task.state = TaskState.WAITING;
        task.reason = reason || 'STABLE_WAIT';
        task.stableWait = true;
        task.waitingSince = task.waitingSince || now;
        if (entering) {
          this.stableWaitTransitions += 1;
          this._event(task, 'TASK_STABLE_WAIT', 'info', task.reason, { waitingSince: task.waitingSince });
        }
        return;
      }

      if (task.stableWait) {
        task.stableWait = false;
        task.waitingSince = null;
        task.lastProgressAt = now;
        this.resumedTransitions += 1;
        this._event(task, 'TASK_RESUMED', 'info', reason || 'STABLE_WAIT_RESOLVED');
      }

      task.state = state === TaskState.WAITING ? TaskState.WAITING : TaskState.RUNNING;
      task.reason = reason;

      if (now - task.lastProgressAt > task.stallMs) {
        task.state = TaskState.FAILED_RETRYABLE;
        task.reason = 'NO_PROGRESS';
        this._event(task, 'TASK_STALLED', 'warn', task.reason, {
          stallMs: now - task.lastProgressAt,
          progress: task.lastProgressToken
        });
        this._retryOrFinish(task, now);
      }
      return;
    }

    if (!Object.values(TaskState).includes(state)) throw new Error(`unknown task state ${state}`);
    task.stableWait = false;
    task.waitingSince = null;
    task.state = state;
    task.reason = reason;
    if (state === TaskState.SUCCEEDED) this._event(task, 'TASK_SUCCEEDED', 'info', reason);
    else if (state === TaskState.CANCELLED) this._event(task, 'TASK_CANCELLED', 'warn', reason);
    else this._event(task, 'TASK_FAILED', state === TaskState.FAILED_FATAL ? 'error' : 'warn', reason);
    this._retryOrFinish(task, now);
  }

  snapshot() {
    const base = super.snapshot();
    base.active = base.active.map((row) => {
      const task = this.activeByOwner.get(row.owner);
      return {
        ...row,
        stableWait: !!(task && task.stableWait),
        waitingSince: task && task.waitingSince || null
      };
    });
    base.stability = {
      stableWaitTransitions: this.stableWaitTransitions,
      resumedTransitions: this.resumedTransitions
    };
    return base;
  }
}

module.exports = { StableScheduler };
