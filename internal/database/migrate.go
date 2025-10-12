package database

import (
	"log"

	"gorm.io/gorm"
)

// AutoMigrate creates or updates DB tables for all models
func AutoMigrate(db *gorm.DB) {
	if err := db.AutoMigrate(); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
	log.Println("✅ Migration completed successfully.")
}
