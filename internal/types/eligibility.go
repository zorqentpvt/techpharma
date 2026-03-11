package types

import (
	"time"

	"github.com/google/uuid"
)

type EligibilityApplicationRequest struct {
	UserID     uuid.UUID `json:"-"` // Set from context
	SchemeType string    `json:"schemeType" binding:"required"`

	// Document Information
	DocumentType   string  `json:"documentType" binding:"required"`
	DocumentNumber string  `json:"documentNumber" binding:"required"`
	DocumentURL    *string `json:"documentUrl"`

	// Medical Condition Fields
	MedicalCondition *string    `json:"medicalCondition"`
	DiagnosisDate    *time.Time `json:"diagnosisDate"`
	TreatingHospital *string    `json:"treatingHospital"`
	DoctorName       *string    `json:"doctorName"`

	// BPL Card Fields
	BPLCardNumber *string `json:"bplCardNumber"`
	BPLState      *string `json:"bplState"`
	BPLDistrict   *string `json:"bplDistrict"`

	// Other Scheme Fields
	OtherSchemeName             *string `json:"otherSchemeName"`
	OtherSchemeBenefitsReceived bool    `json:"otherSchemeBenefitsReceived"`

	// Validity Period
	ValidFrom  time.Time `json:"validFrom" binding:"required"`
	ValidUntil time.Time `json:"validUntil" binding:"required"`

	Remarks *string `json:"remarks"`
}
