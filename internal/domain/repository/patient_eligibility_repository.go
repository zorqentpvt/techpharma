package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
)

type PatientEligibilityRepository interface {
	Create(ctx context.Context, eligibility *entity.PatientEligibility) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.PatientEligibility, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*entity.PatientEligibility, error)
	GetActiveByUserID(ctx context.Context, userID uuid.UUID) (*entity.PatientEligibility, error)
	Update(ctx context.Context, eligibility *entity.PatientEligibility) error
	Approve(ctx context.Context, id uuid.UUID, verifiedBy uuid.UUID) error
	Reject(ctx context.Context, id uuid.UUID, verifiedBy uuid.UUID, reason string) error
	CheckExpiredEligibilities(ctx context.Context) ([]*entity.PatientEligibility, error)
	MarkAsExpired(ctx context.Context, id uuid.UUID) error
	GetAll(ctx context.Context, status string) ([]*entity.PatientEligibility, error)
}
