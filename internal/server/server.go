package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"techpharma/internal/database"
	"time"

	// Autoload .env variables on server startup
	_ "github.com/joho/godotenv/autoload"
)

// Server wraps the database and handles HTTP server logic.
type Server struct {
	port int
	db   database.Service
}

// NewServer initializes and returns the HTTP server.
func NewServer() *http.Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	if port == 0 {
		port = 8080 // Default port
	}

	// Initialize database connection with error handling
	db, err := database.New()
	if err != nil {
		// For now, panic to maintain original behavior
		// In production, you might want to handle this differently
		panic(fmt.Sprintf("failed to initialize database: %v", err))
	}

	s := &Server{
		port: port,
		db:   db,
	}

	return &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
}
