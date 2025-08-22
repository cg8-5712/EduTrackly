// loggerMiddleware.js
import chalk from "chalk";

// 获取调用堆栈中的文件和行号
function getCallerInfo() {
    const obj = {};
    Error.captureStackTrace(obj, getCallerInfo);
    const stack = obj.stack.split("\n")[3]; // 第4行是调用点
    const match = stack.match(/\((.*):(\d+)\)/);
    if (match) {
        const filePath = match[1];
        const line = match[2];
        return `${filePath.replace(process.cwd(), "")}:${line}`;
    }
    return "unknown";
}

class Logger {
    constructor(level = "debug") {
        this.level = level;

        this.levels = {
            debug: { priority: 0, color: chalk.green.bold },
            info: { priority: 1, color: chalk.rgb(41, 115, 218).bold },
            warn: { priority: 2, color: chalk.yellow.bold },
            error: { priority: 3, color: chalk.rgb(255, 0, 0).bold },
        };
    }

    shouldLog(level) {
        const currentPriority = this.levels[this.level]?.priority ?? 0;

        if (this.level === "debug") return true;
        if (this.level === "warn" && ["info", "warn", "error"].includes(level)) return true;
        if (this.level === "info" && ["info", "error"].includes(level)) return true;

        return false;
    }

    formatTime() {
        return new Date().toISOString().replace("T", " ").split(".")[0];
    }

    log(level, ...args) {
        if (!this.shouldLog(level)) return;

        const { color } = this.levels[level] || ((msg) => msg);
        const timestamp = chalk.gray(this.formatTime());
        const paddedLevel = `[${level.toUpperCase().padEnd(5)}]`;
        const levelTag = color(paddedLevel);
        let message = `${timestamp} | ${levelTag} | ${args.join(" ")}`;
        if (level === "error" && this.level === "debug") {
            const caller = chalk.cyan(getCallerInfo());
            message += ` | ${caller}`;
        }

        console.log(message);
    }

    debug(...args) {
        this.log("debug", ...args);
    }

    info(...args) {
        this.log("info", ...args);
    }

    warn(...args) {
        this.log("warn", ...args);
    }

    error(...args) {
        this.log("error", ...args);
    }
}

const logger = new Logger(process.env.LOG_LEVEL || "debug");

export function loggerMiddleware(req, res, next) {
    logger.info(`${req.method} ${req.url}`);
    next();
}

export default logger;
