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

export async function listHomeworks(req, res) {
    try {
        const { cid, startDate, endDate, order, page = 1, size = 20 } = req.query;

        const result = await homeworkService.listHomeworks({ cid, startDate, endDate, order, page, size });

        logger.info(`Get homework list successfully for class id ${cid || 'all'} and date range ${startDate || 'any'}-${endDate || 'any'}`);
        logger.debug(`Homework list: ${JSON.stringify(result.data)}`);
        logger.debug(`Pagination: ${JSON.stringify(result.pagination)}`);

        res.json({
            code: 0,
            message: 'Homework list fetched successfully',
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Failed to list homeworks:', error);
        res.status(500).json({
            ...SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}

export async function createHomework(req, res) {
    try {
        const { cid, homework_content, due_date } = req.body;

        if (!cid || !homework_content || !due_date) {
            logger.error('Missing required parameters for creating/updating homework');
            return res.status(400).json({
                ...FormatErrors.NOT_YYYYMMDD_DATE,
                timestamp: Date.now()
            });
        }

        await homeworkService.createOrUpdateHomework({ cid, homework_content, due_date });

        res.json({
            code: 0,
            message: 'Homework created or updated successfully',
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Error in createHomework controller:', error);

        let responseError = SystemErrors.INTERNAL;

        try {
            const parsed = JSON.parse(error.message);
            if (parsed && parsed.code) {
                responseError = parsed;
            }
        } catch (e) {
            // 保持 SystemErrors
        }

        res.status(500).json({
            ...responseError,
            timestamp: Date.now()
        });
    }
}