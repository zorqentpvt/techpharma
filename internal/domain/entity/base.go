package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// tygo:emit
// BaseModel provides common fields for all entities
type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt time.Time      `gorm:"index" json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
}

// tygo:emit
// AuditableEntity provides audit trail fields
type AuditableEntity struct {
	BaseModel
	CreatedBy uuid.UUID  `gorm:"type:uuid" json:"createdBy"`
	UpdatedBy *uuid.UUID `gorm:"type:uuid" json:"updatedBy,omitempty"`
}

// tygo:emit
// SoftDeletableEntity provides soft delete functionality
type SoftDeletableEntity struct {
	AuditableEntity
	IsActive  bool       `gorm:"default:true;index" json:"isActive"`
	DeletedBy *uuid.UUID `gorm:"type:uuid" json:"deletedBy,omitempty"`
}

// tygo:emit
// BusinessScopedEntity provides business-level data isolation
type BusinessScopedEntity struct {
	SoftDeletableEntity
	BusinessID uuid.UUID `gorm:"type:uuid;not null;index" json:"businessId"`
}

// tygo:emit
// VersionedEntity provides optimistic locking
type VersionedEntity struct {
	BusinessScopedEntity
	Version int `gorm:"default:1" json:"version"`
}

// tygo:emit
// GeoLocation represents geographical coordinates
type GeoLocation struct {
	Latitude   float64 `gorm:"type:decimal(10,8)" json:"latitude"`
	Longitude  float64 `gorm:"type:decimal(11,8)" json:"longitude"`
	Address    string  `gorm:"type:varchar(255)" json:"address"`
	City       string  `gorm:"type:varchar(100)" json:"city"`
	State      string  `gorm:"type:varchar(100)" json:"state"`
	Country    string  `gorm:"type:varchar(100)" json:"country"`
	PostalCode string  `gorm:"type:varchar(20)" json:"postalCode"`
}

// tygo:emit
// ContactInfo represents contact information
type ContactInfo struct {
	PrimaryPhone   string  `gorm:"type:varchar(20)" json:"primaryPhone"`
	SecondaryPhone *string `gorm:"type:varchar(20)" json:"secondaryPhone,omitempty"`
	Email          *string `gorm:"type:varchar(100)" json:"email,omitempty"`
	Website        *string `gorm:"type:varchar(255)" json:"website,omitempty"`
}

// tygo:emit
// MoneyAmount represents monetary values with currency
type MoneyAmount struct {
	Amount   float64 `gorm:"type:decimal(15,2)" json:"amount"`
	Currency string  `gorm:"type:varchar(3);default:'INR'" json:"currency"`
}

// tygo:emit
// DateRange represents a time period
type DateRange struct {
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
}

// tygo:emit
// Status represents entity status with reason
type Status struct {
	Code        string    `gorm:"type:varchar(50)" json:"code"`
	Description string    `gorm:"type:text" json:"description"`
	ChangedAt   time.Time `json:"changedAt"`
	ChangedBy   uuid.UUID `gorm:"type:uuid" json:"changedBy"`
	Reason      *string   `gorm:"type:text" json:"reason,omitempty"`
}

// Helper methods for BaseModel
func (b *BaseModel) GetID() uuid.UUID {
	return b.ID
}

func (b *BaseModel) IsNew() bool {
	return b.ID == uuid.Nil
}

// Helper methods for SoftDeletableEntity
func (s *SoftDeletableEntity) IsDeleted() bool {
	return s.DeletedAt.Valid
}

func (s *SoftDeletableEntity) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	s.DeletedAt = gorm.DeletedAt{Time: now, Valid: true}
	s.DeletedBy = &deletedBy
	s.IsActive = false
}

// Helper methods for DateRange
func (dr *DateRange) IsValid() bool {
	return dr.StartDate.Before(dr.EndDate)
}

func (dr *DateRange) Duration() time.Duration {
	return dr.EndDate.Sub(dr.StartDate)
}

func (dr *DateRange) Contains(t time.Time) bool {
	return (t.Equal(dr.StartDate) || t.After(dr.StartDate)) &&
		(t.Equal(dr.EndDate) || t.Before(dr.EndDate))
}

// Helper methods for GeoLocation
func (gl *GeoLocation) IsValid() bool {
	return gl.Latitude >= -90 && gl.Latitude <= 90 &&
		gl.Longitude >= -180 && gl.Longitude <= 180
}

func (gl *GeoLocation) GetFullAddress() string {
	if gl.Address == "" {
		return ""
	}

	fullAddress := gl.Address
	if gl.City != "" {
		fullAddress += ", " + gl.City
	}
	if gl.State != "" {
		fullAddress += ", " + gl.State
	}
	if gl.Country != "" {
		fullAddress += ", " + gl.Country
	}
	if gl.PostalCode != "" {
		fullAddress += " " + gl.PostalCode
	}

	return fullAddress
}
