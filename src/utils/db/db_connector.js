// src/utils/db/db_connector.js
import pg from 'pg';
import logger from '../../middleware/loggerMiddleware.js';
import config from '../../config/config.js';

const { Pool } = pg;

class DatabaseConnector {
    constructor() {
        this.pool = null;
        this.config = {
            host: config.db.host,
            port: config.db.port,
            database: config.db.name,
            user: config.db.username,
            password: config.db.password,
            max: 20, // 连接池最大连接数
            idleTimeoutMillis: 30000, // 空闲连接超时时间
            connectionTimeoutMillis: 2000 // 连接超时时间
        };
    }

    async initialize() {
        try {
            this.pool = new Pool(this.config);

            logger.debug('数据库连接信息: ', JSON.stringify(this.config, null, 2));

            // 测试连接
            const client = await this.pool.connect();
            client.release();

            // 设置错误处理
            this.pool.on('error', (err) => {
                logger.error('数据库连接池异常:', err.message);
            });

            return true;
        } catch (error) {
            logger.error('数据库连接失败:', error.message);
            throw error;
        }
    }

    async query(text, params) {
        try {
            const start = Date.now();
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;

            logger.debug(
                `执行查询: ${text} | 参数: ${JSON.stringify(params)} | 耗时: ${duration}ms | 返回行数: ${res.rowCount}`
            );
            return res;
        } catch (error) {
            logger.error(`查询执行失败: ${error.message} | SQL: ${text} | 参数: ${JSON.stringify(params)}`);
            throw error;
        }
    }


    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        try {
            await this.pool.end();
            logger.info('数据库连接已关闭');
        } catch (error) {
            logger.error('关闭数据库连接失败:', error.message);
            throw error;
        }
    }
}

// 创建单例实例
const db = new DatabaseConnector();

export default db;