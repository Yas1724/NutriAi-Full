-- ============================================================
--  Migration: Add OAuth support columns to users table
--  Run once:
--    psql -U postgres -d your_db_name -f migration-oauth.sql
-- ============================================================

-- Add google_id column (nullable — only set for OAuth users)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Optional: allow NULL passwords (for users who only ever sign in via OAuth)
-- The password column stores a bcrypt hash of a random secret for OAuth users,
-- so it stays NOT NULL — no change needed there.

-- Index for fast OAuth lookups by google_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
  ON users (google_id)
  WHERE google_id IS NOT NULL;

-- Done
