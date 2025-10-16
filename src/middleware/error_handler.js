import * as ErrorCodes from '../config/errorCodes.js';
import logger from '../middleware/loggerMiddleware.js';
import {
  AppError,
  DatabaseError,
  ValidationError,
  AuthenticationError
} from '../utils/errors/AppError.js';
import { serializeError, createLogContext } from '../utils/logging/logUtils.js';

/**
 * Error classification and mapping
 */
const ERROR_TYPES = {
  // PostgreSQL error codes
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  INVALID_TEXT_REPRESENTATION: '22P02',

  // JWT errors
  JWT_EXPIRED: 'TokenExpiredError',
  JWT_INVALID: 'JsonWebTokenError',
  JWT_NOT_BEFORE: 'NotBeforeError',
};

/**
 * Determine if error is operational (expected) or programming error
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }

  // Database constraint violations are operational
  if (error.code && [
    ERROR_TYPES.UNIQUE_VIOLATION,
    ERROR_TYPES.FOREIGN_KEY_VIOLATION,
    ERROR_TYPES.NOT_NULL_VIOLATION,
    ERROR_TYPES.CHECK_VIOLATION,
  ].includes(error.code)) {
    return true;
  }

  // JWT errors are operational
  if (error.name && [
    ERROR_TYPES.JWT_EXPIRED,
    ERROR_TYPES.JWT_INVALID,
    ERROR_TYPES.JWT_NOT_BEFORE,
  ].includes(error.name)) {
    return true;
  }

  return false;
}

/**
 * Map database errors to application errors
 */
function mapDatabaseError(error) {
  const dbCode = error.code;

  switch (dbCode) {
  case ERROR_TYPES.UNIQUE_VIOLATION:
    return new DatabaseError(
      error.constraint
        ? `Duplicate value for ${error.constraint}`
        : 'Duplicate entry found',
      error,
      4002 // Use existing ALREADY_EXIST code
    );

  case ERROR_TYPES.FOREIGN_KEY_VIOLATION:
    return new DatabaseError(
      'Referenced record not found or constraint violation',
      error,
      9006
    );

  case ERROR_TYPES.NOT_NULL_VIOLATION:
    return new ValidationError(
      `Required field missing: ${error.column || 'unknown'}`,
      9007,
      { column: error.column, table: error.table }
    );

  case ERROR_TYPES.CHECK_VIOLATION:
    return new ValidationError(
      `Invalid value: ${error.constraint || 'constraint violation'}`,
      9008,
      { constraint: error.constraint, table: error.table }
    );

  case ERROR_TYPES.INVALID_TEXT_REPRESENTATION:
    return new ValidationError(
      'Invalid data type or format',
      9009,
      { detail: error.message }
    );

  default:
    return new DatabaseError(
      'Database operation failed',
      error
    );
  }
}

/**
 * Map JWT errors to application errors
 */
function mapJWTError(error) {
  switch (error.name) {
  case ERROR_TYPES.JWT_EXPIRED:
    return new AuthenticationError(
      'Token has expired',
      1008, // SESSION_EXPIRED
      { expiredAt: error.expiredAt }
    );

  case ERROR_TYPES.JWT_INVALID:
    return new AuthenticationError(
      'Invalid token',
      1001, // INVALID_TOKEN
      { reason: error.message }
    );

  case ERROR_TYPES.JWT_NOT_BEFORE:
    return new AuthenticationError(
      'Token not yet valid',
      1001,
      { notBefore: error.date }
    );

  default:
    return new AuthenticationError('Authentication failed', 1001);
  }
}

/**
 * Convert any error to AppError
 */
function normalizeError(error) {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Database errors
  if (error.code && typeof error.code === 'string' && error.code.match(/^\d{5}$/)) {
    return mapDatabaseError(error);
  }

  // JWT errors
  if (error.name && error.name.includes('Token')) {
    return mapJWTError(error);
  }

  // Business errors (from services) - have numeric code and message
  if (error.code && typeof error.code === 'number' && error.message) {
    return new AppError(
      error.message,
      error.code,
      error.statusCode || 400,
      true,
      error.details
    );
  }

  // Unknown errors - treat as internal server error
  return new AppError(
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message || 'Internal server error',
    9001,
    500,
    false, // Not operational
    process.env.NODE_ENV === 'production' ? null : { originalMessage: error.message }
  );
}

/**
 * Log error with appropriate level and context
 */
function logError(error, req = null) {
  const normalizedError = normalizeError(error);
  const isOperational = isOperationalError(normalizedError);

  const logContext = createLogContext({
    error: serializeError(normalizedError),
    errorType: normalizedError.constructor.name,
    isOperational,
    ...(req && {
      method: req.method,
      url: req.url,
      ip: req.ip,
      aid: req.aid
    })
  });

  // Use different log levels based on error severity
  if (!isOperational) {
    // Programming errors - these need immediate attention
    logger.error('❌ CRITICAL: Non-operational error occurred', logContext);
  } else if (normalizedError.statusCode >= 500) {
    // Operational but server errors
    logger.error('⚠️  Server error occurred', logContext);
  } else if (normalizedError.statusCode >= 400) {
    // Client errors - less severe
    logger.warn('⚠️  Client error occurred', logContext);
  } else {
    logger.info('ℹ️  Expected error handled', logContext);
  }
}

/**
 * Handle controller errors
 * @param {Error} error - Error object
 * @param {Object} res - Express response object
 * @param {Object} req - Express request object (optional)
 */
export function handleControllerError(error, res, req = null) {
  // Normalize error to AppError
  const normalizedError = normalizeError(error);

  // Log the error
  logError(normalizedError, req);

  // Send response
  const statusCode = normalizedError.statusCode || 500;
  const response = normalizedError.toJSON();

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    response.message = 'Internal server error';
    delete response.details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Express error handling middleware
 * This catches any errors passed to next(error)
 */
export function errorHandlerMiddleware(err, req, res, next) {
  handleControllerError(err, res, req);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json({
    code: 9010,
    message: 'Route not found',
    timestamp: Date.now()
  });
}