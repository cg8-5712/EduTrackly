import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';
import {ClassErrors} from '../config/errorCodes.js';
import { formatDatefromsqldatetoyyyymmdd, formatDatefromyyyymmddtopsqldate} from '../utils/dateUtils.js';
import ExcelJS from 'exceljs';

export async function getTodayAnalysis(cid, date) {

  const studentRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (studentRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist in class table`);
    throw ClassErrors.NOT_FOUND; // Throw corresponding error object
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

  const studentRes = await db.query('SELECT 1 FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (studentRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist in class table`);
    throw ClassErrors.NOT_FOUND; // Throw corresponding error object
  }

  // Date rule handling
  let actualStartDate = startDate;
  let actualEndDate = endDate;

  // If only endDate is provided, it's invalid and will be ignored
  if (!startDate && endDate) {
    actualStartDate = null;
    actualEndDate = null;
  }

  // If no dates are provided, default to the last 15 days
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

  // If only startDate is provided, endDate defaults to current date
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
    -- Today's attendance
    today_attendance AS (
      SELECT
        COUNT(*) FILTER (WHERE a.event_type IN ('official', 'personal', 'sick'))::int AS today_absent_cnt,
        COUNT(*) FILTER (WHERE a.event_type = 'temp')::int AS today_temp_cnt
      FROM attendance a
      JOIN student s ON a.sid = s.sid
      WHERE s.cid = $1
        AND a.event_date = CURRENT_DATE
    ),
    ${dateRangeQuery}
    -- Calculate daily attendance
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
      (si.expected_attend - ta.today_absent_cnt + ta.today_temp_cnt)::int AS today_actual_attend,
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
    CROSS JOIN today_attendance ta
    CROSS JOIN date_range dr
    LEFT JOIN daily_attendance da ON dr.event_date = da.event_date
    GROUP BY ci.cid, ci.class_name, si.expected_attend, si.student_num, ta.today_absent_cnt, ta.today_temp_cnt
  `;

  const result = await db.query(sql, params);
  const row = result.rows[0];

  // Format date as YYYYMMDD
  if (row.daily_attendance_rates && row.daily_attendance_rates.length > 0) {
    row.daily_attendance_rates = row.daily_attendance_rates.map(item => ({
      date: formatDatefromsqldatetoyyyymmdd(item.date),
      attendance_rate: parseFloat(item.attendance_rate)
    }));
  }

  return row;
}

/**
 * Get student information and event statistics
 * @param {number} sid Student ID, required
 * @param {string|number} startDate Start date YYYYMMDD, optional
 * @param {string|number} endDate End date YYYYMMDD, optional
 * Rules:
 * - Only providing endDate is invalid and will be ignored
 * - Only providing startDate, data is from startDate to current date
 * - Both provided, use the specified range
 */
export async function getStudentsAnalysis({ sid, startDate, endDate }) {
  // sid is a required parameter
  if (sid === undefined || sid === null || sid === '') {
    logger.warn('SID is required but not provided');
    throw ClassErrors.NOT_FOUND;
  }

  // Check if student exists
  const studentRes = await db.query('SELECT 1 FROM student WHERE sid = $1 LIMIT 1', [sid]);
  if (studentRes.rows.length === 0) {
    logger.warn(`SID ${sid} does not exist`);
    throw ClassErrors.NOT_FOUND;
  }

  const params = [parseInt(sid, 10)];
  let idx = 2;

  let whereClause = 'WHERE s.sid = $1';

  // Apply date rules
  let actualStartDate = startDate;
  let actualEndDate = endDate;

  // If only endDate is provided, it's invalid and will be ignored
  if (!startDate && endDate) {
    actualStartDate = null;
    actualEndDate = null;
  }

  // If only startDate is provided, endDate defaults to current date
  if (actualStartDate && !actualEndDate) {
    actualEndDate = formatDatefromyyyymmddtopsqldate(
      new Date().toISOString().split('T')[0].replace(/-/g, '')
    );
  }

  if (actualStartDate !== undefined && actualStartDate !== null && actualStartDate !== '') {
    whereClause += ` AND a.event_date >= $${idx++}`;
    params.push(actualStartDate);
  }

  if (actualEndDate !== undefined && actualEndDate !== null && actualEndDate !== '') {
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

  const r = result.rows[0];
  return {
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
  };
}

/**
 * Export class attendance data to Excel
 * @param {number} cid Class ID
 * @param {string} startDate Start date YYYYMMDD
 * @param {string} endDate End date YYYYMMDD
 * @returns {Buffer} Excel file buffer
 */
export async function exportClassAttendance(cid, startDate, endDate) {
  // Check if class exists
  const classRes = await db.query('SELECT cid, class_name FROM class WHERE cid = $1 LIMIT 1', [cid]);
  if (classRes.rows.length === 0) {
    logger.warn(`CID ${cid} does not exist in class table`);
    throw ClassErrors.NOT_FOUND;
  }
  const classInfo = classRes.rows[0];

  const sqlStartDate = formatDatefromyyyymmddtopsqldate(startDate);
  const sqlEndDate = formatDatefromyyyymmddtopsqldate(endDate);

  // Get student count and expected attendance
  const studentInfoRes = await db.query(`
    SELECT
      COUNT(*)::int AS student_num,
      COUNT(*) FILTER (WHERE attendance = true)::int AS expected_attend
    FROM student WHERE cid = $1
  `, [cid]);
  const studentInfo = studentInfoRes.rows[0];

  // Get daily attendance data
  const dailyDataRes = await db.query(`
    WITH date_range AS (
      SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS event_date
    ),
    daily_events AS (
      SELECT
        a.event_date,
        COUNT(*) FILTER (WHERE a.event_type IN ('official', 'personal', 'sick'))::int AS absent_cnt,
        COUNT(*) FILTER (WHERE a.event_type = 'temp')::int AS temp_cnt
      FROM attendance a
      JOIN student s ON a.sid = s.sid
      WHERE s.cid = $1 AND a.event_date BETWEEN $2 AND $3
      GROUP BY a.event_date
    )
    SELECT
      dr.event_date,
      COALESCE(de.absent_cnt, 0) AS absent_cnt,
      COALESCE(de.temp_cnt, 0) AS temp_cnt
    FROM date_range dr
    LEFT JOIN daily_events de ON dr.event_date = de.event_date
    ORDER BY dr.event_date
  `, [cid, sqlStartDate, sqlEndDate]);

  // Get detailed leave/temp records
  const detailRes = await db.query(`
    SELECT
      a.event_date,
      s.student_name,
      a.event_type,
      a.event_reason
    FROM attendance a
    JOIN student s ON a.sid = s.sid
    WHERE s.cid = $1 AND a.event_date BETWEEN $2 AND $3
    ORDER BY a.event_date, s.student_name
  `, [cid, sqlStartDate, sqlEndDate]);

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduTrackly';
  workbook.created = new Date();

  // Sheet 1: 班级概览 (Class Overview)
  const overviewSheet = workbook.addWorksheet('班级概览');
  overviewSheet.columns = [
    { header: '项目', key: 'item', width: 20 },
    { header: '内容', key: 'value', width: 30 }
  ];
  overviewSheet.addRows([
    { item: '班级ID', value: classInfo.cid },
    { item: '班级名称', value: classInfo.class_name },
    { item: '学生总数', value: studentInfo.student_num },
    { item: '应到人数', value: studentInfo.expected_attend },
    { item: '统计开始日期', value: startDate },
    { item: '统计结束日期', value: endDate }
  ]);
  // Style header row
  overviewSheet.getRow(1).font = { bold: true };
  overviewSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Sheet 2: 每日出勤统计 (Daily Attendance Stats)
  const dailySheet = workbook.addWorksheet('每日出勤统计');
  dailySheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '应到人数', key: 'expected', width: 12 },
    { header: '实到人数', key: 'actual', width: 12 },
    { header: '出勤率(%)', key: 'rate', width: 12 },
    { header: '请假人数', key: 'absent', width: 12 },
    { header: '临时出勤人数', key: 'temp', width: 15 }
  ];

  for (const row of dailyDataRes.rows) {
    const expected = studentInfo.expected_attend;
    const actual = Math.max(expected - row.absent_cnt + row.temp_cnt, 0);
    const rate = expected > 0 ? ((actual / expected) * 100).toFixed(2) : '0.00';
    dailySheet.addRow({
      date: formatDatefromsqldatetoyyyymmdd(row.event_date),
      expected: expected,
      actual: actual,
      rate: parseFloat(rate),
      absent: row.absent_cnt,
      temp: row.temp_cnt
    });
  }
  dailySheet.getRow(1).font = { bold: true };
  dailySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Sheet 3: 请假明细 (Leave Details)
  const detailSheet = workbook.addWorksheet('请假明细');
  detailSheet.columns = [
    { header: '日期', key: 'date', width: 15 },
    { header: '学生姓名', key: 'student_name', width: 15 },
    { header: '类型', key: 'type', width: 12 },
    { header: '原因', key: 'reason', width: 40 }
  ];

  const eventTypeMap = {
    'official': '公假',
    'personal': '事假',
    'sick': '病假',
    'temp': '临时出勤'
  };

  for (const row of detailRes.rows) {
    detailSheet.addRow({
      date: formatDatefromsqldatetoyyyymmdd(row.event_date),
      student_name: row.student_name,
      type: eventTypeMap[row.event_type] || row.event_type,
      reason: row.event_reason || ''
    });
  }
  detailSheet.getRow(1).font = { bold: true };
  detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `${classInfo.class_name}_出勤统计_${startDate}_${endDate}.xlsx`
  };
}

/**
 * Export students attendance data to Excel
 * @param {number[]} sids Array of student IDs
 * @param {string} startDate Start date YYYYMMDD
 * @param {string} endDate End date YYYYMMDD
 * @returns {Buffer} Excel file buffer
 */
export async function exportStudentsAttendance(sids, startDate, endDate) {
  if (!sids || sids.length === 0) {
    logger.warn('No student IDs provided');
    throw ClassErrors.NOT_FOUND;
  }

  // Check if all students exist and are from the same class
  const studentRes = await db.query(`
    SELECT sid, student_name, cid, attendance
    FROM student WHERE sid = ANY($1)
    ORDER BY sid
  `, [sids]);

  if (studentRes.rows.length === 0) {
    logger.warn('No students found');
    throw ClassErrors.NOT_FOUND;
  }

  if (studentRes.rows.length !== sids.length) {
    logger.warn('Some students not found');
    throw ClassErrors.NOT_FOUND;
  }

  // Check all students are from the same class
  const uniqueCids = [...new Set(studentRes.rows.map(s => s.cid))];
  if (uniqueCids.length > 1) {
    logger.warn('Students are from different classes');
    throw { code: 1006, message: '所选学生必须来自同一班级' };
  }

  const students = studentRes.rows;
  const cid = uniqueCids[0];

  // Get class name
  const classRes = await db.query('SELECT class_name FROM class WHERE cid = $1', [cid]);
  const className = classRes.rows[0]?.class_name || 'Unknown';

  const sqlStartDate = formatDatefromyyyymmddtopsqldate(startDate);
  const sqlEndDate = formatDatefromyyyymmddtopsqldate(endDate);

  // Generate date range
  const dateRangeRes = await db.query(`
    SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS event_date
    ORDER BY event_date
  `, [sqlStartDate, sqlEndDate]);
  const dateRange = dateRangeRes.rows.map(r => r.event_date);

  // Get attendance records for all selected students
  const attendanceRes = await db.query(`
    SELECT
      a.sid,
      a.event_date,
      a.event_type,
      a.event_reason
    FROM attendance a
    WHERE a.sid = ANY($1) AND a.event_date BETWEEN $2 AND $3
    ORDER BY a.sid, a.event_date
  `, [sids, sqlStartDate, sqlEndDate]);

  // Group attendance by student
  const attendanceMap = {};
  for (const row of attendanceRes.rows) {
    if (!attendanceMap[row.sid]) {
      attendanceMap[row.sid] = {};
    }
    const dateKey = row.event_date.toISOString().split('T')[0];
    attendanceMap[row.sid][dateKey] = {
      type: row.event_type,
      reason: row.event_reason
    };
  }

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduTrackly';
  workbook.created = new Date();

  const eventTypeMap = {
    'official': '公假',
    'personal': '事假',
    'sick': '病假',
    'temp': '临时出勤'
  };

  // Create one sheet per student
  for (const student of students) {
    const sheetName = student.student_name.substring(0, 31); // Excel sheet name max 31 chars
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = [
      { header: '日期', key: 'date', width: 15 },
      { header: '出勤状态', key: 'status', width: 15 },
      { header: '未出勤原因', key: 'reason', width: 40 }
    ];

    // Add student info as first rows
    sheet.insertRow(1, ['学生信息', '', '']);
    sheet.insertRow(2, ['学生ID', student.sid, '']);
    sheet.insertRow(3, ['学生姓名', student.student_name, '']);
    sheet.insertRow(4, ['所属班级', className, '']);
    sheet.insertRow(5, ['是否参与点名', student.attendance ? '是' : '否', '']);
    sheet.insertRow(6, ['', '', '']);

    // Style info section
    for (let i = 1; i <= 5; i++) {
      sheet.getRow(i).font = { bold: true };
    }

    // Add header row for attendance data
    sheet.getRow(7).values = ['日期', '出勤状态', '未出勤原因'];
    sheet.getRow(7).font = { bold: true };
    sheet.getRow(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const studentAttendance = attendanceMap[student.sid] || {};

    // Add daily attendance data
    for (const date of dateRange) {
      const dateKey = date.toISOString().split('T')[0];
      const dateFormatted = formatDatefromsqldatetoyyyymmdd(date);
      const record = studentAttendance[dateKey];

      let status = '出勤';
      let reason = '';

      if (record) {
        if (record.type === 'temp') {
          status = '临时出勤';
        } else {
          status = eventTypeMap[record.type] || record.type;
          reason = record.reason || '';
        }
      } else if (!student.attendance) {
        status = '不参与点名';
      }

      sheet.addRow({
        date: dateFormatted,
        status: status,
        reason: reason
      });
    }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `学生出勤统计_${startDate}_${endDate}.xlsx`
  };
}