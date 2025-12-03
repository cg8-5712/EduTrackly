import * as settingService from '../services/setting.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { handleControllerError } from '../middleware/error_handler.js';

/**
 * Get setting by cid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getSetting(req, res) {
  try {
    const { cid } = req.query;
    logger.debug('Received getSetting request', { cid });

    // Parameter validation
    if (!cid) {
      logger.warn('Missing required parameter: class id');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CID,
        timestamp: Date.now()
      });
    }

    logger.info('Fetching setting', { cid });
    const result = await settingService.getSetting(cid);

    logger.info('Setting retrieved successfully', { cid });
    res.json({
      code: 0,
      message: 'Setting retrieved successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in getSetting controller', {
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
 * Update setting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateSetting(req, res) {
  try {
    const { cid } = req.query;
    const { is_countdown_display, is_slogan_display } = req.body;
    logger.debug('Received updateSetting request', { cid, is_countdown_display, is_slogan_display });

    // Parameter validation
    if (!cid) {
      logger.warn('Missing required parameter: class id');
      return res.status(400).json({
        ...ErrorCodes.ParamsErrors.REQUIRE_CID,
        timestamp: Date.now()
      });
    }

    // Check if at least one field is provided for update
    if (is_countdown_display === undefined && is_slogan_display === undefined) {
      logger.warn('No fields provided for update');
      return res.status(400).json({
        code: 400,
        message: 'At least one field (is_countdown_display or is_slogan_display) is required for update',
        timestamp: Date.now()
      });
    }

    // Validate boolean values
    if (is_countdown_display !== undefined && typeof is_countdown_display !== 'boolean') {
      logger.warn('Invalid is_countdown_display value', { is_countdown_display });
      return res.status(400).json({
        code: 400,
        message: 'is_countdown_display must be a boolean value',
        timestamp: Date.now()
      });
    }

    if (is_slogan_display !== undefined && typeof is_slogan_display !== 'boolean') {
      logger.warn('Invalid is_slogan_display value', { is_slogan_display });
      return res.status(400).json({
        code: 400,
        message: 'is_slogan_display must be a boolean value',
        timestamp: Date.now()
      });
    }

    logger.info('Updating setting', { cid, is_countdown_display, is_slogan_display });
    const result = await settingService.updateSetting(cid, { is_countdown_display, is_slogan_display });

    logger.info('Setting updated successfully', { cid });
    res.json({
      code: 0,
      message: 'Setting updated successfully',
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Error in updateSetting controller', {
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

