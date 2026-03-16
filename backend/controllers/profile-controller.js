import { User } from "../model/user.js";
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: call Python ML service  (unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────
const getPredictedTargets = async (profileData) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, profileData);
        return response.data;
    } catch (error) {
        console.error("ML service error:", error.message);
        return calculateFallbackTargets(profileData);
    }
};

const calculateFallbackTargets = ({ age, gender, weight, height, activityLevel, goal }) => {
    let bmr = gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultipliers = {
        sedentary: 1.2, lightly_active: 1.375,
        moderately_active: 1.55, very_active: 1.725, extra_active: 1.9
    };
    let tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

    let calories;
    switch (goal) {
        case "lose_weight":  calories = Math.round(tdee - 500); break;
        case "gain_weight":  calories = Math.round(tdee + 300); break;
        case "build_muscle": calories = Math.round(tdee + 200); break;
        default:             calories = Math.round(tdee);
    }

    let proteinRatio, carbRatio, fatRatio;
    switch (goal) {
        case "build_muscle": proteinRatio=0.35; carbRatio=0.40; fatRatio=0.25; break;
        case "lose_weight":  proteinRatio=0.40; carbRatio=0.30; fatRatio=0.30; break;
        case "gain_weight":  proteinRatio=0.25; carbRatio=0.50; fatRatio=0.25; break;
        default:             proteinRatio=0.30; carbRatio=0.40; fatRatio=0.30;
    }

    return {
        calories,
        protein_g: Math.round((calories * proteinRatio) / 4),
        carbs_g:   Math.round((calories * carbRatio)   / 4),
        fat_g:     Math.round((calories * fatRatio)    / 9)
    };
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/profile/setup
// ─────────────────────────────────────────────────────────────────────────────
export const setupProfile = async (req, res) => {
    const { age, height, weight, gender, goal, activityLevel, targetWeight } = req.body;
    try {
        if (!age || !height || !weight || !gender || !goal) {
            return res.status(400).json({ success: false, message: "Age, height, weight, gender and goal are required" });
        }
        const validGoals = ["lose_weight", "gain_weight", "maintain", "build_muscle"];
        if (!validGoals.includes(goal)) {
            return res.status(400).json({ success: false, message: `Goal must be one of: ${validGoals.join(", ")}` });
        }
        if (age < 10 || age > 120)        return res.status(400).json({ success: false, message: "Invalid age" });
        if (height < 50 || height > 300)  return res.status(400).json({ success: false, message: "Invalid height (cm)" });
        if (weight < 20 || weight > 500)  return res.status(400).json({ success: false, message: "Invalid weight (kg)" });

        const predicted = await getPredictedTargets({
            age, height, weight, gender,
            activityLevel: activityLevel || "sedentary",
            goal
        });

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                profile: {
                    age, height, weight, gender, goal,
                    activityLevel: activityLevel || "sedentary",
                    targetWeight: targetWeight || null,
                    isOnboarded: true,
                },
                dailyTargets: {
                    calories: predicted.calories,
                    protein:  predicted.protein_g,
                    carbs:    predicted.carbs_g,
                    fat:      predicted.fat_g,
                },
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile setup complete",
            profile:      user.profile,
            dailyTargets: user.dailyTargets,
        });
    } catch (error) {
        console.error("Error setting up profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/profile
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({
            success: true,
            user: {
                name:         user.name,
                email:        user.email,
                profile:      user.profile,
                dailyTargets: user.dailyTargets,
            },
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/profile/update
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    const { age, height, weight, gender, goal, activityLevel, targetWeight } = req.body;
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const updatedProfile = {
            age:           age           ?? user.profile.age,
            height:        height        ?? user.profile.height,
            weight:        weight        ?? user.profile.weight,
            gender:        gender        ?? user.profile.gender,
            goal:          goal          ?? user.profile.goal,
            activityLevel: activityLevel ?? user.profile.activityLevel,
            targetWeight:  targetWeight  ?? user.profile.targetWeight,
            isOnboarded:   true,
        };

        const predicted = await getPredictedTargets(updatedProfile);

        const updated = await User.findByIdAndUpdate(
            req.userId,
            {
                profile: updatedProfile,
                dailyTargets: {
                    calories: predicted.calories,
                    protein:  predicted.protein_g,
                    carbs:    predicted.carbs_g,
                    fat:      predicted.fat_g,
                },
            },
            { new: true }
        );

        res.status(200).json({
            success:      true,
            message:      "Profile updated",
            profile:      updated.profile,
            dailyTargets: updated.dailyTargets,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
