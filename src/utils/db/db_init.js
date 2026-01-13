// src/utils/db/db_init.js
import db from './db_connector.js';
import migrations from './migration.js';
import logger from '../../middleware/loggerMiddleware.js';
import config from '../../config/config.js';

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
      // First time initialization - run full schema
      logger.info('⏳ Running database migrations (first time)...');
      await migrations.runSchema();

      // Only seed mock data in non-production environments
      if (config.app.env !== 'production') {
        await migrations.runSeed();
      } else {
        logger.info('⚡ Production mode: skipping mock data seeding');
      }

      logger.info('✅ Database migrations completed');
    } else {
      // Database exists - run automatic migrations for any new migration files
      logger.info('⏳ Checking for pending migrations...');

      // Check migration integrity first
      await migrations.checkIntegrity();

      // Run any pending migrations
      const migrationResult = await migrations.runAutoMigrations();

      if (migrationResult.errors.length > 0) {
        logger.error('⚠️ Some migrations failed, please check the logs');
      }
    }
  } catch (error) {
    logger.error('❌ Error initializing database connection:', error.message);
    throw error;
  }
}
