#!/usr/bin/env node

/**
 * Module dependencies.
 * Server initialization and configuration file
 */

// Node.js built-in modules
import http from 'http';
import process from 'process';

// Third-party modules
import chalk from 'chalk';

// Local modules
import app from '../app.js';
import config from '../src/config/config.js';
import logger from '../src/middleware/loggerMiddleware.js';
import initializeDatabase from '../src/utils/db/db_init.js';

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(config.app.port);
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 * @param {string|number} val - Port value to normalize
 * @returns {number|string|boolean} Normalized port value
 */
function normalizePort(val) {
    const port = parseInt(val, 10);
    
    if (isNaN(port)) {
        return val;
    }
    
    if (port >= 0) {
        return port;
    }
    
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 * @param {Error} error - Server error object
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            logger.info('❌ 服务器启动失败, 权限不足');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            logger.info('❌ 服务器启动失败, 端口已被占用');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 * Initializes database and logs server status
 */
async function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

    logger.info(chalk.green('================================='));
    logger.info(chalk.blue('🚀 Server Status'));
    logger.info(chalk.green('================================='));
    logger.info(chalk.yellow('Environment:    '), chalk.white(config.app.env));
    logger.debug(chalk.yellow('Server:         '), chalk.white(`http://localhost:${port}`));

    try {
        await initializeDatabase();
    } catch (err) {
        logger.error('❌ 数据库初始化失败:', err.message);
        logger.info('❌ 服务器启动失败, 请检查数据库连接配置');
        process.exit(1);
    }

    logger.info(chalk.green('=================================\n'));

    logger.info('✅ System is up and running!');
}