package entity

import (
	"time"

	"github.com/google/uuid"
)

// Doctor represents a medical professional
type Doctor struct {
	BaseModel

	// Basic profile
	UserID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"userId"`
	User   *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Professional details
	SpecializationID string `gorm:"type:varchar(100);index" json:"specializationId"`

	LicenseNumber   string  `gorm:"type:varchar(100);uniqueIndex;not null" json:"licenseNumber"`
	Experience      int     `gorm:"default:0" json:"experience"` // in years
	ConsultationFee float64 `gorm:"default:0" json:"consultationFee"`

	// Availability
	AvailableFrom *time.Time `json:"availableFrom,omitempty"`
	AvailableTo   *time.Time `json:"availableTo,omitempty"`

	// Audit fields
	IsActive      bool       `gorm:"default:true;index" json:"isActive"`
	DeactivatedAt *time.Time `json:"deactivatedAt,omitempty"`
	DeactivatedBy *uuid.UUID `gorm:"type:uuid" json:"deactivatedBy,omitempty"`
}

// Specialization represents a medical field or specialization
