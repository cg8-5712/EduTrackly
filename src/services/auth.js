// src/services/auth.js
import db from '../utils/db/db_connector.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config/config.js';
import logger from '../middleware/loggerMiddleware.js';

/**
 * User authentication
 * @param {string} password - Input password (plaintext)
 * @param {string} ip - IP address of the login request
 * @returns {Object|null} - Login result or null
 */
export async function authenticateUser(password, ip) {
  // Find all admin accounts
  const query = 'SELECT aid, password, time AS last_login_time, ip AS last_login_ip FROM admin';
  const result = await db.query(query);

  if (result.rowCount === 0) {
    return null; // No accounts found
  }

  // Iterate through all accounts, check if password matches using bcrypt
  for (const admin of result.rows) {
    // Use bcrypt.compare to check password against hash
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (isPasswordValid) {
      // Generate JWT
      const expiresIn = parseInt(config.jwt.expires) || 3600; // Default 1 hour
      const token = jwt.sign({ aid: admin.aid }, config.jwt.secret, { expiresIn });

      // Update last login information
      const updateQuery = `
                UPDATE admin
                SET time = CURRENT_TIMESTAMP, ip = $1
                WHERE aid = $2
            `;
      await db.query(updateQuery, [ip, admin.aid]);

      if (config.app.env === 'debug') {
        logger.debug(`User ${admin.aid} logged in from ${ip} with token ${token} and expires in ${expiresIn} seconds`);
      } else {
        logger.info(`User ${admin.aid} logged successfully`);
      }

      return {
        aid: admin.aid,
        access_token: token,
        expires_in: expiresIn,
        last_login_time: Math.floor(new Date(admin.last_login_time).getTime() / 1000),
        last_login_ip: admin.last_login_ip
      };
    }
  }

  return null; // No matching password
}

/**
 * Hash password using bcrypt
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(plainPassword) {
  const saltRounds = 10; // Industry standard
  return await bcrypt.hash(plainPassword, saltRounds);
}
