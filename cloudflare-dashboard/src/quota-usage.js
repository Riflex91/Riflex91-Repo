import {
  WORKERS_FREE_DAILY_REQUEST_LIMIT,
  WORKERS_INTERNAL_DAILY_TARGET,
  R2_FREE_MONTHLY_CLASS_A_LIMIT,
  R2_MONTHLY_CLASS_A_BUDGET,
  R2_FREE_MONTHLY_CLASS_B_LIMIT,
  R2_MONTHLY_CLASS_B_BUDGET,
  R2_FREE_STORAGE_BYTES,
  R2_LIVE_STORAGE_BUDGET_BYTES,
  ensureBudgetSchema,
  monthKey,
  storageWindowStart
} from './free-tier-budget.js';

const D1_FREE_DAILY_ROWS_READ_LIMIT = 5_000_000;
const D1_FREE_DAILY_ROWS_WRITTEN_LIMIT = 100_000;
const SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT = 500_000;
const USAGE_FLUSH_INTERVAL_MS = 60_000;
const QUOTA_SNAPSHOT_CACHE_MS = 15_000;
const SUPABASE_USAGE_CACHE_MS = 5 * 60_000;
const DEFAULT_SUPABASE_USAGE_URL = 'https://uasaygvcpusfevgmeqpk.supabase.co/functions/v1/bot-debug-ingest?mode=usage';
const rawStatement = new WeakMap();
const guardedDatabases = new WeakMap();
const pendingByDay = new Map();
let usageSchemaReady = false;
let flushPromise = null;
let lastFlushAt = 0;
let quotaCache = { at: 0, value: null };
let supabaseCache = { at: 0, value: null };

function dayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function nextUtcDay(now = Date.now()) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

function nextUtcMonth(now = Date.now()) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

function pending(day = dayKey()) {
  let row = pendingByDay.get(day);
  if (!row) {
    row = { workerRequests: 0, d1RowsRead: 0, d1RowsWritten: 0, startedAt: Date.now() };
    pendingByDay.set(day, row);
  }
  return row;
}

function recordUsage({ workerRequests = 0, d1RowsRead = 0, d1RowsWritten = 0 } = {}, now = Date.now()) {
  const row = pending(dayKey(now));
  row.workerRequests += Math.max(0, Math.floor(Number(workerRequests) || 0));
  row.d1RowsRead += Math.max(0, Math.floor(Number(d1RowsRead) || 0));
  row.d1RowsWritten += Math.max(0, Math.floor(Number(d1RowsWritten) || 0));
}

function recordWorkerRequest(now = Date.now()) {
  recordUsage({ workerRequests: 1 }, now);
}

function recordD1Meta(meta, now = Date.now()) {
  if (!meta || typeof meta !== 'object') return;
  recordUsage({ d1RowsRead: meta.rows_read, d1RowsWritten: meta.rows_written }, now);
}

function recordD1Result(result, now = Date.now()) {
  if (Array.isArray(result)) {
    result.forEach((row) => recordD1Result(row, now));
    return;
  }
  recordD1Meta(result && result.meta, now);
}

function wrapStatement(statement, sqlHint = '') {
  if (!statement || typeof statement !== 'object') return statement;
  const wrapper = new Proxy(statement, {
    get(target, prop) {
      if (prop === 'bind') return (...args) => wrapStatement(target.bind(...args), sqlHint);
      if (prop === 'all') return async (...args) => {
        const result = await target.all(...args);
        recordD1Result(result);
        return result;
      };
      if (prop === 'run') return async (...args) => {
        const result = await target.run(...args);
        recordD1Result(result);
        return result;
      };
      if (prop === 'first') return async (...args) => {
        const result = await target.first(...args);
        const mutating = /^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(String(sqlHint || ''));
        recordUsage({ d1RowsRead: 1, d1RowsWritten: mutating ? 1 : 0 });
        return result;
      };
      if (prop === 'raw') return async (...args) => {
        const result = await target.raw(...args);
        recordUsage({ d1RowsRead: Math.max(1, Array.isArray(result) ? result.length : 1) });
        return result;
      };
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  rawStatement.set(wrapper, statement);
  return wrapper;
}

function guardedD1Binding(db) {
  if (!db || typeof db.prepare !== 'function') return db;
  if (guardedDatabases.has(db)) return guardedDatabases.get(db);
  const guarded = new Proxy(db, {
    get(target, prop) {
      if (prop === 'prepare') return (sql) => wrapStatement(target.prepare(sql), sql);
      if (prop === 'batch') return async (statements) => {
        const source = (statements || []).map((statement) => rawStatement.get(statement) || statement);
        const result = await target.batch(source);
        recordD1Result(result);
        return result;
      };
      if (prop === 'exec') return async (...args) => {
        const result = await target.exec(...args);
        recordD1Result(result);
        return result;
      };
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  guardedDatabases.set(db, guarded);
  return guarded;
}

async function ensureUsageSchema(env) {
  const db = env && env.DB;
  if (!db || typeof db.prepare !== 'function') return false;
  if (usageSchemaReady) return true;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS cloud_usage_daily (
      day TEXT PRIMARY KEY,
      worker_requests INTEGER NOT NULL DEFAULT 0,
      d1_rows_read INTEGER NOT NULL DEFAULT 0,
      d1_rows_written INTEGER NOT NULL DEFAULT 0,
      tracking_started_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`).run();
    usageSchemaReady = true;
    return true;
  } catch (_) {
    return false;
  }
}

function mergePending(day, delta) {
  if (!delta) return;
  const row = pending(day);
  row.workerRequests += delta.workerRequests;
  row.d1RowsRead += delta.d1RowsRead;
  row.d1RowsWritten += delta.d1RowsWritten;
  row.startedAt = Math.min(row.startedAt || delta.startedAt, delta.startedAt || row.startedAt);
}

async function flushUsage(env, now = Date.now()) {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    if (!(await ensureUsageSchema(env))) return false;
    const rows = Array.from(pendingByDay.entries());
    if (!rows.length) return true;
    for (const [day, delta] of rows) {
      pendingByDay.delete(day);
      try {
        await env.DB.prepare(`INSERT INTO cloud_usage_daily(day,worker_requests,d1_rows_read,d1_rows_written,tracking_started_at,updated_at)
          VALUES(?,?,?,?,?,?)
          ON CONFLICT(day) DO UPDATE SET
            worker_requests=cloud_usage_daily.worker_requests+excluded.worker_requests,
            d1_rows_read=cloud_usage_daily.d1_rows_read+excluded.d1_rows_read,
            d1_rows_written=cloud_usage_daily.d1_rows_written+excluded.d1_rows_written,
            tracking_started_at=MIN(cloud_usage_daily.tracking_started_at,excluded.tracking_started_at),
            updated_at=excluded.updated_at`)
          .bind(day, delta.workerRequests, delta.d1RowsRead, delta.d1RowsWritten, delta.startedAt || now, now)
          .run();
        recordUsage({ d1RowsRead: 1, d1RowsWritten: 1 }, now);
      } catch (error) {
        mergePending(day, delta);
        throw error;
      }
    }
    lastFlushAt = now;
    return true;
  })().finally(() => { flushPromise = null; });
  return flushPromise;
}

function maybeFlushUsage(env, ctx, now = Date.now()) {
  if (flushPromise || now - lastFlushAt < USAGE_FLUSH_INTERVAL_MS || !pendingByDay.size) return;
  const task = flushUsage(env, now).catch(() => false);
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(task);
}

async function readTrackedUsage(env, now = Date.now()) {
  if (flushPromise) await flushPromise.catch(() => false);
  if (!(await ensureUsageSchema(env))) return null;
  const day = dayKey(now);
  const stored = await env.DB.prepare('SELECT worker_requests,d1_rows_read,d1_rows_written,tracking_started_at,updated_at FROM cloud_usage_daily WHERE day=?').bind(day).first();
  recordUsage({ d1RowsRead: 1 }, now);
  const local = pendingByDay.get(day) || { workerRequests: 0, d1RowsRead: 0, d1RowsWritten: 0, startedAt: now };
  return {
    day,
    workerRequests: Math.max(0, Number(stored && stored.worker_requests) || 0) + local.workerRequests,
    d1RowsRead: Math.max(0, Number(stored && stored.d1_rows_read) || 0) + local.d1RowsRead,
    d1RowsWritten: Math.max(0, Number(stored && stored.d1_rows_written) || 0) + local.d1RowsWritten,
    trackingStartedAt: Math.min(Number(stored && stored.tracking_started_at) || local.startedAt || now, local.startedAt || now),
    updatedAt: Math.max(Number(stored && stored.updated_at) || 0, now)
  };
}

async function readR2Usage(env, now = Date.now()) {
  if (!(await ensureBudgetSchema(env))) return null;
  const period = monthKey(now);
  const windowStart = storageWindowStart(now);
  const [classA, classB, storage] = await Promise.all([
    env.DB.prepare('SELECT class_a_ops FROM r2_archive_budget WHERE period=?').bind(period).first(),
    env.DB.prepare('SELECT class_b_ops FROM r2_archive_read_budget WHERE period=?').bind(period).first(),
    env.DB.prepare('SELECT COALESCE(SUM(bytes),0) AS bytes FROM r2_archive_daily_budget WHERE day>=?').bind(windowStart).first()
  ]);
  recordUsage({ d1RowsRead: 3 }, now);
  return {
    period,
    classAOps: Math.max(0, Number(classA && classA.class_a_ops) || 0),
    classBOps: Math.max(0, Number(classB && classB.class_b_ops) || 0),
    liveBytes: Math.max(0, Number(storage && storage.bytes) || 0),
    windowStart
  };
}

async function readSupabaseUsage(env, fetchFn, now = Date.now()) {
  if (supabaseCache.value && now - supabaseCache.at < SUPABASE_USAGE_CACHE_MS) return supabaseCache.value;
  const url = String(env && env.SUPABASE_USAGE_URL || DEFAULT_SUPABASE_USAGE_URL || '').trim();
  if (!url || typeof fetchFn !== 'function') return supabaseCache.value;
  try {
    const response = await fetchFn(url, { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok === false) throw new Error(payload && payload.error || `HTTP_${response.status}`);
    const value = {
      period: String(payload.period || monthKey(now)),
      used: Math.max(0, Number(payload.used) || 0),
      limit: Math.max(1, Number(payload.limit) || SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT),
      source: String(payload.source || 'successful-debug-ingests'),
      approximate: payload.approximate !== false,
      updatedAt: now,
      stale: false
    };
    supabaseCache = { at: now, value };
    return value;
  } catch (error) {
    if (!supabaseCache.value) return { period: monthKey(now), used: null, limit: SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT, source: 'unavailable', approximate: true, updatedAt: 0, stale: true, error: String(error && error.message || error).slice(0, 160) };
    return { ...supabaseCache.value, stale: true, error: String(error && error.message || error).slice(0, 160) };
  }
}

function remaining(limit, used) {
  return Math.max(0, Number(limit) - Math.max(0, Number(used) || 0));
}

async function getQuotaUsage(env, fetchFn = globalThis.fetch, now = Date.now()) {
  if (quotaCache.value && now - quotaCache.at < QUOTA_SNAPSHOT_CACHE_MS) return quotaCache.value;
  const [trackedResult, r2Result, supabase] = await Promise.allSettled([
    readTrackedUsage(env, now),
    readR2Usage(env, now),
    readSupabaseUsage(env, fetchFn, now)
  ]);
  const tracked = trackedResult.status === 'fulfilled' ? trackedResult.value : null;
  const r2 = r2Result.status === 'fulfilled' ? r2Result.value : null;
  const supabaseValue = supabase.status === 'fulfilled' ? supabase.value : null;
  const workerUsed = tracked && tracked.workerRequests;
  const d1Reads = tracked && tracked.d1RowsRead;
  const d1Writes = tracked && tracked.d1RowsWritten;
  const value = {
    generatedAt: now,
    trackingStartedAt: tracked && tracked.trackingStartedAt || null,
    worker: {
      period: dayKey(now),
      used: workerUsed == null ? null : workerUsed,
      limit: WORKERS_FREE_DAILY_REQUEST_LIMIT,
      target: WORKERS_INTERNAL_DAILY_TARGET,
      remaining: workerUsed == null ? null : remaining(WORKERS_INTERNAL_DAILY_TARGET, workerUsed),
      hardRemaining: workerUsed == null ? null : remaining(WORKERS_FREE_DAILY_REQUEST_LIMIT, workerUsed),
      resetAt: nextUtcDay(now)
    },
    d1: {
      period: dayKey(now),
      rowsRead: { used: d1Reads == null ? null : d1Reads, limit: D1_FREE_DAILY_ROWS_READ_LIMIT, remaining: d1Reads == null ? null : remaining(D1_FREE_DAILY_ROWS_READ_LIMIT, d1Reads) },
      rowsWritten: { used: d1Writes == null ? null : d1Writes, limit: D1_FREE_DAILY_ROWS_WRITTEN_LIMIT, remaining: d1Writes == null ? null : remaining(D1_FREE_DAILY_ROWS_WRITTEN_LIMIT, d1Writes) },
      resetAt: nextUtcDay(now),
      approximate: true
    },
    r2: {
      period: monthKey(now),
      classA: { used: r2 ? r2.classAOps : null, limit: R2_MONTHLY_CLASS_A_BUDGET, hardLimit: R2_FREE_MONTHLY_CLASS_A_LIMIT, remaining: r2 ? remaining(R2_MONTHLY_CLASS_A_BUDGET, r2.classAOps) : null },
      classB: { used: r2 ? r2.classBOps : null, limit: R2_MONTHLY_CLASS_B_BUDGET, hardLimit: R2_FREE_MONTHLY_CLASS_B_LIMIT, remaining: r2 ? remaining(R2_MONTHLY_CLASS_B_BUDGET, r2.classBOps) : null },
      storage: { used: r2 ? r2.liveBytes : null, limit: R2_LIVE_STORAGE_BUDGET_BYTES, hardLimit: R2_FREE_STORAGE_BYTES, remaining: r2 ? remaining(R2_LIVE_STORAGE_BUDGET_BYTES, r2.liveBytes) : null },
      resetAt: nextUtcMonth(now),
      storageWindowStart: r2 && r2.windowStart || null
    },
    supabase: supabaseValue ? {
      period: supabaseValue.period,
      used: supabaseValue.used,
      limit: supabaseValue.limit,
      remaining: supabaseValue.used == null ? null : remaining(supabaseValue.limit, supabaseValue.used),
      source: supabaseValue.source,
      approximate: supabaseValue.approximate,
      stale: supabaseValue.stale,
      updatedAt: supabaseValue.updatedAt
    } : { period: monthKey(now), used: null, limit: SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT, remaining: null, source: 'unavailable', approximate: true, stale: true, updatedAt: 0 }
  };
  quotaCache = { at: now, value };
  return value;
}

function quotaPolicy() {
  return {
    worker: { dailyLimit: WORKERS_FREE_DAILY_REQUEST_LIMIT, target: WORKERS_INTERNAL_DAILY_TARGET },
    d1: { dailyRowsRead: D1_FREE_DAILY_ROWS_READ_LIMIT, dailyRowsWritten: D1_FREE_DAILY_ROWS_WRITTEN_LIMIT },
    r2: { monthlyClassA: R2_MONTHLY_CLASS_A_BUDGET, monthlyClassB: R2_MONTHLY_CLASS_B_BUDGET, liveStorageBytes: R2_LIVE_STORAGE_BUDGET_BYTES },
    supabase: { monthlyEdgeInvocations: SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT }
  };
}

export {
  D1_FREE_DAILY_ROWS_READ_LIMIT,
  D1_FREE_DAILY_ROWS_WRITTEN_LIMIT,
  SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT,
  DEFAULT_SUPABASE_USAGE_URL,
  dayKey,
  nextUtcDay,
  nextUtcMonth,
  quotaPolicy,
  recordWorkerRequest,
  recordD1Meta,
  guardedD1Binding,
  flushUsage,
  maybeFlushUsage,
  getQuotaUsage
};
