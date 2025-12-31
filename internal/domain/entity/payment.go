package entity

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Payment struct {
	BaseModel

	// Order details
	OrderID  string  `json:"orderId" gorm:"uniqueIndex;not null"`
	Amount   float64 `json:"amount" gorm:"not null;type:decimal(10,2)"`
	Currency string  `json:"currency" gorm:"default:'INR'"`

	// User details
	UserID uuid.UUID `json:"userId" gorm:"type:uuid;not null"`
	User   *User     `json:"user,omitempty" gorm:"foreignKey:UserID"`

	// Cart reference
	CartID *uuid.UUID `json:"cartId,omitempty" gorm:"type:uuid"`
	Cart   *Cart      `json:"cart,omitempty" gorm:"foreignKey:CartID"`

	PharmacyID uuid.UUID `json:"pharmacyId,omitempty" gorm:"type:uuid"`

	MedicineID *uuid.UUID `json:"medicineId,omitempty" gorm:"type:uuid"`
	Quantity   *int       `json:"quantity" gorm:"not null"`

	// Razorpay details
	RazorpayOrderID   string `json:"razorpayOrderId" gorm:"uniqueIndex"`
	RazorpayPaymentID string `json:"razorpayPaymentId" gorm:"index"`
	RazorpaySignature string `json:"razorpaySignature"`

	// Payment status
	Status        string `json:"status" gorm:"default:'pending'"` // pending, success, failed, refunded
	PaymentMethod string `json:"paymentMethod"`                   // card, netbanking, wallet, upi

	// Additional info
	Description   string `json:"description"`
	Notes         string `json:"notes" gorm:"type:jsonb"`
	FailureReason string `json:"failureReason,omitempty"`

	// Delivery address (if needed)
	DeliveryAddress string `json:"deliveryAddress"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (Payment) TableName() string {
	return "payments"
}
