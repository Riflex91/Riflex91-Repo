CREATE TABLE IF NOT EXISTS character_status (
  name TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_character_status_received_at
  ON character_status(received_at);

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
CREATE INDEX IF NOT EXISTS idx_brain_decisions_created_at
  ON brain_decisions(created_at);

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
CREATE INDEX IF NOT EXISTS idx_brain_learning_events_created_at
  ON brain_learning_events(created_at);
