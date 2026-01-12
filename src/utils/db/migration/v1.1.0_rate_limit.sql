-- =====================================================
-- Migration: Add rate_limit_config table
-- Version: 1.1.0
-- Description: Add rate limiting configuration table
-- =====================================================

-- Check if table exists before creating
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rate_limit_config') THEN
        -- Create rate_limit_config table
        CREATE TABLE rate_limit_config (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) UNIQUE NOT NULL,
            window_ms INTEGER NOT NULL DEFAULT 60000,
            max_requests INTEGER NOT NULL DEFAULT 100,
            description VARCHAR(255),
            enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert default configurations
        INSERT INTO rate_limit_config (key, window_ms, max_requests, description) VALUES
        ('global', 60000, 100, '全局默认限制：每分钟 100 次'),
        ('auth', 60000, 10, '登录接口限制：每分钟 10 次'),
        ('write', 60000, 30, '写操作限制：每分钟 30 次'),
        ('read', 60000, 200, '读操作限制：每分钟 200 次');

        RAISE NOTICE 'Table rate_limit_config created successfully with default data';
    ELSE
        RAISE NOTICE 'Table rate_limit_config already exists, skipping creation';
    END IF;
END $$;
