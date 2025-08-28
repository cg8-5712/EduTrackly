import * as studentService from '../services/student.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from "../config/errorCodes.js";

export async function addStudentsController(req, res) {
    try {
        const { cid } = req.query;
        const students = req.body;

        await studentService.addStudents(cid, students);

        return res.status(200).json({
            code: 0,
            message: 'Add students successfully',
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in add students controller:', error);
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误，统一返回 9001
        res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}

export async function getStudentController(req, res) {
    try {
        const { sid, student_name } = req.query;

        const student = await studentService.getStudent(
            sid ? parseInt(sid, 10) : undefined,
            student_name || undefined
        );

        res.json({
            code: 0,
            message: "success",
            data: student,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Error in get students controller:', error);
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误，统一返回 9001
        res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}

export async function getStudentlistController(req, res) {
    try {
        const { cid } = req.query;
        let { page, size } = req.body;
        const result = await studentService.listStudents({ cid, page, size });

        res.json({
            code: 0,
            message: "success",
            data: result.rows,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Error in list students controller:', error);
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误，统一返回 9001
        res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}