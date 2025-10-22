package usecase

import (
	"context"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
)

// UserUseCase defines the interface for user-related operations
type DoctorUseCase interface {
	// Doctor management methods

	GetDoctors(ctx context.Context, searchQuery string) ([]*entity.Doctor, error)
}

// medicineUseCase implements the MedicineUseCase interface
type doctorUseCase struct {
	doctorRepo repository.DoctorRepository
}

// NewDoctorUseCase creates a new instance of doctorUseCase
func NewDoctorUseCase(doctorRepo repository.DoctorRepository) DoctorUseCase {
	return &doctorUseCase{
		doctorRepo: doctorRepo,
	}
}

// GetDoctors implements DoctorUseCase.
func (d *doctorUseCase) GetDoctors(ctx context.Context, searchQuery string) ([]*entity.Doctor, error) {
	return d.doctorRepo.GetDoctors(ctx, searchQuery)
}
