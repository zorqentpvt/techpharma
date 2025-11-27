package entity

import (
	"time"

	"github.com/google/uuid"
)

// AppointmentScheduled represents a log entry for when an appointment is scheduled.
// It mirrors the key details from the Appointment entity at the time of creation.
type AppointmentScheduled struct {
	BaseModel
	PatientID       uuid.UUID       `gorm:"type:uuid;not null"`
	DoctorID        uuid.UUID       `gorm:"type:uuid;not null"`
	Mode            AppointmentMode `gorm:"type:appointment_mode;not null"`
	Status          string          `gorm:"type:varchar(20);not null;default:'scheduled'"`
	AppointmentDate time.Time       `gorm:"type:date;not null"`
	AppointmentTime string          `gorm:"type:varchar(5);not null"`
	ConsultationFee float64         `gorm:"type:float;not null"`
	ScheduledAt     time.Time       `gorm:"not null;default:current_timestamp"` // The time this log entry was created
}
