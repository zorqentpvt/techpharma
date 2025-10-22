package http

import (
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/infrastructure/database"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db *database.Database
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *database.Database) *HealthHandler {
	return &HealthHandler{
		db: db,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Uptime    string            `json:"uptime"`
	Version   string            `json:"version"`
	Services  map[string]string `json:"services,omitempty"`
}

// HealthCheck performs a basic health check
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Uptime:    getUptime(),
		Version:   "1.0.0", // This should come from build info
	}

	c.JSON(http.StatusOK, response)
}

// ReadinessCheck performs a readiness check including database connectivity
func (h *HealthHandler) ReadinessCheck(c *gin.Context) {
	response := HealthResponse{
		Status:    "ready",
		Timestamp: time.Now(),
		Uptime:    getUptime(),
		Version:   "1.0.0",
		Services:  make(map[string]string),
	}

	// Check database connectivity
	if err := h.checkDatabase(); err != nil {
		response.Status = "not ready"
		response.Services["database"] = "unhealthy"
		c.JSON(http.StatusServiceUnavailable, response)
		return
	}

	response.Services["database"] = "healthy"
	c.JSON(http.StatusOK, response)
}

// LivenessCheck performs a liveness check
func (h *HealthHandler) LivenessCheck(c *gin.Context) {
	response := HealthResponse{
		Status:    "alive",
		Timestamp: time.Now(),
		Uptime:    getUptime(),
		Version:   "1.0.0",
	}

	c.JSON(http.StatusOK, response)
}

// DetailedHealthCheck performs a detailed health check with all services
func (h *HealthHandler) DetailedHealthCheck(c *gin.Context) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Uptime:    getUptime(),
		Version:   "1.0.0",
		Services:  make(map[string]string),
	}

	// Check database
	if err := h.checkDatabase(); err != nil {
		response.Status = "unhealthy"
		response.Services["database"] = "unhealthy"
	} else {
		response.Services["database"] = "healthy"
	}

	// Check memory usage
	if memoryStatus := h.checkMemory(); memoryStatus != "healthy" {
		response.Status = "unhealthy"
		response.Services["memory"] = memoryStatus
	} else {
		response.Services["memory"] = "healthy"
	}

	// Check disk space
	if diskStatus := h.checkDiskSpace(); diskStatus != "healthy" {
		response.Status = "unhealthy"
		response.Services["disk"] = diskStatus
	} else {
		response.Services["disk"] = "healthy"
	}

	// Determine HTTP status code
	statusCode := http.StatusOK
	if response.Status == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

// DatabaseHealthCheck performs a detailed database health check with connection pool stats
func (h *HealthHandler) DatabaseHealthCheck(c *gin.Context) {
	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"database":  make(map[string]interface{}),
	}

	// Check database connectivity
	if err := h.checkDatabase(); err != nil {
		response["status"] = "unhealthy"
		response["database"] = map[string]interface{}{
			"connectivity": "unhealthy",
			"error":        err.Error(),
		}
		c.JSON(http.StatusServiceUnavailable, response)
		return
	}

	// Get connection pool statistics
	stats := h.db.GetConnectionStats()
	response["database"] = map[string]interface{}{
		"connectivity": "healthy",
		"pool_stats":   stats,
	}

	c.JSON(http.StatusOK, response)
}

// checkDatabase checks database connectivity
func (h *HealthHandler) checkDatabase() error {
	return h.db.Health()
}

// checkMemory checks memory usage
func (h *HealthHandler) checkMemory() string {
	// This is a simplified memory check
	// In a real implementation, you would use runtime.ReadMemStats
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Check if memory usage is above 80%
	memoryUsagePercent := float64(m.Alloc) / float64(m.Sys) * 100
	if memoryUsagePercent > 80 {
		return "high"
	}

	return "healthy"
}

// checkDiskSpace checks available disk space
func (h *HealthHandler) checkDiskSpace() string {
	// This is a placeholder for disk space check
	// In a real implementation, you would use syscall.Statfs
	return "healthy"
}

// getUptime returns the application uptime
func getUptime() string {
	// This is a placeholder for uptime calculation
	// In a real implementation, you would track the start time
	return "1h 30m 45s"
}

// Metrics endpoint for Prometheus-style metrics
func (h *HealthHandler) Metrics(c *gin.Context) {
	// Get database connection stats
	dbStats := h.db.GetConnectionStats()

	// This is a placeholder for metrics endpoint
	// In a real implementation, you would expose application metrics
	metrics := fmt.Sprintf(`# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234
http_requests_total{method="POST",status="201"} 567
http_requests_total{method="PUT",status="200"} 89
http_requests_total{method="DELETE",status="204"} 12

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",le="0.1"} 1000
http_request_duration_seconds_bucket{method="GET",le="0.5"} 1200
http_request_duration_seconds_bucket{method="GET",le="1.0"} 1234
http_request_duration_seconds_bucket{method="GET",le="+Inf"} 1234

# HELP database_connections_max_open Maximum number of open database connections
# TYPE database_connections_max_open gauge
database_connections_max_open %v

# HELP database_connections_open Current number of open database connections
# TYPE database_connections_open gauge
database_connections_open %v

# HELP database_connections_in_use Number of database connections in use
# TYPE database_connections_in_use gauge
database_connections_in_use %v

# HELP database_connections_idle Number of idle database connections
# TYPE database_connections_idle gauge
database_connections_idle %v

# HELP database_connection_wait_count Total number of connection waits
# TYPE database_connection_wait_count counter
database_connection_wait_count %v

# HELP cache_hits_total Total number of cache hits
# TYPE cache_hits_total counter
cache_hits_total 10000

# HELP cache_misses_total Total number of cache misses
# TYPE cache_misses_total counter
cache_misses_total 500`,
		dbStats["max_open_connections"],
		dbStats["open_connections"],
		dbStats["in_use"],
		dbStats["idle"],
		dbStats["wait_count"])

	c.Header("Content-Type", "text/plain")
	c.String(http.StatusOK, metrics)
}
