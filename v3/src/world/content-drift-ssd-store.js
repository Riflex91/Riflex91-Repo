'use strict';

// Explicit, asynchronous SSD transport for the V3 content-drift snapshots.
// Not a transparent replacement for synchronous localStorage: callers must
// await load + confirmed write and gate their scanners while unavailable.
const HOST_BASE = 'http://127.0.0.1:17392/v1/storage?key=';
const MAX_VALUE_LENGTH = 3 * 1024 * 1024;

function validateKey(key) {
  if (typeof key !== 'string'
      || !/^aio-v3-content-drift-v1(?::[a-zA-Z0-9_-]{1,120})?$/.test(key)) {
    throw new Error('AIO_V3_SSD_KEY_INVALID');
  }
}

function validateSnapshot(value) {
  if (typeof value !== 'string' || !value.length || value.length > MAX_VALUE_LENGTH) {
    throw new Error('AIO_V3_SSD_SNAPSHOT_INVALID');
  }
  let row;
  try { row = JSON.parse(value); }
  catch (_) { throw new Error('AIO_V3_SSD_SNAPSHOT_INVALID'); }
  if (!row || row.schemaVersion !== 1 || !Array.isArray(row.records)
      || !row.catalog || typeof row.catalog !== 'object' || Array.isArray(row.catalog)) {
    throw new Error('AIO_V3_SSD_SNAPSHOT_INVALID');
  }
  return row;
}

class ContentDriftSsdStore {
  constructor(options = {}) {
    this.root = options.root || globalThis;
    this.timeoutMs = Math.min(10000, Math.max(1000, Number(options.timeoutMs) || 5000));
  }

  async _request(method, key, body = null) {
    validateKey(key);
    const fetchFn = this.root && this.root.fetch;
    if (typeof fetchFn !== 'function') throw new Error('AIO_V3_SSD_HOST_UNAVAILABLE');
    const controller = typeof this.root.AbortController === 'function'
      ? new this.root.AbortController() : null;
    if (!controller || typeof this.root.setTimeout !== 'function'
        || typeof this.root.clearTimeout !== 'function') {
      throw new Error('AIO_V3_SSD_ABORT_UNAVAILABLE');
    }
    const timer = this.root.setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetchFn.call(this.root, HOST_BASE + encodeURIComponent(key), {
        method, credentials: 'omit', cache: 'no-store',
        ...(body ? {
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(body)
        } : {}),
        signal: controller.signal
      });
      if (!response || response.ok !== true) {
        throw new Error('AIO_V3_SSD_HTTP_' + (response && response.status || 'FAILED'));
      }
      const data = await response.json();
      if (!data || data.ok !== true) throw new Error('AIO_V3_SSD_RESPONSE_INVALID');
      return data;
    } finally {
      this.root.clearTimeout(timer);
    }
  }

  async read(key) {
    const result = await this._request('GET', key);
    if (result.found !== true) return { found: false, revision: result.revision || 0 };
    validateSnapshot(result.value);
    if (!Number.isSafeInteger(result.revision) || result.revision < 1)
      throw new Error('AIO_V3_SSD_REVISION_INVALID');
    return { found: true, value: result.value, revision: result.revision };
  }

  async write(key, value, expectedRevision) {
    validateSnapshot(value);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      throw new Error('AIO_V3_SSD_REVISION_REQUIRED');
    const result = await this._request('POST', key, {
      key, value, expectedRevision
    });
    if (!Number.isSafeInteger(result.revision)
        || result.revision !== expectedRevision + 1)
      throw new Error('AIO_V3_SSD_WRITE_UNVERIFIED');
    const check = await this.read(key);
    if (!check.found || check.value !== value || check.revision !== result.revision)
      throw new Error('AIO_V3_SSD_READBACK_MISMATCH');
    return { confirmed: true, revision: result.revision };
  }
}

module.exports = { ContentDriftSsdStore, validateKey, validateSnapshot };
