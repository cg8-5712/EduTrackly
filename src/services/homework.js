import { ClassErrors, HomeworkErrors } from '../config/errorCodes.js';
import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { formatDatefromyyyymmddtopsqldate, formatDatefromsqldatetoyyyymmdd } from '../utils/dateUtils.js';

/**
 * Get homework by class and date
 */
export async function getHomework(cid, date) {
  const sqlDate = formatDatefromyyyymmddtopsqldate(date);
  logger.debug(`Getting homework for class ${cid} on ${sqlDate}`);

  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  // Query homework
  const homeworkRes = await db.query(
    `SELECT cid, chinese, math, english, physics, chemistry, biology, history, geography, politics, other, due_date
         FROM homework WHERE cid = $1 AND due_date = $2 LIMIT 1`,
    [cid, sqlDate]
  );
  if (homeworkRes.rows.length === 0) {
    throw HomeworkErrors.NOT_FOUND;
  }

  const homework = homeworkRes.rows[0];

  // Build homework_content object
  const homework_content = {
    chinese: homework.chinese || '',
    maths: homework.math || '',  // Note: using maths instead of math
    english: homework.english || '',
    physics: homework.physics || '',
    chemistry: homework.chemistry || '',
    biology: homework.biology || '',
    history: homework.history || '',
    geography: homework.geography || '',
    politics: homework.politics || '',
    others: homework.other || ''  // Note: using others instead of other
  };

  // Query class name
  const classQuery = 'SELECT class_name FROM class WHERE cid = $1 LIMIT 1';
  const classRes2 = await db.query(classQuery, [cid]);
  const class_name = classRes2.rows.length > 0 ? classRes2.rows[0].class_name : null;

  const result = {
    cid: homework.cid,
    class_name,
    homework_content,
    due_date: formatDatefromsqldatetoyyyymmdd(homework.due_date)
  };

  logger.info(`Homework found: ${JSON.stringify(result)}`);
  return result;
}

/**
 * List homework (pagination + conditional filtering)
 */
/**
 * Get homework list with pagination and filtering
 * @param {Object} options
 * @param {number} options.cid - Class ID, optional
 * @param {string} options.startDate - Start date YYYYMMDD, optional
 * @param {string} options.endDate - End date YYYYMMDD, optional
 * @param {number} options.page - Page number, starts from 1
 * @param {number} options.size - Items per page
 * @param {string} options.order - Sort order: desc or incs
 */
export async function listHomeworks({ cid, startDate, endDate, page = 1, size = 20, order = 'desc' }) {
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
    conditions.push(`h.cid = $${params.length}`);
  }
  if (startDate) {
    const sqlStart = formatDatefromyyyymmddtopsqldate(startDate);
    params.push(sqlStart);
    conditions.push(`h.due_date >= $${params.length}`);
  }
  if (endDate) {
    const sqlEnd = formatDatefromyyyymmddtopsqldate(endDate);
    params.push(sqlEnd);
    conditions.push(`h.due_date <= $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * size;
  params.push(size, offset);

  const orderClause = order === 'incs' ? 'ASC' : 'DESC';

  const query = `
        SELECT h.cid, c.class_name, h.chinese, h.math, h.english, h.physics, h.chemistry, 
               h.biology, h.history, h.geography, h.politics, h.other, h.due_date
        FROM homework h
                 LEFT JOIN class c ON h.cid = c.cid
            ${whereClause}
        ORDER BY h.due_date ${orderClause}
        LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
  logger.debug('Executing listHomeworks query:', query, params);
  const result = await db.query(query, params);

  const data = result.rows.map(r => ({
    cid: r.cid,
    class_name: r.class_name,
    homework_content: {
      chinese: r.chinese || '',
      maths: r.math || '',
      english: r.english || '',
      physics: r.physics || '',
      chemistry: r.chemistry || '',
      biology: r.biology || '',
      history: r.history || '',
      geography: r.geography || '',
      politics: r.politics || '',
      others: r.other || ''
    },
    due_date: formatDatefromsqldatetoyyyymmdd(r.due_date)
  }));

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM homework h ${whereClause}`;
  const countRes = await db.query(countQuery, params.slice(0, params.length - 2));
  const total = parseInt(countRes.rows[0].count, 10);
  const pages = Math.ceil(total / size);
  logger.info(`Listed ${data.length} homeworks (page ${page}/${pages}, total ${total})`);

  return { data, pagination: { page, size, total, pages } };
}

/**
 * Create or update homework
 */
export async function createHomework({ cid, homework_content, due_date }) {
  const sqlDate = formatDatefromyyyymmddtopsqldate(due_date.toString());

  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  // Extract subject content from homework_content object
  const {
    chinese = null,
    maths = null,  // Note: receiving maths
    english = null,
    physics = null,
    chemistry = null,
    biology = null,
    history = null,
    geography = null,
    politics = null,
    others = null  // Note: receiving others
  } = homework_content;

  await db.query(`
        INSERT INTO homework (cid, chinese, math, english, physics, chemistry, biology, history, geography, politics, other, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (cid, due_date)
            DO UPDATE SET
                chinese = EXCLUDED.chinese,
                math = EXCLUDED.math,
                english = EXCLUDED.english,
                physics = EXCLUDED.physics,
                chemistry = EXCLUDED.chemistry,
                biology = EXCLUDED.biology,
                history = EXCLUDED.history,
                geography = EXCLUDED.geography,
                politics = EXCLUDED.politics,
                other = EXCLUDED.other
    `, [cid, chinese, maths, english, physics, chemistry, biology, history, geography, politics, others, sqlDate]);
  // Note: when storing, maths -> math, others -> other

  logger.info(`Homework for class ${cid} on ${sqlDate} created/updated successfully`);
  return { cid, due_date: sqlDate, homework_content };
}

/**
 * Delete homework
 */
export async function deleteHomework(cid, date) {
  // Check if class exists
  const classRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  const sqlDate = formatDatefromyyyymmddtopsqldate(date);
  const result = await db.query(
    'DELETE FROM homework WHERE cid = $1 AND due_date = $2 RETURNING *',
    [cid, sqlDate]
  );

  if (result.rowCount === 0) {
    throw HomeworkErrors.NOT_FOUND;
  }

  logger.info(`Homework for class ${cid} on ${sqlDate} deleted successfully`);
  return { cid, due_date: sqlDate };
}