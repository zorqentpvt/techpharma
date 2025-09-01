// Package database provides DB connection, migration, and seeding utilities.
package database

import (
	"log"
	"skryfon_blog/internal/model"

	"gorm.io/gorm"
)

// SeedDummyData inserts sample users and posts into the database for testing.
func SeedDummyData(db *gorm.DB) {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		log.Println("⚠️ Dummy data already exists, skipping seeding.")
		return
	}

	log.Println("🌱 Seeding dummy data...")

	

	log.Println("✅ Dummy data seeded.")
}
