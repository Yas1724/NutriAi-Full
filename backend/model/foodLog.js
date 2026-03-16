/**
 * model/foodLog.js
 *
 * PostgreSQL data-access layer for the food_logs table.
 * No Mongoose — pure pg queries.
 */

import { query } from '../database/connectionToDatabase.js';

// ─── Row → JS object mapper ───────────────────────────────────────────────────
const toLog = (row) => {
    if (!row) return null;
    return {
        id:         row.id,
        userId:     row.user_id,
        dishName:   row.dish_name,
        mealType:   row.meal_type,
        portionG:   row.portion_g   ? Number(row.portion_g)  : null,
        source:     row.source,
        calories:   Number(row.calories),
        proteinG:   Number(row.protein_g),
        carbsG:     Number(row.carbs_g),
        fatG:       Number(row.fat_g),
        loggedVia:  row.logged_via,
        imageUrl:   row.image_url,
        logDate:    row.log_date,           // JS Date (midnight UTC)
        createdAt:  row.created_at,
    };
};

export const FoodLog = {

    // ── Create a new food-log entry ──────────────────────────────────────────
    async create({
        userId, dishName, mealType = 'snack',
        portionG, source,
        calories, proteinG = 0, carbsG = 0, fatG = 0,
        loggedVia = 'search', imageUrl, logDate,
    }) {
        const { rows } = await query(
            `INSERT INTO food_logs
               (user_id, dish_name, meal_type, portion_g, source,
                calories, protein_g, carbs_g, fat_g,
                logged_via, image_url, log_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [
                userId, dishName, mealType, portionG ?? null, source ?? null,
                calories, proteinG, carbsG, fatG,
                loggedVia, imageUrl ?? null,
                logDate ? new Date(logDate) : new Date(),
            ]
        );
        return toLog(rows[0]);
    },

    // ── Get all logs for a user on a specific date ───────────────────────────
    // date: JS Date | ISO string | 'YYYY-MM-DD'
    async findByUserAndDate(userId, date) {
        const d = date ? new Date(date) : new Date();
        const { rows } = await query(
            `SELECT * FROM food_logs
             WHERE user_id = $1
               AND log_date = $2::date
             ORDER BY created_at ASC`,
            [userId, d]
        );
        return rows.map(toLog);
    },

    // ── Daily nutrition totals for a user on a specific date ─────────────────
    // Returns { calories, proteinG, carbsG, fatG }
    async getDailyTotals(userId, date) {
        const d = date ? new Date(date) : new Date();
        const { rows } = await query(
            `SELECT
               COALESCE(SUM(calories),  0) AS calories,
               COALESCE(SUM(protein_g), 0) AS protein_g,
               COALESCE(SUM(carbs_g),   0) AS carbs_g,
               COALESCE(SUM(fat_g),     0) AS fat_g
             FROM food_logs
             WHERE user_id = $1 AND log_date = $2::date`,
            [userId, d]
        );
        const r = rows[0];
        return {
            calories: Number(r.calories),
            proteinG: Number(r.protein_g),
            carbsG:   Number(r.carbs_g),
            fatG:     Number(r.fat_g),
        };
    },

    // ── Paginated history for a user (most-recent first) ─────────────────────
    async findByUser(userId, { limit = 20, offset = 0 } = {}) {
        const { rows } = await query(
            `SELECT * FROM food_logs
             WHERE user_id = $1
             ORDER BY log_date DESC, created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return rows.map(toLog);
    },

    // ── Find a single log by its id ───────────────────────────────────────────
    async findById(id) {
        const { rows } = await query(
            `SELECT * FROM food_logs WHERE id = $1 LIMIT 1`,
            [id]
        );
        return toLog(rows[0]);
    },

    // ── Delete a log entry (only if it belongs to requesting user) ───────────
    async deleteById(id, userId) {
        const { rowCount } = await query(
            `DELETE FROM food_logs WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        return rowCount > 0;   // true = deleted, false = not found / wrong user
    },

    // ── Weekly summary (last 7 days) ─────────────────────────────────────────
    async getWeeklySummary(userId) {
        const { rows } = await query(
            `SELECT
               log_date,
               COALESCE(SUM(calories),  0) AS calories,
               COALESCE(SUM(protein_g), 0) AS protein_g,
               COALESCE(SUM(carbs_g),   0) AS carbs_g,
               COALESCE(SUM(fat_g),     0) AS fat_g,
               COUNT(*)                    AS meal_count
             FROM food_logs
             WHERE user_id = $1
               AND log_date >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY log_date
             ORDER BY log_date ASC`,
            [userId]
        );
        return rows.map((r) => ({
            logDate:   r.log_date,
            calories:  Number(r.calories),
            proteinG:  Number(r.protein_g),
            carbsG:    Number(r.carbs_g),
            fatG:      Number(r.fat_g),
            mealCount: Number(r.meal_count),
        }));
    },
};
