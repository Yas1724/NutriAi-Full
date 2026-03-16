import jwt from "jsonwebtoken";

export const generateJWTToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("token", token, {
        httpOnly: true,                                      // JS cannot access cookie
        secure: process.env.NODE_ENV === "production",       // HTTPS only in production
        sameSite: process.env.NODE_ENV === "production"
            ? "strict"
            : "lax",                                         // lax for local dev (cross-port)
        maxAge: 7 * 24 * 60 * 60 * 1000,                   // 7 days in ms
    });

    return token;
};














