'use strict';

function safeClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

class BoundedReplayBuffer {
  constructor(options = {}) {
    this.capacity = Math.max(32, Math.min(4096, Number(options.capacity) || 256));
    this.records = [];
    this.dropped = 0;
    this.rejected = 0;
  }

  push(record) {
    const cloned = safeClone(record);
    if (!cloned) {
      this.rejected += 1;
      return false;
    }
    this.records.push(cloned);
    while (this.records.length > this.capacity) {
      this.records.shift();
      this.dropped += 1;
    }
    return true;
  }

  list(limit = this.capacity) {
    const count = Math.max(0, Math.min(this.capacity, Number(limit) || 0));
    return this.records.slice(Math.max(0, this.records.length - count)).map((row) => safeClone(row));
  }

  status() {
    return {
      capacity: this.capacity,
      size: this.records.length,
      dropped: this.dropped,
      rejected: this.rejected
    };
  }
}

module.exports = { BoundedReplayBuffer };
