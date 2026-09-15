'use strict';

const TaskState = Object.freeze({
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED_RETRYABLE: 'FAILED_RETRYABLE',
  FAILED_FATAL: 'FAILED_FATAL',
  CANCELLED: 'CANCELLED'
});

let nextId = 1;

function createTask(spec = {}) {
  if (!spec.type) throw new Error('task type required');
  if (typeof spec.step !== 'function') throw new Error('task step() required');
  const now = Number(spec.createdAt) || Date.now();
  return {
    id: spec.id || `task-${nextId++}`,
    key: spec.key || null,
    type: spec.type,
    owner: spec.owner || 'local',
    priority: Number(spec.priority) || 0,
    interruptible: spec.interruptible !== false,
    maxRetries: Math.max(0, Number(spec.maxRetries) || 0),
    retries: 0,
    stallMs: Math.max(1000, Number(spec.stallMs) || 15000),
    timeoutMs: Math.max(1000, Number(spec.timeoutMs) || 120000),
    createdAt: now,
    startedAt: null,
    updatedAt: now,
    lastProgressAt: null,
    lastProgressToken: undefined,
    state: TaskState.QUEUED,
    reason: null,
    metadata: spec.metadata || {},
    precondition: typeof spec.precondition === 'function' ? spec.precondition : null,
    progress: typeof spec.progress === 'function' ? spec.progress : null,
    step: spec.step,
    onCancel: typeof spec.onCancel === 'function' ? spec.onCancel : null
  };
}

module.exports = { TaskState, createTask };
