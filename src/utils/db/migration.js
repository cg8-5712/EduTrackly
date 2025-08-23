// src/utils/db/migration.js
import db from './db_connector.js';
import logger from '../../middleware/loggerMiddleware.js';
import fs from 'fs';
import path from 'path';

const migrations = {
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
    }
};

export default migrations;
