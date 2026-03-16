import express from "express";
import multer from "multer";
const router = express.Router();

import { searchNutrition, classifyFood } from "../controllers/nutrition-controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireOnboarding } from "../middleware/requireOnboarding.js";

// Multer — store image in memory (we stream it straight to Python, no disk needed)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },   // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"), false);
    }
});

// Both routes require login + completed onboarding
router.post("/search",   verifyToken, requireOnboarding, searchNutrition);
router.post("/classify", verifyToken, requireOnboarding, upload.single("image"), classifyFood);

export default router;
