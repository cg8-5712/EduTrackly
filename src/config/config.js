// /src/config/config.js
import dotenv from 'dotenv';

dotenv.config();

const config = {
  app: {
    port: process.env.SERVER_PORT || 3000,
    env: process.env.NODE_ENV || 'production',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    name: process.env.DB_NAME || 'EduTrackly',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expires: process.env.JWT_EXPIRE || '3600',
  },
  route: {
    prefix: process.env.ROUTE_PREFIX || '/api/v1',
  },
};

export default config;