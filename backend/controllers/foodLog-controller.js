/**
 * controllers/foodLog-controller.js
 *
 * Handles all food-log CRUD + daily dashboard data.
 * Uses the FoodLog model (food_logs table) and User model (users table).
 */

import { FoodLog } from "../model/foodLog.js";
import { User }    from "../model/user.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/food-log
//  Body: { dishName, mealType, calories, proteinG, carbsG, fatG,
//          portionG?, source?, loggedVia?, imageUrl?, logDate? }
//
//  Logs a meal.  Called after the user picks a result from /nutrition/search
//  or /nutrition/classify.
// ─────────────────────────────────────────────────────────────────────────────
export const createFoodLog = async (req, res) => {
    const {
        dishName, mealType = 'snack',
        calories, proteinG = 0, carbsG = 0, fatG = 0,
        portionG, source, loggedVia = 'search',
        imageUrl, logDate,
    } = req.body;

    try {
        if (!dishName || calories === undefined) {
            return res.status(400).json({
                success: false,
                message: "dishName and calories are required",
            });
        }

        const log = await FoodLog.create({
            userId: req.userId,
            dishName, mealType,
            calories, proteinG, carbsG, fatG,
            portionG, source, loggedVia, imageUrl,
            logDate,
        });

        res.status(201).json({ success: true, log });
    } catch (error) {
        console.error("Error creating food log:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/food-log/dashboard?date=YYYY-MM-DD   (defaults to today)
//
//  Returns everything the dashboard needs in one request:
//   - user's daily targets
//   - today's macro totals (consumed)
//   - per-meal breakdown
//   - list of today's log entries
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];

        const [user, logs, totals] = await Promise.all([
            User.findById(req.userId),
            FoodLog.findByUserAndDate(req.userId, date),
            FoodLog.getDailyTotals(req.userId, date),
        ]);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Group logs by meal type for display
        const byMeal = { breakfast: [], lunch: [], dinner: [], snack: [] };
        for (const log of logs) {
            (byMeal[log.mealType] || byMeal.snack).push(log);
        }

        res.status(200).json({
            success: true,
            date,
            targets: user.dailyTargets,
            consumed: totals,
            remaining: {
                calories: Math.max(0, (user.dailyTargets.calories || 0) - totals.calories),
                proteinG: Math.max(0, (user.dailyTargets.protein  || 0) - totals.proteinG),
                carbsG:   Math.max(0, (user.dailyTargets.carbs    || 0) - totals.carbsG),
                fatG:     Math.max(0, (user.dailyTargets.fat      || 0) - totals.fatG),
            },
            logs,
            byMeal,
        });
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/food-log/history?limit=20&offset=0
//
//  Paginated log history (most-recent first) across all dates.
// ─────────────────────────────────────────────────────────────────────────────
export const getHistory = async (req, res) => {
    try {
        const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
        const offset = parseInt(req.query.offset) || 0;

        const logs = await FoodLog.findByUser(req.userId, { limit, offset });
        res.status(200).json({ success: true, logs, limit, offset });
    } catch (error) {
        console.error("Error fetching food log history:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/food-log/weekly
//
//  Daily totals for the past 7 days — useful for progress charts.
// ─────────────────────────────────────────────────────────────────────────────
export const getWeeklySummary = async (req, res) => {
    try {
        const summary = await FoodLog.getWeeklySummary(req.userId);
        res.status(200).json({ success: true, summary });
    } catch (error) {
        console.error("Error fetching weekly summary:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/food-log/:id
//
//  Deletes a log entry.  Only the owner can delete their own entries.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteFoodLog = async (req, res) => {
    try {
        const deleted = await FoodLog.deleteById(req.params.id, req.userId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Log entry not found or does not belong to you",
            });
        }
        res.status(200).json({ success: true, message: "Log entry deleted" });
    } catch (error) {
        console.error("Error deleting food log:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
