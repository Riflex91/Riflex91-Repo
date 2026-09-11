'use strict';

const SECRET_KEY = /(token|secret|password|passwd|write[_-]?key|api[_-]?key|authorization|cookie|session)/i;

function cloneSafe(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 4000 ? value.slice(0, 4000) + '…' : value;
  if (typeof value === 'function') return '[function]';
  if (depth > 6) return '[depth-limit]';
  if (typeof value === 'object') {
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 100).map((v) => cloneSafe(v, depth + 1, seen));
    const out = {};
    for (const [key, child] of Object.entries(value).slice(0, 100)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : cloneSafe(child, depth + 1, seen);
    }
    return out;
  }
  return String(value);
}

function makeRunId(now) {
  return `v3-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class EventLog {
  constructor(options = {}) {
    this.capacity = Math.max(100, Number(options.capacity) || 4000);
    this.now = options.now || (() => Date.now());
    this.version = options.version || '3.0.0-alpha.1';
    this.runId = options.runId || makeRunId(this.now());
    this.events = [];
    this.sequence = 0;
    this.sink = typeof options.sink === 'function' ? options.sink : null;
  }

  emit(input = {}) {
    const event = {
      seq: ++this.sequence,
      ts: new Date(this.now()).toISOString(),
      runId: this.runId,
      version: this.version,
      severity: input.severity || 'info',
      component: input.component || 'runtime',
      event: input.event || 'EVENT',
      character: input.character || null,
      taskId: input.taskId || null,
      reason: input.reason || null,
      data: cloneSafe(input.data || {})
    };
    this.events.push(event);
    if (this.events.length > this.capacity) this.events.splice(0, this.events.length - this.capacity);
    if (this.sink) {
      try { this.sink(event); } catch (_) { /* diagnostics must never block gameplay */ }
    }
    return event;
  }

  list(limit = 100) {
    const n = Math.max(0, Math.min(this.events.length, Number(limit) || 0));
    return this.events.slice(this.events.length - n).map((e) => cloneSafe(e));
  }

  summary() {
    const counts = {};
    for (const e of this.events) counts[e.event] = (counts[e.event] || 0) + 1;
    return {
      runId: this.runId,
      retained: this.events.length,
      firstSeq: this.events[0] ? this.events[0].seq : null,
      lastSeq: this.events[this.events.length - 1] ? this.events[this.events.length - 1].seq : null,
      counts
    };
  }

  exportBundle(context = {}) {
    return JSON.stringify({
      manifest: {
        botVersion: this.version,
        schemaVersion: 1,
        runId: this.runId,
        exportedAt: new Date(this.now()).toISOString()
      },
      context: cloneSafe(context),
      eventSummary: this.summary(),
      events: this.list(this.events.length)
    }, null, 2);
  }
}

module.exports = { EventLog, cloneSafe };
