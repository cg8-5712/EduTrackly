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
    // Create a Date object, parse the complete ISO 8601 datetime string
    const utcDate = new Date(date);
    if (isNaN(utcDate.getTime())) {
        logger.error(JSON.stringify(FormatErrors.NOT_YYYYMMDDHHMMSS_DATE));
        throw FormatErrors.NOT_YYYYMMDDHHMMSS_DATE;
    }

    // Convert UTC time to local time
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);

    // Extract year, month, day
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Month starts from 0, need to add 1
    const day = String(localDate.getDate()).padStart(2, '0');

    // Return string in yyyymmdd format
    return parseInt(`${year}${month}${day}`);
}

/**
 * Format PostgreSQL TIMESTAMP to JS timestamp (milliseconds)
 * @param {string|Date|null} sqlTimestamp - PostgreSQL TIMESTAMP, e.g., "2025-08-25 21:00:00" or Date object
 * @returns {number|null} Timestamp (milliseconds), returns null if input is invalid
 */
export function formatDateFromSqlTimestampToTimestamp(sqlTimestamp) {
    if (!sqlTimestamp) return null;

    try {
        // PostgreSQL returns either string or Date
        const date = sqlTimestamp instanceof Date ? sqlTimestamp : new Date(sqlTimestamp);

        if (isNaN(date.getTime())) {
            throw new Error(`Invalid SQL timestamp: ${sqlTimestamp}`);
        }

        return date.getTime(); // JS timestamp in milliseconds
    } catch (err) {
        logger.error({ error: err.message, sqlTimestamp }, "formatDateFromSqlTimestampToTimestamp error");
        return null;
    }
}
