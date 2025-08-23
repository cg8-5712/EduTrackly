import logger from "./loggerMiddleware.js";

// 生成统一响应
function buildResponse({ code = 0, message = "Success", data = null } = {}) {
    return {
        code,
        message,
        data,
        timestamp: Date.now(),
    };
}

// 全局错误处理中间件
export default function errorHandler(err, req, res, next) {
    const code = err.code || 9001; // 默认系统错误
    const message = err.message || "Internal Server Error";

    // 自动映射 HTTP 状态码
    let status = 500;
    if (code === 0) status = 200;
    else if (String(code).startsWith("1")) status = 401; // auth / 系统错误
    else if (String(code).startsWith("2")) status = 400; // homework 错误
    else if (String(code).startsWith("3")) status = 400; // student 错误
    else status = 500;

    // 日志
    logger.error(`${req.method} ${req.originalUrl} | code: ${code} | message: ${message}`);

    res.status(status).json(buildResponse({
        code,
        message,
        data: err.data || null,
    }));
}
