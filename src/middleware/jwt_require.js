// src/middleware/jwt_require.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from './loggerMiddleware.js';
import { AuthErrors } from '../config/errorCodes.js';

/**
 * Required JWT middleware
 * 强制要求登录，未登录返回 401
 */
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

    // Store user information in request
    req.aid = decoded.aid;
    req.role = decoded.role || 'admin';  // Default to 'admin' for backward compatibility

    logger.debug(`✅ JWT verified, aid: ${decoded.aid}, role: ${req.role}`);
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

/**
 * Optional JWT middleware
 * 不强制登录，但如果有 token 则解析角色信息
 * 用于需要根据角色过滤数据的公开端点
 */
export function optionalJwt(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.aid = null;
    req.role = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.aid = null;
    req.role = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.aid = decoded.aid;
    req.role = decoded.role || 'admin';
    logger.debug(`✅ Optional JWT verified, aid: ${decoded.aid}, role: ${req.role}`);
    next();
  } catch (err) {
    // Token 无效，视为未登录
    req.aid = null;
    req.role = null;
    next();
  }
}
