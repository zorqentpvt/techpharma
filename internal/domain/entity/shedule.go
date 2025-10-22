package entity

import (
	"time"

	"github.com/google/uuid"
)

// ScheduleStatus represents the status of a schedule slot
type ScheduleStatus string

const (
	ScheduleStatusAvailable ScheduleStatus = "available"
	ScheduleStatusBooked    ScheduleStatus = "booked"
	ScheduleStatusCancelled ScheduleStatus = "cancelled"
	ScheduleStatusBlocked   ScheduleStatus = "blocked" // Doctor blocked this slot
)

// DoctorSchedule represents a doctor's availability time slots
type DoctorSchedule struct {
	BaseModel

	// Relationship
	DoctorID uuid.UUID `gorm:"type:uuid;not null;index" json:"doctorId"`
	Doctor   *Doctor   `gorm:"foreignKey:DoctorID" json:"doctor,omitempty"`

	// Schedule details
	Date     time.Time      `gorm:"type:date;not null;index" json:"date"`
	TimeSlot string         `gorm:"type:varchar(5);not null" json:"timeSlot"` // Format: "HH:MM"
	Status   ScheduleStatus `gorm:"type:varchar(20);not null;default:'available'" json:"status"`

	// Booking reference (if booked)
	AppointmentID *uuid.UUID   `gorm:"type:uuid;index" json:"appointmentId,omitempty"`
	Appointment   *Appointment `gorm:"foreignKey:AppointmentID" json:"appointment,omitempty"`

	// Additional info
	Duration int    `gorm:"default:30" json:"duration"` // in minutes
	Notes    string `gorm:"type:text" json:"notes,omitempty"`
	IsBooked bool   `gorm:"default:false" json:"isBooked"`
	// Audit
	BlockedAt   *time.Time `json:"blockedAt,omitempty"`
	BlockReason string     `gorm:"type:text" json:"blockReason,omitempty"`
}

// TableName specifies the table name for DoctorSchedule
func (DoctorSchedule) TableName() string {
	return "doctor_schedules"
}

// IsAvailable checks if the slot is available for booking
func (ds *DoctorSchedule) IsAvailable() bool {
	return ds.Status == ScheduleStatusAvailable
}

// MarkAsBooked marks the slot as booked
func (ds *DoctorSchedule) MarkAsBooked(appointmentID uuid.UUID) {
	ds.Status = ScheduleStatusBooked
	ds.AppointmentID = &appointmentID
}

// MarkAsAvailable marks the slot as available
func (ds *DoctorSchedule) MarkAsAvailable() {
	ds.Status = ScheduleStatusAvailable
	ds.AppointmentID = nil
}

// Block blocks the slot
func (ds *DoctorSchedule) Block(reason string) {
	ds.Status = ScheduleStatusBlocked
	now := time.Now()
	ds.BlockedAt = &now
	ds.BlockReason = reason
}
