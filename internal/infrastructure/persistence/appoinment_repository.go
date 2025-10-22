package persistence

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
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

func (r *AppoinmentRepository) IsSlotBooked(ctx context.Context, doctorID uuid.UUID, appointmentDate time.Time, appointmentTime string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entity.Appointment{}).
		Where("doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != ?",
			doctorID, appointmentDate, appointmentTime, entity.AppointmentStatusCancelled).
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
		Where("id = ?", id).
		First(&appointment).Error
	if err != nil {
		return nil, err
	}
	return &appointment, nil
}

func (r *AppoinmentRepository) Update(ctx context.Context, appointment *entity.Appointment) error {
	return r.db.WithContext(ctx).Save(appointment).Error
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

func (r *AppoinmentRepository) GetUpcomingAppointments(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	now := time.Now()

	err := r.db.WithContext(ctx).
		Preload("Patient").
		Where("doctor_id = ? AND appointment_date >= ? AND status IN ?",
			doctorID, now, []entity.AppointmentStatus{
				entity.AppointmentStatusPending,
				entity.AppointmentStatusConfirmed,
			}).
		Order("appointment_date ASC, appointment_time ASC").
		Find(&appointments).Error
	if err != nil {
		return nil, err
	}
	return appointments, nil
}

func (r *AppoinmentRepository) GetAppointmentHistory(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	now := time.Now()

	err := r.db.WithContext(ctx).
		Preload("Patient").
		Where("doctor_id = ? AND (appointment_date < ? OR status IN ?)",
			doctorID, now, []entity.AppointmentStatus{
				entity.AppointmentStatusCompleted,
				entity.AppointmentStatusCancelled,
				entity.AppointmentStatusNoShow,
			}).
		Order("appointment_date DESC, appointment_time DESC").
		Find(&appointments).Error
	if err != nil {
		return nil, err
	}
	return appointments, nil
}
func (r *AppoinmentRepository) GetAllByDoctorID(ctx context.Context, doctorID uuid.UUID) ([]*entity.Appointment, error) {
	var appointments []*entity.Appointment
	err := r.db.Where("doctor_id = ?", doctorID).
		Preload("Patient"). // Load patient info if needed
		Find(&appointments).Error
	return appointments, err
}
