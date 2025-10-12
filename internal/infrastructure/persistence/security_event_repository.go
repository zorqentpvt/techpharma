// internal/infrastructure/persistence/security_event_repository.go

package persistence

import (
	"context"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"gorm.io/gorm"
)

// securityEventRepository implements the repository.SecurityEventRepository interface.
type securityEventRepository struct {
	db *gorm.DB
}

// NewSecurityEventRepository creates a new instance of the security event repository.
func NewSecurityEventRepository(db *gorm.DB) repository.SecurityEventRepository {
	return &securityEventRepository{
		db: db,
	}
}

// Create adds a new security event to the database.
func (r *securityEventRepository) Create(ctx context.Context, securityEvent *entity.SecurityEvent) error {
	return r.db.WithContext(ctx).Create(securityEvent).Error
}

func (r *securityEventRepository) SendPasswordResetEmail(ctx context.Context, email string, resetoken string) error {
	// Implementation for sending password reset email
	// This is a placeholder; actual implementation will depend on your email service
	return nil
}
