#!/bin/bash

# Collex Container Management Script
# This script provides comprehensive container management for the Collex application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
DEV_COMPOSE_FILE="docker-compose.dev.yml"
CONTAINER_DIR="$(dirname "$0")/.."

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Collex Container Manager${NC}"
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

check_docker() {
    if command -v docker &> /dev/null; then
        echo "docker"
    elif command -v podman &> /dev/null; then
        echo "podman"
    else
        print_error "Neither Docker nor Podman is installed"
        exit 1
    fi
}

check_compose() {
    local runtime=$1
    if [ "$runtime" = "docker" ]; then
        if command -v docker-compose &> /dev/null; then
            echo "docker-compose"
        elif docker compose version &> /dev/null; then
            echo "docker compose"
        else
            print_error "Docker Compose is not available"
            exit 1
        fi
    else
        if command -v podman-compose &> /dev/null; then
            echo "podman-compose"
        else
            print_error "Podman Compose is not available"
            exit 1
        fi
    fi
}

setup_environment() {
    print_info "Setting up environment files..."
    
    if [ ! -f "$CONTAINER_DIR/.env" ]; then
        if [ -f "$CONTAINER_DIR/env.example" ]; then
            cp "$CONTAINER_DIR/env.example" "$CONTAINER_DIR/.env"
            print_success "Created .env file from template"
        else
            print_warning "No .env.example found, you'll need to create .env manually"
        fi
    fi
    
    if [ ! -f "$CONTAINER_DIR/.env.dev" ]; then
        if [ -f "$CONTAINER_DIR/env.dev.example" ]; then
            cp "$CONTAINER_DIR/env.dev.example" "$CONTAINER_DIR/.env.dev"
            print_success "Created .env.dev file from template"
        else
            print_warning "No .env.dev.example found, you'll need to create .env.dev manually"
        fi
    fi
}

create_directories() {
    print_info "Creating necessary directories..."
    
    mkdir -p "$CONTAINER_DIR/data/postgres"
    mkdir -p "$CONTAINER_DIR/logs"
    
    print_success "Directories created"
}

show_status() {
    local runtime=$1
    local compose_cmd=$2
    
    print_info "Container Status:"
    echo ""
    
    echo "Production containers:"
    cd "$CONTAINER_DIR"
    $compose_cmd ps 2>/dev/null || echo "No production containers running"
    echo ""
    
    echo "Development containers:"
    $compose_cmd -f "$DEV_COMPOSE_FILE" ps 2>/dev/null || echo "No development containers running"
    echo ""
}

show_logs() {
    local runtime=$1
    local compose_cmd=$2
    local service=$3
    local env=$4
    
    cd "$CONTAINER_DIR"
    
    if [ "$env" = "dev" ]; then
        if [ -n "$service" ]; then
            $compose_cmd -f "$DEV_COMPOSE_FILE" logs -f "$service"
        else
            $compose_cmd -f "$DEV_COMPOSE_FILE" logs -f
        fi
    else
        if [ -n "$service" ]; then
            $compose_cmd logs -f "$service"
        else
            $compose_cmd logs -f
        fi
    fi
}

run_migration() {
    local runtime=$1
    local compose_cmd=$2
    local env=$3
    
    cd "$CONTAINER_DIR"
    
    if [ "$env" = "dev" ]; then
        print_info "Running migrations in development environment..."
        $compose_cmd -f "$DEV_COMPOSE_FILE" run --rm migrate-dev
    else
        print_info "Running migrations in production environment..."
        $compose_cmd run --rm migrate
    fi
    
    print_success "Migrations completed"
}

clean_containers() {
    local runtime=$1
    local compose_cmd=$2
    
    print_warning "This will remove all containers, volumes, and networks. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cd "$CONTAINER_DIR"
        
        print_info "Stopping and removing containers..."
        $compose_cmd down -v --remove-orphans 2>/dev/null || true
        $compose_cmd -f "$DEV_COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
        
        print_info "Cleaning up system..."
        if [ "$runtime" = "docker" ]; then
            docker system prune -f
        else
            podman system prune -f
        fi
        
        print_success "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

show_help() {
    print_header
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup                 Setup environment and directories"
    echo "  status                Show container status"
    echo "  logs [service] [env]  Show logs (env: dev|prod)"
    echo "  migrate [env]         Run database migrations (env: dev|prod)"
    echo "  clean                 Clean up containers and volumes"
    echo "  help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 status"
    echo "  $0 logs app-dev dev"
    echo "  $0 migrate dev"
    echo "  $0 clean"
    echo ""
}

# Main script
main() {
    local runtime=$(check_docker)
    local compose_cmd=$(check_compose "$runtime")
    
    print_header
    
    case "${1:-help}" in
        setup)
            setup_environment
            create_directories
            print_success "Setup completed successfully"
            ;;
        status)
            show_status "$runtime" "$compose_cmd"
            ;;
        logs)
            show_logs "$runtime" "$compose_cmd" "$2" "$3"
            ;;
        migrate)
            run_migration "$runtime" "$compose_cmd" "${2:-prod}"
            ;;
        clean)
            clean_containers "$runtime" "$compose_cmd"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
