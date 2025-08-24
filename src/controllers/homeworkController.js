import * as homeworkService from '../services/homework.js';
import logger from "../middleware/loggerMiddleware.js";
import { HomeworkErrors, ParamsErrors, SystemErrors, FormatErrors } from "../config/errorCodes.js";
import moment from 'moment';

export async function getHomework(req, res) {
    try {
        let { cid, date } = req.query;

        // 必填参数检查
        if (!cid) {
            logger.error(`Required class id parameter is missing`);
            return res.status(400).json({
                ...ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        // 默认日期为今日
        if (!date) {
            date = moment().format('YYYYMMDD');
        }

        const result = await homeworkService.getHomeworkByCidAndDate(cid, date);
        if (!result) {
            logger.error(`Homework not found for class id ${cid} and date ${date}`);
            return res.status(404).json({
                ...HomeworkErrors.NOT_FOUND,
                timestamp: Date.now()
            });
        }

        res.json({
            code: 0,
            message: "Get homework successfully",
            data: result,
            timestamp: Date.now()
        });
        logger.info(`Get homework successfully for class id ${cid} and date ${date}`);

    } catch (error) {
        logger.error(`Error in getHomework: ${error.message}`);

        // 尝试解析 service 抛出的 JSON 错误码
        let errorObj;
        try {
            errorObj = JSON.parse(error.message);
        } catch {
            // 如果解析失败，默认返回系统内部错误
            errorObj = SystemErrors.INTERNAL;
        }

        // 返回统一格式 JSON，不抛出原始异常
        res.status(500).json({
            ...errorObj,
            timestamp: Date.now()
        });
    }
}
