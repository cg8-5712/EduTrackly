import * as ErrorCodes from '../config/errorCodes.js';
import logger from '../middleware/loggerMiddleware.js';

/**
 * Handle controller errors
 * @param {Error} error - Error object
 * @param {Object} res - Express response object
 */
export function handleControllerError(error, res) {
    if (error.code && error.message && typeof error.code === 'number') {
        return res.status(400).json({
            ...error,
            timestamp: Date.now()
        });
    }

    logger.error(error);

    res.status(500).json({
        ...ErrorCodes.SystemErrors.INTERNAL,
        timestamp: Date.now()
    });
}