// src/utils/db/db_init.js
import db from './db_connector.js';
import migrations from './migration.js';
import logger from '../../middleware/loggerMiddleware.js';

export default async function initializeDatabase() {
    logger.info('⏳ Initializing database connection...');

    try {
        await db.initialize();
        logger.info('✅ Database connection initialized');

        // Check if database tables already exist
        const result = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            LIMIT 1;
        `);

        if (result.rows.length === 0) {
            logger.info('⏳ Running database migrations (first time)...');
            await migrations.runSchema();
            await migrations.runSeed();
            logger.info('✅ Database migrations completed');
        } else {
            logger.info('⚡ Database already initialized, skipping migrations');
        }
    } catch (error) {
        logger.error('❌ Error initializing database connection:', error.message);
        throw error;
    }
}
