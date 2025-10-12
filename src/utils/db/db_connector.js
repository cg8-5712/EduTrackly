// src/utils/db/db_connector.js
import pg from 'pg';
import logger from '../../middleware/loggerMiddleware.js';
import config from '../../config/config.js';

const { Pool } = pg;

class DatabaseConnector {
    constructor() {
        this.pool = null;
        this.config = {
            host: config.db.host,
            port: config.db.port,
            database: config.db.name,
            user: config.db.username,
            password: config.db.password,
            max: 20, // Maximum number of connections in pool
            idleTimeoutMillis: 30000, // Idle connection timeout
            connectionTimeoutMillis: 2000 // Connection timeout
        };
    }

    async initialize() {
        try {
            this.pool = new Pool(this.config);

            logger.debug('Database connection info: ', JSON.stringify(this.config, null, 2));

            // Test connection
            const client = await this.pool.connect();
            client.release();

            // Setup error handling
            this.pool.on('error', (err) => {
                logger.error('Database connection pool error:', err.message);
            });

            return true;
        } catch (error) {
            logger.error('Database connection failed:', error.message);
            throw error;
        }
    }

    async query(text, params) {
        try {
            const start = Date.now();
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;

            logger.debug(
                `Executing query: ${text} | Params: ${JSON.stringify(params)} | Duration: ${duration}ms | Rows returned: ${res.rowCount}`
            );
            return res;
        } catch (error) {
            logger.error(`Query execution failed: ${error.message} | SQL: ${text} | Params: ${JSON.stringify(params)}`);
            throw error;
        }
    }


    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        try {
            await this.pool.end();
            logger.info('Database connection closed');
        } catch (error) {
            logger.error('Failed to close database connection:', error.message);
            throw error;
        }
    }
}

// Create singleton instance
const db = new DatabaseConnector();

export default db;