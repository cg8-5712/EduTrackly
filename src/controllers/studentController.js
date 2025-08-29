import * as studentService from '../services/student.js';
import logger from '../middleware/loggerMiddleware.js';
import { handleControllerError } from '../utils/controllerErrorHandler.js';
import * as ErrorCodes from "../config/errorCodes.js";

export async function addStudentsController(req, res) {
    const { cid } = req.query;
    const students = req.body;

    try {
        await studentService.addStudents(cid, students);

        return res.status(200).json({
            code: 0,
            message: 'Add students successfully',
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Failed to add students', {
            error: error.message,
            cid,
            studentsCount: students?.length,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

export async function getStudentController(req, res) {
    const { sid, student_name } = req.query;

    try {
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
        logger.error('Failed to get student', {
            error: error.message,
            sid,
            student_name,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

export async function getStudentlistController(req, res) {
    const { cid } = req.query;
    let { page, size } = req.body;

    try {
        const result = await studentService.listStudents({ cid, page, size });

        res.json({
            code: 0,
            message: "success",
            data: result.rows,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Failed to list students', {
            error: error.message,
            cid,
            page,
            size,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

/**
 * PUT /student/attendance-change
 * 更改出勤状态
 */
export async function attendanceChangeController(req, res) {
    const { sid, attendance } = req.query;

    try {
        if (!sid) {
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STUDENT_ID,
                timestamp: Date.now()
            })
        }

        if (!attendance) {
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STATUS,
                timestamp: Date.now()
            });
        }

        if (attendance !== "true" && attendance !== "false" && attendance !== true && attendance !== false) {
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
        logger.error('Failed to change attendance', {
            error: error.message,
            sid,
            attendance,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

/**
 * DELETE /student/delete
 * 删除学生
 */
export async function deleteStudentController(req, res) {
    const { sid } = req.query;

    try {
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
        logger.error('Failed to delete student', {
            error: error.message,
            sid,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}

export async function putStudentEventController(req, res) {
    const events = req.body;

    try {
        const result = await studentService.putStudentEvents(events);

        return res.status(200).json(result);
    } catch (error) {
        logger.error("Failed to put student events", {
            error: error.message,
            eventsCount: events?.length,
            stack: error.stack
        });

        handleControllerError(error, res);
    }
}
