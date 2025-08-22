// src/utils/db/migrations.js
import db from './db_connector.js';
import logger from '../../middleware/loggerMiddleware.js';

const migrations = {
    async createTables() {
        try {
            await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS study_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 添加其他所需表...
      `);

            logger.info('数据库表创建成功');
        } catch (error) {
            logger.error('创建数据库表失败:', error.message);
            throw error;
        }
    },

    async addIndexes() {
        try {
            await db.query(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
      `);

            logger.info('数据库索引创建成功');
        } catch (error) {
            logger.error('创建数据库索引失败:', error.message);
            throw error;
        }
    }
};

export default migrations;