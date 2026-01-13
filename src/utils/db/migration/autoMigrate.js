// src/utils/db/migration/autoMigrate.js
// Automatic database migration runner
// Scans migration directory and runs pending migrations in order

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse migration filename to extract version and description
 * Supports formats:
 *   - v1.0.0_description.sql
 *   - v1.1.0_rate_limit.sql
 *   - 001_initial_schema.sql
 * @param {string} filename
 * @returns {{ version: string, description: string } | null}
 */
function parseMigrationFilename(filename) {
  // Match v{major}.{minor}.{patch}_{description}.sql
  const versionMatch = filename.match(/^v?(\d+\.\d+\.\d+)_(.+)\.sql$/i);
  if (versionMatch) {
    return {
      version: versionMatch[1],
      description: versionMatch[2].replace(/_/g, ' ')
    };
  }

  // Match {number}_{description}.sql (e.g., 001_initial.sql)
  const numericMatch = filename.match(/^(\d{3,})_(.+)\.sql$/);
  if (numericMatch) {
    return {
      version: numericMatch[1],
      description: numericMatch[2].replace(/_/g, ' ')
    };
  }

  return null;
}

/**
 * Compare two version strings
 * @param {string} a
 * @param {string} b
 * @returns {number} -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a, b) {
  // Handle numeric-only versions (001, 002, etc.)
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    return parseInt(a) - parseInt(b);
  }

  // Handle semantic versions (1.0.0, 1.1.0, etc.)
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) {
      return numA - numB;
    }
  }
  return 0;
}

/**
 * Calculate MD5 checksum of file content
 * @param {string} content
 * @returns {string}
 */
function calculateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get list of migration files from the migration directory
 * @param {string[]} excludeFiles - Files to exclude (e.g., schema.sql, mock.sql)
 * @returns {Array<{ filename: string, version: string, description: string, filepath: string }>}
 */
function getMigrationFiles(excludeFiles = ['schema.sql', 'mock.sql']) {
  const migrationDir = __dirname;
  const files = fs.readdirSync(migrationDir);

  const migrations = files
    .filter(f => f.endsWith('.sql') && !excludeFiles.includes(f))
    .map(filename => {
      const parsed = parseMigrationFilename(filename);
      if (!parsed) return null;

      return {
        filename,
        version: parsed.version,
        description: parsed.description,
        filepath: path.join(migrationDir, filename)
      };
    })
    .filter(Boolean)
    .sort((a, b) => compareVersions(a.version, b.version));

  return migrations;
}

/**
 * Ensure schema_migrations table exists
 * @param {import('pg').Pool} db
 */
async function ensureMigrationsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      filename VARCHAR(255) NOT NULL,
      description VARCHAR(500),
      checksum VARCHAR(64),
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER
    )
  `);
}

/**
 * Get list of already applied migrations
 * @param {import('pg').Pool} db
 * @returns {Promise<Map<string, { checksum: string, applied_at: Date }>>}
 */
async function getAppliedMigrations(db) {
  const result = await db.query(
    'SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version'
  );

  const applied = new Map();
  for (const row of result.rows) {
    applied.set(row.version, {
      checksum: row.checksum,
      applied_at: row.applied_at
    });
  }
  return applied;
}

/**
 * Run a single migration
 * @param {import('pg').Pool} db
 * @param {{ filename: string, version: string, description: string, filepath: string }} migration
 * @param {object} logger
 * @returns {Promise<{ success: boolean, executionTime: number }>}
 */
async function runMigration(db, migration, logger) {
  const sql = fs.readFileSync(migration.filepath, 'utf-8');
  const checksum = calculateChecksum(sql);

  const startTime = Date.now();

  // Run migration in a transaction
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(sql);

    // Record the migration
    await client.query(
      `INSERT INTO schema_migrations (version, filename, description, checksum, execution_time_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [migration.version, migration.filename, migration.description, checksum, Date.now() - startTime]
    );

    await client.query('COMMIT');

    return {
      success: true,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 * @param {import('pg').Pool} db - Database connection pool
 * @param {object} logger - Logger instance
 * @param {object} options - Options
 * @param {boolean} options.dryRun - If true, only show what would be run
 * @returns {Promise<{ applied: number, skipped: number, errors: string[] }>}
 */
export async function runAutoMigrations(db, logger, options = {}) {
  const { dryRun = false } = options;

  logger.info('Starting auto migration check...');

  // Ensure migrations table exists
  await ensureMigrationsTable(db);

  // Get all migration files
  const migrationFiles = getMigrationFiles();
  logger.info(`Found ${migrationFiles.length} migration file(s)`);

  // Get already applied migrations
  const appliedMigrations = await getAppliedMigrations(db);
  logger.info(`${appliedMigrations.size} migration(s) already applied`);

  // Find pending migrations
  const pendingMigrations = migrationFiles.filter(m => !appliedMigrations.has(m.version));

  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations');
    return { applied: 0, skipped: migrationFiles.length, errors: [] };
  }

  logger.info(`${pendingMigrations.length} pending migration(s) to apply`);

  if (dryRun) {
    logger.info('[DRY RUN] Would apply the following migrations:');
    for (const m of pendingMigrations) {
      logger.info(`  - v${m.version}: ${m.description} (${m.filename})`);
    }
    return { applied: 0, skipped: appliedMigrations.size, errors: [] };
  }

  // Apply pending migrations in order
  let applied = 0;
  const errors = [];

  for (const migration of pendingMigrations) {
    logger.info(`Applying migration v${migration.version}: ${migration.description}...`);

    try {
      const result = await runMigration(db, migration, logger);
      logger.info(`Migration v${migration.version} applied successfully (${result.executionTime}ms)`);
      applied++;
    } catch (error) {
      const errorMsg = `Migration v${migration.version} failed: ${error.message}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
      // Stop on first error to prevent cascading failures
      break;
    }
  }

  return {
    applied,
    skipped: appliedMigrations.size,
    errors
  };
}

/**
 * Check for checksum mismatches (migration files changed after being applied)
 * @param {import('pg').Pool} db
 * @param {object} logger
 * @returns {Promise<string[]>} List of warnings for mismatched migrations
 */
export async function checkMigrationIntegrity(db, logger) {
  const warnings = [];

  try {
    await ensureMigrationsTable(db);

    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(db);

    for (const file of migrationFiles) {
      const applied = appliedMigrations.get(file.version);
      if (applied) {
        const content = fs.readFileSync(file.filepath, 'utf-8');
        const currentChecksum = calculateChecksum(content);

        if (applied.checksum && applied.checksum !== currentChecksum) {
          const warning = `Migration v${file.version} has been modified since it was applied`;
          warnings.push(warning);
          logger.warn(warning);
        }
      }
    }
  } catch (error) {
    logger.error(`Failed to check migration integrity: ${error.message}`);
  }

  return warnings;
}

export default {
  runAutoMigrations,
  checkMigrationIntegrity,
  getMigrationFiles,
  parseMigrationFilename,
  compareVersions
};
