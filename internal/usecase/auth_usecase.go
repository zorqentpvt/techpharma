package usecase

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/skryfon/collex/internal/domain/entity"
	domainErrors "github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/domain/service"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/pkg/config"
	"github.com/skryfon/collex/shared"
)

// AuthUseCase defines the interface for authentication use cases
type AuthUseCase interface {
	Login(ctx context.Context, req *types.LoginRequest) (*types.LoginResponse, error)
	RefreshToken(ctx context.Context, req *types.RefreshTokenRequest) (*types.RefreshTokenResponse, error)
	Register(ctx context.Context, req *types.RegisterRequest) (*types.RegisterResponse, error)
	ChangePassword(ctx context.Context, userID string, req *types.ChangePasswordRequest) error
	ValidateToken(ctx context.Context, token string) (*types.TokenValidationResponse, error)
	ForgotPassword(ctx context.Context, req *types.ForgotPasswordRequest) error
	ResetPassword(ctx context.Context, req *types.ResetPasswordRequest) error
}

// authUseCase implements AuthUseCase interface
type authUseCase struct {
	userRepo     repository.UserRepository
	auditRepo    repository.AuditLogRepository
	securityRepo repository.SecurityEventRepository
	tokenService service.TokenService
	authService  service.AuthService
	emailservice service.EmailService // Added Email Service for password reset
	config       *config.EmailConfig
}

// NewAuthUseCase creates a new authentication use case
func NewAuthUseCase(
	userRepo repository.UserRepository,
	auditRepo repository.AuditLogRepository,
	securityRepo repository.SecurityEventRepository,
	tokenService service.TokenService,
	authService service.AuthService,
	emailService service.EmailService, // Added Email Service for password reset
	cfg *config.Config,

) AuthUseCase {
	return &authUseCase{
		userRepo:     userRepo,
		auditRepo:    auditRepo,
		securityRepo: securityRepo,
		tokenService: tokenService,
		authService:  authService,
		emailservice: emailService,
		config:       &cfg.Email,
	}
}

// Login handles user authentication
func (uc *authUseCase) Login(ctx context.Context, req *types.LoginRequest) (*types.LoginResponse, error) {
	if req == nil {
		return nil, domainErrors.NewDomainError("INVALID_REQUEST", "Login request cannot be nil", domainErrors.ErrInvalidInput)
	}

	if req.Email == "" || req.Password == "" {
		return nil, domainErrors.NewDomainError("MISSING_CREDENTIALS", "Email and password are required", domainErrors.ErrInvalidInput)
	}

	// Get user by email or phone number
	var user *entity.User
	var err error

	if strings.Contains(req.Email, "@") {
		user, err = uc.userRepo.GetByEmail(ctx, req.Email)
	} else {
		user, err = uc.userRepo.GetByPhoneNumber(ctx, req.Email)
	}

	if err != nil {
		log.Printf("Error retrieving user %s: %v", req.Email, err)
		return nil, domainErrors.NewDomainError("USER_LOOKUP_FAILED", "Failed to retrieve user information", domainErrors.ErrInternalServer)
	}

	if user == nil {
		return nil, domainErrors.NewDomainError("USER_NOT_FOUND", "Invalid credentials", domainErrors.ErrUnauthorized)
	}

	// Check if user can login
	if !user.CanLogin() {
		var reason string
		if !user.IsActive {
			reason = "Account is deactivated"
		} else if user.Status != "active" {
			reason = "Account is not active"
		} else if !user.IsVerified() {
			reason = "Account verification required"
		} else {
			reason = "Account access restricted"
		}
		switch user.Status {
		case string(shared.StatusSuspended):
			reason = "Account is suspended"
		case string(shared.StatusBlocked):
			reason = "Account is blocked"
		default:
			reason = "Account status updated"
		}
		return nil, domainErrors.NewDomainError("LOGIN_BLOCKED", reason, domainErrors.ErrForbidden)
	}

	// Validate password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, domainErrors.NewDomainError("INVALID_CREDENTIALS", "Invalid credentials", domainErrors.ErrUnauthorized)
	}

	// Generate tokens
	tokenPair, err := uc.tokenService.GenerateTokenPair(user)
	if err != nil {
		log.Printf("Failed to generate tokens for user %s: %v", user.ID, err)
		return nil, domainErrors.NewDomainError("TOKEN_GENERATION_FAILED", "Failed to generate authentication tokens", domainErrors.ErrInternalServer)
	}

	// Update last login time
	now := time.Now()
	user.LastLoginAt = &now

	if err := uc.userRepo.Update(ctx, user); err != nil {
		log.Printf("Failed to update last login time for user %s: %v", user.ID, err)
		// Don't fail the login for this error, just log it
	}
	if user.FirstTimeLogin == true {
		resetToken, err := uc.tokenService.GenerateResetToken(user)
		if err != nil {
			log.Printf("Failed to generate reset token for user %s: %v", user.ID, err)
			return nil, domainErrors.NewDomainError("TOKEN_GENERATION_FAILED", "Failed to generate reset token", domainErrors.ErrInternalServer)
		}

		return &types.LoginResponse{
			AccessToken:  tokenPair.AccessToken,
			RefreshToken: tokenPair.RefreshToken,
			ExpiresAt:    tokenPair.ExpiresAt,
			User:         *user,
			FirstTime:    true, // Explicit boolean instead of user.FirstTimeLogin
			ResetToken:   resetToken,
		}, nil
	}

	return &types.LoginResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt,
		User:         *user,
		FirstTime:    user.FirstTimeLogin, // Include first time login status
	}, nil
}

// RefreshToken handles token refresh
func (uc *authUseCase) RefreshToken(ctx context.Context, req *types.RefreshTokenRequest) (*types.RefreshTokenResponse, error) {
	if req == nil || req.RefreshToken == "" {
		return nil, domainErrors.NewDomainError("INVALID_REQUEST", "Refresh token is required", domainErrors.ErrInvalidInput)
	}

	// Validate refresh token
	claims, err := uc.tokenService.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, domainErrors.NewDomainError("INVALID_TOKEN", "Invalid refresh token", domainErrors.ErrUnauthorized)
	}

	if claims.TokenType != "refresh" {
		return nil, domainErrors.NewDomainError("WRONG_TOKEN_TYPE", "Token is not a refresh token", domainErrors.ErrUnauthorized)
	}

	// Get user to generate new tokens
	user, err := uc.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		log.Printf("Error getting user by ID %s: %v", claims.UserID, err)
		return nil, domainErrors.NewDomainError("USER_LOOKUP_FAILED", "Failed to process token refresh", domainErrors.ErrInternalServer)
	}

	if user == nil || !user.CanLogin() {
		return nil, domainErrors.NewDomainError("USER_INVALID", "User account is no longer valid", domainErrors.ErrUnauthorized)
	}

	// Generate new token pair
	tokenPair, err := uc.tokenService.GenerateTokenPair(user)
	if err != nil {
		log.Printf("Failed to generate tokens for user %s: %v", user.ID, err)
		return nil, domainErrors.NewDomainError("TOKEN_GENERATION_FAILED", "Failed to generate authentication tokens", domainErrors.ErrInternalServer)
	}

	return &types.RefreshTokenResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt,
	}, nil
}

// Register handles user registration
func (uc *authUseCase) Register(ctx context.Context, req *types.RegisterRequest) (*types.RegisterResponse, error) {
	if req == nil {
		return nil, domainErrors.NewDomainError("INVALID_REQUEST", "Registration request cannot be nil", domainErrors.ErrInvalidInput)
	}

	// Validate required fields
	if req.FirstName == "" || req.LastName == "" || req.PhoneNumber == "" || req.Password == "" {
		return nil, domainErrors.NewDomainError("MISSING_REQUIRED_FIELDS", "First name, last name, phone number, and password are required", domainErrors.ErrInvalidInput)
	}

	// Check if user already exists by phone number
	existingUser, err := uc.userRepo.GetByPhoneNumber(ctx, req.PhoneNumber)
	if err != nil {
		log.Printf("Error checking existing user by phone %s: %v", req.PhoneNumber, err)
		return nil, domainErrors.NewDomainError("USER_CHECK_FAILED", "Failed to check existing user", domainErrors.ErrInternalServer)
	}

	if existingUser != nil {
		return nil, domainErrors.NewDomainError("USER_EXISTS", "User with this phone number already exists", domainErrors.ErrAlreadyExists)
	}

	// Check if user already exists by email (if provided)
	if req.Email != nil && *req.Email != "" {
		existingUser, err := uc.userRepo.GetByEmail(ctx, *req.Email)
		if err != nil {
			log.Printf("Error checking existing user by email %s: %v", *req.Email, err)
			return nil, domainErrors.NewDomainError("USER_CHECK_FAILED", "Failed to check existing user", domainErrors.ErrInternalServer)
		}

		if existingUser != nil {
			return nil, domainErrors.NewDomainError("EMAIL_EXISTS", "User with this email already exists", domainErrors.ErrAlreadyExists)
		}
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, domainErrors.NewDomainError("PASSWORD_HASH_ERROR", "Failed to secure password", domainErrors.ErrInternalServer)
	}

	// Create user entity
	user := &entity.User{
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		PhoneNumber:     req.PhoneNumber,
		Password:        string(hashedPassword),
		Email:           req.Email,
		IsPhoneVerified: true, // Require phone verification
		IsEmailVerified: true,
		Status:          "active", // Require activation
		IsActive:        true,
		Language:        "en",
	}

	// Create user in database
	if err := uc.userRepo.Create(ctx, user); err != nil {
		log.Printf("Failed to create user: %v", err)
		return nil, domainErrors.NewDomainError("USER_CREATION_FAILED", "Failed to create user account", domainErrors.ErrInternalServer)
	}

	return &types.RegisterResponse{
		UserID:  user.ID,
		Message: "User registered successfully. Please verify your phone number to activate your account.",
	}, nil
}

// ChangePassword handles password change
func (uc *authUseCase) ChangePassword(ctx context.Context, userID string, req *types.ChangePasswordRequest) error {
	if req == nil {
		return domainErrors.NewDomainError("INVALID_REQUEST", "Change password request cannot be nil", domainErrors.ErrInvalidInput)
	}

	if req.CurrentPassword == "" || req.NewPassword == "" || req.NewPasswordConfirmation == "" {
		return domainErrors.NewDomainError("MISSING_PASSWORDS", "Current password, new password, and confirm password are required", domainErrors.ErrInvalidInput)
	}

	// 🔑 Add this validation check
	if req.NewPassword != req.NewPasswordConfirmation {
		return domainErrors.NewDomainError("PASSWORD_MISMATCH", "New password and confirm password do not match", domainErrors.ErrInvalidInput)
	}

	// Parse user ID
	userUUID, err := parseUUID(userID)
	if err != nil {
		return domainErrors.NewDomainError("INVALID_USER_ID", "Invalid user ID format", domainErrors.ErrInvalidInput)
	}

	// Get user
	user, err := uc.userRepo.GetByID(ctx, userUUID)
	if err != nil {
		log.Printf("Error getting user by ID %s: %v", userID, err)
		return domainErrors.NewDomainError("USER_LOOKUP_FAILED", "Failed to retrieve user", domainErrors.ErrInternalServer)
	}

	if user == nil {
		return domainErrors.NewDomainError("USER_NOT_FOUND", "User not found", domainErrors.ErrNotFound)
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return domainErrors.NewDomainError("INVALID_CURRENT_PASSWORD", "Current password is incorrect", domainErrors.ErrUnauthorized)
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash new password: %v", err)
		return domainErrors.NewDomainError("PASSWORD_HASH_FAILED", "Failed to process new password", domainErrors.ErrInternalServer)
	}

	// Update password
	user.Password = string(hashedPassword)
	if err := uc.userRepo.Update(ctx, user); err != nil {
		log.Printf("Failed to update user password: %v", err)
		return domainErrors.NewDomainError("PASSWORD_UPDATE_FAILED", "Failed to update password", domainErrors.ErrInternalServer)
	}

	return nil
}

// ValidateToken validates a token and returns user information
func (uc *authUseCase) ValidateToken(ctx context.Context, token string) (*types.TokenValidationResponse, error) {
	if token == "" {
		return nil, domainErrors.NewDomainError("MISSING_TOKEN", "Token is required", domainErrors.ErrInvalidInput)
	}

	// Validate token
	claims, err := uc.tokenService.ValidateToken(token)
	if err != nil {
		return nil, domainErrors.NewDomainError("INVALID_TOKEN", "Token is invalid or expired", domainErrors.ErrUnauthorized)
	}

	// Get user to ensure they still exist and are active
	user, err := uc.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		log.Printf("Error getting user by ID %s: %v", claims.UserID, err)
		return nil, domainErrors.NewDomainError("USER_LOOKUP_FAILED", "Failed to validate user", domainErrors.ErrInternalServer)
	}

	if user == nil || !user.CanLogin() {
		return nil, domainErrors.NewDomainError("USER_INVALID", "User account is no longer valid", domainErrors.ErrUnauthorized)
	}

	return &types.TokenValidationResponse{
		Valid:  true,
		UserID: user.ID,
		Email:  uc.getEmailValue(user.Email),
		Role:   user.RoleID,
		Claims: claims,
	}, nil
}

// Helper functions
func (uc *authUseCase) getEmailValue(email *string) string {
	if email != nil {
		return *email
	}
	return ""
}

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
func (uc *authUseCase) ForgotPassword(ctx context.Context, req *types.ForgotPasswordRequest) error {
	if req == nil || req.Email == "" {
		return domainErrors.NewDomainError("INVALID_REQUEST", "Email is required for password reset", domainErrors.ErrInvalidInput)
	}

	// Check if user exists by email
	user, err := uc.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		log.Printf("Error retrieving user by email %s: %v", req.Email, err)
		return domainErrors.NewDomainError("USER_LOOKUP_FAILED", "Failed to retrieve user information", domainErrors.ErrInternalServer)
	}

	if user == nil {
		return domainErrors.NewDomainError("USER_NOT_FOUND", "User with this email does not exist", domainErrors.ErrNotFound)
	}

	// Generate password reset token
	resetToken, err := uc.tokenService.GenerateResetToken(user)
	fmt.Println(resetToken)
	if err != nil {
		log.Printf("Failed to generate reset token for user %s: %v", user.ID, err)
		return domainErrors.NewDomainError("TOKEN_GENERATION_FAILED", "Failed to generate password reset token", domainErrors.ErrInternalServer)
	}
	BaseURL := uc.config.DevBaseUrl

	// Construct the actual reset URL with the generated token
	resetURL := fmt.Sprintf("https://%s/reset-password?token=%s", BaseURL, resetToken)

	emailData := map[string]interface{}{
		"UserName":      user.DisplayName,
		"UserEmail":     user.Email,
		"ResetLink":     resetURL, // Use the actual reset URL with token
		"ExpiryMinutes": 30,
		"AppName":       "Collex",
	}
	// Add reason for suspension if applicable

	if err := uc.emailservice.Send(context.Background(), entity.EmailTypePasswordReset, emailData); err != nil {
		// Log error but don't fail status update
		println("Failed to send status update email:", err.Error())
	}

	return nil
}

func (uc *authUseCase) ResetPassword(ctx context.Context, req *types.ResetPasswordRequest) error {
	// Basic nil check (this shouldn't happen if handler validation works properly)
	if req == nil {
		return domainErrors.NewDomainError("INVALID_REQUEST", "Reset password request cannot be nil", domainErrors.ErrInvalidInput)
	}
	if req.NewPassword != req.ConfirmPassword {
		return domainErrors.NewDomainError("PASSWORD_MISMATCH", "New password and confirm password do not match", domainErrors.ErrInvalidInput)
	}

	// Business rule: Password strength validation (optional - add if needed)
	if err := uc.validatePasswordStrength(req.NewPassword); err != nil {
		return domainErrors.NewDomainError("WEAK_PASSWORD", err.Error(), domainErrors.ErrInvalidInput)
	}

	// Validate reset token (business logic)
	claims, err := uc.tokenService.ValidateToken(req.ResetToken)
	if err != nil {
		return domainErrors.NewDomainError("INVALID_TOKEN", "Invalid or expired reset token", domainErrors.ErrUnauthorized)
	}

	// Business rule: Token type validation
	if claims.TokenType != "reset" {
		return domainErrors.NewDomainError("WRONG_TOKEN_TYPE", "Token is not a reset token", domainErrors.ErrUnauthorized)
	}

	// Business logic: Get user to update password
	user, err := uc.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		log.Printf("Error getting user by ID %s: %v", claims.UserID, err)
		return domainErrors.NewDomainError("USER_LOOKUP_FAILED", "Failed to retrieve user information", domainErrors.ErrInternalServer)
	}

	if user == nil {
		return domainErrors.NewDomainError("USER_NOT_FOUND", "User not found", domainErrors.ErrNotFound)
	}

	// Business rule: Check if user is active/enabled (optional)
	if !user.IsActive {
		return domainErrors.NewDomainError("USER_DISABLED", "User account is disabled", domainErrors.ErrForbidden)
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash new password: %v", err)
		return domainErrors.NewDomainError("PASSWORD_HASH_FAILED", "Failed to process new password", domainErrors.ErrInternalServer)
	}

	// Update user's password
	user.Password = string(hashedPassword)
	user.FirstTimeLogin = false // Reset first-time login flag

	if err := uc.userRepo.Update(ctx, user); err != nil {
		log.Printf("Failed to update user password: %v", err)
		return domainErrors.NewDomainError("PASSWORD_UPDATE_FAILED", "Failed to update password", domainErrors.ErrInternalServer)
	}

	return nil
}

// Optional: Password strength validation
func (uc *authUseCase) validatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	return nil
}
