// Package database provides DB connection, migration, and seeding utilities.
package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	// Register pgx driver for database/sql
	_ "github.com/jackc/pgx/v5/stdlib"

	// Autoload .env variables during server startup
	"github.com/joho/godotenv"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Service defines methods for interacting with the database and related resources.
type Service interface {
	Health() map[string]string
	Close() error
	Gorm() *gorm.DB
	SQL() *sql.DB
}

type service struct {
	db     *sql.DB
	gormDB *gorm.DB
}

// Config holds database configuration
type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	Database string
	Schema   string
	SSLMode  string
}

var (
	dbInstance *service
	once       sync.Once
)

// loadConfig loads database configuration from environment variables
func loadConfig() (*Config, error) {
	// Try to load .env file (ignore error if file doesn't exist)
	_ = godotenv.Load()

	config := &Config{
		Host:     getEnvOrDefault("DB_HOST", "localhost"),
		Port:     getEnvOrDefault("DB_PORT", "5432"),
		Username: getEnvOrDefault("DB_USERNAME", "postgres"),
		Password: os.Getenv("DB_PASSWORD"), // Required
		Database: getEnvOrDefault("DB_DATABASE", "postgres"),
		Schema:   getEnvOrDefault("DB_SCHEMA", "public"),
		SSLMode:  getEnvOrDefault("DB_SSLMODE", "disable"),
	}

	// Validate required fields
	if config.Password == "" {
		return nil, fmt.Errorf("DB_PASSWORD environment variable is required")
	}

	return config, nil
}

// getEnvOrDefault returns environment variable value or default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// New creates and returns a new database service instance.
// Uses singleton pattern with sync.Once for thread safety.
func New() (Service, error) {
	var err error

	once.Do(func() {
		config, configErr := loadConfig()
		if configErr != nil {
			err = fmt.Errorf("failed to load config: %w", configErr)
			return
		}

		connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s&search_path=%s",
			config.Username, config.Password, config.Host, config.Port,
			config.Database, config.SSLMode, config.Schema)

		// Create SQL DB connection
		sqlDB, sqlErr := sql.Open("pgx", connStr)
		if sqlErr != nil {
			err = fmt.Errorf("failed to open database: %w", sqlErr)
			return
		}

		// Configure connection pool
		sqlDB.SetMaxOpenConns(25)
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetConnMaxLifetime(5 * time.Minute)

		// Test the connection
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if pingErr := sqlDB.PingContext(ctx); pingErr != nil {
			sqlDB.Close()
			err = fmt.Errorf("failed to ping database: %w", pingErr)
			return
		}

		// Create GORM DB connection
		gormDB, gormErr := gorm.Open(postgres.Open(connStr), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if gormErr != nil {
			sqlDB.Close()
			err = fmt.Errorf("failed to create GORM connection: %w", gormErr)
			return
		}

		dbInstance = &service{
			db:     sqlDB,
			gormDB: gormDB,
		}

		log.Printf("Successfully connected to database: %s", config.Database)
	})

	if err != nil {
		return nil, err
	}

	return dbInstance, nil
}

// MustNew creates a database service instance and panics on error.
// Use this only when you want the application to crash if DB connection fails.
func MustNew() Service {
	svc, err := New()
	if err != nil {
		log.Fatal(err)
	}
	return svc
}

func (s *service) Gorm() *gorm.DB {
	return s.gormDB
}

func (s *service) SQL() *sql.DB {
	return s.db
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Test connection
	if err := s.db.PingContext(ctx); err != nil {
		stats["status"] = "down"
		stats["error"] = err.Error()
		return stats
	}

	// Get connection pool stats
	dbStats := s.db.Stats()
	stats["status"] = "up"
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["max_open_connections"] = strconv.Itoa(dbStats.MaxOpenConnections)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()

	return stats
}

func (s *service) Close() error {
	if s.db != nil {
		log.Printf("Closing database connection...")
		if err := s.db.Close(); err != nil {
			return fmt.Errorf("failed to close database: %w", err)
		}
		log.Printf("Database connection closed successfully")
	}
	return nil
}

// Reset clears the singleton instance (useful for testing)
func Reset() {
	once = sync.Once{}
	if dbInstance != nil {
		dbInstance.Close()
		dbInstance = nil
	}
}
