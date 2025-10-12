package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/skryfon/collex/internal/infrastructure/database"
	"github.com/skryfon/collex/pkg/config"
)

func main() {
	var (
		action      = flag.String("action", "migrate", "Action to perform: migrate, rollback, status, create")
		version     = flag.String("version", "", "Version for rollback action")
		description = flag.String("description", "", "Description for create action")
	)
	flag.Parse()

	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database connection
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
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize migration runner
	migrationConfig := &database.MigrationConfig{
		MigrationsPath: cfg.Database.MigratePath,
		TableName:      "migrations",
	}
	migrationRunner := database.NewMigrationRunner(db.GetDB(), migrationConfig)

	// Initialize migrations table
	if err := migrationRunner.Initialize(); err != nil {
		log.Fatalf("Failed to initialize migrations table: %v", err)
	}

	switch *action {
	case "migrate":
		if err := migrationRunner.RunMigrations(); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
		fmt.Println("Migrations completed successfully")

	case "rollback":
		if *version == "" {
			log.Fatal("Version is required for rollback action")
		}
		if err := migrationRunner.RollbackMigration(*version); err != nil {
			log.Fatalf("Failed to rollback migration: %v", err)
		}
		fmt.Printf("Migration %s rolled back successfully\n", *version)

	case "status":
		status, err := migrationRunner.GetMigrationStatus()
		if err != nil {
			log.Fatalf("Failed to get migration status: %v", err)
		}
		fmt.Printf("Migration Status:\n")
		fmt.Printf("Applied: %v\n", status["applied_count"])
		fmt.Printf("Pending: %v\n", status["pending_count"])

	case "create":
		if *description == "" {
			log.Fatal("Description is required for create action")
		}
		if err := migrationRunner.CreateMigration(*description); err != nil {
			log.Fatalf("Failed to create migration: %v", err)
		}
		fmt.Printf("Migration created successfully for: %s\n", *description)

	default:
		fmt.Printf("Unknown action: %s\n", *action)
		fmt.Println("Available actions: migrate, rollback, status, create")
		os.Exit(1)
	}
}
