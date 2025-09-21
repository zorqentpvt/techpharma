// Package main provides database migration and seeding utilities.
package main

import (
	"log"
	"os"

	"techpharma/internal/database"
	models "techpharma/internal/model"

	"gorm.io/gorm"
)

func main() {
	log.Println("🚀 Starting DB migration and dummy seed...")

	// Connect to database with error handling
	db, err := database.New()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer func() {
		if closeErr := db.Close(); closeErr != nil {
			log.Printf("⚠️  Failed to close database connection: %v", closeErr)
		}
	}()

	// Test database connection
	health := db.Health()
	if health["status"] != "up" {
		log.Fatalf("❌ Database health check failed: %v", health)
	}
	log.Println("✅ Database connection established")

	// Run migrations
	if err := runMigrations(db); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	// Seed data (only if not in production)
	if shouldSeedData() {
		if err := seedData(db); err != nil {
			log.Fatalf("❌ Seeding failed: %v", err)
		}
	} else {
		log.Println("⏭️  Skipping data seeding (production environment)")
	}

	log.Println("✅ Migration and seed complete.")
}

// runMigrations performs database schema migrations
func runMigrations(db database.Service) error {
	log.Println("🔄 Running database migrations...")

	// Get GORM instance
	gormDB := db.Gorm()

	// Auto-migrate all models (add your models here)
	err := gormDB.AutoMigrate(
		&models.User{},
	// &models.Product{},
	// Add more models here as needed
	)

	if err != nil {
		return err
	}

	log.Println("✅ Database migrations completed")
	return nil
}

// seedData populates the database with initial/dummy data
func seedData(db database.Service) error {
	log.Println("🌱 Seeding database with initial data...")

	gormDB := db.Gorm()

	// Add your seeding logic here
	if err := seedInitialData(gormDB); err != nil {
		return err
	}

	log.Println("✅ Database seeding completed")
	return nil
}

// shouldSeedData determines if data should be seeded based on environment
func shouldSeedData() bool {
	env := os.Getenv("APP_ENV")
	// Don't seed in production unless explicitly requested
	if env == "production" {
		return os.Getenv("FORCE_SEED") == "true"
	}
	// Seed in development, testing, and staging by default
	return true
}

// seedInitialData creates initial data (implement your seeding logic here)
func seedInitialData(db *gorm.DB) error {
	log.Println("  🌱 Adding initial data...")

	// TODO: Add your seeding logic here
	// Example:
	// if err := seedUsers(db); err != nil {
	//     return err
	// }

	return nil
}
