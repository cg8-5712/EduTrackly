import { getSystemInfo } from "../services/system.js";
import logger from "../middleware/loggerMiddleware.js";

export async function getSystemController(req, res) {
    try {
        const sysInfo = await getSystemInfo();
        return res.status(200).json({
            code: 0,
            message: "System info retrieved successfully",
            data: sysInfo,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error("Get system info error:", error);

        if (error.code && typeof error.code === "number") {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        return res.status(500).json({
            code: 9001,
            message: "Internal server error",
            timestamp: Date.now()
        });
    }
}