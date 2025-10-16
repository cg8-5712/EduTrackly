// src/middleware/jwt_require.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from './loggerMiddleware.js';
import { AuthErrors } from '../config/errorCodes.js';

export default function jwtRequire(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    logger.warn('⛔ Missing Authorization header');
    return res.status(401).json({
      code: AuthErrors.UNAUTHORIZED.code,
      message: AuthErrors.UNAUTHORIZED.message,
      timestamp: Date.now(),
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer token
  if (!token) {
    logger.warn('⛔ Missing token in Authorization header');
    return res.status(401).json({
      code: AuthErrors.UNAUTHORIZED.code,
      message: AuthErrors.UNAUTHORIZED.message,
      timestamp: Date.now(),
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.aid) {
      logger.warn('⛔ Token payload missing \'aid\'');
      return res.status(401).json({
        code: AuthErrors.INVALID_TOKEN.code,
        message: AuthErrors.INVALID_TOKEN.message,
        timestamp: Date.now(),
      });
    }

    req.aid = decoded.aid;
    logger.debug('✅ JWT verified, aid:', decoded.aid);
    next();
  } catch (err) {
    logger.error('❌ Invalid or expired token:', err.message);
    return res.status(401).json({
      code: AuthErrors.INVALID_TOKEN.code,
      message: AuthErrors.INVALID_TOKEN.message,
      timestamp: Date.now(),
    });
  }
}
