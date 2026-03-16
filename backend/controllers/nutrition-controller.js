import axios from "axios";
import FormData from "form-data";

const ML = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/nutrition/search
//  Body: { dish: "Dal Tadka" }
//  User types a meal name → Python looks it up → returns calories + macros
// ─────────────────────────────────────────────────────────────────────────────
export const searchNutrition = async (req, res) => {
    const { dish } = req.body;

    if (!dish || !dish.trim()) {
        return res.status(400).json({ success: false, message: "Dish name is required" });
    }

    try {
        const { data } = await axios.post(`${ML}/nutrition`, { dish: dish.trim() });

        res.status(200).json({
            success: true,
            result: {
                dish:      data.dish,
                calories:  data.calories,
                protein:   data.protein,
                carbs:     data.carbs,
                fats:      data.fats,
                portion_g: data.portion_g,
                source:    data.source,
            }
        });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: `Could not find nutrition data for "${dish}"`
            });
        }
        console.error("Nutrition search error:", error.message);
        res.status(500).json({ success: false, message: "Nutrition service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/nutrition/classify
//  Multipart: image file upload
//  User uploads food photo → EfficientNet classifies → nutrition returned
// ─────────────────────────────────────────────────────────────────────────────
export const classifyFood = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Image file is required" });
    }

    try {
        // Forward the image as multipart/form-data to Python
        const form = new FormData();
        form.append("file", req.file.buffer, {
            filename:    req.file.originalname || "upload.jpg",
            contentType: req.file.mimetype,
        });

        const { data } = await axios.post(`${ML}/classify`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        res.status(200).json({
            success:         true,
            top_prediction:  data.top_prediction,
            all_predictions: data.all_predictions,
            is_uncertain:    data.is_uncertain,
            nutrition:       data.nutrition,    // null if uncertain or not found
        });
    } catch (error) {
        console.error("Classify error:", error.message);
        res.status(500).json({ success: false, message: "Classification service unavailable" });
    }
};
