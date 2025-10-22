package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/skryfon/collex/internal/domain/entity"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string

	// Connection pool settings
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration

	// Migration settings
	AutoMigrate bool
	MigratePath string
}

// Database represents the database connection and configuration
type Database struct {
	DB     *gorm.DB
	config *DatabaseConfig
}

// NewDatabase creates a new database connection with connection pooling
func NewDatabase(cfg *DatabaseConfig) (*Database, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	// Configure GORM with performance optimizations
	gormConfig := &gorm.Config{
		// Connection pool settings
		DisableForeignKeyConstraintWhenMigrating: true,
		PrepareStmt:                              true, // Enable prepared statements
		Logger:                                   logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Set log level based on environment
	if cfg.Host == "localhost" {
		gormConfig.Logger = logger.Default.LogMode(logger.Warn)
	}

	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Database connected successfully. Pool: %d/%d connections", cfg.MaxIdleConns, cfg.MaxOpenConns)

	return &Database{
		DB:     db,
		config: cfg,
	}, nil
}

// GetDB returns the GORM database instance
func (d *Database) GetDB() *gorm.DB {
	return d.DB
}

// Close closes the database connection
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Health checks the database health
func (d *Database) Health() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return sqlDB.PingContext(ctx)
}

// GetConnectionStats returns connection pool statistics
func (d *Database) GetConnectionStats() map[string]interface{} {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	stats := sqlDB.Stats()
	return map[string]interface{}{
		"max_open_connections": stats.MaxOpenConnections,
		"open_connections":     stats.OpenConnections,
		"in_use":               stats.InUse,
		"idle":                 stats.Idle,
		"wait_count":           stats.WaitCount,
		"wait_duration":        stats.WaitDuration.String(),
		"max_idle_closed":      stats.MaxIdleClosed,
		"max_idle_time_closed": stats.MaxIdleTimeClosed,
		"max_lifetime_closed":  stats.MaxLifetimeClosed,
	}
}

// Migrate runs database migrations for all entities
func (d *Database) Migrate() error {
	log.Println("Starting database migration...")

	// Define all entities to migrate
	entities := []interface{}{
		&entity.User{},
		&entity.UserSession{},
		&entity.UserActivity{},
		&entity.Role{},
		&entity.Permission{},
		&entity.AuditLog{},
		&entity.SystemEvent{},
		&entity.ComplianceLog{},
		&entity.SecurityEvent{},
		&entity.DataRetentionPolicy{},
		&entity.Doctor{},
		&entity.Pharmacy{},
		&entity.Medicine{},
		&entity.Cart{},
		&entity.CartMedicine{},
		&entity.Payment{},
		&entity.Order{},
		&entity.OrderItem{},
		&entity.Appointment{},
		&entity.AppointmentSlot{},
	}

	// Run migrations
	if err := d.DB.AutoMigrate(entities...); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migration completed successfully")
	return nil
}

// CreateIndexes creates additional indexes for performance
func (d *Database) CreateIndexes() error {
	log.Println("Creating additional indexes...")

	// Create composite indexes for better query performance
	indexes := []string{
		// User indexes
		"CREATE INDEX IF NOT EXISTS idx_users_phone_status ON users(phone_number, status) WHERE deleted_at IS NULL",
		"CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status) WHERE deleted_at IS NULL AND email IS NOT NULL",

		// User session indexes
		"CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active) WHERE deleted_at IS NULL",

		// User activity indexes
		"CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON user_activities(user_id, activity_type) WHERE deleted_at IS NULL",

		// Role indexes
		"CREATE INDEX IF NOT EXISTS idx_roles_category_active ON roles(category, is_active) WHERE deleted_at IS NULL",

		// Permission indexes
		"CREATE INDEX IF NOT EXISTS idx_permissions_module_resource ON permissions(module, resource) WHERE deleted_at IS NULL",

		// User role indexes (if you have a user_roles join table)
		"CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON user_roles(user_id, is_active) WHERE deleted_at IS NULL",

		// Audit log indexes
		"CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type, entity_id) WHERE deleted_at IS NULL",
		"CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC) WHERE deleted_at IS NULL",

		// System event indexes
		"CREATE INDEX IF NOT EXISTS idx_system_events_type_created ON system_events(event_type, created_at) WHERE deleted_at IS NULL",

		// Doctor indexes
		"CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization_id) WHERE deleted_at IS NULL",
		"CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status) WHERE deleted_at IS NULL",

		// Medicine indexes
		"CREATE INDEX IF NOT EXISTS idx_medicines_pharmacy_id ON medicines(pharmacy_id) WHERE deleted_at IS NULL",
		"CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name) WHERE deleted_at IS NULL",
		"CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category) WHERE deleted_at IS NULL",

		// Cart indexes
		"CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id) WHERE deleted_at IS NULL",

		// Cart medicine indexes
		"CREATE INDEX IF NOT EXISTS idx_cart_medicines_cart_id ON cart_medicines(cart_id) WHERE deleted_at IS NULL",
		"CREATE INDEX IF NOT EXISTS idx_cart_medicines_medicine_id ON cart_medicines(medicine_id) WHERE deleted_at IS NULL",
		"CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_medicines_cart_medicine ON cart_medicines(cart_id, medicine_id) WHERE deleted_at IS NULL",
	}

	for _, indexSQL := range indexes {
		if err := d.DB.Exec(indexSQL).Error; err != nil {
			log.Printf("Warning: Failed to create index: %v", err)
		}
	}

	log.Println("Additional indexes created successfully")
	return nil
}

// SeedData seeds the database with initial data
func (d *Database) SeedData() error {
	log.Println("Seeding database with initial data...")

	// Check if roles already exist
	var roleCount int64
	if err := d.DB.Model(&entity.Role{}).Count(&roleCount).Error; err != nil {
		return fmt.Errorf("failed to check existing roles: %w", err)
	}

	// Check if permissions already exist
	var permissionCount int64
	if err := d.DB.Model(&entity.Permission{}).Count(&permissionCount).Error; err != nil {
		return fmt.Errorf("failed to check existing permissions: %w", err)
	}

	// Seed roles if they don't exist
	if roleCount == 0 {
		if err := d.seedRoles(); err != nil {
			return fmt.Errorf("failed to seed roles: %w", err)
		}
	}

	// Seed permissions if they don't exist
	if permissionCount == 0 {
		if err := d.seedPermissions(); err != nil {
			return fmt.Errorf("failed to seed permissions: %w", err)
		}
	}

	log.Println("Database seeded successfully")
	return nil
}

// seedRoles creates default roles for the medical system
func (d *Database) seedRoles() error {
	log.Println("Seeding roles...")

	roles := []entity.Role{
		{
			BaseModel:    entity.BaseModel{},
			Name:         "Admin",
			Code:         "admin",
			Description:  stringPtr("Full access to the system"),
			Category:     "system",
			IsSystemRole: true,
			IsDefault:    false,
			IsActive:     true,
			DisplayOrder: 1,
			Scope:        "system",
		},
		{
			BaseModel:    entity.BaseModel{},
			Name:         "Doctor",
			Code:         "doctor",
			Description:  stringPtr("Medical professional with access to patient charts and appointments"),
			Category:     "medical",
			IsSystemRole: false,
			IsDefault:    false,
			IsActive:     true,
			DisplayOrder: 2,
			Scope:        "medical",
		},
		{
			BaseModel:    entity.BaseModel{},
			Name:         "Patient",
			Code:         "patient",
			Description:  stringPtr("Can book appointments and order medicines"),
			Category:     "medical",
			IsSystemRole: false,
			IsDefault:    true,
			IsActive:     true,
			DisplayOrder: 3,
			Scope:        "medical",
		},
		{
			BaseModel:    entity.BaseModel{},
			Name:         "Pharmacist",
			Code:         "pharmacist",
			Description:  stringPtr("Manages medicine stock and processes orders"),
			Category:     "medical",
			IsSystemRole: false,
			IsDefault:    false,
			IsActive:     true,
			DisplayOrder: 4,
			Scope:        "medical",
		},
	}

	for i := range roles {
		if err := d.DB.Create(&roles[i]).Error; err != nil {
			return fmt.Errorf("failed to create role %s: %w", roles[i].Name, err)
		}
	}

	log.Println("Roles seeded successfully")
	return nil
}

/*func (d *Database) seedMedicine() error {
	log.Println("Seeding roles...")
	medicine := []entity.Medicine{
		{
			BaseModel:   entity.BaseModel{},
			Name:        "Paracetamol",
			Description: stringPtr("Pain reliever and fever reducer"),
			Content:     stringPtr("Paracetamol 500mg"),
			Quantity: 100,
			PharmacyID: ,
			IsActive:    true,
		},
	}

	for i := range medicine {
		if err := d.DB.Create(&medicine[i]).Error; err != nil {
			return fmt.Errorf("failed to create medicine %s: %w", medicine[i].Name, err)
		}
	}

	log.Println("Medicine seeded successfully")
	return nil
}*/

// seedPermissions creates default permissions
func (d *Database) seedPermissions() error {
	log.Println("Seeding permissions...")

	permissions := []entity.Permission{
		// User management permissions
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Create User",
			Code:               "user:create",
			Description:        stringPtr("Create new users"),
			Module:             "user",
			Resource:           "user",
			Action:             "create",
			Category:           "user_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       false,
			AccessLevel:        "write",
			Scope:              "business",
			DisplayOrder:       1,
		},
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Read User",
			Code:               "user:read",
			Description:        stringPtr("View user information"),
			Module:             "user",
			Resource:           "user",
			Action:             "read",
			Category:           "user_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       false,
			AccessLevel:        "read",
			Scope:              "own",
			DisplayOrder:       2,
		},
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Update User",
			Code:               "user:update",
			Description:        stringPtr("Update user information"),
			Module:             "user",
			Resource:           "user",
			Action:             "update",
			Category:           "user_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       false,
			AccessLevel:        "write",
			Scope:              "own",
			DisplayOrder:       3,
		},
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Delete User",
			Code:               "user:delete",
			Description:        stringPtr("Delete users"),
			Module:             "user",
			Resource:           "user",
			Action:             "delete",
			Category:           "user_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   true,
			IsFullAccess:       false,
			AccessLevel:        "delete",
			Scope:              "business",
			DisplayOrder:       4,
		},
		// Medicine management permissions
		{
			BaseModel:          entity.BaseModel{},
			Name:               "View Medicines",
			Code:               "medicine:read",
			Description:        stringPtr("View medicine catalog"),
			Module:             "medicine",
			Resource:           "medicine",
			Action:             "read",
			Category:           "medicine_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       false,
			AccessLevel:        "read",
			Scope:              "medical",
			DisplayOrder:       5,
		},
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Manage Medicines",
			Code:               "medicine:manage",
			Description:        stringPtr("Create, update, and manage medicines"),
			Module:             "medicine",
			Resource:           "medicine",
			Action:             "manage",
			Category:           "medicine_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       true,
			AccessLevel:        "admin",
			Scope:              "medical",
			DisplayOrder:       6,
		},
		// Cart permissions
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Manage Cart",
			Code:               "cart:manage",
			Description:        stringPtr("Add, update, and remove items from cart"),
			Module:             "cart",
			Resource:           "cart",
			Action:             "manage",
			Category:           "cart_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       false,
			AccessLevel:        "write",
			Scope:              "own",
			DisplayOrder:       7,
		},
		// Doctor permissions
		{
			BaseModel:          entity.BaseModel{},
			Name:               "View Doctors",
			Code:               "doctor:read",
			Description:        stringPtr("View doctor profiles"),
			Module:             "doctor",
			Resource:           "doctor",
			Action:             "read",
			Category:           "doctor_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       false,
			AccessLevel:        "read",
			Scope:              "medical",
			DisplayOrder:       8,
		},
		// Role management permissions
		{
			BaseModel:          entity.BaseModel{},
			Name:               "Manage Roles",
			Code:               "role:manage",
			Description:        stringPtr("Create, update, and delete roles"),
			Module:             "role",
			Resource:           "role",
			Action:             "manage",
			Category:           "role_management",
			IsSystemPermission: false,
			IsActive:           true,
			RequiresApproval:   true,
			IsFullAccess:       true,
			AccessLevel:        "admin",
			Scope:              "system",
			DisplayOrder:       9,
		},
		// System permissions
		{
			BaseModel:          entity.BaseModel{},
			Name:               "System Administration",
			Code:               "system:admin",
			Description:        stringPtr("Full system administration access"),
			Module:             "system",
			Resource:           "system",
			Action:             "admin",
			Category:           "system",
			IsSystemPermission: true,
			IsActive:           true,
			RequiresApproval:   false,
			IsFullAccess:       true,
			AccessLevel:        "admin",
			Scope:              "system",
			DisplayOrder:       10,
		},
	}

	for i := range permissions {
		if err := d.DB.Create(&permissions[i]).Error; err != nil {
			return fmt.Errorf("failed to create permission %s: %w", permissions[i].Name, err)
		}
	}

	log.Println("Permissions seeded successfully")
	return nil
}

// stringPtr returns a pointer to a string
func stringPtr(s string) *string {
	return &s
}
