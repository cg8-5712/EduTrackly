// src/config/express.js
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import logger, { loggerMiddleware } from '../middleware/loggerMiddleware.js';

export default function configureExpress(app) {
  logger.info('Configuring Express...');

  // CORS
  app.use(cors());
  logger.debug('  - CORS enabled');

  // Security headers
  app.use(helmet());
  logger.debug('  - Helmet security headers enabled');

  // GZIP compression
  app.use(compression());
  logger.debug('  - Compression enabled');

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  logger.debug('  - Body parsers enabled');

  // Logger middleware
  app.use(loggerMiddleware);
  logger.debug('  - Logger middleware enabled');

  logger.info('Express configured successfully');
}
