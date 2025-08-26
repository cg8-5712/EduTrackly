import * as classService from '../services/class.js';
import logger from "../middleware/loggerMiddleware.js";
import * as ErrorCodes from "../config/errorCodes.js";
import moment from 'moment';
import * as homeworkService from "../services/homework.js";

export async function createClassController(req, res) {
    const { class_name } = req.query;

    if (!class_name) {
        logger.error("createClassController class_name is empty");
        return res.status(400).json({
            ...ErrorCodes.ParamsErrors.REQUIRE_CLASS_NAME,
            timestamp: Date.now()
        })
    }

    const result = await classService.createClass(class_name);

    res.status(200).json({
        code: result.code,
        message: result.message,
        data: result.data,
        timestamp: Date.now()
    });
}
export async function getClassController(req, res) {
    try {
        const { cid, class_name } = req.query;

        logger.info(`getClassController input cid=${cid}, class_name=${class_name}`);

        // 参数检查
        if (!cid && !class_name) {
            logger.error("getClassController param is empty");
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.REQUIRE_CLASS_NAME_OR_ID,
                timestamp: Date.now()
            });
        }

        if (cid && class_name) {
            logger.error("getClassController param is both cid and class_name");
            return res.status(400).json({
                ...ErrorCodes.ParamsErrors.TOO_MUCH_PARAMS,
                timestamp: Date.now()
            });
        }

        // 只有一个参数时，直接作为查询参数传给 service
        const param = parseInt(cid) || class_name;
        logger.info(`getClassController param used: ${typeof param}`);

        const result = await classService.getClass(param);

        return res.status(200).json({
            code: result.code,
            message: result.message,
            data: result.data,
            timestamp: Date.now()
        });

    } catch (error) {
        logger.error('Error in getClass controller:', error);

        // 如果 error 是我们自定义的错误格式
        if (error.code && error.message && typeof error.code === 'number') {
            return res.status(400).json({
                ...error,
                timestamp: Date.now()
            });
        }

        // 未知错误 → 9001
        return res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}

// controller 层
export async function listClass(req, res) {
    try {
        const { order = 'asc' } = req.query;  // 排序方式从 query 取，默认升序
        const { page = 1, size = 20 } = req.body; // 分页信息从 body 取

        const result = await classService.listClass({ order, page, size });

        logger.info(`Get class list successfully, order=${order}, page=${page}, size=${size}`);
        logger.debug(`Class list: ${JSON.stringify(result.data)}`);
        logger.debug(`Pagination: ${JSON.stringify(result.pagination)}`);

        res.json({
            code: 0,
            message: 'Class list fetched successfully',
            data: result.data,
            pagination: result.pagination,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Failed to list class:', error);
        res.status(500).json({
            ...ErrorCodes.SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}
