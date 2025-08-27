import * as studentService from '../services/student.js';
import logger from '../middleware/loggerMiddleware.js';
import { SystemErrors } from '../config/errorCodes.js';

export async function addStudentsController(req, res) {
    try {
        const { cid } = req.query;
        const students = req.body; // body 应为字符串数组

        const result = await studentService.addStudents({ cid, students });

        res.status(200).json(result);

    } catch (error) {
        logger.error('Error in addStudentsController:', error);

        let responseError = SystemErrors.INTERNAL;
        try {
            const parsed = JSON.parse(error.message);
            if (parsed && parsed.code) {
                responseError = parsed;
            }
        } catch (e) {
            // 保持 INTERNAL
        }

        res.status(400).json({
            ...responseError,
            timestamp: Date.now()
        });
    }
}
