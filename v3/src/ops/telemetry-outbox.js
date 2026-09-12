'use strict';

function cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

class TelemetryOutbox {
  constructor(options = {}) {
    this.capacity = Math.max(100, Number(options.capacity) || 2000);
    this.queue = [];
    this.lastCapturedSeq = 0;
    this.dropped = 0;
  }

  capture(log) {
    if (!log || typeof log.query !== 'function') return 0;
    const rows = log.query({ sinceSeq: this.lastCapturedSeq, limit: this.capacity * 2 });
    for (const row of rows) {
      if (!row || !Number.isFinite(Number(row.seq))) continue;
      this.lastCapturedSeq = Math.max(this.lastCapturedSeq, Number(row.seq));
      this.queue.push(cloneJson(row));
    }
    if (this.queue.length > this.capacity) {
      const overflow = this.queue.length - this.capacity;
      this.queue.splice(0, overflow);
      this.dropped += overflow;
    }
    return rows.length;
  }

  drain(limit = 100) {
    const n = Math.max(0, Math.min(this.queue.length, Number(limit) || 0));
    return this.queue.splice(0, n).map(cloneJson);
  }

  peek(limit = 100) {
    const n = Math.max(0, Math.min(this.queue.length, Number(limit) || 0));
    return this.queue.slice(0, n).map(cloneJson);
  }

  status() {
    return {
      queued: this.queue.length,
      capacity: this.capacity,
      dropped: this.dropped,
      lastCapturedSeq: this.lastCapturedSeq || null
    };
  }
}

module.exports = { TelemetryOutbox };
