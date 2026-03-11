package usecase

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	domainErrors "github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"gorm.io/gorm"
)

type PatientEligibilityUseCase interface {
	ApplyForEligibility(ctx context.Context, req *types.EligibilityApplicationRequest) (*entity.PatientEligibility, error)
	GetUserEligibility(ctx context.Context, userID uuid.UUID) ([]*entity.PatientEligibility, error)
	GetActiveEligibility(ctx context.Context, userID uuid.UUID) (*entity.PatientEligibility, error)
	ApproveEligibility(ctx context.Context, eligibilityID uuid.UUID, verifiedBy uuid.UUID) error
	RejectEligibility(ctx context.Context, eligibilityID uuid.UUID, verifiedBy uuid.UUID, reason string) error
	CheckAndExpireEligibilities(ctx context.Context) error
	VerifyEligibilityForOrder(ctx context.Context, userID uuid.UUID) (*entity.PatientEligibility, error)
	GetAllEligibilityRequests(ctx context.Context, status string) ([]*entity.PatientEligibility, error)
}

type patientEligibilityUseCase struct {
	eligibilityRepo repository.PatientEligibilityRepository
	userRepo        repository.UserRepository
}

func NewPatientEligibilityUseCase(
	eligibilityRepo repository.PatientEligibilityRepository,
	userRepo repository.UserRepository,
) PatientEligibilityUseCase {
	return &patientEligibilityUseCase{
		eligibilityRepo: eligibilityRepo,
		userRepo:        userRepo,
	}
}

func (uc *patientEligibilityUseCase) ApplyForEligibility(ctx context.Context, req *types.EligibilityApplicationRequest) (*entity.PatientEligibility, error) {
	user, err := uc.userRepo.GetByID(ctx, req.UserID)
	if err != nil || user == nil {
		return nil, domainErrors.NewDomainError("USER_NOT_FOUND", "User not found", domainErrors.ErrNotFound)
	}

	// ✅ Properly handle the two distinct cases
	existingEligibility, err := uc.eligibilityRepo.GetActiveByUserID(ctx, req.UserID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		// Real DB error — bail out
		return nil, domainErrors.NewDomainError("DB_ERROR", "Failed to check existing eligibility", err)
	}
	if existingEligibility != nil {
		return nil, domainErrors.NewDomainError("ACTIVE_ELIGIBILITY_EXISTS", "User already has active eligibility", domainErrors.ErrAlreadyExists)
	}
	// Validate scheme-specific requirements
	if err := uc.validateSchemeRequirements(req); err != nil {
		return nil, err
	}

	// Create eligibility record
	eligibility := &entity.PatientEligibility{
		UserID:                      req.UserID,
		SchemeType:                  entity.FreeMedicineSchemeType(req.SchemeType),
		Status:                      entity.EligibilityPending,
		DocumentType:                req.DocumentType,
		DocumentNumber:              req.DocumentNumber,
		DocumentURL:                 req.DocumentURL,
		ValidFrom:                   req.ValidFrom,
		ValidUntil:                  req.ValidUntil,
		IsActive:                    false, // Will be activated upon approval
		OtherSchemeBenefitsReceived: req.OtherSchemeBenefitsReceived,
	}

	// Set scheme-specific fields
	switch req.SchemeType {
	case string(entity.SchemeCancerPatient), string(entity.SchemeKidneyPatient):
		eligibility.MedicalCondition = req.MedicalCondition
		eligibility.DiagnosisDate = req.DiagnosisDate
		eligibility.TreatingHospital = req.TreatingHospital
		eligibility.DoctorName = req.DoctorName
	case string(entity.SchemeBPLCard):
		eligibility.BPLCardNumber = req.BPLCardNumber
		eligibility.BPLState = req.BPLState
		eligibility.BPLDistrict = req.BPLDistrict
	case string(entity.SchemeOther):
		eligibility.OtherSchemeName = req.OtherSchemeName
	}

	if err := uc.eligibilityRepo.Create(ctx, eligibility); err != nil {
		return nil, domainErrors.NewDomainError("CREATE_FAILED", "Failed to create eligibility application", err)
	}

	return eligibility, nil
}

func (uc *patientEligibilityUseCase) validateSchemeRequirements(req *types.EligibilityApplicationRequest) error {
	switch req.SchemeType {
	case string(entity.SchemeCancerPatient), string(entity.SchemeKidneyPatient):
		if req.MedicalCondition == nil || req.DiagnosisDate == nil {
			return domainErrors.NewDomainError("INVALID_INPUT", "Medical condition and diagnosis date are required", domainErrors.ErrInvalidInput)
		}
	case string(entity.SchemeBPLCard):
		if req.BPLCardNumber == nil || req.BPLState == nil {
			return domainErrors.NewDomainError("INVALID_INPUT", "BPL card number and state are required", domainErrors.ErrInvalidInput)
		}
	}

	if req.OtherSchemeBenefitsReceived {
		return domainErrors.NewDomainError("INVALID_INPUT", "Cannot apply if receiving benefits from other schemes", domainErrors.ErrInvalidInput)
	}

	return nil
}

func (uc *patientEligibilityUseCase) GetUserEligibility(ctx context.Context, userID uuid.UUID) ([]*entity.PatientEligibility, error) {
	return uc.eligibilityRepo.GetByUserID(ctx, userID)
}

func (uc *patientEligibilityUseCase) GetActiveEligibility(ctx context.Context, userID uuid.UUID) (*entity.PatientEligibility, error) {
	eligibility, err := uc.eligibilityRepo.GetActiveByUserID(ctx, userID)
	if err != nil {
		return nil, domainErrors.NewDomainError("NO_ACTIVE_ELIGIBILITY", "No active eligibility found", domainErrors.ErrNotFound)
	}
	return eligibility, nil
}

func (uc *patientEligibilityUseCase) ApproveEligibility(ctx context.Context, eligibilityID uuid.UUID, verifiedBy uuid.UUID) error {
	return uc.eligibilityRepo.Approve(ctx, eligibilityID, verifiedBy)
}

func (uc *patientEligibilityUseCase) RejectEligibility(ctx context.Context, eligibilityID uuid.UUID, verifiedBy uuid.UUID, reason string) error {
	return uc.eligibilityRepo.Reject(ctx, eligibilityID, verifiedBy, reason)
}

func (uc *patientEligibilityUseCase) CheckAndExpireEligibilities(ctx context.Context) error {
	expiredEligibilities, err := uc.eligibilityRepo.CheckExpiredEligibilities(ctx)
	if err != nil {
		return err
	}

	for _, eligibility := range expiredEligibilities {
		if err := uc.eligibilityRepo.MarkAsExpired(ctx, eligibility.ID); err != nil {
			// Log error but continue processing others
			continue
		}
	}

	return nil
}

func (uc *patientEligibilityUseCase) VerifyEligibilityForOrder(ctx context.Context, userID uuid.UUID) (*entity.PatientEligibility, error) {
	eligibility, err := uc.eligibilityRepo.GetActiveByUserID(ctx, userID)
	if err != nil {
		return nil, domainErrors.NewDomainError("NO_ELIGIBILITY", "User is not eligible for free medicines", domainErrors.ErrForbidden)
	}

	if !eligibility.CanOrderFreeMedicine() {
		return nil, domainErrors.NewDomainError("INELIGIBLE", "Eligibility requirements not met", domainErrors.ErrForbidden)
	}

	return eligibility, nil
}
func (uc *patientEligibilityUseCase) GetAllEligibilityRequests(ctx context.Context, status string) ([]*entity.PatientEligibility, error) {
	return uc.eligibilityRepo.GetAll(ctx, status)
}
