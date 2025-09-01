package database

import (
	"log"

	"skryfon_blog/internal/model"

	"gorm.io/gorm"
)

// AutoMigrate creates or updates DB tables for all models
func AutoMigrate(db *gorm.DB) {
	if err := db.AutoMigrate(
		&model.User{},
		&model.Post{},
		&model.Comment{},
		&model.Vote{},
		&model.Report{}, // Add this line
	); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}
	log.Println("✅ Migration completed successfully.")
}
