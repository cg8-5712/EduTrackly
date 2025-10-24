// loggerMiddleware.js
import pino from 'pino';
import config from '../config/config.js';

// Create Pino logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || (config.app.env === 'production' ? 'info' : 'debug'),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{msg}',
    }
  },
  // Ensure proper serialization of errors
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Format output
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

// HTTP request logger middleware
export function loggerMiddleware(req, res, next) {
  const start = Date.now();

  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, `→ ${req.method} ${req.url}`);

  // Listen for response completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      type: 'response',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      durationMs: duration,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, `← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    } else {
      logger.info(logData, `← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}

export default logger;
