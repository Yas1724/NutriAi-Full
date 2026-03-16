import express from "express";
const router = express.Router();

import { getWeeklyReview, getMenu, saveMenu, askRAG } from "../controllers/review-controller.js";
import { verifyToken }       from "../middleware/verifyToken.js";
import { requireOnboarding } from "../middleware/requireOnboarding.js";

// All review routes require login + onboarding
router.use(verifyToken, requireOnboarding);

router.get("/weekly",    getWeeklyReview);
router.get("/menu",      getMenu);
router.post("/menu/save", saveMenu);
router.post("/rag",      askRAG);

export default router;