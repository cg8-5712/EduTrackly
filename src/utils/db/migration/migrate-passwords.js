// Migration script to hash existing plaintext passwords
// Run this ONCE to migrate existing passwords to bcrypt hashes

import db from '../db_connector.js';
import bcrypt from 'bcrypt';
import logger from '../../../middleware/loggerMiddleware.js';

const SALT_ROUNDS = 10;

async function migratePasswords() {
  try {
    logger.info('Starting password migration...');

    // Get all admin accounts
    const result = await db.query('SELECT aid, password FROM admin');

    if (result.rowCount === 0) {
      logger.info('No admin accounts found.');
      return;
    }

    logger.info(`Found ${result.rowCount} admin account(s) to migrate`);

    for (const admin of result.rows) {
      const { aid, password } = admin;

      // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
      if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
        logger.info(`Admin ${aid}: Password already hashed, skipping`);
        continue;
      }

      // Hash the plaintext password
      logger.info(`Admin ${aid}: Hashing password...`);
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Update the database
      await db.query(
        'UPDATE admin SET password = $1 WHERE aid = $2',
        [hashedPassword, aid]
      );

      logger.info(`Admin ${aid}: Password successfully hashed`);
    }

    logger.info('Password migration completed successfully!');
  } catch (error) {
    logger.error('Password migration failed:', {
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    throw error;
  } finally {
    await db.end();
  }
}

// Run migration
migratePasswords()
  .then(() => {
    console.log('✓ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  });
