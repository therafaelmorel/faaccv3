CREATE TABLE IF NOT EXISTS used_recovery_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  used_at TEXT NOT NULL
);
