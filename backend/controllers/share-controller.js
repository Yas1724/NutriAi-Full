import pool from "../database/connectionToDatabase.js";
import crypto from "crypto";

const MAX_LINKS_PER_USER = 5;

const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    if (period === "daily") {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
        startDate = new Date(now);
        const dow = (startDate.getDay() + 6) % 7;
        startDate.setDate(startDate.getDate() - dow);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        throw new Error("Invalid period.");
    }
    return { start: startDate.toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
};

const aggregateLogs = async (userId, start, end) => {
    const result = await pool.query(
        `SELECT COALESCE(SUM(calories),0) AS calories, COALESCE(SUM(protein_g),0) AS protein,
                COALESCE(SUM(carbs_g),0) AS carbs, COALESCE(SUM(fat_g),0) AS fat, COUNT(*) AS meals
         FROM food_logs WHERE user_id=$1 AND log_date>=$2 AND log_date<=$3`,
        [userId, start, end]
    );
    const r = result.rows[0];
    return { calories: parseFloat(r.calories), protein: parseFloat(r.protein), carbs: parseFloat(r.carbs), fat: parseFloat(r.fat), meals: parseInt(r.meals) };
};

export const getStats = async (req, res) => {
    try {
        const period = ["daily","weekly","monthly"].includes(req.query.period) ? req.query.period : "daily";
        const { start, end } = getDateRange(period);
        const stats = await aggregateLogs(req.userId, start, end);
        res.status(200).json({ success: true, stats, period, start, end });
    } catch {
        res.status(400).json({ success: false, message: "Failed to fetch stats" });
    }
};

export const getLinks = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT token, period, created_at AS "createdAt", expires_at AS "expiresAt"
             FROM shared_links WHERE user_id=$1 ORDER BY created_at DESC`,
            [req.userId]
        );
        res.status(200).json({ success: true, links: result.rows });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch links" });
    }
};

export const generateLink = async (req, res) => {
    try {
        const { period } = req.body;
        if (!["daily","weekly","monthly"].includes(period)) {
            return res.status(400).json({ success: false, message: "Invalid period" });
        }

        // ── Enforce per-user link limit ──────────────────────────────────────
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM shared_links WHERE user_id=$1 AND expires_at > NOW()`,
            [req.userId]
        );
        if (parseInt(countResult.rows[0].count) >= MAX_LINKS_PER_USER) {
            return res.status(429).json({ success: false, message: `Max ${MAX_LINKS_PER_USER} active links allowed. Delete one first.` });
        }

        const token     = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const result = await pool.query(
            `INSERT INTO shared_links (user_id, token, period, expires_at)
             VALUES ($1,$2,$3,$4) RETURNING token, period, created_at AS "createdAt", expires_at AS "expiresAt"`,
            [req.userId, token, period, expiresAt.toISOString()]
        );
        res.status(201).json({ success: true, link: result.rows[0] });
    } catch {
        res.status(500).json({ success: false, message: "Failed to generate link" });
    }
};

export const deleteLink = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token || token.length !== 64) {
            return res.status(400).json({ success: false, message: "Invalid token" });
        }
        const result = await pool.query(
            `DELETE FROM shared_links WHERE token=$1 AND user_id=$2 RETURNING token`,
            [token, req.userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }
        res.status(200).json({ success: true });
    } catch {
        res.status(500).json({ success: false, message: "Failed to delete link" });
    }
};

export const viewSharedProgress = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token || token.length !== 64) {
            return res.status(400).json({ success: false, message: "Invalid token" });
        }

        const linkResult = await pool.query(
            `SELECT sl.user_id, sl.period, sl.expires_at, sl.created_at
             FROM shared_links sl WHERE sl.token=$1`,
            [token]
        );
        if (linkResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }
        const link = linkResult.rows[0];
        if (new Date(link.expires_at) < new Date()) {
            return res.status(410).json({ success: false, message: "This link has expired" });
        }

        const userResult = await pool.query(
            `SELECT name, age, height_cm AS height, weight_kg AS weight,
                    gender, goal, activity_level AS "activityLevel",
                    target_weight_kg AS "targetWeight", meals_per_day AS "mealsPerDay",
                    target_calories AS calories, target_protein_g AS protein,
                    target_carbs_g AS carbs, target_fat_g AS fat
             FROM users WHERE id=$1`,
            [link.user_id]
        );
        if (userResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const u = userResult.rows[0];
        const profile = { name: u.name, age: u.age, height: u.height, weight: u.weight, gender: u.gender, goal: u.goal, activityLevel: u.activityLevel, targetWeight: u.targetWeight, mealsPerDay: u.mealsPerDay };
        const targets = { calories: u.calories, protein: u.protein, carbs: u.carbs, fat: u.fat };
        const { start, end } = getDateRange(link.period);
        const stats = await aggregateLogs(link.user_id, start, end);

        res.status(200).json({ success: true, stats, profile, targets, period: link.period, generatedAt: link.created_at, start, end });
    } catch {
        res.status(500).json({ success: false, message: "Failed to load progress" });
    }
};