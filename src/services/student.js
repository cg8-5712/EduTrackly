import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { StudentErrors, ParamsErrors, ClassErrors } from '../config/errorCodes.js';

/**
 * 添加学生
 * @param {number} cid 班级ID，必填
 * @param {string[]} students 学生名字数组
 */

export async function addStudents(cid, students) {
    if (!cid) {
        logger.error('addStudents: cid is required');
        throw ParamsErrors.REQUIRE_CID;
    }
    if (!Array.isArray(students) || students.length === 0) {
        throw ParamsErrors.REQUIRE_STUDENT_NAME;
    }

    const query = `
        INSERT INTO student (cid, student_name, attendance)
        VALUES ($1, $2, $3)
        RETURNING sid, cid, student_name, attendance
    `;

    const results = [];
    for (const stu of students) {
        if (!stu.student_name) {
            throw ParamsErrors.REQUIRE_STUDENT_NAME;
        }

        const attendance = stu.attendance === undefined ? true : stu.attendance;

        const res = await db.query(query, [cid, stu.student_name, attendance]);
        results.push(res.rows[0]);
    }
    return results;

}
