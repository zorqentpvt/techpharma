package persistence

import (
	"context"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"gorm.io/gorm"
)

// auditLogRepository implements repository.AuditLogRepository using GORM.
type auditLogRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository creates a new audit log repository.
func NewAuditLogRepository(db *gorm.DB) repository.AuditLogRepository {
	return &auditLogRepository{
		db: db,
	}
}

// Create adds a new audit log entry to the database.
func (r *auditLogRepository) Create(ctx context.Context, logEntry *entity.AuditLog) error {
	return r.db.WithContext(ctx).Create(logEntry).Error
}
