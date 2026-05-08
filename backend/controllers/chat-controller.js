import axios from "axios";

const ML = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/chat
//  Body: { message: string, thread_id?: string }
//  Sends message to NutriAI chatbot → full response
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
    const { message, thread_id } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: "Message is required" });
    }

    try {
        const { data } = await axios.post(`${ML}/chat`, {
            user_id:   req.userId,
            message:   message.trim(),
            thread_id: thread_id || req.userId,
        }, { timeout: 60000 }); // 60s timeout — LLM can be slow

        res.status(200).json({
            success:  true,
            response: data.response,
            user_id:  req.userId,
        });
    } catch (error) {
        console.error("Chat error:", error.message);
        res.status(500).json({ success: false, message: "Chat service unavailable" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/chat/stream
//  Body: { message: string, thread_id?: string }
//  Streams response token by token using Server-Sent Events
// ─────────────────────────────────────────────────────────────────────────────
export const streamMessage = async (req, res) => {
    const { message, thread_id } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Set SSE headers so browser can read tokens as they arrive
    res.setHeader("Content-Type",  "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection",    "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering

    try {
        const mlRes = await axios.post(`${ML}/chat/stream`, {
            user_id:   req.userId,
            message:   message.trim(),
            thread_id: thread_id || req.userId,
        }, {
            responseType: "stream",
            timeout:       90000,
        });

        // Pipe ML service stream directly to client
        mlRes.data.on("data", (chunk) => res.write(chunk));
        mlRes.data.on("end",  ()      => res.end());
        mlRes.data.on("error", (err)  => {
            console.error("Stream error:", err.message);
            res.end();
        });
    } catch (error) {
        console.error("Stream chat error:", error.message);
        res.write("[Error: Chat service unavailable]");
        res.end();
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/chat/history
//  Returns recent conversation history for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
export const getChatHistory = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;

    try {
        const { data } = await axios.get(
            `${ML}/chat/history/${req.userId}?limit=${limit}`,
            { timeout: 10000 }
        );

        res.status(200).json({
            success: true,
            history: data.history,
            count:   data.count,
        });
    } catch (error) {
        console.error("Chat history error:", error.message);
        res.status(500).json({ success: false, message: "Could not fetch chat history" });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/chat/history
//  Clears conversation history for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
export const clearChatHistory = async (req, res) => {
    try {
        await axios.delete(`${ML}/chat/history/${req.userId}`, { timeout: 10000 });

        res.status(200).json({ success: true, message: "Chat history cleared" });
    } catch (error) {
        console.error("Clear chat history error:", error.message);
        res.status(500).json({ success: false, message: "Could not clear chat history" });
    }
};