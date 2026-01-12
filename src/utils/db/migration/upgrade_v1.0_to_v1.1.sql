-- =====================================================
-- EduTrackly Database Migration Script
-- From: v1.0.0 (original schema)
-- To: v1.1.0 (with rate limiting)
-- =====================================================
--
-- Usage:
--   psql -U your_user -d your_database -f upgrade_v1.0_to_v1.1.sql
--
-- This script is idempotent - safe to run multiple times
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Create migration tracking table (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    description VARCHAR(255),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Step 2: Check if migration already applied
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '1.1.0') THEN
        RAISE NOTICE 'Migration v1.1.0 already applied, skipping...';
        RETURN;
    END IF;

    -- =====================================================
    -- Step 3: Create rate_limit_config table
    -- =====================================================
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rate_limit_config') THEN
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

        RAISE NOTICE 'Created table: rate_limit_config';
    END IF;

    -- =====================================================
    -- Step 4: Insert default rate limit configurations
    -- =====================================================
    INSERT INTO rate_limit_config (key, window_ms, max_requests, description)
    VALUES
        ('global', 60000, 100, '全局默认限制：每分钟 100 次'),
        ('auth', 60000, 10, '登录接口限制：每分钟 10 次'),
        ('write', 60000, 30, '写操作限制：每分钟 30 次'),
        ('read', 60000, 200, '读操作限制：每分钟 200 次')
    ON CONFLICT (key) DO NOTHING;

    RAISE NOTICE 'Inserted default rate limit configurations';

    -- =====================================================
    -- Step 5: Record migration
    -- =====================================================
    INSERT INTO schema_migrations (version, description)
    VALUES ('1.1.0', 'Add rate_limit_config table for API rate limiting');

    RAISE NOTICE 'Migration v1.1.0 completed successfully!';
END $$;

COMMIT;
