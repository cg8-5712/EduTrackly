-- =====================================================
-- Migration: v1.0.0 -> v1.1.0
-- Version: 1.1.0
-- Description: Add rate limiting, admin roles, slogan table
-- =====================================================

-- 1. Create admin_role enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM ('superadmin', 'admin');
        RAISE NOTICE 'Created admin_role enum type';
    ELSE
        RAISE NOTICE 'admin_role enum type already exists, skipping';
    END IF;
END $$;

-- 2. Add role column to admin table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admin' AND column_name = 'role') THEN
        ALTER TABLE admin ADD COLUMN role admin_role NOT NULL DEFAULT 'admin';
        RAISE NOTICE 'Added role column to admin table';
    ELSE
        RAISE NOTICE 'role column already exists in admin table, skipping';
    END IF;
END $$;

-- 3. Create admin_class association table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_class') THEN
        CREATE TABLE admin_class (
            aid INTEGER NOT NULL REFERENCES admin(aid) ON DELETE CASCADE,
            cid INTEGER NOT NULL REFERENCES class(cid) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (aid, cid)
        );
        CREATE INDEX IF NOT EXISTS idx_admin_class_aid ON admin_class(aid);
        CREATE INDEX IF NOT EXISTS idx_admin_class_cid ON admin_class(cid);
        RAISE NOTICE 'Created admin_class table';
    ELSE
        RAISE NOTICE 'admin_class table already exists, skipping';
    END IF;
END $$;

-- 4. Create slogan table
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'slogan') THEN
        CREATE TABLE slogan (
            slid SERIAL PRIMARY KEY,
            cid INT NOT NULL REFERENCES class(cid) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_slogan_cid ON slogan(cid);
        RAISE NOTICE 'Created slogan table';
    ELSE
        RAISE NOTICE 'slogan table already exists, skipping';
    END IF;
END $$;

-- 5. Add is_slogan_display to setting table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'setting' AND column_name = 'is_slogan_display') THEN
        ALTER TABLE setting ADD COLUMN is_slogan_display BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_slogan_display column to setting table';
    ELSE
        RAISE NOTICE 'is_slogan_display column already exists in setting table, skipping';
    END IF;
END $$;

-- 6. Add updated_at to setting table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'setting' AND column_name = 'updated_at') THEN
        ALTER TABLE setting ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to setting table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in setting table, skipping';
    END IF;
END $$;

-- 7. Create rate_limit_config table
DO $$
BEGIN
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

        -- Insert default configurations
        INSERT INTO rate_limit_config (key, window_ms, max_requests, description) VALUES
        ('global', 60000, 100, '全局默认限制：每分钟 100 次'),
        ('auth', 60000, 10, '登录接口限制：每分钟 10 次'),
        ('write', 60000, 30, '写操作限制：每分钟 30 次'),
        ('read', 60000, 200, '读操作限制：每分钟 200 次');

        RAISE NOTICE 'Created rate_limit_config table with default data';
    ELSE
        RAISE NOTICE 'rate_limit_config table already exists, skipping';
    END IF;
END $$;
