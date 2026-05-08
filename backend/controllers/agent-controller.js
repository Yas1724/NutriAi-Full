import axios from "axios";

const ML = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/agent/onboarding/start
//  Starts conversational onboarding session → returns first question
// ─────────────────────────────────────────────────────────────────────────────
export const startOnboarding = async (req, res) => {
    try {
        const { data } = await axios.post(`${ML}/onboarding/start`, {
            session_id: req.userId,
            user_id:    req.userId,
        }, { timeout: 15000 });

        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error("Onboarding start error:", error.message);
        res.status(500).json({ success: false, message: "Onboarding service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/agent/onboarding/reply
//  Body: { message: string }
//  User replies to onboarding question → next question or completed plan
// ─────────────────────────────────────────────────────────────────────────────
export const replyOnboarding = async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: "Message is required" });
    }

    try {
        const { data } = await axios.post(`${ML}/onboarding/reply`, {
            session_id: req.userId,
            message:    message.trim(),
        }, { timeout: 30000 });

        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error("Onboarding reply error:", error.message);
        res.status(500).json({ success: false, message: "Onboarding service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/agent/gap/start
//  Body: { weekly_menu: { monday: { breakfast: [...], lunch: [...] }, ... } }
//  Starts gap analysis for user's weekly menu selection
//  Returns first recommendation for user to confirm (HITL)
// ─────────────────────────────────────────────────────────────────────────────
export const startGapAnalysis = async (req, res) => {
    const { weekly_menu } = req.body;

    if (!weekly_menu) {
        return res.status(400).json({ success: false, message: "weekly_menu is required" });
    }

    try {
        const { data } = await axios.post(`${ML}/gap/start`, {
            user_id:     req.userId,
            weekly_menu: weekly_menu,
        }, { timeout: 60000 }); // LLM recommendation generation can take time

        res.status(200).json({ success: true, ...data });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please complete onboarding first."
            });
        }
        console.error("Gap analysis error:", error.message);
        res.status(500).json({ success: false, message: "Gap analysis service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/agent/gap/confirm
//  Body: { day: string, accepted: boolean }
//  Human-in-the-loop response — user confirms or skips a recommendation
// ─────────────────────────────────────────────────────────────────────────────
export const confirmGapRecommendation = async (req, res) => {
    const { day, accepted } = req.body;

    if (!day || accepted === undefined) {
        return res.status(400).json({ success: false, message: "day and accepted are required" });
    }

    try {
        const { data } = await axios.post(`${ML}/gap/confirm`, {
            user_id:  req.userId,
            day:      day,
            accepted: accepted,
        }, { timeout: 30000 });

        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error("Gap confirm error:", error.message);
        res.status(500).json({ success: false, message: "Gap analysis service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/agent/gap/status
//  Returns current gap analysis state — used to resume mid-flow
// ─────────────────────────────────────────────────────────────────────────────
export const getGapStatus = async (req, res) => {
    try {
        const { data } = await axios.get(
            `${ML}/gap/status/${req.userId}`,
            { timeout: 10000 }
        );

        res.status(200).json({ success: true, ...data });
    } catch (error) {
        console.error("Gap status error:", error.message);
        res.status(500).json({ success: false, message: "Gap analysis service unavailable" });
    }
};