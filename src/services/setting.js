import { ClassErrors } from '../config/errorCodes.js';
import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';

/**
 * Get setting by cid
 * @param {number} cid - Class ID
 */
export async function getSetting(cid) {
  logger.debug(`Getting setting for class ${cid}`);

  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  // Query setting
  const result = await db.query(
    `SELECT cid, is_countdown_display, is_slogan_display, created_at, updated_at
     FROM setting
     WHERE cid = $1 LIMIT 1`,
    [cid]
  );

  if (result.rows.length === 0) {
    logger.warn(`No setting found for class ${cid}, creating default settings`);
    // If no setting exists, create default one
    const createResult = await db.query(
      'INSERT INTO setting (cid, is_countdown_display, is_slogan_display) VALUES ($1, $2, $3) RETURNING *',
      [cid, true, true]
    );
    return createResult.rows[0];
  }

  logger.info('Setting found:', result.rows[0]);
  return result.rows[0];
}

/**
 * Update setting
 * @param {number} cid - Class ID
 * @param {Object} updates - Fields to update
 * @param {boolean} updates.is_countdown_display - Whether to display countdown (optional)
 * @param {boolean} updates.is_slogan_display - Whether to display slogan (optional)
 */
export async function updateSetting(cid, { is_countdown_display, is_slogan_display }) {
  logger.debug(`Updating setting for class ${cid}`, { is_countdown_display, is_slogan_display });

  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  const updates = [];
  const params = [cid];

  if (is_countdown_display !== undefined) {
    params.push(is_countdown_display);
    updates.push(`is_countdown_display = $${params.length}`);
  }

  if (is_slogan_display !== undefined) {
    params.push(is_slogan_display);
    updates.push(`is_slogan_display = $${params.length}`);
  }

  if (updates.length === 0) {
    logger.warn('No fields to update');
    throw { code: 400, message: 'No fields to update' };
  }

  // Add updated_at
  updates.push('updated_at = CURRENT_TIMESTAMP');

  const query = `
    UPDATE setting 
    SET ${updates.join(', ')} 
    WHERE cid = $1 
    RETURNING cid, is_countdown_display, is_slogan_display, created_at, updated_at
  `;

  const result = await db.query(query, params);

  if (result.rows.length === 0) {
    // If no setting exists, create one with the provided values
    logger.info(`No setting found for class ${cid}, creating new one`);
    const createResult = await db.query(
      'INSERT INTO setting (cid, is_countdown_display, is_slogan_display) VALUES ($1, $2, $3) RETURNING *',
      [cid, is_countdown_display ?? true, is_slogan_display ?? true]
    );
    return createResult.rows[0];
  }

  logger.info(`Setting for class ${cid} updated successfully`, result.rows[0]);
  return result.rows[0];
}

