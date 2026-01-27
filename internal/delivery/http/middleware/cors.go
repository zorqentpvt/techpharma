package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/pkg/config"
)

// CORS creates a CORS middleware using configuration from environment variables
func CORS(cfg *config.Config) gin.HandlerFunc {
	corsConfig := cors.DefaultConfig()

	// Use configuration from environment variables
	corsConfig.AllowOrigins = cfg.CORS.AllowedOrigins
	corsConfig.AllowMethods = cfg.CORS.AllowedMethods
	corsConfig.AllowHeaders = cfg.CORS.AllowedHeaders
	corsConfig.ExposeHeaders = cfg.CORS.ExposedHeaders
	corsConfig.AllowCredentials = cfg.CORS.AllowCredentials
	corsConfig.MaxAge = time.Duration(cfg.CORS.MaxAge) * time.Second

	return cors.New(corsConfig)
}

// CORSWithDefaults creates a CORS middleware with sensible defaults (backward compatibility)
func CORSWithDefaults() gin.HandlerFunc {
	corsConfig := cors.DefaultConfig()

	// Default origins for development
	corsConfig.AllowOrigins = []string{
		"http://localhost:3000",
		"http://localhost:5173",
		"http://localhost:8080",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:8080",
	}

	corsConfig.AllowHeaders = []string{
		"Origin",
		"Content-Length",
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
		"Accept-Encoding",
		"Accept-Language",
		"Cache-Control",
		"Connection",
		"Host",
		"Pragma",
		"Referer",
		"User-Agent",
	}

	corsConfig.AllowMethods = []string{
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"HEAD",
		"OPTIONS",
	}

	corsConfig.AllowCredentials = true

	corsConfig.ExposeHeaders = []string{
		"Content-Length",
		"Content-Type",
		"Authorization",
	}

	corsConfig.MaxAge = 12 * time.Hour

	return cors.New(corsConfig)
}

// CORSForProduction creates a more restrictive CORS middleware for production
func CORSForProduction(allowedOrigins []string) gin.HandlerFunc {
	config := cors.DefaultConfig()

	// Use specific origins provided
	config.AllowOrigins = allowedOrigins

	// Minimal headers for production
	config.AllowHeaders = []string{
		"Origin",
		"Content-Length",
		"Content-Type",
		"Authorization",
		"X-Requested-With",
	}

	config.AllowMethods = []string{
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"OPTIONS",
	}

	config.AllowCredentials = true

	config.ExposeHeaders = []string{
		"Content-Length",
		"Authorization",
	}

	// Cache preflight requests for 24 hours in production
	config.MaxAge = 24 * 60 * 60

	return cors.New(config)
}
