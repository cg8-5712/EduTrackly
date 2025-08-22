// src/utils/db/db_init.js
import db from './db_connector.js';
import migrations from './migration.js';
import logger from '../../middleware/loggerMiddleware.js';

export default async function initializeDatabase() {
    logger.info('⏳ Initializing database connection...');

    try {
        await db.initialize();
        logger.info('✅ Database connection initialized');

        logger.info('⏳ Running database migrations...');
        await migrations.runSchema();
        await migrations.runSeed();
        logger.info('✅ Database migrations completed');
    } catch (error) {
        logger.error('❌ Error initializing database connection:', error.message);
        throw error;
    }
}
