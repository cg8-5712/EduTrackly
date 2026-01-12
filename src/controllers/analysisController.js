import { getTodayAnalysis, getClassAnalysis, getStudentsAnalysis } from '../services/analysis.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { handleControllerError } from '../middleware/error_handler.js';
import { formatDatefromsqldatetoyyyymmdd, formatDatefromyyyymmddtopsqldate } from '../utils/dateUtils.js';
import moment from 'moment';
import { hasClassAccess } from '../middleware/role_require.js';
import db from '../utils/db/db_connector.js';

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

    // 普通管理员权限检查
    if (req.aid && req.role === 'admin') {
      const hasAccess = await hasClassAccess(req.aid, parseInt(cid), req.role);
      if (!hasAccess) {
        logger.warn('Analysis class access denied', { aid: req.aid, cid });
        return res.status(403).json({
          ...ErrorCodes.AuthErrors.CLASS_ACCESS_DENIED,
          timestamp: Date.now()
        });
      }
    }

    const targetDate = date || moment().format('YYYYMMDD');
    logger.info(`Fetching analysis for class ${cid} on date ${targetDate}`);

    const data = await getTodayAnalysis(cid, formatDatefromyyyymmddtopsqldate(targetDate));
    logger.debug('Analysis data retrieved successfully', { cid, targetDate });

    res.status(200).json(data);

  } catch (error) {
    logger.error('Failed to get today\'s analysis', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      cid,
      date
    });

    handleControllerError(error, res, req);
  }
}

/**
 * Get class analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getClassAnalysisController(req, res) {
  let { cid, startDate, endDate } = req.query;
  logger.debug('Class analysis requested', { cid, startDate, endDate });

  try {
    if (!cid) {
      logger.warn('Missing cid in class analysis request');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CID,
        timestamp: Date.now()
      });
    }

    // Date format conversion
    if (startDate) {
      startDate = formatDatefromyyyymmddtopsqldate(startDate);
    }
    if (endDate) {
      endDate = formatDatefromyyyymmddtopsqldate(endDate);
    }

    const data = await getClassAnalysis(cid, startDate, endDate);
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
      message: 'success',
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to get class analysis', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      cid,
      startDate,
      endDate
    });

    handleControllerError(error, res, req);
  }
}

/**
 * Get students analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getStudentsAnalysisController(req, res) {
  let { sid, startDate, endDate } = req.query;
  logger.debug('Students analysis requested', { sid, startDate, endDate });

  try {
    if (!sid) {
      logger.warn('Missing sid in students analysis request');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_STUDENT_ID,
        timestamp: Date.now()
      });
    }

    // 普通管理员权限检查 - 通过学生查找班级
    if (req.aid && req.role === 'admin') {
      const studentQuery = 'SELECT cid FROM student WHERE sid = $1';
      const studentResult = await db.query(studentQuery, [parseInt(sid)]);

      if (studentResult.rowCount > 0) {
        const cid = studentResult.rows[0].cid;
        const hasAccess = await hasClassAccess(req.aid, cid, req.role);
        if (!hasAccess) {
          logger.warn('Student analysis class access denied', { aid: req.aid, sid, cid });
          return res.status(403).json({
            ...ErrorCodes.AuthErrors.CLASS_ACCESS_DENIED,
            timestamp: Date.now()
          });
        }
      }
    }

    // Date format conversion
    if (startDate) {
      startDate = formatDatefromyyyymmddtopsqldate(startDate);
    }
    if (endDate) {
      endDate = formatDatefromyyyymmddtopsqldate(endDate);
    }

    logger.info('Fetching students analysis', { sid, startDate, endDate });
    const data = await getStudentsAnalysis({ sid, startDate, endDate });

    logger.debug('Students analysis retrieved successfully', { sid });

    return res.status(200).json({
      code: 0,
      message: 'Get students analysis successfully',
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to get students analysis', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      sid,
      startDate,
      endDate
    });

    handleControllerError(error, res, req);
  }
}
