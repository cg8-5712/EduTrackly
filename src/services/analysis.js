import db from '../utils/db/db_connector.js';
import logger from "../middleware/loggerMiddleware.js";
import {ClassErrors} from "../config/errorCodes.js";
import { formatDatefromsqldatetoyyyymmdd, formatDatefromyyyymmddtopsqldate} from "../utils/dateUtils.js";

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
                       AND s.attendance = true
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

export async function getClassAnalysis(cid, startDate, endDate) {

    const studentRes = await db.query(`SELECT 1 FROM class WHERE cid = $1 LIMIT 1`, [cid]);
    if (studentRes.rows.length === 0) {
        logger.warn(`CID ${cid} does not exist in class table`);
        throw ClassErrors.NOT_FOUND; // 直接抛出对应错误对象
    }

    // 日期规则处理
    let actualStartDate = startDate;
    let actualEndDate = endDate;

    // 如果只传入 endDate，则无效，忽略
    if (!startDate && endDate) {
        actualStartDate = null;
        actualEndDate = null;
    }

    // 如果没有传入任何日期，默认使用近15天
    if (!actualStartDate && !actualEndDate) {
        actualEndDate = formatDatefromyyyymmddtopsqldate(
            new Date().toISOString().split('T')[0].replace(/-/g, '')
        );
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        actualStartDate = formatDatefromyyyymmddtopsqldate(
            fifteenDaysAgo.toISOString().split('T')[0].replace(/-/g, '')
        );
    }

    // 如果只传入 startDate，endDate 默认为当前日期
    if (actualStartDate && !actualEndDate) {
        actualEndDate = formatDatefromyyyymmddtopsqldate(
            new Date().toISOString().split('T')[0].replace(/-/g, '')
        );
    }

    const params = [cid];
    let dateRangeQuery = '';

    if (actualStartDate && actualEndDate) {
        params.push(actualStartDate, actualEndDate);
        dateRangeQuery = `
        date_range AS (
          SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS event_date
        ),`;
    } else {
        dateRangeQuery = `
        date_range AS (
          SELECT NULL::date AS event_date WHERE false
        ),`;
    }

    const sql = `
    WITH class_info AS (
      SELECT c.cid, c.class_name
      FROM class c
      WHERE c.cid = $1
    ),
    student_info AS (
      SELECT COUNT(*)::int AS student_num,
             COUNT(*) FILTER (WHERE attendance = true)::int AS expected_attend
      FROM student s
      WHERE s.cid = $1
    ),
    ${dateRangeQuery}
    -- 计算每天的出勤情况
    daily_attendance AS (
      SELECT
        a.event_date,
        COUNT(*) FILTER (WHERE a.event_type IN ('official', 'personal', 'sick'))::int AS absent_cnt,
        COUNT(*) FILTER (WHERE a.event_type = 'temp')::int AS temp_cnt
      FROM attendance a
      JOIN student s ON a.sid = s.sid
      WHERE s.cid = $1
      GROUP BY a.event_date
    )
    SELECT
      ci.cid,
      ci.class_name,
      si.expected_attend,
      si.student_num,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'date', dr.event_date,
            'attendance_rate', ROUND(
              (CASE
                WHEN si.expected_attend > 0
                THEN ((si.expected_attend - COALESCE(da.absent_cnt, 0) + COALESCE(da.temp_cnt, 0))::float / si.expected_attend * 100)
                ELSE 0
              END)::numeric,
              2
            )
          )
          ORDER BY dr.event_date
        ) FILTER (WHERE dr.event_date IS NOT NULL),
        '[]'
      ) AS daily_attendance_rates
    FROM class_info ci
    CROSS JOIN student_info si
    CROSS JOIN date_range dr
    LEFT JOIN daily_attendance da ON dr.event_date = da.event_date
    GROUP BY ci.cid, ci.class_name, si.expected_attend, si.student_num
  `;

    const result = await db.query(sql, params);
    const row = result.rows[0];

    // 格式化日期为 YYYYMMDD
    if (row.daily_attendance_rates && row.daily_attendance_rates.length > 0) {
        row.daily_attendance_rates = row.daily_attendance_rates.map(item => ({
            date: formatDatefromsqldatetoyyyymmdd(item.date),
            attendance_rate: parseFloat(item.attendance_rate)
        }));
    }

    return row;
}

/**
 * 获取学生信息及事件统计
 * @param {number} sid 学生ID，必选
 * @param {string|number} startDate 起始日期 YYYYMMDD，可选
 * @param {string|number} endDate 截止日期 YYYYMMDD，可选
 * 规则：
 * - 只传入 endDate 无效，将被忽略
 * - 只传入 startDate，数据从 startDate 到当前日期
 * - 两者都传入，使用指定范围
 */
export async function getStudentsAnalysis({ sid, startDate, endDate }) {
    // sid 为必选参数
    if (sid === undefined || sid === null || sid === "") {
        logger.warn('SID is required but not provided');
        throw ClassErrors.NOT_FOUND;
    }

    // 检查学生是否存在
    const studentRes = await db.query(`SELECT 1 FROM student WHERE sid = $1 LIMIT 1`, [sid]);
    if (studentRes.rows.length === 0) {
        logger.warn(`SID ${sid} does not exist`);
        throw ClassErrors.NOT_FOUND;
    }

    const params = [parseInt(sid, 10)];
    let idx = 2;

    let whereClause = "WHERE s.sid = $1";

    // 应用日期规则
    let actualStartDate = startDate;
    let actualEndDate = endDate;

    // 如果只传入 endDate，则无效，忽略
    if (!startDate && endDate) {
        actualStartDate = null;
        actualEndDate = null;
    }

    // 如果只传入 startDate，endDate 默认为当前日期
    if (actualStartDate && !actualEndDate) {
        actualEndDate = formatDatefromyyyymmddtopsqldate(
            new Date().toISOString().split('T')[0].replace(/-/g, '')
        );
    }

    if (actualStartDate !== undefined && actualStartDate !== null && actualStartDate !== "") {
        whereClause += ` AND a.event_date >= $${idx++}`;
        params.push(actualStartDate);
    }

    if (actualEndDate !== undefined && actualEndDate !== null && actualEndDate !== "") {
        whereClause += ` AND a.event_date <= $${idx++}`;
        params.push(actualEndDate);
    }

    const query = `
        SELECT
            s.sid,
            s.student_name,
            s.attendance,
            COALESCE(SUM(CASE WHEN a.event_type = 'official' THEN 1 ELSE 0 END),0) AS official_cnt,
            COALESCE(SUM(CASE WHEN a.event_type = 'personal' THEN 1 ELSE 0 END),0) AS personal_cnt,
            COALESCE(SUM(CASE WHEN a.event_type = 'sick' THEN 1 ELSE 0 END),0) AS sick_cnt,
            COALESCE(SUM(CASE WHEN a.event_type = 'temp' THEN 1 ELSE 0 END),0) AS temp_cnt,
            COALESCE(JSON_AGG(CASE WHEN a.event_type = 'official' THEN a.event_date ELSE NULL END) FILTER (WHERE a.event_type = 'official'), '[]') AS official_list,
            COALESCE(JSON_AGG(CASE WHEN a.event_type = 'personal' THEN a.event_date ELSE NULL END) FILTER (WHERE a.event_type = 'personal'), '[]') AS personal_list,
            COALESCE(JSON_AGG(CASE WHEN a.event_type = 'sick' THEN a.event_date ELSE NULL END) FILTER (WHERE a.event_type = 'sick'), '[]') AS sick_list,
            COALESCE(JSON_AGG(CASE WHEN a.event_type = 'temp' THEN a.event_date ELSE NULL END) FILTER (WHERE a.event_type = 'temp'), '[]') AS temp_list
        FROM student s
                 LEFT JOIN attendance a ON s.sid = a.sid
            ${whereClause}
        GROUP BY s.sid, s.student_name, s.attendance
        ORDER BY s.sid ASC
    `;

    const result = await db.query(query, params);

    return result.rows.map(r => ({
        sid: r.sid,
        student_name: r.student_name,
        attendance: r.attendance,
        event_time: {
            official_cnt: parseInt(r.official_cnt, 10),
            personal_cnt: parseInt(r.personal_cnt, 10),
            sick_cnt: parseInt(r.sick_cnt, 10),
            temp_cnt: parseInt(r.temp_cnt, 10)
        },
        event_list: {
            official_list: r.official_list.map(d => formatDatefromsqldatetoyyyymmdd(d)),
            personal_list: r.personal_list.map(d => formatDatefromsqldatetoyyyymmdd(d)),
            sick_list: r.sick_list.map(d => formatDatefromsqldatetoyyyymmdd(d)),
            temp_list: r.temp_list.map(d => formatDatefromsqldatetoyyyymmdd(d))
        }
    }));
}