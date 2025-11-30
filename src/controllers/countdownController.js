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