package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/service"
	"github.com/skryfon/collex/pkg/config"
)

// tokenService implements the TokenService interface
type tokenService struct {
	config *config.Config
}

// NewTokenService creates a new token service
func NewTokenService(config *config.Config) service.TokenService {
	return &tokenService{
		config: config,
	}
}

// GenerateTokenPair generates both access and refresh tokens
func (s *tokenService) GenerateTokenPair(user *entity.User) (*service.TokenPair, error) {
	accessToken, expiresAt, err := s.GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.GenerateRefreshToken(user)
	if err != nil {
		return nil, err
	}

	return &service.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
	}, nil
}

// GenerateAccessToken creates an access JWT token for the user
func (s *tokenService) GenerateAccessToken(user *entity.User) (string, time.Time, error) {
	expirationTime := time.Now().Add(s.config.JWT.Expiration)

	claims := &service.JWTClaims{
		UserID:    user.ID,
		Email:     s.getEmailValue(user.Email),
		Role:      user.RoleID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Latitude:  user.Address.Latitude,
		Longitude: user.Address.Longitude,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "techpharma",
			Subject:   user.ID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWT.SecretKey))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// GenerateRefreshToken creates a refresh JWT token for the user
func (s *tokenService) GenerateRefreshToken(user *entity.User) (string, error) {
	expirationTime := time.Now().Add(s.config.JWT.RefreshExpiry)

	claims := &service.JWTClaims{
		UserID:    user.ID,
		Email:     s.getEmailValue(user.Email),
		Role:      user.RoleID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Latitude:  user.Address.Latitude,
		Longitude: user.Address.Longitude,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "techpharma",
			Subject:   user.ID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.SecretKey))
}

// ValidateToken validates and parses a JWT token
func (s *tokenService) ValidateToken(tokenString string) (*service.JWTClaims, error) {
	claims := &service.JWTClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(s.config.JWT.SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("token is invalid")
	}

	if claims.IsExpired() {
		return nil, errors.New("token is expired")
	}

	return claims, nil
}

// RefreshToken generates a new access token from a valid refresh token
func (s *tokenService) RefreshToken(refreshToken string) (string, error) {
	claims, err := s.ValidateToken(refreshToken)
	if err != nil {
		return "", err
	}

	if claims.TokenType != "refresh" {
		return "", errors.New("token is not a refresh token")
	}

	// Create a new access token with updated expiration
	expirationTime := time.Now().Add(s.config.JWT.Expiration)

	newClaims := &service.JWTClaims{
		UserID:    claims.UserID,
		Email:     claims.Email,
		Role:      claims.Role,
		FirstName: claims.FirstName,
		LastName:  claims.LastName,
		Latitude:  claims.Latitude,
		Longitude: claims.Longitude,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "techpharma",
			Subject:   claims.UserID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	return token.SignedString([]byte(s.config.JWT.SecretKey))
}

// Helper functions
func (s *tokenService) getEmailValue(email *string) string {
	if email != nil {
		return *email
	}
	return ""
}

func (s *tokenService) GenerateResetToken(user *entity.User) (string, error) {
	expirationTime := time.Now().Add(s.config.JWT.Expiration)

	claims := &service.JWTClaims{
		UserID:    user.ID,
		Email:     s.getEmailValue(user.Email),
		Role:      user.RoleID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Latitude:  user.Address.Latitude,
		Longitude: user.Address.Longitude,
		TokenType: "reset",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "techpharma",
			Subject:   user.ID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.SecretKey))
}
