/**
 * Base Application Error Class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  constructor(message, code, statusCode = 500, isOperational = true, details = null) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Operational errors are expected errors
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
     * Convert error to JSON for API responses
     */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp
    };
  }

  /**
     * Convert error to loggable format
     */
  toLogFormat() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      details: this.details,
      stack: this.stack,
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error
 * For request validation failures
 */
export class ValidationError extends AppError {
  constructor(message, code = 9002, details = null) {
    super(message, code, 400, true, details);
  }
}

/**
 * Authentication Error
 * For authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message, code = 1003, details = null) {
    super(message, code, 401, true, details);
  }
}

/**
 * Authorization Error
 * For authorization/permission failures
 */
export class AuthorizationError extends AppError {
  constructor(message, code = 1003, details = null) {
    super(message, code, 403, true, details);
  }
}

/**
 * Not Found Error
 * For resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(message, code = 9003, details = null) {
    super(message, code, 404, true, details);
  }
}

/**
 * Database Error
 * For database operation errors
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null, code = 9004) {
    const details = originalError ? {
      dbCode: originalError.code,
      dbMessage: originalError.message,
      constraint: originalError.constraint,
      table: originalError.table,
      column: originalError.column
    } : null;

    super(message, code, 500, true, details);
    this.originalError = originalError;
  }

  toLogFormat() {
    return {
      ...super.toLogFormat(),
      originalError: this.originalError ? {
        message: this.originalError.message,
        code: this.originalError.code,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Business Logic Error
 * For business rule violations
 */
export class BusinessError extends AppError {
  constructor(message, code, details = null) {
    super(message, code, 400, true, details);
  }
}

/**
 * External Service Error
 * For third-party service failures
 */
export class ExternalServiceError extends AppError {
  constructor(message, serviceName, originalError = null, code = 9005) {
    const details = {
      service: serviceName,
      ...(originalError && {
        serviceError: originalError.message,
        serviceCode: originalError.code
      })
    };

    super(message, code, 503, true, details);
    this.originalError = originalError;
  }
}

/**
 * Rate Limit Error
 * For rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null, code = 1006) {
    const details = retryAfter ? { retryAfter } : null;
    super(message, code, 429, true, details);
  }
}

/**
 * Convert error code objects to AppError instances
 */
export function createErrorFromCode(errorCodeObj, details = null) {
  if (!errorCodeObj || !errorCodeObj.code || !errorCodeObj.message) {
    throw new Error('Invalid error code object');
  }

  // Determine error type based on code range
  const code = errorCodeObj.code;

  if (code >= 1000 && code < 2000) {
    // Auth errors
    if (code === 1006 || code === 1007) {
      return new RateLimitError(errorCodeObj.message, null, code);
    }
    return new AuthenticationError(errorCodeObj.message, code, details);
  } else if (code >= 7000 && code < 8000) {
    // Parameter validation errors
    return new ValidationError(errorCodeObj.message, code, details);
  } else if (code >= 8000 && code < 9000) {
    // Format errors
    return new ValidationError(errorCodeObj.message, code, details);
  } else if ([2001, 3001, 4001].includes(code)) {
    // Not found errors
    return new NotFoundError(errorCodeObj.message, code, details);
  } else {
    // Business logic errors
    return new BusinessError(errorCodeObj.message, code, details);
  }
}
