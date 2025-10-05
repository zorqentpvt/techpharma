package usecase

import (
	"context"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
)

// UserUseCase defines the interface for user-related operations
type MedicineUseCase interface {
	// Medicine management methods

	GetMedicines(ctx context.Context, searchQuery string) ([]*entity.Medicine, error)
}

// medicineUseCase implements the MedicineUseCase interface
type medicineUseCase struct {
	medicineRepo repository.MedicineRepository
}

// NewMedicineUseCase creates a new instance of medicineUseCase
func NewMedicineUseCase(medicineRepo repository.MedicineRepository) MedicineUseCase {
	return &medicineUseCase{
		medicineRepo: medicineRepo,
	}
}

// GetMedicines implements the MedicineUseCase interface
func (u *medicineUseCase) GetMedicines(ctx context.Context, searchQuery string) ([]*entity.Medicine, error) {
	return u.medicineRepo.GetMedicines(ctx, searchQuery)
}
