# Development Workflow Guide

This document provides a comprehensive guide for the Collex development workflow, including the new watch commands and development server setup.

## 🚀 Quick Start

### Recommended Development Setup

```bash
# Start comprehensive development environment
make dev-server

# This single command will:
# 1. Check and install dependencies (Air for hot reload)
# 2. Generate TypeScript types from Go entities
# 3. Check database connection
# 4. Start the backend server in watch mode
```

## 📋 Available Watch Commands

### 1. `make watch`

**Simple watch mode for local development**

```bash
make watch
```

**What it does:**

- Starts the backend server in watch mode using Air
- Automatically rebuilds on Go file changes
- Server available at `http://localhost:8080`
- Health check at `http://localhost:8080/health`

**Use when:**

- You want a simple development server
- Types are already generated
- Database is already configured

### 2. `make watch-full`

**Full development with type generation**

```bash
make watch-full
```

**What it does:**

- Generates TypeScript types from Go entities
- Starts the backend server in watch mode
- Provides comprehensive development setup
- Shows all available endpoints

**Use when:**

- Starting fresh development session
- You've made changes to Go entities
- You want the complete development experience

### 3. `make watch-backend`

**Backend-only watch mode**

```bash
make watch-backend
```

**What it does:**

- Starts backend server in watch mode
- Assumes types are already generated
- Shows backend-specific endpoints
- Optimized for backend-only development

**Use when:**

- Types are already generated
- You're only working on backend code
- You want faster startup time

### 4. `make dev-server`

**Comprehensive development server (Recommended)**

```bash
make dev-server
```

**What it does:**

- Checks and installs dependencies (Air)
- Creates .env file from template if missing
- Checks database connection
- Generates TypeScript types
- Starts server in watch mode
- Provides detailed server information

**Use when:**

- Starting a new development session
- You want the most comprehensive setup
- You need dependency checking and setup

### 5. `make dev-server-no-types`

**Development server without type generation**

```bash
make dev-server-no-types
```

**What it does:**

- Skips TypeScript type generation
- Performs all other setup tasks
- Starts server in watch mode

**Use when:**

- Types are already up to date
- You want faster startup
- You're only working on backend logic

### 6. `make dev-server-no-db`

**Development server without database check**

```bash
make dev-server-no-db
```

**What it does:**

- Skips database connection check
- Performs all other setup tasks
- Starts server in watch mode

**Use when:**

- Database is not available
- You're working offline
- You want to test without database

## 🔧 Development Server Script

The development server script (`scripts/dev-server.sh`) provides additional functionality:

### Features

- **Dependency Checking**: Automatically installs Air if missing
- **Environment Setup**: Creates .env file from template
- **Database Validation**: Checks database connectivity
- **Type Generation**: Generates TypeScript types from Go
- **Comprehensive Logging**: Detailed startup information
- **Error Handling**: Graceful error handling and recovery

### Usage

```bash
# Full development setup
./scripts/dev-server.sh

# Skip type generation
./scripts/dev-server.sh --no-types

# Skip database check
./scripts/dev-server.sh --no-db-check

# Show help
./scripts/dev-server.sh --help
```

## 🌐 Development Endpoints

When running in development mode, the following endpoints are available:

### Backend API

- **Base URL**: `http://localhost:8080`
- **Health Check**: `http://localhost:8080/health`
- **Readiness Check**: `http://localhost:8080/ready`
- **Liveness Check**: `http://localhost:8080/live`
- **Database Health**: `http://localhost:8080/health/database`
- **Detailed Health**: `http://localhost:8080/health/detailed`
- **Metrics**: `http://localhost:8080/metrics`
- **API Routes**: `http://localhost:8080/api/*`

### Frontend (if running)

- **Development**: `http://localhost:5173` (Vite dev server)
- **Production**: `http://localhost:7071` (Nginx)

## 🔄 Hot Reload Features

### Backend Hot Reload (Air)

- **Automatic Rebuild**: Go files are watched and rebuilt automatically
- **Fast Restart**: Only restarts when necessary
- **Error Recovery**: Continues running after fixing errors
- **Build Logs**: Shows detailed build information

### Frontend Hot Reload (Vite)

- **Instant Updates**: React components update without page refresh
- **State Preservation**: Component state is preserved during updates
- **Error Overlay**: Shows compilation errors in browser
- **Source Maps**: Full debugging support

## 🗄️ Database Integration

### Development Database

```bash
# Start development database
make docker-dev

# Or connect to existing database
# Update .env with your database configuration
```

### Database Health Monitoring

```bash
# Check database health
curl http://localhost:8080/health/database

# View connection pool statistics
curl http://localhost:8080/metrics
```

## 📝 Type Generation Integration

### Automatic Type Generation

```bash
# Generate types before starting server
make generate-types-enhanced

# Or let the development server handle it
make dev-server
```

### Type Generation Workflow

1. **Modify Go entities** with `// tygo:emit` comments
2. **Run type generation** (automatic with `make dev-server`)
3. **Use generated types** in frontend
4. **Hot reload** updates types automatically

## 🐛 Debugging

### Backend Debugging

```bash
# View Air logs
# Air shows detailed build logs in the terminal

# Check server logs
curl http://localhost:8080/health/detailed

# Database connection issues
curl http://localhost:8080/health/database
```

### Common Issues

#### Air Not Found

```bash
# Install Air manually
go install github.com/cosmtrek/air@latest

# Or let the script handle it
make dev-server
```

#### Database Connection Issues

```bash
# Check database configuration
cat .env

# Start database
make docker-dev

# Test connection
make dev-server-no-db
```

#### Type Generation Issues

```bash
# Generate types manually
make generate-types-enhanced

# Check type generation
make test-types
```

## 🚀 Production vs Development

### Development Mode Features

- **Hot Reload**: Automatic code reloading
- **Debug Logging**: Verbose logging for debugging
- **Type Generation**: Automatic TypeScript type generation
- **Database Extensions**: Development-specific PostgreSQL extensions
- **Relaxed Security**: Development-friendly settings

### Production Mode Features

- **Optimized Build**: Compiled binary with optimizations
- **Security Hardening**: Production security settings
- **Resource Limits**: CPU and memory limits
- **Health Monitoring**: Comprehensive health checks
- **Logging**: Structured logging with rotation

## 📊 Monitoring and Health Checks

### Health Check Endpoints

| Endpoint           | Description          | Use Case                    |
| ------------------ | -------------------- | --------------------------- |
| `/health`          | Basic health check   | Load balancer health checks |
| `/ready`           | Readiness check      | Kubernetes readiness probes |
| `/live`            | Liveness check       | Kubernetes liveness probes  |
| `/health/detailed` | Comprehensive health | Debugging and monitoring    |
| `/health/database` | Database health      | Database monitoring         |
| `/metrics`         | Prometheus metrics   | Monitoring and alerting     |

### Development Monitoring

```bash
# Monitor server health
watch -n 5 'curl -s http://localhost:8080/health | jq'

# Monitor database health
watch -n 5 'curl -s http://localhost:8080/health/database | jq'

# View metrics
curl http://localhost:8080/metrics
```

## 🎯 Best Practices

### Development Workflow

1. **Start with `make dev-server`** for comprehensive setup
2. **Use `make watch-backend`** for quick backend iterations
3. **Generate types** when modifying Go entities
4. **Check health endpoints** for debugging
5. **Use container development** for full-stack testing

### Code Organization

1. **Keep entities simple** with clear `// tygo:emit` comments
2. **Use meaningful names** for API endpoints
3. **Implement proper error handling** with health checks
4. **Write tests** for new features
5. **Document API changes** in health endpoints

### Performance

1. **Use connection pooling** for database operations
2. **Monitor connection statistics** via health endpoints
3. **Optimize queries** based on metrics
4. **Use caching** where appropriate
5. **Profile performance** with built-in metrics

## 🔗 Related Documentation

- [Container Setup Guide](CONTAINER_SETUP.md) - Container-based development
- [Database Integration Guide](DATABASE_INTEGRATION.md) - Database setup and management
- [Type Generation Setup](TYPE_GENERATION_SETUP.md) - TypeScript type generation

## 🆘 Troubleshooting

### Common Commands

```bash
# Check what's running
make container-status

# View logs
make docker-dev-logs

# Clean and restart
make container-clean && make docker-dev

# Check dependencies
go version
air --version
```

### Getting Help

1. **Check health endpoints** for service status
2. **Review logs** for error messages
3. **Verify configuration** in .env files
4. **Test database connection** separately
5. **Check documentation** for specific issues

For additional support, refer to the main [README](../README.md) or create an issue in the repository.
