package entity

import (
	"time"

	"github.com/google/uuid"
)

// AppointmentMode represents the mode of appointment
type AppointmentMode string

const (
	AppointmentModeOnline   AppointmentMode = "online"
	AppointmentModeInPerson AppointmentMode = "offline"
)

// AppointmentStatus represents the status of an appointment
type AppointmentStatus string

const (
	AppointmentStatusPending   AppointmentStatus = "pending"
	AppointmentStatusConfirmed AppointmentStatus = "confirmed"
	AppointmentStatusCancelled AppointmentStatus = "cancelled"
	AppointmentStatusCompleted AppointmentStatus = "completed"
	AppointmentStatusNoShow    AppointmentStatus = "no_show"
)

// Appointment represents a medical appointment booking
type Appointment struct {
	BaseModel

	// Relationship fields
	DoctorID  uuid.UUID `gorm:"type:uuid;not null;index" json:"doctorId"`
	Doctor    *Doctor   `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`
	PatientID uuid.UUID `gorm:"type:uuid;not null;index" json:"patientId"`
	Patient   *User     `gorm:"foreignKey:PatientID" json:"patient,omitempty"`

	// Appointment details
	Reason string            `gorm:"type:text;not null" json:"reason"`
	Mode   AppointmentMode   `gorm:"type:varchar(20);not null;default:'online'" json:"mode"`
	Status AppointmentStatus `gorm:"type:varchar(20);not null;default:'pending';index" json:"status"`

	// Scheduling
	AppointmentDate time.Time `gorm:"not null;index" json:"appointmentDate"`
	AppointmentTime string    `gorm:"type:varchar(5);not null" json:"appointmentTime"` // Format: "HH:MM"
	Duration        int       `gorm:"default:30" json:"duration"`                      // in minutes

	// Additional information
	Notes           string  `gorm:"type:text" json:"notes,omitempty"`
	ConsultationFee float64 `gorm:"default:0" json:"consultationFee"`

	// Cancellation tracking
	CancelledAt        *time.Time `json:"cancelledAt,omitempty"`
	CancelledBy        *uuid.UUID `gorm:"type:uuid" json:"cancelledBy,omitempty"`
	CancellationReason string     `gorm:"type:text" json:"cancellationReason,omitempty"`

	// Completion tracking
	CompletedAt *time.Time `json:"completedAt,omitempty"`

	// Audit fields
	ConfirmedAt *time.Time `json:"confirmedAt,omitempty"`
}

// AppointmentSlot represents available time slots for booking
type AppointmentSlot struct {
	Date string `json:"date"` // Format: "YYYY-MM-DD"
	Time string `json:"time"` // Format: "HH:MM"
}

// AppointmentRequest represents the request payload for creating an appointment
// AppointmentRequest represents the request payload for creating an appointment
