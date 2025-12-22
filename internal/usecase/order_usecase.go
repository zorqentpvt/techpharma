package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
)

// UserUseCase defines the interface for user-related operations
type OrderUseCase interface {
	// Cart management methods

	AddToCart(ctx context.Context, order *entity.Cart) error
	GetCart(ctx context.Context, userID uuid.UUID) (*entity.Cart, error)
	RemoveFromCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) error
	UpdateCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, quantity int) (*entity.Cart, error)
	GetPharmacyByUserID(ctx context.Context, userID uuid.UUID) (*entity.Pharmacy, error)

	GetPharmacyOrders(ctx context.Context, pharmacyID uuid.UUID, filter types.ListPharmacyOrders) ([]*entity.Order, int64, error)

	//Order Managemenet Methods

}

// orderUseCase implements the OrderUseCase interface
type orderUseCase struct {
	orderRepo    repository.OrderRepository
	medicineRepo repository.MedicineRepository
}

// NewMedicineUseCase creates a new instance of medicineUseCase
func NewOrderUseCase(orderRepo repository.OrderRepository, medicineRepo repository.MedicineRepository) OrderUseCase {
	return &orderUseCase{
		orderRepo:    orderRepo,
		medicineRepo: medicineRepo,
	}
}

func (uc *orderUseCase) AddToCart(ctx context.Context, order *entity.Cart) error {
	return uc.orderRepo.AddToCart(ctx, order)
}
func (uc *orderUseCase) GetCart(ctx context.Context, userID uuid.UUID) (*entity.Cart, error) {
	return uc.orderRepo.GetCartByUserID(ctx, userID)
}
func (uc *orderUseCase) RemoveFromCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) error {
	return uc.orderRepo.RemoveFromCart(ctx, userID, medicineID)
}
func (uc *orderUseCase) UpdateCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, quantity int) (*entity.Cart, error) {
	// Validate quantity
	if quantity < 0 {
		return nil, errors.New("quantity cannot be negative")
	}

	// If quantity is 0, just remove from cart (no need to check medicine)
	if quantity == 0 {
		return uc.orderRepo.UpdateCart(ctx, userID, medicineID, quantity)
	}

	// Get medicine to check availability and active status
	medicine, err := uc.medicineRepo.GetMedicineByID(ctx, medicineID)
	if err != nil {
		return nil, err
	}
	if medicine == nil {
		return nil, errors.New("medicine not found")
	}
	if !medicine.IsActive {
		return nil, errors.New("medicine is not active")
	}

	// Check if requested quantity is available
	if quantity > medicine.Quantity {
		return nil, fmt.Errorf("only %d units available", medicine.Quantity)
	}

	// Update cart item
	return uc.orderRepo.UpdateCart(ctx, userID, medicineID, quantity)
}
func (uc *orderUseCase) GetPharmacyByUserID(ctx context.Context, userID uuid.UUID) (*entity.Pharmacy, error) {
	pharmacy, err := uc.orderRepo.GetPharmacyByUserID(ctx, userID)
	if err != nil {
		return nil, errors.New("pharmacy not found")
	}
	return pharmacy, nil
}
func (u *orderUseCase) GetPharmacyOrders(ctx context.Context, pharmacyID uuid.UUID, filter types.ListPharmacyOrders) ([]*entity.Order, int64, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	return u.orderRepo.GetPharmacyOrders(ctx, pharmacyID, filter)
}
