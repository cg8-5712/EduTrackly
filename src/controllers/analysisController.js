import { getTodayAnalysis } from '../services/analysis.js';
import logger from "../middleware/loggerMiddleware.js";
import * as ErrorCodes from "../config/errorCodes.js";

export async function getToday(req, res) {
    try {
        const { cid } = req.query;

        const data = await getTodayAnalysis(cid);

        res.status(200).json(data);

    } catch (error) {
        logger.error('Error in getToday controller:', error);
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误，统一返回 9001
        res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}
