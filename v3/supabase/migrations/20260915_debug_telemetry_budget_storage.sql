create table if not exists public.aio_debug_telemetry_latest (
  bot_id text primary key references public.aio_debug_ingest_clients(bot_id) on delete cascade,
  schema_version integer not null default 1,
  observed_at bigint not null default 0,
  cursor_after bigint not null default 0,
  cursor_max bigint not null default 0,
  process_running boolean not null default false,
  restart_count integer not null default 0,
  harness_started_at bigint,
  event_count integer not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  received_at timestamptz not null default now(),
  history_recorded_at timestamptz
);

create table if not exists public.aio_debug_maintenance (
  maintenance_key text primary key,
  last_run_at timestamptz not null default now()
);

create index if not exists aio_debug_telemetry_batches_bot_received_idx
  on public.aio_debug_telemetry_batches(bot_id, received_at desc);

insert into public.aio_debug_telemetry_latest (
  bot_id, schema_version, observed_at, cursor_after, cursor_max, process_running,
  restart_count, harness_started_at, event_count, snapshot, events, received_at, history_recorded_at
)
select distinct on (b.bot_id)
  b.bot_id, b.schema_version, b.observed_at, b.cursor_after, b.cursor_max, b.process_running,
  b.restart_count, b.harness_started_at, b.event_count, b.snapshot, b.events, b.received_at, b.received_at
from public.aio_debug_telemetry_batches b
order by b.bot_id, b.received_at desc
on conflict (bot_id) do nothing;

comment on table public.aio_debug_telemetry_latest is
  'Latest debug telemetry state per bot. Full append-only history is sampled separately to protect Supabase quota.';
comment on table public.aio_debug_maintenance is
  'Low-frequency maintenance checkpoints for quota-safe debug telemetry retention.';
