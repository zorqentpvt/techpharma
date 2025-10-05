package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/domain/service"
)

// authService implements the AuthService interface
type authService struct {
	userRepo repository.UserRepository
}

// NewAuthService creates a new authentication service
func NewAuthService(userRepo repository.UserRepository) service.AuthService {
	return &authService{
		userRepo: userRepo,
	}
}

// AuthenticateUser authenticates a user by phone number and password
func (s *authService) AuthenticateUser(ctx context.Context, phoneNumber, password string) (*entity.User, error) {
	user, err := s.userRepo.GetByPhoneNumber(ctx, phoneNumber)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, errors.New("user not found")
	}

	if !user.CanLogin() {
		return nil, errors.New("user cannot login")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid password")
	}

	return user, nil
}

// ValidateCredentials validates user credentials (email or phone) and password
func (s *authService) ValidateCredentials(ctx context.Context, identifier, password string) (*entity.User, error) {
	var user *entity.User
	var err error

	// Determine if identifier is email or phone number
	if strings.Contains(identifier, "@") {
		user, err = s.userRepo.GetByEmail(ctx, identifier)
	} else {
		user, err = s.userRepo.GetByPhoneNumber(ctx, identifier)
	}

	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, errors.New("user not found")
	}

	if !user.CanLogin() {
		return nil, errors.New("user cannot login")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid password")
	}

	return user, nil
}

// HasPermission checks if a user has a specific permission
func (s *authService) HasPermission(ctx context.Context, userID uuid.UUID, resource, action string) (bool, error) {
	// TODO: Implement permission checking logic
	// For now, return true for active users
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return false, err
	}

	if user == nil || !user.IsActive {
		return false, nil
	}

	// Basic permission logic - can be extended based on requirements
	return user.Status == "active", nil
}

// HasRole checks if a user has a specific role
func (s *authService) HasRole(ctx context.Context, userID uuid.UUID, roleName string) (bool, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return false, err
	}

	if user == nil {
		return false, nil
	}

	// TODO: Implement proper role checking logic
	// For now, basic role checking based on user status
	switch roleName {
	case "user":
		return user.Status == "active", nil
	case "admin":
		// Check if user has admin role - to be implemented
		return false, nil
	default:
		return false, nil
	}
}

// GetUserPermissions returns all permissions for a user
func (s *authService) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user == nil || !user.IsActive {
		return []string{}, nil
	}

	// TODO: Implement proper permission retrieval
	// For now, return basic permissions for active users
	permissions := []string{
		"read:profile",
		"update:profile",
	}

	if user.Status == "active" {
		permissions = append(permissions, "access:dashboard")
	}

	return permissions, nil
}

// GetUserRoles returns all roles for a user
func (s *authService) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]string, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return []string{}, nil
	}

	// TODO: Implement proper role retrieval
	// For now, return basic roles based on user status
	roles := []string{}

	if user.Status == "active" {
		roles = append(roles, "user")
	}

	// Check for admin role - to be implemented
	// if user.IsAdmin {
	//     roles = append(roles, "admin")
	// }

	return roles, nil
}

// CreateSession creates a new user session
func (s *authService) CreateSession(ctx context.Context, user *entity.User, deviceInfo, ipAddress, userAgent string) (*entity.UserSession, error) {
	sessionToken := uuid.New().String()
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour) // Session expires in 24 hours

	session := &entity.UserSession{
		UserID:       user.ID,
		SessionToken: sessionToken,
		DeviceInfo:   deviceInfo,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		LoginAt:      now,
		LastActiveAt: now,
		ExpiresAt:    expiresAt,
		IsActive:     true,
		Status:       "active",
	}

	// TODO: Implement session repository to store sessions
	// For now, return the session object
	return session, nil
}

// InvalidateSession invalidates a user session
func (s *authService) InvalidateSession(ctx context.Context, sessionToken string) error {
	// TODO: Implement session invalidation
	// This would typically involve updating the session status in the database
	return nil
}

// ValidateSession validates a user session
func (s *authService) ValidateSession(ctx context.Context, sessionToken string) (*entity.UserSession, error) {
	// TODO: Implement session validation
	// This would typically involve retrieving the session from the database
	// and checking if it's still valid
	return nil, errors.New("session validation not implemented")
}
