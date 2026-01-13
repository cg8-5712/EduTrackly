import { ClassErrors, SloganErrors } from '../config/errorCodes.js';
import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';

/**
 * Create a slogan
 * @param {Object} params
 * @param {number} params.cid - Class ID
 * @param {string} params.content - Slogan content
 */
export async function createSlogan({ cid, content }) {
  logger.debug(`Creating slogan for class ${cid}`);

  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  // Insert slogan
  const result = await db.query(
    'INSERT INTO slogan (cid, content) VALUES ($1, $2) RETURNING slid, cid, content, created_at',
    [cid, content]
  );

  logger.info(`Slogan created successfully for class ${cid}`, result.rows[0]);
  return result.rows[0];
}

/**
 * Get slogan by slid
 * @param {number} slid - Slogan ID
 */
export async function getSlogan(slid) {
  logger.debug(`Getting slogan with slid ${slid}`);

  // Query slogan
  const result = await db.query(
    `SELECT sl.slid, sl.cid, c.class_name, sl.content, sl.created_at
     FROM slogan sl
     LEFT JOIN class c ON sl.cid = c.cid
     WHERE sl.slid = $1 LIMIT 1`,
    [slid]
  );

  if (result.rows.length === 0) {
    throw SloganErrors.NOT_FOUND;
  }

  const slogan = result.rows[0];
  const formattedSlogan = {
    slid: slogan.slid,
    cid: slogan.cid,
    class_name: slogan.class_name,
    content: slogan.content,
    created_at: slogan.created_at
  };

  logger.info('Slogan found:', formattedSlogan);
  return formattedSlogan;
}

/**
 * List slogans with pagination and filtering
 * @param {Object} options
 * @param {number} options.cid - Class ID, optional
 * @param {number} options.page - Page number, starts from 1
 * @param {number} options.size - Items per page
 * @param {string} options.order - Sort order: desc or asc
 */
export async function listSlogans({ cid, page = 1, size = 20, order = 'desc' }) {
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
    conditions.push(`sl.cid = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * size;
  params.push(size, offset);

  const orderClause = order === 'asc' ? 'ASC' : 'DESC';

  const query = `
    SELECT sl.slid, sl.cid, c.class_name, sl.content, sl.created_at
    FROM slogan sl
    LEFT JOIN class c ON sl.cid = c.cid
    ${whereClause}
    ORDER BY sl.created_at ${orderClause}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  logger.debug('Executing listSlogans query:', query, params);
  const result = await db.query(query, params);

  const data = result.rows.map(r => ({
    slid: r.slid,
    cid: r.cid,
    class_name: r.class_name,
    content: r.content,
    created_at: r.created_at
  }));

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM slogan sl ${whereClause}`;
  const countRes = await db.query(countQuery, params.slice(0, params.length - 2));
  const total = parseInt(countRes.rows[0].count, 10);
  const pages = Math.ceil(total / size);

  logger.info(`Listed ${data.length} slogans (page ${page}/${pages}, total ${total})`);

  return { data, pagination: { page: parseInt(page), size: parseInt(size), total, pages } };
}

/**
 * Update a slogan
 * @param {number} slid - Slogan ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.content - Slogan content (optional)
 */
export async function updateSlogan(slid, { content }) {
  logger.debug(`Updating slogan ${slid}`, { content });

  // Check if slogan exists
  const checkRes = await db.query('SELECT 1 FROM slogan WHERE slid = $1 LIMIT 1', [slid]);
  if (checkRes.rows.length === 0) {
    logger.warn(`Slogan ${slid} does not exist`);
    throw SloganErrors.NOT_FOUND;
  }

  const updates = [];
  const params = [slid];

  if (content !== undefined) {
    params.push(content);
    updates.push(`content = $${params.length}`);
  }

  if (updates.length === 0) {
    logger.warn('No fields to update');
    throw { code: 400, message: 'No fields to update' };
  }

  const query = `UPDATE slogan SET ${updates.join(', ')} WHERE slid = $1 RETURNING slid, cid, content, created_at`;
  const result = await db.query(query, params);

  logger.info(`Slogan ${slid} updated successfully`, result.rows[0]);
  return result.rows[0];
}

/**
 * Delete a slogan
 * @param {number} slid - Slogan ID
 */
export async function deleteSlogan(slid) {
  logger.debug(`Deleting slogan ${slid}`);

  // Check if slogan exists
  const checkRes = await db.query('SELECT 1 FROM slogan WHERE slid = $1 LIMIT 1', [slid]);
  if (checkRes.rows.length === 0) {
    logger.warn(`Slogan ${slid} does not exist`);
    throw SloganErrors.NOT_FOUND;
  }

  const result = await db.query(
    'DELETE FROM slogan WHERE slid = $1 RETURNING *',
    [slid]
  );

  logger.info(`Slogan ${slid} deleted successfully`);
  return result.rows[0];
}
