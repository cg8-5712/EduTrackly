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

    // Get role
    console.log('\nAvailable roles:');
    console.log('  1. admin (default) - Can only manage assigned classes');
    console.log('  2. superadmin - Can manage all classes and admins');

    const roleChoice = await question('\nSelect role (1 or 2, default: 1): ');
    const role = roleChoice === '2' ? 'superadmin' : 'admin';

    // Hash password
    console.log('\n🔒 Hashing password...');
    const hashedPassword = await hashPassword(password);

    // Insert into database
    console.log('💾 Creating admin account...');
    const result = await db.query(
      'INSERT INTO admin (password, role, ip) VALUES ($1, $2, $3) RETURNING aid, role',
      [hashedPassword, role, '0.0.0.0']
    );

    const admin = result.rows[0];

    console.log(`\n✅ Admin account created successfully!`);
    console.log(`   Admin ID: ${admin.aid}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password: [hashed with bcrypt]`);

    if (role === 'admin') {
      console.log(`\n📝 Note: This is a regular admin account.`);
      console.log(`   Use superadmin to assign classes to this admin.`);
    } else {
      console.log(`\n👑 Note: This is a superadmin account.`);
      console.log(`   This account can manage all classes and other admins.`);
    }

    console.log(`\nYou can now login with your password.\n`);

    logger.info('New admin account created', { aid: admin.aid, role: admin.role });

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
