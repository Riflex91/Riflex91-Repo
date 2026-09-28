const GENERATION = 6;
const PROTOCOL = 'albot-v6-bridge-v1';
const RUNTIME_PUSH_TYPE = 'ALBOT_V6_RUNTIME_PUSH';
const RUNTIME_MIN_WRITE_MS = 15_000;
const EVENT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const EVENT_BATCH_MAX = 24;
const MAX_BODY_BYTES = 512 * 1024;

const runtimeWriteAt = new Map();
let lastRetentionSweepAt = 0;

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

function text(value, max = 200) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeAccount(value) {
  const account = text(value || 'default', 100);
  return /^[A-Za-z0-9._-]+$/.test(account) ? account : 'default';
}

async function digest(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, '0')).join('');
}

async function secretMatches(given, expected) {
  if (!given || !expected) return false;
  const [left, right] = await Promise.all([digest(given), digest(expected)]);
  return left === right;
}

async function requireRead(request, env) {
  return secretMatches(request.headers.get('x-aio-read-key'), env.READ_KEY);
}

async function readJson(request) {
  const declared = number(request.headers.get('content-length'), 0);
  if (declared > MAX_BODY_BYTES) throw Object.assign(new Error('payload too large'), { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw Object.assign(new Error('payload too large'), { status: 413 });
  try { return JSON.parse(raw); }
  catch (_) { throw Object.assign(new Error('invalid JSON'), { status: 400 }); }
}

function redactDeep(value, depth = 0, key = '') {
  if (depth > 8) return null;
  if (Array.isArray(value)) return value.slice(0, 300).map(row => redactDeep(row, depth + 1, ''));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (/(write.?key|read.?key|admin.?key|authorization|api.?key|secret|token)/i.test(k)) {
      out[k] = '[REDACTED]';
      continue;
    }
    out[k] = redactDeep(v, depth + 1, k);
  }
  return out;
}

function eventTime(event, fallback) {
  const raw = event && (event.at || event.ts || event.time || event.createdAt);
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 1e12) return numeric;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function eventKey(event, index, fallback) {
  return text(event && (event.seq != null ? event.seq : event.id)
    || `${fallback}-${index}-${event && event.component || 'x'}-${event && event.event || 'event'}`, 160);
}

function buildEventStatements(env, account, character, cleanEvents, now) {
  return cleanEvents.map((event, i) => {
    const row = event || {};
    return env.DB.prepare(
      'INSERT OR IGNORE INTO v6_runtime_events(account,character,event_key,severity,component,event,reason,payload,event_at,received_at) VALUES(?,?,?,?,?,?,?,?,?,?)'
    ).bind(
      account,
      character,
      eventKey(row, i, now),
      text(row.severity || 'info', 20),
      text(row.component, 80),
      text(row.event, 120),
      text(row.reason, 300),
      JSON.stringify(redactDeep(row.data || {})).slice(0, 12000),
      eventTime(row, now),
      now
    );
  });
}

function requestIdentity(request) {
  return {
    botId: text(request.headers.get('x-albot-bot-id'), 128),
    generation: number(request.headers.get('x-albot-generation'), 0),
    protocol: text(request.headers.get('x-albot-bridge-protocol'), 100)
  };
}

function validRequestIdentity(identity) {
  return !!identity.botId
    && identity.generation === GENERATION
    && identity.protocol === PROTOCOL;
}

function validBodyIdentity(body, headerIdentity) {
  return body
    && body.type === RUNTIME_PUSH_TYPE
    && number(body.generation, 0) === GENERATION
    && text(body.bridgeProtocol, 100) === PROTOCOL
    && text(body.botId, 128) === headerIdentity.botId;
}

function legacyTransportBlocked(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = String(request.method || 'GET').toUpperCase();

  if (path === '/api/v3/runtime') return true;
  if (path === '/api/v3/sync') return true;
  if (path.startsWith('/api/v3/persistence/')) return true;
  if (path.startsWith('/api/v3/brain/teacher')) return true;
  if (path.startsWith('/api/v3/brain/feedback')) return true;
  if (path === '/api/v3/automation-catalog' && method !== 'GET') return true;
  return false;
}

function legacyBlockedResponse() {
  return json({
    ok: false,
    error: 'legacy bot transport retired',
    requiredGeneration: GENERATION,
    requiredProtocol: PROTOCOL,
    historicalReadOnly: true
  }, 410);
}

async function handleRuntime(request, env) {
  if (!env.ALBOT_V6_WRITE_KEY)
    return json({ ok: false, error: 'ALBOT_V6_WRITE_KEY not configured' }, 503);

  const identity = requestIdentity(request);
  if (!validRequestIdentity(identity))
    return json({ ok: false, error: 'invalid V6 bridge identity' }, 403);

  if (!(await secretMatches(request.headers.get('x-albot-write-key'), env.ALBOT_V6_WRITE_KEY)))
    return json({ ok: false, error: 'unauthorized' }, 401);

  let body;
  try { body = await readJson(request); }
  catch (error) { return json({ ok: false, error: error.message }, error.status || 400); }

  if (!validBodyIdentity(body, identity))
    return json({ ok: false, error: 'invalid V6 runtime payload identity' }, 400);

  const account = safeAccount(body.account);
  const character = text(body.character, 80);
  if (!character || !body.status || typeof body.status !== 'object')
    return json({ ok: false, error: 'character and status required' }, 400);

  const snapshotIdentity = body.status && body.status.identity;
  if (!snapshotIdentity
      || snapshotIdentity.product !== 'AL Bot'
      || number(snapshotIdentity.generation, 0) !== GENERATION
      || text(snapshotIdentity.bridgeProtocol, 100) !== PROTOCOL
      || snapshotIdentity.transportOnly !== true
      || snapshotIdentity.gameplayActionAuthority !== false
      || snapshotIdentity.acceptsLegacyGenerations !== false) {
    return json({ ok: false, error: 'snapshot is not an AL Bot V6 transport snapshot' }, 400);
  }

  const now = Date.now();
  const cleanStatus = redactDeep(body.status);
  const cleanEvents = Array.isArray(body.events) ? body.events.slice(-EVENT_BATCH_MAX).map(row => redactDeep(row)) : [];
  const eventStatements = buildEventStatements(env, account, character, cleanEvents, now);

  const throttleKey = `${account}:${character}`;
  const last = number(runtimeWriteAt.get(throttleKey), 0);
  if (last && now - last < RUNTIME_MIN_WRITE_MS) {
    // Status writes are throttled, but event batches must still be durably stored:
    // the Windows Bridge treats every 2xx response as safe to acknowledge.
    if (eventStatements.length > 0) await env.DB.batch(eventStatements);
    return json({
      ok: true,
      throttled: true,
      account,
      character,
      eventCount: cleanEvents.length,
      eventsPersisted: cleanEvents.length,
      retryAfterMs: RUNTIME_MIN_WRITE_MS - (now - last),
      policy: 'albot-v6-d1-write-budget'
    }, 202);
  }

  const statements = [
    env.DB.prepare(
      'INSERT INTO v6_runtime_status(account,character,bot_id,protocol,payload,received_at) VALUES(?,?,?,?,?,?) '
      + 'ON CONFLICT(account,character) DO UPDATE SET bot_id=excluded.bot_id,protocol=excluded.protocol,payload=excluded.payload,received_at=excluded.received_at'
    ).bind(account, character, identity.botId, PROTOCOL, JSON.stringify(cleanStatus), now),
    ...eventStatements
  ];

  await env.DB.batch(statements);
  runtimeWriteAt.set(throttleKey, now);

  if (now - lastRetentionSweepAt >= 60 * 60 * 1000) {
    lastRetentionSweepAt = now;
    try {
      // One hourly sweep removes expired rows for every account, so cleanup is
      // not coupled to whichever account happens to write first.
      await env.DB.prepare('DELETE FROM v6_runtime_events WHERE event_at<?')
        .bind(now - EVENT_RETENTION_MS)
        .run();
    } catch (_) {}
  }

  return json({
    ok: true,
    generation: GENERATION,
    protocol: PROTOCOL,
    account,
    character,
    receivedAt: now,
    eventCount: cleanEvents.length,
    policies: {
      runtimeMinWriteMs: RUNTIME_MIN_WRITE_MS,
      eventBatchMax: EVENT_BATCH_MAX,
      retentionMs: EVENT_RETENTION_MS,
      legacyWritesAccepted: false
    }
  });
}

async function handleOverview(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const url = new URL(request.url);
  const account = safeAccount(url.searchParams.get('account') || 'default');
  const now = Date.now();

  const [runtimeRows, settingsRow] = await Promise.all([
    env.DB.prepare('SELECT character,bot_id,protocol,payload,received_at FROM v6_runtime_status WHERE account=? ORDER BY character')
      .bind(account)
      .all(),
    env.DB.prepare('SELECT schema_version,revision,updated_at FROM v3_control_settings WHERE account=?')
      .bind(account)
      .first()
      .catch(() => null)
  ]);

  const characters = (runtimeRows.results || []).map(row => {
    let status = {};
    try { status = JSON.parse(row.payload || '{}'); } catch (_) {}
    const ageSeconds = Math.max(0, Math.round((now - number(row.received_at)) / 1000));
    return {
      character: row.character,
      botId: row.bot_id,
      protocol: row.protocol,
      receivedAt: number(row.received_at),
      ageSeconds,
      connectionState: ageSeconds <= 30 ? 'live' : ageSeconds <= 120 ? 'delayed' : 'offline',
      status
    };
  });

  return json({
    ok: true,
    generation: GENERATION,
    protocol: PROTOCOL,
    now,
    account,
    characters,
    settings: {
      schemaVersion: number(settingsRow && settingsRow.schema_version, 0),
      revision: number(settingsRow && settingsRow.revision, 0),
      updatedAt: number(settingsRow && settingsRow.updated_at, 0)
    },
    database: {
      available: true,
      namespace: 'v6',
      runtimeStatuses: characters.length,
      historicalV3ReadOnly: true
    }
  });
}

async function handleEvents(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const url = new URL(request.url);
  const account = safeAccount(url.searchParams.get('account') || 'default');
  const limit = Math.max(1, Math.min(250, number(url.searchParams.get('limit'), 80)));
  const rows = await env.DB.prepare(
    'SELECT character,event_key,severity,component,event,reason,payload,event_at,received_at '
    + 'FROM v6_runtime_events WHERE account=? ORDER BY event_at DESC LIMIT ?'
  ).bind(account, limit).all();

  return json({
    ok: true,
    generation: GENERATION,
    protocol: PROTOCOL,
    account,
    events: (rows.results || []).map(row => {
      let data = {};
      try { data = JSON.parse(row.payload || '{}'); } catch (_) {}
      return {
        character: row.character,
        eventKey: row.event_key,
        severity: row.severity,
        component: row.component,
        event: row.event,
        reason: row.reason,
        data,
        eventAt: number(row.event_at),
        receivedAt: number(row.received_at)
      };
    })
  });
}

async function handleV6Request(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === 'POST' && path === '/api/v6/runtime') return handleRuntime(request, env);
  if (request.method === 'GET' && path === '/api/v6/overview') return handleOverview(request, env);
  if (request.method === 'GET' && path === '/api/v6/events') return handleEvents(request, env);
  return null;
}

export {
  GENERATION,
  PROTOCOL,
  RUNTIME_PUSH_TYPE,
  RUNTIME_MIN_WRITE_MS,
  EVENT_BATCH_MAX,
  legacyTransportBlocked,
  legacyBlockedResponse,
  handleV6Request,
  validRequestIdentity,
  validBodyIdentity
};
