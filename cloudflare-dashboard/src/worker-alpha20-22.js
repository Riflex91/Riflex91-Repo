import alpha2021Worker from './worker-alpha20-21.js';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_SCHEMA, defaultSettings } from './settings-schema.js';

const DEFAULT_PUSH_ORIGINS = ['https://adventure.land', 'https://www.adventure.land'];
const RUNTIME_MIN_WRITE_MS = 15000;
const EVENT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const EVENT_BATCH_MAX = 24;
const RETENTION_SWEEP_MS = 60 * 60 * 1000;

let d1CircuitUntil = 0;
let d1LastError = null;
let lastRetentionSweepAt = 0;
const runtimeWriteAt = new Map();

function number(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function text(v, max = 300) { return String(v == null ? '' : v).trim().slice(0, max); }
function safeAccount(v) { const x = text(v || 'default', 100).replace(/[^A-Za-z0-9_.:@-]/g, '_'); return x || 'default'; }
function securityHeaders() { return { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' }; }
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...securityHeaders(), ...extra } }); }
function pushOrigins(env) { return String(env.PUSH_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean).concat(DEFAULT_PUSH_ORIGINS).filter((x, i, a) => a.indexOf(x) === i); }
function corsFor(request, env) { const origin = request.headers.get('origin'); if (!origin) return {}; if (!pushOrigins(env).includes(origin)) return null; return { 'access-control-allow-origin': origin, 'vary': 'origin', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'content-type' }; }
async function digest(v) { const bytes = new TextEncoder().encode(String(v || '')); const hash = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, '0')).join(''); }
async function secretMatches(given, expected) { if (!expected || !given) return false; const [a, b] = await Promise.all([digest(given), digest(expected)]); return a === b; }
async function requireRead(request, env) { return secretMatches(request.headers.get('x-aio-read-key'), env.READ_KEY); }
async function readJson(request, max = 512 * 1024) { const len = number(request.headers.get('content-length'), 0); if (len > max) throw Object.assign(new Error('payload too large'), { status: 413 }); const raw = await request.text(); if (raw.length > max) throw Object.assign(new Error('payload too large'), { status: 413 }); try { return JSON.parse(raw); } catch (_) { throw Object.assign(new Error('invalid JSON'), { status: 400 }); } }
function redactDeep(value, depth = 0) { if (depth > 8) return null; if (Array.isArray(value)) return value.slice(0, 300).map(x => redactDeep(x, depth + 1)); if (!value || typeof value !== 'object') return value; const out = {}; for (const [k, v] of Object.entries(value)) { if (/(write.?key|read.?key|admin.?key|authorization|api.?key|secret|token)/i.test(k)) { out[k] = '[REDACTED]'; continue; } out[k] = redactDeep(v, depth + 1); } return out; }
function eventTime(e, fallback) { const raw = e && (e.at || e.ts || e.time || e.createdAt); const n = Number(raw); if (Number.isFinite(n) && n > 1e12) return n; const parsed = Date.parse(String(raw || '')); return Number.isFinite(parsed) ? parsed : fallback; }
function eventKey(e, i, fallback) { return text(e && (e.seq != null ? e.seq : e.id) || `${fallback}-${i}-${e && e.component || 'x'}-${e && e.event || 'event'}`, 160); }
function utcDay(ts = Date.now()) { return new Date(ts).toISOString().slice(0, 10); }
function quotaResetAt(now = Date.now()) { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 1, 0, 0); }
function d1QuotaError(error) { return /\b7500\b|D1_DAILY_ROW_READ_LIMIT|daily row read limit|exceeded D1'?s free tier daily row read/i.test(String(error && error.message || error || '')); }
function armD1Circuit(error) { d1CircuitUntil = Math.max(d1CircuitUntil, quotaResetAt()); d1LastError = { at: Date.now(), code: 'D1_DAILY_ROW_READ_LIMIT', message: text(error && error.message || error, 240) }; }
function d1Blocked() { return Date.now() < d1CircuitUntil; }
function quotaMeta() { const now = Date.now(); return { degraded: true, reason: 'D1_DAILY_ROW_READ_LIMIT', retryAfterMs: Math.max(0, d1CircuitUntil - now), resetAt: d1CircuitUntil || null, lastErrorAt: d1LastError && d1LastError.at || null }; }
function quotaResponse(request, env, status = 429) { const cors = corsFor(request, env); const retry = Math.max(60, Math.ceil(Math.max(0, d1CircuitUntil - Date.now()) / 1000)); return json({ ok: false, error: 'D1_DAILY_ROW_READ_LIMIT', ...quotaMeta() }, status, { ...(cors || {}), 'retry-after': String(retry) }); }
function degradedSettings(account) { const now = Date.now(); return { ok: true, account, schemaVersion: SETTINGS_SCHEMA_VERSION, schema: SETTINGS_SCHEMA, settings: { schemaVersion: SETTINGS_SCHEMA_VERSION, revision: 0, updatedAt: 0, values: defaultSettings() }, database: { available: false, readOnlyFallback: true, ...quotaMeta() }, now }; }
function degradedOverview(account) { return { ok: true, now: Date.now(), account, characters: [], settings: { schemaVersion: SETTINGS_SCHEMA_VERSION, revision: 0, updatedAt: 0 }, brainUsage: { day: utcDay(), neurons: 0, requests: 0, updatedAt: 0 }, database: { available: false, quotaEfficientOverview: true, runtimeStatuses: null, brainStates: null, events: null, brainDecisions: null, learningEvents: null, settingAudits: null, ...quotaMeta() } }; }

async function settingsGet22(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const url = new URL(request.url), account = safeAccount(url.searchParams.get('account') || 'default');
  if (d1Blocked()) return json(degradedSettings(account));
  try {
    const row = await env.DB.prepare('SELECT schema_version,revision,payload,updated_at FROM v3_control_settings WHERE account=?').bind(account).first();
    let values = defaultSettings(), revision = 0, updatedAt = 0, schemaVersion = SETTINGS_SCHEMA_VERSION;
    if (row) { try { values = { ...values, ...JSON.parse(row.payload || '{}') }; } catch (_) {} revision = number(row.revision); updatedAt = number(row.updated_at); schemaVersion = number(row.schema_version, SETTINGS_SCHEMA_VERSION); }
    return json({ ok: true, account, schemaVersion: SETTINGS_SCHEMA_VERSION, schema: SETTINGS_SCHEMA, settings: { schemaVersion, revision, updatedAt, values }, database: { available: true, quotaEfficientRead: true } });
  } catch (error) {
    if (!d1QuotaError(error)) throw error;
    armD1Circuit(error); return json(degradedSettings(account));
  }
}

async function overview22(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const url = new URL(request.url), account = safeAccount(url.searchParams.get('account') || 'default'), now = Date.now();
  if (d1Blocked()) return json(degradedOverview(account));
  try {
    const [runtimeRows, settingsRow, usage] = await Promise.all([
      env.DB.prepare('SELECT character,payload,received_at FROM v3_runtime_status WHERE account=? ORDER BY character').bind(account).all(),
      env.DB.prepare('SELECT schema_version,revision,updated_at FROM v3_control_settings WHERE account=?').bind(account).first(),
      env.DB.prepare('SELECT neurons,requests,updated_at FROM brain_usage WHERE day=?').bind(utcDay()).first()
    ]);
    const characters = (runtimeRows.results || []).map(r => { let status = {}; try { status = JSON.parse(r.payload); } catch (_) {} const ageSeconds = Math.max(0, Math.round((now - number(r.received_at)) / 1000)); return { character: r.character, receivedAt: number(r.received_at), ageSeconds, connectionState: ageSeconds <= 30 ? 'live' : ageSeconds <= 120 ? 'delayed' : 'offline', status }; });
    return json({ ok: true, now, account, characters, settings: { schemaVersion: number(settingsRow && settingsRow.schema_version, SETTINGS_SCHEMA_VERSION), revision: number(settingsRow && settingsRow.revision), updatedAt: number(settingsRow && settingsRow.updated_at) }, brainUsage: { day: utcDay(), neurons: number(usage && usage.neurons), requests: number(usage && usage.requests), updatedAt: number(usage && usage.updated_at) }, database: { available: true, quotaEfficientOverview: true, runtimeStatuses: characters.length, brainStates: null, events: null, brainDecisions: null, learningEvents: null, settingAudits: null } });
  } catch (error) {
    if (!d1QuotaError(error)) throw error;
    armD1Circuit(error); return json(degradedOverview(account));
  }
}

async function runtime22(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403);
  let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {});
  const account = safeAccount(body.account), character = text(body.character, 80); if (!character || !body.status || typeof body.status !== 'object') return json({ ok: false, error: 'character and status required' }, 400, cors || {});
  if (d1Blocked()) return quotaResponse(request, env);
  const now = Date.now(), key = `${account}:${character}`, last = number(runtimeWriteAt.get(key), 0);
  if (last && now - last < RUNTIME_MIN_WRITE_MS) return json({ ok: true, throttled: true, account, character, retryAfterMs: RUNTIME_MIN_WRITE_MS - (now - last), policy: 'alpha20.22-d1-write-budget' }, 202, cors || {});
  const clean = redactDeep(body.status);
  try {
    const statements = [env.DB.prepare('INSERT INTO v3_runtime_status(account,character,payload,received_at) VALUES(?,?,?,?) ON CONFLICT(account,character) DO UPDATE SET payload=excluded.payload,received_at=excluded.received_at').bind(account, character, JSON.stringify(clean), now)];
    const events = Array.isArray(clean.events) ? clean.events.slice(-EVENT_BATCH_MAX) : [];
    for (let i = 0; i < events.length; i += 1) {
      const e = events[i];
      statements.push(env.DB.prepare('INSERT OR IGNORE INTO v3_runtime_events(account,character,event_key,severity,component,event,reason,payload,event_at,received_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(account, character, eventKey(e, i, now), text(e && e.severity || 'info', 20), text(e && e.component, 80), text(e && e.event, 120), text(e && e.reason, 300), JSON.stringify(redactDeep(e && e.data || {})).slice(0, 12000), eventTime(e, now), now));
    }
    await env.DB.batch(statements);
    runtimeWriteAt.set(key, now);
    if (now - lastRetentionSweepAt >= RETENTION_SWEEP_MS) {
      lastRetentionSweepAt = now;
      try { await env.DB.prepare('DELETE FROM v3_runtime_events WHERE account=? AND event_at<?').bind(account, now - EVENT_RETENTION_MS).run(); } catch (_) {}
    }
    return json({ ok: true, account, character, receivedAt: now, eventCount: events.length, policies: { runtimeMinWriteMs: RUNTIME_MIN_WRITE_MS, eventBatchMax: EVENT_BATCH_MAX, retentionSweepMs: RETENTION_SWEEP_MS, retentionUsesIndexedEventAt: true } }, 200, cors || {});
  } catch (error) {
    if (!d1QuotaError(error)) throw error;
    armD1Circuit(error); return quotaResponse(request, env);
  }
}

async function degradedAuthenticatedGet(request, env, kind) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const account = safeAccount(new URL(request.url).searchParams.get('account') || 'default');
  if (kind === 'brain') return json({ ok: true, account, character: null, receivedAt: null, brain: null, usage: { day: utcDay(), neurons: 0, requests: 0, updatedAt: 0 }, decisions: [], outcomes: [], database: { available: false, ...quotaMeta() } });
  return json({ ok: true, account, events: [], database: { available: false, ...quotaMeta() } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url), path = url.pathname;
    if (request.method === 'OPTIONS' && path.startsWith('/api/v3/')) { const cors = corsFor(request, env); if (cors === null) return new Response(null, { status: 403, headers: securityHeaders() }); return new Response(null, { status: 204, headers: { ...securityHeaders(), ...(cors || {}) } }); }
    if (request.method === 'GET' && path === '/api/v3/overview') return overview22(request, env);
    if (request.method === 'GET' && path === '/api/v3/settings') return settingsGet22(request, env);
    if (request.method === 'POST' && path === '/api/v3/runtime') return runtime22(request, env);
    if (d1Blocked()) {
      if (request.method === 'GET' && path === '/api/v3/brain') return degradedAuthenticatedGet(request, env, 'brain');
      if (request.method === 'GET' && path === '/api/v3/events') return degradedAuthenticatedGet(request, env, 'events');
      if (path.startsWith('/api/v3/')) return quotaResponse(request, env, request.method === 'GET' ? 503 : 429);
    }
    try {
      const response = await alpha2021Worker.fetch(request, env, ctx);
      if (request.method === 'GET' && path === '/api/health') {
        try {
          const payload = await response.clone().json();
          return json({ ...payload, alpha20_22: { d1QuotaResilience: true, runtimeMinWriteMs: RUNTIME_MIN_WRITE_MS, eventBatchMax: EVENT_BATCH_MAX, retentionSweepMs: RETENTION_SWEEP_MS, d1CircuitOpen: d1Blocked(), d1CircuitUntil: d1CircuitUntil || null } }, response.status, Object.fromEntries(response.headers));
        } catch (_) { return response; }
      }
      return response;
    } catch (error) {
      if (!d1QuotaError(error)) throw error;
      armD1Circuit(error);
      if (request.method === 'GET' && path === '/api/v3/brain') return degradedAuthenticatedGet(request, env, 'brain');
      if (request.method === 'GET' && path === '/api/v3/events') return degradedAuthenticatedGet(request, env, 'events');
      return quotaResponse(request, env, request.method === 'GET' ? 503 : 429);
    }
  }
};
