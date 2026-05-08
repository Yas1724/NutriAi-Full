import express from "express";
import multer from "multer";
const router = express.Router();

import { getWeeklyReview, getMenu, saveMenu, askRAG, scanMenu } from "../controllers/review-controller.js";
import { verifyToken }       from "../middleware/verifyToken.js";
import { requireOnboarding } from "../middleware/requireOnboarding.js";

// Multer — memory storage, stream straight to ML service (same pattern as nutrition-route.js)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },   // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"), false);
    }
});

// All review routes require login + onboarding
router.use(verifyToken, requireOnboarding);

router.get("/weekly",        getWeeklyReview);
router.get("/menu",          getMenu);
router.post("/menu/save",    saveMenu);
router.post("/menu/scan",    upload.single("file"), scanMenu);
router.post("/rag",          askRAG);

export default router;