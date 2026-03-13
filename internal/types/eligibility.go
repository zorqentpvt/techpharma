package types

import (
	"time"

	"github.com/google/uuid"
)

type EligibilityApplicationRequest struct {
	UserID     uuid.UUID `json:"-"` // Set from context
	SchemeType string    `json:"schemeType" form:"schemeType" binding:"required"`

	// Document Information
	DocumentType   string  `json:"documentType" form:"documentType" binding:"required"`
	DocumentNumber string  `json:"documentNumber" form:"documentNumber" binding:"required"`
	DocumentURL    *string `json:"documentUrl" form:"documentUrl"`

	// Medical Condition Fields
	MedicalCondition *string    `json:"medicalCondition" form:"medicalCondition"`
	DiagnosisDate    *time.Time `json:"diagnosisDate" form:"diagnosisDate" time_format:"2006-01-02T15:04:05.999Z"`
	TreatingHospital *string    `json:"treatingHospital" form:"treatingHospital"`
	DoctorName       *string    `json:"doctorName" form:"doctorName"`

	// BPL Card Fields
	BPLCardNumber *string `json:"bplCardNumber" form:"bplCardNumber"`
	BPLState      *string `json:"bplState" form:"bplState"`
	BPLDistrict   *string `json:"bplDistrict" form:"bplDistrict"`

	// Other Scheme Fields
	OtherSchemeName             *string `json:"otherSchemeName" form:"otherSchemeName"`
	OtherSchemeBenefitsReceived bool    `json:"otherSchemeBenefitsReceived" form:"otherSchemeBenefitsReceived"`

	// Validity Period
	ValidFrom  time.Time `json:"validFrom" form:"validFrom" binding:"required" time_format:"2006-01-02T15:04:05.999Z"`
	ValidUntil time.Time `json:"validUntil" form:"validUntil" binding:"required" time_format:"2006-01-02T15:04:05.999Z"`

	Remarks *string `json:"remarks" form:"remarks"`
}
