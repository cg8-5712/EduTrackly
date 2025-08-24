import { HomeworkErrors } from "../config/errorCodes.js";
import db from '../utils/db/db_connector.js';
import logger from "../middleware/loggerMiddleware.js";
import { formatDatefromyyyymmddtopsqldate, formatDatefromsqldatetoyyyymmdd } from "../utils/dateUtils.js";
import { getPagination, getPagingData } from "../utils/pagination.js";

export async function getHomeworkByCidAndDate(cid, date) {
    // format date to yyyy-mm-dd
    date = formatDatefromyyyymmddtopsqldate(date);
    logger.debug(`Getting homework for class ${cid} on ${date}`);

    // 查询作业
    const homeworkQuery = `
        SELECT cid, description AS homework_content, due_date
        FROM homework
        WHERE cid = $1 AND due_date = $2
        LIMIT 1
    `;
    const homeworkRes = await db.query(homeworkQuery, [cid, date]);

    if (homeworkRes.rows.length === 0) {
        throw new Error(JSON.stringify(HomeworkErrors.NOT_FOUND));
    }

    const homework = homeworkRes.rows[0];
    homework.due_date = formatDatefromsqldatetoyyyymmdd(homework.due_date);

    // 查询班级名称
    const classQuery = `SELECT class_name FROM class WHERE cid = $1 LIMIT 1`;
    const classRes = await db.query(classQuery, [cid]);
    homework.class_name = classRes.rows.length > 0 ? classRes.rows[0].class_name : null;

    logger.info(`Homework found: ${JSON.stringify(homework)}`);
    logger.debug(`Class_id: ${cid}, Date: ${date}, Homework found: ${JSON.stringify(homework)}`);
    return homework;
}

/**
 * 获取作业列表，支持分页和筛选
 * @param {Object} options
 * @param {number} options.cid - 班级ID，可选
 * @param {string} options.startDate - 起始日期 YYYYMMDD，可选
 * @param {string} options.endDate - 结束日期 YYYYMMDD，可选
 * @param {number} options.page - 页码，从1开始
 * @param {number} options.size - 每页数量
 * @param {string} options.order - 排序 desc 或 incs
 */
export async function listHomeworks({ cid, startDate, endDate, page = 1, size = 20, order = 'desc' }) {
    try {
        const conditions = [];
        const params = [];

        // 处理筛选条件
        if (cid) {
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

        // 计算分页
        const offset = (page - 1) * size;
        params.push(size, offset);

        const orderClause = order === 'incs' ? 'ASC' : 'DESC';

        const query = `
            SELECT h.cid,
                   c.class_name,
                   h.description AS homework_content,
                   h.due_date
            FROM homework h
            LEFT JOIN class c ON h.cid = c.cid
            ${whereClause}
            ORDER BY h.due_date ${orderClause}
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        logger.debug('Executing listHomeworks query:', query, params);
        const result = await db.query(query, params);

        // 转换日期格式
        const data = result.rows.map(r => ({
            ...r,
            due_date: formatDatefromsqldatetoyyyymmdd(r.due_date)
        }));

        // 获取总数
        const countQuery = `SELECT COUNT(*) FROM homework h ${whereClause}`;
        const countRes = await db.query(countQuery, params.slice(0, params.length - 2));
        const total = parseInt(countRes.rows[0].count, 10);
        const pages = Math.ceil(total / size);
        logger.info(`Listed ${data.length} homeworks (page ${page}/${pages}, total ${total})`);

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
        logger.error('Failed to list homeworks:', error.message);
        throw error;
    }
}