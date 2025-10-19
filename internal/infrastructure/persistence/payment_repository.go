package persistence

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"gorm.io/gorm"
)

type PaymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Create(ctx context.Context, payment *entity.Payment) error {
	return r.db.WithContext(ctx).Create(payment).Error
}

func (r *PaymentRepository) GetByOrderID(ctx context.Context, orderID string) (*entity.Payment, error) {
	var payment entity.Payment
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Cart").
		Preload("Cart.Medicines.Medicine").
		Where("order_id = ?", orderID).
		First(&payment).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

func (r *PaymentRepository) GetByRazorpayOrderID(ctx context.Context, razorpayOrderID string) (*entity.Payment, error) {
	var payment entity.Payment
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("razorpay_order_id = ?", razorpayOrderID).
		First(&payment).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

func (r *PaymentRepository) UpdateStatus(ctx context.Context, orderID string, status string, razorpayPaymentID, razorpaySignature, paymentMethod, failureReason string) error {
	updates := map[string]interface{}{
		"status": status,
	}

	if razorpayPaymentID != "" {
		updates["razorpay_payment_id"] = razorpayPaymentID
	}
	if razorpaySignature != "" {
		updates["razorpay_signature"] = razorpaySignature
	}
	if paymentMethod != "" {
		updates["payment_method"] = paymentMethod
	}
	if failureReason != "" {
		updates["failure_reason"] = failureReason
	}

	return r.db.WithContext(ctx).
		Model(&entity.Payment{}).
		Where("order_id = ?", orderID).
		Updates(updates).Error
}

func (r *PaymentRepository) GetUserPayments(ctx context.Context, userID uuid.UUID, page, limit int) ([]*entity.Payment, int64, error) {
	var payments []*entity.Payment
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Payment{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := query.Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Preload("Cart").
		Find(&payments).Error

	return payments, total, err
}
