package usecase

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"golang.org/x/crypto/bcrypt"
)

type DeliveryAgentRepository interface {
	Create(ctx context.Context, agent *entity.DeliveryAgent) error
	GetByPharmacyID(ctx context.Context, pharmacyID uuid.UUID) ([]*entity.DeliveryAgent, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*entity.DeliveryAgent, error)
	Update(ctx context.Context, agent *entity.DeliveryAgent) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.DeliveryAgent, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type DeliveryUseCase interface {
	AddDeliveryAgent(ctx context.Context, pharmacyUserID uuid.UUID, req AddDeliveryAgentRequest) (*entity.DeliveryAgent, error)
	GetPharmacyAgents(ctx context.Context, pharmacyUserID uuid.UUID) ([]*entity.DeliveryAgent, error)
	AssignOrder(ctx context.Context, pharmacyUserID uuid.UUID, orderID uuid.UUID, agentID uuid.UUID) error
	GetDeliveryOrders(ctx context.Context, agentUserID uuid.UUID) ([]*entity.Order, error)
	UpdateDeliveryStatus(ctx context.Context, agentUserID uuid.UUID, orderID uuid.UUID, status string) error
	UpdateAgentStatus(ctx context.Context, agentUserID uuid.UUID, status string) error
	UpdateDeliveryAgent(ctx context.Context, pharmacyUserID uuid.UUID, agentID uuid.UUID, req UpdateDeliveryAgentRequest) error
	DeleteDeliveryAgent(ctx context.Context, pharmacyUserID uuid.UUID, agentID uuid.UUID) error
	UnassignOrder(ctx context.Context, pharmacyUserID uuid.UUID, orderID uuid.UUID) error
}

type AddDeliveryAgentRequest struct {
	FirstName     string `json:"firstName" binding:"required"`
	LastName      string `json:"lastName" binding:"required"`
	Email         string `json:"email" binding:"required,email"`
	PhoneNumber   string `json:"phoneNumber" binding:"required"`
	Password      string `json:"password" binding:"required,min=6"`
	VehicleNumber string `json:"vehicleNumber" binding:"required"`
	LicenseNumber string `json:"licenseNumber" binding:"required"`
}

type UpdateDeliveryAgentRequest struct {
	VehicleNumber string `json:"vehicleNumber"`
	LicenseNumber string `json:"licenseNumber"`
}

type deliveryUseCase struct {
	deliveryRepo DeliveryAgentRepository
	userRepo     repository.UserRepository
	orderRepo    repository.OrderRepository
}

func NewDeliveryUseCase(deliveryRepo DeliveryAgentRepository, userRepo repository.UserRepository, orderRepo repository.OrderRepository) DeliveryUseCase {
	return &deliveryUseCase{
		deliveryRepo: deliveryRepo,
		userRepo:     userRepo,
		orderRepo:    orderRepo,
	}
}

func (u *deliveryUseCase) AddDeliveryAgent(ctx context.Context, pharmacyUserID uuid.UUID, req AddDeliveryAgentRequest) (*entity.DeliveryAgent, error) {
	// 1. Get Pharmacy
	pharmacyID := u.userRepo.GetPharmacyByUserID(ctx, pharmacyUserID)
	if pharmacyID == uuid.Nil {
		return nil, errors.New("pharmacy not found")
	}

	// 2. Create User
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &entity.User{
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Email:           &req.Email,
		PhoneNumber:     req.PhoneNumber,
		Password:        string(hashedPassword),
		RoleID:          "delivery_agent",
		IsActive:        true,
		IsPhoneVerified: true,
	}

	if err := u.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// 3. Create Delivery Agent
	agent := &entity.DeliveryAgent{
		UserID:        user.ID,
		PharmacyID:    pharmacyID,
		VehicleNumber: req.VehicleNumber,
		LicenseNumber: req.LicenseNumber,
		IsAvailable:   true,
		Status:        "offline",
	}

	if err := u.deliveryRepo.Create(ctx, agent); err != nil {
		return nil, err
	}

	agent.User = user
	return agent, nil
}

func (u *deliveryUseCase) GetPharmacyAgents(ctx context.Context, pharmacyUserID uuid.UUID) ([]*entity.DeliveryAgent, error) {
	pharmacyID := u.userRepo.GetPharmacyByUserID(ctx, pharmacyUserID)
	if pharmacyID == uuid.Nil {
		return nil, errors.New("pharmacy not found")
	}

	return u.deliveryRepo.GetByPharmacyID(ctx, pharmacyID)
}

func (u *deliveryUseCase) AssignOrder(ctx context.Context, pharmacyUserID uuid.UUID, orderID uuid.UUID, agentID uuid.UUID) error {
	// 1. Verify Pharmacy
	pharmacyID := u.userRepo.GetPharmacyByUserID(ctx, pharmacyUserID)
	if pharmacyID == uuid.Nil {
		return errors.New("pharmacy not found")
	}

	// 2. Get Order
	order, err := u.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}

	// 3. Assign Agent (Assuming Order entity has DeliveryAgentID field, if not, this logic needs entity update)
	order.DeliveryAgentID = &agentID

	// Type assertion to access Update method which might be missing from the interface
	type OrderUpdater interface {
		Update(ctx context.Context, order *entity.Order) error
	}
	if updater, ok := u.orderRepo.(OrderUpdater); ok {
		return updater.Update(ctx, order)
	}
	return errors.New("order repository does not support update")
}

func (u *deliveryUseCase) GetDeliveryOrders(ctx context.Context, agentUserID uuid.UUID) ([]*entity.Order, error) {
	agent, err := u.deliveryRepo.GetByUserID(ctx, agentUserID)
	if err != nil {
		return nil, err
	}
	if agent == nil {
		return nil, errors.New("delivery agent not found")
	}

	type DeliveryOrderFetcher interface {
		GetOrdersByDeliveryAgentID(ctx context.Context, agentID uuid.UUID) ([]*entity.Order, error)
	}
	if fetcher, ok := u.orderRepo.(DeliveryOrderFetcher); ok {
		return fetcher.GetOrdersByDeliveryAgentID(ctx, agent.ID)
	}
	return nil, errors.New("order repository does not support fetching delivery orders")
}

func (u *deliveryUseCase) UpdateDeliveryStatus(ctx context.Context, agentUserID uuid.UUID, orderID uuid.UUID, status string) error {
	agent, err := u.deliveryRepo.GetByUserID(ctx, agentUserID)
	if err != nil {
		return err
	}
	if agent == nil {
		return errors.New("delivery agent not found")
	}

	order, err := u.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}

	if order.DeliveryAgentID == nil || *order.DeliveryAgentID != agent.ID {
		return errors.New("unauthorized: order not assigned to this agent")
	}

	return u.orderRepo.UpdateOrderStatus(ctx, orderID, status)
}

func (u *deliveryUseCase) UpdateAgentStatus(ctx context.Context, agentUserID uuid.UUID, status string) error {
	agent, err := u.deliveryRepo.GetByUserID(ctx, agentUserID)
	if err != nil {
		return err
	}
	if agent == nil {
		return errors.New("delivery agent not found")
	}

	agent.Status = status
	// Automatically set availability based on status
	agent.IsAvailable = (status == "online")

	return u.deliveryRepo.Update(ctx, agent)
}

func (u *deliveryUseCase) UpdateDeliveryAgent(ctx context.Context, pharmacyUserID uuid.UUID, agentID uuid.UUID, req UpdateDeliveryAgentRequest) error {
	pharmacyID := u.userRepo.GetPharmacyByUserID(ctx, pharmacyUserID)
	if pharmacyID == uuid.Nil {
		return errors.New("pharmacy not found")
	}

	agent, err := u.deliveryRepo.GetByID(ctx, agentID)
	if err != nil {
		return err
	}
	if agent == nil {
		return errors.New("agent not found")
	}

	if agent.PharmacyID != pharmacyID {
		return errors.New("unauthorized")
	}

	if req.VehicleNumber != "" {
		agent.VehicleNumber = req.VehicleNumber
	}
	if req.LicenseNumber != "" {
		agent.LicenseNumber = req.LicenseNumber
	}

	return u.deliveryRepo.Update(ctx, agent)
}

func (u *deliveryUseCase) DeleteDeliveryAgent(ctx context.Context, pharmacyUserID uuid.UUID, agentID uuid.UUID) error {
	pharmacyID := u.userRepo.GetPharmacyByUserID(ctx, pharmacyUserID)
	if pharmacyID == uuid.Nil {
		return errors.New("pharmacy not found")
	}

	agent, err := u.deliveryRepo.GetByID(ctx, agentID)
	if err != nil {
		return err
	}
	if agent == nil {
		return errors.New("agent not found")
	}

	if agent.PharmacyID != pharmacyID {
		return errors.New("unauthorized")
	}

	return u.deliveryRepo.Delete(ctx, agentID)
}

func (u *deliveryUseCase) UnassignOrder(ctx context.Context, pharmacyUserID uuid.UUID, orderID uuid.UUID) error {
	// 1. Verify Pharmacy
	pharmacyID := u.userRepo.GetPharmacyByUserID(ctx, pharmacyUserID)
	if pharmacyID == uuid.Nil {
		return errors.New("pharmacy not found")
	}

	// 2. Get Order
	order, err := u.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}
	if order == nil {
		return errors.New("order not found")
	}

	if order.Status == "out_for_delivery" || order.Status == "completed" || order.Status == "cancelled" {
		return errors.New("cannot remove agent from order with current status")
	}

	order.DeliveryAgentID = nil

	type OrderUpdater interface {
		Update(ctx context.Context, order *entity.Order) error
	}
	if updater, ok := u.orderRepo.(OrderUpdater); ok {
		return updater.Update(ctx, order)
	}
	return errors.New("order repository does not support update")
}
