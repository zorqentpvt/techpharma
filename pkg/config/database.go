package config

import (
	"fmt"
	"log"

	"github.com/skryfon/collex/internal/infrastructure/database"
)

// NewDatabaseConnection creates a new database connection with enhanced features
func NewDatabaseConnection(cfg *Config) (*database.Database, error) {
	log.Printf("Connecting to database at %s:%s...", cfg.Database.Host, cfg.Database.Port)

	// Convert config to database config
	dbConfig := &database.DatabaseConfig{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		DBName:   cfg.Database.DBName,
		SSLMode:  cfg.Database.SSLMode,

		// Connection pool settings
		MaxOpenConns:    cfg.Database.MaxOpenConns,
		MaxIdleConns:    cfg.Database.MaxIdleConns,
		ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
		ConnMaxIdleTime: cfg.Database.ConnMaxIdleTime,

		// Migration settings
		AutoMigrate: cfg.Database.AutoMigrate,
		MigratePath: cfg.Database.MigratePath,
	}

	db, err := database.NewDatabase(dbConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Printf("Auto-migration enabled: %t", dbConfig.AutoMigrate)

	// Run migrations if auto-migrate is enabled
	if cfg.Database.AutoMigrate {
		if err := db.Migrate(); err != nil {
			return nil, fmt.Errorf("failed to migrate database: %w", err)
		}

		log.Print("Creating indexes...")
		// Create additional indexes
		if err := db.CreateIndexes(); err != nil {
			// Log warning but don't fail - indexes might already exist
			log.Printf("Warning: Failed to create indexes: %v", err)
		}

		// Seed initial data
		if err := db.SeedData(); err != nil {
			// Log warning but don't fail - data might already exist
			log.Printf("Warning: Failed to seed data: %v", err)
		}
	}

	return db, nil
}
