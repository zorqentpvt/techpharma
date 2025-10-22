package entity

import (
	"github.com/google/uuid"
)

// Order represents a completed order
type Order struct {
	BaseModel
	OrderNumber     string      `json:"orderNumber" gorm:"uniqueIndex;not null"`
	UserID          uuid.UUID   `json:"userId" gorm:"type:uuid;not null"`
	User            *User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	PaymentID       uuid.UUID   `json:"paymentId" gorm:"type:uuid;not null"`
	PharmacyID      uuid.UUID   `json:"pharmacyId" gorm:"type:uuid;index"`               // ADD THIS
	Pharmacy        *Pharmacy   `json:"pharmacy,omitempty" gorm:"foreignKey:PharmacyID"` // ADD THIS
	Payment         *Payment    `json:"payment,omitempty" gorm:"foreignKey:PaymentID"`
	TotalAmount     float64     `json:"totalAmount" gorm:"type:decimal(10,2);not null"`
	Status          string      `json:"status" gorm:"default:'pending'"` // pending, confirmed, processing, shipped, delivered, cancelled
	DeliveryAddress string      `json:"deliveryAddress"`
	OrderItems      []OrderItem `json:"orderItems" gorm:"foreignKey:OrderID"`
}

func (Order) TableName() string {
	return "orders"
}

// OrderItem represents individual items in an order
type OrderItem struct {
	BaseModel
	OrderID    uuid.UUID `json:"orderId" gorm:"type:uuid;not null"`
	Order      *Order    `json:"order,omitempty" gorm:"foreignKey:OrderID"`
	MedicineID uuid.UUID `json:"medicineId" gorm:"type:uuid;not null"`
	Medicine   *Medicine `json:"medicine,omitempty" gorm:"foreignKey:MedicineID"`
	PharmacyID uuid.UUID `json:"pharmacyId" gorm:"type:uuid;index"`               // ADD THIS
	Pharmacy   *Pharmacy `json:"pharmacy,omitempty" gorm:"foreignKey:PharmacyID"` // ADD THIS
	Quantity   int       `json:"quantity" gorm:"not null"`
	Price      float64   `json:"price" gorm:"type:decimal(10,2);not null"` // Price at time of order
	Subtotal   float64   `json:"subtotal" gorm:"type:decimal(10,2);not null"`
}

func (OrderItem) TableName() string {
	return "order_items"
}
