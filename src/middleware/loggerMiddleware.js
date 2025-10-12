// loggerMiddleware.js
import pino from 'pino';
import config from '../config/config.js';

// Create Pino logger instance
const logger = pino({
    level: process.env.LOG_LEVEL || (config.app.env === 'production' ? 'info' : 'debug'),
    transport: config.app.env !== 'production' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: true,
        }
    } : undefined,
});

// HTTP request logger middleware
export function loggerMiddleware(req, res, next) {
    const start = Date.now();

    // Log request
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
    }, `${req.method} ${req.url}`);

    // Listen for response completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
        };

        if (res.statusCode >= 500) {
            logger.error(logData, `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
        } else if (res.statusCode >= 400) {
            logger.warn(logData, `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
        } else {
            logger.info(logData, `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
        }
    });

    next();
}

export default logger;
