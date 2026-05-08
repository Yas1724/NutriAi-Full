import express from "express";
const router = express.Router();

import { sendMessage, streamMessage, getChatHistory, clearChatHistory } from "../controllers/chat-controller.js";
import { verifyToken }       from "../middleware/verifyToken.js";
import { requireOnboarding } from "../middleware/requireOnboarding.js";

// All chat routes require login + completed onboarding
router.use(verifyToken, requireOnboarding);

router.post("/",              sendMessage);
router.post("/stream",        streamMessage);
router.get("/history",        getChatHistory);
router.delete("/history",     clearChatHistory);

export default router;