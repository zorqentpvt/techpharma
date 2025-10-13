# Database Integration Guide

## Overview

This document describes the enhanced PostgreSQL database integration with connection pooling and migration system implemented in the Collex application.

## Features

### 🔗 Connection Pooling

- **Configurable Pool Size**: Adjustable max open and idle connections
- **Connection Lifecycle Management**: Automatic connection cleanup and renewal
- **Performance Monitoring**: Real-time connection pool statistics
- **Health Checks**: Comprehensive database health monitoring

### 🗄️ Migration System

- **Version Control**: Sequential migration versioning
- **Rollback Support**: Safe rollback capabilities
- **Entity-Based**: Automatic table creation from Go entities
- **Custom Migrations**: Support for custom SQL migrations

### 📊 Monitoring & Health

- **Connection Statistics**: Real-time pool metrics
- **Health Endpoints**: Multiple health check endpoints
- **Prometheus Metrics**: Database metrics for monitoring
- **Performance Indexes**: Optimized database indexes

## Configuration

### Environment Variables

| Variable                | Description              | Default      | Example           |
| ----------------------- | ------------------------ | ------------ | ----------------- |
| `DB_HOST`               | Database host            | `localhost`  | `db.example.com`  |
| `DB_PORT`               | Database port            | `5432`       | `5432`            |
| `DB_USER`               | Database user            | `postgres`   | `collex_user`     |
| `DB_PASSWORD`           | Database password        | `postgres`   | `secure_password` |
| `DB_NAME`               | Database name            | `collex`     | `collex_prod`     |
| `DB_SSL_MODE`           | SSL mode                 | `disable`    | `require`         |
| `DB_MAX_OPEN_CONNS`     | Max open connections     | `100`        | `200`             |
| `DB_MAX_IDLE_CONNS`     | Max idle connections     | `10`         | `20`              |
| `DB_CONN_MAX_LIFETIME`  | Connection max lifetime  | `1h`         | `2h`              |
| `DB_CONN_MAX_IDLE_TIME` | Connection max idle time | `30m`        | `1h`              |
| `DB_AUTO_MIGRATE`       | Auto migrate on startup  | `true`       | `false`           |
| `DB_MIGRATE_PATH`       | Migrations directory     | `migrations` | `db/migrations`   |

### Example Configuration

```bash
# Production Configuration
DB_HOST=db.example.com
DB_PORT=5432
DB_USER=collex_user
DB_PASSWORD=secure_password_here
DB_NAME=collex_production
DB_SSL_MODE=require
DB_MAX_OPEN_CONNS=200
DB_MAX_IDLE_CONNS=20
DB_CONN_MAX_LIFETIME=2h
DB_CONN_MAX_IDLE_TIME=1h
DB_AUTO_MIGRATE=false
DB_MIGRATE_PATH=db/migrations
```

## Connection Pooling

### Pool Configuration

The connection pool is configured with the following parameters:

```go
// Connection pool settings
MaxOpenConns:    100,  // Maximum number of open connections
MaxIdleConns:    10,   // Maximum number of idle connections
ConnMaxLifetime: 1h,   // Maximum lifetime of a connection
ConnMaxIdleTime: 30m,  // Maximum idle time of a connection
```

### Pool Statistics

Monitor connection pool health through the `/health/database` endpoint:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "database": {
    "connectivity": "healthy",
    "pool_stats": {
      "max_open_connections": 100,
      "open_connections": 5,
      "in_use": 2,
      "idle": 3,
      "wait_count": 0,
      "wait_duration": "0s",
      "max_idle_closed": 0,
      "max_idle_time_closed": 0,
      "max_lifetime_closed": 0
    }
  }
}
```

## Migration System

### Migration Commands

```bash
# Run all pending migrations
make migrate

# Check migration status
make migrate-status

# Create new migration
make migrate-create

# Rollback specific migration
make migrate-rollback
```

### Migration File Structure

Migrations are stored in the `migrations/` directory with the following naming convention:

```
migrations/
├── 001_initial_schema.sql
├── 001_rollback.sql
├── 002_add_user_preferences.sql
├── 002_rollback.sql
└── 003_create_audit_tables.sql
```

### Creating Migrations

1. **Using Make Command**:

   ```bash
   make migrate-create
   # Enter description: "add user preferences table"
   ```

2. **Manual Creation**:

   ```bash
   # Create migration file
   touch migrations/002_add_user_preferences.sql

   # Add SQL content
   echo "-- Add your migration SQL here" > migrations/002_add_user_preferences.sql
   ```

### Migration File Format

```sql
-- Migration: Add User Preferences
-- Version: 002
-- Description: Add user preferences table
-- Created: 2024-01-01T12:00:00Z

-- Create user preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### Rollback Files

Each migration should have a corresponding rollback file:

```sql
-- Rollback Migration: Add User Preferences
-- Version: 002
-- Description: Rollback add user preferences table
-- Created: 2024-01-01T12:00:00Z

-- Drop index
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Drop table
DROP TABLE IF EXISTS user_preferences;
```

## Entity-Based Migrations

### Automatic Table Creation

The system automatically creates tables from Go entities with `// tygo:emit` comments:

```go
// tygo:emit
type User struct {
    BaseModel
    PhoneNumber string `gorm:"type:varchar(20);uniqueIndex;not null" json:"phoneNumber"`
    Email       *string `gorm:"type:varchar(100);uniqueIndex" json:"email,omitempty"`
    // ... other fields
}
```

### Base Models

The system provides several base models for common patterns:

- **BaseModel**: Basic fields (ID, timestamps, soft delete)
- **AuditableEntity**: Adds audit trail fields
- **SoftDeletableEntity**: Adds soft delete functionality
- **BusinessScopedEntity**: Adds business-level isolation
- **VersionedEntity**: Adds optimistic locking

## Health Monitoring

### Health Endpoints

| Endpoint           | Description              | Response                         |
| ------------------ | ------------------------ | -------------------------------- |
| `/health`          | Basic health check       | Status, timestamp, uptime        |
| `/ready`           | Readiness check          | Includes database connectivity   |
| `/live`            | Liveness check           | Simple alive status              |
| `/health/detailed` | Comprehensive health     | All services and resources       |
| `/health/database` | Database-specific health | Connection pool stats            |
| `/metrics`         | Prometheus metrics       | Database and application metrics |

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": "1h 30m 45s",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "memory": "healthy",
    "disk": "healthy"
  }
}
```

## Performance Optimization

### Database Indexes

The system automatically creates optimized indexes:

```sql
-- User-related indexes
CREATE INDEX idx_users_phone_status ON users(phone_number, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_status ON users(email, status) WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Session indexes
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active) WHERE deleted_at IS NULL;

-- Activity indexes
CREATE INDEX idx_user_activities_user_type ON user_activities(user_id, activity_type) WHERE deleted_at IS NULL;

-- Role and permission indexes
CREATE INDEX idx_roles_category_active ON roles(category, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_permissions_module_resource ON permissions(module, resource) WHERE deleted_at IS NULL;
```

### Connection Pool Tuning

For production environments, consider these settings:

```bash
# High-traffic application
DB_MAX_OPEN_CONNS=200
DB_MAX_IDLE_CONNS=20
DB_CONN_MAX_LIFETIME=2h
DB_CONN_MAX_IDLE_TIME=1h

# Low-traffic application
DB_MAX_OPEN_CONNS=50
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=30m
```

## Development Workflow

### 1. Adding New Entities

1. Create entity with `// tygo:emit` comment:

   ```go
   // tygo:emit
   type NewEntity struct {
       BaseModel
       Name string `gorm:"type:varchar(100);not null" json:"name"`
   }
   ```

2. The entity will be automatically migrated on startup

### 2. Custom Migrations

1. Create migration file:

   ```bash
   make migrate-create
   ```

2. Add SQL content to the generated file

3. Run migrations:
   ```bash
   make migrate
   ```

### 3. Testing Migrations

1. Check migration status:

   ```bash
   make migrate-status
   ```

2. Test rollback (if needed):
   ```bash
   make migrate-rollback
   ```

## Production Deployment

### 1. Database Setup

```bash
# Create production database
createdb collex_production

# Set production environment variables
export DB_HOST=db.example.com
export DB_USER=collex_user
export DB_PASSWORD=secure_password
export DB_NAME=collex_production
export DB_SSL_MODE=require
export DB_AUTO_MIGRATE=false
```

### 2. Run Migrations

```bash
# Run migrations manually in production
make migrate
```

### 3. Monitor Health

```bash
# Check database health
curl http://localhost:8080/health/database

# Check overall health
curl http://localhost:8080/health/detailed
```

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**

   - Increase `DB_MAX_OPEN_CONNS`
   - Check for connection leaks
   - Monitor connection usage

2. **Migration Failures**

   - Check migration file syntax
   - Verify database permissions
   - Review migration logs

3. **Performance Issues**
   - Check connection pool statistics
   - Review database indexes
   - Monitor query performance

### Debug Commands

```bash
# Check connection pool stats
curl http://localhost:8080/health/database

# View migration status
make migrate-status

# Test database connectivity
curl http://localhost:8080/ready
```

## Best Practices

### 1. Connection Pool Management

- Set appropriate pool sizes based on load
- Monitor connection usage regularly
- Use connection timeouts

### 2. Migration Management

- Always create rollback files
- Test migrations in staging first
- Use descriptive migration names

### 3. Performance Monitoring

- Monitor connection pool statistics
- Track database query performance
- Set up alerts for health checks

### 4. Security

- Use SSL connections in production
- Implement proper access controls
- Regular security updates

## Future Enhancements

- [ ] Database connection pooling with PgBouncer
- [ ] Read replica support
- [ ] Database sharding
- [ ] Advanced migration features
- [ ] Performance analytics dashboard
- [ ] Automated backup integration
