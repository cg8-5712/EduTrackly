import db from "../utils/db/db_connector.js";
import logger from "../middleware/loggerMiddleware.js";

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