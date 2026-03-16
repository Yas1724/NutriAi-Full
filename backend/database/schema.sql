-- ============================================================
--  PostgreSQL Schema  –  Nutrition Tracker (CalAI-style)
--  Two tables: users  +  food_logs
--  Run once to bootstrap the DB:
--    psql -U postgres -d your_db_name -f schema.sql
-- ============================================================

-- ─── EXTENSION ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gives us gen_random_uuid()

-- ─── ENUM TYPES ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE gender_type    AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE goal_type AS ENUM ('lose_weight', 'gain_weight', 'maintain', 'build_muscle');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── TABLE: users ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  -- identity
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT        NOT NULL,
  email                       TEXT        NOT NULL UNIQUE,
  password                    TEXT        NOT NULL,

  -- email verification
  is_verified                 BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_token          TEXT,
  verification_token_expires  TIMESTAMPTZ,

  -- password reset
  reset_password_token        TEXT,
  reset_password_expires      TIMESTAMPTZ,

  -- ── onboarding / goal profile ───────────────────────────
  age                         SMALLINT    CHECK (age BETWEEN 10 AND 120),
  height_cm                   NUMERIC(5,1) CHECK (height_cm BETWEEN 50 AND 300),
  weight_kg                   NUMERIC(5,1) CHECK (weight_kg BETWEEN 20 AND 500),
  gender                      gender_type,
  goal                        goal_type,
  activity_level              activity_type NOT NULL DEFAULT 'sedentary',
  target_weight_kg            NUMERIC(5,1),
  is_onboarded                BOOLEAN     NOT NULL DEFAULT FALSE,

  -- ── daily macro targets (computed by ML service) ────────
  target_calories             NUMERIC(7,1),
  target_protein_g            NUMERIC(6,1),
  target_carbs_g              NUMERIC(6,1),
  target_fat_g                NUMERIC(6,1),

  -- timestamps
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── TABLE: food_logs ────────────────────────────────────────
-- One row per meal entry logged by a user
CREATE TABLE IF NOT EXISTS food_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- what was eaten
  dish_name    TEXT        NOT NULL,
  meal_type    meal_type   NOT NULL DEFAULT 'snack',
  portion_g    NUMERIC(7,1),             -- grams (optional, from ML)
  source       TEXT,                     -- 'usda' | 'spoonacular' | 'manual' etc.

  -- nutrition per logged portion
  calories     NUMERIC(7,1) NOT NULL,
  protein_g    NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g      NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g        NUMERIC(6,1) NOT NULL DEFAULT 0,

  -- how it was logged
  logged_via   TEXT        DEFAULT 'search',   -- 'search' | 'image' | 'manual'
  image_url    TEXT,                            -- if logged via photo

  -- the calendar date this meal belongs to (not necessarily today — user can backfill)
  log_date     DATE        NOT NULL DEFAULT CURRENT_DATE,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
-- Most common query pattern: all logs for a user on a given day
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date
  ON food_logs (user_id, log_date DESC);

-- Useful for analytics / streaks
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id
  ON food_logs (user_id);
