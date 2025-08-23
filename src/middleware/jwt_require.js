// src/middleware/jwt_require.js
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import logger from "./loggerMiddleware.js";
import { AuthErrors } from "../config/errorCodes.js";

export default function jwtRequire(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        logger.warn("⛔ Missing Authorization header");
        return next(AuthErrors.UNAUTHORIZED);
    }

    const token = authHeader.split(" ")[1]; // Bearer token
    if (!token) {
        logger.warn("⛔ Missing token in Authorization header");
        return next(AuthErrors.UNAUTHORIZED);
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);

        if (!decoded.aid) {
            logger.warn("⛔ Token payload missing 'aid'");
            return next(AuthErrors.INVALID_TOKEN);
        }

        req.aid = decoded.aid;
        logger.debug("✅ JWT verified, aid:", decoded.aid);
        next();
    } catch (err) {
        logger.error("❌ Invalid or expired token:", err.message);
        return next(AuthErrors.INVALID_TOKEN);
    }
}
