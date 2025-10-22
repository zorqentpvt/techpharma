package usecase

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
)

// UserUseCase defines the interface for user-related operations
type AppoinmentUseCase interface {
	// Cart management methods
	BookAppointment(ctx context.Context, req *types.AppointmentRequest) ([]*entity.Appointment, error)
	GetDoctorSchedule(ctx context.Context, doctorID uuid.UUID) ([]types.DoctorScheduleResponse, error)
	CancelAppointment(ctx context.Context, appointmentID, userID uuid.UUID, reason string) error
	ScheduleAppointment(ctx context.Context, req *types.ScheduleAppointmentRequest) error
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

func (u *appoinmentUseCase) BookAppointment(ctx context.Context, req *types.AppointmentRequest) ([]*entity.Appointment, error) {
	doctor, err := u.doctorRepo.GetByID(ctx, req.DoctorID)
	if err != nil {
		return nil, errors.NewDomainError("DOCTOR_NOT_FOUND", "Doctor not found", errors.ErrDoctorNotFound)
	}
	if !doctor.IsActive {
		return nil, errors.NewDomainError("DOCTOR_INACTIVE", "Doctor is not accepting appointments", errors.ErrForbidden)
	}

	// Validate all slots first
	for _, slot := range req.SelectedSlots {
		appointmentDate, err := time.Parse("2006-01-02", slot.Date)
		if err != nil {
			return nil, errors.NewDomainError("INVALID_DATE", "Invalid date format", errors.ErrInvalidInput)
		}

		isBooked, err := u.appoinmentRepo.IsSlotBooked(ctx, req.DoctorID, appointmentDate, slot.Time)
		if err != nil {
			return nil, errors.NewDomainError("SLOT_CHECK_FAILED", "Failed to check slot availability", err)
		}
		if isBooked {
			return nil, errors.NewDomainError("SLOT_UNAVAILABLE",
				fmt.Sprintf("Time slot %s %s is already booked", slot.Date, slot.Time),
				errors.ErrSlotNotAvailable)
		}

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

	// Create appointments for ALL selected slots
	var createdAppointments []*entity.Appointment

	for _, slot := range req.SelectedSlots {
		appointmentDate, _ := time.Parse("2006-01-02", slot.Date)

		appointment := &entity.Appointment{
			PatientID:       req.PatientID,
			DoctorID:        req.DoctorID,
			Reason:          req.Reason,
			Mode:            req.Mode,
			Status:          entity.AppointmentStatusPending,
			AppointmentDate: appointmentDate,
			AppointmentTime: slot.Time,
			Duration:        30,
			ConsultationFee: doctor.ConsultationFee,
		}

		createdAppointment, err := u.appoinmentRepo.BookAppointment(ctx, appointment)
		if err != nil {
			return nil, errors.NewDomainError("CREATE_FAILED", "Failed to create appointment", err)
		}

		createdAppointments = append(createdAppointments, createdAppointment)
	}

	return createdAppointments, nil
}

func (u *appoinmentUseCase) GetDoctorSchedule(ctx context.Context, doctorID uuid.UUID) ([]types.DoctorScheduleResponse, error) {
	// Get all appointments for the doctor
	appointments, err := u.appoinmentRepo.GetAllByDoctorID(ctx, doctorID)
	if err != nil {
		return nil, errors.NewDomainError("FETCH_FAILED", "Failed to fetch appointments", err)
	}

	// Get today's date at midnight for comparison
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Group appointments by created time
	type groupKey struct {
		patientID uuid.UUID
		createdAt time.Time
		reason    string
		mode      string
	}

	appointmentMap := make(map[groupKey]*types.DoctorScheduleResponse)

	for _, apt := range appointments {
		// Skip past appointments
		if apt.AppointmentDate.Before(today) {
			continue
		}

		// Create group key using created time
		key := groupKey{
			patientID: apt.PatientID,
			createdAt: apt.CreatedAt.Truncate(time.Second), // Truncate to second precision
			reason:    apt.Reason,
			mode:      string(apt.Mode),
		}

		// Create slot
		slot := types.Slot{
			Date: apt.AppointmentDate.Format("2006-01-02"),
			Time: apt.AppointmentTime,
		}

		// Check if appointment group already exists in map
		if existing, exists := appointmentMap[key]; exists {
			// Add slot to existing appointment
			existing.SelectedSlots = append(existing.SelectedSlots, slot)
		} else {
			// Create new appointment entry
			patientName := ""
			if apt.Patient != nil {
				patientName = apt.Patient.FirstName + " " + apt.Patient.LastName
			}

			appointmentMap[key] = &types.DoctorScheduleResponse{
				ID:            apt.ID.String(), // Use first appointment ID
				Patient:       patientName,
				Reason:        apt.Reason,
				Mode:          string(apt.Mode),
				Status:        string(apt.Status),
				SelectedSlots: []types.Slot{slot},
			}
		}
	}

	// Convert map to slice
	result := make([]types.DoctorScheduleResponse, 0, len(appointmentMap))
	for _, apt := range appointmentMap {
		// Sort slots by date and time
		sort.Slice(apt.SelectedSlots, func(i, j int) bool {
			if apt.SelectedSlots[i].Date == apt.SelectedSlots[j].Date {
				return apt.SelectedSlots[i].Time < apt.SelectedSlots[j].Time
			}
			return apt.SelectedSlots[i].Date < apt.SelectedSlots[j].Date
		})
		result = append(result, *apt)
	}

	// Sort appointments by earliest slot date and time
	sort.Slice(result, func(i, j int) bool {
		if len(result[i].SelectedSlots) == 0 || len(result[j].SelectedSlots) == 0 {
			return false
		}
		iSlot := result[i].SelectedSlots[0]
		jSlot := result[j].SelectedSlots[0]

		if iSlot.Date == jSlot.Date {
			return iSlot.Time < jSlot.Time
		}
		return iSlot.Date < jSlot.Date
	})

	return result, nil
}
func (u *appoinmentUseCase) FetchConsultations(ctx context.Context, doctorID uuid.UUID) (*types.ConsultationsResponse, error) {
	upcomingAppts, err := u.appoinmentRepo.GetUpcomingAppointments(ctx, doctorID)
	if err != nil {
		return nil, errors.NewDomainError("FETCH_FAILED", "Failed to fetch upcoming consultations", err)
	}

	historyAppts, err := u.appoinmentRepo.GetAppointmentHistory(ctx, doctorID)
	if err != nil {
		return nil, errors.NewDomainError("FETCH_FAILED", "Failed to fetch consultation history", err)
	}

	upcoming := make([]types.ConsultationResponse, 0, len(upcomingAppts))
	for _, appt := range upcomingAppts {
		patientName := ""
		if appt.Patient != nil {
			patientName = appt.Patient.FirstName + " " + appt.Patient.LastName
		}

		upcoming = append(upcoming, types.ConsultationResponse{
			ID:     appt.ID.String(),
			Name:   patientName,
			Time:   appt.AppointmentTime,
			Date:   appt.AppointmentDate.Format("2006-01-02"),
			Status: string(appt.Status),
			Mode:   string(appt.Mode),
			Reason: appt.Reason,
		})
	}

	history := make([]types.ConsultationResponse, 0, len(historyAppts))
	for _, appt := range historyAppts {
		patientName := ""
		if appt.Patient != nil {
			patientName = appt.Patient.FirstName + " " + appt.Patient.LastName
		}

		history = append(history, types.ConsultationResponse{
			ID:           appt.ID.String(),
			Name:         patientName,
			Time:         appt.AppointmentTime,
			Date:         appt.AppointmentDate.Format("2006-01-02"),
			Status:       string(appt.Status),
			Mode:         string(appt.Mode),
			Reason:       appt.Reason,
			Diagnosis:    appt.Notes,
			Prescription: "",
			Notes:        appt.Notes,
		})
	}

	return &types.ConsultationsResponse{
		Upcoming: upcoming,
		History:  history,
	}, nil
}

func (u *appoinmentUseCase) CancelAppointment(ctx context.Context, appointmentID, userID uuid.UUID, reason string) error {
	appointment, err := u.appoinmentRepo.GetByID(ctx, appointmentID)
	if err != nil {
		return errors.NewDomainError("APPOINTMENT_NOT_FOUND", "Appointment not found", errors.ErrNotFound)
	}

	if appointment.PatientID != userID && appointment.DoctorID != userID {
		return errors.NewDomainError("UNAUTHORIZED", "You are not authorized to cancel this appointment", errors.ErrUnauthorized)
	}

	if appointment.Status == entity.AppointmentStatusCancelled {
		return errors.NewDomainError("ALREADY_CANCELLED", "Appointment is already cancelled", errors.ErrInvalidInput)
	}

	if appointment.Status == entity.AppointmentStatusCompleted {
		return errors.NewDomainError("ALREADY_COMPLETED", "Cannot cancel completed appointment", errors.ErrInvalidInput)
	}

	now := time.Now()
	appointment.Status = entity.AppointmentStatusCancelled
	appointment.CancelledAt = &now
	appointment.CancelledBy = &userID
	appointment.CancellationReason = reason

	err = u.appoinmentRepo.Update(ctx, appointment)
	if err != nil {
		return errors.NewDomainError("UPDATE_FAILED", "Failed to cancel appointment", err)
	}

	return nil
}

func (u *appoinmentUseCase) ScheduleAppointment(ctx context.Context, req *types.ScheduleAppointmentRequest) error {
	doctor, err := u.doctorRepo.GetByID(ctx, req.DoctorID)
	if err != nil {
		return errors.NewDomainError("DOCTOR_NOT_FOUND", "Doctor not found", errors.ErrDoctorNotFound)
	}
	if !doctor.IsActive {
		return errors.NewDomainError("DOCTOR_INACTIVE", "Doctor account is not active", errors.ErrForbidden)
	}

	appointmentDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return errors.NewDomainError("INVALID_DATE", "Invalid date format", errors.ErrInvalidInput)
	}

	for _, timeSlot := range req.Slots {
		isBooked, err := u.appoinmentRepo.IsSlotBooked(ctx, req.DoctorID, appointmentDate, timeSlot)
		if err != nil {
			return errors.NewDomainError("SLOT_CHECK_FAILED", "Failed to check slot availability", err)
		}
		if isBooked {
			return errors.NewDomainError("SLOT_ALREADY_EXISTS",
				fmt.Sprintf("Time slot %s on %s already exists", timeSlot, req.Date),
				errors.ErrAlreadyExists)
		}
	}

	return nil
}

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
