# Container Setup Guide

This document provides a comprehensive guide for running the Collex application using containers with both Docker and Podman support.

## 🏗️ Container Architecture

### Multi-Stage Dockerfile

The application uses a sophisticated multi-stage Dockerfile with the following targets:

- **`prod`**: Production Go backend (Alpine-based, compiled binary)
- **`dev`**: Development Go backend (with Air hot reload)
- **`client`**: Production frontend (Nginx serving static files)
- **`client-dev`**: Development frontend (Vite dev server with HMR)
- **`migrate`**: Database migration tool
- **`migrate-runtime`**: Migration tool runtime

### Production Setup (`docker-compose.yml`)

- **Backend**: Go application with Alpine Linux base (`prod` target)
- **Frontend**: React SPA served by Nginx (`client` target)
- **Database**: PostgreSQL 15 with persistent storage and extensions
- **Migration**: Optional migration service for database management
- **Resource Limits**: Optimized for production workloads
- **Networking**: Custom bridge network with health checks
- **Security**: Non-root user, security headers, SSL support

### Development Setup (`docker-compose.dev.yml`)

- **Backend**: Go application with Air hot reload (`dev` target)
- **Frontend**: Vite development server with HMR (`client-dev` target)
- **Database**: PostgreSQL 15 for development with extensions
- **Redis**: Optional Redis cache for development
- **Hot Reload**: Both backend and frontend support hot reload
- **No Resource Limits**: Optimized for development workflow
- **Volume Mounts**: Source code mounted for live editing

## 🚀 Quick Start

### Prerequisites

- Docker or Podman installed
- Make utility installed
- Environment files configured

### Development Environment

```bash
# Start development containers with Docker
make docker-dev

# Start development containers with Podman
make podman-dev

# Start development with type generation
make dev-containers

# View container status
make container-status
```

### Production Environment

```bash
# Start production containers with Docker
make docker-run

# Start production containers with Podman
make podman-run

# View container status
make container-status
```

## 📋 Available Make Commands

### Container Management

```bash
# Production containers
make docker-build          # Build production images
make docker-run            # Start production containers
make docker-down           # Stop production containers
make docker-logs           # View production logs

make podman-build          # Build production images with Podman
make podman-run            # Start production with Podman
make podman-down           # Stop production with Podman
make podman-logs           # View production logs with Podman

# Development containers
make docker-dev            # Start development with Docker
make docker-dev-down       # Stop development with Docker
make docker-dev-logs       # View development logs with Docker

make podman-dev            # Start development with Podman
make podman-dev-down       # Stop development with Podman
make podman-dev-logs       # View development logs with Podman

# Container utilities
make container-status      # View container status
make container-clean       # Clean up containers and volumes
make container-rebuild     # Rebuild all containers
```

### Migration Commands

```bash
# Local migrations
make migrate               # Run database migrations
make migrate-status        # Check migration status
make migrate-create        # Create new migration
make migrate-rollback      # Rollback migration

# Container migrations
make container-migrate     # Run migrations in production container
make container-migrate-dev # Run migrations in development container
```

### Development Workflow

```bash
make dev-containers        # Generate types + start dev containers
make dev-build-deploy      # Full dev build and deploy workflow
make dev                   # Generate types + start local dev servers
```

## 🔧 Configuration

### Environment Files

- **`.env`**: Production environment variables (copy from `container/env.example`)
- **`.env.dev`**: Development environment variables (copy from `container/env.dev.example`)

### Production Environment Variables

```env
# Database Configuration
DB_NAME=collex
DB_USER=postgres
DB_PASSWORD=secure_password_here

# Connection Pool Settings
DB_MAX_OPEN_CONNS=100
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=30m

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRY=168h

# Application Configuration
APP_ENV=production
LOG_LEVEL=info
```

### Development Environment Variables

```env
# Database Configuration
DB_NAME=collex_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Development specific
APP_ENV=development
LOG_LEVEL=debug
DEBUG=true
CORS_ALLOWED_ORIGINS=http://localhost:7073,http://localhost:5173
```

## 📊 Service Ports

### Production

- **Backend API**: `http://localhost:7070`
- **Frontend**: `http://localhost:7071`
- **Database**: `localhost:5436`

### Development

- **Backend API**: `http://localhost:7072`
- **Frontend**: `http://localhost:7073`
- **Database**: `localhost:5435`
- **Redis**: `localhost:6379` (optional)

## 🏥 Health Checks

All services include comprehensive health checks:

### Production

- **Backend**: `http://localhost:7070/health`
- **Frontend**: `http://localhost:7071/`
- **Database**: PostgreSQL ready check

### Development

- **Backend**: `http://localhost:7072/health`
- **Frontend**: `http://localhost:7073/`
- **Database**: PostgreSQL ready check

### Health Endpoints

| Endpoint           | Description              | Response                         |
| ------------------ | ------------------------ | -------------------------------- |
| `/health`          | Basic health check       | Status, timestamp, uptime        |
| `/ready`           | Readiness check          | Includes database connectivity   |
| `/live`            | Liveness check           | Simple alive status              |
| `/health/detailed` | Comprehensive health     | All services and resources       |
| `/health/database` | Database-specific health | Connection pool stats            |
| `/metrics`         | Prometheus metrics       | Database and application metrics |

## 🔍 Monitoring & Logs

### View Container Status

```bash
make container-status
```

### View Container Logs

```bash
# Production logs
make docker-logs
make podman-logs

# Development logs
make docker-dev-logs
make podman-dev-logs
```

### Manual Log Access

```bash
# Production
docker logs -f collex-app
docker logs -f collex-client
docker logs -f collex-db

# Development
docker logs -f collex-app-dev
docker logs -f collex-client-dev
docker logs -f collex-db-dev
```

## 🛠️ Development Workflow

### Hot Reload Strategy

- **Backend**: Air automatically rebuilds on Go file changes (hot reload)
- **Frontend**: Vite development server with HMR (instant updates)
- **Database**: Persistent data during development
- **Type Generation**: Automatic TypeScript type generation from Go

### Development Features

- **Backend hot reload**: Go code changes trigger automatic rebuilds
- **Frontend HMR**: React components update instantly without page refresh
- **Type generation**: Automatic TypeScript type generation from Go
- **Volume mounts**: Source code mounted for live editing
- **Database extensions**: PostgreSQL extensions for development

### Debugging

1. **Backend**: Air provides detailed build logs with hot reload
2. **Frontend**: Vite dev server with source maps and HMR
3. **Database**: PostgreSQL logging with development-friendly settings
4. **Container logs**: Comprehensive logging for all services

## 🗄️ Database Integration

### PostgreSQL Extensions

The container setup includes essential PostgreSQL extensions:

- **uuid-ossp**: UUID generation
- **pg_stat_statements**: Query performance monitoring
- **pg_trgm**: Text similarity and indexing
- **btree_gin/btree_gist**: Advanced indexing
- **pgcrypto**: Cryptographic functions (dev only)
- **citext**: Case-insensitive text (dev only)

### Database Initialization

- **Production**: Optimized for performance with security settings
- **Development**: Verbose logging and development-friendly settings
- **Extensions**: Automatically installed and configured
- **Custom Functions**: Update triggers for timestamp management

### Migration System

- **Version Control**: Sequential migration versioning
- **Rollback Support**: Safe rollback capabilities
- **Container Integration**: Migration service for containerized deployments
- **Health Checks**: Migration status monitoring

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check for port usage
lsof -i :7072  # Backend dev
lsof -i :7073  # Frontend dev
lsof -i :7070  # Backend prod
lsof -i :7071  # Frontend prod
lsof -i :5435  # Database dev
lsof -i :5436  # Database prod
```

#### Container Issues

```bash
# Clean up everything
make container-clean

# Rebuild containers
make docker-dev-down && make docker-dev
```

#### Database Connection Issues

```bash
# Check database logs
docker logs collex-db-dev

# Connect to database directly
docker exec -it collex-db-dev psql -U postgres -d collex_dev
```

#### Volume Permission Issues (Podman)

```bash
# Fix SELinux context (if applicable)
sudo setsebool -P container_manage_cgroup on
```

#### Migration Issues

```bash
# Check migration status
make migrate-status

# Run migrations manually
make container-migrate-dev

# Check migration logs
docker logs collex-migrate-dev
```

### Performance Optimization

#### Development

- Use volume mounts for fast file changes
- Disable resource limits for better performance
- Use separate networks to avoid conflicts
- Enable Redis cache for better performance

#### Production

- Resource limits prevent resource exhaustion
- Health checks ensure service availability
- Logging rotation prevents disk space issues
- Security headers and SSL support

## 📁 File Structure

```
collex/
├── container/
│   ├── Dockerfile                    # Multi-stage build
│   ├── docker-compose.yml           # Production compose
│   ├── docker-compose.dev.yml       # Development compose
│   ├── nginx/
│   │   └── nginx-client.conf        # Nginx configuration
│   ├── scripts/
│   │   └── init-sql/
│   │       ├── prod/                # Production DB scripts
│   │       │   ├── init-db.sh
│   │       │   ├── init-pg-hba.sh
│   │       │   └── init-extensions.sh
│   │       └── dev/                 # Development DB scripts
│   │           ├── init-db.sh
│   │           ├── init-pg-hba.sh
│   │           └── init-extensions.sh
│   ├── env.example                  # Production environment template
│   └── env.dev.example              # Development environment template
├── .air.toml                        # Air configuration for hot reload
├── Makefile                         # Container management commands
└── docs/
    └── CONTAINER_SETUP.md          # This documentation
```

## 🔐 Security Considerations

### Production

- Non-root user in containers
- Resource limits prevent DoS
- Health checks for service monitoring
- Secure network configuration
- Security headers in Nginx
- SSL/TLS support
- Database authentication

### Development

- Relaxed security for development ease
- Volume mounts for code editing
- Debug logging enabled
- Development-friendly database settings

## 🎯 Best Practices

1. **Use development containers for active development**
2. **Use production containers for testing deployment**
3. **Regularly clean up unused containers and volumes**
4. **Monitor resource usage in production**
5. **Keep environment files secure and version controlled**
6. **Use health checks for monitoring**
7. **Implement proper logging and monitoring**
8. **Test migrations in development before production**

## 📞 Support

For issues or questions:

1. Check container logs: `make docker-logs` or `make docker-dev-logs`
2. Verify container status: `make container-status`
3. Clean and rebuild: `make container-clean && make docker-dev`
4. Check this documentation for troubleshooting steps
5. Review the database integration guide: `docs/DATABASE_INTEGRATION.md`

## 🔄 Migration from Existing Setup

If you're migrating from the existing container setup:

1. **Backup your data**: Export your database and any important files
2. **Update environment files**: Copy from the new examples
3. **Test the new setup**: Start with development containers
4. **Migrate data**: Use the migration system to update your database
5. **Update your workflow**: Use the new make commands

## 🚀 Advanced Features

### Custom Networks

The setup uses custom Docker networks for better isolation:

- **Production**: `collex-network` (172.20.0.0/16)
- **Development**: `collex-dev-network` (172.21.0.0/16)

### Volume Management

- **Persistent data**: Database data persists across container restarts
- **Log rotation**: Automatic log rotation prevents disk space issues
- **Cache volumes**: Go module cache and Vite cache for faster builds

### Health Monitoring

- **Comprehensive health checks**: All services have health endpoints
- **Connection pool monitoring**: Database connection statistics
- **Prometheus metrics**: Ready for monitoring integration

### Development Tools

- **Hot reload**: Both backend and frontend support hot reload
- **Type generation**: Automatic TypeScript type generation
- **Debug support**: Development-friendly logging and debugging
- **Extension support**: PostgreSQL extensions for development
