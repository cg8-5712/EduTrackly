// src/middleware/role_require.js
import db from '../utils/db/db_connector.js';
import logger from './loggerMiddleware.js';
import { AuthErrors } from '../config/errorCodes.js';

/**
 * Middleware to require superadmin role
 * Must be used after jwtRequire middleware
 */
export function requireSuperAdmin(req, res, next) {
  if (req.role !== 'superadmin') {
    logger.warn(`⛔ Superadmin required, but user ${req.aid} has role: ${req.role}`);
    return res.status(403).json({
      code: AuthErrors.SUPERADMIN_REQUIRED.code,
      message: AuthErrors.SUPERADMIN_REQUIRED.message,
      timestamp: Date.now(),
    });
  }
  next();
}

/**
 * Check if admin has access to a specific class
 * superadmin has access to all classes
 * regular admin only has access to classes in admin_class table
 * @param {number} aid - Admin ID
 * @param {number} cid - Class ID
 * @param {string} role - Admin role
 * @returns {Promise<boolean>} - Whether admin has access
 */
export async function hasClassAccess(aid, cid, role) {
  // superadmin has access to all classes
  if (role === 'superadmin') {
    return true;
  }

  // Check admin_class table for regular admin
  const query = 'SELECT 1 FROM admin_class WHERE aid = $1 AND cid = $2';
  const result = await db.query(query, [aid, cid]);
  return result.rowCount > 0;
}

/**
 * Get all class IDs that an admin has access to
 * @param {number} aid - Admin ID
 * @param {string} role - Admin role
 * @returns {Promise<number[]|null>} - Array of class IDs, or null for superadmin (all access)
 */
export async function getAccessibleClassIds(aid, role) {
  // superadmin has access to all classes
  if (role === 'superadmin') {
    return null; // null means all classes
  }

  // Get class IDs from admin_class table
  const query = 'SELECT cid FROM admin_class WHERE aid = $1';
  const result = await db.query(query, [aid]);
  return result.rows.map(row => row.cid);
}

/**
 * Middleware factory to check class access
 * Extracts cid from query, params, or body
 * Must be used after jwtRequire middleware
 * @param {Object} options - Options
 * @param {string} options.cidSource - Where to get cid from: 'query', 'params', or 'body'
 * @param {string} options.cidField - Field name for cid (default: 'cid')
 */
export function requireClassAccess(options = {}) {
  const { cidSource = 'query', cidField = 'cid' } = options;

  return async (req, res, next) => {
    try {
      let cid;

      // Extract cid based on source
      switch (cidSource) {
        case 'query':
          cid = req.query[cidField];
          break;
        case 'params':
          cid = req.params[cidField];
          break;
        case 'body':
          cid = req.body[cidField];
          break;
        default:
          cid = req.query[cidField] || req.params[cidField] || req.body[cidField];
      }

      // If no cid provided, skip check (let controller handle missing param)
      if (!cid) {
        return next();
      }

      cid = parseInt(cid, 10);
      if (isNaN(cid)) {
        return next();
      }

      const hasAccess = await hasClassAccess(req.aid, cid, req.role);

      if (!hasAccess) {
        logger.warn(`⛔ Class access denied for admin ${req.aid} (role: ${req.role}) to class ${cid}`);
        return res.status(403).json({
          code: AuthErrors.CLASS_ACCESS_DENIED.code,
          message: AuthErrors.CLASS_ACCESS_DENIED.message,
          timestamp: Date.now(),
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking class access:', error.message);
      next(error);
    }
  };
}

/**
 * Middleware to check access to student's class
 * Gets student by sid and checks class access
 * Must be used after jwtRequire middleware
 */
export function requireStudentClassAccess(options = {}) {
  const { sidSource = 'query', sidField = 'sid' } = options;

  return async (req, res, next) => {
    try {
      // superadmin has access to all
      if (req.role === 'superadmin') {
        return next();
      }

      let sid;

      // Extract sid based on source
      switch (sidSource) {
        case 'query':
          sid = req.query[sidField];
          break;
        case 'params':
          sid = req.params[sidField];
          break;
        case 'body':
          sid = req.body[sidField];
          break;
        default:
          sid = req.query[sidField] || req.params[sidField] || req.body[sidField];
      }

      // If no sid provided, skip check
      if (!sid) {
        return next();
      }

      sid = parseInt(sid, 10);
      if (isNaN(sid)) {
        return next();
      }

      // Get student's class
      const studentQuery = 'SELECT cid FROM student WHERE sid = $1';
      const studentResult = await db.query(studentQuery, [sid]);

      if (studentResult.rowCount === 0) {
        // Student not found, let controller handle it
        return next();
      }

      const cid = studentResult.rows[0].cid;
      const hasAccess = await hasClassAccess(req.aid, cid, req.role);

      if (!hasAccess) {
        logger.warn(`⛔ Student class access denied for admin ${req.aid} to student ${sid} (class ${cid})`);
        return res.status(403).json({
          code: AuthErrors.CLASS_ACCESS_DENIED.code,
          message: AuthErrors.CLASS_ACCESS_DENIED.message,
          timestamp: Date.now(),
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking student class access:', error.message);
      next(error);
    }
  };
}

/**
 * Middleware to check access to countdown's class
 * Gets countdown by cdid and checks class access
 * Must be used after jwtRequire middleware
 */
export function requireCountdownClassAccess(options = {}) {
  const { cdidSource = 'query', cdidField = 'cdid' } = options;

  return async (req, res, next) => {
    try {
      // superadmin has access to all
      if (req.role === 'superadmin') {
        return next();
      }

      let cdid;

      // Extract cdid based on source
      switch (cdidSource) {
        case 'query':
          cdid = req.query[cdidField];
          break;
        case 'params':
          cdid = req.params[cdidField];
          break;
        case 'body':
          cdid = req.body[cdidField];
          break;
        default:
          cdid = req.query[cdidField] || req.params[cdidField] || req.body[cdidField];
      }

      // If no cdid provided, skip check (let controller handle missing param)
      if (!cdid) {
        return next();
      }

      cdid = parseInt(cdid, 10);
      if (isNaN(cdid)) {
        return next();
      }

      // Get countdown's class
      const countdownQuery = 'SELECT cid FROM countdown WHERE cdid = $1';
      const countdownResult = await db.query(countdownQuery, [cdid]);

      if (countdownResult.rowCount === 0) {
        // Countdown not found, let controller handle it
        return next();
      }

      const cid = countdownResult.rows[0].cid;
      const hasAccess = await hasClassAccess(req.aid, cid, req.role);

      if (!hasAccess) {
        logger.warn(`⛔ Countdown class access denied for admin ${req.aid} to countdown ${cdid} (class ${cid})`);
        return res.status(403).json({
          code: AuthErrors.CLASS_ACCESS_DENIED.code,
          message: AuthErrors.CLASS_ACCESS_DENIED.message,
          timestamp: Date.now(),
        });
      }

      next();
    } catch (error) {
      logger.error('Error checking countdown class access:', error.message);
      next(error);
    }
  };
}
