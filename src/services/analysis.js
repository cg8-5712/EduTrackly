import db from '../utils/db/db_connector.js';
import logger from "../middleware/loggerMiddleware.js";
import {ClassErrors} from "../config/errorCodes.js";

export async function getTodayAnalysis(cid, date) {

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
                     SELECT COUNT(*)::int AS expected_attend
                     FROM student s
                     WHERE s.cid = $1
                 ),
                 event_counts AS (
                     SELECT
                         COUNT(*) FILTER (WHERE a.event_type = 'official')::int AS official_cnt,
                         COUNT(*) FILTER (WHERE a.event_type = 'personal')::int AS personal_cnt,
                         COUNT(*) FILTER (WHERE a.event_type = 'sick')::int AS sick_cnt,
                         COUNT(*) FILTER (WHERE a.event_type = 'temp')::int AS temp_cnt
                     FROM attendance a
                              JOIN student s ON a.sid = s.sid
                     WHERE s.cid = $1
                       AND a.event_date = $2
                 ),
                 events AS (
                     SELECT s.student_name, a.event_type
                     FROM student s
                              JOIN attendance a ON s.sid = a.sid
                     WHERE s.cid = $1
                       AND a.event_date = $2
                 )
            SELECT
                ci.cid,
                ci.class_name,
                e.expected_attend,
                GREATEST(
                        e.expected_attend
                            - (ec.official_cnt + ec.personal_cnt + ec.sick_cnt)
                            + ec.temp_cnt,
                        0
                ) AS actual_attend,
                ec.official_cnt,
                ec.personal_cnt,
                ec.sick_cnt,
                ec.temp_cnt,
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
                     CROSS JOIN event_counts ec
                     LEFT JOIN events ev ON true
            GROUP BY ci.cid, ci.class_name, e.expected_attend, ec.official_cnt, ec.personal_cnt, ec.sick_cnt, ec.temp_cnt;
        `,
        [cid, date]
    );

    return {
        code: 0,
        message: 'Get today analysis successfully',
        data: result.rows[0],
        timestamp: Date.now(),
    };
}
