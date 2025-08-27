import db from "../utils/db/db_connector.js";
import logger from "../middleware/loggerMiddleware.js";
import { ClassErrors } from "../config/errorCodes.js";
import { formatDateFromSqlTimestampToTimestamp } from "../utils/dateUtils.js";

export async function createClass(className) {
    try {
        const result = await db.query(
            `INSERT INTO class (class_name) VALUES ($1) RETURNING cid, class_name, create_time`,
            [className]
        );

        return {
            code: 0,
            message: 'Create class successfully',
            data: result.rows[0]
        };

    } catch (err) {
        // PostgreSQL 唯一约束错误：23505
        if (err.code === '23505') {
            return {
                code: 4002, // 唯一约束冲突
                message: 'class_name already exists'
            };
        }

        return {
            code: 5001, // 未知数据库错误
            message: 'database error'
        };
    }
}

export async function getClass( param ) {
    let result;

    if (typeof param === 'number') {
        result = await db.query(
            `SELECT cid, class_name, create_time FROM class WHERE cid = $1`,
            [param]
        );
    } else {
        result = await db.query(
            `SELECT cid, class_name, create_time FROM class WHERE class_name = $1`,
            [param]
        );
    }

    if (result.rows.length === 0) {
        logger.warn(`No class found with the parameter: ${param}`);
        throw ClassErrors.NOT_FOUND; // 直接抛出对应错误对象
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

        // 获取总数
        const countQuery = `SELECT COUNT(*) FROM class`;
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

export async function deleteClass(param) {
    let result;

    if (param.cid) {
        result = await db.query(
            `DELETE FROM classes WHERE cid = $1 RETURNING *`,
            [param.cid]
        );
    } else if (param.class_name) {
        result = await db.query(
            `DELETE FROM classes WHERE class_name = $1 RETURNING *`,
            [param.class_name]
        );
    }

    if (!result || result.rowCount === 0) {
        throw ClassErrors.NOT_FOUND;
    }

    return {
        code: 0,
        message: "Class deleted successfully",
        timestamp: Date.now()
    };
}
