// src/services/auth.js
import db from "../utils/db/db_connector.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import logger from "../middleware/loggerMiddleware.js";

/**
 * 用户认证
 * @param {string} password - 输入的密码
 * @param {string} ip - 登录请求的 IP 地址
 * @returns {Object|null} - 登录结果或 null
 */
export async function authenticateUser(password, ip) {
    // 查找所有 admin 账号
    const query = "SELECT aid, password, time AS last_login_time, ip AS last_login_ip FROM admin";
    const result = await db.query(query);

    if (result.rowCount === 0) {
        return null; // 没有账号
    }

    // 遍历所有账号，检查密码是否匹配
    for (const admin of result.rows) {
        if (password === admin.password) {
            // 生成 JWT
            const expiresIn = parseInt(config.jwt.expires) || 3600; // 默认 1 小时
            const token = jwt.sign({ aid: admin.aid }, config.jwt.secret, { expiresIn });

            // 更新最后登录信息
            const updateQuery = `
                UPDATE admin 
                SET time = CURRENT_TIMESTAMP, ip = $1 
                WHERE aid = $2
            `;
            await db.query(updateQuery, [ip, admin.aid]);

            if (config.app.env === "debug") {
                logger.debug(`User ${admin.aid} logged in from ${ip} with token ${token} and expires in ${expiresIn} seconds`);
            }
            else {
                logger.info(`User ${admin.aid} logged successfully`);
            }

            return {
                aid: admin.aid,
                access_token: token,
                expires_in: expiresIn,
                last_login_time: Math.floor(new Date(admin.last_login_time).getTime() / 1000),
                last_login_ip: admin.last_login_ip
            };
        }
    }

    return null; // 没有匹配的密码
}
