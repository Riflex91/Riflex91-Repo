const WORKERS_FREE_DAILY_REQUEST_LIMIT = 100000;
const WORKERS_INTERNAL_DAILY_TARGET = 95000;
const R2_FREE_MONTHLY_CLASS_A_LIMIT = 1000000;
const R2_MONTHLY_CLASS_A_BUDGET = 950000;
const R2_FREE_MONTHLY_CLASS_B_LIMIT = 10000000;
const R2_MONTHLY_CLASS_B_BUDGET = 9500000;
const R2_FREE_STORAGE_BYTES = 10_000_000_000;
const R2_LIVE_STORAGE_BUDGET_BYTES = 9_500_000_000;
const R2_STORAGE_WINDOW_DAYS = 8;
const R2_ARCHIVE_MIN_WRITE_MS = 15000;
const R2_OBJECT_MAX_BYTES = 256 * 1024;
const R2_LIFECYCLE_DAYS = 7;
let budgetSchemaReady = false;

function monthKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 7);
}

function dayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function storageWindowStart(now = Date.now()) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - (R2_STORAGE_WINDOW_DAYS - 1));
  return date.toISOString().slice(0, 10);
}

function budgetPolicy() {
  return {
    workers: { freeDailyRequests: WORKERS_FREE_DAILY_REQUEST_LIMIT, internalDailyTarget: WORKERS_INTERNAL_DAILY_TARGET, targetFraction: 0.95 },
    r2: {
      freeMonthlyClassA: R2_FREE_MONTHLY_CLASS_A_LIMIT,
      monthlyClassABudget: R2_MONTHLY_CLASS_A_BUDGET,
      freeMonthlyClassB: R2_FREE_MONTHLY_CLASS_B_LIMIT,
      monthlyClassBBudget: R2_MONTHLY_CLASS_B_BUDGET,
      freeStorageBytes: R2_FREE_STORAGE_BYTES,
      liveStorageBudgetBytes: R2_LIVE_STORAGE_BUDGET_BYTES,
      storageWindowDays: R2_STORAGE_WINDOW_DAYS,
      archiveMinWriteMs: R2_ARCHIVE_MIN_WRITE_MS,
      maxObjectBytes: R2_OBJECT_MAX_BYTES,
      lifecycleDays: R2_LIFECYCLE_DAYS,
      standardStorageOnly: true,
      failClosed: true
    }
  };
}

async function ensureBudgetSchema(env) {
  if (!env || !env.DB || typeof env.DB.prepare !== 'function') return false;
  if (budgetSchemaReady) return true;
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS r2_archive_budget (period TEXT PRIMARY KEY, class_a_ops INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)').run();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS r2_archive_read_budget (period TEXT PRIMARY KEY, class_b_ops INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)').run();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS r2_archive_daily_budget (day TEXT PRIMARY KEY, bytes INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)').run();
    budgetSchemaReady = true;
    return true;
  } catch (_) {
    return false;
  }
}

async function reserveR2ClassABudget(env, now = Date.now()) {
  const period = monthKey(now);
  if (!(await ensureBudgetSchema(env))) return { ok: false, reason: 'R2_BUDGET_DB_UNAVAILABLE', period };
  try {
    const row = await env.DB.prepare(`INSERT INTO r2_archive_budget(period,class_a_ops,updated_at)
      VALUES(?,1,?)
      ON CONFLICT(period) DO UPDATE SET class_a_ops=r2_archive_budget.class_a_ops+1,updated_at=excluded.updated_at
      WHERE r2_archive_budget.class_a_ops < ?
      RETURNING class_a_ops,updated_at`)
      .bind(period, now, R2_MONTHLY_CLASS_A_BUDGET)
      .first();
    if (!row) return { ok: false, reason: 'R2_MONTHLY_CLASS_A_BUDGET_EXHAUSTED', period, limits: budgetPolicy().r2 };
    return {
      ok: true,
      period,
      classAOps: Number(row.class_a_ops) || 0,
      remainingClassA: Math.max(0, R2_MONTHLY_CLASS_A_BUDGET - (Number(row.class_a_ops) || 0))
    };
  } catch (error) {
    return { ok: false, reason: 'R2_CLASS_A_BUDGET_RESERVATION_FAILED', period, message: String(error && error.message || error).slice(0, 180) };
  }
}

async function reserveR2ClassBBudget(env, now = Date.now()) {
  const period = monthKey(now);
  if (!(await ensureBudgetSchema(env))) return { ok: false, reason: 'R2_BUDGET_DB_UNAVAILABLE', period };
  try {
    const row = await env.DB.prepare(`INSERT INTO r2_archive_read_budget(period,class_b_ops,updated_at)
      VALUES(?,1,?)
      ON CONFLICT(period) DO UPDATE SET class_b_ops=r2_archive_read_budget.class_b_ops+1,updated_at=excluded.updated_at
      WHERE r2_archive_read_budget.class_b_ops < ?
      RETURNING class_b_ops,updated_at`)
      .bind(period, now, R2_MONTHLY_CLASS_B_BUDGET)
      .first();
    if (!row) return { ok: false, reason: 'R2_MONTHLY_CLASS_B_BUDGET_EXHAUSTED', period, limits: budgetPolicy().r2 };
    return { ok: true, period, classBOps: Number(row.class_b_ops) || 0, remainingClassB: Math.max(0, R2_MONTHLY_CLASS_B_BUDGET - (Number(row.class_b_ops) || 0)) };
  } catch (error) {
    return { ok: false, reason: 'R2_CLASS_B_BUDGET_RESERVATION_FAILED', period, message: String(error && error.message || error).slice(0, 180) };
  }
}

async function reserveR2LiveStorageBudget(env, bytes = 0, now = Date.now()) {
  const safeBytes = Math.max(0, Math.floor(Number(bytes) || 0));
  const day = dayKey(now);
  if (!(await ensureBudgetSchema(env))) return { ok: false, reason: 'R2_BUDGET_DB_UNAVAILABLE', day };
  if (safeBytes > R2_OBJECT_MAX_BYTES) {
    return { ok: false, reason: 'R2_ARCHIVE_OBJECT_TOO_LARGE', day, bytes: safeBytes, maxBytes: R2_OBJECT_MAX_BYTES };
  }
  try {
    const windowStart = storageWindowStart(now);
    if (safeBytes > 0) {
      const row = await env.DB.prepare(`INSERT INTO r2_archive_daily_budget(day,bytes,updated_at)
        SELECT ?,?,?
        WHERE (SELECT COALESCE(SUM(bytes),0) FROM r2_archive_daily_budget WHERE day>=?) + ? <= ?
        ON CONFLICT(day) DO UPDATE SET bytes=r2_archive_daily_budget.bytes+excluded.bytes,updated_at=excluded.updated_at
        WHERE (SELECT COALESCE(SUM(bytes),0) FROM r2_archive_daily_budget WHERE day>=?) + excluded.bytes <= ?
        RETURNING bytes,updated_at`)
        .bind(day, safeBytes, now, windowStart, safeBytes, R2_LIVE_STORAGE_BUDGET_BYTES, windowStart, R2_LIVE_STORAGE_BUDGET_BYTES)
        .first();
      if (!row) return { ok: false, reason: 'R2_STORAGE_FREE_TIER_BUDGET_EXHAUSTED', day, limits: budgetPolicy().r2 };
    }
    const window = await env.DB.prepare('SELECT COALESCE(SUM(bytes),0) AS bytes FROM r2_archive_daily_budget WHERE day>=?').bind(windowStart).first();
    const liveBytes = Math.max(0, Number(window && window.bytes) || 0);
    if (liveBytes > R2_LIVE_STORAGE_BUDGET_BYTES) {
      return { ok: false, reason: 'R2_STORAGE_FREE_TIER_BUDGET_EXHAUSTED', day, liveBytes, limits: budgetPolicy().r2 };
    }
    return {
      ok: true,
      day,
      bytes: safeBytes,
      liveBytes,
      remainingLiveBytes: Math.max(0, R2_LIVE_STORAGE_BUDGET_BYTES - liveBytes)
    };
  } catch (error) {
    return { ok: false, reason: 'R2_STORAGE_BUDGET_RESERVATION_FAILED', day, message: String(error && error.message || error).slice(0, 180) };
  }
}

export {
  WORKERS_FREE_DAILY_REQUEST_LIMIT,
  WORKERS_INTERNAL_DAILY_TARGET,
  R2_FREE_MONTHLY_CLASS_A_LIMIT,
  R2_MONTHLY_CLASS_A_BUDGET,
  R2_FREE_MONTHLY_CLASS_B_LIMIT,
  R2_MONTHLY_CLASS_B_BUDGET,
  R2_FREE_STORAGE_BYTES,
  R2_LIVE_STORAGE_BUDGET_BYTES,
  R2_STORAGE_WINDOW_DAYS,
  R2_ARCHIVE_MIN_WRITE_MS,
  R2_OBJECT_MAX_BYTES,
  R2_LIFECYCLE_DAYS,
  monthKey,
  dayKey,
  storageWindowStart,
  budgetPolicy,
  ensureBudgetSchema,
  reserveR2ClassABudget,
  reserveR2ClassBBudget,
  reserveR2LiveStorageBudget
};
