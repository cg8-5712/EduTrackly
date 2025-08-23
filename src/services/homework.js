// services/homeworkService.js
import db from '../utils/db/db_connector.js';

export async function getHomeworkByCidAndDate(cid, date) {
    try {
        // 先查作业
        const homeworkQuery = `
            SELECT cid, description AS homework_content, due_date
            FROM homework
            WHERE cid = $1 AND due_date = $2
            LIMIT 1
        `;
        const homeworkRes = await db.query(homeworkQuery, [cid, date]);

        if (homeworkRes.rows.length === 0) {
            return null;
        }

        const homework = homeworkRes.rows[0];

        // 再查班级名
        const classQuery = `SELECT class_name FROM class WHERE cid = $1 LIMIT 1`;
        const classRes = await db.query(classQuery, [cid]);

        homework.class_name = classRes.rows.length > 0 ? classRes.rows[0].class_name : null;

        return homework;
    } catch (error) {
        throw error;
    }
}
