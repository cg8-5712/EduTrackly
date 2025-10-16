/**
 * Logging utility functions to prevent [object Object] issues
 * and ensure consistent, readable log output
 */

/**
 * Safely serialize an error object for logging
 * @param {Error} error - Error object to serialize
 * @returns {Object} Serialized error object
 */
export function serializeError(error) {
  if (!error) return null;

  // If it's already a plain object with no circular references
  if (!(error instanceof Error)) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch (e) {
      return { value: String(error) };
    }
  }

  const serialized = {
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    ...(error.code !== undefined && { code: error.code }),
    ...(error.statusCode !== undefined && { statusCode: error.statusCode }),
    ...(error.stack && { stack: error.stack }),
  };

  // Include custom properties from AppError
  if (error.isOperational !== undefined) {
    serialized.isOperational = error.isOperational;
  }
  if (error.details) {
    serialized.details = error.details;
  }
  if (error.timestamp) {
    serialized.timestamp = error.timestamp;
  }

  // Include database-specific properties
  if (error.constraint) serialized.constraint = error.constraint;
  if (error.table) serialized.table = error.table;
  if (error.column) serialized.column = error.column;
  if (error.routine) serialized.routine = error.routine;

  return serialized;
}

/**
 * Safely serialize any value for logging
 * @param {*} value - Value to serialize
 * @returns {*} Serialized value
 */
export function safeSerialize(value) {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Error objects
  if (value instanceof Error) {
    return serializeError(value);
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle primitive types
  if (typeof value !== 'object') {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => safeSerialize(item));
  }

  // Handle plain objects
  try {
    const serialized = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip functions and symbols
      if (typeof val === 'function' || typeof val === 'symbol') {
        continue;
      }

      if (val instanceof Error) {
        serialized[key] = serializeError(val);
      } else if (val && typeof val === 'object') {
        // Detect circular references
        try {
          JSON.stringify(val);
          serialized[key] = val;
        } catch (e) {
          serialized[key] = '[Circular Reference]';
        }
      } else {
        serialized[key] = val;
      }
    }
    return serialized;
  } catch (error) {
    return { error: 'Failed to serialize object', value: String(value) };
  }
}

/**
 * Create a context object for logging
 * @param {Object} params - Parameters to include in context
 * @returns {Object} Logging context
 */
export function createLogContext(params = {}) {
  const context = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      context[key] = safeSerialize(value);
    }
  }

  return context;
}

/**
 * Format request information for logging
 * @param {Object} req - Express request object
 * @returns {Object} Formatted request info
 */
export function formatRequestInfo(req) {
  if (!req) return {};

  return {
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(req.aid && { aid: req.aid }),
    ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
    ...(req.params && Object.keys(req.params).length > 0 && { params: req.params }),
  };
}

/**
 * Format database query information for logging
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {Object} options - Additional options
 * @returns {Object} Formatted query info
 */
export function formatQueryInfo(query, params = [], options = {}) {
  return {
    query: query?.substring(0, 500), // Limit query length
    params: params ? safeSerialize(params) : [],
    ...options
  };
}

/**
 * Sanitize sensitive data from logs
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'access_token', 'refresh_token'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Create a logger wrapper with automatic error serialization
 * @param {Object} logger - Pino logger instance
 * @returns {Object} Wrapped logger
 */
export function createLoggerWrapper(logger) {
  return {
    debug: (message, context = {}) => {
      logger.debug(safeSerialize(context), message);
    },
    info: (message, context = {}) => {
      logger.info(safeSerialize(context), message);
    },
    warn: (message, context = {}) => {
      logger.warn(safeSerialize(context), message);
    },
    error: (message, errorOrContext = {}) => {
      // Handle both error objects and context objects
      const context = errorOrContext instanceof Error
        ? { error: serializeError(errorOrContext) }
        : safeSerialize(errorOrContext);

      logger.error(context, message);
    },
    fatal: (message, errorOrContext = {}) => {
      const context = errorOrContext instanceof Error
        ? { error: serializeError(errorOrContext) }
        : safeSerialize(errorOrContext);

      logger.fatal(context, message);
    }
  };
}

/**
 * Format performance metrics for logging
 * @param {number} startTime - Start time in milliseconds
 * @param {Object} additionalMetrics - Additional metrics to include
 * @returns {Object} Formatted metrics
 */
export function formatPerformanceMetrics(startTime, additionalMetrics = {}) {
  const duration = Date.now() - startTime;
  return {
    duration: `${duration}ms`,
    durationMs: duration,
    ...additionalMetrics
  };
}
