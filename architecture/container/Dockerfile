# --- Go Backend Build ---
FROM docker.io/library/golang:1.24-alpine AS build-backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/main cmd/api/main.go

# --- Go Backend Production Stage ---
FROM docker.io/library/alpine:3.22 AS prod
WORKDIR /app
RUN apk add --no-cache wget
COPY --from=build-backend /app/main /app/main
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
CMD ["./main"]

# --- Go Backend Development Stage ---
FROM docker.io/library/golang:1.24-alpine AS dev
WORKDIR /app

# Install air for hot reload and development tools
RUN go install github.com/air-verse/air@latest
RUN apk add --no-cache git curl wget

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use air for hot reload
CMD ["air", "-c", ".air.toml"]

# --- Frontend Build for Production ---
FROM docker.io/library/node:24-alpine AS build-client
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY client/package*.json ./
RUN pnpm install
COPY client/. .
RUN npm run build

# --- Nginx for Production Client ---
FROM docker.io/library/nginx:alpine AS client
COPY --from=build-client /app/dist /usr/share/nginx/html
COPY nginx-client.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

# --- Frontend Development Stage (Vite Dev Server) ---
FROM docker.io/library/node:24-alpine AS client-dev
WORKDIR /app

# Install development dependencies and pnpm
RUN apk add --no-cache git wget
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY client/package*.json ./
RUN pnpm install

# Copy source code
COPY client/. .

# Expose port
EXPOSE 5173

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Start development server
CMD ["npm", "run", "dev"]
    