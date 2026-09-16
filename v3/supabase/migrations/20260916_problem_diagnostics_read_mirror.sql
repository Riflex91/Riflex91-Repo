create table if not exists public.aio_problem_diagnostics (
  id bigint generated always as identity primary key,
  bot_id text not null references public.aio_debug_ingest_clients(bot_id) on delete cascade,
  bundle_id text not null,
  schema_version integer not null default 1,
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  severity text,
  reason text,
  payload_bytes integer not null default 0,
  payload_sha256 text,
  archive jsonb not null default '{}'::jsonb,
  bundle jsonb not null,
  constraint aio_problem_diagnostics_bot_bundle_unique unique (bot_id, bundle_id),
  constraint aio_problem_diagnostics_payload_bytes_nonnegative check (payload_bytes >= 0),
  constraint aio_problem_diagnostics_sha256_shape check (payload_sha256 is null or payload_sha256 ~ '^[0-9a-f]{64}$')
);

alter table public.aio_problem_diagnostics enable row level security;
revoke all on table public.aio_problem_diagnostics from anon, authenticated;
revoke all on sequence public.aio_problem_diagnostics_id_seq from anon, authenticated;

create index if not exists aio_problem_diagnostics_bot_captured_idx
  on public.aio_problem_diagnostics (bot_id, captured_at desc);
create index if not exists aio_problem_diagnostics_received_idx
  on public.aio_problem_diagnostics (received_at desc);

comment on table public.aio_problem_diagnostics is
  'Sanitized, bounded problem-diagnostic mirror for operator/ChatGPT troubleshooting. Canonical long-term archive remains FTPS; no anon/authenticated access is granted.';
