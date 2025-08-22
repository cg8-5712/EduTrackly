// src/utils/db/db_init.js
import db from './db_connector.js';
import migrations from './migration.js';
import logger from '../../middleware/loggerMiddleware.js';

export default async function initializeDatabase() {
    logger.info('⏳ 初始化数据库连接...');

    try {
        await db.initialize();
        logger.info('✅ 数据库连接成功');

        logger.info('⏳ 执行数据库迁移...');
        await migrations.createTables();
        await migrations.addIndexes();
        logger.info('✅ 数据库迁移完成');
    } catch (error) {
        logger.error('❌ 数据库初始化失败:', error.message);
        throw error;
    }
}
