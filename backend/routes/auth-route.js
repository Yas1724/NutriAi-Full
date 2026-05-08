import express from "express";
const router = express.Router();
import { signup, login, logout, verifyEmail, forgotPassword, resetPassword, checkAuth } from "../controllers/auth-controller.js";
import { googleOAuthInit, googleOAuthCallback } from "../controllers/oauth-controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

// ── Standard auth ─────────────────────────────────────────────────────────────
router.post('/signup',                signup);
router.post('/login',                 login);
router.post('/logout',                logout);
router.post('/verify-email',          verifyEmail);
router.post('/forgot-password',       forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/check-auth', verifyToken, checkAuth);

// ── OAuth 2.0 ─────────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google consent screen
router.get('/oauth/google', googleOAuthInit);

// Step 2: Google redirects back here with ?code=…
router.get('/oauth/google/callback', googleOAuthCallback);

export default router;