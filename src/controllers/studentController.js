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

/**
 * PUT /student/attendance-change
 * 更改出勤状态
 */
export async function attendanceChangeController(req, res) {
    try {
        const { sid, attendance } = req.query;

        if (!sid) {
            logger.error('Error in attendance change controller: student id is required');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STUDENT_ID,
                timestamp: Date.now()
            })
        }

        if (!attendance) {
            logger.error('Error in attendance change controller: attendance is required');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STATUS,
                timestamp: Date.now()
            });
        }

        if (attendance !== "true" && attendance !== "false" && attendance !== true && attendance !== false) {
            logger.error('Error in attendance change controller: attendance is required');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_VALID_ATTENDANCE,
                timestamp: Date.now()
            });
        }

        const attendanceBool = attendance === "true" || attendance === true;

        const success = await studentService.changeAttendance(sid, attendanceBool);

        if (!success) {
            return res.status(404).json({
                ...ErrorCodes.StudentErrors.NOT_FOUND,
                timestamp: Date.now()
            });
        }

        return res.json({
            code: 0,
            message: "Attendance status changed successfully",
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Error in change student attendance controller:', error);
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

/**
 * DELETE /student/delete
 * 删除学生
 */
export async function deleteStudentController(req, res) {
    try {
        const { sid } = req.query;

        if (!sid) {
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STUDENT_ID,
                timestamp: Date.now()
            });
        }

        await studentService.deleteStudent(sid);

        return res.json({
            code: 0,
            message: "学生删除成功",
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("❌ deleteStudent error:", error);

        if (error.code && typeof error.code === "number") {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        return res.status(500).json({
            code: 9001,
            message: "Internal server error",
            timestamp: Date.now()
        });
    }
}

export async function putStudentEventController(req, res) {
    try {
        const events = req.body;
        const result = await studentService.putStudentEvents(events);

        return res.status(200).json(result);
    } catch (error) {
        logger.error("Error in putStudentEventController:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.INVALID_EVENT_TYPE_FOR_PERMANENT_ABSENT_STUDENT,
                timestamp: Date.now()
            });
        }

        if (error.code && error.message) {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        return res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}
