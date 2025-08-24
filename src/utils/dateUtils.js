import { FormatErrors } from "../config/errorCodes.js";
import logger from "../middleware/loggerMiddleware.js";

export function formatDatefromyyyymmddtopsqldate(date) {
    if (typeof date !== 'string' || date.length !== 8) {
        logger.error(JSON.stringify(FormatErrors.NOT_YYYYMMDD_DATE));
        throw new Error(JSON.stringify(FormatErrors.NOT_YYYYMMDD_DATE));
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
        throw new Error(JSON.stringify(FormatErrors.NOT_YYYYMMDDHHMMSS_DATE));
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
