import r2Worker from './worker-r2-logs.js';
import {
  R2_ARCHIVE_MIN_WRITE_MS,
  budgetPolicy,
  reserveR2ClassABudget,
  reserveR2ClassBBudget,
  reserveR2LiveStorageBudget
} from './free-tier-budget.js';
import {
  getQuotaUsage,
  guardedD1Binding,
  maybeFlushUsage,
  quotaPolicy,
  recordWorkerRequest
} from './quota-usage.js';
import {
  RUNTIME_RELEASE_PATH,
  handleRuntimeReleaseArtifact,
  isRuntimeReleaseRead
} from './runtime-release-artifact.js';

const WORKER_NAME = 'aio-bot-dashboard';
const R2_BINDING = 'LOG_ARCHIVE';
const R2_BUCKET = 'aio-v3-logs';
const PUBLIC_RELEASE_PATHS = new Set([
  '/v3/src/release-version.js',
  '/v3/dist/aio-v3.js',
  RUNTIME_RELEASE_PATH
]);
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

function isPublicReleaseRead(request) {
  if (!request || request.method !== 'GET') return false;
  try {
    return PUBLIC_RELEASE_PATHS.has(new URL(request.url).pathname);
  } catch (_) {
    return false;
  }
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

function guardedEnv(env, options = {}) {
  const next = { ...env, DB: guardedD1Binding(env && env.DB) };
  next.LOG_ARCHIVE = options.directReleaseRead
    ? env && env.LOG_ARCHIVE
    : guardedArchiveBinding(next);
  return next;
}

function jsonResponse(payload, response) {
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(payload), { status: response.status, headers });
}

async function withQuotaOverview(request, response, env) {
  if (request.method !== 'GET' || new URL(request.url).pathname !== '/api/v3/overview') return response;
  if (response.status >= 400) return response;
  try {
    const payload = await response.clone().json();
    if (!payload || payload.ok === false) return response;
    const quotaUsage = await getQuotaUsage(env, globalThis.fetch, Date.now());
    return jsonResponse({ ...payload, quotaUsage }, response);
  } catch (_) {
    return response;
  }
}

async function withFreeTierHealth(request, response) {
  if (request.method !== 'GET' || new URL(request.url).pathname !== '/api/health') return response;
  try {
    const payload = await response.clone().json();
    const endpoint = new URL(request.url).origin;
    return jsonResponse({
      ...payload,
      cloudflareConfiguration: {
        worker: WORKER_NAME,
        endpoint,
        r2Binding: R2_BINDING,
        r2Bucket: R2_BUCKET,
        freeTierGuard: budgetPolicy(),
        quotaDisplay: quotaPolicy()
      }
    }, response);
  } catch (_) {
    return response;
  }
}

export {
  PUBLIC_RELEASE_PATHS,
  archiveScope,
  bytesOf,
  guardedArchiveBinding,
  guardedEnv,
  isPublicReleaseRead,
  WORKER_NAME,
  R2_BINDING,
  R2_BUCKET
};

export default {
  async fetch(request, env, ctx) {
    const now = Date.now();
    recordWorkerRequest(now);
    const releaseRead = isPublicReleaseRead(request);
    let response;
    if (isRuntimeReleaseRead(request)) {
      response = await handleRuntimeReleaseArtifact(request, env);
    } else {
      response = await r2Worker.fetch(request, guardedEnv(env, { directReleaseRead: releaseRead }), ctx);
    }
    response = await withQuotaOverview(request, response, env);
    response = await withFreeTierHealth(request, response);
    maybeFlushUsage(env, ctx, now);
    return response;
  }
};