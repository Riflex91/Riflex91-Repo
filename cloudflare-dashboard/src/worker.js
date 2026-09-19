import { DASHBOARD_HTML } from './dashboard.js';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_SCHEMA, SETTINGS_BY_KEY, defaultSettings, sanitizeSettingsPatch } from './settings-schema.js';

const DEFAULT_PUSH_ORIGINS = ['https://adventure.land', 'https://www.adventure.land'];
const MAX_JSON_BYTES = 512 * 1024;
const AUTOMATION_CATALOG_MAX_JSON_BYTES = 2 * 1024 * 1024;
const ADVENTURE_LAND_DATA_URL = 'https://adventure.land/data.js';
const OFFICIAL_AUTOMATION_DATA_MAX_BYTES = 12 * 1024 * 1024;
const OFFICIAL_AUTOMATION_CATALOG_REFRESH_MS = 6 * 60 * 60 * 1000;
let officialAutomationCatalogCache = null;
const BRAIN_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
const INPUT_NEURONS_PER_TOKEN = 4625 / 1_000_000;
const OUTPUT_NEURONS_PER_TOKEN = 30475 / 1_000_000;
const EVENT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

function number(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function text(v, max = 300) { return String(v == null ? '' : v).trim().slice(0, max); }
function safeAccount(v) { const x = text(v || 'default', 100).replace(/[^A-Za-z0-9_.:@-]/g, '_'); return x || 'default'; }
function utcDay(ts = Date.now()) { return new Date(ts).toISOString().slice(0, 10); }
function securityHeaders() { return { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' }; }
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...securityHeaders(), ...extra } }); }
function pushOrigins(env) { return String(env.PUSH_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean).concat(DEFAULT_PUSH_ORIGINS).filter((x, i, a) => a.indexOf(x) === i); }
function corsFor(request, env) { const origin = request.headers.get('origin'); if (!origin) return {}; if (!pushOrigins(env).includes(origin)) return null; return { 'access-control-allow-origin': origin, 'vary': 'origin', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'content-type' }; }
async function digest(v) { const bytes = new TextEncoder().encode(String(v || '')); const hash = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, '0')).join(''); }
async function secretMatches(given, expected) { if (!expected || !given) return false; const [a, b] = await Promise.all([digest(given), digest(expected)]); return a === b; }
async function requireRead(request, env) { return secretMatches(request.headers.get('x-aio-read-key'), env.READ_KEY); }
async function requireAdmin(request, env) { return secretMatches(request.headers.get('x-aio-admin-key'), env.ADMIN_KEY); }
async function readJson(request, max = MAX_JSON_BYTES) { const len = number(request.headers.get('content-length'), 0); if (len > max) throw Object.assign(new Error('payload too large'), { status: 413 }); const raw = await request.text(); if (raw.length > max) throw Object.assign(new Error('payload too large'), { status: 413 }); try { return JSON.parse(raw); } catch (_) { throw Object.assign(new Error('invalid JSON'), { status: 400 }); } }
export function redactDeep(value, depth = 0, key = '') { if (depth > 8) return null; if (Array.isArray(value)) { const limit = key === 'automationCatalog' ? 5000 : 300; return value.slice(0, limit).map(x => redactDeep(x, depth + 1, '')); } if (!value || typeof value !== 'object') return value; const out = {}; for (const [k, v] of Object.entries(value)) { if (/(write.?key|read.?key|admin.?key|authorization|api.?key|secret|token)/i.test(k)) { out[k] = '[REDACTED]'; continue; } out[k] = redactDeep(v, depth + 1, k); } return out; }
export function sanitizeAutomationCatalogPayload(body) { const raw = Array.isArray(body && body.catalog) ? body.catalog : []; const wrapped = redactDeep({ automationCatalog: raw }); const catalog = Array.isArray(wrapped && wrapped.automationCatalog) ? wrapped.automationCatalog : []; return { catalogVersion: Math.max(0, number(body && body.catalogVersion, 0)), catalogCount: catalog.length, declaredCount: Math.max(0, number(body && body.catalogCount, catalog.length)), catalog }; }
export function parseAdventureLandDataJs(source) {
  const raw = String(source == null ? '' : source).trim();
  if (!raw.startsWith('var G=')) throw new Error('Adventure Land data.js format invalid');
  let payload = raw.slice(6).trim();
  if (payload.endsWith(';')) payload = payload.slice(0, -1).trim();
  const parsed = JSON.parse(payload);
  if (!parsed || typeof parsed !== 'object' || !parsed.items || typeof parsed.items !== 'object') throw new Error('Adventure Land item data missing');
  return parsed;
}
function adventureLandAssetUrl(file) {
  const value = String(file == null ? '' : file).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return 'https:' + value;
  return 'https://adventure.land/' + value.replace(/^\/+/, '');
}
function officialSpritePosition(gameData, skin) {
  const direct = skin && gameData && gameData.positions && gameData.positions[skin];
  if (Array.isArray(direct)) return direct;
  for (const [packName, pack] of Object.entries(gameData && gameData.imagesets || {})) {
    const matrix = Array.isArray(pack && pack.matrix) ? pack.matrix : [];
    for (let y = 0; y < matrix.length; y += 1) {
      const row = Array.isArray(matrix[y]) ? matrix[y] : [];
      for (let x = 0; x < row.length; x += 1) {
        const cell = row[x];
        if (cell === skin || (Array.isArray(cell) && cell.includes(skin))) return [packName, x, y];
      }
    }
  }
  return null;
}
function officialSpriteRows(gameData, packName, pack) {
  const explicit = Number(pack && pack.rows);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  if (Array.isArray(pack && pack.matrix) && pack.matrix.length) return pack.matrix.length;
  let maxY = -1;
  for (const position of Object.values(gameData && gameData.positions || {})) {
    if (!Array.isArray(position) || (position[0] || 'pack_20') !== packName) continue;
    const y = Number(position[2]);
    if (Number.isFinite(y) && y >= 0) maxY = Math.max(maxY, y);
  }
  return maxY >= 0 ? maxY + 1 : null;
}
export function officialAutomationSpriteMeta(gameData, skin) {
  const position = officialSpritePosition(gameData, skin);
  const packName = Array.isArray(position) && position[0] || 'pack_20';
  const pack = gameData && gameData.imagesets && gameData.imagesets[packName];
  const file = adventureLandAssetUrl(pack && pack.file);
  const x = Number(Array.isArray(position) ? position[1] : NaN);
  const y = Number(Array.isArray(position) ? position[2] : NaN);
  const size = Number(pack && pack.size);
  const columns = Number(pack && pack.columns);
  const rows = officialSpriteRows(gameData, packName, pack);
  if (!skin || !file || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0 || !Number.isFinite(columns) || columns <= 0 || !Number.isFinite(rows) || rows <= 0) return null;
  return { skin, file, x, y, size, columns, rows };
}
export function officialAutomationCatalogFromGameData(gameData) {
  const rows = [];
  for (const [id, def] of Object.entries(gameData && gameData.items || {})) {
    if (!def || typeof def !== 'object' || Array.isArray(def)) continue;
    const classes = [].concat(def.class || def.classes || []).map(value => String(value || '').toLowerCase()).filter(Boolean);
    const level = Number(def.level != null ? def.level : def.req != null ? def.req : def.requirement);
    const baseGold = Number(def.g);
    rows.push({
      id,
      name: def.name || id,
      type: def.type || null,
      wtype: def.wtype || null,
      level: Number.isFinite(level) ? level : null,
      grade: Number.isFinite(Number(def.grade)) ? Number(def.grade) : null,
      classes,
      npc: [],
      upgrade: !!def.upgrade,
      compound: !!def.compound,
      exchange: !!(def.exchange || def.e),
      quest: !!(def.quest || def.q),
      cash: !!def.cash,
      soulbound: !!def.soulbound,
      special: !!def.special,
      goldValue: Number.isFinite(baseGold) ? baseGold : null,
      description: def.explanation || def.description || null,
      grades: Array.isArray(def.grades) ? def.grades.slice(0, 6) : [],
      itemGrade: Number.isFinite(Number(def.igrade)) ? Number(def.igrade) : 0,
      economy: { baseGold: Number.isFinite(baseGold) ? baseGold : null, progression: def.upgrade ? 'UPGRADE' : def.compound ? 'COMPOUND' : null, npcSellValues: [], baseChances: [] },
      skin: def.skin_c || def.skin || null,
      sprite: officialAutomationSpriteMeta(gameData, def.skin_c || def.skin || null),
      official: true
    });
  }
  rows.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
  return rows;
}
export function mergeAutomationCatalogRows(officialRows, storedRows) {
  const merged = new Map();
  for (const row of Array.isArray(officialRows) ? officialRows : []) {
    const id = text(row && row.id, 160); if (id) merged.set(id, { ...row, id });
  }
  for (const row of Array.isArray(storedRows) ? storedRows : []) {
    const id = text(row && row.id, 160); if (!id) continue;
    const official = merged.get(id) || {};
    const next = { ...official, ...row, id };
    if (!next.sprite && official.sprite) next.sprite = official.sprite;
    if (!next.skin && official.skin) next.skin = official.skin;
    merged.set(id, next);
  }
  return [...merged.values()].sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
}
async function loadOfficialAutomationCatalog() {
  const now = Date.now();
  if (officialAutomationCatalogCache && now - officialAutomationCatalogCache.fetchedAt < OFFICIAL_AUTOMATION_CATALOG_REFRESH_MS) return officialAutomationCatalogCache;
  const response = await fetch(ADVENTURE_LAND_DATA_URL, { headers: { accept: 'application/javascript' }, cf: { cacheEverything: true, cacheTtl: Math.floor(OFFICIAL_AUTOMATION_CATALOG_REFRESH_MS / 1000) } });
  if (!response.ok) throw new Error('Adventure Land data.js HTTP ' + response.status);
  const raw = await response.text();
  if (raw.length > OFFICIAL_AUTOMATION_DATA_MAX_BYTES) throw new Error('Adventure Land data.js too large');
  const gameData = parseAdventureLandDataJs(raw);
  const items = officialAutomationCatalogFromGameData(gameData);
  if (items.length <= 300) throw new Error('Adventure Land official item catalog unexpectedly capped');
  officialAutomationCatalogCache = { items, gameVersion: gameData.version || null, fetchedAt: now };
  return officialAutomationCatalogCache;
}
function eventTime(e, fallback) { const raw = e && (e.at || e.ts || e.time || e.createdAt); const n = Number(raw); if (Number.isFinite(n) && n > 1e12) return n; const parsed = Date.parse(String(raw || '')); return Number.isFinite(parsed) ? parsed : fallback; }
function eventKey(e, i, fallback) { return text(e && (e.seq != null ? e.seq : e.id) || `${fallback}-${i}-${e && e.component || 'x'}-${e && e.event || 'event'}`, 160); }
function tokenEstimate(s) { return Math.ceil(String(s || '').length / 3.6); }
function parseBrainText(result) { let x = result && (result.response || result.result || result.output_text || result.text); if (Array.isArray(x)) x = x.map(v => typeof v === 'string' ? v : v && v.text || '').join(''); if (x && typeof x === 'object') return x; const raw = String(x || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''); try { return JSON.parse(raw); } catch (_) { const m = raw.match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch (_) { return null; } } }
const ACTIONS = ['continue', 'change_farm_target', 'replan_merchant', 'explore', 'wait'];
function cleanDecision(x) { if (!x || !ACTIONS.includes(String(x.action))) return null; const scores = {}; let sum = 0; for (const a of ACTIONS) { scores[a] = Math.max(0, number(x.scores && x.scores[a], 0)); sum += scores[a]; } if (!sum) { for (const a of ACTIONS) scores[a] = a === x.action ? 1 : 0; sum = 1; } for (const a of ACTIONS) scores[a] /= sum; return { action: String(x.action), target: text(x.target, 100), confidence: Math.max(0, Math.min(1, number(x.confidence, 0))), scores, reason: text(x.reason, 360), lesson: text(x.lesson, 500), expected: x.expected && typeof x.expected === 'object' ? { xpDeltaPct: number(x.expected.xpDeltaPct), goldDeltaPct: number(x.expected.goldDeltaPct), safetyDeltaPct: number(x.expected.safetyDeltaPct), freeSlotsDelta: number(x.expected.freeSlotsDelta) } : null, recheckSeconds: Math.max(5, Math.min(1800, number(x.recheckSeconds, 60))) }; }

async function ensureDb(env) {
  const ddl = [
    `CREATE TABLE IF NOT EXISTS brain_usage(day TEXT PRIMARY KEY, neurons REAL NOT NULL DEFAULT 0, requests INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS brain_decisions(id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT NOT NULL, character TEXT NOT NULL, trigger TEXT, decision TEXT NOT NULL, neurons REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS brain_learning_events(id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT NOT NULL, character TEXT NOT NULL, event_type TEXT NOT NULL, action TEXT, target TEXT, reward REAL NOT NULL DEFAULT 0, payload TEXT, created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS v3_runtime_status(account TEXT NOT NULL, character TEXT NOT NULL, payload TEXT NOT NULL, received_at INTEGER NOT NULL, PRIMARY KEY(account,character))`,
    `CREATE TABLE IF NOT EXISTS v3_automation_catalog(account TEXT NOT NULL, character TEXT NOT NULL, catalog_version INTEGER NOT NULL DEFAULT 0, catalog_count INTEGER NOT NULL DEFAULT 0, declared_count INTEGER NOT NULL DEFAULT 0, payload TEXT NOT NULL, received_at INTEGER NOT NULL, PRIMARY KEY(account,character))`,
    `CREATE TABLE IF NOT EXISTS v3_control_settings(account TEXT PRIMARY KEY, schema_version INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 0, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS v3_control_audit(id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT NOT NULL, revision INTEGER NOT NULL, patch TEXT NOT NULL, rejected TEXT, actor TEXT NOT NULL DEFAULT 'dashboard', created_at INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS v3_brain_state(account TEXT NOT NULL, character TEXT NOT NULL, samples INTEGER NOT NULL DEFAULT 0, updates INTEGER NOT NULL DEFAULT 0, payload TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(account,character))`,
    `CREATE TABLE IF NOT EXISTS v3_runtime_events(id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT NOT NULL, character TEXT NOT NULL, event_key TEXT NOT NULL, severity TEXT, component TEXT, event TEXT, reason TEXT, payload TEXT, event_at INTEGER NOT NULL, received_at INTEGER NOT NULL, UNIQUE(account,character,event_key))`,
    `CREATE INDEX IF NOT EXISTS idx_v3_runtime_received_at ON v3_runtime_status(received_at)`,
    `CREATE INDEX IF NOT EXISTS idx_v3_automation_catalog_account_at ON v3_automation_catalog(account,received_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_v3_runtime_events_account_at ON v3_runtime_events(account,event_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_v3_control_audit_account_at ON v3_control_audit(account,created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_brain_decisions_created_at ON brain_decisions(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_brain_learning_events_created_at ON brain_learning_events(created_at)`
  ];
  await env.DB.batch(ddl.map(sql => env.DB.prepare(sql)));
}

async function getSettings(env, account) {
  const a = safeAccount(account); const row = await env.DB.prepare('SELECT schema_version,revision,payload,updated_at FROM v3_control_settings WHERE account=?').bind(a).first();
  if (row) { let values = defaultSettings(); try { values = { ...values, ...JSON.parse(row.payload || '{}') }; } catch (_) {} return { schemaVersion: number(row.schema_version, SETTINGS_SCHEMA_VERSION), revision: number(row.revision), updatedAt: number(row.updated_at), values }; }
  const values = defaultSettings(), now = Date.now(); await env.DB.prepare('INSERT INTO v3_control_settings(account,schema_version,revision,payload,updated_at) VALUES(?,?,?,?,?)').bind(a, SETTINGS_SCHEMA_VERSION, 0, JSON.stringify(values), now).run(); return { schemaVersion: SETTINGS_SCHEMA_VERSION, revision: 0, updatedAt: now, values };
}

async function handleSettingsGet(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401); await ensureDb(env); const url = new URL(request.url), account = safeAccount(url.searchParams.get('account') || 'default'); const settings = await getSettings(env, account); return json({ ok: true, account, schemaVersion: SETTINGS_SCHEMA_VERSION, schema: SETTINGS_SCHEMA, settings });
}

async function handleSettingsPatch(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401); if (!(await requireAdmin(request, env))) return json({ ok: false, error: 'admin authorization required' }, 403); await ensureDb(env);
  let body; try { body = await readJson(request, 128 * 1024); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400); }
  const account = safeAccount(body.account || 'default'); const current = await getSettings(env, account); if (body.expectedRevision != null && number(body.expectedRevision, -1) !== current.revision) return json({ ok: false, error: 'settings revision conflict', currentRevision: current.revision }, 409);
  const { accepted, rejected } = sanitizeSettingsPatch(body.patch || {}); const values = { ...current.values, ...accepted }; const revision = current.revision + 1, now = Date.now();
  await env.DB.batch([
    env.DB.prepare('UPDATE v3_control_settings SET schema_version=?,revision=?,payload=?,updated_at=? WHERE account=?').bind(SETTINGS_SCHEMA_VERSION, revision, JSON.stringify(values), now, account),
    env.DB.prepare('INSERT INTO v3_control_audit(account,revision,patch,rejected,actor,created_at) VALUES(?,?,?,?,?,?)').bind(account, revision, JSON.stringify(accepted), JSON.stringify(rejected), 'dashboard', now)
  ]);
  return json({ ok: true, account, schemaVersion: SETTINGS_SCHEMA_VERSION, schema: SETTINGS_SCHEMA, settings: { schemaVersion: SETTINGS_SCHEMA_VERSION, revision, updatedAt: now, values }, accepted, rejected });
}

async function storeEvents(env, account, character, events, receivedAt) {
  const rows = Array.isArray(events) ? events.slice(-120) : []; if (!rows.length) return 0;
  const statements = rows.map((e, i) => env.DB.prepare('INSERT OR IGNORE INTO v3_runtime_events(account,character,event_key,severity,component,event,reason,payload,event_at,received_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(account, character, eventKey(e, i, receivedAt), text(e && e.severity || 'info', 20), text(e && e.component, 80), text(e && e.event, 120), text(e && e.reason, 300), JSON.stringify(redactDeep(e && e.data || {})).slice(0, 12000), eventTime(e, receivedAt), receivedAt));
  for (let i = 0; i < statements.length; i += 50) await env.DB.batch(statements.slice(i, i + 50));
  await env.DB.prepare('DELETE FROM v3_runtime_events WHERE account=? AND received_at<?').bind(account, receivedAt - EVENT_RETENTION_MS).run(); return rows.length;
}

async function handleAutomationCatalogPost(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403); await ensureDb(env); let body; try { body = await readJson(request, AUTOMATION_CATALOG_MAX_JSON_BYTES); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {});
  const account = safeAccount(body.account), character = text(body.character, 80); if (!character) return json({ ok: false, error: 'character required' }, 400, cors || {});
  const clean = sanitizeAutomationCatalogPayload(body); if (!clean.catalog.length) return json({ ok: false, error: 'automation catalog required' }, 400, cors || {});
  const now = Date.now();
  await env.DB.prepare('INSERT INTO v3_automation_catalog(account,character,catalog_version,catalog_count,declared_count,payload,received_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(account,character) DO UPDATE SET catalog_version=excluded.catalog_version,catalog_count=excluded.catalog_count,declared_count=excluded.declared_count,payload=excluded.payload,received_at=excluded.received_at').bind(account, character, clean.catalogVersion, clean.catalogCount, clean.declaredCount, JSON.stringify(clean.catalog), now).run();
  return json({ ok: true, account, character, catalogVersion: clean.catalogVersion, catalogCount: clean.catalogCount, declaredCount: clean.declaredCount, receivedAt: now }, 200, cors || {});
}

async function handleAutomationCatalogGet(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401);
  const url = new URL(request.url), account = safeAccount(url.searchParams.get('account') || 'default');
  let row = null, storedItems = [], databaseAvailable = true, databaseError = null;
  try {
    await ensureDb(env);
    row = await env.DB.prepare('SELECT character,catalog_version,catalog_count,declared_count,payload,received_at FROM v3_automation_catalog WHERE account=? ORDER BY received_at DESC LIMIT 1').bind(account).first();
    if (row) { try { storedItems = JSON.parse(row.payload || '[]'); } catch (_) { storedItems = []; } }
    if (!Array.isArray(storedItems)) storedItems = [];
  } catch (error) {
    databaseAvailable = false;
    databaseError = text(error && error.message || error, 240);
  }

  const storedDeclared = number(row && row.declared_count, storedItems.length);
  const storedVersion = number(row && row.catalog_version, 0);
  const storedComplete = storedItems.length > 300 && storedVersion >= 3 && (!storedDeclared || storedDeclared <= storedItems.length);
  let official = null, officialError = null;
  if (!storedComplete) {
    try { official = await loadOfficialAutomationCatalog(); }
    catch (error) { officialError = text(error && error.message || error, 240); }
  }

  const items = mergeAutomationCatalogRows(official && official.items, storedItems);
  if (!items.length) return json({ ok: true, account, catalog: null, database: { available: databaseAvailable, error: databaseError }, official: { available: false, error: officialError } });
  const source = official && storedItems.length ? 'official+merchant' : official ? 'official' : 'merchant';
  const complete = !!official || storedComplete;
  return json({
    ok: true,
    account,
    catalog: {
      character: row && row.character || null,
      version: complete ? Math.max(4, storedVersion) : storedVersion,
      count: items.length,
      declaredCount: complete ? items.length : storedDeclared,
      receivedAt: Math.max(number(row && row.received_at), number(official && official.fetchedAt)),
      source,
      complete,
      officialGameVersion: official && official.gameVersion || null,
      items
    },
    database: { available: databaseAvailable, error: databaseError },
    official: { available: !!official, error: officialError, fetchedAt: official && official.fetchedAt || null }
  });
}

async function handleRuntime(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403); await ensureDb(env); let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {}); const account = safeAccount(body.account), character = text(body.character, 80); if (!character || !body.status || typeof body.status !== 'object') return json({ ok: false, error: 'character and status required' }, 400, cors || {});
  const now = Date.now(), clean = redactDeep(body.status); await env.DB.prepare('INSERT INTO v3_runtime_status(account,character,payload,received_at) VALUES(?,?,?,?) ON CONFLICT(account,character) DO UPDATE SET payload=excluded.payload,received_at=excluded.received_at').bind(account, character, JSON.stringify(clean), now).run(); const eventCount = await storeEvents(env, account, character, clean.events, now); return json({ ok: true, account, character, receivedAt: now, eventCount }, 200, cors || {});
}

async function handleSync(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403); await ensureDb(env); let body; try { body = await readJson(request); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {}); const account = safeAccount(body.account), character = text(body.character, 80); if (!character) return json({ ok: false, error: 'character required' }, 400, cors || {});
  const settings = await getSettings(env, account); let remoteState = null; const existing = await env.DB.prepare('SELECT samples,updates,payload,updated_at FROM v3_brain_state WHERE account=? AND character=?').bind(account, character).first(); if (existing) { try { remoteState = JSON.parse(existing.payload); } catch (_) {} }
  const incoming = body.brainState && typeof body.brainState === 'object' ? redactDeep(body.brainState) : null; const inSamples = number(incoming && incoming.samples), inUpdates = number(incoming && incoming.updates), exSamples = number(existing && existing.samples), exUpdates = number(existing && existing.updates);
  if (incoming && (inSamples > exSamples || (inSamples === exSamples && inUpdates >= exUpdates))) { const now = Date.now(); await env.DB.prepare('INSERT INTO v3_brain_state(account,character,samples,updates,payload,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(account,character) DO UPDATE SET samples=excluded.samples,updates=excluded.updates,payload=excluded.payload,updated_at=excluded.updated_at').bind(account, character, inSamples, inUpdates, JSON.stringify(incoming), now).run(); remoteState = incoming; }
  return json({ ok: true, account, settings, brainState: remoteState }, 200, cors || {});
}

async function handleTeacher(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403); await ensureDb(env); let body; try { body = await readJson(request, 256 * 1024); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {}); if (!env.AI) return json({ ok: false, error: 'Workers AI binding missing' }, 503, cors || {});
  const hardLimit = Math.max(500, Math.min(10000, number(body.dailyLimit, 10000))), targetFraction = Math.max(0.5, Math.min(0.995, number(body.budgetTargetFraction, 0.995))), targetLimit = hardLimit * targetFraction, day = utcDay(); const usage = await env.DB.prepare('SELECT neurons,requests FROM brain_usage WHERE day=?').bind(day).first(), used = number(usage && usage.neurons), requests = number(usage && usage.requests);
  if (used >= targetLimit) return json({ ok: true, blocked: true, reason: 'daily target budget reached', usedToday: used, requests, limit: hardLimit, targetLimit }, 200, cors || {});
  const state = JSON.stringify(redactDeep(body.state || {})); const system = 'You are AiO Brain v3 Teacher for an autonomous Adventure Land party. Return ONLY compact JSON, never JavaScript. Allowed strategic actions: continue, change_farm_target, replan_merchant, explore, wait. Survival and deterministic safety are absolute: never override emergency retreat, dangerous-content quarantine, command authority, transaction journals, combat risk gates or local executors. Optimize long-run 24/7 value: safe stable XP/hour, gold/hour, efficient kill time, inventory health, gear progression, market decisions and useful exploration. Treat the local 32→24→5 Student prediction as a learner: correct it when wrong and reinforce it when right. Prefer teaching novel or uncertain states. A ranged tank with strong kite evidence may justify more risk, but never pretend damage risk is zero. Schema: {"action":"continue|change_farm_target|replan_merchant|explore|wait","target":"monster or empty","confidence":0..1,"scores":{"continue":0..1,"change_farm_target":0..1,"replan_merchant":0..1,"explore":0..1,"wait":0..1},"reason":"short","lesson":"reusable rule","expected":{"xpDeltaPct":number,"goldDeltaPct":number,"safetyDeltaPct":number,"freeSlotsDelta":number},"recheckSeconds":5..1800}.';
  const estimatedInput = Math.ceil(tokenEstimate(system + state) * 1.3) + 80, remaining = Math.max(0, targetLimit - used), inputCost = estimatedInput * INPUT_NEURONS_PER_TOKEN; let maxTokens = Math.min(200, Math.floor((remaining - inputCost - 2) / OUTPUT_NEURONS_PER_TOKEN)); if (maxTokens < 72) return json({ ok: true, blocked: true, reason: 'budget reserve reached', usedToday: used, requests, limit: hardLimit, targetLimit }, 200, cors || {}); maxTokens = Math.max(72, maxTokens);
  let result; try { result = await env.AI.run(BRAIN_MODEL, { messages: [{ role: 'system', content: system }, { role: 'user', content: state }], max_tokens: maxTokens, temperature: 0.12 }); } catch (e) { const message = text(e && e.message || e, 260); if (/4006|daily free allocation/i.test(message)) { await env.DB.prepare('INSERT INTO brain_usage(day,neurons,requests,updated_at) VALUES(?,?,1,?) ON CONFLICT(day) DO UPDATE SET neurons=MAX(brain_usage.neurons,excluded.neurons),requests=brain_usage.requests+1,updated_at=excluded.updated_at').bind(day, hardLimit, Date.now()).run(); return json({ ok: true, blocked: true, reason: 'Workers AI daily quota reached', usedToday: hardLimit, limit: hardLimit }, 200, cors || {}); } return json({ ok: false, error: 'AI inference failed: ' + message }, 502, cors || {}); }
  const usageInfo = result && result.usage || {}, inputTokens = number(usageInfo.prompt_tokens || usageInfo.input_tokens, tokenEstimate(system + state)), outputTokens = number(usageInfo.completion_tokens || usageInfo.output_tokens, tokenEstimate(JSON.stringify(result && result.response || ''))), neurons = inputTokens * INPUT_NEURONS_PER_TOKEN + outputTokens * OUTPUT_NEURONS_PER_TOKEN, next = used + neurons, decision = cleanDecision(parseBrainText(result));
  await env.DB.prepare('INSERT INTO brain_usage(day,neurons,requests,updated_at) VALUES(?,?,1,?) ON CONFLICT(day) DO UPDATE SET neurons=brain_usage.neurons+excluded.neurons,requests=brain_usage.requests+1,updated_at=excluded.updated_at').bind(day, neurons, Date.now()).run(); if (decision) await env.DB.prepare('INSERT INTO brain_decisions(account,character,trigger,decision,neurons,created_at) VALUES(?,?,?,?,?,?)').bind(safeAccount(body.account), text(body.character, 80), text(body.state && body.state.trigger, 80), JSON.stringify(decision), neurons, Date.now()).run(); return json({ ok: true, blocked: false, decision, neurons, usedToday: next, requests: requests + 1, limit: hardLimit, targetLimit, inputTokens, outputTokens }, 200, cors || {});
}

async function handleFeedback(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403); await ensureDb(env); let body; try { body = await readJson(request, 96 * 1024); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); } if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {}); const f = body.feedback && typeof body.feedback === 'object' ? redactDeep(body.feedback) : null; if (!f) return json({ ok: false, error: 'feedback required' }, 400, cors || {}); const type = text(f.eventType || 'outcome', 40); await env.DB.prepare('INSERT INTO brain_learning_events(account,character,event_type,action,target,reward,payload,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(safeAccount(body.account), text(body.character || 'unknown', 80), type, text(f.action, 40), text(f.target, 100), Math.max(-1, Math.min(1, number(f.reward))), JSON.stringify(f).slice(0, 80000), Date.now()).run(); return json({ ok: true }, 200, cors || {});
}

async function handleOverview(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401); await ensureDb(env); const url = new URL(request.url), account = safeAccount(url.searchParams.get('account') || 'default'), now = Date.now(); const rows = await env.DB.prepare('SELECT character,payload,received_at FROM v3_runtime_status WHERE account=? ORDER BY character').bind(account).all(); const characters = (rows.results || []).map(r => { let status = {}; try { status = JSON.parse(r.payload); } catch (_) {} const ageSeconds = Math.max(0, Math.round((now - number(r.received_at)) / 1000)); return { character: r.character, receivedAt: number(r.received_at), ageSeconds, connectionState: ageSeconds <= 30 ? 'live' : ageSeconds <= 120 ? 'delayed' : 'offline', status }; }); const settings = await getSettings(env, account), usage = await env.DB.prepare('SELECT neurons,requests,updated_at FROM brain_usage WHERE day=?').bind(utcDay()).first() || {};
  const counts = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) c FROM v3_runtime_status WHERE account=?').bind(account), env.DB.prepare('SELECT COUNT(*) c FROM v3_brain_state WHERE account=?').bind(account), env.DB.prepare('SELECT COUNT(*) c FROM v3_runtime_events WHERE account=?').bind(account), env.DB.prepare('SELECT COUNT(*) c FROM brain_decisions WHERE account=?').bind(account), env.DB.prepare('SELECT COUNT(*) c FROM brain_learning_events WHERE account=?').bind(account), env.DB.prepare('SELECT COUNT(*) c FROM v3_control_audit WHERE account=?').bind(account)
  ]); const c = counts.map(x => number(x.results && x.results[0] && x.results[0].c));
  return json({ ok: true, now, account, characters, settings: { schemaVersion: settings.schemaVersion, revision: settings.revision, updatedAt: settings.updatedAt }, brainUsage: { day: utcDay(), neurons: number(usage.neurons), requests: number(usage.requests), updatedAt: number(usage.updated_at) }, database: { runtimeStatuses: c[0], brainStates: c[1], events: c[2], brainDecisions: c[3], learningEvents: c[4], settingAudits: c[5] } });
}

async function handleBrainStatus(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401); await ensureDb(env); const url = new URL(request.url), account = safeAccount(url.searchParams.get('account') || 'default'); const rows = await env.DB.prepare('SELECT character,payload,received_at FROM v3_runtime_status WHERE account=? ORDER BY received_at DESC').bind(account).all(); let selected = null; for (const r of rows.results || []) { try { const p = JSON.parse(r.payload); if (!selected) selected = { row: r, status: p }; if (String(p.character && p.character.ctype || '').toLowerCase() === 'merchant') { selected = { row: r, status: p }; break; } } catch (_) {} } const usage = await env.DB.prepare('SELECT neurons,requests,updated_at FROM brain_usage WHERE day=?').bind(utcDay()).first() || {}; const decisions = await env.DB.prepare('SELECT character,trigger,decision,neurons,created_at FROM brain_decisions WHERE account=? ORDER BY created_at DESC LIMIT 20').bind(account).all(); const outcomes = await env.DB.prepare('SELECT character,event_type,action,target,reward,payload,created_at FROM brain_learning_events WHERE account=? ORDER BY created_at DESC LIMIT 30').bind(account).all(); return json({ ok: true, account, character: selected && selected.row.character || null, receivedAt: selected && number(selected.row.received_at), brain: selected && selected.status.brain || null, usage: { day: utcDay(), neurons: number(usage.neurons), requests: number(usage.requests), updatedAt: number(usage.updated_at) }, decisions: (decisions.results || []).map(r => ({ ...r, decision: (() => { try { return JSON.parse(r.decision); } catch (_) { return null; } })() })), outcomes: outcomes.results || [] });
}

async function handleEvents(request, env) {
  if (!(await requireRead(request, env))) return json({ ok: false, error: 'unauthorized' }, 401); await ensureDb(env); const u = new URL(request.url), account = safeAccount(u.searchParams.get('account') || 'default'), character = text(u.searchParams.get('character'), 80), limit = Math.max(10, Math.min(500, number(u.searchParams.get('limit'), 180))); let query = 'SELECT character,severity,component,event,reason,payload,event_at FROM v3_runtime_events WHERE account=?', bind = [account]; if (character) { query += ' AND character=?'; bind.push(character); } query += ' ORDER BY event_at DESC LIMIT ?'; bind.push(limit); const result = await env.DB.prepare(query).bind(...bind).all(); const events = (result.results || []).map(r => ({ character: r.character, severity: r.severity, component: r.component, event: r.event, reason: r.reason, eventAt: number(r.event_at), data: (() => { try { return JSON.parse(r.payload); } catch (_) { return {}; } })() })); return json({ ok: true, account, events });
}

async function handleHealth(env) { return json({ ok: true, service: 'aio-bot-v3-control-center', version: '3.0.0-control-center-1', brain: 'teacher-student-32x24x5', database: 'D1', aiBinding: !!env.AI, security: { readKey: !!env.READ_KEY, writeKey: !!env.WRITE_KEY, adminKey: !!env.ADMIN_KEY } }); }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/v3/')) { const cors = corsFor(request, env); if (cors === null) return new Response(null, { status: 403, headers: securityHeaders() }); return new Response(null, { status: 204, headers: { ...securityHeaders(), ...(cors || {}) } }); }
    if (request.method === 'GET' && url.pathname === '/') return new Response(DASHBOARD_HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'", ...securityHeaders() } });
    if (request.method === 'GET' && url.pathname === '/api/health') return handleHealth(env);
    if (request.method === 'GET' && url.pathname === '/api/v3/overview') return handleOverview(request, env);
    if (request.method === 'GET' && url.pathname === '/api/v3/settings') return handleSettingsGet(request, env);
    if (request.method === 'GET' && url.pathname === '/api/v3/automation-catalog') return handleAutomationCatalogGet(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/automation-catalog') return handleAutomationCatalogPost(request, env);
    if (request.method === 'PATCH' && url.pathname === '/api/v3/settings') return handleSettingsPatch(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/runtime') return handleRuntime(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/sync') return handleSync(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/brain/teacher') return handleTeacher(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/brain/feedback') return handleFeedback(request, env);
    if (request.method === 'GET' && url.pathname === '/api/v3/brain') return handleBrainStatus(request, env);
    if (request.method === 'GET' && url.pathname === '/api/v3/events') return handleEvents(request, env);
    return json({ ok: false, error: 'not found' }, 404);
  }
};
