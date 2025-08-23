import * as homeworkService from '../services/homework.js';

export async function getHomework(req, res) {
    try {
        const { cid, date } = req.query;

        if (!cid) {
            return res.status(400).json({
                code: 400,
                message: "cid is required",
                timestamp: Date.now()
            });
        }

        const result = await homeworkService.getHomeworkByCidAndDate(cid, date);

        if (!result) {
            return res.status(404).json({
                code: 404,
                message: "No homework found",
                timestamp: Date.now()
            });
        }

        res.json({
            code: 0,
            message: "OK",
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message,
            timestamp: Date.now()
        });
    }
}
