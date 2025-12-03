import * as countdownService from '../services/countdown.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { handleControllerError } from '../middleware/error_handler.js';

/**
 * Create a countdown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createCountdown(req, res) {
  try {
    const { cid, content, deadline } = req.body;
    logger.debug('Received createCountdown request', { cid, content, deadline });

    // Parameter validation
    if (!cid) {
      logger.warn('Missing required parameter: class id');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CID,
        timestamp: Date.now()
      });
    }

    if (!content) {
      logger.warn('Missing required parameter: content');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: content',
        timestamp: Date.now()
      });
    }

    if (!deadline) {
      logger.warn('Missing required parameter: deadline');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: deadline',
        timestamp: Date.now()
      });
    }

    logger.info('Creating countdown', { cid, content, deadline });
    const result = await countdownService.createCountdown({ cid, content, deadline: deadline.toString() });

    logger.info('Countdown created successfully', { cid, content, deadline });
    res.json({
      code: 0,
      message: 'Countdown created successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in createCountdown controller', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      body: req.body
    });

    handleControllerError(error, res, req);
  }
}

/**
 * Get a countdown by cdid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getCountdown(req, res) {
  try {
    const { cdid } = req.query;
    logger.debug('Received getCountdown request', { cdid });

    // Parameter validation
    if (!cdid) {
      logger.warn('Missing required parameter: countdown id');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: countdown id',
        timestamp: Date.now()
      });
    }

    logger.info('Fetching countdown', { cdid });
    const result = await countdownService.getCountdown(cdid);

    logger.info('Countdown retrieved successfully', { cdid });
    res.json({
      code: 0,
      message: 'Countdown retrieved successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in getCountdown controller', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      query: req.query
    });

    handleControllerError(error, res, req);
  }
}

/**
 * List countdowns with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function listCountdowns(req, res) {
  try {
    const { cid, deadline, order = 'desc' } = req.query;
    const { page = 1, size = 20 } = req.body;
    logger.debug('Received listCountdowns request', { cid, deadline, order, page, size });

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

    // Validate order parameter
    if (order && order !== 'asc' && order !== 'desc') {
      logger.warn('Invalid sort order', { order });
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.INVALID_SORT_ORDER,
        timestamp: Date.now()
      });
    }

    // Validate deadline format if provided
    if (deadline && !/^\d{8}$/.test(deadline)) {
      logger.warn('Invalid deadline format', { deadline });
      return res.status(400).json({
        ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
        timestamp: Date.now()
      });
    }

    logger.info('Fetching countdown list', { cid, deadline, order, page, size });
    const result = await countdownService.listCountdowns({ cid, deadline, order, page, size });

    logger.debug('Countdowns retrieved successfully', {
      total: result.pagination.total,
      page: result.pagination.page,
      size: result.pagination.size
    });

    res.json({
      code: 0,
      message: 'Countdowns retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in listCountdowns controller', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      query: req.query,
      body: req.body
    });

    handleControllerError(error, res, req);
  }
}

/**
 * Update a countdown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateCountdown(req, res) {
  try {
    const { cdid } = req.query;
    const { content, deadline } = req.body;
    logger.debug('Received updateCountdown request', { cdid, content, deadline });

    // Parameter validation
    if (!cdid) {
      logger.warn('Missing required parameter: countdown id');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: countdown id',
        timestamp: Date.now()
      });
    }

    // Check if at least one field is provided for update
    if (content === undefined && deadline === undefined) {
      logger.warn('No fields provided for update');
      return res.status(400).json({
        code: 400,
        message: 'At least one field (content or deadline) is required for update',
        timestamp: Date.now()
      });
    }

    // Validate deadline format if provided
    if (deadline !== undefined && !/^\d{8}$/.test(deadline)) {
      logger.warn('Invalid deadline format', { deadline });
      return res.status(400).json({
        ...ErrorCodes.FormatErrors.NOT_YYYYMMDD_DATE,
        timestamp: Date.now()
      });
    }

    logger.info('Updating countdown', { cdid, content, deadline });
    const result = await countdownService.updateCountdown(cdid, { content, deadline });

    logger.info('Countdown updated successfully', { cdid });
    res.json({
      code: 0,
      message: 'Countdown updated successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in updateCountdown controller', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      query: req.query,
      body: req.body
    });

    handleControllerError(error, res, req);
  }
}

/**
 * Delete a countdown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteCountdown(req, res) {
  try {
    const { cdid } = req.query;
    logger.debug('Received deleteCountdown request', { cdid });

    // Parameter validation
    if (!cdid) {
      logger.warn('Missing required parameter: countdown id');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: countdown id',
        timestamp: Date.now()
      });
    }

    logger.info('Deleting countdown', { cdid });
    await countdownService.deleteCountdown(cdid);

    logger.info('Countdown deleted successfully', { cdid });
    res.json({
      code: 0,
      message: 'Countdown deleted successfully',
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in deleteCountdown controller', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      query: req.query
    });

    handleControllerError(error, res, req);
  }
}
