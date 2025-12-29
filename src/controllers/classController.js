import * as classService from '../services/class.js';
import { assignClassToAdmin } from '../services/admin.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { listStudents } from '../services/student.js';
import { handleControllerError } from '../middleware/error_handler.js';

/**
 * Create a new class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createClassController(req, res) {
  const { class_name } = req.query;
  logger.debug('Create class request received', { class_name });

  try {
    if (!class_name) {
      logger.warn('Create class attempt without name');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CLASS_NAME,
        timestamp: Date.now()
      });
    }

    logger.info('Creating new class', { class_name });
    const result = await classService.createClass(class_name);
    logger.debug('Class created successfully', { class_id: result.data?.cid });

    // Auto-assign class to current admin if not superadmin
    if (req.role !== 'superadmin' && result.data?.cid) {
      await assignClassToAdmin(req.aid, result.data.cid);
      logger.info('Class auto-assigned to admin', { aid: req.aid, cid: result.data.cid });
    }

    return res.status(200).json({
      code: result.code,
      message: result.message,
      data: result.data,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to create class', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      class_name
    });

    handleControllerError(error, res, req);
  }
}

/**
 * Get class details with students
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getClassController(req, res) {
  const { cid, class_name } = req.query;
  logger.debug('Get class request received', { cid, class_name });

  try {
    // Parameter validation
    if (!cid && !class_name) {
      logger.warn('Get class attempt without identifier');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CLASS_NAME_OR_ID,
        timestamp: Date.now()
      });
    }

    if (cid && class_name) {
      logger.warn('Get class attempt with multiple identifiers');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.TOO_MUCH_PARAMS,
        timestamp: Date.now()
      });
    }

    const param = parseInt(cid) || class_name;
    logger.info('Fetching class details', { param });

    const class_result = await classService.getClass(param);
    const student_result = await listStudents({ cid, page: 1, size: 100000 });

    logger.debug('Class and students retrieved', { 
      class_id: class_result.data?.id,
      student_count: student_result.rows?.length 
    });

    // Attach students to class data
    class_result.data.students = student_result.rows || [];

    return res.status(200).json({
      code: 0,
      message: class_result.message,
      data: class_result.data,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to get class details', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      cid,
      class_name
    });

    handleControllerError(error, res, req);
  }
}

/**
 * List all classes with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function listClass(req, res) {
  const { order = 'asc' } = req.query;
  const { page = 1, size = 20 } = req.body;
    
  logger.debug('List classes request received', { order, page, size });

  try {
    logger.info('Fetching class list', { order, page, size });
    const result = await classService.listClass({ order, page, size });

    logger.debug('Classes retrieved successfully', {
      total_count: result.data?.length,
      page,
      size
    });

    return res.json({
      code: 0,
      message: 'Classes retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to list classes', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      order,
      page,
      size
    });
    handleControllerError(error, res, req);
  }
}

/**
 * Delete a class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteClassController(req, res) {
  const { cid, class_name } = req.query;
  logger.debug('Delete class request received', { cid, class_name });

  try {
    if (!cid && !class_name) {
      logger.warn('Delete class attempt without identifier');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CLASS_NAME_OR_ID,
        timestamp: Date.now()
      });
    }

    if (cid && class_name) {
      logger.warn('Delete class attempt with multiple identifiers');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.TOO_MUCH_PARAMS,
        timestamp: Date.now()
      });
    }

    const param = cid ? { cid } : { class_name };
    logger.info('Deleting class', param);

    const result = await classService.deleteClass(param);
    logger.debug('Class deleted successfully', param);

    return res.json({
      code: result.code,
      message: result.message,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Failed to delete class', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      cid,
      class_name
    });

    if (error.code && error.message && typeof error.code === 'number') {
      return res.status(400).json({
        ...error,
        timestamp: Date.now()
      });
    }

    handleControllerError(error, res, req);
  }
}