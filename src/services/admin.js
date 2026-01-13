// src/services/admin.js
import db from '../utils/db/db_connector.js';
import { hashPassword } from './auth.js';
import logger from '../middleware/loggerMiddleware.js';

/**
 * Create a new admin account
 * @param {string} password - Plain text password
 * @param {string} role - Admin role ('superadmin' or 'admin')
 * @returns {Object} - Created admin info
 */
export async function createAdmin(password, role = 'admin') {
  const hashedPassword = await hashPassword(password);

  const query = `
    INSERT INTO admin (password, role)
    VALUES ($1, $2)
    RETURNING aid, role, time
  `;
  const result = await db.query(query, [hashedPassword, role]);

  logger.info(`Admin account created: aid=${result.rows[0].aid} (${role})`);
  return result.rows[0];
}

/**
 * Get admin by ID
 * @param {number} aid - Admin ID
 * @returns {Object|null} - Admin info or null
 */
export async function getAdminById(aid) {
  const query = 'SELECT aid, role, time, ip FROM admin WHERE aid = $1';
  const result = await db.query(query, [aid]);
  return result.rows[0] || null;
}

/**
 * Get admin by ID with password hash (for password verification)
 * @param {number} aid - Admin ID
 * @returns {Object|null} - Admin info with password or null
 */
export async function getAdminWithPassword(aid) {
  const query = 'SELECT aid, password, role FROM admin WHERE aid = $1';
  const result = await db.query(query, [aid]);
  return result.rows[0] || null;
}

/**
 * List all admins with pagination
 * @param {Object} options - Pagination options
 * @returns {Object} - List of admins with pagination info
 */
export async function listAdmins(options = {}) {
  const { page = 1, size = 20, role } = options;
  const offset = (page - 1) * size;

  let countQuery = 'SELECT COUNT(*) FROM admin';
  let listQuery = 'SELECT aid, role, time, ip FROM admin';
  const params = [];

  if (role) {
    countQuery += ' WHERE role = $1';
    listQuery += ' WHERE role = $1';
    params.push(role);
  }

  listQuery += ` ORDER BY aid ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(size, offset);

  const [countResult, listResult] = await Promise.all([
    db.query(countQuery, role ? [role] : []),
    db.query(listQuery, params)
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    admins: listResult.rows,
    pagination: {
      page,
      size,
      total,
      totalPages: Math.ceil(total / size)
    }
  };
}

/**
 * Update admin info
 * @param {number} aid - Admin ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated admin info or null
 */
export async function updateAdmin(aid, updates) {
  const { password, role } = updates;
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  if (password) {
    const hashedPassword = await hashPassword(password);
    setClauses.push(`password = $${paramIndex++}`);
    params.push(hashedPassword);
  }

  if (role) {
    setClauses.push(`role = $${paramIndex++}`);
    params.push(role);
  }

  if (setClauses.length === 0) {
    return null;
  }

  params.push(aid);
  const query = `
    UPDATE admin
    SET ${setClauses.join(', ')}
    WHERE aid = $${paramIndex}
    RETURNING aid, role, time, ip
  `;

  const result = await db.query(query, params);
  return result.rows[0] || null;
}

/**
 * Delete admin account
 * @param {number} aid - Admin ID
 * @returns {boolean} - Whether deletion was successful
 */
export async function deleteAdmin(aid) {
  const query = 'DELETE FROM admin WHERE aid = $1 RETURNING aid';
  const result = await db.query(query, [aid]);
  return result.rowCount > 0;
}

/**
 * Assign a class to an admin
 * @param {number} aid - Admin ID
 * @param {number} cid - Class ID
 * @returns {Object} - Assignment info
 */
export async function assignClassToAdmin(aid, cid) {
  const query = `
    INSERT INTO admin_class (aid, cid)
    VALUES ($1, $2)
    ON CONFLICT (aid, cid) DO NOTHING
    RETURNING aid, cid, created_at
  `;
  const result = await db.query(query, [aid, cid]);

  if (result.rowCount === 0) {
    // Already exists
    const existingQuery = 'SELECT aid, cid, created_at FROM admin_class WHERE aid = $1 AND cid = $2';
    const existingResult = await db.query(existingQuery, [aid, cid]);
    return existingResult.rows[0];
  }

  logger.info(`Class ${cid} assigned to admin ${aid}`);
  return result.rows[0];
}

/**
 * Remove a class from an admin
 * @param {number} aid - Admin ID
 * @param {number} cid - Class ID
 * @returns {boolean} - Whether removal was successful
 */
export async function removeClassFromAdmin(aid, cid) {
  const query = 'DELETE FROM admin_class WHERE aid = $1 AND cid = $2 RETURNING aid';
  const result = await db.query(query, [aid, cid]);
  return result.rowCount > 0;
}

/**
 * Get all classes assigned to an admin
 * @param {number} aid - Admin ID
 * @returns {Array} - List of classes
 */
export async function getAdminClasses(aid) {
  const query = `
    SELECT c.cid, c.class_name, c.create_time, ac.created_at as assigned_at
    FROM admin_class ac
    JOIN class c ON ac.cid = c.cid
    WHERE ac.aid = $1
    ORDER BY c.cid ASC
  `;
  const result = await db.query(query, [aid]);
  return result.rows;
}

/**
 * Get all admins assigned to a class
 * @param {number} cid - Class ID
 * @returns {Array} - List of admins
 */
export async function getClassAdmins(cid) {
  const query = `
    SELECT a.aid, a.role, ac.created_at as assigned_at
    FROM admin_class ac
    JOIN admin a ON ac.aid = a.aid
    WHERE ac.cid = $1
    ORDER BY a.aid ASC
  `;
  const result = await db.query(query, [cid]);
  return result.rows;
}

/**
 * Batch assign classes to an admin
 * @param {number} aid - Admin ID
 * @param {number[]} cids - Array of class IDs
 * @returns {Object} - Assignment results
 */
export async function batchAssignClasses(aid, cids) {
  const results = [];

  for (const cid of cids) {
    try {
      const result = await assignClassToAdmin(aid, cid);
      results.push({ cid, success: true, data: result });
    } catch (error) {
      results.push({ cid, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Replace all class assignments for an admin
 * @param {number} aid - Admin ID
 * @param {number[]} cids - Array of class IDs (new assignments)
 * @returns {Object} - Operation result
 */
export async function replaceAdminClasses(aid, cids) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Remove all existing assignments
    await client.query('DELETE FROM admin_class WHERE aid = $1', [aid]);

    // Add new assignments
    if (cids && cids.length > 0) {
      const insertQuery = `
        INSERT INTO admin_class (aid, cid)
        SELECT $1, unnest($2::int[])
      `;
      await client.query(insertQuery, [aid, cids]);
    }

    await client.query('COMMIT');

    logger.info(`Replaced class assignments for admin ${aid}: ${cids.length} classes`);
    return { success: true, assignedClasses: cids.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
