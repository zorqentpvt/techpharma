package persistence

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"gorm.io/gorm"
)

// auditLogRepository implements repository.AuditLogRepository using GORM.
type MedicineRepository struct {
	db *gorm.DB
}

// NewMedicineRepository creates a new medicine repository.
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

func (r *MedicineRepository) AddMedicine(ctx context.Context, userId uuid.UUID, medicine *entity.Medicine) (*entity.Medicine, error) {
	// Insert into database
	if err := r.db.WithContext(ctx).Create(medicine).Error; err != nil {
		return nil, err
	}

	// Optionally reload with pharmacy details
	if err := r.db.WithContext(ctx).
		Preload("Pharmacy").
		First(medicine, medicine.ID).Error; err != nil {
		return nil, err
	}

	return medicine, nil
}
func (r *MedicineRepository) ListMedicines(ctx context.Context, filters types.MedicineFilters) ([]*entity.Medicine, int64, error) {
	var medicines []*entity.Medicine
	var total int64

	// Build query
	query := r.db.WithContext(ctx).Model(&entity.Medicine{})

	// Apply filters
	if filters.Name != "" {
		query = query.Where("name ILIKE ?", "%"+filters.Name+"%")
	}
	if filters.Content != "" {
		query = query.Where("content ILIKE ?", "%"+filters.Content+"%")
	}
	if filters.PharmacyID != nil {
		query = query.Where("pharmacy_id = ?", *filters.PharmacyID)
	}
	if filters.PrescriptionRequired != nil {
		query = query.Where("prescription_required = ?", *filters.PrescriptionRequired)
	}
	if filters.IsActive != nil {
		query = query.Where("is_active = ?", *filters.IsActive)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	orderClause := filters.SortBy + " " + filters.SortOrder
	query = query.Order(orderClause)

	// Apply pagination
	offset := (filters.Page - 1) * filters.Limit
	query = query.Offset(offset).Limit(filters.Limit)

	// Preload pharmacy and fetch results
	if err := query.Preload("Pharmacy").Find(&medicines).Error; err != nil {
		return nil, 0, err
	}

	return medicines, total, nil
}
func (r *MedicineRepository) GetMedicineByID(ctx context.Context, medicineID uuid.UUID) (*entity.Medicine, error) {
	var medicine entity.Medicine

	if err := r.db.WithContext(ctx).
		Preload("Pharmacy").
		First(&medicine, "id = ?", medicineID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &medicine, nil
}
func (r *MedicineRepository) DeleteMedicine(ctx context.Context, medicineID uuid.UUID) error {
	result := r.db.WithContext(ctx).Delete(&entity.Medicine{}, "id = ?", medicineID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("medicine not found")
	}
	return nil
}
func (r *MedicineRepository) UpdateMedicine(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, updatedMedicine *entity.Medicine) error {
	result := r.db.WithContext(ctx).Model(&entity.Medicine{}).
		Where("id = ? AND pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = ?)", medicineID, userID).
		Updates(updatedMedicine)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("medicine not found or unauthorized to update")
	}
	return nil
}
