import axios from "axios";
import FormData from "form-data";

const ML = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/review/weekly
//  7-day review — stats + rule-based insights + LLM narrative summary
// ─────────────────────────────────────────────────────────────────────────────
export const getWeeklyReview = async (req, res) => {
    try {
        const { data } = await axios.get(
            `${ML}/review/${req.userId}`,
            { timeout: 45000 } // LLM narrative can take time
        );

        res.status(200).json({
            success:  true,
            stats:    data.stats,
            insights: data.insights,
            summary:  data.summary,
        });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please complete onboarding first."
            });
        }
        console.error("Weekly review error:", error.message);
        res.status(500).json({ success: false, message: "Review service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/review/menu
//  Fetch the mess menu grouped by meal slot
//  Used by gap analysis screen to show available dishes
// ─────────────────────────────────────────────────────────────────────────────
export const getMenu = async (req, res) => {
    const institutionId = req.query.institution_id || "default";

    try {
        const { data } = await axios.get(
            `${ML}/menu/${institutionId}`,
            { timeout: 10000 }
        );

        res.status(200).json({
            success:      true,
            menu:         data.menu,
            total_dishes: data.total_dishes,
        });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "No menu found. Please scan and save the mess menu first."
            });
        }
        console.error("Get menu error:", error.message);
        res.status(500).json({ success: false, message: "Menu service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/review/menu/save
//  Body: { dishes: [...], institution_id?: string }
//  Save confirmed OCR menu dishes to DB + ChromaDB
// ─────────────────────────────────────────────────────────────────────────────
export const saveMenu = async (req, res) => {
    const { dishes, institution_id } = req.body;

    if (!dishes || !dishes.length) {
        return res.status(400).json({ success: false, message: "No dishes provided" });
    }

    try {
        const { data } = await axios.post(`${ML}/ocr/save-menu`, {
            dishes:         dishes,
            institution_id: institution_id || "default",
        }, { timeout: 15000 });

        res.status(200).json({
            success:      true,
            dishes_saved: data.dishes_saved,
        });
    } catch (error) {
        console.error("Save menu error:", error.message);
        res.status(500).json({ success: false, message: "Could not save menu" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/review/rag
//  Body: { question: string, user_goal?: string }
//  Direct RAG nutrition Q&A — bypasses chatbot conversation
// ─────────────────────────────────────────────────────────────────────────────
export const askRAG = async (req, res) => {
    const { question, user_goal } = req.body;

    if (!question || !question.trim()) {
        return res.status(400).json({ success: false, message: "Question is required" });
    }

    try {
        const { data } = await axios.post(`${ML}/rag/ask`, {
            question:  question.trim(),
            user_goal: user_goal || "maintain",
            user_id:   req.userId,
        }, { timeout: 45000 });

        res.status(200).json({
            success:  true,
            answer:   data.answer,
            sources:  data.sources,
            question: data.question,
        });
    } catch (error) {
        console.error("RAG error:", error.message);
        res.status(500).json({ success: false, message: "RAG service unavailable" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/review/menu/scan
//  Multipart: file (image)
//  Send mess menu photo to ML OCR service → return matched dishes
// ─────────────────────────────────────────────────────────────────────────────
export const scanMenu = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file provided" });
    }

    try {
        const form = new FormData();
        form.append("file", req.file.buffer, {
            filename:    req.file.originalname || "menu.jpg",
            contentType: req.file.mimetype,
        });

        const { data } = await axios.post(`${ML}/ocr/scan`, form, {
            headers:  form.getHeaders(),
            timeout:  30000,
            maxBodyLength: Infinity,
        });

        res.status(200).json({
            success:      true,
            matched:      data.matched,
            unmatched:    data.unmatched,
            total_found:  data.total_found,
            ocr_backend:  data.ocr_backend,
        });
    } catch (error) {
        console.error("Scan menu error:", error.message);
        res.status(500).json({ success: false, message: "OCR scan failed. Try a clearer photo." });
    }
};