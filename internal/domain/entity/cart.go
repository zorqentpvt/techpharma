package entity

import "github.com/google/uuid"

// CartMedicine represents items in a cart
type CartMedicine struct {
	BaseModel
	CartID     uuid.UUID `json:"cart_id" gorm:"type:uuid"`
	MedicineID uuid.UUID `json:"medicine_id" gorm:"type:uuid"`
	Quantity   int       `json:"quantity"`
	Medicine   Medicine  `gorm:"foreignKey:MedicineID" json:"medicine"`
}

func (CartMedicine) TableName() string {
	return "cart_medicines"
}

// Cart represents a user's shopping cart
type Cart struct {
	BaseModel
	UserID      uuid.UUID      `json:"user_id" gorm:"type:uuid;uniqueIndex"`
	User        User           `gorm:"foreignKey:UserID" json:"-"` // json:"-" excludes from response
	Medicines   []CartMedicine `gorm:"foreignKey:CartID" json:"medicines"`
	TotalAmount float64        `json:"total_amount" gorm:"type:decimal(10,2)"`
}

func (Cart) TableName() string {
	return "carts"
}
