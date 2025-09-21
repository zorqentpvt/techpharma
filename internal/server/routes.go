package server

import (
	"net/http"
	"techpharma/internal/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes sets up the API routes for the server
func (s *Server) RegisterRoutes() http.Handler {
	// Setup Gin logging configuration
	middleware.SetupGinLogging()

	// === Gin engine ===
	r := gin.New()

	// Built-in middleware
	r.Use(gin.Logger())   // Console logger with color
	r.Use(gin.Recovery()) // Recovery middleware

	// Custom middleware
	r.Use(middleware.LoggingMiddleware()) // Custom file logger
	r.Use(middleware.CORSMiddleware())    // CORS configuration

	// === Routes ===
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "API is working"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/signin", s.signin)
			auth.POST("/signup", s.signup)
		}
	}

	// 404 handler
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})

	return r
}
