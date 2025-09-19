import * as homeworkService from '../services/homework.js';
import logger from "../middleware/loggerMiddleware.js";
import * as ErrorCodes from "../config/errorCodes.js";
import moment from 'moment';
import { handleControllerError } from "../middleware/error_handler.js";

/**
 * Get homework by class ID and date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getHomework(req, res) {
    let { cid, date } = req.query;
    logger.debug('Get homework request initiated', { cid, date });

    try {
        if (!cid) {
            logger.warn('Missing required class ID');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        date = date || moment().format('YYYYMMDD');

        if (!moment(date, 'YYYYMMDD', true).isValid()) {
            logger.warn('Invalid date format provided', { date });
            return res.status(400).json({
                ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
                timestamp: Date.now()
            });
        }

        logger.info('Fetching homework', { cid, date });
        const result = await homeworkService.getHomework(cid, date);

        if (!result) {
            logger.warn('No homework found', { cid, date });
            return res.status(404).json({
                ...ErrorCodes.HomeworkErrors.NOT_FOUND,
                timestamp: Date.now()
            });
        }

        logger.debug('Homework retrieved successfully', {
            cid,
            date,
            homework_id: result.id
        });

        return res.json({
            code: 0,
            message: "Homework retrieved successfully",
            data: result,
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Failed to get homework', {
            error: error.message,
            cid,
            date,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

/**
 * List homeworks with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function listHomeworks(req, res) {
    const { cid, startDate, endDate, order = 'desc', page = 1, size = 20 } = req.query;
    logger.debug('List homeworks request initiated', { cid, startDate, endDate, order, page, size });

    try {
        // Validate pagination parameters
        if (page < 1 || isNaN(page)) {
            logger.warn('Invalid page number', { page });
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.INVALID_PAGE_NUMBER,
                timestamp: Date.now()
            });
        }

        if (size < 1 || size > 100 || isNaN(size)) {
            logger.warn('Invalid page size', { size });
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.INVALID_PAGE_SIZE,
                timestamp: Date.now()
            });
        }

        // Validate dates if provided
        if (startDate && !moment(startDate, 'YYYYMMDD', true).isValid()) {
            logger.warn('Invalid start date format', { startDate });
            return res.status(400).json({
                ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
                timestamp: Date.now()
            });
        }

        if (endDate && !moment(endDate, 'YYYYMMDD', true).isValid()) {
            logger.warn('Invalid end date format', { endDate });
            return res.status(400).json({
                ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
                timestamp: Date.now()
            });
        }

        logger.info('Fetching homework list', { cid, startDate, endDate, order, page, size });
        const result = await homeworkService.listHomeworks({ cid, startDate, endDate, order, page, size });

        logger.debug('Homeworks retrieved successfully', {
            total: result.pagination.total,
            page: result.pagination.current_page,
            size: result.pagination.page_size
        });

        return res.json({
            code: 0,
            message: "Homeworks retrieved successfully",
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Failed to list homeworks', {
            error: error.message,
            cid,
            startDate,
            endDate,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

/**
 * Create or update a homework entry
 */
export async function createHomework(req, res) {
    try {
        let { cid, homework_content, due_date } = req.body;
        logger.debug('Received createHomework request', { cid, due_date });

        // 参数校验
        if (!cid) {
            logger.warn('Missing required parameter: class id');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        if (!homework_content || typeof homework_content !== 'object') {
            logger.warn('Missing or invalid homework content');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_HOMEWORK_CONTENT,
                timestamp: Date.now()
            });
        }

        if (!due_date) {
            due_date = moment().format('YYYYMMDD');
        }

        // 日期格式校验
        const dueDate = moment(due_date, 'YYYYMMDD', true); // strict mode
        if (!dueDate.isValid()) {
            logger.error(`Invalid due date format: ${due_date}`);
            return res.status(400).json({
                ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
                timestamp: Date.now()
            });
        }

        logger.info('Creating or updating homework', { cid, due_date });
        await homeworkService.createHomework({ cid, homework_content, due_date });

        logger.info('Homework created or updated successfully', { cid, due_date });
        res.json({
            code: 0,
            message: 'Homework created or updated successfully',
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in createHomework controller', { error });

        handleControllerError(error, res);
    }
}

/**
 * Delete a homework entry
 */
export async function deleteHomework(req, res) {
    try {
        const { cid, date } = req.query;
        logger.debug('Received deleteHomework request', { cid, date });

        // 参数校验
        if (!cid) {
            logger.warn('Missing required parameter: class id');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        if (!date) {
            logger.warn('Missing required parameter: date');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_DATE,
                timestamp: Date.now()
            });
        }

        // 日期格式校验
        const dueDate = moment(date, 'YYYYMMDD', true); // strict mode
        if (!dueDate.isValid()) {
            logger.error(`Invalid due date format: ${date}`);
            return res.status(400).json({
                ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
                timestamp: Date.now()
            });
        }

        logger.info('Deleting homework', { cid, date });
        await homeworkService.deleteHomework(cid, date);

        logger.info('Homework deleted successfully', { cid, date });
        res.json({
            code: 0,
            message: 'Homework deleted successfully',
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in deleteHomework controller', { error });

        handleControllerError(error, res);
    }
}