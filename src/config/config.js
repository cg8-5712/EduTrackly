import dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

const config = {
    app: {
        port: process.env.SREVER_PORT || 3000,
        env: process.env.NODE_ENV || 'debug',
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        name: process.env.DB_NAME || 'EduTrackly',
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expires: process.env.JWT_EXPIRE || '3600',
    }
};

export default config;