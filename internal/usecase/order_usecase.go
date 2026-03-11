package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	domainErrors "github.com/skryfon/collex/internal/domain/errors"
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
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string, userID uuid.UUID) error
	GetPharmacyOrders(ctx context.Context, pharmacyID uuid.UUID, filter types.ListPharmacyOrders) ([]*entity.Order, int64, error)

	//Order Managem	enet Methods
	GetTotalRevenue(ctx context.Context, pharmacyID uuid.UUID) (float64, int64, error)
	CreateFreeMedicineOrder(ctx context.Context, userID uuid.UUID, cartID uuid.UUID, pharmacyID uuid.UUID) (*entity.Order, error)
}

// orderUseCase implements the OrderUseCase interface
type orderUseCase struct {
	orderRepo     repository.OrderRepository
	medicineRepo  repository.MedicineRepository
	userRepo      repository.UserRepository
	eligibilityUC PatientEligibilityUseCase
}

// NewMedicineUseCase creates a new instance of medicineUseCase
func NewOrderUseCase(orderRepo repository.OrderRepository, medicineRepo repository.MedicineRepository, userRepo repository.UserRepository, eligibilityUC PatientEligibilityUseCase) OrderUseCase {
	return &orderUseCase{
		orderRepo:     orderRepo,
		medicineRepo:  medicineRepo,
		userRepo:      userRepo,
		eligibilityUC: eligibilityUC,
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
	if medicine.IsActive == nil || !*medicine.IsActive {
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

func (uc *orderUseCase) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string, userID uuid.UUID) error {
	// Get pharmacy associated with the user
	pharmacy, err := uc.orderRepo.GetPharmacyByUserID(ctx, userID)
	if err != nil {
		return errors.New("unauthorized")
	}
	if pharmacy == nil {
		return errors.New("unauthorized")
	}

	// Get the order to verify ownership
	order, err := uc.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return errors.New("order not found")
	}

	// Verify that the order belongs to the user's pharmacy
	if len(order.OrderItems) == 0 {
		return errors.New("order has no items")
	}

	if order.OrderItems[0].Medicine.PharmacyID != pharmacy.ID {
		return errors.New("unauthorized")
	}

	// Update the order status
	return uc.orderRepo.UpdateOrderStatus(ctx, orderID, status)
}

func (uc *orderUseCase) GetTotalRevenue(ctx context.Context, pharmacyID uuid.UUID) (float64, int64, error) {
	return uc.orderRepo.GetTotalRevenue(ctx, pharmacyID)
}

func (uc *orderUseCase) CreateFreeMedicineOrder(ctx context.Context, userID uuid.UUID, cartID uuid.UUID, pharmacyID uuid.UUID) (*entity.Order, error) {
	// Verify user eligibility
	eligibility, err := uc.eligibilityUC.VerifyEligibilityForOrder(ctx, userID)
	if err != nil {
		return nil, err
	}

	pharmacy, err := uc.orderRepo.GetPharmacyByID(ctx, pharmacyID)
	if err != nil || pharmacy == nil {
		return nil, domainErrors.NewDomainError("PHARMACY_NOT_FOUND", "Pharmacy not found", domainErrors.ErrNotFound)
	}

	if !pharmacy.CanProvideFreeMedicines() {
		return nil, domainErrors.NewDomainError("PHARMACY_NOT_ELIGIBLE", "This pharmacy does not provide free medicines", domainErrors.ErrForbidden)
	}

	// Get cart
	cart, err := uc.orderRepo.GetCartByID(ctx, cartID)
	if err != nil || cart == nil {
		return nil, domainErrors.NewDomainError("CART_NOT_FOUND", "Cart not found", domainErrors.ErrNotFound)
	}

	// Check if all items require a prescription
	for _, item := range cart.Medicines {
		if item.Medicine.ID == uuid.Nil || item.Medicine.PrescriptionRequired == nil || !*item.Medicine.PrescriptionRequired {
			return nil, domainErrors.NewDomainError("PRESCRIPTION_REQUIRED", "All items for a free order must require a prescription.", domainErrors.ErrForbidden)
		}
	}

	// Fetch user to get delivery address
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, domainErrors.NewDomainError("USER_NOT_FOUND", "User not found", domainErrors.ErrNotFound)
	}
	deliveryAddress := user.Address.GetFullAddress()

	// Create the free medicine order using repository
	return uc.orderRepo.CreateFreeMedicineOrder(ctx, cart, pharmacyID, eligibility.ID, deliveryAddress)
}
