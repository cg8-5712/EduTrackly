// src/utils/db/migration/run_migration.js
// Database migration runner script
//
// Usage:
//   node src/utils/db/migration/run_migration.js [upgrade|rollback] [version]
//
// Examples:
//   node src/utils/db/migration/run_migration.js upgrade 1.1.0
//   node src/utils/db/migration/run_migration.js rollback 1.1.0

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'edutrackly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

// Migration files mapping
const migrations = {
  '1.1.0': {
    upgrade: 'upgrade_v1.0_to_v1.1.sql',
    rollback: 'rollback_v1.1_to_v1.0.sql'
  }
};

async function runMigration(action, version) {
  const pool = new Pool(dbConfig);

  try {
    console.log(`\n🔄 Running ${action} migration to version ${version}...`);
    console.log(`📦 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}\n`);

    // Check if migration exists
    if (!migrations[version]) {
      console.error(`❌ Unknown version: ${version}`);
      console.log('Available versions:', Object.keys(migrations).join(', '));
      process.exit(1);
    }

    const migrationFile = migrations[version][action];
    if (!migrationFile) {
      console.error(`❌ No ${action} migration found for version ${version}`);
      process.exit(1);
    }

    // Read migration file
    const filePath = path.join(__dirname, migrationFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    // Execute migration
    console.log(`📄 Executing: ${migrationFile}`);
    await pool.query(sql);

    console.log(`\n✅ Migration ${action} to v${version} completed successfully!`);

    // Show current schema version
    try {
      const result = await pool.query(
        'SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 5'
      );
      if (result.rows.length > 0) {
        console.log('\n📋 Recent migrations:');
        result.rows.forEach(row => {
          console.log(`   - v${row.version}: ${row.description} (${new Date(row.applied_at).toLocaleString()})`);
        });
      }
    } catch (e) {
      // schema_migrations table might not exist yet
    }

  } catch (error) {
    console.error(`\n❌ Migration failed: ${error.message}`);
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0] || 'upgrade';
const version = args[1] || '1.1.0';

if (!['upgrade', 'rollback'].includes(action)) {
  console.error('Usage: node run_migration.js [upgrade|rollback] [version]');
  console.error('  action: upgrade or rollback');
  console.error('  version: migration version (e.g., 1.1.0)');
  process.exit(1);
}

runMigration(action, version);
