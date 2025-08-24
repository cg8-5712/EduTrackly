import { HomeworkErrors } from "../config/errorCodes.js";
import db from '../utils/db/db_connector.js';
import logger from "../middleware/loggerMiddleware.js";
import { formatDatefromyyyymmddtopsqldate, formatDatefromsqldatetoyyyymmdd } from "../utils/dateUtils.js";

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
