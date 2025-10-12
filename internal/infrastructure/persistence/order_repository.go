package persistence

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) repository.OrderRepository {
	return &OrderRepository{
		db: db,
	}
}

func (r *OrderRepository) AddToCart(ctx context.Context, cart *entity.Cart) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Check if cart exists for user
		var existingCart entity.Cart
		err := tx.Where("user_id = ?", cart.UserID).First(&existingCart).Error

		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		// If cart doesn't exist, create new one
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := tx.Create(cart).Error; err != nil {
				return err
			}
			return nil
		}

		// If cart exists, add new medicine to existing cart
		for _, medicine := range cart.Medicines {
			medicine.CartID = existingCart.ID

			// Check if medicine already in cart
			var existingMedicine entity.CartMedicine
			err := tx.Where("cart_id = ? AND medicine_id = ?", existingCart.ID, medicine.MedicineID).
				First(&existingMedicine).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Add new medicine
				if err := tx.Create(&medicine).Error; err != nil {
					return err
				}
			} else if err == nil {
				// Update quantity
				existingMedicine.Quantity += medicine.Quantity
				if err := tx.Save(&existingMedicine).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		return nil
	})
}
func (r *OrderRepository) GetCartByUserID(ctx context.Context, userID uuid.UUID) (*entity.Cart, error) {
	var cart entity.Cart
	err := r.db.WithContext(ctx).
		Preload("Medicines.Medicine").
		Where("user_id = ?", userID).
		First(&cart).Error

	if err != nil {
		return nil, err
	}

	// Calculate total amount
	var totalAmount float64
	for _, medicine := range cart.Medicines {
		totalAmount += medicine.Medicine.Price * float64(medicine.Quantity)
	}
	cart.TotalAmount = totalAmount

	return &cart, nil
}
func (r *OrderRepository) RemoveFromCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Find the user's cart
		var cart entity.Cart
		if err := tx.Where("user_id = ?", userID).First(&cart).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("cart not found")
			}
			return err
		}

		// Delete the cart medicine item
		result := tx.Where("cart_id = ? AND medicine_id = ?", cart.ID, medicineID).
			Delete(&entity.CartMedicine{})

		if result.Error != nil {
			return result.Error
		}

		if result.RowsAffected == 0 {
			return errors.New("medicine not found in cart")
		}

		return nil
	})
}
