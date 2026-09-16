# Problem Diagnostics Read Mirror

The Windows Bridge keeps bplaced/FTPS as the canonical long-term problem archive and mirrors the same sanitized problem JSON into Supabase for direct operator/ChatGPT troubleshooting.

## Data flow

```text
Adventure Land v3 debug surfaces
        ↓
Windows Bridge problem detector
        ↓
local gzip bundle + SHA-256
        ├─ local FTPS outbox → bplaced long-term archive
        └─ local mirror outbox → authenticated bot-debug-ingest → Supabase
```

The two upload paths are intentionally independent. A bplaced outage must not prevent the Supabase mirror, and a Supabase outage must not prevent the FTPS archive. Neither path has gameplay authority.

## Authentication

The mirror reuses the existing Windows Bridge telemetry bearer token and the existing `aio_debug_ingest_clients` token-hash allowlist. No FTP password, Supabase service-role key, or new desktop secret is introduced.

The Edge Function keeps `verify_jwt=false` because this endpoint already uses its own high-entropy bearer-token validation against the stored SHA-256 hash. The service-role key remains server-side only.

## Supabase storage

Problem rows are stored in `public.aio_problem_diagnostics` with RLS enabled and no `anon` or `authenticated` grants. The Edge Function writes with its server-side service role; the table is not intended as a public Data API surface.

Each row contains:

- `bot_id` and `bundle_id`;
- capture/receive timestamps;
- severity and reason;
- bounded sanitized bundle JSON;
- payload size and SHA-256;
- FTPS archive metadata (`filename`, gzip SHA-256, expected remote path).

The Supabase mirror is retained for 30 days. The FTPS archive is the long-term source of record.

## Local durability

Before network transmission the Bridge writes a separate mirror outbox under:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\Diagnostics\mirror-pending\
```

A mirror file is deleted only after Supabase accepts it. Retries use bounded exponential backoff and the queue has bounded file/byte retention. FTPS and mirror retries are isolated from telemetry and gameplay.

## ChatGPT troubleshooting

With the Supabase connector available, troubleshooting can query the newest rows directly, for example by `bot_id`, `captured_at`, severity, or `bundle_id`, and inspect the sanitized `bundle` JSON without needing bplaced credentials.
