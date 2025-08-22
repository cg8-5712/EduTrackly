#!/usr/bin/env node
import http from 'http';
import process from 'process';
import chalk from 'chalk';

import app from '../app.js';
import config from '../src/config/config.js';
import logger from '../src/middleware/loggerMiddleware.js';

// Normalize port
const port = normalizePort(config.app.port);
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Listen on provided port
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Normalize a port into a number, string, or false
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}

// Event listener for HTTP server "error" event
function onError(error) {
    if (error.syscall !== 'listen') throw error;

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

// Event listener for HTTP server "listening" event
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;

    logger.info(chalk.green('================================='));
    logger.info(chalk.blue('🚀 Server Status'));
    logger.info(chalk.green('================================='));
    logger.info(chalk.yellow('Environment:    '), chalk.white(config.app.env));
    logger.info(chalk.yellow('Server:         '), chalk.white(`http://localhost:${port}`));
    logger.debug(chalk.yellow('Database:       '), chalk.white(`${config.db.host}:${config.db.port}/${config.db.name}`));
    logger.info(chalk.green('=================================\n'));

}