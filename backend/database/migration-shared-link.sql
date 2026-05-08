-- ─────────────────────────────────────────────────────────────────────────────
--  NutriAi — shared_links table migration
--  Run this once on your Neon PostgreSQL database
-- ─────────────────────────────────────────────────────────────────────────────

-- New table for progress share links
CREATE TABLE IF NOT EXISTS shared_links (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(64) NOT NULL UNIQUE,
    period     VARCHAR(10) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP   NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shared_links_token   ON shared_links(token);
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON shared_links(user_id);

-- Add meals_per_day + custom_meal_name columns to users (from onboarding feature)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS meals_per_day     INTEGER     DEFAULT 3,
    ADD COLUMN IF NOT EXISTS custom_meal_name  VARCHAR(50) DEFAULT NULL;