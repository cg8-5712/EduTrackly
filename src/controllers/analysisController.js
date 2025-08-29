import { getTodayAnalysis } from '../services/analysis.js';
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
