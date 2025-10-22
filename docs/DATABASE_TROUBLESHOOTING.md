# Database Troubleshooting Guide

This guide helps you resolve common database issues with the Collex application.

## 🚨 Common Issues

### 1. Permission Denied for Schema Public

**Error:**

```
ERROR: permission denied for schema public (SQLSTATE 42501)
```

**Cause:** The database user doesn't have sufficient permissions to create tables in the `public` schema.

**Solution:**

#### Option A: Use the Fix Script (Recommended)

```bash
# Fix database permissions automatically
make fix-db-permissions

# Or run the script directly
./scripts/fix-db-permissions.sh
```

#### Option B: Manual Fix

```bash
# Connect to your database as a superuser
psql -h localhost -p 5432 -U postgres -d collex

# Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT USAGE, CREATE ON SCHEMA public TO postgres;
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL PRIVILEGES ON DATABASE collex TO postgres;
```

### 2. Database Does Not Exist

**Error:**

```
FATAL: database "collex" does not exist (SQLSTATE 3D000)
```

**Cause:** The database hasn't been created yet.

**Solution:**

#### Option A: Create Database

```bash
# Create the database
createdb -h localhost -p 5432 -U postgres collex

# Or using psql
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE collex;"
```

#### Option B: Use Container Database

```bash
# Start development database container
make docker-dev

# This will create the database automatically
```

### 3. Environment Variables Not Loading

**Error:** Application uses default values instead of `.env` file values.

**Cause:** The `.env` file is missing or not being loaded.

**Solution:**

#### Option A: Create .env File

```bash
# Copy from template
cp container/env.example .env

# Or let the development script create it
make dev-server
```

#### Option B: Check .env File Location

```bash
# Make sure .env file is in the project root
ls -la .env

# Check file contents
cat .env
```

### 4. Connection Refused

**Error:**

```
dial tcp [::1]:5432: connect: connection refused
```

**Cause:** PostgreSQL is not running or not accessible.

**Solution:**

#### Check PostgreSQL Status

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Or check process
ps aux | grep postgres
```

#### Start PostgreSQL

```bash
# On macOS with Homebrew
brew services start postgresql

# On Ubuntu/Debian
sudo systemctl start postgresql

# On CentOS/RHEL
sudo systemctl start postgresql
```

### 5. Authentication Failed

**Error:**

```
FATAL: password authentication failed for user "postgres"
```

**Cause:** Incorrect password or user doesn't exist.

**Solution:**

#### Reset Password

```bash
# Connect as postgres user
sudo -u postgres psql

# Change password
ALTER USER postgres PASSWORD 'new_password';
```

#### Update .env File

```bash
# Update password in .env file
DB_PASSWORD=new_password
```

## 🔧 Database Setup Options

### Option 1: Local PostgreSQL Installation

1. **Install PostgreSQL:**

   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # CentOS/RHEL
   sudo yum install postgresql-server postgresql-contrib
   sudo postgresql-setup initdb
   sudo systemctl start postgresql
   ```

2. **Create Database:**

   ```bash
   createdb -U postgres collex
   ```

3. **Fix Permissions:**

   ```bash
   make fix-db-permissions
   ```

4. **Run Migrations:**
   ```bash
   make migrate
   ```

### Option 2: Docker Container Database

1. **Start Database Container:**

   ```bash
   make docker-dev
   ```

2. **Run Migrations:**
   ```bash
   make container-migrate-dev
   ```

### Option 3: Cloud Database

1. **Update .env File:**

   ```env
   DB_HOST=your-cloud-host.com
   DB_PORT=5432
   DB_NAME=collex
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_SSL_MODE=require
   ```

2. **Test Connection:**

   ```bash
   psql -h your-cloud-host.com -p 5432 -U your_username -d collex
   ```

3. **Run Migrations:**
   ```bash
   make migrate
   ```

## 🛠️ Troubleshooting Commands

### Check Database Connection

```bash
# Test connection
psql -h localhost -p 5432 -U postgres -d collex -c "SELECT 1;"

# Check database exists
psql -h localhost -p 5432 -U postgres -l | grep collex
```

### Check Permissions

```bash
# Check schema permissions
psql -h localhost -p 5432 -U postgres -d collex -c "\dn+ public"

# Check user permissions
psql -h localhost -p 5432 -U postgres -d collex -c "\du postgres"
```

### Check Environment Variables

```bash
# Check if .env file is loaded
make dev-server-no-db

# Check environment variables
env | grep DB_
```

### Check Migration Status

```bash
# Check migration status
make migrate-status

# Check migration table
psql -h localhost -p 5432 -U postgres -d collex -c "SELECT * FROM migrations;"
```

## 🔍 Debug Mode

### Enable Debug Logging

```bash
# Set debug mode in .env
LOG_LEVEL=debug
DEBUG=true

# Run with debug logging
make dev-server
```

### Check Application Logs

```bash
# View application logs
make docker-dev-logs

# Or check local logs
tail -f logs/app.log
```

## 📊 Health Checks

### Database Health Endpoints

```bash
# Basic health check
curl http://localhost:8080/health

# Database health check
curl http://localhost:8080/health/database

# Detailed health check
curl http://localhost:8080/health/detailed
```

### Connection Pool Statistics

```bash
# View connection pool stats
curl http://localhost:8080/metrics | grep database_connections
```

## 🚀 Quick Fixes

### Complete Reset

```bash
# Stop all containers
make docker-down
make docker-dev-down

# Clean up
make container-clean

# Start fresh
make docker-dev
make container-migrate-dev
```

### Local Database Reset

```bash
# Drop and recreate database
dropdb -U postgres collex
createdb -U postgres collex

# Fix permissions
make fix-db-permissions

# Run migrations
make migrate
```

### Environment Reset

```bash
# Remove .env file
rm .env

# Recreate with defaults
make dev-server-no-db
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the logs:**

   ```bash
   make docker-dev-logs
   ```

2. **Verify configuration:**

   ```bash
   cat .env
   ```

3. **Test database connection:**

   ```bash
   make fix-db-permissions
   ```

4. **Check application health:**

   ```bash
   curl http://localhost:8080/health/database
   ```

5. **Create an issue** in the repository with:
   - Error messages
   - Your `.env` configuration (without passwords)
   - Database setup method
   - Operating system information

## 🔗 Related Documentation

- [Database Integration Guide](DATABASE_INTEGRATION.md)
- [Container Setup Guide](CONTAINER_SETUP.md)
- [Development Workflow Guide](DEVELOPMENT_WORKFLOW.md)
