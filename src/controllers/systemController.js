import { getSystemInfo } from "../services/system.js";
import logger from "../middleware/loggerMiddleware.js";
import { handleControllerError } from "../middleware/error_handler.js";

export async function getSystemController(req, res) {
    try {
        logger.info("System info request received", {
            ip: req.ip,
            method: req.method,
            path: req.originalUrl
        });

        logger.debug("Fetching system info from service...");
        const data = await getSystemInfo();

        logger.info("System info retrieved successfully", {
            cpuCount: data.cpu?.length,
            memory: data.memory,
        });

        return res.status(200).json({
            code: 0,
            message: "System info retrieved successfully",
            data,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error("Failed to get system info", {
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });

        handleControllerError(error, res);
    }
}
