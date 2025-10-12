# Multi-stage Dockerfile for Collex Application
# Supports production, development, and frontend builds

# =============================================================================
# Go Backend Build Stage
# =============================================================================
FROM docker.io/library/golang:1.23-alpine AS build-backend

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o /app/collex \
    cmd/api/main.go

# =============================================================================
# Go Backend Production Stage
# =============================================================================
FROM docker.io/library/alpine:3.19 AS prod

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    wget \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S collex && \
    adduser -u 1001 -S collex -G collex

# Set working directory
WORKDIR /app

# Copy binary from build stage
COPY --from=build-backend /app/collex /app/collex

# Copy migration files
COPY --from=build-backend /app/migrations /app/migrations

# Set ownership
RUN chown -R collex:collex /app

# Switch to non-root user
USER collex

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["./collex"]

# =============================================================================
# Go Backend Development Stage
# =============================================================================
FROM docker.io/library/golang:1.23-alpine AS dev

# Install development dependencies
RUN apk add --no-cache \
    git \
    curl \
    wget \
    ca-certificates \
    tzdata

# Install Air for hot reload
RUN go install github.com/air-verse/air@v1.52.3

# Set working directory
WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Create Air configuration if it doesn't exist
RUN if [ ! -f .air.toml ]; then \
    air init; \
    fi

# Expose port
EXPOSE 8080

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use Air for hot reload
CMD ["air", "-c", ".air.toml"]

# =============================================================================
# Frontend Build Stage
# =============================================================================
FROM docker.io/library/node:20-alpine AS build-client

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY client/package*.json client/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY client/ ./

# Build the application
RUN pnpm run build

# =============================================================================
# Frontend Production Stage (Nginx)
# =============================================================================
FROM docker.io/library/nginx:alpine AS client

# Install wget for health checks
RUN apk add --no-cache wget

# Copy built application
COPY --from=build-client /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY container/nginx/nginx-client.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# =============================================================================
# Frontend Development Stage (Vite Dev Server)
# =============================================================================
FROM docker.io/library/node:20-alpine AS client-dev

# Install development dependencies
RUN apk add --no-cache \
    git \
    wget \
    curl

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY client/package*.json client/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY client/ ./

# Expose port
EXPOSE 5173

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start development server
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

# =============================================================================
# Migration Tool Stage
# =============================================================================
FROM docker.io/library/golang:1.23-alpine AS migrate

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build migration tool
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o /app/migrate \
    cmd/migrate/main.go

# Runtime stage for migration tool
FROM docker.io/library/alpine:3.19 AS migrate-runtime

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy migration tool
COPY --from=migrate /app/migrate /app/migrate

# Copy migration files
COPY --from=migrate /app/migrations /app/migrations

# Make executable
RUN chmod +x /app/migrate

# Default command
CMD ["./migrate", "-action=migrate"]
