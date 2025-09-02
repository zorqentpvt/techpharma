package server

import (
	"fmt"
	"net/http"
	"os"
	"skryfon_blog/internal/database"
	"strconv"
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
	s := &Server{
		port: port,
		db:   database.New(),
	}

	return &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
}
