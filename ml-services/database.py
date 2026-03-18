"""
NutriAI - database.py (fixed for existing Node.js schema)
=========================================================
- users table: PK is 'id' UUID (not 'user_id' TEXT)
- column names match Node.js backend: target_calories, target_protein_g, target_carbs_g, target_fat_g, target_weight_kg
- Does NOT recreate users/mess_menu tables (already exist)
- Only creates meal_logs table (ML-service only)
- Windows compatible: SelectorEventLoop set in main.py
"""

from __future__ import annotations

import os
import sys
import json
import logging
import asyncio
from datetime import date, timedelta
from typing import Optional
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

# Load from local .env first, then root .env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=False)

log = logging.getLogger("nutriai.database")
DATABASE_URL = os.getenv("DATABASE_URL")


async def get_connection() -> psycopg.AsyncConnection:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set in .env")
    return await psycopg.AsyncConnection.connect(DATABASE_URL, row_factory=dict_row)


async def create_tables() -> None:
    """
    Only creates meal_logs table (ML-service only).
    users and mess_menu already exist from Node.js backend.
    Also runs safe ALTER TABLE to add ML-specific columns to users.
    """
    async with await get_connection() as conn:
        async with conn.cursor() as cur:

            # Add ML-specific columns to existing users table (safe)
            await cur.execute("""
                ALTER TABLE users
                    ADD COLUMN IF NOT EXISTS diet               TEXT    DEFAULT 'non_veg',
                    ADD COLUMN IF NOT EXISTS eats_in_mess       TEXT    DEFAULT 'yes',
                    ADD COLUMN IF NOT EXISTS activities         TEXT[]  DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS gym_days           INTEGER DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS gym_type           TEXT,
                    ADD COLUMN IF NOT EXISTS sleep_hours        REAL    DEFAULT 7,
                    ADD COLUMN IF NOT EXISTS gym_day_calories   INTEGER,
                    ADD COLUMN IF NOT EXISTS rest_day_calories  INTEGER,
                    ADD COLUMN IF NOT EXISTS bmr                INTEGER,
                    ADD COLUMN IF NOT EXISTS tdee               INTEGER,
                    ADD COLUMN IF NOT EXISTS bmi                REAL
            """)

            # meal_logs — ML service only table
            await cur.execute("""
                CREATE TABLE IF NOT EXISTS meal_logs (
                    id                 SERIAL      PRIMARY KEY,
                    user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    log_date           DATE        NOT NULL DEFAULT CURRENT_DATE,
                    meal_slot          TEXT        NOT NULL,
                    dish_key           TEXT        NOT NULL,
                    display_name       TEXT        NOT NULL,
                    calories           REAL        NOT NULL DEFAULT 0,
                    protein_g          REAL        NOT NULL DEFAULT 0,
                    carbs_g            REAL        NOT NULL DEFAULT 0,
                    fats_g             REAL        NOT NULL DEFAULT 0,
                    serving_desc       TEXT,
                    portion_multiplier REAL        DEFAULT 1.0,
                    source             TEXT        DEFAULT 'menu',
                    skipped            BOOLEAN     DEFAULT FALSE,
                    notes              TEXT,
                    logged_at          TIMESTAMPTZ DEFAULT NOW()
                )
            """)

            await cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
                ON meal_logs(user_id, log_date)
            """)
            await cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_meal_logs_user_slot
                ON meal_logs(user_id, log_date, meal_slot)
            """)

        await conn.commit()
    log.info("Database tables verified ✅")


async def save_user_profile(user_id: str, profile: dict, plan: dict) -> None:
    """Update ML-specific columns on existing user row."""
    activities = profile.get("activities", [])
    if isinstance(activities, str):
        activities = [a.strip() for a in activities.split(",")]

    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                UPDATE users SET
                    goal                = %s,
                    diet                = %s,
                    eats_in_mess        = %s,
                    activities          = %s,
                    gym_days            = %s,
                    gym_type            = %s,
                    sleep_hours         = %s,
                    target_weight_kg    = %s,
                    duration_weeks      = %s,
                    target_calories     = %s,
                    gym_day_calories    = %s,
                    rest_day_calories   = %s,
                    target_protein_g    = %s,
                    target_carbs_g      = %s,
                    target_fat_g        = %s,
                    bmr                 = %s,
                    tdee                = %s,
                    bmi                 = %s,
                    updated_at          = NOW()
                WHERE id = %s
            """, (
                plan.get("goal"),
                profile.get("diet"),
                str(profile.get("eats_in_mess", "yes")),
                activities,
                plan.get("gym_days_per_week", 0),
                profile.get("gym_type"),
                profile.get("sleep", 7),
                profile.get("target_weight"),
                profile.get("duration"),
                plan.get("calories"),
                plan.get("gymDayCalories"),
                plan.get("restDayCalories"),
                plan.get("protein"),
                plan.get("carbs"),
                plan.get("fats"),
                plan.get("bmr"),
                plan.get("tdee"),
                float(plan.get("bmi", 0)),
                user_id,
            ))
        await conn.commit()
    log.info(f"User profile updated for '{user_id}' ✅")


async def get_user_profile(user_id: str) -> Optional[dict]:
    """Fetch user profile. user_id is UUID matching users.id"""
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM users WHERE id = %s",
                (user_id,)
            )
            row = await cur.fetchone()
            return dict(row) if row else None


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
                        calories, protein_g, carbs_g, fats_g, serving_desc, portion_g
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
                    dish.get("calories"), dish.get("protein"),
                    dish.get("carbs"),    dish.get("fats"),
                    dish.get("serving_desc"), dish.get("portion_g"),
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
                    SELECT * FROM mess_menu WHERE institution_id = %s
                    ORDER BY meal_slot, display_name
                """, (institution_id,))
            return [dict(r) for r in await cur.fetchall()]


async def get_mess_menu_grouped(institution_id: str = "default") -> dict:
    rows = await get_mess_menu(institution_id)
    grouped: dict = {"breakfast": [], "lunch": [], "snacks": [], "dinner": []}
    for row in rows:
        slot = row.get("meal_slot", "lunch")
        if slot in grouped:
            grouped[slot].append(row)
    return grouped


async def log_meal(user_id: str, meal_slot: str, dish: dict,
                   log_date: Optional[date] = None, source: str = "menu") -> int:
    log_date = log_date or date.today()
    multiplier = dish.get("portion_multiplier", 1.0)
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                INSERT INTO meal_logs (
                    user_id, log_date, meal_slot, dish_key, display_name,
                    calories, protein_g, carbs_g, fats_g,
                    serving_desc, portion_multiplier, source, skipped, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                user_id, log_date, meal_slot,
                dish.get("dish_key", dish.get("dish", "")),
                dish.get("display_name", dish.get("dish", "").replace("_", " ").title()),
                round(dish.get("calories", 0) * multiplier, 1),
                round(dish.get("protein",  0) * multiplier, 1),
                round(dish.get("carbs",    0) * multiplier, 1),
                round(dish.get("fats",     0) * multiplier, 1),
                dish.get("serving_desc"), multiplier, source,
                dish.get("skipped", False), dish.get("notes"),
            ))
            row = await cur.fetchone()
        await conn.commit()
    return row["id"]


async def delete_meal_log(log_id: int, user_id: str) -> bool:
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM meal_logs WHERE id = %s AND user_id = %s",
                (log_id, user_id)
            )
            deleted = cur.rowcount > 0
        await conn.commit()
    return deleted


async def get_daily_logs(user_id: str, log_date: Optional[date] = None) -> list[dict]:
    log_date = log_date or date.today()
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT * FROM meal_logs
                WHERE user_id = %s AND log_date = %s AND skipped = FALSE
                ORDER BY logged_at ASC
            """, (user_id, log_date))
            return [dict(r) for r in await cur.fetchall()]


async def get_today_totals(user_id: str) -> dict:
    today = date.today()
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT
                    COALESCE(SUM(calories),  0) AS calories,
                    COALESCE(SUM(protein_g), 0) AS protein,
                    COALESCE(SUM(carbs_g),   0) AS carbs,
                    COALESCE(SUM(fats_g),    0) AS fats,
                    COUNT(*) AS items_logged
                FROM meal_logs
                WHERE user_id = %s AND log_date = %s AND skipped = FALSE
            """, (user_id, today))
            totals = dict(await cur.fetchone())

            await cur.execute("""
                SELECT target_calories, target_protein_g, target_carbs_g, target_fat_g
                FROM users WHERE id = %s
            """, (user_id,))
            targets = await cur.fetchone()

    if targets:
        totals["target_calories"] = targets["target_calories"] or 2000
        totals["target_protein"]  = targets["target_protein_g"] or 120
        totals["target_carbs"]    = targets["target_carbs_g"] or 250
        totals["target_fats"]     = targets["target_fat_g"] or 55
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
    today    = date.today()
    week_ago = today - timedelta(days=6)
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT
                    log_date,
                    SUM(calories)  AS cal,
                    SUM(protein_g) AS pro,
                    SUM(carbs_g)   AS car,
                    SUM(fats_g)    AS fat,
                    COUNT(*)       AS items
                FROM meal_logs
                WHERE user_id = %s AND log_date BETWEEN %s AND %s AND skipped = FALSE
                GROUP BY log_date ORDER BY log_date ASC
            """, (user_id, week_ago, today))
            per_day = {row["log_date"].isoformat(): dict(row) for row in await cur.fetchall()}

            await cur.execute(
                "SELECT target_calories, target_protein_g FROM users WHERE id = %s",
                (user_id,)
            )
            targets = await cur.fetchone()

    cal_target = targets["target_calories"]  if targets else 2000
    pro_target = targets["target_protein_g"] if targets else 120
    tracked = [d for d in per_day.values() if d["items"] > 0]
    n = len(tracked)

    if n == 0:
        return {"n_tracked": 0, "per_day": per_day, "avg_calories": 0,
                "avg_protein": 0, "target_calories": cal_target,
                "target_protein": pro_target, "cal_hit_days": 0, "pro_hit_days": 0}

    avg_cal = round(sum(d["cal"] for d in tracked) / n)
    avg_pro = round(sum(d["pro"] for d in tracked) / n)
    cal_hit = sum(1 for d in tracked if abs(d["cal"] - cal_target) < cal_target * 0.1)
    pro_hit = sum(1 for d in tracked if d["pro"] >= pro_target * 0.9)

    return {
        "n_tracked": n, "per_day": per_day,
        "avg_calories": avg_cal, "avg_protein": avg_pro,
        "target_calories": cal_target, "target_protein": pro_target,
        "cal_hit_days": cal_hit, "pro_hit_days": pro_hit,
        "cal_hit_pct": round(cal_hit / n * 100),
        "pro_hit_pct": round(pro_hit / n * 100),
    }


async def get_date_range_logs(user_id: str, start_date: date, end_date: date) -> dict:
    async with await get_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT * FROM meal_logs
                WHERE user_id = %s AND log_date BETWEEN %s AND %s
                ORDER BY log_date, meal_slot, logged_at
            """, (user_id, start_date, end_date))
            rows = await cur.fetchall()
    grouped: dict = {}
    for row in rows:
        dk = row["log_date"].isoformat()
        grouped.setdefault(dk, []).append(dict(row))
    return grouped


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
