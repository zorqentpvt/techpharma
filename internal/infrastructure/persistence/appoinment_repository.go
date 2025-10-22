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
		Where("doctor_id = ? AND appointment_date = ? AND appointment_time = ?", doctorID, appointmentDate, appointmentTime).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
