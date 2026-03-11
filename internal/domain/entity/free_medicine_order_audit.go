package entity

import (
	"time"

	"github.com/google/uuid"
)

type FreeMedicineOrderAudit struct {
	BaseModel

	// References
	OrderID       uuid.UUID           `gorm:"type:uuid;not null;index" json:"orderId"`
	Order         *Order              `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	EligibilityID uuid.UUID           `gorm:"type:uuid;not null" json:"eligibilityId"`
	Eligibility   *PatientEligibility `gorm:"foreignKey:EligibilityID" json:"eligibility,omitempty"`

	// Pharmacy Information
	PharmacyID       uuid.UUID        `gorm:"type:uuid;not null;index" json:"pharmacyId"`
	Pharmacy         *Pharmacy        `gorm:"foreignKey:PharmacyID" json:"pharmacy,omitempty"`
	PharmacyCategory PharmacyCategory `gorm:"type:varchar(50);not null" json:"pharmacyCategory"`

	// Order Financial Details
	TotalMedicineCost       float64 `gorm:"type:decimal(10,2);not null" json:"totalMedicineCost"`
	GovernmentSubsidyAmount float64 `gorm:"type:decimal(10,2);not null" json:"governmentSubsidyAmount"`
	PatientCopayAmount      float64 `gorm:"type:decimal(10,2);default:0" json:"patientCopayAmount"`

	// Government Claim
	ClaimSubmitted       bool       `gorm:"default:false" json:"claimSubmitted"`
	ClaimSubmittedAt     *time.Time `json:"claimSubmittedAt,omitempty"`
	ClaimApproved        bool       `gorm:"default:false" json:"claimApproved"`
	ClaimApprovedAt      *time.Time `json:"claimApprovedAt,omitempty"`
	ClaimAmount          *float64   `gorm:"type:decimal(10,2)" json:"claimAmount,omitempty"`
	ClaimReferenceNumber *string    `gorm:"type:varchar(100);index" json:"claimReferenceNumber,omitempty"`

	// Audit
	CreatedBy uuid.UUID `gorm:"type:uuid" json:"createdBy"`
}
