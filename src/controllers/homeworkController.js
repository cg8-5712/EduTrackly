import * as homeworkService from '../services/homework.js';
import { HomeworkErrors, ParamsErrors, SystemErrors } from "../config/errorCodes.js";
import moment from 'moment';

export async function getHomework(req, res) {
    try {
        let { cid, date } = req.query;

        if (!cid) {
            return res.status(400).json({
                ...ParamsErrors.REQUIRE_CID,
                timestamp: Date.now()
            });
        }

        if (!date) {
            date = moment().format('YYYYMMDD');
        }

        const result = await homeworkService.getHomeworkByCidAndDate(cid, date);
        if (!result) {
            return res.status(404).json({
                ...HomeworkErrors.NOT_FOUND,
                timestamp: Date.now()
            });
        }

        res.json({
            code: 0,
            message: "Get homework successfully",
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            ...SystemErrors.INTERNAL,
            timestamp: Date.now()
        });
    }
}
