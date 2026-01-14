import * as sloganService from '../services/slogan.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { handleControllerError } from '../middleware/error_handler.js';
import { hasClassAccess } from '../middleware/role_require.js';

/**
 * Create a slogan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createSlogan(req, res) {
  try {
    const { cid, content } = req.body;
    logger.debug('Received createSlogan request', { cid, content });

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

    logger.info('Creating slogan', { cid, content });
    const result = await sloganService.createSlogan({ cid, content });

    logger.info('Slogan created successfully', { cid, content });
    res.json({
      code: 0,
      message: 'Slogan created successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in createSlogan controller', {
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
 * Get a slogan by slid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getSlogan(req, res) {
  try {
    const { slid } = req.query;
    logger.debug('Received getSlogan request', { slid });

    // Parameter validation
    if (!slid) {
      logger.warn('Missing required parameter: slogan id');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: slogan id',
        timestamp: Date.now()
      });
    }

    logger.info('Fetching slogan', { slid });
    const result = await sloganService.getSlogan(slid);

    // Admin access check
    if (req.aid && req.role === 'admin' && result && result.cid) {
      const hasAccess = await hasClassAccess(req.aid, result.cid, req.role);
      if (!hasAccess) {
        logger.warn('Slogan class access denied', { aid: req.aid, slid, cid: result.cid });
        return res.status(403).json({
          ...ErrorCodes.AuthErrors.CLASS_ACCESS_DENIED,
          timestamp: Date.now()
        });
      }
    }

    logger.info('Slogan retrieved successfully', { slid });
    res.json({
      code: 0,
      message: 'Slogan retrieved successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in getSlogan controller', {
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
 * List slogans with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function listSlogans(req, res) {
  try {
    const { cid, order = 'desc', page = 1, size = 20 } = req.query;
    logger.debug('Received listSlogans request', { cid, order, page, size });

    // Admin access check
    if (req.aid && req.role === 'admin' && cid) {
      const hasAccess = await hasClassAccess(req.aid, parseInt(cid), req.role);
      if (!hasAccess) {
        logger.warn('Slogan list class access denied', { aid: req.aid, cid });
        return res.status(403).json({
          ...ErrorCodes.AuthErrors.CLASS_ACCESS_DENIED,
          timestamp: Date.now()
        });
      }
    }

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

    logger.info('Fetching slogan list', { cid, order, page, size });
    const result = await sloganService.listSlogans({ cid, order, page, size });

    logger.debug('Slogans retrieved successfully', {
      total: result.pagination.total,
      page: result.pagination.page,
      size: result.pagination.size
    });

    res.json({
      code: 0,
      message: 'Slogans retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in listSlogans controller', {
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
 * Update a slogan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateSlogan(req, res) {
  try {
    const { slid } = req.query;
    const { content } = req.body;
    logger.debug('Received updateSlogan request', { slid, content });

    // Parameter validation
    if (!slid) {
      logger.warn('Missing required parameter: slogan id');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: slogan id',
        timestamp: Date.now()
      });
    }

    // Check if at least one field is provided for update
    if (content === undefined) {
      logger.warn('No fields provided for update');
      return res.status(400).json({
        code: 400,
        message: 'Content field is required for update',
        timestamp: Date.now()
      });
    }

    logger.info('Updating slogan', { slid, content });
    const result = await sloganService.updateSlogan(slid, { content });

    logger.info('Slogan updated successfully', { slid });
    res.json({
      code: 0,
      message: 'Slogan updated successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in updateSlogan controller', {
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
 * Delete a slogan
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteSlogan(req, res) {
  try {
    const { slid } = req.query;
    logger.debug('Received deleteSlogan request', { slid });

    // Parameter validation
    if (!slid) {
      logger.warn('Missing required parameter: slogan id');
      return res.status(400).json({
        code: 400,
        message: 'Missing required parameter: slogan id',
        timestamp: Date.now()
      });
    }

    logger.info('Deleting slogan', { slid });
    await sloganService.deleteSlogan(slid);

    logger.info('Slogan deleted successfully', { slid });
    res.json({
      code: 0,
      message: 'Slogan deleted successfully',
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in deleteSlogan controller', {
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
