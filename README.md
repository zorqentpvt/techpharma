# Collex
 
A comprehensive collage management system built with Go and React, following Clean Architecture principles with advanced financial tracking capabilities.

## 🏗️ Architecture

Collex follows Clean Architecture principles with a clear separation of concerns:

- **Backend**: Go 1.23.1 with Gin HTTP framework and GORM ORM
- **Frontend**: React 19 with TypeScript, Vite, and TailwindCSS
- **Database**: PostgreSQL (production) / SQLite (development)
- **Type Safety**: Automatic Go-to-TypeScript type generation

## 🚀 Quick Start

### Prerequisites



- Go 1.23.1+
- Node.js 18+
- PostgreSQL (for production)
- Make

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/skryfon/collex.git
   cd collex
   ```

2. **Setup Backend**

   ```bash
   # Install Go dependencies
   make deps

   # Setup type generation
   make types-setup

   # Generate TypeScript types
   make generate-types-enhanced
   ```

3. **Setup Frontend**

   ```bash
   cd client
   npm install
   ```

4. **Environment Configuration**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your configuration
   # Key variables:
   # - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   # - JWT_SECRET_KEY
   # - SERVER_PORT
   ```

5. **Run the Application**

   ```bash
   # Development mode with hot reload
   make dev

   # Or run backend and frontend separately
   make run          # Backend
   cd client && npm run dev  # Frontend
   ```

## 📁 Project Structure

```
collex/
├── cmd/api/                    # Application entry point
├── internal/                   # Private application code
│   ├── delivery/http/         # HTTP handlers & middleware
│   │   ├── middleware/        # Auth, rate limiting, etc.
│   │   └── response/          # HTTP response utilities
│   ├── domain/                # Core business logic
│   │   ├── entity/            # Domain entities (GORM models)
│   │   ├── repository/        # Repository interfaces
│   │   ├── service/           # Domain services
│   │   └── errors/            # Domain errors
│   ├── infrastructure/        # External concerns
│   │   ├── persistence/       # Database implementations
│   │   ├── cache/             # Caching layer
│   │   ├── container/         # Dependency injection
│   │   └── server/            # HTTP server setup
│   ├── usecase/               # Application use cases
│   └── types/                 # API request/response types
├── pkg/                       # Public packages
│   ├── config/                # Configuration management
│   └── logger/                # Logging utilities
├── shared/                    # Shared types/constants
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── types/generated/   # Auto-generated TypeScript types
│   │   └── lib/               # Utility functions
│   └── package.json
├── scripts/                   # Build & utility scripts
├── docs/                      # Documentation
└── Makefile                   # Build automation
```

## 🛠️ Development

### Development Workflow

#### Quick Start (Recommended)

```bash
# Start comprehensive development environment
make dev-server

# This will:
# 1. Check dependencies and install Air if needed
# 2. Generate TypeScript types from Go entities
# 3. Check database connection
# 4. Start the backend server in watch mode
```

#### Alternative Development Options

```bash
# Full development with type generation
make watch-full

# Backend only (types already generated)
make watch-backend

# Simple watch mode
make watch

# Container-based development
make docker-dev
```

### Available Commands

#### Backend Development

```bash
make run              # Run the application
make dev              # Run with hot reload (requires air)
make watch            # Run local development server in watch mode
make watch-full       # Full development with type generation and watch mode
make watch-backend    # Backend only watch mode (types already generated)
make dev-server       # Comprehensive development server with setup
make build            # Build the application
make test             # Run tests
make test-coverage    # Run tests with coverage
make lint             # Lint the code
make fmt              # Format code
make vet              # Vet code
```

#### Type Generation

```bash
make types-setup              # Setup type generation environment
make generate-types           # Basic type generation
make generate-types-enhanced  # Enhanced generation with validation
make test-types              # Test generated types
make watch-types             # Watch for changes and auto-regenerate
make dev-with-types          # Development workflow with type generation
```

#### Frontend Development

```bash
cd client
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint code
npm run preview      # Preview production build
```

#### Docker

```bash
make docker-build    # Build Docker image
make docker-run      # Run Docker container
make docker-up       # Start services with Docker Compose
make docker-down     # Stop services with Docker Compose
```

#### Quality Assurance

```bash
make check           # Run fmt, vet, lint, test
make security        # Run security scan
make ci              # Run CI pipeline
make release         # Build release version
```

### Type Generation System

Collex features an advanced type generation system that automatically converts Go structs to TypeScript types:

- **Automatic**: Types are generated from Go structs with `// tygo:emit` comments
- **Type Safe**: Ensures consistency between backend and frontend
- **Real-time**: Watch mode for automatic regeneration during development
- **Validated**: Built-in validation and testing

#### Adding New Types

1. Add `// tygo:emit` comment to your Go struct:

   ```go
   // tygo:emit
   type NewEntity struct {
       BaseModel
       Name string `json:"name"`
   }
   ```

2. Regenerate types:

   ```bash
   make generate-types-enhanced
   ```

3. Use in frontend:
   ```typescript
   import { NewEntity } from "@/types/generated";
   ```

## 🏥 Features

### Core Functionality

- **User Management**: Comprehensive user system with roles and permissions
- **Authentication**: JWT-based authentication with session management
- **Financial Tracking**: Advanced financial management for collages
- **Student Management**: Student enrollment and academic tracking
- **Analytics**: Comprehensive reporting and analytics dashboard

### Technical Features

- **Clean Architecture**: Maintainable and testable code structure
- **Type Safety**: End-to-end type safety with automatic generation
- **Rate Limiting**: Built-in API rate limiting and security
- **Health Checks**: Comprehensive health monitoring endpoints
- **Hot Reload**: Development with automatic code reloading
- **Docker Support**: Containerized deployment ready

## 🔧 Configuration

### Environment Variables

| Variable         | Description             | Default                                |
| ---------------- | ----------------------- | -------------------------------------- |
| `SERVER_PORT`    | Server port             | `8080`                                 |
| `DB_HOST`        | Database host           | `localhost`                            |
| `DB_PORT`        | Database port           | `5432`                                 |
| `DB_USER`        | Database user           | `postgres`                             |
| `DB_PASSWORD`    | Database password       | `postgres`                             |
| `DB_NAME`        | Database name           | `collex`                               |
| `JWT_SECRET_KEY` | JWT secret key          | `your-secret-key-change-in-production` |
| `APP_ENV`        | Application environment | `development`                          |
| `LOG_LEVEL`      | Log level               | `info`                                 |

### Database Setup

1. **PostgreSQL (Production)**

   ```bash
   # Create database
   createdb collex

   # Run migrations
   make migrate
   ```

2. **SQLite (Development)**
   ```bash
   # SQLite is used by default in development
   # No additional setup required
   ```

## 🧪 Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run tests with race detection
make test-race

# Run benchmarks
make bench

# Run integration tests
make test-integration

# Run end-to-end tests
make test-e2e
```

## 📊 API Documentation

### Health Endpoints

- `GET /health` - Basic health check
- `GET /ready` - Readiness check
- `GET /live` - Liveness check
- `GET /health/detailed` - Detailed health information
- `GET /metrics` - Application metrics

### API Routes

- `GET /api/*` - All API routes with rate limiting (1000 req/min)

## 🚀 Deployment

### Container Deployment

#### Development Environment

```bash
# Start development containers with hot reload
make docker-dev

# Or with Podman
make podman-dev

# View container status
make container-status
```

#### Production Environment

```bash
# Build and run production containers
make docker-build
make docker-run

# Or with Podman
make podman-build
make podman-run
```

#### Container Management

```bash
# View container status
make container-status

# View logs
make docker-logs          # Production logs
make docker-dev-logs      # Development logs

# Clean up containers
make container-clean

# Run migrations in containers
make container-migrate    # Production
make container-migrate-dev # Development
```

### Service Ports

#### Production

- **Backend API**: `http://localhost:7070`
- **Frontend**: `http://localhost:7071`
- **Database**: `localhost:5436`

#### Development

- **Backend API**: `http://localhost:7072`
- **Frontend**: `http://localhost:7073`
- **Database**: `localhost:5435`

### Traditional Deployment

```bash
# Build for production
make release

# The binary will be in build/collex_unix
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Clean Architecture principles
- Write tests for new features
- Use the type generation system for new entities
- Follow Go and TypeScript best practices
- Run `make check` before committing

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the [documentation](docs/) folder
- Review the [development workflow guide](docs/DEVELOPMENT_WORKFLOW.md)
- Review the [database troubleshooting guide](docs/DATABASE_TROUBLESHOOTING.md)
- Review the [type generation setup](docs/TYPE_GENERATION_SETUP.md)
- Review the [container setup guide](docs/CONTAINER_SETUP.md)
- Review the [database integration guide](docs/DATABASE_INTEGRATION.md)

## 🗺️ Roadmap

- [ ] Enhanced financial reporting
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] API versioning
- [ ] Real-time notifications

---

**Built with ❤️ for collage management**
