package models

import (
	"time"

	"gorm.io/gorm"
)

// Medicine represents a medicine/drug in the database
type Medicine struct {
	MedicineID           uint           `gorm:"primaryKey;autoIncrement" json:"medicine_id"`
	Name                 string         `gorm:"size:200;not null;index" json:"name"`
	PharmacyID           uint           `gorm:"not null;index" json:"pharmacy_id"`
	Pharmacy             Pharmacy       `gorm:"foreignKey:PharmacyID" json:"pharmacy"`
	Stock                int            `gorm:"default:0;check:stock >= 0" json:"stock"`
	Contents             string         `gorm:"size:500;not null" json:"contents"`
	Description          string         `gorm:"size:1000" json:"description,omitempty"`
	Price                float64        `gorm:"type:decimal(10,2);default:0.00" json:"price"`
	MRP                  float64        `gorm:"type:decimal(10,2);default:0.00" json:"mrp"` // Maximum Retail Price
	BatchNumber          string         `gorm:"size:50" json:"batch_number,omitempty"`
	ExpiryDate           *time.Time     `json:"expiry_date,omitempty"`
	Manufacturer         string         `gorm:"size:200" json:"manufacturer,omitempty"`
	Category             string         `gorm:"size:100;index" json:"category,omitempty"`
	RequiresPrescription bool           `gorm:"default:false" json:"requires_prescription"`
	IsActive             bool           `gorm:"default:true" json:"is_active"`
	MinStockLevel        int            `gorm:"default:10" json:"min_stock_level"`
	MaxStockLevel        int            `gorm:"default:1000" json:"max_stock_level"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName overrides the default table name
func (Medicine) TableName() string {
	return "medicines"
}

// IsLowStock checks if the medicine stock is below minimum level
func (m *Medicine) IsLowStock() bool {
	return m.Stock <= m.MinStockLevel
}

// IsExpired checks if the medicine is expired
func (m *Medicine) IsExpired() bool {
	if m.ExpiryDate == nil {
		return false
	}
	return m.ExpiryDate.Before(time.Now())
}

// IsOutOfStock checks if the medicine is out of stock
func (m *Medicine) IsOutOfStock() bool {
	return m.Stock <= 0
}
