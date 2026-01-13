// src/utils/db/migration.js
import db from './db_connector.js';
import logger from '../../middleware/loggerMiddleware.js';
import fs from 'fs';
import path from 'path';
import { runAutoMigrations, checkMigrationIntegrity } from './migration/autoMigrate.js';

const migrations = {
  /**
   * Run the base schema creation (for initial setup)
   */
  async runSchema() {
    try {
      logger.info('Starting database table creation...');
      const sql = fs.readFileSync(path.resolve('./src/utils/db/migration/schema.sql'), 'utf-8');
      await db.query(sql);
      logger.info('✅ Database table creation successful');
    } catch (error) {
      logger.error('❌ Database table creation failed:', error.message);
      throw error;
    }
  },

  /**
   * Seed mock data (for development/testing)
   */
  async runSeed() {
    try {
      logger.info('Starting seeding mock data...');
      const sql = fs.readFileSync(path.resolve('./src/utils/db/migration/mock.sql'), 'utf-8');
      await db.query(sql);
      logger.info('✅ Mock data seeded successfully');
    } catch (error) {
      logger.error('❌ Mock data seeding failed:', error.message);
      throw error;
    }
  },

  /**
   * Run automatic migrations - scans migration directory and applies pending migrations
   * @param {object} options
   * @param {boolean} options.dryRun - If true, only show what would be run
   * @returns {Promise<{ applied: number, skipped: number, errors: string[] }>}
   */
  async runAutoMigrations(options = {}) {
    try {
      logger.info('Starting automatic migrations...');
      const result = await runAutoMigrations(db, logger, options);

      if (result.errors.length > 0) {
        logger.error(`❌ Migration completed with ${result.errors.length} error(s)`);
      } else if (result.applied > 0) {
        logger.info(`✅ Applied ${result.applied} migration(s) successfully`);
      } else {
        logger.info('✅ Database is up to date');
      }

      return result;
    } catch (error) {
      logger.error('❌ Automatic migration failed:', error.message);
      throw error;
    }
  },

  /**
   * Check migration file integrity (detect if applied migrations were modified)
   * @returns {Promise<string[]>} List of warnings
   */
  async checkIntegrity() {
    try {
      const warnings = await checkMigrationIntegrity(db, logger);
      if (warnings.length > 0) {
        logger.warn(`Found ${warnings.length} migration integrity warning(s)`);
      }
      return warnings;
    } catch (error) {
      logger.error('❌ Migration integrity check failed:', error.message);
      throw error;
    }
  }
};

export default migrations;
