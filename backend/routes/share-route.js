import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    getStats,
    getLinks,
    generateLink,
    deleteLink,
    viewSharedProgress,
} from "../controllers/share-controller.js";

const router = express.Router();

// ── Public route (no auth) ────────────────────────────────────────────────────
router.get("/view/:token", viewSharedProgress);

// ── Protected routes (require login) ─────────────────────────────────────────
router.get("/stats",        verifyToken, getStats);
router.get("/links",        verifyToken, getLinks);
router.post("/generate",    verifyToken, generateLink);
router.delete("/:token",    verifyToken, deleteLink);

export default router;