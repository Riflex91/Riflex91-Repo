import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";

const MAX_BODY_BYTES = 16 * 1024;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readBearer(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function readBotId(req: Request, payload?: any) {
  const url = new URL(req.url);
  return String(
    payload?.botId ||
    req.headers.get("x-albot-bot-id") ||
    url.searchParams.get("botId") ||
    ""
  ).slice(0, 128);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json(500, { ok: false, error: "SERVER_CONFIG_MISSING" });
  }

  let payload: any = null;
  if (req.method === "POST") {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: "PAYLOAD_TOO_LARGE" });
    }
    try {
      payload = await req.json();
    } catch (_) {
      return json(400, { ok: false, error: "INVALID_JSON" });
    }
  }

  const botId = readBotId(req, payload);
  if (!botId) return json(400, { ok: false, error: "BOT_ID_REQUIRED" });

  const generation = Number(req.headers.get("x-albot-generation") || 0);
  const bridgeProtocol = String(req.headers.get("x-albot-bridge-protocol") || "").slice(0, 100);
  if (generation !== 6 || bridgeProtocol !== "albot-v6-bridge-v1") {
    return json(403, { ok: false, error: "V6_BRIDGE_IDENTITY_REQUIRED" });
  }

  const token = readBearer(req);
  if (token.length < 24 || token.length > 256) {
    return json(401, { ok: false, error: "CONTROL_UNAUTHORIZED" });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const tokenHash = await sha256Hex(token);
  const { data: client, error: clientError } = await supabase
    .from("aio_debug_ingest_clients")
    .select("bot_id, active")
    .eq("bot_id", botId)
    .eq("token_sha256", tokenHash)
    .maybeSingle();

  if (clientError || !client || client.active !== true) {
    return json(401, { ok: false, error: "CONTROL_UNAUTHORIZED" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("aio_chatgpt_signal_controls")
      .select("enabled, updated_at, updated_by")
      .eq("bot_id", botId)
      .maybeSingle();

    if (error) return json(500, { ok: false, error: "CONTROL_READ_FAILED" });
    return json(200, {
      ok: true,
      botId,
      enabled: data?.enabled === true,
      configured: Boolean(data),
      updatedAt: data?.updated_at ?? null,
      updatedBy: data?.updated_by ?? null
    });
  }

  if (
    payload?.type !== "ALBOT_V6_SIGNAL_CONTROL" ||
    Number(payload?.schemaVersion) !== 1 ||
    typeof payload?.enabled !== "boolean"
  ) {
    return json(400, { ok: false, error: "SCHEMA_MISMATCH" });
  }

  const updatedAt = new Date().toISOString();
  const row = {
    bot_id: botId,
    enabled: payload.enabled,
    updated_at: updatedAt,
    updated_by: "albot-v6-bridge"
  };

  const { error } = await supabase
    .from("aio_chatgpt_signal_controls")
    .upsert(row, { onConflict: "bot_id" });

  if (error) return json(500, { ok: false, error: "CONTROL_WRITE_FAILED" });

  return json(200, {
    ok: true,
    botId,
    enabled: payload.enabled,
    updatedAt
  });
});
