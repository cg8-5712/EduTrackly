// src/controllers/authController.js
import { authenticateUser } from "../services/auth.js";
import logger from "../middleware/loggerMiddleware.js";

export async function login(req, res) {
    try {
        const { password } = req.body;
        logger.debug("login", password);

        if (!password) {
            return res.status(400).json({
                code: 1001,
                message: "Password is required",
                data: null,
                timestamp: Date.now()
            });
        }

        const ip = req.ip; // Express 提供的请求 IP
        const authResult = await authenticateUser(password, ip);

        if (!authResult) {
            return res.status(401).json({
                code: 1002,
                message: "Invalid password",
                data: null,
                timestamp: Date.now()
            });
        }

        return res.json({
            code: 0,
            message: "success",
            data: authResult,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        return res.status(500).json({
            code: 1000,
            message: "Internal server error",
            data: null,
            timestamp: Date.now()
        });
    }
}
