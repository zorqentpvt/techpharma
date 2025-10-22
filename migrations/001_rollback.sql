-- Rollback Migration: Initial Schema
-- Version: 001
-- Description: Rollback initial schema
-- Created: 2024-01-01T00:00:00Z
-- Drop indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_users_phone_status;

DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_status;

DROP INDEX CONCURRENTLY IF EXISTS idx_user_sessions_user_active;

DROP INDEX CONCURRENTLY IF EXISTS idx_user_activities_user_type;

DROP INDEX CONCURRENTLY IF EXISTS idx_roles_category_active;

DROP INDEX CONCURRENTLY IF EXISTS idx_permissions_module_resource;

DROP INDEX CONCURRENTLY IF EXISTS idx_user_roles_user_active;

-- Drop custom types
DROP TYPE IF EXISTS user_status;

DROP TYPE IF EXISTS role_category;

DROP TYPE IF EXISTS permission_action;