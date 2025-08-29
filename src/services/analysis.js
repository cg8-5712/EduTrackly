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

export async function getClassAnalysis(cid) {
    const sql = `
    WITH class_info AS (
      SELECT c.cid, c.class_name
      FROM class c
      WHERE c.cid = $1
    ),
    student_info AS (
      SELECT s.sid, s.student_name, s.cid, s.attendance
      FROM student s
      WHERE s.cid = $1
    ),
    -- 今天的考勤
    today_attendance AS (
      SELECT a.sid, a.event_type
      FROM attendance a
      WHERE a.event_date = CURRENT_DATE
    ),
    -- 今日正常到课学生（在 student.attendance = true 且今天没有请假记录）
    today_attend AS (
      SELECT s.sid, s.student_name
      FROM student_info s
      WHERE s.attendance = true
        AND NOT EXISTS (
          SELECT 1 FROM today_attendance t
          WHERE t.sid = s.sid
            AND t.event_type IN ('official','personal','sick')
        )
    ),
    -- 今日缺席学生（有 official/personal/sick 记录）
    today_absent AS (
      SELECT s.sid, s.student_name, t.event_type
      FROM student_info s
      JOIN today_attendance t ON s.sid = t.sid
      WHERE t.event_type IN ('official','personal','sick')
    ),
    -- 今日临时到课学生（temp）
    today_temp AS (
      SELECT s.sid, s.student_name
      FROM student_info s
      JOIN today_attendance t ON s.sid = t.sid
      WHERE t.event_type = 'temp'
    )
    SELECT 
      ci.cid,
      ci.class_name,
      -- 班级总人数
      (SELECT COUNT(*)::int FROM student_info) AS student_num,
      -- 应到人数：student.attendance = true
      (SELECT COUNT(*)::int FROM student_info WHERE attendance = true) AS expected_attend,
      -- 所有登记出勤的学生（含 attendance=true）
      (SELECT COALESCE(json_agg(json_build_object('sid', sid, 'student_name', student_name)), '[]')
       FROM student_info WHERE attendance = true) AS attend_student,
      -- 所有登记不出勤的学生（attendance=false）
      (SELECT COALESCE(json_agg(json_build_object('sid', sid, 'student_name', student_name)), '[]')
       FROM student_info WHERE attendance = false) AS absent_student,
      -- 今日实际到课
      (SELECT COALESCE(json_agg(json_build_object('sid', sid, 'student_name', student_name)), '[]')
       FROM today_attend) AS today_attend,
      -- 今日缺席
      (SELECT COALESCE(json_agg(json_build_object('sid', sid, 'student_name', student_name, 'event_type', event_type)), '[]')
       FROM today_absent) AS today_absent,
      -- 今日临时
      (SELECT COALESCE(json_agg(json_build_object('sid', sid, 'student_name', student_name)), '[]')
       FROM today_temp) AS today_temp
    FROM class_info ci
  `;

    const result = await db.query(sql, [cid]);
    return result.rows[0];
}
