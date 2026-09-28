import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((_req: Request) => new Response(JSON.stringify({
  ok: false,
  error: "LEGACY_TRANSPORT_RETIRED",
  requiredGeneration: 6,
  requiredProtocol: "albot-v6-bridge-v1",
  historicalReadOnly: true
}), {
  status: 410,
  headers: { "content-type": "application/json; charset=utf-8" }
}));
