import * as studentService from '../services/student.js';
import logger from '../middleware/loggerMiddleware.js';
import * as ErrorCodes from "../config/errorCodes.js";
import { handleControllerError } from '../middleware/error_handler.js';

/**
 * POST /students/add
 * 批量添加学生
 */
export async function addStudentsController(req, res) {
    try {
        const students = req.body;

        logger.debug('Received addStudents request', { studentCount: students?.length });

        if (!students || !Array.isArray(students)) {
            logger.warn('Invalid or missing students array in request body');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STUDENTS_ARRAY,
                timestamp: Date.now()
            });
        }

        await studentService.addStudents(students);
        logger.info('Students added successfully', { addedCount: students.length });

        return res.status(200).json({
            code: 0,
            message: 'Add students successfully',
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in addStudents controller', { error });

        if (error.code && error.message && typeof error.code === 'number') {
            logger.warn('Handled service error in addStudents', { code: error.code, message: error.message });
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        handleControllerError(error, res);
    }
}

/**
 * GET /student
 * 查询单个学生
 */
export async function getStudentController(req, res) {
    try {
        const { sid, student_name } = req.query;
        logger.debug('Received getStudent request', { sid, student_name });

        const student = await studentService.getStudent(
            sid ? parseInt(sid, 10) : undefined,
            student_name || undefined
        );

        logger.info('Student retrieved successfully', { sid, student_name });
        res.json({
            code: 0,
            message: "success",
            data: student,
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in getStudent controller', { error });

        if (error.code && error.message && typeof error.code === 'number') {
            logger.warn('Handled service error in getStudent', { code: error.code, message: error.message });
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        handleControllerError(error, res);
    }
}

/**
 * GET /students/list
 * 获取学生列表（分页）
 */
export async function getStudentlistController(req, res) {
    try {
        const { cid } = req.query;
        let { page, size } = req.body;

        logger.debug('Received listStudents request', { cid, page, size });
        const result = await studentService.listStudents({ cid, page, size });

        logger.info('Student list retrieved successfully', { cid, total: result?.pagination?.total });
        res.json({
            code: 0,
            message: "success",
            data: result.rows,
            pagination: result.pagination,
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in listStudents controller', { error });

        if (error.code && error.message && typeof error.code === 'number') {
            logger.warn('Handled service error in listStudents', { code: error.code, message: error.message });
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        handleControllerError(error, res);
    }
}

/**
 * PUT /student/attendance-change
 * 更改出勤状态
 */
export async function attendanceChangeController(req, res) {
    try {
        const { sid, attendance } = req.query;
        logger.debug('Received attendanceChange request', { sid, attendance });

        if (!sid) {
            logger.warn('Missing required parameter: student id');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STUDENT_ID,
                timestamp: Date.now()
            });
        }

        if (attendance === undefined) {
            logger.warn('Missing required parameter: attendance');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STATUS,
                timestamp: Date.now()
            });
        }

        if (attendance !== "true" && attendance !== "false" && attendance !== true && attendance !== false) {
            logger.warn('Invalid attendance value', { attendance });
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_VALID_ATTENDANCE,
                timestamp: Date.now()
            });
        }

        const attendanceBool = attendance === "true" || attendance === true;
        const success = await studentService.changeAttendance(sid, attendanceBool);

        if (!success) {
            logger.warn('Student not found for attendance change', { sid });
            return res.status(404).json({
                ...ErrorCodes.StudentErrors.NOT_FOUND,
                timestamp: Date.now()
            });
        }

        logger.info('Attendance changed successfully', { sid, attendance: attendanceBool });
        return res.json({
            code: 0,
            message: "Attendance status changed successfully",
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in attendanceChange controller', { error });

        if (error.code && error.message && typeof error.code === 'number') {
            logger.warn('Handled service error in attendanceChange', { code: error.code, message: error.message });
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        handleControllerError(error, res);
    }
}

/**
 * DELETE /student/delete
 * 删除学生
 */
export async function deleteStudentController(req, res) {
    try {
        const { sid } = req.query;
        logger.debug('Received deleteStudent request', { sid });

        if (!sid) {
            logger.warn('Missing required parameter: student id');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_STUDENT_ID,
                timestamp: Date.now()
            });
        }

        await studentService.deleteStudent(sid);
        logger.info('Student deleted successfully', { sid });

        return res.json({
            code: 0,
            message: "Student deleted successfully",
            timestamp: Date.now()
        });

    } catch (error) {
        logger. error('Error in deleteStudent controller', { error });

        if (error.code && typeof error.code === "number") {
            logger.warn('Handled service error in deleteStudent', { code: error.code, message: error.message });
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        handleControllerError(error, res);
    }
}

/**
 * PUT /student/events
 * 批量插入或更新学生事件
 */
export async function putStudentEventController(req, res) {
    try {
        const events = req.body;
        logger.debug('Received putStudentEvent request', { eventCount: events?.length });

        if (!events || !Array.isArray(events)) {
            logger.warn('Invalid or missing events array in request body');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_EVENTS_ARRAY,
                timestamp: Date.now()
            });
        }

        const result = await studentService.putStudentEvents(events);
        logger.info('Student events updated successfully', { count: events.length });

        return res.status(200).json(result);

    } catch (error) {
        logger.error("Error in putStudentEventController", { error });

        if (error.code === "23503" || error.code === "P0001") {
            logger.warn('Invalid event type for permanent absent student');
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.INVALID_EVENT_TYPE_FOR_PERMANENT_ABSENT_STUDENT,
                timestamp: Date.now()
            });
        }

        handleControllerError(error, res);
    }
}
