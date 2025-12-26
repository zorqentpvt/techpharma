package persistence

import (
	"context"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"gorm.io/gorm"
)

type AppoinmentRepository struct {
	db *gorm.DB
}

func NewAppoinmentRepository(db *gorm.DB) repository.AppoinmentRepository {
	return &AppoinmentRepository{
		db: db,
	}
}
func (r *AppoinmentRepository) BookAppointment(ctx context.Context, appointment *entity.Appointment) (*entity.Appointment, error) {
	if err := r.db.WithContext(ctx).Create(appointment).Error; err != nil {
		return nil, err
	}
	return appointment, nil
}

func (r *AppoinmentRepository) IsSlotBooked(ctx context.Context, doctorID uuid.UUID, appointmentDate string, appointmentTime string) (bool, error) {
	var count int64

	// Join booked_slots with appointments to check doctor_id and slot availability
	err := r.db.WithContext(ctx).
		Model(&entity.BookedSlot{}).
		Joins("JOIN appointments ON appointments.id = booked_slots.appointment_id").
		Where("appointments.doctor_id = ?", doctorID).
		Where("booked_slots.appointment_date = ?", appointmentDate).
		Where("booked_slots.appointment_time = ?", appointmentTime).
		Where("booked_slots.status IN ?", []entity.AppointmentStatus{
			entity.AppointmentStatusPending,
			entity.AppointmentStatusConfirmed,
		}).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
func (r *AppoinmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Appointment, error) {
	var appointment entity.Appointment
	err := r.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Patient").
		Preload("BookedSlots").
		Where("id = ?", id).
		First(&appointment).Error
	if err != nil {
		return nil, err
	}
	return &appointment, nil
}

func (r *AppoinmentRepository) Update(ctx context.Context, appointment *entity.Appointment) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(appointment).Error; err != nil {
			return err
		}

		for _, slot := range appointment.BookedSlots {
			if err := tx.Model(&entity.BookedSlot{}).Where("id = ?", slot.ID).Update("status", slot.Status).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *AppoinmentRepository) GetDoctorAppointments(ctx context.Context, doctorID uuid.UUID, status entity.AppointmentStatus) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	query := r.db.WithContext(ctx).
		Preload("Patient").
		Where("doctor_id = ?", doctorID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.
		Order("appointment_date ASC, appointment_time ASC").
		Find(&appointments).Error
	if err != nil {
		return nil, err
	}
	return appointments, nil
}

func (r *AppoinmentRepository) GetConfirmedAppionmentSlot(ctx context.Context, req *types.ConfirmedSlotRequest) ([]types.ConfirmedSlotResponse, error) {
	var slots []types.ConfirmedSlotResponse
	err := r.db.WithContext(ctx).
		Model(&entity.BookedSlot{}).
		Select("booked_slots.appointment_date, booked_slots.appointment_time").
		Joins("JOIN appointments ON appointments.id = booked_slots.appointment_id").
		Where("appointments.doctor_id = ?", req.DocID).
		Where("booked_slots.status = ?", entity.AppointmentStatusConfirmed).
		Scan(&slots).Error
	if err != nil {
		return nil, err
	}

	// Return array with null values if no slots found
	if len(slots) == 0 {
		return []types.ConfirmedSlotResponse{
			{
				AppointmentDate: nil,
				AppointmentTime: nil,
			},
		}, nil
	}

	return slots, nil
}

func (r *AppoinmentRepository) GetUpcomingAppointments(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	now := time.Now()

	err := r.db.WithContext(ctx).
		Preload("Patient").
		Preload("BookedSlots", func(db *gorm.DB) *gorm.DB {
			return db.Where("appointment_date >= ? AND status IN ?",
				now.Format("2006-01-02"), []entity.AppointmentStatus{
					entity.AppointmentStatusPending,
					entity.AppointmentStatusConfirmed,
				}).
				Order("appointment_date ASC, appointment_time ASC")
		}).
		Where("appointments.doctor_id = ?", doctorID).
		Where("appointments.id IN (?)",
			r.db.Table("booked_slots").
				Select("appointment_id").
				Where("appointment_date >= ? AND status IN ?",
					now.Format("2006-01-02"), []entity.AppointmentStatus{
						entity.AppointmentStatusPending,
						entity.AppointmentStatusConfirmed,
					}),
		).
		Find(&appointments).Error

	if err != nil {
		return nil, err
	}

	// Sort appointments by their earliest booked slot
	sort.Slice(appointments, func(i, j int) bool {
		if len(appointments[i].BookedSlots) == 0 || len(appointments[j].BookedSlots) == 0 {
			return false
		}
		slotI := appointments[i].BookedSlots[0]
		slotJ := appointments[j].BookedSlots[0]

		dateI, _ := time.Parse("2006-01-02", slotI.AppointmentDate)
		dateJ, _ := time.Parse("2006-01-02", slotJ.AppointmentDate)

		if dateI.Equal(dateJ) {
			return slotI.AppointmentTime < slotJ.AppointmentTime
		}
		return dateI.Before(dateJ)
	})

	return appointments, nil
}

func (r *AppoinmentRepository) GetAppointmentHistory(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	now := time.Now()

	err := r.db.WithContext(ctx).
		Preload("Patient").
		Preload("BookedSlots", func(db *gorm.DB) *gorm.DB {
			return db.Where("appointment_date < ? OR status IN ?",
				now.Format("2006-01-02"), []entity.AppointmentStatus{
					entity.AppointmentStatusCompleted,
					entity.AppointmentStatusCancelled,
					entity.AppointmentStatusNoShow,
				}).
				Order("appointment_date DESC, appointment_time DESC")
		}).
		Where("appointments.doctor_id = ?", doctorID).
		Where("appointments.id IN (?)",
			r.db.Table("booked_slots").
				Select("appointment_id").
				Where("appointment_date < ? OR status IN ?",
					now.Format("2006-01-02"), []entity.AppointmentStatus{
						entity.AppointmentStatusCompleted,
						entity.AppointmentStatusCancelled,
						entity.AppointmentStatusNoShow,
					}),
		).
		Find(&appointments).Error

	if err != nil {
		return nil, err
	}

	// Sort appointments by their latest booked slot (descending)
	sort.Slice(appointments, func(i, j int) bool {
		if len(appointments[i].BookedSlots) == 0 || len(appointments[j].BookedSlots) == 0 {
			return false
		}
		slotI := appointments[i].BookedSlots[0]
		slotJ := appointments[j].BookedSlots[0]

		dateI, _ := time.Parse("2006-01-02", slotI.AppointmentDate)
		dateJ, _ := time.Parse("2006-01-02", slotJ.AppointmentDate)

		if dateI.Equal(dateJ) {
			return slotI.AppointmentTime > slotJ.AppointmentTime
		}
		return dateI.After(dateJ)
	})

	return appointments, nil
}
func (r *AppoinmentRepository) GetAllByDoctorID(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	err := r.db.WithContext(ctx).
		Where("doctor_id = ?", doctorID).
		Preload("Patient").
		Preload("BookedSlots").   // <- Add this to load the slots
		Order("created_at DESC"). // <- Optional: order by newest first
		Find(&appointments).Error
	return appointments, err
}

func (r *AppoinmentRepository) GetByDetails(ctx context.Context, doctorID, patientID uuid.UUID, appointmentDate time.Time, appointmentTime string) (*entity.Appointment, error) {
	var appointment entity.Appointment
	err := r.db.WithContext(ctx).
		Where("doctor_id = ? AND patient_id = ? AND appointment_date = ? AND appointment_time = ?",
			doctorID, patientID, appointmentDate, appointmentTime).
		First(&appointment).Error

	if err != nil {
		return nil, err
	}

	return &appointment, nil
}

func (r *AppoinmentRepository) ScheduleAppointment(ctx context.Context, appointment *entity.Appointment) (*entity.Appointment, error) {
	// This function finds an appointment by its key details and updates its status.
	// It's useful if you are confirming a pre-existing draft or placeholder appointment.
	result := r.db.WithContext(ctx).Model(&entity.Appointment{}).
		Where("doctor_id = ? AND patient_id = ? AND appointment_date = ? AND appointment_time = ?",
			appointment.DoctorID, appointment.PatientID, appointment.BookedSlots[0].AppointmentDate, appointment.BookedSlots[0].AppointmentTime).
		Update("status", appointment.BookedSlots[0].Status)

	if result.Error != nil {
		return nil, result.Error
	}

	// You can return the input appointment as the operation was successful.
	// For a more robust implementation, you could re-fetch the updated record.
	return appointment, nil
}

func (r *AppoinmentRepository) CancelBookedSlot(ctx context.Context, appointmentID uuid.UUID, reason string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update all booked slots for this appointment
		if err := tx.Model(&entity.BookedSlot{}).
			Where("appointment_id = ?", appointmentID).
			Where("status NOT IN ?", []entity.AppointmentStatus{
				entity.AppointmentStatusCancelled,
				entity.AppointmentStatusCompleted,
			}).
			Update("status", entity.AppointmentStatusCancelled).Error; err != nil {
			return err
		}

		// Update the appointment record
		now := time.Now()
		if err := tx.Model(&entity.Appointment{}).
			Where("id = ?", appointmentID).
			Updates(map[string]interface{}{
				"cancellation_reason": reason,
				"cancelled_at":        now,
			}).Error; err != nil {
			return err
		}

		return nil
	})
}

// In internal/repository/postgres/appoinment_repository.go

func (r *AppoinmentRepository) DeletePendingSlots(ctx context.Context, appointmentID uuid.UUID) error {
	// Delete pending slots associated with this appointment.
	// This cleans up the slots that were selected but not confirmed.
	return r.db.WithContext(ctx).
		Where("appointment_id = ? AND status = ?", appointmentID, entity.AppointmentStatusPending).
		Delete(&entity.BookedSlot{}).Error
}

func (r *AppoinmentRepository) GetUpcomingAppointmentsByPatient(ctx context.Context, patientID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	now := time.Now()

	err := r.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.User").
		Preload("BookedSlots", func(db *gorm.DB) *gorm.DB {
			return db.Where("appointment_date >= ? AND status IN ?",
				now.Format("2006-01-02"), []entity.AppointmentStatus{
					entity.AppointmentStatusPending,
					entity.AppointmentStatusConfirmed,
				}).
				Order("appointment_date ASC, appointment_time ASC")
		}).
		Where("appointments.patient_id = ?", patientID).
		Where("appointments.id IN (?)",
			r.db.Table("booked_slots").
				Select("appointment_id").
				Where("appointment_date >= ? AND status IN ?",
					now.Format("2006-01-02"), []entity.AppointmentStatus{
						entity.AppointmentStatusPending,
						entity.AppointmentStatusConfirmed,
					}),
		).
		Find(&appointments).Error

	if err != nil {
		return nil, err
	}

	// Sort appointments by their earliest booked slot
	sort.Slice(appointments, func(i, j int) bool {
		if len(appointments[i].BookedSlots) == 0 || len(appointments[j].BookedSlots) == 0 {
			return false
		}
		slotI := appointments[i].BookedSlots[0]
		slotJ := appointments[j].BookedSlots[0]

		dateI, _ := time.Parse("2006-01-02", slotI.AppointmentDate)
		dateJ, _ := time.Parse("2006-01-02", slotJ.AppointmentDate)

		if dateI.Equal(dateJ) {
			return slotI.AppointmentTime < slotJ.AppointmentTime
		}
		return dateI.Before(dateJ)
	})

	return appointments, nil
}

func (r *AppoinmentRepository) GetAppointmentHistoryByPatient(ctx context.Context, patientID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	now := time.Now()

	err := r.db.WithContext(ctx).
		Preload("Doctor").
		Preload("Doctor.User").
		Preload("BookedSlots", func(db *gorm.DB) *gorm.DB {
			return db.Where("appointment_date < ? OR status IN ?",
				now.Format("2006-01-02"), []entity.AppointmentStatus{
					entity.AppointmentStatusCompleted,
					entity.AppointmentStatusCancelled,
					entity.AppointmentStatusNoShow,
				}).
				Order("appointment_date DESC, appointment_time DESC")
		}).
		Where("appointments.patient_id = ?", patientID).
		Where("appointments.id IN (?)",
			r.db.Table("booked_slots").
				Select("appointment_id").
				Where("appointment_date < ? OR status IN ?",
					now.Format("2006-01-02"), []entity.AppointmentStatus{
						entity.AppointmentStatusCompleted,
						entity.AppointmentStatusCancelled,
						entity.AppointmentStatusNoShow,
					}),
		).
		Find(&appointments).Error

	if err != nil {
		return nil, err
	}

	// Sort appointments by their latest booked slot (most recent first)
	sort.Slice(appointments, func(i, j int) bool {
		if len(appointments[i].BookedSlots) == 0 || len(appointments[j].BookedSlots) == 0 {
			return false
		}
		slotI := appointments[i].BookedSlots[0]
		slotJ := appointments[j].BookedSlots[0]

		dateI, _ := time.Parse("2006-01-02", slotI.AppointmentDate)
		dateJ, _ := time.Parse("2006-01-02", slotJ.AppointmentDate)

		if dateI.Equal(dateJ) {
			return slotI.AppointmentTime > slotJ.AppointmentTime
		}
		return dateI.After(dateJ)
	})

	return appointments, nil
}
