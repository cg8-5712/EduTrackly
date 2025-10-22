#!/usr/bin/env node

/**
 * CLI tool to create admin accounts with hashed passwords
 * Usage: node src/utils/admin/create-admin.js
 */

import readline from 'readline';
import db from '../db/db_connector.js';
import { hashPassword } from '../../services/auth.js';
import logger from '../../middleware/loggerMiddleware.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n=== Create New Admin Account ===\n');

    // Get password
    const password = await question('Enter password: ');

    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await question('Confirm password: ');

    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\n🔒 Hashing password...');
    const hashedPassword = await hashPassword(password);

    // Insert into database
    console.log('💾 Creating admin account...');
    const result = await db.query(
      'INSERT INTO admin (password, ip) VALUES ($1, $2) RETURNING aid',
      [hashedPassword, '0.0.0.0']
    );

    const aid = result.rows[0].aid;

    console.log(`\n✅ Admin account created successfully!`);
    console.log(`   Admin ID: ${aid}`);
    console.log(`   Password: [hashed with bcrypt]`);
    console.log(`\nYou can now login with this password.\n`);

    logger.info('New admin account created', { aid });

  } catch (error) {
    console.error('\n❌ Failed to create admin account:', error.message);
    logger.error('Admin creation failed', { error: error.message });
    process.exit(1);
  } finally {
    rl.close();
    await db.end();
  }
}

createAdmin();
