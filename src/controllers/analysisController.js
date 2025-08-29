import { getTodayAnalysis, getClassAnalysis } from '../services/analysis.js';
import logger from "../middleware/loggerMiddleware.js";
import * as ErrorCodes from "../config/errorCodes.js";
import {formatDatefromsqldatetoyyyymmdd, formatDatefromyyyymmddtopsqldate} from "../utils/dateUtils.js";
import moment from "moment";

export async function getToday(req, res) {
    try {
        let { cid, date } = req.query;

        if (!cid) {
            logger.error('Error in getToday controller: cid is missing');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        // 默认日期为今日
        if (!date) {
            date = moment().format('YYYYMMDD');
        }

        logger.info(`Getting today's analysis for class ${cid} on date ${date}`);

        const data = await getTodayAnalysis(cid, formatDatefromyyyymmddtopsqldate(date));

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

export async function getClassAnalysisController(req, res) {
    try {
        const { cid } = req.query;
        if (!cid) {
            return res.status(400).json({ code: 1, message: "cid is required", timestamp: Date.now() });
        }

        const data = await getClassAnalysis(cid);
        if (!data) {
            return res.status(404).json({ code: 1, message: "class not found", timestamp: Date.now() });
        }

        res.json({
            code: 0,
            message: "success",
            data,
            timestamp: Date.now()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 1, message: "internal server error", timestamp: Date.now() });
    }
}