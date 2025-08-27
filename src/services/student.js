import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { StudentErrors, ParamsErrors, ClassErrors } from '../config/errorCodes.js';

/**
 * 添加学生
 * @param {number} cid 班级ID，必填
 * @param {string[]} students 学生名字数组
 */
export async function addStudents({ cid, students }) {
    if (!cid) {
        logger.error('CID is required to add students');
        throw ParamsErrors.REQUIRE_CID;
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
        logger.warn('No students provided to add');
        return {
            code: 0,
            message: 'No students to add',
            timestamp: Date.now()
        };
    }

    // 检查 cid 是否存在
    const studentRes = await db.query(`SELECT 1 FROM class WHERE cid = $1 LIMIT 1`, [cid]);
    if (studentRes.rows.length === 0) {
        logger.warn(`CID ${cid} does not exist in class table`);
        throw ClassErrors.NOT_FOUND; // 直接抛出对应错误对象
    }


    const queryText = `INSERT INTO student (cid, student_name) VALUES ($1, $2)`;
    for (const name of students) {
        await db.query(queryText, [cid, name]);
        logger.info(`Added student "${name}" to class ${cid}`);
    }

    return {
        code: 0,
        message: 'Students added successfully',
        timestamp: Date.now()
    };


}
