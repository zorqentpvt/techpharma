package persistence

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"gorm.io/gorm"
)

type DeliveryAgentRepository struct {
	db *gorm.DB
}

func NewDeliveryAgentRepository(db *gorm.DB) *DeliveryAgentRepository {
	return &DeliveryAgentRepository{db: db}
}

func (r *DeliveryAgentRepository) Create(ctx context.Context, agent *entity.DeliveryAgent) error {
	return r.db.WithContext(ctx).Create(agent).Error
}

func (r *DeliveryAgentRepository) GetByPharmacyID(ctx context.Context, pharmacyID uuid.UUID) ([]*entity.DeliveryAgent, error) {
	var agents []*entity.DeliveryAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("pharmacy_id = ?", pharmacyID).
		Find(&agents).Error
	return agents, err
}

func (r *DeliveryAgentRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*entity.DeliveryAgent, error) {
	var agent entity.DeliveryAgent
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		First(&agent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &agent, nil
}

func (r *DeliveryAgentRepository) Update(ctx context.Context, agent *entity.DeliveryAgent) error {
	return r.db.WithContext(ctx).Save(agent).Error
}

func (r *DeliveryAgentRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.DeliveryAgent, error) {
	var agent entity.DeliveryAgent
	err := r.db.WithContext(ctx).Preload("User").First(&agent, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &agent, nil
}

func (r *DeliveryAgentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.DeliveryAgent{}, "id = ?", id).Error
}
