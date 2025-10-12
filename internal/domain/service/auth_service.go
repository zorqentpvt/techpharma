package service

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
)

// AuthService defines the interface for authentication and authorization
type AuthService interface {
	// Authentication methods
	AuthenticateUser(ctx context.Context, phoneNumber, password string) (*entity.User, error)
	ValidateCredentials(ctx context.Context, identifier, password string) (*entity.User, error)

	// Authorization methods
	HasPermission(ctx context.Context, userID uuid.UUID, resource, action string) (bool, error)
	HasRole(ctx context.Context, userID uuid.UUID, roleName string) (bool, error)
	GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error)
	GetUserRoles(ctx context.Context, userID uuid.UUID) ([]string, error)

	// Session management
	CreateSession(ctx context.Context, user *entity.User, deviceInfo, ipAddress, userAgent string) (*entity.UserSession, error)
	InvalidateSession(ctx context.Context, sessionToken string) error
	ValidateSession(ctx context.Context, sessionToken string) (*entity.UserSession, error)
}

// tygo:emit
// JWTClaims represents JWT claims structure
type JWTClaims struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	TokenType string    `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// IsExpired checks if the token is expired
func (c *JWTClaims) IsExpired() bool {
	if c.ExpiresAt == nil {
		return true
	}
	return time.Now().After(c.ExpiresAt.Time)
}

// PasswordService defines the interface for password operations
type PasswordService interface {
	HashPassword(password string) (string, error)
	ComparePassword(hashedPassword, password string) error
}

// TokenPair represents an access and refresh token pair
type TokenPair struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

// TokenService defines the interface for token operations
type TokenService interface {
	GenerateTokenPair(user *entity.User) (*TokenPair, error)
	GenerateAccessToken(user *entity.User) (string, time.Time, error)
	GenerateRefreshToken(user *entity.User) (string, error)
	GenerateResetToken(user *entity.User) (string, error)
	ValidateToken(token string) (*JWTClaims, error)
	RefreshToken(token string) (string, error)
}
