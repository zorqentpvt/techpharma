package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Migration represents a database migration
type Migration struct {
	ID          uint      `gorm:"primaryKey"`
	Version     string    `gorm:"uniqueIndex;not null"`
	Description string    `gorm:"not null"`
	AppliedAt   time.Time `gorm:"not null"`
	Checksum    string    `gorm:"not null"`
}

// MigrationRunner handles database migrations
type MigrationRunner struct {
	db     *gorm.DB
	config *MigrationConfig
}

// MigrationConfig holds migration configuration
type MigrationConfig struct {
	MigrationsPath string
	TableName      string
}

// NewMigrationRunner creates a new migration runner
func NewMigrationRunner(db *gorm.DB, config *MigrationConfig) *MigrationRunner {
	if config.TableName == "" {
		config.TableName = "migrations"
	}
	if config.MigrationsPath == "" {
		config.MigrationsPath = "migrations"
	}

	return &MigrationRunner{
		db:     db,
		config: config,
	}
}

// Initialize creates the migrations table
func (mr *MigrationRunner) Initialize() error {
	return mr.db.AutoMigrate(&Migration{})
}

// GetAppliedMigrations returns a list of applied migrations
func (mr *MigrationRunner) GetAppliedMigrations() ([]Migration, error) {
	var migrations []Migration
	err := mr.db.Order("version ASC").Find(&migrations).Error
	return migrations, err
}

// GetPendingMigrations returns a list of pending migrations
func (mr *MigrationRunner) GetPendingMigrations() ([]string, error) {
	applied, err := mr.GetAppliedMigrations()
	if err != nil {
		return nil, err
	}

	appliedMap := make(map[string]bool)
	for _, migration := range applied {
		appliedMap[migration.Version] = true
	}

	files, err := mr.getMigrationFiles()
	if err != nil {
		return nil, err
	}

	var pending []string
	for _, file := range files {
		version := mr.extractVersion(file)
		if !appliedMap[version] {
			pending = append(pending, file)
		}
	}

	return pending, nil
}

// RunMigrations runs all pending migrations
func (mr *MigrationRunner) RunMigrations() error {
	log.Println("Checking for pending migrations...")

	pending, err := mr.GetPendingMigrations()
	if err != nil {
		return fmt.Errorf("failed to get pending migrations: %w", err)
	}

	if len(pending) == 0 {
		log.Println("No pending migrations found")
		return nil
	}

	log.Printf("Found %d pending migrations", len(pending))

	for _, file := range pending {
		if err := mr.runMigration(file); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", file, err)
		}
	}

	log.Println("All migrations completed successfully")
	return nil
}

// runMigration runs a single migration
func (mr *MigrationRunner) runMigration(filename string) error {
	version := mr.extractVersion(filename)
	description := mr.extractDescription(filename)

	log.Printf("Running migration: %s - %s", version, description)

	// Read migration file
	content, err := mr.readMigrationFile(filename)
	if err != nil {
		return err
	}

	// Calculate checksum
	checksum := mr.calculateChecksum(content)

	// Start transaction
	tx := mr.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Execute migration SQL
	if err := tx.Exec(content).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	// Record migration
	migration := Migration{
		Version:     version,
		Description: description,
		AppliedAt:   time.Now().UTC(),
		Checksum:    checksum,
	}

	if err := tx.Create(&migration).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to record migration: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit migration: %w", err)
	}

	log.Printf("Migration %s completed successfully", version)
	return nil
}

// getMigrationFiles returns a sorted list of migration files
func (mr *MigrationRunner) getMigrationFiles() ([]string, error) {
	var files []string

	err := filepath.Walk(mr.config.MigrationsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && strings.HasSuffix(path, ".sql") {
			files = append(files, path)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Sort files by version
	sort.Strings(files)
	return files, nil
}

// readMigrationFile reads the content of a migration file
func (mr *MigrationRunner) readMigrationFile(filename string) (string, error) {
	content, err := os.ReadFile(filename)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

// extractVersion extracts version from filename (e.g., "001_initial_schema.sql" -> "001")
func (mr *MigrationRunner) extractVersion(filename string) string {
	basename := filepath.Base(filename)
	parts := strings.Split(basename, "_")
	if len(parts) > 0 {
		return parts[0]
	}
	return basename
}

// extractDescription extracts description from filename
func (mr *MigrationRunner) extractDescription(filename string) string {
	basename := filepath.Base(filename)
	// Remove extension
	basename = strings.TrimSuffix(basename, ".sql")
	// Remove version prefix
	parts := strings.SplitN(basename, "_", 2)
	if len(parts) > 1 {
		return strings.ReplaceAll(parts[1], "_", " ")
	}
	return basename
}

// calculateChecksum calculates a simple checksum for migration content
func (mr *MigrationRunner) calculateChecksum(content string) string {
	// Simple checksum - in production, use a proper hash function
	return fmt.Sprintf("%d", len(content))
}

// RollbackMigration rolls back a specific migration
func (mr *MigrationRunner) RollbackMigration(version string) error {
	log.Printf("Rolling back migration: %s", version)

	// Find migration record
	var migration Migration
	if err := mr.db.Where("version = ?", version).First(&migration).Error; err != nil {
		return fmt.Errorf("migration %s not found: %w", version, err)
	}

	// Look for rollback file
	rollbackFile := mr.findRollbackFile(version)
	if rollbackFile == "" {
		return fmt.Errorf("rollback file not found for migration %s", version)
	}

	// Read rollback content
	content, err := mr.readMigrationFile(rollbackFile)
	if err != nil {
		return err
	}

	// Start transaction
	tx := mr.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Execute rollback SQL
	if err := tx.Exec(content).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to execute rollback SQL: %w", err)
	}

	// Remove migration record
	if err := tx.Delete(&migration).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to remove migration record: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit rollback: %w", err)
	}

	log.Printf("Migration %s rolled back successfully", version)
	return nil
}

// findRollbackFile finds the rollback file for a migration
func (mr *MigrationRunner) findRollbackFile(version string) string {
	// Look for rollback file with pattern: {version}_rollback.sql
	rollbackFile := filepath.Join(mr.config.MigrationsPath, fmt.Sprintf("%s_rollback.sql", version))

	if _, err := os.Stat(rollbackFile); err == nil {
		return rollbackFile
	}

	return ""
}

// GetMigrationStatus returns the status of all migrations
func (mr *MigrationRunner) GetMigrationStatus() (map[string]interface{}, error) {
	applied, err := mr.GetAppliedMigrations()
	if err != nil {
		return nil, err
	}

	pending, err := mr.GetPendingMigrations()
	if err != nil {
		return nil, err
	}

	status := map[string]interface{}{
		"applied_count": len(applied),
		"pending_count": len(pending),
		"applied":       applied,
		"pending":       pending,
	}

	return status, nil
}

// CreateMigration creates a new migration file
func (mr *MigrationRunner) CreateMigration(description string) error {
	// Get next version number
	applied, err := mr.GetAppliedMigrations()
	if err != nil {
		return err
	}

	nextVersion := 1
	if len(applied) > 0 {
		lastVersion := applied[len(applied)-1].Version
		if v, err := strconv.Atoi(lastVersion); err == nil {
			nextVersion = v + 1
		}
	}

	version := fmt.Sprintf("%03d", nextVersion)
	filename := fmt.Sprintf("%s_%s.sql", version, strings.ReplaceAll(description, " ", "_"))
	filepath := filepath.Join(mr.config.MigrationsPath, filename)

	// Create migrations directory if it doesn't exist
	if err := os.MkdirAll(mr.config.MigrationsPath, 0755); err != nil {
		return err
	}

	// Create migration file
	content := fmt.Sprintf("-- Migration: %s\n-- Version: %s\n-- Description: %s\n-- Created: %s\n\n-- Add your migration SQL here\n",
		description, version, description, time.Now().UTC().Format(time.RFC3339))

	if err := os.WriteFile(filepath, []byte(content), 0644); err != nil {
		return err
	}

	log.Printf("Created migration file: %s", filepath)
	return nil
}
