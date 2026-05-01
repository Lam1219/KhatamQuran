CREATE TABLE IF NOT EXISTS khatam_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT,
  version INTEGER DEFAULT 1,
  updated_at INTEGER
);