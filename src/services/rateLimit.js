// src/services/rateLimit.js
import db from '../utils/db/db_connector.js';
import logger from '../middleware/loggerMiddleware.js';

/**
 * 获取所有速率限制配置
 */
export async function listRateLimitConfigs() {
  const result = await db.query(
    'SELECT id, key, window_ms, max_requests, description, enabled, created_at, updated_at FROM rate_limit_config ORDER BY id ASC'
  );
  return result.rows;
}

/**
 * 获取单个速率限制配置
 * @param {string} key - 配置键名
 */
export async function getRateLimitConfig(key) {
  const result = await db.query(
    'SELECT id, key, window_ms, max_requests, description, enabled, created_at, updated_at FROM rate_limit_config WHERE key = $1',
    [key]
  );
  return result.rows[0] || null;
}

/**
 * 更新速率限制配置
 * @param {string} key - 配置键名
 * @param {Object} updates - 更新内容
 */
export async function updateRateLimitConfig(key, updates) {
  const { window_ms, max_requests, description, enabled } = updates;
  const setClauses = [];
  const params = [key];
  let paramIndex = 2;

  if (window_ms !== undefined) {
    setClauses.push(`window_ms = $${paramIndex++}`);
    params.push(window_ms);
  }

  if (max_requests !== undefined) {
    setClauses.push(`max_requests = $${paramIndex++}`);
    params.push(max_requests);
  }

  if (description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    params.push(description);
  }

  if (enabled !== undefined) {
    setClauses.push(`enabled = $${paramIndex++}`);
    params.push(enabled);
  }

  if (setClauses.length === 0) {
    return null;
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');

  const query = `
    UPDATE rate_limit_config
    SET ${setClauses.join(', ')}
    WHERE key = $1
    RETURNING id, key, window_ms, max_requests, description, enabled, created_at, updated_at
  `;

  const result = await db.query(query, params);

  if (result.rows[0]) {
    logger.info(`Rate limit config updated: ${key}`, updates);
  }

  return result.rows[0] || null;
}

/**
 * 创建新的速率限制配置
 * @param {Object} config - 配置内容
 */
export async function createRateLimitConfig(config) {
  const { key, window_ms = 60000, max_requests = 100, description = '', enabled = true } = config;

  const result = await db.query(
    `INSERT INTO rate_limit_config (key, window_ms, max_requests, description, enabled)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, key, window_ms, max_requests, description, enabled, created_at, updated_at`,
    [key, window_ms, max_requests, description, enabled]
  );

  logger.info(`Rate limit config created: ${key}`);
  return result.rows[0];
}

/**
 * 删除速率限制配置
 * @param {string} key - 配置键名
 */
export async function deleteRateLimitConfig(key) {
  // 不允许删除默认配置
  const protectedKeys = ['global', 'auth', 'write', 'read'];
  if (protectedKeys.includes(key)) {
    throw { code: 4001, message: 'Cannot delete protected rate limit config' };
  }

  const result = await db.query(
    'DELETE FROM rate_limit_config WHERE key = $1 RETURNING key',
    [key]
  );

  if (result.rowCount > 0) {
    logger.info(`Rate limit config deleted: ${key}`);
  }

  return result.rowCount > 0;
}
