package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"techpharma/internal/server"

	"github.com/joho/godotenv"
)

func gracefulShutdown(apiServer *http.Server, done chan bool) {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()

	log.Println("Shutting down gracefully, press Ctrl+C again to force")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := apiServer.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}
	done <- true
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found or failed to load")
	}

	server := server.NewServer()
	done := make(chan bool, 1)
	go gracefulShutdown(server, done)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("HTTP server error: %s", err)
	}
	<-done
	log.Println("✅ Graceful shutdown complete.")
}
