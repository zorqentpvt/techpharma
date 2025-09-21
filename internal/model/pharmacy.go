package models

import (
	"time"

	"gorm.io/gorm"
)

// Pharmacy represents a pharmacy/store in the database
type Pharmacy struct {
	PharmacyID   uint           `gorm:"primaryKey;autoIncrement" json:"pharmacy_id"`
	Name         string         `gorm:"size:200;not null;unique" json:"name"`
	License      string         `gorm:"size:100;unique" json:"license"`
	Address      string         `gorm:"size:500" json:"address"`
	City         string         `gorm:"size:100" json:"city"`
	State        string         `gorm:"size:100" json:"state"`
	ZipCode      string         `gorm:"size:20" json:"zip_code"`
	Phone        string         `gorm:"size:20" json:"phone"`
	Email        string         `gorm:"size:150" json:"email"`
	OwnerName    string         `gorm:"size:200" json:"owner_name"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	OpeningHours string         `gorm:"size:200" json:"opening_hours"`
	Medicines    []Medicine     `gorm:"foreignKey:PharmacyID" json:"medicines,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName overrides the default table name
func (Pharmacy) TableName() string {
	return "pharmacies"
}
