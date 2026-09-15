# Presence and Supabase budget

## Presence source of truth

The web dashboard character presence is sourced from the Cloudflare Worker/D1 runtime status path, not from Supabase debug telemetry.

The dashboard currently classifies runtime status as:

- live: age <= 30 seconds
- delayed: age > 30 seconds and <= 120 seconds
- offline: age > 120 seconds

Therefore a healthy bot can still appear offline when the browser-side Cloud Control Plane cannot push `/api/v3/runtime` to the Cloudflare Worker. Supabase debug telemetry is diagnostic evidence only and must not be treated as the dashboard presence source of truth.

A stale locally persisted Cloudflare endpoint is automatically migrated to the canonical `ACTIVE_CLOUDFLARE_BASE_URL`. Explicit operator-provided global custom endpoints are not overwritten.

## Supabase debug telemetry budget

Debug telemetry must remain comfortably below the monthly Edge Function invocation allowance even when all four character hosts export independently.

Client-side policy:

- hard minimum upload interval: 60 seconds
- default upload interval: 120 seconds
- maximum configured interval: 15 minutes
- event batch limit: 200
- 31-day projected invocations at the default interval:
  - one exporter: 22,320
  - four exporters: 89,280
- 31-day projected invocations at the hard 60-second floor:
  - four exporters: 178,560

This keeps four exporters below the internal 500,000 monthly invocation budget even at the fastest permitted production cadence.

## Supabase storage policy

The `bot-debug-ingest` function uses two storage tiers:

1. `aio_debug_telemetry_latest` keeps the latest diagnostic state per bot and is updated at most once per 60 seconds.
2. `aio_debug_telemetry_batches` is sampled history and receives at most one full batch per bot every 15 minutes.

Important diagnostic signals continue to be deduplicated separately in `aio_chatgpt_signals` when the signal gate is enabled.

Raw sampled telemetry history has a seven-day retention target. Maintenance is opportunistic and runs no more often than every six hours during an eligible history ingest.

## Why this exists

Before this policy, the debug telemetry exporter defaulted to five seconds and the Supabase Edge Function appended a full snapshot plus event batch for every request. With multiple exporters this produced thousands of large rows per day and could exceed the monthly invocation allowance. Presence failures were additionally easy to misdiagnose because the Supabase watchdog data could remain healthy while the separate Cloudflare dashboard status stream had stopped updating.
