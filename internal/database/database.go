// Package database provides DB connection, migration, and seeding utilities.
package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	// Register pgx driver for database/sql
	_ "github.com/jackc/pgx/v5/stdlib"
	// Autoload .env variables during server startup
	_ "github.com/joho/godotenv/autoload"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Service defines methods for interacting with the database and related resources.
type Service interface {
	Health() map[string]string
	Close() error
	Gorm() *gorm.DB
}

type service struct {
	db     *sql.DB
	gormDB *gorm.DB
}

var (
	database   = os.Getenv("DB_DATABASE")
	password   = os.Getenv("DB_PASSWORD")
	username   = os.Getenv("DB_USERNAME")
	port       = os.Getenv("DB_PORT")
	host       = os.Getenv("DB_HOST")
	schema     = os.Getenv("DB_SCHEMA")
	dbInstance *service
)

// New creates and returns a new database service instance.
func New() Service {
	if dbInstance != nil {
		return dbInstance
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable&search_path=%s", username, password, host, port, database, schema)
	sqlDB, err := sql.Open("pgx", connStr)
	if err != nil {
		log.Fatal(err)
	}

	gormDB, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	dbInstance = &service{
		db:     sqlDB,
		gormDB: gormDB,
	}
	return dbInstance
}

func (s *service) Gorm() *gorm.DB {
	return s.gormDB
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)
	if err := s.db.PingContext(ctx); err != nil {
		stats["status"] = "down"
		stats["error"] = err.Error()
		return stats
	}

	dbStats := s.db.Stats()
	stats["status"] = "up"
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	return stats
}

func (s *service) Close() error {
	log.Printf("Disconnected from database: %s", database)
	return s.db.Close()
}
