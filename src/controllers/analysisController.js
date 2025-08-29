import { getTodayAnalysis, getClassAnalysis, getStudentsAnalysis } from '../services/analysis.js';
import logger from "../middleware/loggerMiddleware.js";
import * as ErrorCodes from "../config/errorCodes.js";
import { handleControllerError } from "../middleware/error_handler.js";
import { formatDatefromsqldatetoyyyymmdd, formatDatefromyyyymmddtopsqldate } from "../utils/dateUtils.js";
import moment from "moment";

/**
 * Get today's analysis for a specific class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getToday(req, res) {
    const { cid, date } = req.query;
    logger.debug('getToday analysis requested', { cid, date });

    try {
        if (!cid) {
            logger.warn('Missing cid in getToday request');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        const targetDate = date || moment().format('YYYYMMDD');
        logger.info(`Fetching analysis for class ${cid} on date ${targetDate}`);

        const data = await getTodayAnalysis(cid, formatDatefromyyyymmddtopsqldate(targetDate));
        logger.debug('Analysis data retrieved successfully', { cid, targetDate });

        res.status(200).json(data);

    } catch (error) {
        logger.error('Failed to get today\'s analysis:', { 
            error: error.message,
            cid,
            date,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

/**
 * Get class analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getClassAnalysisController(req, res) {
    const { cid } = req.query;
    logger.debug('Class analysis requested', { cid });

    try {
        if (!cid) {
            logger.warn('Missing cid in class analysis request');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        const data = await getClassAnalysis(cid);
        if (!data) {
            logger.warn(`No data found for class ${cid}`);
            return res.status(404).json({
                ...ErrorCodes.DataErrors.CLASS_NOT_FOUND,
                timestamp: Date.now()
            });
        }

        logger.info(`Successfully retrieved analysis for class ${cid}`);
        res.json({
            code: 0,
            message: "success",
            data,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Failed to get class analysis:', {
            error: error.message,
            cid,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

/**
 * Get students analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getStudentsAnalysisController(req, res) {
    let { cid, startDate, endDate } = req.query;
    logger.debug('Students analysis requested', { cid, startDate, endDate });

    try {
        if (startDate) {
            startDate = formatDatefromyyyymmddtopsqldate(startDate);
        }

        endDate = endDate 
            ? formatDatefromyyyymmddtopsqldate(endDate)
            : formatDatefromyyyymmddtopsqldate(moment().format('YYYYMMDD'));

        logger.info('Fetching students analysis', { cid, startDate, endDate });
        const students = await getStudentsAnalysis({ cid, startDate, endDate });

        logger.debug('Students analysis retrieved successfully', {
            studentCount: students.length
        });

        return res.status(200).json({
            code: 0,
            message: "Get students analysis successfully",
            students,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Failed to get students analysis:', {
            error: error.message,
            cid,
            startDate,
            endDate,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}
