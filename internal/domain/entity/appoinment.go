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
	AppointmentStatusConsulted AppointmentStatus = "consulted"
	AppointmentStatusNoShow    AppointmentStatus = "no_show"
	AppointmentStatusRemoved   AppointmentStatus = "removed"
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
	Reason string          `gorm:"type:text;not null" json:"reason"`
	Mode   AppointmentMode `gorm:"type:varchar(20);not null;default:'online'" json:"mode"`

	JitsiID string `gorm:"type:varchar(50)" json:"jitsiID,omitempty"`

	// Additional information
	Notes           string  `gorm:"type:text" json:"notes,omitempty"`
	ConsultationFee float64 `gorm:"default:0" json:"consultationFee"`

	DoctorName string `gorm:"type:varchar(100)" json:"doctorName,omitempty"`

	IsDoctorMeeting  bool `gorm:"default:false" json:"isDoctorMeeting,omitempty"`
	IsPatientMeeting bool `gorm:"default:false" json:"isPatientMeeting,omitempty"`

	// Add this inside the Appointment struct
	OpChart *OpChart `gorm:"foreignKey:AppointmentID" json:"opChart,omitempty"`

	// Cancellation tracking
	CancelledAt        *time.Time `json:"cancelledAt,omitempty"`
	CancelledBy        *uuid.UUID `gorm:"type:uuid" json:"cancelledBy,omitempty"`
	CancellationReason string     `gorm:"type:text" json:"cancellationReason,omitempty"`

	// Completion tracking
	CompletedAt *time.Time `json:"completedAt,omitempty"`

	// Audit fields
	ConfirmedAt *time.Time `json:"confirmedAt,omitempty"`

	// One-to-many relationship with booked slots
	BookedSlots []BookedSlot `gorm:"foreignKey:AppointmentID;constraint:OnDelete:CASCADE" json:"bookedSlots,omitempty"`
}

// AppointmentSlot represents available time slots for booking
type AppointmentSlot struct {
	Date string `gorm:"type:date;not null;index" json:"date"` // Format: "YYYY-MM-DD"
	Time string `gorm:"type:varchar(5);not null" json:"time"` // Format: "HH:MM"
}

// BookedSlot represents a specific time slot that has been booked
type BookedSlot struct {
	BaseModel
	ID              uuid.UUID         `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	AppointmentID   uuid.UUID         `gorm:"type:uuid;not null;index" json:"appointmentId"`
	AppointmentDate string            `gorm:"type:varchar(20);not null;index" json:"appointmentDate"`
	AppointmentTime string            `gorm:"type:varchar(5);not null" json:"appointmentTime"` // Format: "HH:MM"
	Duration        int               `gorm:"default:30" json:"duration"`                      // in minutes
	Status          AppointmentStatus `gorm:"type:varchar(20);not null;default:'pending';index" json:"status"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type OpChart struct {
	BaseModel

	// Link to the specific appointment
	AppointmentID uuid.UUID    `gorm:"type:uuid;not null;index" json:"appointmentId"`
	Appointment   *Appointment `gorm:"foreignKey:AppointmentID;constraint:OnDelete:CASCADE" json:"-"`

	// Snapshot Data (Denormalized for historical accuracy)
	PatientName string `gorm:"type:varchar(100)" json:"patientName"`
	DoctorName  string `gorm:"type:varchar(100)" json:"doctorName"`

	// Visit Details
	Date string          `gorm:"type:date" json:"date"`        // e.g., "2023-10-27"
	Time string          `gorm:"type:varchar(5)" json:"time"`  // e.g., "14:30"
	Mode AppointmentMode `gorm:"type:varchar(20)" json:"mode"` // online/offline

	// Medical Data
	Diagnosis    string `gorm:"type:text" json:"diagnosis"`
	Prescription string `gorm:"type:text" json:"prescription"`
	DoctorNotes  string `gorm:"type:text" json:"doctorNotes"`

	// Audit field: Record exactly when the record was finalized
	ConsultedAt time.Time `gorm:"autoCreateTime" json:"consultedAt"`
}
