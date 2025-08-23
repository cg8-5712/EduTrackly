// src/controllers/homeworkController.js
import * as homeworkService from "../services/homework.js";
import logger from "../middleware/loggerMiddleware.js";

export async function getHomework(req, res) {
    try {
        const data = await homeworkService.getHomeworkList();
        res.json({ success: true, data });
    } catch (error) {
        logger.error("❌ Failed to get homework:", error.message);
        res.status(500).json({ success: false, error: "Failed to get homework" });
    }
}
