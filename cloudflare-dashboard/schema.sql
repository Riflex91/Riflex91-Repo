-- AiO Bot v3 Control Center / Brain long-term memory.
-- Existing v2 tables are intentionally retained so an existing D1 database can be migrated in place.

CREATE TABLE IF NOT EXISTS character_status (
  name TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_character_status_received_at ON character_status(received_at);

CREATE TABLE IF NOT EXISTS aio_state (
  account TEXT NOT NULL,
  namespace TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(account, namespace)
);

CREATE TABLE IF NOT EXISTS brain_usage (
  day TEXT PRIMARY KEY,
  neurons REAL NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS brain_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  character TEXT NOT NULL,
  trigger TEXT,
  decision TEXT NOT NULL,
  neurons REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_brain_decisions_created_at ON brain_decisions(created_at);

CREATE TABLE IF NOT EXISTS brain_learning_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  character TEXT NOT NULL,
  event_type TEXT NOT NULL,
  action TEXT,
  target TEXT,
  reward REAL NOT NULL DEFAULT 0,
  payload TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_brain_learning_events_created_at ON brain_learning_events(created_at);

CREATE TABLE IF NOT EXISTS v3_runtime_status (
  account TEXT NOT NULL,
  character TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  PRIMARY KEY(account, character)
);
CREATE INDEX IF NOT EXISTS idx_v3_runtime_received_at ON v3_runtime_status(received_at);

CREATE TABLE IF NOT EXISTS v3_control_settings (
  account TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS v3_control_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  revision INTEGER NOT NULL,
  patch TEXT NOT NULL,
  rejected TEXT,
  actor TEXT NOT NULL DEFAULT 'dashboard',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_v3_control_audit_account_at ON v3_control_audit(account, created_at DESC);

CREATE TABLE IF NOT EXISTS v3_brain_state (
  account TEXT NOT NULL,
  character TEXT NOT NULL,
  samples INTEGER NOT NULL DEFAULT 0,
  updates INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(account, character)
);
CREATE INDEX IF NOT EXISTS idx_v3_brain_state_updated_at ON v3_brain_state(updated_at);

CREATE TABLE IF NOT EXISTS v3_runtime_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  character TEXT NOT NULL,
  event_key TEXT NOT NULL,
  severity TEXT,
  component TEXT,
  event TEXT,
  reason TEXT,
  payload TEXT,
  event_at INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  UNIQUE(account, character, event_key)
);
CREATE INDEX IF NOT EXISTS idx_v3_runtime_events_account_at ON v3_runtime_events(account, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_v3_runtime_events_severity ON v3_runtime_events(account, severity, event_at DESC);

CREATE TABLE IF NOT EXISTS v3_market_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account TEXT NOT NULL,
  item_key TEXT NOT NULL,
  fair_value REAL,
  median_ask REAL,
  max_bid REAL,
  liquidity REAL,
  confidence REAL,
  observed_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_v3_market_item_at ON v3_market_snapshots(account, item_key, observed_at DESC);

-- Alpha20.21: cloud-primary long-term state. The browser keeps only a bounded
-- fallback queue; these records are the authoritative durable copy.
CREATE TABLE IF NOT EXISTS v3_long_term_state (
  account TEXT NOT NULL,
  namespace TEXT NOT NULL,
  state_key TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(account, namespace, state_key)
);
CREATE INDEX IF NOT EXISTS idx_v3_long_term_state_account_at ON v3_long_term_state(account, updated_at DESC);

-- Alpha20.21: every real remote Teacher attempt is recorded, including failures.
-- This supports a true rolling-24h global budget and failed-attempt backoff.
CREATE TABLE IF NOT EXISTS brain_teacher_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_key TEXT NOT NULL,
  account TEXT NOT NULL,
  character TEXT NOT NULL,
  status TEXT NOT NULL,
  neurons REAL NOT NULL DEFAULT 0,
  decision TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_brain_teacher_attempts_at ON brain_teacher_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_teacher_attempts_key_at ON brain_teacher_attempts(request_key, created_at DESC);
