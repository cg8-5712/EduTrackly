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

/**
 * Get countdown by cdid
 * @param {number} cdid - Countdown ID
 */
export async function getCountdown(cdid) {
  logger.debug(`Getting countdown with cdid ${cdid}`);

  // Query countdown
  const result = await db.query(
    `SELECT cd.cdid, cd.cid, c.class_name, cd.content, cd.deadline, cd.created_at
     FROM countdown cd
     LEFT JOIN class c ON cd.cid = c.cid
     WHERE cd.cdid = $1 LIMIT 1`,
    [cdid]
  );

  if (result.rows.length === 0) {
    throw CountdownErrors.NOT_FOUND;
  }

  const countdown = result.rows[0];
  const formattedCountdown = {
    cdid: countdown.cdid,
    cid: countdown.cid,
    class_name: countdown.class_name,
    content: countdown.content,
    deadline: countdown.deadline,
    created_at: countdown.created_at
  };

  logger.info('Countdown found:', formattedCountdown);
  return formattedCountdown;
}

/**
 * List countdowns with pagination and filtering
 * @param {Object} options
 * @param {number} options.cid - Class ID, optional
 * @param {string} options.deadline - Deadline in YYYYMMDD format, optional
 * @param {number} options.page - Page number, starts from 1
 * @param {number} options.size - Items per page
 * @param {string} options.order - Sort order: desc or asc
 */
export async function listCountdowns({ cid, deadline, page = 1, size = 20, order = 'desc' }) {
  const conditions = [];
  const params = [];

  if (cid) {
    // Check if class exists
    const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
    if (classRes.rows.length === 0) {
      logger.warn(`CID ${cid} does not exist`);
      throw ClassErrors.NOT_FOUND;
    }

    params.push(cid);
    conditions.push(`cd.cid = $${params.length}`);
  }

  if (deadline) {
    const sqlDate = formatDatefromyyyymmddtopsqldate(deadline);
    params.push(sqlDate);
    conditions.push(`cd.deadline = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * size;
  params.push(size, offset);

  const orderClause = order === 'asc' ? 'ASC' : 'DESC';

  const query = `
    SELECT cd.cdid, cd.cid, c.class_name, cd.content, cd.deadline, cd.created_at
    FROM countdown cd
    LEFT JOIN class c ON cd.cid = c.cid
    ${whereClause}
    ORDER BY cd.deadline ${orderClause}, cd.created_at ${orderClause}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  logger.debug('Executing listCountdowns query:', query, params);
  const result = await db.query(query, params);

  const data = result.rows.map(r => ({
    cdid: r.cdid,
    cid: r.cid,
    class_name: r.class_name,
    content: r.content,
    deadline: r.deadline,
    created_at: r.created_at
  }));

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM countdown cd ${whereClause}`;
  const countRes = await db.query(countQuery, params.slice(0, params.length - 2));
  const total = parseInt(countRes.rows[0].count, 10);
  const pages = Math.ceil(total / size);

  logger.info(`Listed ${data.length} countdowns (page ${page}/${pages}, total ${total})`);

  return { data, pagination: { page: parseInt(page), size: parseInt(size), total, pages } };
}
