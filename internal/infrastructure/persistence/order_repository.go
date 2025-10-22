package persistence

import (
	"context"
	"errors"
	"fmt"

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

		// Delete the cart medicine item
		result := tx.Where("id = ? ", medicineID).
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
func (r *OrderRepository) UpdateCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID, quantity int) (*entity.Cart, error) {
	// Get cart
	cart, err := r.GetCartByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// If quantity is 0, remove the item
	if quantity == 0 {
		result := r.db.WithContext(ctx).
			Where("cart_id = ? AND medicine_id = ?", cart.ID, medicineID).
			Delete(&entity.CartMedicine{})

		if result.Error != nil {
			return nil, result.Error
		}

		if result.RowsAffected == 0 {
			return nil, errors.New("item not found in cart")
		}

		// Recalculate total
		if err := r.recalculateTotal(ctx, cart.ID); err != nil {
			return nil, err
		}

		// Return updated cart
		return r.GetCartByUserID(ctx, userID)
	}

	// Find cart medicine item
	var cartMedicine entity.CartMedicine
	if err := r.db.WithContext(ctx).
		Where("cart_id = ? AND medicine_id = ?", cart.ID, medicineID).
		First(&cartMedicine).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("item not found in cart")
		}
		return nil, err
	}

	// Update quantity
	cartMedicine.Quantity = quantity
	if err := r.db.WithContext(ctx).Save(&cartMedicine).Error; err != nil {
		return nil, err
	}

	// Recalculate total
	if err := r.recalculateTotal(ctx, cart.ID); err != nil {
		return nil, err
	}

	// Return updated cart
	return r.GetCartByUserID(ctx, userID)
}

// recalculateTotal recalculates the total amount for a cart
func (r *OrderRepository) recalculateTotal(ctx context.Context, cartID uuid.UUID) error {
	var cartMedicines []entity.CartMedicine
	if err := r.db.WithContext(ctx).
		Preload("Medicine").
		Where("cart_id = ?", cartID).
		Find(&cartMedicines).Error; err != nil {
		return err
	}

	var total float64
	for _, item := range cartMedicines {
		if item.Medicine.ID != uuid.Nil {
			total += float64(item.Medicine.Price) * float64(item.Quantity)
		}
	}

	return r.db.WithContext(ctx).
		Model(&entity.Cart{}).
		Where("id = ?", cartID).
		Update("total_amount", total).Error
}
func (r *OrderRepository) CreateOrderFromCart(ctx context.Context, cart *entity.Cart, paymentID uuid.UUID, deliveryAddress string) (*entity.Order, error) {
	return nil, r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Generate order number
		orderNumber := fmt.Sprintf("ORD-%s", uuid.New().String()[:8])

		// Create order
		order := &entity.Order{
			OrderNumber:     orderNumber,
			UserID:          cart.UserID,
			PaymentID:       paymentID,
			TotalAmount:     cart.TotalAmount,
			Status:          "confirmed",
			DeliveryAddress: deliveryAddress,
		}

		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// Create order items from cart medicines
		for _, cartMedicine := range cart.Medicines {
			orderItem := &entity.OrderItem{
				OrderID:    order.ID,
				MedicineID: cartMedicine.MedicineID,
				Quantity:   cartMedicine.Quantity,
				Price:      cartMedicine.Medicine.Price,
				Subtotal:   float64(cartMedicine.Quantity) * cartMedicine.Medicine.Price,
			}

			if err := tx.Create(orderItem).Error; err != nil {
				return err
			}
		}

		// Reload with relationships
		if err := tx.Preload("OrderItems.Medicine").
			Preload("User").
			First(order, order.ID).Error; err != nil {
			return err
		}

		return nil
	})
}

// ClearCart clears all items from user's cart
func (r *OrderRepository) ClearCart(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Get cart
		var cart entity.Cart
		if err := tx.Where("user_id = ?", userID).First(&cart).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil // Cart doesn't exist, nothing to clear
			}
			return err
		}

		// Delete all cart medicines
		if err := tx.Where("cart_id = ?", cart.ID).Delete(&entity.CartMedicine{}).Error; err != nil {
			return err
		}

		// Update cart total to 0
		return tx.Model(&cart).Update("total_amount", 0).Error
	})
}

// GetOrderByID retrieves an order by ID
func (r *OrderRepository) GetOrderByID(ctx context.Context, orderID uuid.UUID) (*entity.Order, error) {
	var order entity.Order
	err := r.db.WithContext(ctx).
		Preload("Payment").
		Preload("OrderItems.Medicine.Pharmacy").
		First(&order, "id = ?", orderID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

// GetUserOrders retrieves all orders for a user with pagination
func (r *OrderRepository) GetUserOrders(ctx context.Context, userID uuid.UUID, page, limit int) ([]*entity.Order, int64, error) {
	var orders []*entity.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Order{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Preload("OrderItems.Medicine").
		Preload("Payment").
		Find(&orders).Error

	return orders, total, err
}

// UpdateOrderStatus updates the status of an order
func (r *OrderRepository) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string) error {
	return r.db.WithContext(ctx).
		Model(&entity.Order{}).
		Where("id = ?", orderID).
		Update("status", status).Error
}
func (r *OrderRepository) GetCartByID(ctx context.Context, cartID uuid.UUID) (*entity.Cart, error) {
	var cart entity.Cart
	err := r.db.WithContext(ctx).
		Preload("Medicines.Medicine").
		First(&cart, "id = ?", cartID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &cart, nil
}
