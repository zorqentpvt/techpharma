-- Migration: Initial Schema
-- Version: 001
-- Description: Initial schema
-- Created: 2024-01-01T00:00:00Z
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

CREATE TYPE role_category AS ENUM (
    'system',
    'management',
    'staff',
    'finance',
    'academic'
);

CREATE TYPE permission_action AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'manage',
    'admin'
);

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone_status ON users (phone_number, status)
WHERE
    deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status ON users (email, status)
WHERE
    deleted_at IS NULL
    AND email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active ON user_sessions (user_id, is_active)
WHERE
    deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_type ON user_activities (user_id, activity_type)
WHERE
    deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_category_active ON roles (category, is_active)
WHERE
    deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_module_resource ON permissions (module, resource)
WHERE
    deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_active ON user_roles (user_id, is_active)
WHERE
    deleted_at IS NULL;