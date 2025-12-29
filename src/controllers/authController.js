import { authenticateUser } from '../services/auth.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from '../config/errorCodes.js';
import { handleControllerError } from '../middleware/error_handler.js';

/**
 * Handle user login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function login(req, res) {
  const { password } = req.body;
  const ip = req.ip;

  logger.debug('Login attempt initiated', { ip });

  try {
    // Validate password
    if (!password) {
      logger.warn('Login attempt without password', { ip });
      return res.status(400).json({
        ...ErrorCodes.AuthErrors.PASSWORD_REQUIRED,
        timestamp: Date.now()
      });
    }

    // Authenticate user
    logger.info('Attempting authentication', { ip });
    const authResult = await authenticateUser(password, ip);

    if (!authResult) {
      logger.warn('Authentication failed', { ip, reason: 'Invalid credentials' });
      return res.status(401).json({
        ...ErrorCodes.AuthErrors.LOGIN_FAILED,
        timestamp: Date.now()
      });
    }

    // Log successful login
    logger.info('Login successful', {
      ip,
      aid: authResult.aid,
      role: authResult.role,
      expiresIn: authResult.expires_in
    });

    return res.json({
      code: 0,
      message: 'Login successful',
      data: authResult,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Login error occurred', {
      error: {
        message: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      },
      ip
    });

    handleControllerError(error, res, req);
  }
}
