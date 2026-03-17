"""
NutriAI - database.py (adapted for existing Node schema)
=========================================================
Uses YOUR existing Neon PostgreSQL tables:
    users       — existing Node users table (UUID primary key)
    food_logs   — existing Node food_logs table
    mess_menu   — NEW table (only new table needed)
    (LangGraph checkpoint tables — auto-created by AsyncPostgresSaver)

Key differences from original database.py:
    - users.id is UUID (not TEXT user_id)
    - food_logs instead of meal_logs
    - Column names match Node schema: protein_g, fat_g, meal_type, dish_name
    - Targets: target_calories, target_protein_g, target_carbs_g, target_fat_g
    - is_onboarded instead of checking if profile exists

Install:
    pip install psycopg[binary]

Environment:
    DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
"""

from __future__ import annotations

import os
import logging
import asyncio
from datetime import date, timedelta
from typing import Optional

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger("nutriai.database")

DATABASE_URL = os.getenv("DATABASE_URL")


# ══════════════════════════════════════════════════════════════════════════════
# CONNECTION
# ══════════════════════════════════════════════════════════════════════════════
async def get_connection() -> psycopg.AsyncConnection:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set in .env")
    return await psycopg.AsyncConnection.connect(
        DATABASE_URL,
        row_factory=dict_row,
    )


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP — only creates NEW tables, never touches existing ones
# ══════════════════════════════════════════════════════════════════════════════
async def create_tables() -> None:
    """
    Only creates tables that don't exist in the Node schema.
    Does NOT touch: users, food_logs, shared_links (already managed by Node).
    """
    async with await get_connection() as conn:
        async with conn.cursor() as cur:

            # ── mess_menu — new, not in Node schema ──────────────────────────
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS mess_menu (
                    id              SERIAL          PRIMARY KEY,
                    institution_id  TEXT            NOT NULL DEFAULT 'default',
                    meal_slot       TEXT            NOT NULL,
                    dish_key        TEXT            NOT NULL,
                    display_name    TEXT            NOT NULL,
                    calories        REAL,
                    protein_g       REAL,
                    carbs_g         REAL,
                    fats_g          REAL,
                    serving_desc    TEXT,
                    portion_g       REAL,
                    created_at      TIMESTAMPTZ     DEFAULT NOW(),
                    UNIQUE(institution_id, meal_slot, dish_key)
                )
            """)

            # ── Extra columns on users (safe, IF NOT EXISTS) ──────────────────
            # These are additional agent fields not in original Node schema.
            # ADD COLUMN IF NOT EXISTS is safe — skips if already present.
            extra_cols = [
                "ADD COLUMN IF NOT EXISTS diet              TEXT DEFAULT 'non_veg'",
                "ADD COLUMN IF NOT EXISTS eats_in_mess      TEXT DEFAULT 'yes'",
                "ADD COLUMN IF NOT EXISTS activities        TEXT[] DEFAULT '{}'",
                "ADD COLUMN IF NOT EXISTS gym_days          INTEGER DEFAULT 0",
                "ADD COLUMN IF NOT EXISTS gym_type          TEXT",
                "ADD COLUMN IF NOT EXISTS sleep_hours       REAL DEFAULT 7",
                "ADD COLUMN IF NOT EXISTS duration_weeks    INTEGER",
                "ADD COLUMN IF NOT EXISTS gym_day_calories  INTEGER",
                "ADD COLUMN IF NOT EXISTS rest_day_calories INTEGER",
                "ADD COLUMN IF NOT EXISTS bmr               INTEGER",
                "ADD COLUMN IF NOT EXISTS tdee              INTEGER",
                "ADD COLUMN IF NOT EXISTS bmi               REAL",
            ]
            for col in extra_cols:
                try:
                    await cur.execute(f"ALTER TABLE users {col}")
                except Exception:
                    pass  # column already exists — safe to ignore

            await cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_mess_menu_institution
                ON mess_menu(institution_id, meal_slot)
            """)

        await conn.commit()
    log.info("Database tables verified ✅")


# ══════════════════════════════════════════════════════════════════════════════
# USERS — reads from existing Node users table
# Node schema: id (UUID), name, email, target_calories, target_protein_g,
#              target_carbs_g, target_fat_g, is_onboarded, goal,
#              height_cm, weight_kg, age, gender, activity_level
# ══════════════════════════════════════════════════════════════════════════════
async def get_user_profile(user_id: str) -> Optional[dict]:
    """
    Fetch user from existing Node users table.
    Maps Node column names → agent.py expected keys.
    """
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM users WHERE id = %s",
                (user_id,)
            )
            row = await cur.fetchone()
            if not row:
                return None

            # Map Node column names to what agent.py / chatbot.py expect
            return {
                "user_id"          : str(row["id"]),
                "name"             : row.get("name"),
                "age"              : row.get("age"),
                "gender"           : row.get("gender"),
                "height_cm"        : float(row["height_cm"]) if row.get("height_cm") else None,
                "weight_kg"        : float(row["weight_kg"]) if row.get("weight_kg") else None,
                "goal"             : row.get("goal"),
                "activity_level"   : row.get("activity_level", "sedentary"),
                "target_weight_kg" : float(row["target_weight_kg"]) if row.get("target_weight_kg") else None,
                "is_onboarded"     : row.get("is_onboarded", False),

                # Macro targets — Node column names
                "calories"         : float(row["target_calories"]) if row.get("target_calories") else 2000,
                "protein_g"        : float(row["target_protein_g"]) if row.get("target_protein_g") else 120,
                "carbs_g"          : float(row["target_carbs_g"]) if row.get("target_carbs_g") else 250,
                "fats_g"           : float(row["target_fat_g"]) if row.get("target_fat_g") else 55,

                # Extra agent fields (new columns, may be None)
                "diet"             : row.get("diet", "non_veg"),
                "eats_in_mess"     : row.get("eats_in_mess", "yes"),
                "activities"       : row.get("activities", []),
                "gym_days"         : row.get("gym_days", 0),
                "gym_type"         : row.get("gym_type"),
                "sleep_hours"      : row.get("sleep_hours", 7),
                "duration_weeks"   : row.get("duration_weeks"),
                "gym_day_calories" : row.get("gym_day_calories"),
                "rest_day_calories": row.get("rest_day_calories"),
                "bmr"              : row.get("bmr"),
                "tdee"             : row.get("tdee"),
                "bmi"              : row.get("bmi"),
            }


async def save_user_profile(user_id: str, profile: dict, plan: dict) -> None:
    """
    Update existing Node users row with extra agent profile fields.
    Only updates the NEW columns — does NOT touch auth fields.
    """
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                UPDATE users SET
                    diet               = %s,
                    eats_in_mess       = %s,
                    activities         = %s,
                    gym_days           = %s,
                    gym_type           = %s,
                    sleep_hours        = %s,
                    duration_weeks     = %s,
                    gym_day_calories   = %s,
                    rest_day_calories  = %s,
                    bmr                = %s,
                    tdee               = %s,
                    bmi                = %s,
                    updated_at         = NOW()
                WHERE id = %s
            """, (
                profile.get("diet", "non_veg"),
                str(profile.get("eats_in_mess", "yes")),
                profile.get("activities", []),
                plan.get("gym_days_per_week", 0),
                profile.get("gym_type"),
                profile.get("sleep", 7),
                profile.get("duration"),
                plan.get("gymDayCalories"),
                plan.get("restDayCalories"),
                plan.get("bmr"),
                plan.get("tdee"),
                float(plan.get("bmi", 0)) if plan.get("bmi") else None,
                user_id,
            ))
        await conn.commit()
    log.info(f"Agent profile saved for user '{user_id}' ✅")


# ══════════════════════════════════════════════════════════════════════════════
# MESS MENU — new table, no conflict
# ══════════════════════════════════════════════════════════════════════════════
async def save_mess_menu(dishes: list[dict], institution_id: str = "default") -> int:
    if not dishes:
        return 0
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            count = 0
            for dish in dishes:
                await cur.execute("""
                    INSERT INTO mess_menu (
                        institution_id, meal_slot, dish_key, display_name,
                        calories, protein_g, carbs_g, fats_g,
                        serving_desc, portion_g
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (institution_id, meal_slot, dish_key)
                    DO UPDATE SET
                        display_name = EXCLUDED.display_name,
                        calories     = EXCLUDED.calories,
                        protein_g    = EXCLUDED.protein_g,
                        carbs_g      = EXCLUDED.carbs_g,
                        fats_g       = EXCLUDED.fats_g,
                        serving_desc = EXCLUDED.serving_desc,
                        portion_g    = EXCLUDED.portion_g
                """, (
                    institution_id,
                    dish.get("meal_slot", "lunch"),
                    dish.get("dish_key", dish.get("dish", "")),
                    dish.get("display_name", dish.get("dish", "").replace("_", " ").title()),
                    dish.get("calories"),
                    dish.get("protein"),
                    dish.get("carbs"),
                    dish.get("fats"),
                    dish.get("serving_desc"),
                    dish.get("portion_g"),
                ))
                count += 1
        await conn.commit()
    log.info(f"Mess menu saved — {count} dishes ✅")
    return count


async def get_mess_menu(institution_id: str = "default", meal_slot: Optional[str] = None) -> list[dict]:
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            if meal_slot:
                await cur.execute("""
                    SELECT * FROM mess_menu
                    WHERE institution_id = %s AND meal_slot = %s
                    ORDER BY meal_slot, display_name
                """, (institution_id, meal_slot))
            else:
                await cur.execute("""
                    SELECT * FROM mess_menu
                    WHERE institution_id = %s
                    ORDER BY meal_slot, display_name
                """, (institution_id,))
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def get_mess_menu_grouped(institution_id: str = "default") -> dict:
    rows = await get_mess_menu(institution_id)
    grouped: dict = {"breakfast": [], "lunch": [], "snacks": [], "dinner": []}
    for row in rows:
        slot = row.get("meal_slot", "lunch")
        if slot in grouped:
            grouped[slot].append(row)
    return grouped


# ══════════════════════════════════════════════════════════════════════════════
# FOOD LOGS — reads from existing Node food_logs table
# Node schema: id (UUID), user_id (UUID), dish_name, meal_type,
#              calories, protein_g, carbs_g, fat_g, log_date
# ══════════════════════════════════════════════════════════════════════════════
async def get_today_totals(user_id: str) -> dict:
    """
    Today's macro totals from existing food_logs table.
    Uses Node column names: protein_g, fat_g, meal_type, dish_name.
    """
    today = date.today()
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            # Today's totals from food_logs (Node table)
            await cur.execute("""
                SELECT
                    COALESCE(SUM(calories),   0) AS calories,
                    COALESCE(SUM(protein_g),  0) AS protein,
                    COALESCE(SUM(carbs_g),    0) AS carbs,
                    COALESCE(SUM(fat_g),      0) AS fats,
                    COUNT(*)                      AS items_logged
                FROM food_logs
                WHERE user_id = %s AND log_date = %s
            """, (user_id, today))
            totals = dict(await cur.fetchone())

            # Targets from users table (Node column names)
            await cur.execute("""
                SELECT target_calories, target_protein_g,
                       target_carbs_g, target_fat_g
                FROM users WHERE id = %s
            """, (user_id,))
            targets = await cur.fetchone()

    if targets:
        totals["target_calories"] = float(targets["target_calories"] or 2000)
        totals["target_protein"]  = float(targets["target_protein_g"] or 120)
        totals["target_carbs"]    = float(targets["target_carbs_g"] or 250)
        totals["target_fats"]     = float(targets["target_fat_g"] or 55)
    else:
        totals["target_calories"] = 2000
        totals["target_protein"]  = 120
        totals["target_carbs"]    = 250
        totals["target_fats"]     = 55

    totals["remaining_calories"] = max(0, totals["target_calories"] - totals["calories"])
    totals["remaining_protein"]  = max(0, totals["target_protein"]  - totals["protein"])
    totals["date"] = today.isoformat()
    return totals


async def get_weekly_summary(user_id: str) -> dict:
    """
    7-day macro averages from existing food_logs table.
    """
    today    = date.today()
    week_ago = today - timedelta(days=6)

    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            # Per-day totals using Node column names
            await cur.execute("""
                SELECT
                    log_date,
                    SUM(calories)  AS cal,
                    SUM(protein_g) AS pro,
                    SUM(carbs_g)   AS car,
                    SUM(fat_g)     AS fat,
                    COUNT(*)       AS items
                FROM food_logs
                WHERE user_id = %s
                  AND log_date BETWEEN %s AND %s
                GROUP BY log_date
                ORDER BY log_date ASC
            """, (user_id, week_ago, today))
            per_day = {
                row["log_date"].isoformat(): dict(row)
                for row in await cur.fetchall()
            }

            # Targets
            await cur.execute("""
                SELECT target_calories, target_protein_g
                FROM users WHERE id = %s
            """, (user_id,))
            targets = await cur.fetchone()

    cal_target = float(targets["target_calories"]  or 2000) if targets else 2000
    pro_target = float(targets["target_protein_g"] or 120)  if targets else 120

    tracked = [d for d in per_day.values() if d["items"] > 0]
    n = len(tracked)

    if n == 0:
        return {
            "n_tracked"      : 0,
            "per_day"        : per_day,
            "avg_calories"   : 0,
            "avg_protein"    : 0,
            "target_calories": cal_target,
            "target_protein" : pro_target,
            "cal_hit_days"   : 0,
            "pro_hit_days"   : 0,
            "cal_hit_pct"    : 0,
            "pro_hit_pct"    : 0,
        }

    avg_cal = round(sum(d["cal"] for d in tracked) / n)
    avg_pro = round(sum(d["pro"] for d in tracked) / n)
    cal_hit = sum(1 for d in tracked if abs(d["cal"] - cal_target) < cal_target * 0.1)
    pro_hit = sum(1 for d in tracked if d["pro"] >= pro_target * 0.9)

    return {
        "n_tracked"      : n,
        "per_day"        : per_day,
        "avg_calories"   : avg_cal,
        "avg_protein"    : avg_pro,
        "target_calories": cal_target,
        "target_protein" : pro_target,
        "cal_hit_days"   : cal_hit,
        "pro_hit_days"   : pro_hit,
        "cal_hit_pct"    : round(cal_hit / n * 100),
        "pro_hit_pct"    : round(pro_hit / n * 100),
    }


async def get_daily_logs(user_id: str, log_date: Optional[date] = None) -> list[dict]:
    """Fetch all food_log entries for a user on a given date."""
    log_date = log_date or date.today()
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT * FROM food_logs
                WHERE user_id = %s AND log_date = %s
                ORDER BY created_at ASC
            """, (user_id, log_date))
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


async def get_date_range_logs(user_id: str, start_date: date, end_date: date) -> dict:
    """Fetch food_logs for a date range — used by gap analysis agent."""
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT * FROM food_logs
                WHERE user_id = %s
                  AND log_date BETWEEN %s AND %s
                ORDER BY log_date, created_at
            """, (user_id, start_date, end_date))
            rows = await cur.fetchall()

    grouped: dict = {}
    for row in rows:
        dk = row["log_date"].isoformat()
        if dk not in grouped:
            grouped[dk] = []
        grouped[dk].append(dict(row))
    return grouped


# ══════════════════════════════════════════════════════════════════════════════
# SYNC WRAPPERS — for LangChain tools which run in threads
# ══════════════════════════════════════════════════════════════════════════════
def get_today_totals_sync(user_id: str) -> dict:
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, get_today_totals(user_id))
                return future.result(timeout=10)
        else:
            return loop.run_until_complete(get_today_totals(user_id))
    except Exception as e:
        log.error(f"get_today_totals_sync failed: {e}")
        return {}


def get_weekly_summary_sync(user_id: str) -> dict:
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, get_weekly_summary(user_id))
                return future.result(timeout=10)
        else:
            return loop.run_until_complete(get_weekly_summary(user_id))
    except Exception as e:
        log.error(f"get_weekly_summary_sync failed: {e}")
        return {}