import { User } from "../model/user.js";

export const requireOnboarding = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.profile?.isOnboarded) {
            return res.status(403).json({
                success:  false,
                message:  "Profile setup required",
                redirect: "/onboarding",
            });
        }
        next();
    } catch (error) {
        console.error("requireOnboarding error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};