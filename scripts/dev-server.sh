#!/bin/bash

# Collex Development Server Script
# This script provides a comprehensive development server setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_PORT=8080
HEALTH_ENDPOINT="http://localhost:$SERVER_PORT/health"
DB_HEALTH_ENDPOINT="http://localhost:$SERVER_PORT/health/database"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Collex Development Server${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go 1.23+ first."
        exit 1
    fi
    
    # Check if Air is installed
    if ! command -v air &> /dev/null; then
        print_warning "Air is not installed. Installing..."
        go install github.com/cosmtrek/air@latest
        print_success "Air installed successfully"
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f "container/env.example" ]; then
            cp container/env.example .env
            print_success ".env file created from template"
            print_warning "Please update .env with your database configuration"
        else
            print_warning "No .env.example found. Creating basic .env file..."
            create_basic_env_file
        fi
    fi
}

create_basic_env_file() {
    cat > .env << 'EOF'
# Collex Application Environment Configuration
# Update these values according to your setup

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collex
DB_USER=postgres
DB_PASSWORD=postgres

# Application Configuration
APP_ENV=development
LOG_LEVEL=debug

# Server Configuration
SERVER_PORT=8080

# JWT Configuration
JWT_SECRET_KEY=dev-secret-key-not-for-production
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRY=168h

# Database Connection Pool Settings
DB_MAX_OPEN_CONNS=100
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=1h
DB_CONN_MAX_IDLE_TIME=30m

# Migration Settings
DB_AUTO_MIGRATE=true
DB_MIGRATE_PATH=migrations
EOF
    print_success "Created basic .env file"
    print_warning "Please update .env with your database configuration"
}

check_database() {
    print_info "Checking database connection..."
    
    # Source environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Check if database is accessible
    if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
        if command -v pg_isready &> /dev/null; then
            if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
                print_success "Database connection successful"
            else
                print_warning "Database connection failed. Make sure your database is running."
                print_info "You can start the database with: make docker-dev (for containerized DB)"
            fi
        else
            print_warning "pg_isready not found. Skipping database connection check."
        fi
    else
        print_warning "Database configuration not found in .env"
    fi
}

generate_types() {
    print_info "Generating TypeScript types from Go entities..."
    
    if make generate-types-enhanced &> /dev/null; then
        print_success "TypeScript types generated successfully"
    else
        print_warning "Type generation failed. Continuing without types..."
    fi
}

start_server() {
    print_info "Starting development server..."
    echo ""
    echo -e "${BLUE}Server Information:${NC}"
    echo "  Backend URL: http://localhost:$SERVER_PORT"
    echo "  Health Check: $HEALTH_ENDPOINT"
    echo "  Database Health: $DB_HEALTH_ENDPOINT"
    echo "  API Endpoints: http://localhost:$SERVER_PORT/api/*"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    # Start Air for hot reload
    air
}

show_help() {
    print_header
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-types        Skip TypeScript type generation"
    echo "  --no-db-check     Skip database connection check"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Full development setup"
    echo "  $0 --no-types     # Skip type generation"
    echo "  $0 --no-db-check  # Skip database check"
    echo ""
}

# Parse command line arguments
SKIP_TYPES=false
SKIP_DB_CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-types)
            SKIP_TYPES=true
            shift
            ;;
        --no-db-check)
            SKIP_DB_CHECK=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_header
    
    # Check dependencies
    check_dependencies
    
    # Check database (unless skipped)
    if [ "$SKIP_DB_CHECK" = false ]; then
        check_database
    fi
    
    # Generate types (unless skipped)
    if [ "$SKIP_TYPES" = false ]; then
        generate_types
    fi
    
    # Start the server
    start_server
}

# Run main function
main "$@"
