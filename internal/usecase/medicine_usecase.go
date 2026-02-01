package usecase

import (
	"context"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
)

// UserUseCase defines the interface for user-related operations
type MedicineUseCase interface {
	// Medicine management methods

	GetMedicines(ctx context.Context, filter types.MedicineRequest) ([]*entity.Medicine, error)
	AddMedicine(ctx context.Context, userId uuid.UUID, medicine *entity.Medicine) (*entity.Medicine, error)
	ListMedicines(ctx context.Context, filters types.MedicineFilters) ([]*entity.Medicine, int64, error)
	GetMedicineByID(ctx context.Context, medicineID uuid.UUID) (*entity.Medicine, error)
	DeleteMedicine(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) (string, error)
	UpdateMedicine(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, updatedMedicine *entity.Medicine) (*entity.Medicine, error)
}

// medicineUseCase implements the MedicineUseCase interface
type medicineUseCase struct {
	medicineRepo repository.MedicineRepository
	userRepo     repository.UserRepository
}

// NewMedicineUseCase creates a new instance of medicineUseCase
func NewMedicineUseCase(medicineRepo repository.MedicineRepository, userRepo repository.UserRepository) MedicineUseCase {
	return &medicineUseCase{
		userRepo:     userRepo,
		medicineRepo: medicineRepo,
	}
}

// GetMedicines implements the MedicineUseCase interface
// This function probably uses the Haversine formula to calculate distance between two points on Earth:
func (u *medicineUseCase) GetMedicines(ctx context.Context, filter types.MedicineRequest) ([]*entity.Medicine, error) {
	medicines, err := u.medicineRepo.GetMedicines(ctx, filter)
	if err != nil {
		return nil, err
	}

	if filter.Latitude != 0 || filter.Longitude != 0 {
		var nearbyMedicines []*entity.Medicine
		radius := float64(filter.Radius)
		if radius <= 0 {
			radius = 20 // Default radius 20km
		}

		for _, med := range medicines {
			if med.Pharmacy != nil {
				if calculateDistance(filter.Latitude, filter.Longitude, med.Pharmacy.Latitude, med.Pharmacy.Longitude) <= radius {
					nearbyMedicines = append(nearbyMedicines, med)
				}
			}
		}
		return nearbyMedicines, nil
	}
	return medicines, nil
}

// AddMedicine implements the MedicineUseCase interface
func (u *medicineUseCase) AddMedicine(ctx context.Context, userId uuid.UUID, medicine *entity.Medicine) (*entity.Medicine, error) {
	// Add any business logic validation here
	// For example: check expiry date
	if medicine.ExpiryDate != nil && medicine.ExpiryDate.Before(time.Now()) {
		return nil, errors.New("medicine has already expired")
	}

	// Call repository
	return u.medicineRepo.AddMedicine(ctx, userId, medicine)
}
func (u *medicineUseCase) GetMedicineByID(ctx context.Context, medicineID uuid.UUID) (*entity.Medicine, error) {
	medicine, err := u.medicineRepo.GetMedicineByID(ctx, medicineID)
	if err != nil {
		return nil, err
	}
	if medicine == nil {
		return nil, errors.New("medicine not found")
	}
	return medicine, nil
}
func (u *medicineUseCase) ListMedicines(ctx context.Context, filters types.MedicineFilters) ([]*entity.Medicine, int64, error) {
	return u.medicineRepo.ListMedicines(ctx, filters)
}
func (u *medicineUseCase) DeleteMedicine(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) (string, error) {
	// Get medicine to check ownership
	medicine, err := u.medicineRepo.GetMedicineByID(ctx, medicineID)
	if err != nil {
		return "", err
	}
	if medicine == nil {
		return "", errors.New("medicine not found")
	}

	// Get user with pharmacy
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", err
	}
	if user == nil || user.Pharmacy == nil {
		return "", errors.New("unauthorized to delete this medicine")
	}

	// Check if medicine belongs to user's pharmacy
	if medicine.PharmacyID != user.Pharmacy.ID {
		return "", errors.New("unauthorized to delete this medicine")
	}

	// Delete medicine
	imageURL := ""
	if medicine.ImageURL != nil {
		imageURL = *medicine.ImageURL
	}

	if err := u.medicineRepo.DeleteMedicine(ctx, medicineID); err != nil {
		return "", err
	}

	return imageURL, nil
}
func (u *medicineUseCase) UpdateMedicine(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, updatedMedicine *entity.Medicine) (*entity.Medicine, error) {
	// Get medicine to check ownership
	medicine, err := u.medicineRepo.GetMedicineByID(ctx, medicineID)
	if err != nil {
		return nil, err
	}
	if medicine == nil {
		return nil, errors.New("medicine not found")
	}

	// Get user with pharmacy
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil || user.Pharmacy == nil {
		return nil, errors.New("unauthorized to update this medicine")
	}

	// Check if medicine belongs to user's pharmacy
	if medicine.PharmacyID != user.Pharmacy.ID {
		return nil, errors.New("unauthorized to update this medicine")
	}

	// Update medicine
	if err := u.medicineRepo.UpdateMedicine(ctx, userID, medicineID, updatedMedicine); err != nil {
		return nil, err
	}
	updatedMedicineData, err := u.medicineRepo.GetMedicineByID(ctx, medicineID)
	if err != nil {
		return nil, err
	}
	return updatedMedicineData, nil
}

func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in km
	dLat := (lat2 - lat1) * (math.Pi / 180)
	dLon := (lon2 - lon1) * (math.Pi / 180)
	lat1 = lat1 * (math.Pi / 180)
	lat2 = lat2 * (math.Pi / 180)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(lat1)*math.Cos(lat2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}
