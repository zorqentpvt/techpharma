package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
)

// UserUseCase defines the interface for user-related operations
type OrderUseCase interface {
	// Order management methods

	AddToCart(ctx context.Context, order *entity.Cart) error
	GetCart(ctx context.Context, userID uuid.UUID) (*entity.Cart, error)
	RemoveFromCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) error
}

// orderUseCase implements the OrderUseCase interface
type orderUseCase struct {
	orderRepo repository.OrderRepository
}

// NewMedicineUseCase creates a new instance of medicineUseCase
func NewOrderUseCase(orderRepo repository.OrderRepository) OrderUseCase {
	return &orderUseCase{
		orderRepo: orderRepo,
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
