import { FormatErrors } from "../config/errorCodes.js";
import logger from "../middleware/loggerMiddleware.js";

export function formatDatefromyyyymmddtopsqldate(date) {
    if (typeof date !== 'string' || date.length !== 8) {
        logger.error(JSON.stringify(FormatErrors.NOT_YYYYMMDD_DATE));
        throw FormatErrors.NOT_YYYYMMDD_DATE;
    }
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return `${year}-${month}-${day}`;
}

export function formatDatefromsqldatetoyyyymmdd(date) {
    // 创建一个 Date 对象，解析完整的 ISO 8601 日期时间字符串
    const utcDate = new Date(date);
    if (isNaN(utcDate.getTime())) {
        logger.error(JSON.stringify(FormatErrors.NOT_YYYYMMDDHHMMSS_DATE));
        throw FormatErrors.NOT_YYYYMMDDHHMMSS_DATE;
    }

    // 将 UTC 时间转换为本地时间
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);

    // 提取年、月、日部分
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要加 1
    const day = String(localDate.getDate()).padStart(2, '0');

    // 返回格式为 yyyymmdd 的字符串
    return parseInt(`${year}${month}${day}`);
}

/**
 * 格式化 PostgreSQL TIMESTAMP 为 JS 时间戳 (毫秒)
 * @param {string|Date|null} sqlTimestamp - PostgreSQL TIMESTAMP，例如 "2025-08-25 21:00:00" 或 Date 对象
 * @returns {number|null} 时间戳 (毫秒)，如果输入无效返回 null
 */
export function formatDateFromSqlTimestampToTimestamp(sqlTimestamp) {
    if (!sqlTimestamp) return null;

    try {
        // PostgreSQL 返回可能是 string 或 Date
        const date = sqlTimestamp instanceof Date ? sqlTimestamp : new Date(sqlTimestamp);

        if (isNaN(date.getTime())) {
            throw new Error(`Invalid SQL timestamp: ${sqlTimestamp}`);
        }

        return date.getTime(); // JS 时间戳，单位毫秒
    } catch (err) {
        console.error("formatDateFromSqlTimestampToTimestamp error:", err.message);
        return null;
    }
}
