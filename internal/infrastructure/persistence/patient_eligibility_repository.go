package persistence

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"gorm.io/gorm"
)

type patientEligibilityRepository struct {
	db *gorm.DB
}

func NewPatientEligibilityRepository(db *gorm.DB) repository.PatientEligibilityRepository {
	return &patientEligibilityRepository{db: db}
}

func (r *patientEligibilityRepository) Create(ctx context.Context, eligibility *entity.PatientEligibility) error {
	return r.db.WithContext(ctx).Create(eligibility).Error
}

func (r *patientEligibilityRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.PatientEligibility, error) {
	var eligibility entity.PatientEligibility
	err := r.db.WithContext(ctx).
		Preload("User").
		First(&eligibility, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &eligibility, nil
}

func (r *patientEligibilityRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entity.PatientEligibility, error) {
	var eligibilities []*entity.PatientEligibility
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&eligibilities).Error
	return eligibilities, err
}

func (r *patientEligibilityRepository) GetActiveByUserID(ctx context.Context, userID uuid.UUID) (*entity.PatientEligibility, error) {
	var eligibility entity.PatientEligibility
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND status = ? AND is_active = ? AND valid_until > ?",
			userID, entity.EligibilityApproved, true, time.Now()).
		First(&eligibility).Error
	if err != nil {
		return nil, err
	}
	return &eligibility, nil
}

func (r *patientEligibilityRepository) Update(ctx context.Context, eligibility *entity.PatientEligibility) error {
	return r.db.WithContext(ctx).Save(eligibility).Error
}

func (r *patientEligibilityRepository) Approve(ctx context.Context, id uuid.UUID, verifiedBy uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&entity.PatientEligibility{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":      entity.EligibilityApproved,
			"verified_by": verifiedBy,
			"verified_at": now,
			"is_active":   true,
			"updated_at":  now,
		}).Error
}

func (r *patientEligibilityRepository) Reject(ctx context.Context, id uuid.UUID, verifiedBy uuid.UUID, reason string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&entity.PatientEligibility{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":           entity.EligibilityRejected,
			"verified_by":      verifiedBy,
			"verified_at":      now,
			"rejection_reason": reason,
			"is_active":        false,
			"updated_at":       now,
		}).Error
}

func (r *patientEligibilityRepository) CheckExpiredEligibilities(ctx context.Context) ([]*entity.PatientEligibility, error) {
	var eligibilities []*entity.PatientEligibility
	err := r.db.WithContext(ctx).
		Where("status = ? AND is_active = ? AND valid_until < ?",
			entity.EligibilityApproved, true, time.Now()).
		Find(&eligibilities).Error
	return eligibilities, err
}

func (r *patientEligibilityRepository) MarkAsExpired(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&entity.PatientEligibility{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     entity.EligibilityExpired,
			"is_active":  false,
			"updated_at": time.Now(),
		}).Error
}
func (r *patientEligibilityRepository) GetAll(ctx context.Context, status string) ([]*entity.PatientEligibility, error) {
	var eligibilities []*entity.PatientEligibility
	query := r.db.WithContext(ctx).Preload("User").Order("created_at DESC")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&eligibilities).Error
	return eligibilities, err
}
