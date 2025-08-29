import db from '../utils/db/db_connector.js';
import logger from "../middleware/loggerMiddleware.js";
import {ClassErrors} from "../config/errorCodes.js";

export async function getTodayAnalysis(cid) {

    const studentRes = await db.query(`SELECT 1 FROM class WHERE cid = $1 LIMIT 1`, [cid]);
    if (studentRes.rows.length === 0) {
        logger.warn(`CID ${cid} does not exist in class table`);
        throw ClassErrors.NOT_FOUND; // 直接抛出对应错误对象
    }

    const result = await db.query(
        `
            WITH class_info AS (
                SELECT c.cid, c.class_name
                FROM class c
                WHERE c.cid = $1
            ),
                 expected AS (
                     SELECT COUNT(*) AS expected_attend
                     FROM student s
                     WHERE s.cid = $1
                 ),
                 actual AS (
                     SELECT COUNT(DISTINCT a.sid) AS actual_attend
                     FROM attendance a
                              JOIN student s ON a.sid = s.sid
                     WHERE s.cid = $1
                       AND a.event_date = CURRENT_DATE
                 ),
                 events AS (
                     SELECT s.student_name, a.event_type
                     FROM student s
                              JOIN attendance a ON s.sid = a.sid
                     WHERE s.cid = $1
                       AND a.event_date = CURRENT_DATE
                 )
            SELECT ci.cid,
                   ci.class_name,
                   e.expected_attend,
                   COALESCE(a.actual_attend, 0) AS actual_attend,
                   COALESCE(
                           JSON_AGG(
                                   JSON_BUILD_OBJECT(
                                           'student_name', ev.student_name,
                                           'event_type', ev.event_type
                                   )
                           ) FILTER (WHERE ev.student_name IS NOT NULL),
                           '[]'
                   ) AS event_list
            FROM class_info ci
                     CROSS JOIN expected e
                     CROSS JOIN actual a
                     LEFT JOIN events ev ON true
            GROUP BY ci.cid, ci.class_name, e.expected_attend, a.actual_attend;
        `,
        [cid]
    );

    return {
        code: 0,
        message: 'Get today analysis successfully',
        data: result.rows[0],
        timestamp: Date.now(),
    };
}
