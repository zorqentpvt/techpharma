package entity

import (
	"time"

	"github.com/google/uuid"
)

type FreeMedicineSchemeType string

const (
	SchemeCancerPatient    FreeMedicineSchemeType = "cancer_patient"
	SchemeKidneyPatient    FreeMedicineSchemeType = "kidney_patient"
	SchemeBPLCard          FreeMedicineSchemeType = "bpl_card"
	SchemeGovernmentScheme FreeMedicineSchemeType = "government_scheme"
	SchemeOther            FreeMedicineSchemeType = "other"
)

type PatientEligibilityStatus string

const (
	EligibilityPending  PatientEligibilityStatus = "pending"
	EligibilityApproved PatientEligibilityStatus = "approved"
	EligibilityRejected PatientEligibilityStatus = "rejected"
	EligibilityExpired  PatientEligibilityStatus = "expired"
)

type PatientEligibility struct {
	BaseModel

	// User Information
	UserID     uuid.UUID                `gorm:"type:uuid;not null;index" json:"userId"`
	User       *User                    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	SchemeType FreeMedicineSchemeType   `gorm:"type:varchar(50);not null;index" json:"schemeType"`
	Status     PatientEligibilityStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`

	// Document Information
	DocumentType   string  `gorm:"type:varchar(100);not null" json:"documentType"`
	DocumentNumber string  `gorm:"type:varchar(100);not null;uniqueIndex" json:"documentNumber"`
	DocumentURL    *string `gorm:"type:text" json:"documentUrl,omitempty"`

	// Medical Condition (for disease-based eligibility)
	MedicalCondition *string    `gorm:"type:varchar(200)" json:"medicalCondition,omitempty"`
	DiagnosisDate    *time.Time `json:"diagnosisDate,omitempty"`
	TreatingHospital *string    `gorm:"type:varchar(200)" json:"treatingHospital,omitempty"`
	DoctorName       *string    `gorm:"type:varchar(200)" json:"doctorName,omitempty"`

	// BPL Card Information
	BPLCardNumber *string `gorm:"type:varchar(100)" json:"bplCardNumber,omitempty"`
	BPLState      *string `gorm:"type:varchar(100)" json:"bplState,omitempty"`
	BPLDistrict   *string `gorm:"type:varchar(100)" json:"bplDistrict,omitempty"`

	// Other Scheme Information
	OtherSchemeName             *string `gorm:"type:varchar(200)" json:"otherSchemeName,omitempty"`
	OtherSchemeBenefitsReceived bool    `gorm:"default:false" json:"otherSchemeBenefitsReceived"`

	// Approval Information
	VerifiedBy      *uuid.UUID `gorm:"type:uuid" json:"verifiedBy,omitempty"`
	VerifiedAt      *time.Time `json:"verifiedAt,omitempty"`
	RejectionReason *string    `gorm:"type:text" json:"rejectionReason,omitempty"`

	// Validity
	ValidFrom  time.Time `gorm:"not null" json:"validFrom"`
	ValidUntil time.Time `gorm:"not null;index" json:"validUntil"`
	IsActive   bool      `gorm:"default:true" json:"isActive"`

	// Metadata
	Remarks *string `gorm:"type:text" json:"remarks,omitempty"`
}

// IsValid checks if the eligibility is currently valid
func (e *PatientEligibility) IsValid() bool {
	now := time.Now()
	return e.Status == EligibilityApproved &&
		e.IsActive &&
		e.ValidFrom.Before(now) &&
		e.ValidUntil.After(now)
}

// CanOrderFreeMedicine checks if patient can order free medicines
func (e *PatientEligibility) CanOrderFreeMedicine() bool {
	return e.IsValid() && !e.OtherSchemeBenefitsReceived
}
