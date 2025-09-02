// Package model defines all database models for the application.
package main

import (
	"log"

	"skryfon_blog/internal/database"
)

func main() {
	log.Println("🚀 Starting DB migration and dummy seed...")

	db := database.New()              // Connect to PostgreSQL
	database.AutoMigrate(db.Gorm())   // Run GORM AutoMigrate
	database.SeedDummyData(db.Gorm()) // Seed initial data

	log.Println("✅ Migration and seed complete.")
}
