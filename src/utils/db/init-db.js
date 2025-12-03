#!/usr/bin/env node

/**
 * Database initialization script
 * Automatically detects environment and initializes database accordingly
 *
 * Usage:
 *   NODE_ENV=development node src/utils/db/init-db.js
 *   NODE_ENV=production node src/utils/db/init-db.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import db from './db_connector.js';
import config from '../../config/config.js';
import logger from '../../middleware/loggerMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENV = config.app.env;
const SCHEMA_FILE = join(__dirname, 'migration', 'schema.sql');
const MOCK_FILE = join(__dirname, 'migration', 'mock.sql');

console.log('\n=================================');
console.log('   Database Initialization');
console.log('=================================\n');
console.log(`Environment: ${ENV}`);
console.log(`Database: ${config.db.name}`);
console.log(`Host: ${config.db.host}:${config.db.port}\n`);

async function initDatabase() {
  try {
    // Step 1: Read and execute schema
    console.log('📋 Step 1: Creating database schema...');
    const schemaSQL = readFileSync(SCHEMA_FILE, 'utf8');
    await db.query(schemaSQL);
    console.log('✅ Schema created successfully\n');

    // Step 2: Insert mock data (only in development/debug)
    if (ENV === 'development' || ENV === 'debug' || ENV === 'test') {
      console.log('📦 Step 2: Inserting mock data...');
      console.log('   (Mock data is only loaded in development/debug/test environment)\n');

      const mockSQL = readFileSync(MOCK_FILE, 'utf8');
      await db.query(mockSQL);

      console.log('✅ Mock data inserted successfully');
      console.log('\n📝 Test credentials:');
      console.log('   Admin 1: password = "test123456"');
      console.log('   Admin 2: password = "admin_password2"\n');

      logger.info('Database initialized with mock data', { env: ENV });
    } else {
      console.log('⚠️  Step 2: Skipping mock data');
      console.log('   (Production mode - mock data will NOT be inserted)\n');
      console.log('⚠️  IMPORTANT: You need to create an admin account manually!');
      console.log('   Run: node src/utils/admin/create-admin.js\n');

      logger.info('Database initialized without mock data', { env: ENV });
    }

    console.log('=================================');
    console.log('✅ Database initialization complete!');
    console.log('=================================\n');

  } catch (error) {
    console.error('\n❌ Database initialization failed!\n');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Make sure PostgreSQL is running');
      console.error('   - Check database connection settings in .env file');
    } else if (error.code === '42P07') {
      console.error('\n💡 Note: Tables already exist. Drop them first if you want to reinitialize.');
    }

    logger.error('Database initialization failed', {
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      env: ENV
    });

    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run initialization
initDatabase();
