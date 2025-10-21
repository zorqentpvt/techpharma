package server

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"

	"github.com/skryfon/collex/internal/delivery/http"
	"github.com/skryfon/collex/internal/infrastructure/container"
	"github.com/skryfon/collex/internal/infrastructure/database"
	"github.com/skryfon/collex/pkg/config"
)

// AppContainer holds all application dependencies (DEPRECATED - use container.Container)
type AppContainer struct {
	// Add all use cases and other dependencies here
	Config *config.Config
	DB     *database.Database
	// Future use cases will be added here
}

type Server struct {
	router    *gin.Engine
	container *container.Container
	port      string
	// Legacy container for backward compatibility
	legacyContainer *AppContainer
}

// NewServer creates a new server instance (DEPRECATED - use NewCleanServer)
func NewServer(legacyContainer *AppContainer, port string) *Server {
	return &Server{
		router:          gin.Default(),
		legacyContainer: legacyContainer,
		port:            port,
	}
}

// NewCleanServer creates a new server instance with clean architecture
func NewCleanServer(config *config.Config, db *database.Database, port string) *Server {
	// Create the clean architecture container
	container := container.NewContainer(config, db)

	return &Server{
		router:    gin.Default(),
		container: container,
		port:      port,
	}
}

// SetupRoutes configures all the routes for the server
func (s *Server) SetupRoutes() {
	if s.container != nil {
		// Use clean architecture routes
		http.SetupCleanRoutes(s.router, s.container)
	} else {
		log.Fatal("No container configured for server")
	}
	s.router.Static("/uploads", "./uploads")

	// As the application grows, you can add more route setup functions:
	// http.SetupProductRoutes(s.router, s.container.ProductUseCase)
	// http.SetupOrderRoutes(s.router, s.container.OrderUseCase)
}

// Start starts the HTTP server
func (s *Server) Start() error {
	s.SetupRoutes()

	address := fmt.Sprintf(":%s", s.port)
	log.Printf("Server starting on %s", address)

	return s.router.Run(address)
}
