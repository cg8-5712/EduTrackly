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