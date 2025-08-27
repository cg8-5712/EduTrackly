import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import { StudentErrors, ParamsErrors } from '../config/errorCodes.js';

/**
 * 添加学生
 * @param {number} cid 班级ID，必填
 * @param {string[]} students 学生名字数组
 */
export async function addStudents({ cid, students }) {
    if (!cid) {
        logger.error('CID is required to add students');
        throw new Error(JSON.stringify(ParamsErrors.REQUIRE_CID));
    }

    if (!students || !Array.isArray(students) || students.length === 0) {
        logger.warn('No students provided to add');
        return {
            code: 0,
            message: 'No students to add',
            timestamp: Date.now()
        };
    }

    try {
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

    } catch (error) {
        logger.error('Failed to add students:', error.message || error);
        throw new Error(JSON.stringify(StudentErrors.CREATE_FAILED));
    }
}
