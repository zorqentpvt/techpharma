package persistence

import (
	"context"
	"fmt"
	"strings"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"gorm.io/gorm"
)

// auditLogRepository implements repository.AuditLogRepository using GORM.
type MedicineRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository creates a new audit log repository.
func NewMedicineRepository(db *gorm.DB) repository.MedicineRepository {
	return &MedicineRepository{
		db: db,
	}
}
func (r *MedicineRepository) GetMedicines(ctx context.Context, searchQuery string) ([]*entity.Medicine, error) {
	var medicines []*entity.Medicine

	query := r.db.WithContext(ctx).Preload("Pharmacy")

	// If search query is provided, search in both name and content
	if searchQuery != "" {
		searchPattern := "%" + strings.ToLower(searchQuery) + "%"
		query = query.Where(
			"LOWER(name) LIKE ? OR LOWER(content) LIKE ?",
			searchPattern,
			searchPattern,
		)
	}

	// Execute the query
	if err := query.Find(&medicines).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch medicines: %w", err)
	}

	return medicines, nil
}
