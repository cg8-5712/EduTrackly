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
 * Display ASCII art banner on startup
 */
function displayBanner() {
  console.log('\n');
  console.log(chalk.cyan('╔═══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.yellow.bold('    _____ _       _____               _    _                   ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.yellow.bold('   | ____| |     |_   _| __ __ _  ___| | _| |_   _             ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.yellow.bold('   |  _| | | | | | | || |__/ _` |/ __| |/ / | | | |            ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.yellow.bold('   | |___| |_| |_| | || | | (_| | (__|   <| | |_| |            ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.yellow.bold('   |_____|_____\\__,_|_||_|  \\__,_|\\___|_|\\_\\_|\\__,|            ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.yellow.bold('                                             |___/             ') + chalk.cyan('║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║') + chalk.white('  📚 Project:  ') + chalk.green.bold('EduTrackly                                       ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.white('  🏷️  Version:  ') + chalk.green.bold('v1.9.1                                          ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.white('  👤 Author:   ') + chalk.green.bold('Cg8-5712                                         ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.white('  ���� Started:  ') + chalk.green.bold(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '                            ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════════╝'));
  console.log('\n');
}

/**
 * Event listener for HTTP server "listening" event.
 * Initializes database and logs server status
 */
async function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

  displayBanner();

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

/**
 * Graceful shutdown handler
 * Handles SIGTERM and SIGINT signals for clean server shutdown
 */
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn('⚠️  Force shutdown requested, exiting immediately...');
    process.exit(1);
  }

  isShuttingDown = true;

  console.log('\n');
  logger.info(chalk.yellow('================================='));
  logger.info(chalk.yellow(`📡 Received ${signal} signal`));
  logger.info(chalk.yellow('================================='));
  logger.info('🛑 Initiating graceful shutdown...');

  // Get current connections and pending tasks info
  const connections = server.listening ? '✅ Active' : '❌ Inactive';

  logger.info(chalk.white('Server Status:      '), chalk.cyan(connections));

  // Close server and stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logger.error('❌ Error during server shutdown:', err.message);
    } else {
      logger.info('✅ HTTP Server closed successfully');
    }

    // Close database connections
    try {
      const db = (await import('../src/utils/db/db_connector.js')).default;
      await db.end();
      logger.info('✅ Database connections closed');
    } catch (error) {
      logger.error('❌ Error closing database:', error.message);
    }

    // Display shutdown banner
    console.log('\n');
    console.log(chalk.cyan('╔═══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.red.bold('                   SERVER SHUTDOWN                             ') + chalk.cyan('║'));
    console.log(chalk.cyan('╠═══════════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.white('  📚 Project:  ') + chalk.green.bold('EduTrackly                                       ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.white('  ⏱️  Stopped:  ') + chalk.red.bold(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '                              ') + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.white('  👋 Status:   ') + chalk.red.bold('All services stopped gracefully                  ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════════╝'));
    console.log('\n');

    logger.info(chalk.green('✨ Shutdown completed successfully'));
    logger.info(chalk.gray('Goodbye! 👋\n'));

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('⚠️  Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});