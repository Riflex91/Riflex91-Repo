'use strict';

const DEBUG_TELEMETRY_SCHEMA_VERSION = 1;
const DEFAULT_DEBUG_TELEMETRY_TABLE = 'aio_v3_debug_telemetry';
const DEFAULT_MAX_PAYLOAD_BYTES = 512 * 1024;
const DEFAULT_TIMEOUT_MS = 2500;
const REDACTED = '[REDACTED]';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bounded(value, max = 512) {
  return String(value == null ? '' : value).slice(0, max);
}

function secretKey(name) {
  const normalized = String(name == null ? '' : name).replace(/[^a-z0-9]/gi, '').toLowerCase();
  return normalized === 'apikey'
    || normalized === 'servicekey'
    || normalized === 'servicerolekey'
    || normalized === 'supabasekey'
    || normalized === 'token'
    || normalized.endsWith('token')
    || normalized === 'secret'
    || normalized.endsWith('secret')
    || normalized === 'password'
    || normalized === 'passwd'
    || normalized === 'authorization'
    || normalized === 'cookie'
    || normalized === 'setcookie';
}

function sanitizeDebugPayload(value, options = {}) {
  const maxDepth = Math.max(2, Math.min(20, Math.floor(finite(options.maxDepth, 10))));
  const maxArrayLength = Math.max(1, Math.min(1000, Math.floor(finite(options.maxArrayLength, 200))));
  const maxObjectKeys = Math.max(1, Math.min(1000, Math.floor(finite(options.maxObjectKeys, 200))));
  const maxStringLength = Math.max(64, Math.min(20000, Math.floor(finite(options.maxStringLength, 4000))));
  const seen = new WeakSet();

  function visit(input, depth, keyName) {
    if (secretKey(keyName)) return REDACTED;
    if (input == null || typeof input === 'boolean' || typeof input === 'number') return input;
    if (typeof input === 'string') return input.slice(0, maxStringLength);
    if (typeof input === 'bigint') return String(input);
    if (typeof input === 'undefined' || typeof input === 'function' || typeof input === 'symbol') return '[UNSERIALIZABLE]';
    if (depth >= maxDepth) return '[MAX_DEPTH]';
    if (typeof input !== 'object') return bounded(input, maxStringLength);
    if (seen.has(input)) return '[CIRCULAR]';
    seen.add(input);
    if (Array.isArray(input)) {
      const out = input.slice(0, maxArrayLength).map((entry) => visit(entry, depth + 1, null));
      if (input.length > maxArrayLength) out.push(`[TRUNCATED:${input.length - maxArrayLength}]`);
      return out;
    }
    const out = {};
    const keys = Object.keys(input).slice(0, maxObjectKeys);
    for (const key of keys) out[key] = visit(input[key], depth + 1, key);
    if (Object.keys(input).length > maxObjectKeys) out.__truncatedKeys = Object.keys(input).length - maxObjectKeys;
    return out;
  }

  return visit(value, 0, null);
}

function normalizeUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return null;
  let parsed;
  try { parsed = new URL(raw); } catch (_) { throw new Error('DEBUG_TELEMETRY_SUPABASE_URL_INVALID'); }
  if (parsed.protocol !== 'https:') throw new Error('DEBUG_TELEMETRY_SUPABASE_HTTPS_REQUIRED');
  return parsed.toString().replace(/\/+$/, '');
}

function normalizeTable(value) {
  const table = String(value || DEFAULT_DEBUG_TELEMETRY_TABLE).trim();
  if (!/^[A-Za-z0-9_]{1,96}$/.test(table)) throw new Error('DEBUG_TELEMETRY_TABLE_INVALID');
  return table;
}

function deriveRunId(payload) {
  const candidates = [
    payload && payload.runId,
    payload && payload.bot && payload.bot.runId,
    payload && payload.bot && payload.bot.context && payload.bot.context.runId,
    payload && payload.host && payload.host.controller && payload.host.controller.watchdog && payload.host.controller.watchdog.lastBeacon && payload.host.controller.watchdog.lastBeacon.runId
  ];
  for (const value of candidates) {
    const text = String(value == null ? '' : value).trim();
    if (text) return text.slice(0, 160);
  }
  return null;
}

class SupabaseDebugTelemetrySink {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.url = normalizeUrl(options.url);
    this.key = String(options.key || '').trim() || null;
    this.table = normalizeTable(options.table);
    this.fetch = options.fetch || globalThis.fetch;
    this.timeoutMs = Math.max(250, Math.min(30000, Math.floor(finite(options.timeoutMs, DEFAULT_TIMEOUT_MS))));
    this.maxPayloadBytes = Math.max(4096, Math.min(2 * 1024 * 1024, Math.floor(finite(options.maxPayloadBytes, DEFAULT_MAX_PAYLOAD_BYTES))));
    this.source = bounded(options.source || 'aio-v3-host', 96) || 'aio-v3-host';
    this.lastResult = null;
    this.stats = { attempts: 0, published: 0, failures: 0, rejected: 0 };
  }

  static fromEnv(options = {}) {
    const env = options.env || process.env || {};
    return new SupabaseDebugTelemetrySink({
      ...options,
      url: options.url || env.AIO_V3_SUPABASE_URL,
      key: options.key || env.AIO_V3_SUPABASE_KEY,
      table: options.table || env.AIO_V3_SUPABASE_TABLE || DEFAULT_DEBUG_TELEMETRY_TABLE
    });
  }

  enabled() {
    return !!(this.url && this.key && typeof this.fetch === 'function');
  }

  async publish(payload) {
    if (!this.enabled()) return { published: false, reason: 'DEBUG_TELEMETRY_NOT_CONFIGURED' };
    this.stats.attempts += 1;
    const capturedAt = this.now();
    const record = {
      captured_at: new Date(capturedAt).toISOString(),
      source: this.source,
      run_id: deriveRunId(payload),
      payload: sanitizeDebugPayload(payload)
    };
    const body = JSON.stringify(record);
    const bytes = Buffer.byteLength(body, 'utf8');
    if (bytes > this.maxPayloadBytes) {
      this.stats.rejected += 1;
      this.stats.failures += 1;
      this.lastResult = { at: capturedAt, published: false, reason: 'DEBUG_TELEMETRY_PAYLOAD_TOO_LARGE', bytes };
      return { ...this.lastResult };
    }

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    let timer = null;
    if (controller) timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          apikey: this.key,
          authorization: `Bearer ${this.key}`,
          'content-type': 'application/json',
          prefer: 'return=minimal'
        },
        body,
        signal: controller ? controller.signal : undefined
      });
      if (!response || response.ok !== true) throw new Error(`DEBUG_TELEMETRY_HTTP_${response && response.status || 'FAILED'}`);
      this.stats.published += 1;
      this.lastResult = { at: capturedAt, published: true, status: response.status || 200, bytes };
      return { ...this.lastResult };
    } catch (error) {
      this.stats.failures += 1;
      this.lastResult = {
        at: capturedAt,
        published: false,
        reason: error && error.name === 'AbortError' ? 'DEBUG_TELEMETRY_TIMEOUT' : 'DEBUG_TELEMETRY_REMOTE_WRITE_FAILED',
        code: bounded(error && error.message || error, 128)
      };
      return { ...this.lastResult };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  status() {
    return {
      mode: 'supabase-debug-telemetry-sink',
      configured: this.enabled(),
      table: this.table,
      source: this.source,
      timeoutMs: this.timeoutMs,
      maxPayloadBytes: this.maxPayloadBytes,
      credentialsExternal: true,
      credentialsExposed: false,
      urlExposed: false,
      actionAuthority: false,
      gameplayActionAuthority: false,
      lastResult: this.lastResult ? { ...this.lastResult } : null,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  SupabaseDebugTelemetrySink,
  sanitizeDebugPayload,
  secretKey,
  deriveRunId,
  DEBUG_TELEMETRY_SCHEMA_VERSION,
  DEFAULT_DEBUG_TELEMETRY_TABLE,
  DEFAULT_MAX_PAYLOAD_BYTES,
  DEFAULT_TIMEOUT_MS,
  REDACTED
};
