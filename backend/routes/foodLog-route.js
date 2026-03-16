import express from "express";
const router = express.Router();

import {
    createFoodLog,
    getDashboard,
    getHistory,
    getWeeklySummary,
    deleteFoodLog,
} from "../controllers/foodLog-controller.js";
import { verifyToken }        from "../middleware/verifyToken.js";
import { requireOnboarding }  from "../middleware/requireOnboarding.js";

// All food-log routes require login + completed onboarding
router.use(verifyToken, requireOnboarding);

// Dashboard (today's summary + logs)
router.get("/dashboard", getDashboard);

// Log a meal
router.post("/", createFoodLog);

// Paginated history
router.get("/history", getHistory);

// Weekly progress chart data
router.get("/weekly", getWeeklySummary);

// Delete a single entry
router.delete("/:id", deleteFoodLog);

export default router;
