import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { StudentErrors, ParamsErrors, ClassErrors } from '../config/errorCodes.js';
import { formatDatefromsqldatetoyyyymmdd} from "../utils/dateUtils.js";
import * as pagination from "../utils/pagination.js";

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

/**
 * 获取学生信息
 * @param {number} sid 学生ID，可选
 * @param {string} student_name 学生名字，可选
 * @returns {Promise<object>} 学生及其事件
 */
export async function getStudent(sid, student_name) {
    if (!sid && !student_name) {
        logger.error("getStudent: sid or student_name required");
        throw ParamsErrors.REQUIRE_STUDENT_NAME_OR_ID;
    }

    let studentQuery = `
        SELECT sid, cid, student_name, attendance
        FROM student
        WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (sid) {
        studentQuery += ` AND sid = $${idx++}`;
        params.push(sid);
    }
    if (student_name) {
        studentQuery += ` AND student_name = $${idx++}`;
        params.push(student_name);
    }

    const studentRes = await db.query(studentQuery, params);
    if (studentRes.rowCount === 0) {
        throw StudentErrors.NOT_FOUND;
    }

    const student = studentRes.rows[0];

    // 查询该学生的事件
    const eventQuery = `
        SELECT event_date, event_type
        FROM attendance
        WHERE sid = $1
        ORDER BY event_date DESC
    `;
    const eventRes = await db.query(eventQuery, [student.sid]);

    // 格式化日期
    const events = (eventRes.rows || []).map(ev => ({
        ...ev,
        event_date: formatDatefromsqldatetoyyyymmdd(ev.event_date)
    }));

    return {
        ...student,
        event: events
    };
}

export async function listStudents({ cid, page, size }) {
    const { offset } = pagination.getPagination(page, size);

    let whereClause = "";
    const params = [];

    if (cid) {
        whereClause = "WHERE cid = $1";
        params.push(cid);
    }

    // 查询总数
    const totalResult = await db.query(
        `SELECT COUNT(*) AS count FROM student ${whereClause}`,
        params
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    // 查询分页数据
    const rowsResult = await db.query(
        `SELECT cid, student_name, attendance 
         FROM student 
         ${whereClause}
         ORDER BY sid ASC 
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, size, offset]
    );

    return pagination.getPagingData(rowsResult.rows, total, parseInt(page), parseInt(size));
}

/**
 * 更改学生出勤状态
 * @param {number} sid 学生ID
 * @param {boolean} attendance 出勤状态
 * @returns {Promise<boolean>} 是否成功
 */
export async function changeAttendance(sid, attendance) {
    const result = await db.query(
        `UPDATE student 
         SET attendance = $1 
         WHERE sid = $2 
         RETURNING sid`,
        [attendance, sid]
    );
    return result.rowCount > 0;
}

/**
 * 删除学生
 * @param {number} sid 学生ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteStudent(sid) {
    const result = await db.query(
        `DELETE FROM student WHERE sid = $1 RETURNING sid`,
        [sid]
    );

    if (result.rowCount === 0) {
        throw StudentErrors.NOT_FOUND; // 学生不存在
    }

    return true;
}