export function formatDatefromyyyymmddtopsqldate(date) {
    if (typeof date !== 'string' || date.length !== 8) {
        throw new Error('输入的日期格式不正确，应为 yyyymmdd 的字符串格式');
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
        throw new Error('输入的日期格式不正确，应为 yyyy-mm-dd 或 yyyy-mm-ddTHH:MM:SS.sssZ 的字符串格式');
    }

    // 将 UTC 时间转换为本地时间
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);

    // 提取年、月、日部分
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要加 1
    const day = String(localDate.getDate()).padStart(2, '0');

    // 返回格式为 yyyymmdd 的字符串
    return `${year}${month}${day}`;
}
