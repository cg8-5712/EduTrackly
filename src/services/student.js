import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { StudentErrors, ParamsErrors, ClassErrors } from '../config/errorCodes.js';
import { formatDatefromsqldatetoyyyymmdd} from "../utils/dateUtils.js";
import * as pagination from "../utils/pagination.js";

/**
 * 添加学生
 * @param {Array} students 学生数组，每个学生对象包含 cid, student_name, attendance
 */

export async function addStudents(students) {
    if (!Array.isArray(students) || students.length === 0) {
        throw ParamsErrors.REQUIRE_STUDENTS_ARRAY;
    }

    const query = `
        INSERT INTO student (cid, student_name, attendance)
        VALUES ($1, $2, $3)
        RETURNING sid, cid, student_name, attendance
    `;

    const results = [];
    for (const stu of students) {
        if (!stu.cid) {
            logger.error('addStudents: cid is required for each student');
            throw ParamsErrors.REQUIRE_CID;
        }

        if (!stu.student_name) {
            throw ParamsErrors.REQUIRE_STUDENT_NAME;
        }

        const attendance = stu.attendance === undefined ? true : stu.attendance;

        const res = await db.query(query, [stu.cid, stu.student_name, attendance]);
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
        `SELECT cid, sid, student_name, attendance 
         FROM student 
         ${whereClause}
         ORDER BY sid ASC 
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, size, offset]
    );

    logger.debug(`listStudents: ${rowsResult.rows.length} rows returned`);

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
export async function putStudentEvents(events) {
    if (!Array.isArray(events) || events.length === 0) {
        throw ErrorCodes.ParamsErrors.REQUIRE_BODY;
    }

    const insertValues = [];
    const insertParams = [];
    const deleteSids = [];

    events.forEach((event, i) => {
        if (!event.sid) {
            throw ParamsErrors.REQUIRE_STUDENT_ID;
        }

        if (!event.event_type) {
            // 如果 event_type 为空，记录需要删除的 sid
            deleteSids.push(event.sid);
            return;
        }

        const allowed = ["official", "personal", "sick", "temp"];
        if (!allowed.includes(event.event_type)) {
            throw ParamsErrors.ILLEGAL_EVENT_TYPE;
        }

        insertParams.push(event.sid, event.event_type);
        const offset = insertParams.length - 1; // 每个 event 占两个参数
        insertValues.push(`($${offset}, CURRENT_DATE, $${offset + 1})`);
    });

    // 先删除指定 sid 的今日记录
    if (deleteSids.length > 0) {
        const deleteQuery = `
            DELETE FROM attendance
            WHERE event_date = CURRENT_DATE
              AND sid = ANY($1)
        `;
        await db.query(deleteQuery, [deleteSids]);
        logger.debug(`Deleted today's attendance for SIDs: ${deleteSids}`);
    }

    // 插入或更新
    if (insertValues.length > 0) {
        const insertQuery = `
            INSERT INTO attendance (sid, event_date, event_type)
            VALUES ${insertValues.join(", ")}
            ON CONFLICT (sid, event_date)
            DO UPDATE SET event_type = EXCLUDED.event_type
        `;
        logger.debug(`Inserting/updating attendance: ${insertQuery} with params ${insertParams}`);
        await db.query(insertQuery, insertParams);
    }

    return {
        code: 0,
        message: "Student events recorded successfully",
        timestamp: Date.now()
    };
}


/**
 * 删除学生
 * @param {number} sid 学生ID
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
