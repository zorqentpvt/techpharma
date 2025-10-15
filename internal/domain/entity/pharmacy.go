package entity

import (
	"time"

	"github.com/google/uuid"
)

// Pharmacy represents a pharmacy in the system
type Pharmacy struct {
	BaseModel
	UserID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"userId"`
	User   *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`

	Name          string  `gorm:"type:varchar(200);not null" json:"name"`
	Email         *string `gorm:"type:varchar(100);uniqueIndex" json:"email,omitempty"`
	PhoneNumber   string  `gorm:"type:varchar(20);not null" json:"phoneNumber"`
	LicenseNumber string  `json:"licenseNumber,omitempty"`

	// Location fields
	Address    string  `gorm:"type:varchar(500)" json:"address"`
	City       string  `gorm:"type:varchar(100)" json:"city"`
	State      string  `gorm:"type:varchar(100)" json:"state"`
	PostalCode string  `gorm:"type:varchar(20)" json:"postalCode"`
	Country    string  `gorm:"type:varchar(100)" json:"country"`
	Latitude   float64 `gorm:"type:decimal(10,8)" json:"latitude"`
	Longitude  float64 `gorm:"type:decimal(11,8)" json:"longitude"`

	// Audit fields
	IsActive      bool       `gorm:"default:true;index" json:"isActive"`
	DeactivatedAt *time.Time `json:"deactivatedAt,omitempty"`
	DeactivatedBy *uuid.UUID `gorm:"type:uuid" json:"deactivatedBy,omitempty"`

	// Relations
	Medicines []Medicine `gorm:"foreignKey:PharmacyID" json:"medicines,omitempty"`
}
