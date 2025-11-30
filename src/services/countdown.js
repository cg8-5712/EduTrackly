import { ClassErrors, CountdownErrors } from '../config/errorCodes.js';
import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { formatDatefromyyyymmddtopsqldate } from '../utils/dateUtils.js';

/**
 * Create a countdown
 * @param {Object} params
 * @param {number} params.cid - Class ID
 * @param {string} params.content - Countdown content
 * @param {string} params.deadline - Deadline in YYYYMMDD format
 */
export async function createCountdown({ cid, content, deadline }) {
  // Convert YYYYMMDD to SQL date format
  const sqlDate = formatDatefromyyyymmddtopsqldate(deadline);
  
  logger.debug(`Creating countdown for class ${cid} with deadline ${sqlDate}`);

  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  // Insert countdown
  const result = await db.query(
    'INSERT INTO countdown (cid, content, deadline) VALUES ($1, $2, $3) RETURNING cdid, cid, content, deadline, created_at',
    [cid, content, sqlDate]
  );

  logger.info(`Countdown created successfully for class ${cid}`, result.rows[0]);
  return result.rows[0];
}