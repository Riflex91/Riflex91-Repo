import alpha2022Worker from './worker-alpha20-22.js';
import {
  archiveNdjson,
  archiveObjectKey,
  filterImportantEvents,
  normalizedArchiveEvents,
  redactDeep,
  safeSegment,
  sha256Hex,
  text
} from './r2-log-policy.js';

const DEFAULT_PUSH_ORIGINS = ['https://adventure.land', 'https://www.adventure.land'];
const MAX_JSON_BYTES = 512 * 1024;
const R2_LIST_MAX = 200;
const lastArchiveDigest = new Map();
const RELEASE_OBJECTS = Object.freeze({
  '/v3/src/release-version.js': 'releases/v3/src/release-version.js',
  '/v3/dist/aio-v3.js': 'releases/v3/dist/aio-v3.js'
});

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function securityHeaders() {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'cache-control': 'no-store'
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...securityHeaders(),
      ...extra
    }
  });
}

function pushOrigins(env) {
  return String(env.PUSH_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .concat(DEFAULT_PUSH_ORIGINS)
    .filter((value, index, rows) => rows.indexOf(value) === index);
}

function originAllowed(request, env) {
  const origin = request.headers.get('origin');
  return !origin || pushOrigins(env).includes(origin);
}

async function digest(value) {
  return sha256Hex(String(value || ''));
}

async function secretMatches(given, expected) {
  if (!expected || !given) return false;
  const [left, right] = await Promise.all([digest(given), digest(expected)]);
  return left === right;
}

async function requireRead(request, env) {
  return secretMatches(request.headers.get('x-aio-read-key'), env.READ_KEY);
}

async function readJsonClone(request, max = MAX_JSON_BYTES) {
  const copy = request.clone();
  const length = number(copy.headers.get('content-length'), 0);
  if (length > max) return null;
  const raw = await copy.text();
  if (!raw || raw.length > max) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function filteredRuntimeRequest(request, body) {
  const next = {
    ...body,
    status: {
      ...body.status,
      events: filterImportantEvents(body.status && body.status.events)
    }
  };
  const headers = new Headers(request.headers);
  headers.set('content-type', 'application/json');
  headers.delete('content-length');
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify(next),
    redirect: request.redirect
  });
}

async function archiveRuntimeEvents(body, env) {
  const events = body && body.status && Array.isArray(body.status.events) ? body.status.events : [];
  if (!events.length) return { ok: true, archived: false, eventCount: 0, reason: 'NO_EVENTS' };
  if (!env.LOG_ARCHIVE || typeof env.LOG_ARCHIVE.put !== 'function') {
    return { ok: false, archived: false, eventCount: events.length, reason: 'R2_BINDING_UNAVAILABLE' };
  }

  const account = safeSegment(body.account || 'default');
  const character = safeSegment(body.character, 'unknown', 80);
  const receivedAt = Date.now();
  const normalized = normalizedArchiveEvents(redactDeep(events), receivedAt);
  const digestMaterial = JSON.stringify(normalized);
  const batchDigest = await sha256Hex(digestMaterial);
  const cacheKey = `${account}:${character}`;
  if (lastArchiveDigest.get(cacheKey) === batchDigest) {
    return {
      ok: true,
      archived: false,
      duplicate: true,
      eventCount: events.length,
      batchId: batchDigest.slice(0, 24)
    };
  }

  const ndjson = archiveNdjson({ account, character, receivedAt, events });
  const key = archiveObjectKey({
    account,
    character,
    receivedAt,
    events,
    batchId: batchDigest.slice(0, 24)
  });
  await env.LOG_ARCHIVE.put(key, ndjson, {
    httpMetadata: { contentType: 'application/x-ndjson; charset=utf-8' },
    customMetadata: {
      schema: 'aio-v3-r2-log-batch-v1',
      account,
      character,
      eventCount: String(events.length),
      receivedAt: String(receivedAt),
      batchId: batchDigest.slice(0, 24)
    }
  });
  lastArchiveDigest.set(cacheKey, batchDigest);
  return {
    ok: true,
    archived: true,
    eventCount: events.length,
    key,
    batchId: batchDigest.slice(0, 24),
    bytes: new TextEncoder().encode(ndjson).byteLength
  };
}

async function withArchiveMeta(response, archive) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return response;
  try {
    const payload = await response.clone().json();
    return json(
      {
        ...payload,
        logArchive: archive,
        loggingPolicy: {
          rawEvents: 'R2',
          d1Events: 'important-only',
          importantSeverities: ['warn', 'warning', 'error', 'critical', 'fatal', 'emergency', 'alert']
        }
      },
      response.status,
      Object.fromEntries(response.headers)
    );
  } catch (_) {
    return response;
  }
}

async function handleRuntime(request, env, ctx) {
  const body = await readJsonClone(request);
  if (!body || !body.status || typeof body.status !== 'object') {
    return alpha2022Worker.fetch(request, env, ctx);
  }
  if (!originAllowed(request, env) || !(await secretMatches(body.writeKey, env.WRITE_KEY))) {
    return alpha2022Worker.fetch(request, env, ctx);
  }

  let archive;
  try {
    archive = await archiveRuntimeEvents(body, env);
  } catch (error) {
    archive = {
      ok: false,
      archived: false,
      eventCount: Array.isArray(body.status.events) ? body.status.events.length : 0,
      reason: 'R2_ARCHIVE_WRITE_FAILED',
      message: text(error && error.message || error, 180)
    };
  }

  const response = await alpha2022Worker.fetch(filteredRuntimeRequest(request, body), env, ctx);
  return withArchiveMeta(response, archive);
}

async function handleReleaseArtifact(request, env, path) {
  const key = RELEASE_OBJECTS[path];
  const cors = { 'access-control-allow-origin': '*' };
  if (!key) return json({ ok: false, error: 'release artifact not found' }, 404, cors);
  if (!env.LOG_ARCHIVE || typeof env.LOG_ARCHIVE.get !== 'function') {
    return json({ ok: false, error: 'R2_BINDING_UNAVAILABLE' }, 503, cors);
  }
  const object = await env.LOG_ARCHIVE.get(key);
  if (!object) return json({ ok: false, error: 'release artifact not published' }, 404, cors);
  const headers = new Headers(securityHeaders());
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('cache-control', 'no-store, max-age=0');
  if (object.httpEtag || object.etag) headers.set('etag', object.httpEtag || object.etag);
  return new Response(object.body, { status: 200, headers });
}

async function handleArchiveList(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!env.LOG_ARCHIVE || typeof env.LOG_ARCHIVE.list !== 'function') {
    return json({ ok: false, error: 'R2_BINDING_UNAVAILABLE' }, 503);
  }
  const url = new URL(request.url);
  const account = safeSegment(url.searchParams.get('account') || 'default');
  const characterRaw = text(url.searchParams.get('character'), 80);
  const character = characterRaw ? safeSegment(characterRaw, 'unknown', 80) : null;
  const limit = Math.max(1, Math.min(R2_LIST_MAX, number(url.searchParams.get('limit'), 100)));
  const prefix = character ? `logs/${account}/${character}/` : `logs/${account}/`;
  const options = { prefix, limit, include: ['httpMetadata', 'customMetadata'] };
  const cursor = text(url.searchParams.get('cursor'), 1000);
  if (cursor) options.cursor = cursor;
  const result = await env.LOG_ARCHIVE.list(options);
  return json({
    ok: true,
    account,
    character,
    prefix,
    truncated: result.truncated === true,
    cursor: result.truncated ? result.cursor || null : null,
    objects: (result.objects || []).map((object) => ({
      key: object.key,
      size: number(object.size),
      uploaded: object.uploaded || null,
      etag: object.etag || null,
      customMetadata: object.customMetadata || {}
    }))
  });
}

async function handleArchiveObject(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!env.LOG_ARCHIVE || typeof env.LOG_ARCHIVE.get !== 'function') {
    return json({ ok: false, error: 'R2_BINDING_UNAVAILABLE' }, 503);
  }
  const url = new URL(request.url);
  const account = safeSegment(url.searchParams.get('account') || 'default');
  const key = text(url.searchParams.get('key'), 1000);
  const prefix = `logs/${account}/`;
  if (!key || !key.startsWith(prefix) || key.includes('..')) {
    return json({ ok: false, error: 'invalid archive key' }, 400);
  }
  const object = await env.LOG_ARCHIVE.get(key);
  if (!object) return json({ ok: false, error: 'archive object not found' }, 404);
  const headers = new Headers(securityHeaders());
  object.writeHttpMetadata(headers);
  headers.set('content-type', headers.get('content-type') || 'application/x-ndjson; charset=utf-8');
  if (object.httpEtag || object.etag) headers.set('etag', object.httpEtag || object.etag);
  headers.set('content-disposition', `attachment; filename="${key.split('/').pop().replace(/[^A-Za-z0-9_.-]/g, '_')}"`);
  return new Response(object.body, { status: 200, headers });
}

async function handleHealth(request, env, ctx) {
  const response = await alpha2022Worker.fetch(request, env, ctx);
  try {
    const payload = await response.clone().json();
    return json({
      ...payload,
      r2LogArchive: {
        enabled: !!env.LOG_ARCHIVE,
        binding: 'LOG_ARCHIVE',
        bucket: 'aio-v3-logs',
        rawEvents: 'R2',
        d1Events: 'important-only',
        listEndpoint: '/api/v3/log-archives',
        objectEndpoint: '/api/v3/log-archive'
      },
      v3ReleaseMirror: {
        enabled: !!env.LOG_ARCHIVE,
        releaseVersionEndpoint: '/v3/src/release-version.js',
        bundleEndpoint: '/v3/dist/aio-v3.js',
        publicReadOnly: true
      }
    }, response.status, Object.fromEntries(response.headers));
  } catch (_) {
    return response;
  }
}

export {
  RELEASE_OBJECTS,
  archiveRuntimeEvents,
  filteredRuntimeRequest,
  handleReleaseArtifact,
  handleArchiveList,
  handleArchiveObject
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET' && RELEASE_OBJECTS[path]) return handleReleaseArtifact(request, env, path);
    if (request.method === 'POST' && path === '/api/v3/runtime') return handleRuntime(request, env, ctx);
    if (request.method === 'GET' && path === '/api/v3/log-archives') return handleArchiveList(request, env);
    if (request.method === 'GET' && path === '/api/v3/log-archive') return handleArchiveObject(request, env);
    if (request.method === 'GET' && path === '/api/health') return handleHealth(request, env, ctx);
    return alpha2022Worker.fetch(request, env, ctx);
  }
};
