package entity

import (
	"github.com/google/uuid"
)

// DeliveryAgent represents a delivery person associated with a pharmacy
type DeliveryAgent struct {
	BaseModel
	UserID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"userId"`
	User       *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PharmacyID uuid.UUID `gorm:"type:uuid;not null;index" json:"pharmacyId"`
	Pharmacy   *Pharmacy `gorm:"foreignKey:PharmacyID" json:"pharmacy,omitempty"`

	VehicleNumber string `gorm:"type:varchar(20)" json:"vehicleNumber"`
	LicenseNumber string `gorm:"type:varchar(50)" json:"licenseNumber"`
	IsAvailable   bool   `gorm:"default:true" json:"isAvailable"`
	Status        string `gorm:"default:'offline'" json:"status"` // online, offline, busy
}
