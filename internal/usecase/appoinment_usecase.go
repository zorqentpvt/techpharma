package usecase

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
)

// UserUseCase defines the interface for user-related operations
type AppoinmentUseCase interface {
	// Cart management methods
	BookAppointment(ctx context.Context, req *types.AppointmentRequest) (*entity.Appointment, error)
}

// orderUseCase implements the OrderUseCase interface
type appoinmentUseCase struct {
	appoinmentRepo repository.AppoinmentRepository
	doctorRepo     repository.DoctorRepository
	//medicineRepo repository.MedicineRepository
}

// NewMedicineUseCase creates a new instance of medicineUseCase
func NewAppoinmentUseCase(appoinmentRepo repository.AppoinmentRepository, doctorRepo repository.DoctorRepository) AppoinmentUseCase {
	return &appoinmentUseCase{
		appoinmentRepo: appoinmentRepo,
		doctorRepo:     doctorRepo,
	}
}
func (u *appoinmentUseCase) BookAppointment(ctx context.Context, req *types.AppointmentRequest) (*entity.Appointment, error) {
	// 1. Verify doctor exists and is active
	doctor, err := u.doctorRepo.GetByID(ctx, req.DoctorID)
	if err != nil {
		return nil, errors.NewDomainError("DOCTOR_NOT_FOUND", "Doctor not found", errors.ErrDoctorNotFound)
	}
	if !doctor.IsActive {
		return nil, errors.NewDomainError("DOCTOR_INACTIVE", "Doctor is not accepting appointments", errors.ErrForbidden)
	}

	// 2. Check if any of the selected slots are already booked
	for _, slot := range req.SelectedSlots {
		// Parse the date and time
		appointmentDate, err := time.Parse("2006-01-02", slot.Date)
		if err != nil {
			return nil, errors.NewDomainError("INVALID_DATE", "Invalid date format", errors.ErrInvalidInput)
		}

		// Check if slot is already booked
		isBooked, err := u.appoinmentRepo.IsSlotBooked(ctx, req.DoctorID, appointmentDate, slot.Time)
		if err != nil {
			return nil, errors.NewDomainError("SLOT_CHECK_FAILED", "Failed to check slot availability", err)
		}
		if isBooked {
			return nil, errors.NewDomainError("SLOT_UNAVAILABLE",
				fmt.Sprintf("Time slot %s %s is already booked", slot.Date, slot.Time),
				errors.ErrSlotNotAvailable)
		}

		// Optional: Validate slot is in the future
		slotDateTime := time.Date(
			appointmentDate.Year(), appointmentDate.Month(), appointmentDate.Day(),
			parseHour(slot.Time), parseMinute(slot.Time), 0, 0, time.UTC,
		)
		if slotDateTime.Before(time.Now()) {
			return nil, errors.NewDomainError("PAST_SLOT",
				"Cannot book appointment in the past",
				errors.ErrInvalidInput)
		}
	}

	// 3. For now, book the first available slot (you can modify this logic)
	// Or let the patient choose which one to confirm later
	firstSlot := req.SelectedSlots[0]
	appointmentDate, _ := time.Parse("2006-01-02", firstSlot.Date)

	// 4. Create appointment entity
	appointment := &entity.Appointment{
		PatientID:       req.PatientID,
		DoctorID:        req.DoctorID,
		Reason:          req.Reason,
		Mode:            req.Mode,
		Status:          entity.AppointmentStatusPending,
		AppointmentDate: appointmentDate,
		AppointmentTime: firstSlot.Time,
		Duration:        30, // default duration
		ConsultationFee: doctor.ConsultationFee,
	}

	// 5. Save appointment to database
	createdAppointment, err := u.appoinmentRepo.BookAppointment(ctx, appointment)
	if err != nil {
		return nil, errors.NewDomainError("CREATE_FAILED", "Failed to create appointment", err)
	}

	return createdAppointment, nil
}

// Helper functions to parse time
func parseHour(timeStr string) int {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return 0
	}
	hour, _ := strconv.Atoi(parts[0])
	return hour
}

func parseMinute(timeStr string) int {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return 0
	}
	minute, _ := strconv.Atoi(parts[1])
	return minute
}
