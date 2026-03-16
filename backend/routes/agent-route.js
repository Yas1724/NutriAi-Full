import express from "express";
const router = express.Router();

import {
    startOnboarding,
    replyOnboarding,
    startGapAnalysis,
    confirmGapRecommendation,
    getGapStatus,
} from "../controllers/agent-controller.js";
import { verifyToken }       from "../middleware/verifyToken.js";
import { requireOnboarding } from "../middleware/requireOnboarding.js";

// Onboarding routes — only need login (not onboarded yet)
router.post("/onboarding/start", verifyToken, startOnboarding);
router.post("/onboarding/reply", verifyToken, replyOnboarding);

// Gap analysis routes — need login + onboarded
router.post("/gap/start",   verifyToken, requireOnboarding, startGapAnalysis);
router.post("/gap/confirm", verifyToken, requireOnboarding, confirmGapRecommendation);
router.get("/gap/status",   verifyToken, requireOnboarding, getGapStatus);

export default router;