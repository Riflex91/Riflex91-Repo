import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_BODY_BYTES = 512 * 1024;
const MAX_EVENTS = 200;
const MAX_SIGNAL_ALERTS = 50;
const EDGE_MONTHLY_INVOCATION_LIMIT = 500_000;
const LATEST_WRITE_INTERVAL_MS = 60_000;
const HISTORY_INTERVAL_MS = 15 * 60_000;
const HISTORY_RETENTION_MS = 7 * 24 * 60 * 60_000;
const HOUSEKEEPING_INTERVAL_MS = 6 * 60 * 60_000;
const HARD_SEVERITIES = new Set(["ERROR", "CRITICAL", "FATAL", "EMERGENCY", "ALERT"]);
const WARNING_SEVERITIES = new Set(["WARN", "WARNING"]);
const IGNORED_SIGNAL_TYPES = new Set(["ALPHA28_BRAIN_CLOUD_ENABLED"]);
const IMPORTANT_PATTERN = /(FAIL(?:ED|URE)?|ERROR|QUARANTIN|SAFE_MODE|RESTART_REQUIRED|CIRCUIT_OPEN|UNAVAILABLE|NOT_LIVE|\bDEAD\b|NO_PROGRESS|DRIFT_DETECTED|TIMEOUT|EXHAUSTED|DEGRADED|REJECTED|DISCONNECTED|OUTAGE)/i;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
function finiteInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}
function text(value: unknown, max = 500) {
  const out = String(value ?? "").trim();
  return out.length <= max ? out : out.slice(0, max);
}
async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hourBucket(ms: number, fallbackIso: string) {
  const date = new Date(ms || Date.parse(fallbackIso));
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 13) : fallbackIso.slice(0, 13);
}
function monthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { period: start.toISOString().slice(0, 7), start: start.toISOString(), next: next.toISOString() };
}
function ageMs(iso: unknown, nowMs: number) {
  const parsed = Date.parse(String(iso || ""));
  return Number.isFinite(parsed) ? Math.max(0, nowMs - parsed) : Number.POSITIVE_INFINITY;
}
function meaningful(eventType: string, severity: string, reason: string | null, fromEscalatedAlert: boolean) {
  if (IGNORED_SIGNAL_TYPES.has(eventType)) return false;
  const signalText = `${eventType} ${reason || ""}`;
  if (fromEscalatedAlert) return IMPORTANT_PATTERN.test(signalText);
  if (HARD_SEVERITIES.has(severity)) return true;
  return WARNING_SEVERITIES.has(severity) && IMPORTANT_PATTERN.test(signalText);
}
function signalRow(botId: string, input: any, receivedAt: string, sourceAlertId: string | null, sourceCreatedAtMs: number) {
  const eventType = text(input?.type || input?.event, 200) || "UNKNOWN_ALERT";
  const severity = text(input?.severity, 40).toUpperCase();
  const reason = text(input?.reason, 300) || null;
  const component = text(input?.data?.component || input?.component, 200) || null;
  const character = text(input?.data?.character || input?.character, 160) || null;
  const dedupeKey = text(input?.dedupeKey || `${component || "unknown"}:${eventType}:${reason || "none"}`, 700);
  return {
    bot_id: botId,
    fingerprint: text(`${botId}|${dedupeKey}|${hourBucket(sourceCreatedAtMs, receivedAt)}`, 1000),
    source_alert_id: sourceAlertId,
    dedupe_key: dedupeKey,
    event_type: eventType,
    severity,
    reason,
    component,
    character,
    source_created_at_ms: sourceCreatedAtMs || null,
    source_received_at: receivedAt,
    last_seen_at: receivedAt,
    payload: input
  };
}
function collectSignals(snapshot: any, events: any[], botId: string, receivedAt: string) {
  const rows = new Map<string, any>();
  const handledAlertIds: string[] = [];
  const alerts = snapshot?.diagnostics?.alerts;
  if (Array.isArray(alerts)) {
    for (const raw of alerts.slice(0, MAX_SIGNAL_ALERTS)) {
      if (!raw || typeof raw !== "object") continue;
      const alertId = text(raw.id, 160);
      if (!alertId) continue;
      const eventType = text(raw.type || raw.event, 200);
      const severity = text(raw.severity, 40).toUpperCase();
      const reason = text(raw.reason, 300) || null;
      if (IGNORED_SIGNAL_TYPES.has(eventType)) { handledAlertIds.push(alertId); continue; }
      if (!meaningful(eventType, severity, reason, true)) continue;
      const createdAtMs = finiteInt(raw.createdAt || raw.lastAt || Date.now());
      const row = signalRow(botId, raw, receivedAt, alertId, createdAtMs);
      rows.set(row.fingerprint, row);
      handledAlertIds.push(alertId);
    }
  }
  for (const raw of events) {
    if (!raw || typeof raw !== "object") continue;
    const eventType = text(raw.event || raw.type, 200);
    const severity = text(raw.severity, 40).toUpperCase();
    const reason = text(raw.reason, 300) || null;
    if (!meaningful(eventType, severity, reason, false)) continue;
    const parsedTs = Date.parse(text(raw.ts, 80));
    const createdAtMs = Number.isFinite(parsedTs) ? Math.max(0, Math.floor(parsedTs)) : finiteInt(raw.at || Date.now());
    const normalized = { ...raw, type: eventType, dedupeKey: raw.dedupeKey || `${text(raw.component, 200) || "unknown"}:${eventType}:${reason || "none"}` };
    const row = signalRow(botId, normalized, receivedAt, null, createdAtMs);
    rows.set(row.fingerprint, row);
  }
  return { rows: Array.from(rows.values()), handledAlertIds: Array.from(new Set(handledAlertIds)) };
}

Deno.serve(async (req: Request) => {
  const requestUrl = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json(500, { ok: false, error: "SERVER_CONFIG_MISSING" });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (req.method === "GET" && requestUrl.searchParams.get("mode") === "usage") {
    const bounds = monthBounds();
    const { count, error } = await supabase.from("aio_debug_telemetry_batches").select("id", { count: "exact", head: true }).gte("received_at", bounds.start).lt("received_at", bounds.next);
    if (error) return json(500, { ok: false, error: "USAGE_COUNT_FAILED" });
    return json(200, {
      ok: true,
      period: bounds.period,
      historyRows: Math.max(0, Number(count) || 0),
      invocationBudget: EDGE_MONTHLY_INVOCATION_LIMIT,
      policy: { latestWriteIntervalMs: LATEST_WRITE_INTERVAL_MS, historyIntervalMs: HISTORY_INTERVAL_MS, historyRetentionMs: HISTORY_RETENTION_MS },
      source: "sampled-debug-history",
      approximate: false,
      note: "History rows are sampled storage records and are intentionally not an Edge Function invocation counter.",
      updatedAt: new Date().toISOString()
    });
  }

  if (req.method !== "POST") return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return json(413, { ok: false, error: "PAYLOAD_TOO_LARGE" });
  const auth = req.headers.get("authorization") || "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (token.length < 24 || token.length > 256) return json(401, { ok: false, error: "INGEST_UNAUTHORIZED" });

  let payload: any;
  try { payload = await req.json(); } catch (_) { return json(400, { ok: false, error: "INVALID_JSON" }); }
  const botId = String(payload?.botId || req.headers.get("x-aio-v3-bot-id") || "").slice(0, 128);
  if (!botId) return json(400, { ok: false, error: "BOT_ID_REQUIRED" });
  if (payload?.type !== "AIO_V3_DEBUG_TELEMETRY_BATCH" || Number(payload?.schemaVersion) !== 1) return json(400, { ok: false, error: "SCHEMA_MISMATCH" });

  const tokenHash = await sha256Hex(token);
  const { data: client, error: clientError } = await supabase.from("aio_debug_ingest_clients").select("bot_id, active").eq("bot_id", botId).eq("token_sha256", tokenHash).maybeSingle();
  if (clientError || !client || client.active !== true) return json(401, { ok: false, error: "INGEST_UNAUTHORIZED" });

  const events = Array.isArray(payload?.events) ? payload.events.slice(0, MAX_EVENTS) : [];
  const snapshot = payload?.snapshot && typeof payload.snapshot === "object" && !Array.isArray(payload.snapshot) ? payload.snapshot : {};
  const cursorAfter = finiteInt(payload?.cursor?.afterSeq);
  const row = {
    bot_id: botId,
    schema_version: 1,
    observed_at: finiteInt(payload?.observedAt),
    cursor_after: cursorAfter,
    cursor_max: Math.max(finiteInt(payload?.cursor?.maxSeq), cursorAfter),
    process_running: payload?.host?.processRunning === true,
    restart_count: finiteInt(payload?.host?.restartCount),
    harness_started_at: payload?.host?.harnessStartedAt == null ? null : finiteInt(payload?.host?.harnessStartedAt),
    event_count: events.length,
    snapshot,
    events
  };
  const receivedAt = new Date().toISOString();
  const nowMs = Date.now();
  const { data: previous, error: latestReadError } = await supabase.from("aio_debug_telemetry_latest").select("received_at,history_recorded_at").eq("bot_id", botId).maybeSingle();
  if (latestReadError) return json(500, { ok: false, error: "LATEST_READ_FAILED" });
  const latestDue = !previous || ageMs(previous.received_at, nowMs) >= LATEST_WRITE_INTERVAL_MS;
  const historyDue = !previous || ageMs(previous.history_recorded_at, nowMs) >= HISTORY_INTERVAL_MS;

  const signalCandidates = collectSignals(snapshot, events, botId, receivedAt);
  let signalGateEnabled = false;
  let acceptedSignals = 0;
  if (signalCandidates.rows.length) {
    const { data: control, error: controlError } = await supabase.from("aio_chatgpt_signal_controls").select("enabled").eq("bot_id", botId).maybeSingle();
    if (controlError) return json(500, { ok: false, error: "SIGNAL_CONTROL_READ_FAILED" });
    signalGateEnabled = control?.enabled === true;
    if (signalGateEnabled) {
      const { error: signalError } = await supabase.from("aio_chatgpt_signals").upsert(signalCandidates.rows, { onConflict: "fingerprint", ignoreDuplicates: false });
      if (signalError) return json(500, { ok: false, error: "SIGNAL_PERSIST_FAILED" });
      acceptedSignals = signalCandidates.rows.length;
    }
  }

  if (historyDue) {
    const { error: historyError } = await supabase.from("aio_debug_telemetry_batches").insert(row);
    if (historyError) return json(500, { ok: false, error: "HISTORY_PERSIST_FAILED" });
  }
  if (latestDue || historyDue) {
    const latestRow = { ...row, received_at: receivedAt, history_recorded_at: historyDue ? receivedAt : previous?.history_recorded_at || null };
    const { error: latestError } = await supabase.from("aio_debug_telemetry_latest").upsert(latestRow, { onConflict: "bot_id", ignoreDuplicates: false });
    if (latestError) return json(500, { ok: false, error: "LATEST_PERSIST_FAILED" });
    await supabase.from("aio_debug_ingest_clients").update({ last_used_at: receivedAt }).eq("bot_id", botId);
  }

  if (historyDue) {
    const maintenanceKey = "debug_telemetry_retention";
    const { data: maintenance } = await supabase.from("aio_debug_maintenance").select("last_run_at").eq("maintenance_key", maintenanceKey).maybeSingle();
    if (!maintenance || ageMs(maintenance.last_run_at, nowMs) >= HOUSEKEEPING_INTERVAL_MS) {
      const cutoff = new Date(nowMs - HISTORY_RETENTION_MS).toISOString();
      const { error: pruneError } = await supabase.from("aio_debug_telemetry_batches").delete().lt("received_at", cutoff);
      if (!pruneError) await supabase.from("aio_debug_maintenance").upsert({ maintenance_key: maintenanceKey, last_run_at: receivedAt }, { onConflict: "maintenance_key" });
    }
  }

  return json(latestDue || historyDue ? 200 : 202, {
    ok: true,
    acceptedEvents: events.length,
    cursorMax: row.cursor_max,
    signalGateEnabled,
    acceptedSignals,
    handledAlertIds: signalCandidates.handledAlertIds,
    storage: {
      latestUpdated: latestDue || historyDue,
      historyStored: historyDue,
      latestWriteIntervalMs: LATEST_WRITE_INTERVAL_MS,
      historyIntervalMs: HISTORY_INTERVAL_MS,
      historyRetentionMs: HISTORY_RETENTION_MS
    }
  });
});
