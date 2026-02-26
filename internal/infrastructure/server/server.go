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

type Server struct {
	router    *gin.Engine
	container *container.Container
	port      string
}

func NewServer(config *config.Config, db *database.Database, port string) *Server {
	c := container.NewContainer(config, db)

	return &Server{
		router:    gin.Default(),
		container: c,
		port:      port,
	}
}

func (s *Server) SetupRoutes() {
	if s.container == nil {
		log.Fatal("No container configured for server")
	}

	http.SetupCleanRoutes(s.router, s.container)

	s.router.Static("/uploads", "./uploads")
	s.router.Static("/static", "./static")
	s.router.Static("/invoice", "./invoice")
}

func (s *Server) registerTelegramWebhook() {
	if s.container.TelegramHandler == nil {
		log.Println("[Telegram] Handler not initialized, skipping webhook registration")
		return
	}
	telegramHandler, ok := s.container.TelegramHandler.(*http.TelegramHandler)
	if !ok || telegramHandler == nil {
		log.Println("[Telegram] Handler not initialized, skipping webhook registration")
		return
	}

	serverURL := s.container.Config.ServerURL
	if serverURL == "" {
		log.Println("[Telegram] SERVER_URL not set, skipping webhook registration")
		return
	}

	if err := telegramHandler.SetWebhook(serverURL); err != nil {
		log.Printf("[Telegram] Failed to register webhook: %v", err)
		return
	}

	log.Printf("[Telegram] Webhook registered successfully at %s/api/telegram/webhook", serverURL)
}

func (s *Server) Start() error {
	s.SetupRoutes()
	s.registerTelegramWebhook()

	address := fmt.Sprintf(":%s", s.port)
	log.Printf("Server starting on %s", address)

	return s.router.Run(address)
}
