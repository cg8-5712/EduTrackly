// src/middleware/rate_limiter.js
import db from '../utils/db/db_connector.js';
import logger from './loggerMiddleware.js';

// 内存存储请求计数（生产环境建议用 Redis）
const requestCounts = new Map();

// 配置缓存
let configCache = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 分钟缓存

/**
 * 从数据库获取速率限制配置
 * @param {string} key - 配置键名
 */
async function getRateLimitConfig(key) {
  const now = Date.now();

  // 检查缓存
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return configCache[key] || configCache['global'];
  }

  try {
    // 从数据库加载配置
    const result = await db.query(
      'SELECT key, window_ms, max_requests, enabled FROM rate_limit_config WHERE enabled = true'
    );

    configCache = {};
    for (const row of result.rows) {
      configCache[row.key] = {
        windowMs: row.window_ms,
        maxRequests: row.max_requests
      };
    }
    configCacheTime = now;

    return configCache[key] || configCache['global'] || { windowMs: 60000, maxRequests: 100 };
  } catch (error) {
    logger.error('Failed to load rate limit config:', error.message);
    // 返回默认配置
    return { windowMs: 60000, maxRequests: 100 };
  }
}

/**
 * 清理过期的请求记录
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.startTime > data.windowMs) {
      requestCounts.delete(key);
    }
  }
}

// 每分钟清理一次
setInterval(cleanupExpiredRecords, 60000);

/**
 * 速率限制中间件工厂
 * @param {string} configKey - 配置键名 ('global', 'auth', 'write', 'read')
 */
export function rateLimiter(configKey = 'global') {
  return async (req, res, next) => {
    try {
      const config = await getRateLimitConfig(configKey);
      const { windowMs, maxRequests } = config;

      // 使用 IP + 配置键 作为标识
      const identifier = `${req.ip}:${configKey}`;
      const now = Date.now();

      let record = requestCounts.get(identifier);

      if (!record || (now - record.startTime) > windowMs) {
        // 新窗口
        record = { count: 1, startTime: now, windowMs };
        requestCounts.set(identifier, record);
      } else {
        record.count++;
      }

      // 设置响应头
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
      res.set('X-RateLimit-Reset', Math.ceil((record.startTime + windowMs) / 1000));

      if (record.count > maxRequests) {
        logger.warn(`Rate limit exceeded for ${identifier}`, {
          ip: req.ip,
          configKey,
          count: record.count,
          limit: maxRequests
        });

        return res.status(429).json({
          code: 4290,
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((record.startTime + windowMs - now) / 1000),
          timestamp: Date.now()
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error.message);
      // 出错时不阻止请求
      next();
    }
  };
}

/**
 * 刷新配置缓存（供 API 调用）
 */
export function refreshRateLimitConfig() {
  configCache = null;
  configCacheTime = 0;
}
