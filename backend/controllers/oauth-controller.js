/**
 * controllers/oauth-controller.js
 *
 * Google OAuth 2.0 (Authorization Code flow)
 *
 * Flow:
 *   1. GET  /api/auth/oauth/google          → redirect user to Google consent
 *   2. GET  /api/auth/oauth/google/callback → Google sends back ?code=…
 *      • Exchange code for tokens
 *      • Fetch user info from Google
 *      • Find-or-create user in DB (no password required for OAuth users)
 *      • Issue httpOnly JWT cookie
 *      • Redirect to CLIENT_URL/dashboard (or /onboarding if new user)
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI   (e.g. https://your-api.com/api/auth/oauth/google/callback)
 *   CLIENT_URL            (e.g. https://nutri-ai-full.vercel.app)
 *   JWT_SECRET
 */

import crypto from 'crypto';
import { User } from '../model/user.js';
import { generateJWTToken } from '../utils/generateJWTToken.js';
import { sendWelcomeEmail } from '../resend/email.js';

// ─── PKCE helpers ─────────────────────────────────────────────────────────────
const base64URLEncode = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

// ─── Build the Google OAuth authorization URL ─────────────────────────────────
const getGoogleAuthURL = (state, codeChallenge) => {
  const params = new URLSearchParams({
    client_id:             process.env.GOOGLE_CLIENT_ID,
    redirect_uri:          process.env.GOOGLE_REDIRECT_URI,
    response_type:         'code',
    scope:                 'openid email profile',
    access_type:           'offline',
    prompt:                'select_account',
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

// ─── Exchange auth code for tokens ────────────────────────────────────────────
const exchangeCodeForTokens = async (code, codeVerifier) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
      grant_type:    'authorization_code',
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
};

// ─── Fetch Google user info ────────────────────────────────────────────────────
const fetchGoogleUserInfo = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/oauth/google
//  Initiates the OAuth flow — redirects user to Google
// ─────────────────────────────────────────────────────────────────────────────
export const googleOAuthInit = (req, res) => {
  try {
    // Generate PKCE code verifier + challenge
    const codeVerifier  = base64URLEncode(crypto.randomBytes(32));
    const codeChallenge = base64URLEncode(
      crypto.createHash('sha256').update(codeVerifier).digest()
    );

    // Random state to protect against CSRF
    const state = base64URLEncode(crypto.randomBytes(16));

    // Store verifier + state in a short-lived httpOnly cookie (10 min)
    // We piggyback both values as JSON so we only need one cookie.
    const oauthPayload = JSON.stringify({ codeVerifier, state });
    res.cookie('oauth_pkce', oauthPayload, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge:   10 * 60 * 1000, // 10 minutes
    });

    return res.redirect(getGoogleAuthURL(state, codeChallenge));
  } catch (error) {
    console.error('[OAuth] Init error:', error);
    return res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=oauth_init_failed`
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/oauth/google/callback
//  Handles the redirect back from Google
// ─────────────────────────────────────────────────────────────────────────────
export const googleOAuthCallback = async (req, res) => {
  const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const { code, state, error: googleError } = req.query;

    // ── Check for Google-side error (user denied, etc.) ──────────────────────
    if (googleError) {
      console.warn('[OAuth] Google returned error:', googleError);
      return res.redirect(`${clientURL}/?error=oauth_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${clientURL}/?error=oauth_missing_params`);
    }

    // ── Validate PKCE + state from cookie ────────────────────────────────────
    const oauthCookie = req.cookies?.oauth_pkce;
    if (!oauthCookie) {
      return res.redirect(`${clientURL}/?error=oauth_session_expired`);
    }

    let codeVerifier, savedState;
    try {
      ({ codeVerifier, state: savedState } = JSON.parse(oauthCookie));
    } catch {
      return res.redirect(`${clientURL}/?error=oauth_invalid_session`);
    }

    // Clear the PKCE cookie immediately (one-time use)
    res.clearCookie('oauth_pkce');

    if (state !== savedState) {
      console.warn('[OAuth] State mismatch — possible CSRF');
      return res.redirect(`${clientURL}/?error=oauth_state_mismatch`);
    }

    // ── Exchange code for tokens ──────────────────────────────────────────────
    const tokens   = await exchangeCodeForTokens(code, codeVerifier);
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    const { email, name, sub: googleId, email_verified } = userInfo;

    if (!email) {
      return res.redirect(`${clientURL}/?error=oauth_no_email`);
    }

    // ── Find or create user ───────────────────────────────────────────────────
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Create a new user — OAuth users have no password (set to a random hash)
      // They can set a password later via forgot-password flow if desired.
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.createOAuth({
        name:           name || email.split('@')[0],
        email,
        googleId,
        isVerified:     email_verified !== false, // Google emails are pre-verified
      }, randomPassword);
      isNewUser = true;

      // Send welcome email (fire-and-forget — don't block the redirect)
      sendWelcomeEmail(user.email, user.name).catch(() => {});
    } else if (!user.isVerified) {
      // Existing unverified user — verify them now via Google
      await User.findByIdAndUpdate(user.id, {
        isVerified:                true,
        verificationToken:          null,
        verificationTokenExpiresAt: null,
      });
    }

    // ── Issue JWT cookie ──────────────────────────────────────────────────────
    generateJWTToken(res, user.id);

    // ── Redirect to the right page ────────────────────────────────────────────
    const destination = (isNewUser || !user.profile?.isOnboarded)
      ? `${clientURL}/onboarding`
      : `${clientURL}/dashboard`;

    return res.redirect(destination);
  } catch (error) {
    console.error('[OAuth] Callback error:', error);
    return res.redirect(`${clientURL}/?error=oauth_failed`);
  }
};
