import { User } from "../model/user.js";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateJWTToken } from "../utils/generateJWTToken.js";
import {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
} from "../resend/email.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────────
export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword     = await bcrypt.hash(password, 10);
        const verificationToken  = generateVerificationToken();

        const user = await User.create({
            name,
            email,
            password:                   hashedPassword,
            verificationToken,
            verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        generateJWTToken(res, user.id);
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id:         user.id,
                name:       user.name,
                email:      user.email,
                isVerified: user.isVerified,
                profile:    user.profile,
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, msg: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, msg: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, msg: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(400).json({ success: false, msg: "Email not verified" });
        }

        generateJWTToken(res, user.id);
        res.status(200).json({ success: true, msg: "Login successfully" });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(400).json({ success: false, msg: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (_req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ success: true, msg: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ success: false, msg: "Error during logout" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/verify-email
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
    const { code } = req.body;
    try {
        const user = await User.findOne({
            verificationToken:          code,
            verificationTokenExpiresAt: { $gt: Date.now() },   // handled in model
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
        }

        await User.findByIdAndUpdate(user.id, {
            isVerified:                 true,
            verificationToken:          null,
            verificationTokenExpiresAt: null,
        });

        await sendWelcomeEmail(user.email, user.name);
        res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const resetPasswordToken     = crypto.randomBytes(32).toString("hex");
        const resetPasswordExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        await User.findByIdAndUpdate(user.id, { resetPasswordToken, resetPasswordExpiresAt });

        await sendPasswordResetEmail(
            user.email,
                `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`
        );

        res.status(200).json({ success: true, message: "Password reset email sent successfully!" });
    } catch (error) {
        console.error("Error sending password reset email:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        const { token }    = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken:     token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, msg: "Invalid or expired reset token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findByIdAndUpdate(user.id, {
            password:               hashedPassword,
            resetPasswordToken:     null,
            resetPasswordExpiresAt: null,
        });

        await sendResetSuccessEmail(user.email);
        res.status(200).json({ success: true, msg: "Password reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(400).json({ success: false, msg: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/check-auth
// ─────────────────────────────────────────────────────────────────────────────
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                id:           user.id,
                name:         user.name,
                email:        user.email,
                isVerified:   user.isVerified,
                profile:      user.profile,
                dailyTargets: user.dailyTargets,
            },
        });
    } catch (error) {
        console.error("Error checking auth:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
