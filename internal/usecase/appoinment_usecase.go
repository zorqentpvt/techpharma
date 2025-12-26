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
	BookAppointment(ctx context.Context, req *types.AppointmentRequest) (*entity.Appointment, error)
	GetDoctorSchedule(ctx context.Context, doctorID uuid.UUID) ([]types.DoctorScheduleResponse, error)
	CancelAppointment(ctx context.Context, appointmentID, userID uuid.UUID, reason string) error
	ScheduleAppointment(ctx context.Context, req *types.ScheduleAppointmentRequest) error
	FetchConsultations(ctx context.Context, doctorID uuid.UUID) (*types.ConsultationsResponse, error)
	FetchPatientConsultations(ctx context.Context, patientID uuid.UUID) (*types.ConsultationsResponse, error)
	GetConfirmedAppionmentSlot(ctx context.Context, req *types.ConfirmedSlotRequest) ([]types.ConfirmedSlotResponse, error)
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
	// 1. Fetch and validate doctor
	doctor, err := u.doctorRepo.GetByID(ctx, req.DoctorID)
	if err != nil {
		return nil, errors.NewDomainError("DOCTOR_NOT_FOUND", "Doctor not found", errors.ErrDoctorNotFound)
	}
	if !doctor.IsActive {
		return nil, errors.NewDomainError("DOCTOR_INACTIVE", "Doctor is not accepting appointments", errors.ErrForbidden)
	}

	// 2. Validate all slots before creating anything
	var parsedSlots []struct {
		date string
		time string
	}

	for _, slot := range req.SelectedSlots {
		appointmentDate, err := time.Parse("2006-01-02", slot.Date)
		if err != nil {
			return nil, errors.NewDomainError("INVALID_DATE", "Invalid date format", errors.ErrInvalidInput)
		}

		// Check if slot is already booked (pass string, not time.Time)
		isBooked, err := u.appoinmentRepo.IsSlotBooked(ctx, req.DoctorID, slot.Date, slot.Time)
		if err != nil {
			return nil, errors.NewDomainError("SLOT_CHECK_FAILED", "Failed to check slot availability", err)
		}
		if isBooked {
			return nil, errors.NewDomainError("SLOT_UNAVAILABLE",
				fmt.Sprintf("Time slot %s %s is already booked", slot.Date, slot.Time),
				errors.ErrSlotNotAvailable)
		}

		// Check if slot is in the past
		slotDateTime := time.Date(
			appointmentDate.Year(),
			appointmentDate.Month(),
			appointmentDate.Day(),
			parseHour(slot.Time),
			parseMinute(slot.Time),
			0, 0, time.Local,
		)
		if slotDateTime.Before(time.Now()) {
			return nil, errors.NewDomainError("PAST_SLOT",
				"Cannot book appointment in the past",
				errors.ErrInvalidInput)
		}

		parsedSlots = append(parsedSlots, struct {
			date string
			time string
		}{slot.Date, slot.Time})
	}

	// 3. Build all booked slots
	bookedSlots := make([]entity.BookedSlot, 0, len(parsedSlots))
	for _, slot := range parsedSlots {
		bookedSlots = append(bookedSlots, entity.BookedSlot{
			AppointmentDate: slot.date,
			AppointmentTime: slot.time,
			Duration:        30,
			Status:          entity.AppointmentStatusPending,
		})
	}

	// 4. Create ONE appointment with all slots (GORM will handle cascade insert)
	appointment := &entity.Appointment{
		PatientID:       req.PatientID,
		DoctorID:        req.DoctorID,
		Reason:          req.Reason,
		Mode:            req.Mode,
		ConsultationFee: doctor.ConsultationFee,
		BookedSlots:     bookedSlots,
	}

	// 5. Save everything in one transaction
	createdAppointment, err := u.appoinmentRepo.BookAppointment(ctx, appointment)
	if err != nil {
		return nil, errors.NewDomainError("CREATE_FAILED", "Failed to create appointment", err)
	}

	return createdAppointment, nil
}

// Helper functions for parsing time

func (u *appoinmentUseCase) GetDoctorSchedule(ctx context.Context, doctorID uuid.UUID) ([]types.DoctorScheduleResponse, error) {
	// Get all appointments for the doctor with preloaded relations
	appointments, err := u.appoinmentRepo.GetAllByDoctorID(ctx, doctorID)
	if err != nil {
		return nil, errors.NewDomainError("FETCH_FAILED", "Failed to fetch appointments", err)
	}

	// Get today's date at midnight for comparison
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Group appointments by appointment ID
	appointmentMap := make(map[uuid.UUID]*types.DoctorScheduleResponse)

	for _, apt := range appointments {
		// Skip appointments without slots
		if len(apt.BookedSlots) == 0 {
			continue
		}

		// Process each booked slot
		for _, bookedSlot := range apt.BookedSlots {
			// Skip past appointments
			if bookedSlot.AppointmentDate < today.Format("2006-01-02") {
				continue
			}

			// Skip non-pending appointments
			if bookedSlot.Status != entity.AppointmentStatusPending {
				continue
			}

			// Create slot with both slot ID and appointment ID
			slot := types.Slot{
				SlotID:        bookedSlot.ID.String(), // <- Booked slot ID
				AppointmentID: apt.ID.String(),        // <- Appointment ID
				Date:          bookedSlot.AppointmentDate,
				Time:          bookedSlot.AppointmentTime,
			}

			// Check if appointment already exists in map
			if existing, exists := appointmentMap[apt.ID]; exists {
				// Add slot to existing appointment
				existing.SelectedSlots = append(existing.SelectedSlots, slot)
			} else {
				// Create new appointment entry
				patientName := ""
				if apt.Patient != nil {
					patientName = strings.TrimSpace(apt.Patient.FirstName + " " + apt.Patient.LastName)
				}

				appointmentMap[apt.ID] = &types.DoctorScheduleResponse{
					ID:            apt.ID.String(),
					Patient:       patientName,
					PatientID:     apt.PatientID.String(),
					Reason:        apt.Reason,
					Mode:          string(apt.Mode),
					Status:        string(bookedSlot.Status),
					SelectedSlots: []types.Slot{slot},
				}
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
			return len(result[i].SelectedSlots) > len(result[j].SelectedSlots)
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

	upcoming := make([]types.ConsultationResponse, 0)
	for _, appt := range upcomingAppts {
		if len(appt.BookedSlots) == 0 {
			continue
		}

		patientName := ""
		if appt.Patient != nil {
			patientName = appt.Patient.FirstName + " " + appt.Patient.LastName
		}

		// Iterate through ALL booked slots, not just the first one
		for _, slot := range appt.BookedSlots {
			upcoming = append(upcoming, types.ConsultationResponse{
				ID:     appt.ID.String(),
				SlotID: slot.ID.String(),
				Name:   patientName,
				Time:   slot.AppointmentTime,
				Date:   slot.AppointmentDate,
				Status: string(slot.Status),
				Mode:   string(appt.Mode),
				Reason: appt.Reason,
			})
		}
	}

	history := make([]types.ConsultationResponse, 0)
	for _, appt := range historyAppts {
		if len(appt.BookedSlots) == 0 {
			continue
		}

		patientName := ""
		if appt.Patient != nil {
			patientName = appt.Patient.FirstName + " " + appt.Patient.LastName
		}

		// Iterate through ALL booked slots, not just the first one
		for _, slot := range appt.BookedSlots {
			history = append(history, types.ConsultationResponse{
				ID:           appt.ID.String(),
				SlotID:       slot.ID.String(),
				Name:         patientName,
				Time:         slot.AppointmentTime,
				Date:         slot.AppointmentDate,
				Status:       string(slot.Status),
				Mode:         string(appt.Mode),
				Reason:       appt.Reason,
				Diagnosis:    appt.Notes,
				Prescription: "",
				Notes:        appt.Notes,
			})
		}
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

	if len(appointment.BookedSlots) == 0 {
		return errors.NewDomainError("INVALID_APPOINTMENT", "Appointment has no slots", errors.ErrInvalidInput)
	}

	// Check if any slot is already cancelled or completed
	for _, slot := range appointment.BookedSlots {
		if slot.Status == entity.AppointmentStatusCancelled {
			return errors.NewDomainError("ALREADY_CANCELLED", "Appointment is already cancelled", errors.ErrInvalidInput)
		}
		if slot.Status == entity.AppointmentStatusCompleted {
			return errors.NewDomainError("ALREADY_COMPLETED", "Cannot cancel completed appointment", errors.ErrInvalidInput)
		}
	}

	// Cancel all booked slots for this appointment
	err = u.appoinmentRepo.CancelBookedSlot(ctx, appointmentID, reason)
	if err != nil {
		return errors.NewDomainError("UPDATE_FAILED", "Failed to cancel appointment", err)
	}

	return nil
}

func (u *appoinmentUseCase) ScheduleAppointment(ctx context.Context, req *types.ScheduleAppointmentRequest) error {
	// 1. Fetch and validate the doctor
	doctor, err := u.doctorRepo.GetByID(ctx, req.DoctorID)
	if err != nil {
		return errors.NewDomainError("DOCTOR_NOT_FOUND", "Doctor not found", errors.ErrDoctorNotFound)
	}
	if !doctor.IsActive {
		return errors.NewDomainError("DOCTOR_INACTIVE", "Doctor is not accepting appointments", errors.ErrForbidden)
	}

	// 2. Fetch the appointment
	appointment, err := u.appoinmentRepo.GetByID(ctx, req.AppointmentID)
	if err != nil {
		return errors.NewDomainError("APPOINTMENT_NOT_FOUND", "Appointment not found", errors.ErrNotFound)
	}

	// 3. Validate ownership
	if appointment.DoctorID != req.DoctorID {
		return errors.NewDomainError("UNAUTHORIZED", "Appointment does not belong to this doctor", errors.ErrUnauthorized)
	}
	if appointment.PatientID != req.PatientID {
		return errors.NewDomainError("INVALID_PATIENT", "Appointment does not belong to this patient", errors.ErrInvalidInput)
	}

	if len(appointment.BookedSlots) == 0 {
		return errors.NewDomainError("INVALID_APPOINTMENT", "Appointment has no slots", errors.ErrInvalidInput)
	}

	var targetSlot *entity.BookedSlot
	for i := range appointment.BookedSlots {
		if appointment.BookedSlots[i].ID == req.SlotID {
			targetSlot = &appointment.BookedSlots[i]
			break
		}
	}
	if targetSlot == nil {
		return errors.NewDomainError("SLOT_NOT_FOUND", "Slot not found", errors.ErrNotFound)
	}

	// 4. Check status
	if targetSlot.Status != entity.AppointmentStatusPending {
		return errors.NewDomainError("INVALID_STATUS", fmt.Sprintf("Appointment is in %s status, cannot schedule", targetSlot.Status), errors.ErrInvalidInput)
	}

	// 5. Update status to Confirmed
	targetSlot.Status = entity.AppointmentStatusConfirmed
	now := time.Now()
	appointment.ConfirmedAt = &now
	appointment.JitsiID = uuid.New().String()[:8]

	if err := u.appoinmentRepo.Update(ctx, appointment); err != nil {
		return errors.NewDomainError("UPDATE_FAILED", "Failed to confirm appointment", err)
	}

	// 6. Delete other pending slots for this appointment.
	err = u.appoinmentRepo.DeletePendingSlots(ctx, appointment.ID)
	if err != nil {
		// This is a non-critical error, so we can log it without failing the whole operation.
		// In a real-world app, you'd use a structured logger.
		fmt.Printf("Warning: Failed to delete other pending slots for appointment %s: %v\n", appointment.ID, err)
	}

	return nil
}

func (u *appoinmentUseCase) FetchPatientConsultations(ctx context.Context, patientID uuid.UUID) (*types.ConsultationsResponse, error) {
	upcomingAppts, err := u.appoinmentRepo.GetUpcomingAppointmentsByPatient(ctx, patientID)
	if err != nil {
		return nil, errors.NewDomainError("FETCH_FAILED", "Failed to fetch upcoming consultations", err)
	}
	fmt.Printf("the upcoming data is %+v\n", upcomingAppts)

	historyAppts, err := u.appoinmentRepo.GetAppointmentHistoryByPatient(ctx, patientID)
	if err != nil {
		return nil, errors.NewDomainError("FETCH_FAILED", "Failed to fetch consultation history", err)
	}

	// Transform upcoming appointments - iterate through ALL slots
	upcoming := make([]types.ConsultationResponse, 0)
	for _, appt := range upcomingAppts {
		if len(appt.BookedSlots) == 0 {
			continue
		}

		// ✅ LOOP through ALL slots instead of just taking [0]
		for _, slot := range appt.BookedSlots {
			upcoming = append(upcoming, types.ConsultationResponse{
				ID:     appt.ID.String(),
				SlotID: slot.ID.String(), // Add slot ID if your type supports it
				Name:   getDoctorName(appt),
				Time:   slot.AppointmentTime,
				Date:   slot.AppointmentDate,
				Status: string(slot.Status),
				Mode:   string(appt.Mode),
				Reason: appt.Reason,
			})
		}
	}

	// Transform history appointments - iterate through ALL slots
	history := make([]types.ConsultationResponse, 0)
	for _, appt := range historyAppts {
		if len(appt.BookedSlots) == 0 {
			continue
		}

		// ✅ LOOP through ALL slots instead of just taking [0]
		for _, slot := range appt.BookedSlots {
			history = append(history, types.ConsultationResponse{
				ID:           appt.ID.String(),
				SlotID:       slot.ID.String(), // Add slot ID if your type supports it
				Name:         getDoctorName(appt),
				Time:         slot.AppointmentTime,
				Date:         slot.AppointmentDate,
				Status:       string(slot.Status),
				Mode:         string(appt.Mode),
				Reason:       appt.Reason,
				Diagnosis:    appt.Notes,
				Prescription: "",
				Notes:        appt.Notes,
			})
		}
	}

	return &types.ConsultationsResponse{Upcoming: upcoming, History: history}, nil
}

func (u *appoinmentUseCase) GetConfirmedAppionmentSlot(ctx context.Context, req *types.ConfirmedSlotRequest) ([]types.ConfirmedSlotResponse, error) {
	return u.appoinmentRepo.GetConfirmedAppionmentSlot(ctx, req)
}

func getDoctorName(appt *entity.Appointment) string {
	if appt != nil && appt.Doctor != nil && appt.Doctor.User != nil {
		return "Dr. " + appt.Doctor.User.FirstName + " " + appt.Doctor.User.LastName
	}
	return ""
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
