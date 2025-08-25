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
        logger.error('Error in createHomework controller:', error);
        logger.error(error.code, error.message);
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误，统一返回 9001
        res.status(500).json({
            ...SystemErrors.INTERNAL,
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

        if (!cid) {
            logger.error('Missing required parameters class id');
            return res.status(400).json({
                ...ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }
        if (!homework_content) {
            logger.error('Missing required parameters homework content');
            return res.status(400).json({
                ...ParamsErrors.REQUIRE_HOMEWORK_CONTENT,
                timestamp: Date.now()
            });
        }
        if (!due_date) {
            logger.error('Missing required parameters due date');
            return res.status(400).json({
                ...ParamsErrors.REQUIRE_DUE_DATE,
                timestamp: Date.now()
            });
        }

        const dueDate = moment(due_date, 'YYYYMMDD');
        if (!dueDate.isValid()) {
            logger.error(`Invalid due date format: ${due_date}`);
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
        logger.error(error.code, error.message);
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误，统一返回 9001
        res.status(500).json({
            ...SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}