# Makefile for collex Go Clean Architecture Application

# Variables
APP_NAME=collex
BINARY_NAME=collex
BUILD_DIR=build
MAIN_PATH=cmd/api/main.go
DOCKER_IMAGE=collex:latest

# Go related variables
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_UNIX=$(BINARY_NAME)_unix

# Build flags
LDFLAGS=-ldflags "-X main.Version=$(shell git describe --tags --always --dirty) -X main.BuildTime=$(shell date -u '+%Y-%m-%d_%H:%M:%S')"

# Default target
all: clean test build

# Build the application
build:
	@echo "Building $(APP_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)

# Build for Linux
build-linux:
	@echo "Building $(APP_NAME) for Linux..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_UNIX) $(MAIN_PATH)

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	$(GOCLEAN)
	@rm -rf $(BUILD_DIR)
	@go clean -testcache

# Run tests
test:
	@echo "Running tests..."
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Run tests with race detection
test-race:
	@echo "Running tests with race detection..."
	$(GOTEST) -race -v ./...

# Run benchmarks
bench:
	@echo "Running benchmarks..."
	$(GOTEST) -bench=. -benchmem ./...

# Run specific test
test-package:
	@echo "Running tests for package: $(PKG)"
	$(GOTEST) -v $(PKG)

# Run integration tests
test-integration:
	@echo "Running integration tests..."
	$(GOTEST) -v -tags=integration ./...

# Run end-to-end tests
test-e2e:
	@echo "Running end-to-end tests..."
	$(GOTEST) -v -tags=e2e ./...

# Install dependencies
deps:
	@echo "Installing dependencies..."
	$(GOMOD) download
	$(GOMOD) tidy

# Update dependencies
deps-update:
	@echo "Updating dependencies..."
	$(GOMOD) get -u ./...
	$(GOMOD) tidy

# Run the application
run:
	@echo "Running $(APP_NAME)..."
	$(GOCMD) run $(MAIN_PATH)

# Run with hot reload (requires air)
dev:
	@echo "Running in development mode with hot reload..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not found. Installing air..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Watch command for local development with hot reload
watch:
	@echo "Starting local development server in watch mode..."
	@echo "Backend will be available at: http://localhost:8080"
	@echo "Health check: http://localhost:8080/health"
	@echo "Press Ctrl+C to stop"
	@echo ""
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not found. Installing air..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Lint the code
lint:
	@echo "Linting code..."
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found. Installing..."; \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest; \
		golangci-lint run; \
	fi

# Format code
fmt:
	@echo "Formatting code..."
	$(GOCMD) fmt ./...

# Vet code
vet:
	@echo "Vetting code..."
	$(GOCMD) vet ./...

# Generate mocks
mocks:
	@echo "Generating mocks..."
	@if command -v mockgen > /dev/null; then \
		mockgen -source=internal/domain/repository/user_repository.go -destination=internal/domain/repository/mocks/user_repository_mock.go; \
		mockgen -source=internal/usecase/user_usecase.go -destination=internal/usecase/mocks/user_usecase_mock.go; \
	else \
		echo "mockgen not found. Installing..."; \
		go install github.com/golang/mock/mockgen@latest; \
		mockgen -source=internal/domain/repository/user_repository.go -destination=internal/domain/repository/mocks/user_repository_mock.go; \
		mockgen -source=internal/usecase/user_usecase.go -destination=internal/usecase/mocks/user_usecase_mock.go; \
	fi

# Generate API documentation
docs:
	@echo "Generating API documentation..."
	@if command -v swag > /dev/null; then \
		swag init -g $(MAIN_PATH) -o docs; \
	else \
		echo "swag not found. Installing..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
		swag init -g $(MAIN_PATH) -o docs; \
	fi

# =============================================================================
# Container Management Commands
# =============================================================================

# Production containers
docker-build:
	@echo "Building production Docker images..."
	cd container && docker-compose build

docker-run:
	@echo "Starting production containers with Docker..."
	cd container && docker-compose up -d

docker-down:
	@echo "Stopping production containers..."
	cd container && docker-compose down

docker-logs:
	@echo "Viewing production container logs..."
	cd container && docker-compose logs -f

# Development containers
docker-dev:
	@echo "Starting development containers with Docker..."
	cd container && docker-compose -f docker-compose.dev.yml up -d

docker-dev-down:
	@echo "Stopping development containers..."
	cd container && docker-compose -f docker-compose.dev.yml down

docker-dev-logs:
	@echo "Viewing development container logs..."
	cd container && docker-compose -f docker-compose.dev.yml logs -f

# Podman support
podman-build:
	@echo "Building production Podman images..."
	cd container && podman-compose build

podman-run:
	@echo "Starting production containers with Podman..."
	cd container && podman-compose up -d

podman-down:
	@echo "Stopping production containers..."
	cd container && podman-compose down

podman-logs:
	@echo "Viewing production container logs..."
	cd container && podman-compose logs -f

podman-dev:
	@echo "Starting development containers with Podman..."
	cd container && podman-compose -f docker-compose.dev.yml up -d

podman-dev-down:
	@echo "Stopping development containers..."
	cd container && podman-compose -f docker-compose.dev.yml down

podman-dev-logs:
	@echo "Viewing development container logs..."
	cd container && podman-compose -f docker-compose.dev.yml logs -f

podman-dev-build:
	@echo "Building development Podman images..."
	cd container && podman-compose -f docker-compose.dev.yml build

podman-dev-migrate:
	@echo "Running migrations in development container with Podman..."
	cd container && podman-compose -f docker-compose.dev.yml run --rm migrate-dev

podman-dev-status:
	@echo "Development container status with Podman..."
	cd container && podman-compose -f docker-compose.dev.yml ps

# Container utilities
container-status:
	@echo "Container Status:"
	@echo "=================="
	@echo "Production containers:"
	@cd container && docker-compose ps 2>/dev/null || echo "No production containers running"
	@echo ""
	@echo "Development containers:"
	@cd container && docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "No development containers running"

container-clean:
	@echo "Cleaning up containers and volumes..."
	cd container && docker-compose down -v --remove-orphans
	cd container && docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

container-rebuild:
	@echo "Rebuilding all containers..."
	cd container && docker-compose down
	cd container && docker-compose build --no-cache
	cd container && docker-compose up -d

# Migration commands for containers
container-migrate:
	@echo "Running migrations in production container..."
	cd container && docker-compose run --rm migrate

container-migrate-dev:
	@echo "Running migrations in development container..."
	cd container && docker-compose -f docker-compose.dev.yml run --rm migrate-dev

# Development workflow with containers
dev-containers: generate-types-enhanced
	@echo "Starting development with fresh types and containers..."
	@make docker-dev

dev-build-deploy: generate-types-enhanced docker-build
	@echo "Full development build and deploy workflow completed..."

# Watch command with type generation and database setup
watch-full: generate-types-enhanced
	@echo "Starting full development environment with watch mode..."
	@echo "This will:"
	@echo "  1. Generate TypeScript types from Go entities"
	@echo "  2. Start the backend server in watch mode"
	@echo "  3. Backend will be available at: http://localhost:8080"
	@echo "  4. Health check: http://localhost:8080/health"
	@echo "  5. Database health: http://localhost:8080/health/database"
	@echo ""
	@echo "Make sure your database is running and configured in .env"
	@echo "Press Ctrl+C to stop"
	@echo ""
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not found. Installing air..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Watch command for backend only (assumes types are already generated)
watch-backend:
	@echo "Starting backend server in watch mode..."
	@echo "Backend will be available at: http://localhost:8080"
	@echo "Health check: http://localhost:8080/health"
	@echo "Database health: http://localhost:8080/health/database"
	@echo "Press Ctrl+C to stop"
	@echo ""
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not found. Installing air..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

# Development server with comprehensive setup
dev-server:
	@echo "Starting comprehensive development server..."
	@./scripts/dev-server.sh

# Development server without type generation
dev-server-no-types:
	@echo "Starting development server without type generation..."
	@./scripts/dev-server.sh --no-types

# Development server without database check
dev-server-no-db:
	@echo "Starting development server without database check..."
	@./scripts/dev-server.sh --no-db-check

# Database migrations
migrate:
	@echo "Running database migrations..."
	$(GOCMD) run cmd/migrate/main.go -action=migrate

# Fix database permissions
fix-db-permissions:
	@echo "Fixing database permissions..."
	@./scripts/fix-db-permissions.sh

# Database migration status
migrate-status:
	@echo "Checking migration status..."
	$(GOCMD) run cmd/migrate/main.go -action=status

# Create new migration
migrate-create:
	@echo "Creating new migration..."
	@read -p "Enter migration description: " desc; \
	$(GOCMD) run cmd/migrate/main.go -action=create -description="$$desc"

# Rollback migration
migrate-rollback:
	@echo "Rolling back migration..."
	@read -p "Enter migration version to rollback: " version; \
	$(GOCMD) run cmd/migrate/main.go -action=rollback -version="$$version"

# Database seed
seed:
	@echo "Seeding database..."
	$(GOCMD) run $(MAIN_PATH) seed

# Security scan
security:
	@echo "Running security scan..."
	@if command -v gosec > /dev/null; then \
		gosec ./...; \
	else \
		echo "gosec not found. Installing..."; \
		go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest; \
		gosec ./...; \
	fi

# Performance profiling
profile:
	@echo "Running performance profiling..."
	$(GOTEST) -cpuprofile=cpu.prof -memprofile=mem.prof -bench=. ./...

# View CPU profile
profile-cpu:
	@echo "Viewing CPU profile..."
	$(GOCMD) tool pprof cpu.prof

# View memory profile
profile-mem:
	@echo "Viewing memory profile..."
	$(GOCMD) tool pprof mem.prof

# Check for common issues
check: fmt vet lint test

# Pre-commit hook
pre-commit: check

# CI/CD pipeline
ci: deps check test-coverage security

# Release build
release: clean test-coverage build-linux

# Type Generation
generate-types:
	@echo "Generating TypeScript types from Go..."
	@if command -v tygo > /dev/null; then \
		tygo generate; \
		if [ -f "scripts/fix-generated-types.js" ]; then \
			node scripts/fix-generated-types.js; \
		fi; \
	else \
		echo "tygo not found. Installing..."; \
		go install github.com/gzuidhof/tygo@latest; \
		tygo generate; \
		if [ -f "scripts/fix-generated-types.js" ]; then \
			node scripts/fix-generated-types.js; \
		fi; \
	fi

# Enhanced type generation with utilities
generate-types-enhanced:
	@echo "Running enhanced type generation..."
	@bash scripts/generate-types-enhanced.sh

# Test type generation
test-types:
	@echo "Testing type generation..."
	@bash scripts/test-type-generation.sh

# Watch for Go file changes and regenerate types
watch-types:
	@echo "Watching for Go file changes..."
	@if command -v fswatch > /dev/null; then \
		fswatch -o internal/ shared/ | xargs -n1 -I{} make generate-types-enhanced; \
	elif command -v inotifywait > /dev/null; then \
		while inotifywait -r -e modify internal/ shared/; do make generate-types-enhanced; done; \
	else \
		echo "No file watcher found. Install fswatch (macOS) or inotify-tools (Linux)"; \
		exit 1; \
	fi

# Setup type generation environment
types-setup:
	@echo "Setting up type generation environment..."
	@go install github.com/gzuidhof/tygo@latest
	@mkdir -p client/src/types/generated
	@mkdir -p client/src/types/backup
	@chmod +x scripts/generate-types-enhanced.sh
	@chmod +x scripts/test-type-generation.sh
	@chmod +x scripts/fix-generated-types.js
	@echo "Type generation environment setup complete!"

# Full development workflow with type generation
dev-with-types: generate-types-enhanced
	@echo "Starting development with fresh types..."
	@make run &
	@if [ -d "client" ]; then \
		cd client && npm run dev; \
	else \
		echo "Client directory not found"; \
	fi

# Help
help:
	@echo "Available targets:"
	@echo "  build                  - Build the application"
	@echo "  build-linux            - Build for Linux"
	@echo "  clean                  - Clean build artifacts"
	@echo "  test                   - Run tests"
	@echo "  test-coverage          - Run tests with coverage"
	@echo "  test-race              - Run tests with race detection"
	@echo "  bench                  - Run benchmarks"
	@echo "  deps                   - Install dependencies"
	@echo "  run                    - Run the application"
	@echo "  dev                    - Run with hot reload"
	@echo "  watch                  - Run local development server in watch mode"
	@echo "  watch-full             - Full development with type generation and watch mode"
	@echo "  watch-backend          - Backend only watch mode (types already generated)"
	@echo "  dev-server             - Comprehensive development server with setup"
	@echo "  dev-server-no-types    - Development server without type generation"
	@echo "  dev-server-no-db       - Development server without database check"
	@echo "  lint                   - Lint the code"
	@echo "  fmt                    - Format code"
	@echo "  vet                    - Vet code"
	@echo "  mocks                  - Generate mocks"
	@echo "  docs                   - Generate API documentation"
	@echo "  docker-build           - Build production Docker images"
	@echo "  docker-run             - Start production containers"
	@echo "  docker-down            - Stop production containers"
	@echo "  docker-dev             - Start development containers"
	@echo "  docker-dev-down        - Stop development containers"
	@echo "  podman-run             - Start production containers with Podman"
	@echo "  podman-dev             - Start development containers with Podman"
	@echo "  podman-dev-build       - Build development Podman images"
	@echo "  podman-dev-migrate     - Run migrations in development container with Podman"
	@echo "  podman-dev-status      - View development container status with Podman"
	@echo "  container-status       - View container status"
	@echo "  container-clean        - Clean up containers and volumes"
	@echo "  container-migrate      - Run migrations in production container"
	@echo "  container-migrate-dev  - Run migrations in development container"
	@echo "  dev-containers         - Development workflow with containers"
	@echo "  migrate                - Run database migrations"
	@echo "  migrate-status         - Check migration status"
	@echo "  migrate-create         - Create new migration"
	@echo "  migrate-rollback       - Rollback migration"
	@echo "  fix-db-permissions     - Fix database permissions"
	@echo "  security               - Run security scan"
	@echo "  generate-types         - Generate TypeScript types"
	@echo "  generate-types-enhanced - Enhanced type generation with utilities"
	@echo "  test-types             - Test type generation"
	@echo "  watch-types            - Watch for changes and regenerate types"
	@echo "  types-setup            - Setup type generation environment"
	@echo "  dev-with-types         - Development workflow with type generation"
	@echo "  check                  - Run fmt, vet, lint, test"
	@echo "  ci                     - Run CI pipeline"
	@echo "  release                - Build release version"
	@echo "  help                   - Show this help"

.PHONY: all build build-linux clean test test-coverage test-race bench deps run dev watch watch-full watch-backend dev-server dev-server-no-types dev-server-no-db lint fmt vet mocks docs docker-build docker-run docker-down docker-dev docker-dev-down podman-run podman-dev podman-dev-build podman-dev-migrate podman-dev-status container-status container-clean container-migrate container-migrate-dev dev-containers migrate migrate-status migrate-create migrate-rollback fix-db-permissions security generate-types generate-types-enhanced test-types watch-types types-setup dev-with-types check pre-commit ci release help
