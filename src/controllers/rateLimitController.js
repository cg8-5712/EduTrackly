// src/controllers/rateLimitController.js
import * as rateLimitService from '../services/rateLimit.js';
import { refreshRateLimitConfig } from '../middleware/rate_limiter.js';
import logger from '../middleware/loggerMiddleware.js';
import { handleControllerError } from '../middleware/error_handler.js';

/**
 * 获取所有速率限制配置
 */
export async function listRateLimitConfigs(req, res) {
  try {
    const configs = await rateLimitService.listRateLimitConfigs();

    return res.json({
      code: 0,
      message: 'Success',
      data: configs,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('List rate limit configs error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * 获取单个速率限制配置
 */
export async function getRateLimitConfig(req, res) {
  const { key } = req.query;

  try {
    if (!key) {
      return res.status(400).json({
        code: 4000,
        message: 'Config key is required',
        timestamp: Date.now()
      });
    }

    const config = await rateLimitService.getRateLimitConfig(key);

    if (!config) {
      return res.status(404).json({
        code: 4004,
        message: 'Rate limit config not found',
        timestamp: Date.now()
      });
    }

    return res.json({
      code: 0,
      message: 'Success',
      data: config,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Get rate limit config error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * 更新速率限制配置
 */
export async function updateRateLimitConfig(req, res) {
  const { key } = req.query;
  const { window_ms, max_requests, description, enabled } = req.body;

  try {
    if (!key) {
      return res.status(400).json({
        code: 4000,
        message: 'Config key is required',
        timestamp: Date.now()
      });
    }

    // 验证参数
    if (window_ms !== undefined && (typeof window_ms !== 'number' || window_ms < 1000)) {
      return res.status(400).json({
        code: 4001,
        message: 'window_ms must be a number >= 1000',
        timestamp: Date.now()
      });
    }

    if (max_requests !== undefined && (typeof max_requests !== 'number' || max_requests < 1)) {
      return res.status(400).json({
        code: 4002,
        message: 'max_requests must be a number >= 1',
        timestamp: Date.now()
      });
    }

    const updated = await rateLimitService.updateRateLimitConfig(key, {
      window_ms,
      max_requests,
      description,
      enabled
    });

    if (!updated) {
      return res.status(404).json({
        code: 4004,
        message: 'Rate limit config not found or no changes made',
        timestamp: Date.now()
      });
    }

    // 刷新缓存
    refreshRateLimitConfig();

    logger.info(`Rate limit config ${key} updated by aid=${req.aid}`);

    return res.json({
      code: 0,
      message: 'Rate limit config updated successfully',
      data: updated,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Update rate limit config error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * 创建新的速率限制配置
 */
export async function createRateLimitConfig(req, res) {
  const { key, window_ms, max_requests, description, enabled } = req.body;

  try {
    if (!key) {
      return res.status(400).json({
        code: 4000,
        message: 'Config key is required',
        timestamp: Date.now()
      });
    }

    // 验证参数
    if (window_ms !== undefined && (typeof window_ms !== 'number' || window_ms < 1000)) {
      return res.status(400).json({
        code: 4001,
        message: 'window_ms must be a number >= 1000',
        timestamp: Date.now()
      });
    }

    if (max_requests !== undefined && (typeof max_requests !== 'number' || max_requests < 1)) {
      return res.status(400).json({
        code: 4002,
        message: 'max_requests must be a number >= 1',
        timestamp: Date.now()
      });
    }

    const config = await rateLimitService.createRateLimitConfig({
      key,
      window_ms,
      max_requests,
      description,
      enabled
    });

    // 刷新缓存
    refreshRateLimitConfig();

    logger.info(`Rate limit config ${key} created by aid=${req.aid}`);

    return res.status(201).json({
      code: 0,
      message: 'Rate limit config created successfully',
      data: config,
      timestamp: Date.now()
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        code: 4009,
        message: 'Rate limit config with this key already exists',
        timestamp: Date.now()
      });
    }
    logger.error('Create rate limit config error:', error.message);
    handleControllerError(error, res, req);
  }
}

/**
 * 删除速率限制配置
 */
export async function deleteRateLimitConfig(req, res) {
  const { key } = req.query;

  try {
    if (!key) {
      return res.status(400).json({
        code: 4000,
        message: 'Config key is required',
        timestamp: Date.now()
      });
    }

    const deleted = await rateLimitService.deleteRateLimitConfig(key);

    if (!deleted) {
      return res.status(404).json({
        code: 4004,
        message: 'Rate limit config not found',
        timestamp: Date.now()
      });
    }

    // 刷新缓存
    refreshRateLimitConfig();

    logger.info(`Rate limit config ${key} deleted by aid=${req.aid}`);

    return res.json({
      code: 0,
      message: 'Rate limit config deleted successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    if (error.code === 4001) {
      return res.status(400).json({
        ...error,
        timestamp: Date.now()
      });
    }
    logger.error('Delete rate limit config error:', error.message);
    handleControllerError(error, res, req);
  }
}
