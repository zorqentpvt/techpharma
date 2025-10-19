package entity

import (
	"time"

	"github.com/google/uuid"
)

// Medicine represents a medicine item in a pharmacy
type Medicine struct {
	BaseModel

	Name                 string     `gorm:"type:varchar(200);not null" json:"name"`
	Content              *string    `gorm:"type:text" json:"content,omitempty"` // medicine composition or description
	Description          *string    `gorm:"type:text" json:"description,omitempty"`
	Manufacturer         *string    `gorm:"type:varchar(200)" json:"manufacturer,omitempty"`
	BatchNumber          *string    `gorm:"type:varchar(100)" json:"batchNumber,omitempty"`
	ExpiryDate           *time.Time `json:"expiryDate,omitempty"`
	Price                float64    `gorm:"not null" json:"price"`
	Quantity             int        `gorm:"default:0" json:"quantity"`
	PrescriptionRequired bool       `gorm:"default:false" json:"prescriptionRequired"`
	ImageURL             *string    `gorm:"type:varchar(500)" json:"image,omitempty"`

	// Relations
	PharmacyID uuid.UUID `gorm:"type:uuid;index;not null" json:"pharmacyId"`
	Pharmacy   *Pharmacy `gorm:"foreignKey:PharmacyID" json:"pharmacy,omitempty"`

	// Audit fields
	IsActive      bool       `gorm:"default:true;index" json:"isActive"`
	DeactivatedAt *time.Time `json:"deactivatedAt,omitempty"`
	DeactivatedBy *uuid.UUID `gorm:"type:uuid" json:"deactivatedBy,omitempty"`
}
