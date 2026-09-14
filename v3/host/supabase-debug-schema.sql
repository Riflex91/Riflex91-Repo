-- Adventure Land v3 read-only debug telemetry storage.
-- Keep ingestion credentials on the Raspberry Pi/host only; never expose them to browser code.

create table if not exists public.aio_v3_debug_telemetry (
  id bigint generated always as identity primary key,
  captured_at timestamptz not null default now(),
  source text not null,
  run_id text,
  payload jsonb not null
);

create index if not exists aio_v3_debug_telemetry_captured_at_idx
  on public.aio_v3_debug_telemetry (captured_at desc);

create index if not exists aio_v3_debug_telemetry_run_id_idx
  on public.aio_v3_debug_telemetry (run_id, captured_at desc);

alter table public.aio_v3_debug_telemetry enable row level security;

-- Deliberately no anon/authenticated insert policy is created here.
-- Provision the narrowest suitable host-side ingestion credential/policy separately.
