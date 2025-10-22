package persistence

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"gorm.io/gorm"
)

// auditLogRepository implements repository.AuditLogRepository using GORM.
type DoctorRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository creates a new audit log repository.
func NewDoctorRepository(db *gorm.DB) repository.DoctorRepository {
	return &DoctorRepository{
		db: db,
	}
}

func (r *DoctorRepository) GetDoctors(ctx context.Context, searchQuery string) ([]*entity.Doctor, error) {
	var doctors []*entity.Doctor

	// Start with basic query
	query := r.db.WithContext(ctx).
		Preload("User").
		Where("doctors.is_active = ?", true)

		// If search query is provided, add search conditions with joins
	if searchQuery != "" {
		searchPattern := "%" + strings.ToLower(searchQuery) + "%"

		query = query.
			Joins("LEFT JOIN users ON users.id = doctors.user_id").
			Where(
				"LOWER(users.first_name) LIKE ? OR "+
					"LOWER(users.last_name) LIKE ? OR "+
					"LOWER(CONCAT(users.first_name, ' ', users.last_name)) LIKE ? OR "+
					"LOWER(COALESCE(users.display_name, '')) LIKE ? OR "+
					"LOWER(COALESCE(doctors.specialization_id, '')) LIKE ?",
				searchPattern,
				searchPattern,
				searchPattern,
				searchPattern,
				searchPattern,
			).
			Group("doctors.id")
	}
	// Execute query with ordering
	if err := query.
		Order("doctors.created_at DESC").
		Find(&doctors).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch doctors: %w", err)
	}

	return doctors, nil
}
func (r *DoctorRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Doctor, error) {
	var doctor entity.Doctor
	if err := r.db.WithContext(ctx).
		Preload("User").
		Where("doctors.id = ? AND doctors.is_active = ?", id, true).
		First(&doctor).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("doctor with ID %s not found", id)
		}
		return nil, fmt.Errorf("failed to fetch doctor: %w", err)
	}
	return &doctor, nil
}
