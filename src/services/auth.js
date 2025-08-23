// src/services/auth.js
import db from "../utils/db/db_connector.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

/**
 * 用户认证
 * @param {string} password - 输入的密码
 * @param {string} ip - 登录请求的 IP 地址
 * @returns {Object|null} - 登录结果或 null
 */
export async function authenticateUser(password, ip) {
    // 查找 admin 账号（这里只考虑单账号）
    const query = "SELECT aid, password, time AS last_login_time, ip AS last_login_ip FROM admin LIMIT 1";
    const result = await db.query(query);

    if (result.rowCount === 0) {
        return null; // 没有账号
    }

    const admin = result.rows[0];

    // ⚠️ 简化：直接对比明文，生产环境要加密存储 + bcrypt
    if (password !== admin.password) {
        return null; // 密码不正确
    }

    // 生成 JWT
    const expiresIn = config.jwt.expiresIn || "1h"; // 默认 1 小时
    const token = jwt.sign({ aid: admin.aid }, config.jwt.secret, { expiresIn });

    // 更新最后登录信息
    const updateQuery = `
        UPDATE admin 
        SET time = CURRENT_TIMESTAMP, ip = $1 
        WHERE aid = $2
    `;
    await db.query(updateQuery, [ip, admin.aid]);

    return {
        aid: admin.aid,
        access_token: token,
        expires_in: expiresIn,
        last_login_time: Math.floor(new Date(admin.last_login_time).getTime() / 1000),
        last_login_ip: admin.last_login_ip
    };
}
