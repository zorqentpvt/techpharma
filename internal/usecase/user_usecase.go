package usecase

import (
	"context"
	"crypto/rand"
	"math/big"

	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/domain/service"
	"github.com/skryfon/collex/internal/types"
	"golang.org/x/crypto/bcrypt"
)

// UserUseCase defines the interface for user-related operations
type UserUseCase interface {
	// User management methods
	CreateUser(ctx context.Context, user *entity.User) (*entity.User, error)
	GetAllRoles(ctx context.Context) ([]*entity.Role, error)
	UpdateUser(ctx context.Context, id uuid.UUID, user *entity.User) (*entity.User, error)
	UpdateUserStatus(ctx context.Context, id uuid.UUID, status string) error
	ListUsers(ctx context.Context, filters types.UserListFilters, pagination types.PaginationOptions) (*types.UserListResult, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*entity.User, error) // Fixed: added return types
	UpdateUserProfile(ctx context.Context, userID uuid.UUID, user *entity.User) (*entity.User, error)
}

// userUseCase implements the UserUseCase interface
type userUseCase struct {
	userRepo     repository.UserRepository
	emailService service.EmailService
}

// NewUserUseCase creates a new instance of userUseCase
func NewUserUseCase(userRepo repository.UserRepository, emailService service.EmailService) UserUseCase {
	return &userUseCase{
		userRepo:     userRepo,
		emailService: emailService,
	}
}

// CreateUser creates a new user with proper validation and error handling
// CreateUser creates a new user with proper validation and error handling
func (u *userUseCase) CreateUser(ctx context.Context, user *entity.User) (*entity.User, error) {
	if user == nil {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "User data cannot be empty",
		}
	}

	// Validate required fields
	if user.FirstName == "" || user.LastName == "" {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "First name and last name are required",
		}
	}

	// Validate email
	if user.Email == nil || *user.Email == "" {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "Email is required",
		}
	}

	// Validate phone number
	if user.PhoneNumber == "" {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "Phone number is required",
		}
	}
	// Validate role
	if user.RoleID == nil {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "User role is required",
		}
	}

	// Validate college ID

	// Get the user ID from context (who is creating this user)

	// Check for existing user by email
	existingUser, err := u.userRepo.GetByEmail(ctx, *user.Email)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_FETCH_ERROR",
			Message: "Failed to check existing user by email",
			Err:     err,
		}
	}
	// Handle the duplicate email case
	if existingUser != nil {
		return nil, &errors.DomainError{
			Code:    "USER_EMAIL_EXISTS",
			Message: "A user with this email already exists",
		}
	}

	// Generate display name from first name and last name
	displayName := user.FirstName + " " + user.LastName
	user.DisplayName = &displayName

	// Generate default password
	defaultPassword := u.generateDefaultPassword(user)

	// Hash the generated password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "PASSWORD_HASH_ERROR",
			Message: "Failed to secure password",
		}
	}
	user.Password = string(hashedPassword)

	// Set system fields
	user.ID = uuid.New()
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	// Set default status if not provided
	if user.Status == "" {
		user.Status = "active"
	}

	// Create user in database
	if err := u.userRepo.Create(ctx, user); err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_CREATE_ERROR",
			Message: "Failed to create user",
		}
	}

	// Assign role to user

	return user, nil
}

// generateDefaultPassword creates a default password for the user
func (u *userUseCase) generateDefaultPassword(user *entity.User) string {
	if user.Email == nil || *user.Email == "" {
		// Fallback to random password if no email
		return u.generateRandomPassword(8)
	}

	email := *user.Email
	// Get the part before @ symbol
	emailPrefix := strings.Split(email, "@")[0]

	// Use first few characters of email + random numbers
	if len(emailPrefix) >= 4 {
		return emailPrefix[:4] + "123!"
	}

	return emailPrefix + "123!"
}

// generateRandomPassword creates a random password of specified length

func (u *userUseCase) generateRandomPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
	password := make([]byte, length)
	for i := range password {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		password[i] = charset[num.Int64()]
	}
	return string(password)
}

func (u *userUseCase) GetAllRoles(ctx context.Context) ([]*entity.Role, error) {
	roles, err := u.userRepo.GetAllRoles(ctx)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "ROLE_FETCH_ERROR",
			Message: "Failed to fetch roles",
		}
	}

	if len(roles) == 0 {
		return nil, &errors.DomainError{
			Code:    "NO_ROLES_FOUND",
			Message: "No roles found in the system",
		}
	}

	return roles, nil
}
func (u *userUseCase) UpdateUser(ctx context.Context, id uuid.UUID, user *entity.User) (*entity.User, error) {
	if user == nil {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "User data cannot be empty",
		}
	}

	// Declare assignedByUUID at function scope so it can be used later

	// Use the id parameter, not user.ID
	existingUser, err := u.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_FETCH_ERROR",
			Message: "Failed to fetch user",
		}
	}
	if existingUser == nil {
		return nil, &errors.DomainError{
			Code:    "USER_NOT_FOUND",
			Message: "User not found",
		}
	}

	// Update display name if first name or last name changed
	updateDisplayName := false

	// Update fields if provided
	if user.FirstName != "" {
		existingUser.FirstName = user.FirstName
		updateDisplayName = true
	}
	if user.LastName != "" {
		existingUser.LastName = user.LastName
		updateDisplayName = true
	}

	// Update display name if name fields changed
	if updateDisplayName {
		displayName := existingUser.FirstName + " " + existingUser.LastName
		existingUser.DisplayName = &displayName
	}

	if user.PhoneNumber != "" {
		// Check for phone number conflicts
		if user.PhoneNumber != existingUser.PhoneNumber {
			phoneExists, err := u.userRepo.GetByPhoneNumber(ctx, user.PhoneNumber)
			if err == nil && phoneExists != nil && phoneExists.ID != existingUser.ID {
				return nil, &errors.DomainError{
					Code:    "USER_PHONE_EXISTS",
					Message: "A user with this phone number already exists",
				}
			}
		}
		existingUser.PhoneNumber = user.PhoneNumber
	}

	if user.Email != nil {
		// Check for email conflicts
		if *user.Email != "" {
			if existingUser.Email == nil || *user.Email != *existingUser.Email {
				emailExists, err := u.userRepo.GetByEmail(ctx, *user.Email)
				if err == nil && emailExists != nil && emailExists.ID != existingUser.ID {
					return nil, &errors.DomainError{
						Code:    "USER_EMAIL_EXISTS",
						Message: "A user with this email already exists",
					}
				}
			}
		}
		existingUser.Email = user.Email
	}

	if user.Status != "" {
		existingUser.Status = user.Status
	}

	// Handle role updates

	// Assign new role

	existingUser.UpdatedAt = time.Now()

	// Use the id parameter consistently
	if err := u.userRepo.UpdateUser(ctx, id, existingUser); err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_UPDATE_ERROR",
			Message: "Failed to update user",
		}
	}

	return existingUser, nil
}

// UpdateUserStatus updates the status of a user
func (u *userUseCase) UpdateUserStatus(ctx context.Context, id uuid.UUID, status string) error {
	if status != "active" && status != "suspended" {
		return &errors.DomainError{
			Code:    "INVALID_STATUS",
			Message: "Status must be either 'active' or 'suspended'",
		}
	}

	// Get the user ID from context (who is updating this user) - needed for both cases
	deactivatedByUserID, ok := ctx.Value("userID").(string)
	if !ok || deactivatedByUserID == "" {
		return &errors.DomainError{
			Code:    "AUTHORIZATION_ERROR",
			Message: "User context not found",
		}
	}

	// Parse the UUID from string
	deactivatedByUUID, err := uuid.Parse(deactivatedByUserID)
	if err != nil {
		return &errors.DomainError{
			Code:    "AUTHORIZATION_ERROR",
			Message: "Invalid user ID in context",
		}
	}

	// Get the user
	user, err := u.userRepo.GetByID(ctx, id)
	if err != nil {
		return &errors.DomainError{
			Code:    "USER_FETCH_ERROR",
			Message: "Failed to fetch user",
		}
	}
	if user == nil {
		return &errors.DomainError{
			Code:    "USER_NOT_FOUND",
			Message: "User not found",
		}
	}

	// Update status
	user.Status = status
	user.UpdatedAt = time.Now()

	// Set the user who is updating this status
	switch user.Status {
	case "suspended":
		user.IsActive = false
		now := time.Now()
		user.DeactivatedAt = &now
		user.DeactivatedBy = &deactivatedByUUID
	case "active":
		user.IsActive = true
		user.DeactivatedAt = nil // Explicitly set to nil
		user.DeactivatedBy = nil // Explicitly set to nil
	}

	// Update user in repository
	if err := u.userRepo.UpdateUser(ctx, id, user); err != nil {
		return &errors.DomainError{
			Code:    "USER_UPDATE_ERROR",
			Message: "Failed to update user status",
		}
	}

	emailData := map[string]interface{}{
		"UserName":  user.DisplayName,
		"UserEmail": user.Email,
		"Status":    status,
		"UpdatedAt": user.UpdatedAt.Format("January 2, 2006 at 3:04 PM"),
		"AppName":   "Collex",
	}

	// Add reason for suspension if applicable
	if status == "suspended" {
		emailData["Reason"] = "Account suspended by administrator"
	}
	/*
		if err := u.emailService.Send(context.Background(), entity.EmailTypeUserStatusUpdate, emailData); err != nil {
			// Log error but don't fail status update
			println("Failed to send status update email:", err.Error())
		}
	*/
	return nil
}

// Update your ListUsers method in the usecase file to:
func (u *userUseCase) ListUsers(ctx context.Context, filters types.UserListFilters, pagination types.PaginationOptions) (*types.UserListResult, error) {
	// Calculate offset
	offset := (pagination.Page - 1) * pagination.Limit

	// Call repository with filters, pagination, and sorting
	users, total, err := u.userRepo.ListWithFilters(ctx, filters, pagination.Limit, offset, pagination.SortField, pagination.SortOrder)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_LIST_ERROR",
			Message: "Failed to fetch users",
			Err:     err,
		}
	}

	// Calculate pagination metadata
	totalPages := int((total + int64(pagination.Limit) - 1) / int64(pagination.Limit))
	hasNext := pagination.Page < totalPages
	hasPrevious := pagination.Page > 1

	paginationMeta := types.PaginationMeta{
		CurrentPage:  pagination.Page,
		TotalPages:   totalPages,
		TotalItems:   total,
		ItemsPerPage: pagination.Limit,
		HasNext:      hasNext,
		HasPrevious:  hasPrevious,
	}

	return &types.UserListResult{
		Users:      users,
		Pagination: paginationMeta,
	}, nil
}
func (u *userUseCase) GetUserByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	if id == uuid.Nil {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "User ID cannot be empty",
		}
	}

	// Fetch user from repository
	user, err := u.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_FETCH_ERROR",
			Message: "Failed to fetch user",
			Err:     err,
		}
	}

	if user == nil {
		return nil, &errors.DomainError{
			Code:    "USER_NOT_FOUND",
			Message: "User not found",
		}
	}

	return user, nil
}

// UpdateUserProfile updates user profile fields excluding restricted fields
// Restricted fields: firstName, lastName, email, userRoleId, phoneNumber, college, status
func (u *userUseCase) UpdateUserProfile(ctx context.Context, userID uuid.UUID, user *entity.User) (*entity.User, error) {
	if user == nil {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "User data cannot be empty",
		}
	}

	if userID == uuid.Nil {
		return nil, &errors.DomainError{
			Code:    "USER_VALIDATION_ERROR",
			Message: "User ID cannot be empty",
		}
	}

	// Fetch existing user from repository
	existingUser, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_FETCH_ERROR",
			Message: "Failed to fetch user",
			Err:     err,
		}
	}

	if existingUser == nil {
		return nil, &errors.DomainError{
			Code:    "USER_NOT_FOUND",
			Message: "User not found",
		}
	}

	// Update only allowed profile fields
	profileUpdated := false

	// Update display name if provided
	if user.DisplayName != nil && *user.DisplayName != "" {
		if existingUser.DisplayName == nil || *user.DisplayName != *existingUser.DisplayName {
			existingUser.DisplayName = user.DisplayName
			profileUpdated = true
		}
	}
	// Update language if provided
	if user.Language != "" && user.Language != existingUser.Language {
		existingUser.Language = user.Language
		profileUpdated = true
	}

	// Update avatar if provided
	if user.Avatar != nil {
		// Handle avatar update (could be setting to nil or changing value)
		if existingUser.Avatar == nil || (user.Avatar != nil && *user.Avatar != *existingUser.Avatar) {
			existingUser.Avatar = user.Avatar
			profileUpdated = true
		}
	}

	// Update date of birth if provided
	if user.DateOfBirth != nil {
		// Check if it's different from existing value
		if existingUser.DateOfBirth == nil || !user.DateOfBirth.Equal(*existingUser.DateOfBirth) {
			existingUser.DateOfBirth = user.DateOfBirth
			profileUpdated = true
		}
	}

	// Update gender if provided
	if user.Gender != nil {
		// Handle gender update (could be setting to nil or changing value)
		if existingUser.Gender == nil || (user.Gender != nil && *user.Gender != *existingUser.Gender) {
			existingUser.Gender = user.Gender
			profileUpdated = true
		}
	}

	// Update address information if provided
	if user.Address.Address != "" {
		if existingUser.Address.Address == "" {
			existingUser.Address = user.Address
			profileUpdated = true
		} else {
			// Compare and update individual address fields
			addressUpdated := false
			if user.Address.Address != existingUser.Address.Address {
				existingUser.Address.Address = user.Address.Address
				addressUpdated = true
			}
			if user.Address.City != existingUser.Address.City {
				existingUser.Address.City = user.Address.City
				addressUpdated = true
			}
			if user.Address.State != existingUser.Address.State {
				existingUser.Address.State = user.Address.State
				addressUpdated = true
			}
			if user.Address.Country != existingUser.Address.Country {
				existingUser.Address.Country = user.Address.Country
				addressUpdated = true
			}
			if user.Address.PostalCode != existingUser.Address.PostalCode {
				existingUser.Address.PostalCode = user.Address.PostalCode
				addressUpdated = true
			}

			if addressUpdated {
				profileUpdated = true
			}
		}
	}

	// Update contact information if provided (only secondary phone allowed)
	if user.ContactInfo.SecondaryPhone != nil {
		// Initialize ContactInfo if it doesn't exist
		if existingUser.ContactInfo.SecondaryPhone == nil {
			existingUser.ContactInfo.SecondaryPhone = user.ContactInfo.SecondaryPhone
			profileUpdated = true
		} else if *user.ContactInfo.SecondaryPhone != *existingUser.ContactInfo.SecondaryPhone {
			existingUser.ContactInfo.SecondaryPhone = user.ContactInfo.SecondaryPhone
			profileUpdated = true
		}
	}
	if user.ContactInfo.Email != nil {
		// Initialize ContactInfo.Email if it doesn't exist on the existing user
		if existingUser.ContactInfo.Email == nil {
			existingUser.ContactInfo.Email = user.ContactInfo.Email
			profileUpdated = true
		} else if *user.ContactInfo.Email != *existingUser.ContactInfo.Email {
			existingUser.ContactInfo.Email = user.ContactInfo.Email
			profileUpdated = true
		}
	}
	// If no fields were updated, return the existing user without making a database call
	if !profileUpdated {
		return existingUser, nil
	}

	// Update the timestamp
	existingUser.UpdatedAt = time.Now()

	// Update user in repository using the profile-specific update method
	// This ensures only profile fields are updated in the database
	if err := u.userRepo.UpdateUser(ctx, userID, existingUser); err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_PROFILE_UPDATE_ERROR",
			Message: "Failed to update user profile",
			Err:     err,
		}
	}

	// Fetch the updated user with all related data to return complete profile
	updatedUser, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, &errors.DomainError{
			Code:    "USER_FETCH_ERROR",
			Message: "Failed to fetch updated user profile",
			Err:     err,
		}
	}

	return updatedUser, nil
}

/*PATIENT*/
