-- =====================================================
-- EduTrackly Database Rollback Script
-- From: v1.1.0 (with rate limiting)
-- To: v1.0.0 (original schema)
-- =====================================================
--
-- WARNING: This will remove the rate_limit_config table and all its data!
--
-- Usage:
--   psql -U your_user -d your_database -f rollback_v1.1_to_v1.0.sql
--
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Drop rate_limit_config table
-- =====================================================
DROP TABLE IF EXISTS rate_limit_config CASCADE;

RAISE NOTICE 'Dropped table: rate_limit_config';

-- =====================================================
-- Step 2: Remove migration record
-- =====================================================
DELETE FROM schema_migrations WHERE version = '1.1.0';

RAISE NOTICE 'Rollback to v1.0.0 completed successfully!';

COMMIT;
