import r2Worker from './worker-r2-logs.js';
import {
  R2_ARCHIVE_MIN_WRITE_MS,
  budgetPolicy,
  reserveR2ClassABudget,
  reserveR2ClassBBudget,
  reserveR2LiveStorageBudget
} from './free-tier-budget.js';

const WORKER_NAME = 'aio-bot-dashboard';
const R2_BINDING = 'LOG_ARCHIVE';
const R2_BUCKET = 'aio-v3-logs';
const lastR2WriteAt = new Map();

function bytesOf(value) {
  if (typeof value === 'string') return new TextEncoder().encode(value).byteLength;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  return Number(value && value.size) || 0;
}

function archiveScope(key) {
  const parts = String(key || '').split('/');
  if (parts[0] !== 'logs' || !parts[1] || !parts[2]) return 'unknown';
  return `${parts[1]}:${parts[2]}`;
}

function budgetError(result) {
  const error = new Error(`${result.reason}${result.period ? ` (${result.period})` : ''}`);
  error.code = result.reason;
  error.freeTierBudget = result;
  return error;
}

function guardedArchiveBinding(env) {
  const bucket = env && env.LOG_ARCHIVE;
  if (!bucket || typeof bucket.put !== 'function') return bucket;
  return {
    async put(key, value, options) {
      const now = Date.now();
      const scope = archiveScope(key);
      const last = Number(lastR2WriteAt.get(scope)) || 0;
      if (last && now - last < R2_ARCHIVE_MIN_WRITE_MS) {
        throw budgetError({ ok: false, reason: 'R2_ARCHIVE_FREE_TIER_THROTTLED', retryAfterMs: R2_ARCHIVE_MIN_WRITE_MS - (now - last) });
      }
      const classABudget = await reserveR2ClassABudget(env, now);
      if (!classABudget.ok) throw budgetError(classABudget);
      const storageBudget = await reserveR2LiveStorageBudget(env, bytesOf(value), now);
      if (!storageBudget.ok) throw budgetError(storageBudget);
      const result = await bucket.put(key, value, options);
      lastR2WriteAt.set(scope, now);
      return result;
    },
    async list(...args) {
      const budget = await reserveR2ClassABudget(env, Date.now());
      if (!budget.ok) throw budgetError(budget);
      return bucket.list(...args);
    },
    async get(...args) {
      const budget = await reserveR2ClassBBudget(env, Date.now());
      if (!budget.ok) throw budgetError(budget);
      return bucket.get(...args);
    }
  };
}

function guardedEnv(env) {
  return { ...env, LOG_ARCHIVE: guardedArchiveBinding(env) };
}

async function withFreeTierHealth(request, response) {
  if (request.method !== 'GET' || new URL(request.url).pathname !== '/api/health') return response;
  try {
    const payload = await response.clone().json();
    const endpoint = new URL(request.url).origin;
    return new Response(JSON.stringify({
      ...payload,
      cloudflareConfiguration: {
        worker: WORKER_NAME,
        endpoint,
        r2Binding: R2_BINDING,
        r2Bucket: R2_BUCKET,
        freeTierGuard: budgetPolicy()
      }
    }), {
      status: response.status,
      headers: { ...Object.fromEntries(response.headers), 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  } catch (_) {
    return response;
  }
}

export { archiveScope, bytesOf, guardedArchiveBinding, WORKER_NAME, R2_BINDING, R2_BUCKET };

export default {
  async fetch(request, env, ctx) {
    const response = await r2Worker.fetch(request, guardedEnv(env), ctx);
    return withFreeTierHealth(request, response);
  }
};
