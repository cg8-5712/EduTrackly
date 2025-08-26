import * as classService from '../services/class.js';
import logger from "../middleware/loggerMiddleware.js";
import * as ErrorCodes from "../config/errorCodes.js";
import moment from 'moment';

export async function createClassController(req, res) {
    const { class_name } = req.query;

    const result = await classService.createClass(class_name);

    res.status(200).json({
        code: result.code,
        message: result.message,
        data: result.data,
        timestamp: Date.now()
    });
}