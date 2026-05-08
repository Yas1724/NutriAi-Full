import express from "express";
const router = express.Router();
import { setupProfile, getProfile, updateProfile } from "../controllers/profile-controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

// All profile routes are protected — user must be logged in
router.post("/setup",  verifyToken, setupProfile);
router.get("/",        verifyToken, getProfile);
router.put("/update",  verifyToken, updateProfile);

export default router;
