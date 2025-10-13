package main

import (
	"log"

	"github.com/skryfon/collex/internal/infrastructure/server"
	"github.com/skryfon/collex/pkg/config"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database connection with proper clean architecture setup
	db, err := config.NewDatabaseConnection(cfg)
	if err != nil {
		log.Fatalf("database initialization failed: %v", err)
	}
	defer db.Close()
	// Run database migrations if enabled

	// Initialize server with clean architecture
	srv := server.NewCleanServer(cfg, db, cfg.Server.Port)

	// Start server
	log.Printf("Starting server on port %s with clean architecture", cfg.Server.Port)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
