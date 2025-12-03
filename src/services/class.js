import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { ClassErrors } from '../config/errorCodes.js';
import { formatDateFromSqlTimestampToTimestamp } from '../utils/dateUtils.js';

export async function createClass(className) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Insert class
    const classResult = await client.query(
      'INSERT INTO class (class_name) VALUES ($1) RETURNING cid, class_name, create_time',
      [className]
    );

    const newClass = classResult.rows[0];

    // Insert default setting for the new class
    await client.query(
      'INSERT INTO setting (cid, is_countdown_display, is_slogan_display) VALUES ($1, $2, $3)',
      [newClass.cid, true, true]
    );

    await client.query('COMMIT');

    logger.info(`Class created successfully with cid ${newClass.cid} and default settings`);

    return {
      code: 0,
      message: 'Create class successfully',
      data: newClass
    };

  } catch (err) {
    await client.query('ROLLBACK');

    // PostgreSQL unique constraint error: 23505
    if (err.code === '23505') {
      return {
        code: 4002, // Unique constraint conflict
        message: 'class_name already exists'
      };
    }

    logger.error('Error creating class:', err);
    return {
      code: 5001, // Unknown database error
      message: 'database error'
    };
  } finally {
    client.release();
  }
}

export async function getClass( param ) {
  let result;

  if (typeof param === 'number') {
    result = await db.query(
      'SELECT cid, class_name, create_time FROM class WHERE cid = $1',
      [param]
    );
  } else {
    result = await db.query(
      'SELECT cid, class_name, create_time FROM class WHERE class_name = $1',
      [param]
    );
  }

  if (result.rows.length === 0) {
    logger.warn(`No class found with the parameter: ${param}`);
    throw ClassErrors.NOT_FOUND; // Throw corresponding error object
  }

  const class_result = result.rows[0];
  class_result.create_time = formatDateFromSqlTimestampToTimestamp(class_result.create_time);

  return {
    code: 0,
    message: 'Get class information successfully',
    data: class_result
  };

}

// service 层
export async function listClass({ order = 'asc', page = 1, size = 20 }) {
  try {
    const offset = (page - 1) * size;
    const orderClause = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const query = `
      SELECT cid,
             class_name,
             create_time
      FROM class
      ORDER BY cid ${orderClause}
      LIMIT $1 OFFSET $2
    `;

    logger.debug('Executing listClass query:', query, [size, offset]);
    const result = await db.query(query, [size, offset]);

    const data = result.rows.map(r => ({
      ...r,
      create_time: formatDateFromSqlTimestampToTimestamp(r.create_time)
    }));

    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM class';
    const countRes = await db.query(countQuery);
    const total = parseInt(countRes.rows[0].count, 10);
    const pages = Math.ceil(total / size);

    logger.info(`Listed ${data.length} classes (page ${page}/${pages}, total ${total})`);

    return {
      data,
      pagination: {
        page,
        size,
        total,
        pages
      }
    };
  } catch (error) {
    logger.error('Failed to list class:', error.message);
    throw error;
  }
}

/**
 * Delete class and its students
 * @param {object} param { cid?: number, class_name?: string }
 */
export async function deleteClass(param) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    let classResult;
    if (param.cid) {
      classResult = await client.query(
        'DELETE FROM class WHERE cid = $1 RETURNING *',
        [param.cid]
      );
    } else if (param.class_name) {
      classResult = await client.query(
        'DELETE FROM class WHERE class_name = $1 RETURNING *',
        [param.class_name]
      );
    }

    if (!classResult || classResult.rowCount === 0) {
      await client.query('ROLLBACK');
      throw ClassErrors.NOT_FOUND;
    }

    // Delete students from this class
    const cidToDelete = classResult.rows[0].cid;
    await client.query(
      'DELETE FROM student WHERE cid = $1',
      [cidToDelete]
    );

    await client.query('COMMIT');
    logger.info(`Deleted class ${cidToDelete} and its students successfully`);

    return {
      code: 0,
      message: 'Class and its students deleted successfully',
      timestamp: Date.now()
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}