const DEFAULT_PUSH_ORIGINS = ['https://adventure.land', 'https://www.adventure.land'];
const BRAIN_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
const INPUT_NEURONS_PER_TOKEN = 4625 / 1_000_000;
const OUTPUT_NEURONS_PER_TOKEN = 30475 / 1_000_000;
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;
const TEACHER_MIN_INTERVAL_MS = 10 * 60 * 1000;
const TEACHER_DEDUPE_MS = 30 * 60 * 1000;
const HARD_NEURON_LIMIT = 10000;
const RESERVED_NEURONS = 1500;
const ALLOWED_NAMESPACES = new Set(['brain', 'gear', 'market', 'party-performance']);

function number(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function text(v, max = 300) { return String(v == null ? '' : v).trim().slice(0, max); }
function safeAccount(v) { const x = text(v || 'default', 100).replace(/[^A-Za-z0-9_.:@-]/g, '_'); return x || 'default'; }
function securityHeaders() { return { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'cache-control': 'no-store' }; }
function json(data, status = 200, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...securityHeaders(), ...extra } }); }
function pushOrigins(env) { return String(env.PUSH_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean).concat(DEFAULT_PUSH_ORIGINS).filter((x, i, a) => a.indexOf(x) === i); }
function corsFor(request, env) { const origin = request.headers.get('origin'); if (!origin) return {}; if (!pushOrigins(env).includes(origin)) return null; return { 'access-control-allow-origin': origin, 'vary': 'origin', 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'content-type' }; }
async function digest(v) { const bytes = new TextEncoder().encode(String(v || '')); const hash = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, '0')).join(''); }
async function secretMatches(given, expected) { if (!expected || !given) return false; const [a, b] = await Promise.all([digest(given), digest(expected)]); return a === b; }
async function readJson(request, max = 512 * 1024) { const len = number(request.headers.get('content-length'), 0); if (len > max) throw Object.assign(new Error('payload too large'), { status: 413 }); const raw = await request.text(); if (raw.length > max) throw Object.assign(new Error('payload too large'), { status: 413 }); try { return JSON.parse(raw); } catch (_) { throw Object.assign(new Error('invalid JSON'), { status: 400 }); } }
function redactDeep(value, depth = 0) { if (depth > 8) return null; if (Array.isArray(value)) return value.slice(0, 300).map(x => redactDeep(x, depth + 1)); if (!value || typeof value !== 'object') return value; const out = {}; for (const [k, v] of Object.entries(value)) { if (/(write.?key|read.?key|admin.?key|authorization|api.?key|secret|token)/i.test(k)) { out[k] = '[REDACTED]'; continue; } out[k] = redactDeep(v, depth + 1); } return out; }
function tokenEstimate(s) { return Math.ceil(String(s || '').length / 3.6); }
function parseBrainText(result) { let x = result && (result.response || result.result || result.output_text || result.text); if (Array.isArray(x)) x = x.map(v => typeof v === 'string' ? v : v && v.text || '').join(''); if (x && typeof x === 'object') return x; const raw = String(x || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''); try { return JSON.parse(raw); } catch (_) { const m = raw.match(/\{[\s\S]*\}/); if (!m) return null; try { return JSON.parse(m[0]); } catch (_) { return null; } } }
const ACTIONS = ['continue', 'change_farm_target', 'replan_merchant', 'explore', 'wait'];
function cleanDecision(x) { if (!x || !ACTIONS.includes(String(x.action))) return null; const scores = {}; let sum = 0; for (const a of ACTIONS) { scores[a] = Math.max(0, number(x.scores && x.scores[a], 0)); sum += scores[a]; } if (!sum) { for (const a of ACTIONS) scores[a] = a === x.action ? 1 : 0; sum = 1; } for (const a of ACTIONS) scores[a] /= sum; return { action: String(x.action), target: text(x.target, 100), confidence: Math.max(0, Math.min(1, number(x.confidence, 0))), scores, reason: text(x.reason, 360), lesson: text(x.lesson, 500), expected: x.expected && typeof x.expected === 'object' ? { xpDeltaPct: number(x.expected.xpDeltaPct), goldDeltaPct: number(x.expected.goldDeltaPct), safetyDeltaPct: number(x.expected.safetyDeltaPct), freeSlotsDelta: number(x.expected.freeSlotsDelta) } : null, recheckSeconds: Math.max(5, Math.min(1800, number(x.recheckSeconds, 60))) }; }

export function teacherBudgetPlan(usedNeurons, estimatedInputTokens, hardLimit = HARD_NEURON_LIMIT, requestedMaxTokens = 200) {
  const limit = Math.min(HARD_NEURON_LIMIT, Math.max(2000, number(hardLimit, HARD_NEURON_LIMIT)));
  const reserve = Math.min(RESERVED_NEURONS, limit);
  const usableLimit = Math.max(0, limit - reserve);
  const used = Math.max(0, number(usedNeurons));
  const inputCost = Math.max(0, number(estimatedInputTokens)) * INPUT_NEURONS_PER_TOKEN;
  const absoluteMaxTokens = Math.max(72, Math.min(200, Math.floor(number(requestedMaxTokens, 200))));
  const available = Math.max(0, usableLimit - used);
  let maxTokens = absoluteMaxTokens;
  const worstCase = inputCost + maxTokens * OUTPUT_NEURONS_PER_TOKEN + 2;
  if (worstCase > available) maxTokens = Math.floor((available - inputCost - 2) / OUTPUT_NEURONS_PER_TOKEN);
  return { allowed: used < usableLimit && maxTokens >= 72, hardLimit: limit, reserve, usableLimit, used, available, inputCost, worstCase, maxTokens: Math.min(absoluteMaxTokens, Math.max(0, maxTokens)) };
}

export async function ensureAlpha2021Db(env) {
  const ddl = [
    `CREATE TABLE IF NOT EXISTS v3_long_term_state(account TEXT NOT NULL, namespace TEXT NOT NULL, state_key TEXT NOT NULL, schema_version INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(account,namespace,state_key))`,
    `CREATE INDEX IF NOT EXISTS idx_v3_long_term_state_account_at ON v3_long_term_state(account,updated_at DESC)`,
    `CREATE TABLE IF NOT EXISTS brain_teacher_attempts(id INTEGER PRIMARY KEY AUTOINCREMENT, request_key TEXT NOT NULL, account TEXT NOT NULL, character TEXT NOT NULL, status TEXT NOT NULL, neurons REAL NOT NULL DEFAULT 0, decision TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_brain_teacher_attempts_at ON brain_teacher_attempts(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_brain_teacher_attempts_key_at ON brain_teacher_attempts(request_key,created_at DESC)`
  ];
  await env.DB.batch(ddl.map(sql => env.DB.prepare(sql)));
}

export async function rollingTeacherUsage(env, now = Date.now(), hardLimit = HARD_NEURON_LIMIT) {
  await ensureAlpha2021Db(env);
  const cutoff = now - ROLLING_WINDOW_MS;
  const row = await env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN status='success' THEN neurons ELSE 0 END),0) neurons, COUNT(*) requests, MAX(created_at) last_at, MAX(CASE WHEN status='quota' THEN 1 ELSE 0 END) quota FROM brain_teacher_attempts WHERE created_at>=?`).bind(cutoff).first() || {};
  const limit = Math.min(HARD_NEURON_LIMIT, Math.max(0, number(hardLimit, HARD_NEURON_LIMIT)));
  const neurons = number(row.quota) ? limit : Math.max(0, number(row.neurons));
  return { window: 'rolling-24h', windowMs: ROLLING_WINDOW_MS, neurons, requests: Math.max(0, number(row.requests)), lastAttemptAt: number(row.last_at) || null, hardLimit: limit, reserve: Math.min(RESERVED_NEURONS, limit), usableLimit: Math.max(0, limit - RESERVED_NEURONS), quotaObserved: !!number(row.quota) };
}

export async function handlePersistenceLoad(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403);
  await ensureAlpha2021Db(env);
  let body; try { body = await readJson(request, 96 * 1024); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {});
  const account = safeAccount(body.account), wanted = new Set((Array.isArray(body.namespaces) ? body.namespaces : [...ALLOWED_NAMESPACES]).map(String).filter((x) => ALLOWED_NAMESPACES.has(x)));
  const result = await env.DB.prepare('SELECT namespace,state_key,schema_version,payload,updated_at FROM v3_long_term_state WHERE account=? ORDER BY updated_at DESC').bind(account).all();
  const records = [];
  for (const row of result.results || []) {
    if (!wanted.has(String(row.namespace))) continue;
    let payload = null; try { payload = JSON.parse(row.payload); } catch (_) { continue; }
    records.push({ namespace: row.namespace, stateKey: row.state_key, schemaVersion: number(row.schema_version, 1), payload, updatedAt: number(row.updated_at) });
  }
  return json({ ok: true, account, records }, 200, cors || {});
}

export async function handlePersistenceUpsert(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403);
  await ensureAlpha2021Db(env);
  let body; try { body = await readJson(request, 512 * 1024); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {});
  const account = safeAccount(body.account), records = Array.isArray(body.records) ? body.records.slice(0, 12) : [], statements = [], accepted = [], rejected = [];
  for (const record of records) {
    const namespace = text(record && record.namespace, 40), stateKey = text(record && record.stateKey, 80);
    if (!ALLOWED_NAMESPACES.has(namespace) || !stateKey || !record || typeof record.payload !== 'object') { rejected.push(`${namespace}:${stateKey}`); continue; }
    const payload = JSON.stringify(redactDeep(record.payload));
    if (payload.length > 420000) { rejected.push(`${namespace}:${stateKey}`); continue; }
    const updatedAt = Math.max(0, number(record.updatedAt, Date.now())), schemaVersion = Math.max(1, Math.floor(number(record.schemaVersion, 1)));
    statements.push(env.DB.prepare(`INSERT INTO v3_long_term_state(account,namespace,state_key,schema_version,payload,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(account,namespace,state_key) DO UPDATE SET schema_version=excluded.schema_version,payload=excluded.payload,updated_at=excluded.updated_at WHERE excluded.updated_at>=v3_long_term_state.updated_at`).bind(account, namespace, stateKey, schemaVersion, payload, updatedAt));
    accepted.push(`${namespace}:${stateKey}`);
  }
  if (statements.length) await env.DB.batch(statements);
  return json({ ok: true, account, accepted, rejected }, 200, cors || {});
}

export async function handleTeacher2021(request, env) {
  const cors = corsFor(request, env); if (cors === null) return json({ ok: false, error: 'origin not allowed' }, 403);
  await ensureAlpha2021Db(env);
  let body; try { body = await readJson(request, 256 * 1024); } catch (e) { return json({ ok: false, error: e.message }, e.status || 400, cors || {}); }
  if (!(await secretMatches(body.writeKey, env.WRITE_KEY))) return json({ ok: false, error: 'unauthorized' }, 401, cors || {});
  if (!env.AI) return json({ ok: false, error: 'Workers AI binding missing' }, 503, cors || {});
  const now = Date.now(), account = safeAccount(body.account), character = text(body.character || 'unknown', 80), hardLimit = Math.min(HARD_NEURON_LIMIT, Math.max(2000, number(body.dailyLimit, HARD_NEURON_LIMIT)));
  const usage = await rollingTeacherUsage(env, now, hardLimit);
  if (usage.neurons >= usage.usableLimit) return json({ ok: true, blocked: true, reason: 'rolling 24h usable budget reached', ...usage }, 200, cors || {});
  const cleanState = redactDeep(body.state || {}), state = JSON.stringify(cleanState), requestKey = `${account}:${character}:${await digest(state)}`;
  const cached = await env.DB.prepare(`SELECT decision,neurons,created_at FROM brain_teacher_attempts WHERE request_key=? AND status='success' AND decision IS NOT NULL AND created_at>=? ORDER BY created_at DESC LIMIT 1`).bind(requestKey, now - TEACHER_DEDUPE_MS).first();
  if (cached && cached.decision) { let decision = null; try { decision = JSON.parse(cached.decision); } catch (_) {} return json({ ok: true, blocked: false, cached: true, decision, neurons: 0, originalNeurons: number(cached.neurons), usedRolling24h: usage.neurons, requests: usage.requests, hardLimit: usage.hardLimit, reserve: usage.reserve, usableLimit: usage.usableLimit }, 200, cors || {}); }
  if (usage.lastAttemptAt && now - usage.lastAttemptAt < TEACHER_MIN_INTERVAL_MS) return json({ ok: true, blocked: true, reason: 'global teacher minimum interval', retryAfterMs: TEACHER_MIN_INTERVAL_MS - (now - usage.lastAttemptAt), ...usage }, 200, cors || {});
  const system = 'You are AiO Brain v3 Teacher for an autonomous Adventure Land party. Return ONLY compact JSON, never JavaScript. Allowed strategic actions: continue, change_farm_target, replan_merchant, explore, wait. Survival and deterministic safety are absolute: never override emergency retreat, dangerous-content quarantine, command authority, transaction journals, combat risk gates or local executors. Optimize long-run 24/7 value: safe stable XP/hour, gold/hour, efficient kill time, inventory health, gear progression, market decisions and useful exploration. Treat the local 32→24→5 Student prediction as a learner: correct it when wrong and reinforce it when right. Prefer teaching novel, uncertain or strategically changed states. Schema: {"action":"continue|change_farm_target|replan_merchant|explore|wait","target":"monster or empty","confidence":0..1,"scores":{"continue":0..1,"change_farm_target":0..1,"replan_merchant":0..1,"explore":0..1,"wait":0..1},"reason":"short","lesson":"reusable rule","expected":{"xpDeltaPct":number,"goldDeltaPct":number,"safetyDeltaPct":number,"freeSlotsDelta":number},"recheckSeconds":5..1800}.';
  const estimatedInput = Math.ceil(tokenEstimate(system + state) * 1.3) + 80, budget = teacherBudgetPlan(usage.neurons, estimatedInput, hardLimit, 200);
  if (!budget.allowed) return json({ ok: true, blocked: true, reason: 'rolling budget reserve protects hard limit', estimatedInput, ...usage }, 200, cors || {});
  const maxTokens = budget.maxTokens;
  await env.DB.prepare('INSERT INTO brain_teacher_attempts(request_key,account,character,status,neurons,decision,created_at,updated_at) VALUES(?,?,?,?,0,NULL,?,?)').bind(requestKey, account, character, 'started', now, now).run();
  let result;
  try { result = await env.AI.run(BRAIN_MODEL, { messages: [{ role: 'system', content: system }, { role: 'user', content: state }], max_tokens: maxTokens, temperature: 0.12 }); }
  catch (e) {
    const message = text(e && e.message || e, 260), quota = /4006|daily free allocation|quota/i.test(message);
    await env.DB.prepare('UPDATE brain_teacher_attempts SET status=?,updated_at=? WHERE request_key=? AND created_at=?').bind(quota ? 'quota' : 'failed', Date.now(), requestKey, now).run();
    if (quota) return json({ ok: true, blocked: true, reason: 'Workers AI daily quota reached', usedRolling24h: hardLimit, hardLimit, reserve: RESERVED_NEURONS, usableLimit: Math.max(0, hardLimit - RESERVED_NEURONS) }, 200, cors || {});
    return json({ ok: false, error: 'AI inference failed: ' + message }, 502, cors || {});
  }
  const usageInfo = result && result.usage || {}, inputTokens = number(usageInfo.prompt_tokens || usageInfo.input_tokens, tokenEstimate(system + state)), outputTokens = number(usageInfo.completion_tokens || usageInfo.output_tokens, tokenEstimate(JSON.stringify(result && result.response || ''))), neurons = inputTokens * INPUT_NEURONS_PER_TOKEN + outputTokens * OUTPUT_NEURONS_PER_TOKEN;
  if (usage.neurons + neurons > usage.usableLimit + 1e-9) { await env.DB.prepare('UPDATE brain_teacher_attempts SET status=?,neurons=?,updated_at=? WHERE request_key=? AND created_at=?').bind('budget-overrun-blocked', neurons, Date.now(), requestKey, now).run(); return json({ ok: true, blocked: true, reason: 'post-inference budget overrun blocked from teacher ingestion', neurons, ...usage }, 200, cors || {}); }
  const decision = cleanDecision(parseBrainText(result));
  await env.DB.prepare('UPDATE brain_teacher_attempts SET status=?,neurons=?,decision=?,updated_at=? WHERE request_key=? AND created_at=?').bind('success', neurons, decision ? JSON.stringify(decision) : null, Date.now(), requestKey, now).run();
  const day = new Date(now).toISOString().slice(0, 10);
  await env.DB.prepare('INSERT INTO brain_usage(day,neurons,requests,updated_at) VALUES(?,?,1,?) ON CONFLICT(day) DO UPDATE SET neurons=brain_usage.neurons+excluded.neurons,requests=brain_usage.requests+1,updated_at=excluded.updated_at').bind(day, neurons, Date.now()).run();
  if (decision) await env.DB.prepare('INSERT INTO brain_decisions(account,character,trigger,decision,neurons,created_at) VALUES(?,?,?,?,?,?)').bind(account, character, text(body.state && body.state.trigger, 80), JSON.stringify(decision), neurons, Date.now()).run();
  const nextUsage = await rollingTeacherUsage(env, Date.now(), hardLimit);
  return json({ ok: true, blocked: false, cached: false, decision, neurons, inputTokens, outputTokens, usedRolling24h: nextUsage.neurons, requests: nextUsage.requests, hardLimit: nextUsage.hardLimit, reserve: nextUsage.reserve, usableLimit: nextUsage.usableLimit }, 200, cors || {});
}

export { HARD_NEURON_LIMIT, RESERVED_NEURONS, TEACHER_MIN_INTERVAL_MS, TEACHER_DEDUPE_MS, ROLLING_WINDOW_MS };
