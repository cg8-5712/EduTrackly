// src/config/express.js
import cors from "cors";
import chalk from "chalk";
import helmet from "helmet";
import compression from "compression";
import express from "express";
import { loggerMiddleware } from "../middleware/loggerMiddleware.js";

export default function configureExpress(app) {
    console.log(chalk.cyan("🔧 Configuring Express..."));

    // CORS
    app.use(cors());
    console.log(chalk.gray("  ✓ CORS enabled"));

    // 安全头
    app.use(helmet());
    console.log(chalk.gray("  ✓ Helmet security headers enabled"));

    // GZIP 压缩
    app.use(compression());
    console.log(chalk.gray("  ✓ Compression enabled"));

    // Body 解析
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    console.log(chalk.gray("  ✓ Body parsers enabled"));

    // 日志中间件
    app.use(loggerMiddleware);
    console.log(chalk.gray("  ✓ Logger middleware enabled"));

    console.log(chalk.green("✅ Express configured successfully\n"));
}
