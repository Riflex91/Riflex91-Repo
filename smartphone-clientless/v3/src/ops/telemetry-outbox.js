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
    this.lastAcknowledgedSeq = 0;
    this.acknowledged = 0;
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

  ackThrough(maxSeq) {
    const requested = Number(maxSeq);
    if (!Number.isFinite(requested) || requested < 0) throw new Error('TELEMETRY_ACK_SEQ_INVALID');

    let count = 0;
    let lastRemovedSeq = null;
    while (count < this.queue.length) {
      const row = this.queue[count];
      const seq = Number(row && row.seq);
      if (!Number.isFinite(seq) || seq > requested) break;
      lastRemovedSeq = seq;
      count += 1;
    }

    if (count > 0) {
      this.queue.splice(0, count);
      this.acknowledged += count;
      this.lastAcknowledgedSeq = Math.max(this.lastAcknowledgedSeq, Number(lastRemovedSeq) || 0);
    }

    return {
      requestedSeq: requested,
      acknowledged: count,
      lastAcknowledgedSeq: this.lastAcknowledgedSeq || null,
      remaining: this.queue.length
    };
  }

  status() {
    const oldest = this.queue.length ? Number(this.queue[0] && this.queue[0].seq) : null;
    const newest = this.queue.length ? Number(this.queue[this.queue.length - 1] && this.queue[this.queue.length - 1].seq) : null;
    return {
      queued: this.queue.length,
      capacity: this.capacity,
      dropped: this.dropped,
      acknowledged: this.acknowledged,
      lastCapturedSeq: this.lastCapturedSeq || null,
      lastAcknowledgedSeq: this.lastAcknowledgedSeq || null,
      oldestQueuedSeq: Number.isFinite(oldest) ? oldest : null,
      newestQueuedSeq: Number.isFinite(newest) ? newest : null
    };
  }
}

module.exports = { TelemetryOutbox };
