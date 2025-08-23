// src/middleware/jwt_require.js
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import logger from "./loggerMiddleware.js";

export default function jwtRequire(req, res, next) {
    // 从 Authorization 头获取 token (Bearer token)
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        logger.warn("⛔ Missing Authorization header");
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1]; // Bearer token
    if (!token) {
        logger.warn("⛔ Missing token in Authorization header");
        return res.status(401).json({ error: "Token missing" });
    }

    try {
        // 验证 token
        const decoded = jwt.verify(token, config.jwt.secret);

        if (!decoded.aid) {
            logger.warn("⛔ Token payload missing 'aid'");
            return res.status(401).json({ error: "Invalid token payload" });
        }

        // 把 aid 存到 req 里，后续控制器可以直接用
        req.aid = decoded.aid;

        logger.debug("✅ JWT verified, aid:", decoded.aid);
        next();
    } catch (error) {
        logger.error("❌ Invalid or expired token:", error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
