package types

import (
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
)

// tygo:emit
// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"userName" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// tygo:emit
// LoginResponse represents a login response
type LoginResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	ExpiresAt    time.Time   `json:"expiresAt"`
	User         entity.User `json:"user"`
	FirstTime    bool        `json:"firsttime"`            // Indicates if it's the user's first login
	ResetToken   string      `json:"resetToken,omitempty"` // Optional reset token for first-time login
}

// tygo:emit
// RegisterRequest represents a user registration request
type RegisterRequest struct {
	FirstName   string          `json:"firstName"`
	LastName    string          `json:"lastName"`
	PhoneNumber string          `json:"phoneNumber"`
	Password    string          `json:"password"`
	Email       *string         `json:"email,omitempty"`
	Address     *AddressRequest `json:"address,omitempty"`     // Now an object
	ContactInfo *ContactRequest `json:"contactInfo,omitempty"` // Optional contact info as a JSON string
	RoleID      *uuid.UUID      `json:"roleId,omitempty"`      // ADD THIS FIELD
}

// tygo:emit
type CreateUserRequest struct {
	// Basic fields
	FirstName   string `json:"firstname" binding:"required"`
	LastName    string `json:"lastname" binding:"required"`
	Username    string `json:"username" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	CPassword   string `json:"cpassword" binding:"required"`
	PhoneNumber string `json:"num" binding:"required"`
	Address     string `json:"address" binding:"required"`
	DateOfBirth string `json:"dob" binding:"required"`
	Gender      string `json:"gen" binding:"required"`
	RoleID      string `json:"roleId" binding:"required"` // UUID as string

	// Doctor-specific fields
	SpecializationID string `json:"specializationId,omitempty"` // UUID as string
	LicenseNumber    string `json:"licenseNumber,omitempty"`
	Qualification    string `json:"qual,omitempty"`
	Certificate      string `json:"certi,omitempty"`

	// Pharmacy-specific fields
	PharmacyName    string `json:"pharmacyName,omitempty"`
	PharmacyAddress string `json:"paddress,omitempty"`
	GSTNumber       string `json:"gstnumber,omitempty"`
	PharmacyPhone   string `json:"pnum,omitempty"`
}

// tygo:emit
// AddressRequest represents a user's address details
type AddressRequest struct {
	Address    string  `jason:"address"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	Street     string  `json:"street"`
	City       string  `json:"city"`
	State      string  `json:"state"`
	Country    string  `json:"country"`
	PostalCode string  `json:"postalCode"`
}

type ContactRequest struct {
	PrimaryPhone   string  `json:"primaryPhone"`
	SecondaryPhone *string `json:"secondaryPhone,omitempty"`
	Email          *string `json:"email,omitempty"`
	Website        *string `json:"website,omitempty"`
}

// tygo:emit
// UpdateUserRequest represents a user update request
type UpdateUserRequest struct {
	FirstName   string          `json:"firstName,omitempty"`
	LastName    string          `json:"lastName,omitempty"`
	Email       *string         `json:"email,omitempty"`
	PhoneNumber string          `json:"phoneNumber,omitempty"`
	Address     *AddressRequest `json:"address,omitempty"`     // Now an object
	ContactInfo *ContactRequest `json:"contactInfo,omitempty"` // Optional contact info as a JSON string
	RoleID      *uuid.UUID      `json:"RoleId,omitempty"`      // ADD THIS FIELD
	Status      string          `json:"status,omitempty"`      // e.g., "active", "inactive"

}
type UpdateUserResponse struct {
	UserID  uuid.UUID `json:"userId"`
	Message string    `json:"message"`
}

// tygo:emit
// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	CurrentPassword         string `json:"currentPassword" binding:"required"`
	NewPassword             string `json:"newPassword" binding:"required"`
	NewPasswordConfirmation string `json:"newPasswordConfirmation" binding:"required"`
}

// tygo:emit
// UserListResponse represents a paginated user list response
type UserListResponse struct {
	Users       []entity.User `json:"users"`
	Total       int           `json:"total"`
	Page        int           `json:"page"`
	Limit       int           `json:"limit"`
	ID          uuid.UUID     `json:"id"`
	FirstName   string        `json:"first_name"`
	LastName    string        `json:"last_name"`
	DisplayName *string       `json:"display_name,omitempty"`
	Email       *string       `json:"email,omitempty"`
	PhoneNumber string        `json:"phone_number"`
	Status      string        `json:"status"`
	Role        *RoleInfo     `json:"role,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

// tygo:emit
// CreateRoleRequest represents a role creation request
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// tygo:emit
// UpdateRoleRequest represents a role update request
type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"isActive"`
}

// tygo:emit
// AssignRoleRequest represents a role assignment request
type AssignRoleRequest struct {
	UserID uint `json:"userId" binding:"required"`
	RoleID uint `json:"roleId" binding:"required"`
}

// tygo:emit
// CreatePermissionRequest represents a permission creation request
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Resource    string `json:"resource" binding:"required"`
	Action      string `json:"action" binding:"required"`
}

// tygo:emit
// UpdatePermissionRequest represents a permission update request
type UpdatePermissionRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	IsActive    *bool  `json:"isActive"`
}

// tygo:emit
// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// tygo:emit
// RefreshTokenResponse represents a token refresh response
type RefreshTokenResponse struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

// tygo:emit
// RegisterResponse represents a user registration response
type RegisterResponse struct {
	UserID  uuid.UUID `json:"userId"`
	Message string    `json:"message"`
}

// tygo:emit
// TokenValidationResponse represents a token validation response
type TokenValidationResponse struct {
	Valid  bool        `json:"valid"`
	UserID uuid.UUID   `json:"userId"`
	Email  string      `json:"email"`
	Role   string      `json:"role"`
	Claims interface{} `json:"claims,omitempty"`
}

// tygo:emit
// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// tygo:emit
// SuccessResponse represents a success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// tygo:emit
// TokenPair represents an access and refresh token pair
type TokenPair struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

// tygo:emit
// ForgotPasswordRequest represents a forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// tygo:emit
// ResetPasswordRequest represents a reset password request
type ResetPasswordRequest struct {
	ResetToken      string `json:"resetToken" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=NewPassword"`
}

// tygo:emit
// RoleResponse represents a role response
type RoleResponse struct {
	RoleID   uuid.UUID `json:"role_id"`
	Name     string    `json:"name"`
	IsActive bool      `json:"is_active"`
}
type EmailRequest struct {
	To       string
	Subject  string
	Template string
	Data     map[string]interface{}
}

// tygo:emit
// CollageResponse represents a collage response

type UserListFilters struct {
	Role    string `form:"role" json:"role"`
	Status  string `form:"status" json:"status"`
	College string `form:"college" json:"college"`
	Search  string `form:"search" json:"search"`
}

// PaginationOptions represents pagination parameters
type PaginationOptions struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	SortField string `json:"sort_field,omitempty"`
	SortOrder string `json:"sort_order,omitempty"`
}

// UserListResponse represents a user in the list response

// RoleInfo represents role information in user response
type RoleInfo struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Code string    `json:"code"`
}

// CollegeInfo represents college information in user response

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success    bool                   `json:"success"`
	Data       interface{}            `json:"data"`
	Message    string                 `json:"message"`
	Pagination PaginationMeta         `json:"pagination"`
	Filters    map[string]interface{} `json:"filters,omitempty"` // Added to show applied filters
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	CurrentPage  int   `json:"current_page"`
	TotalPages   int   `json:"total_pages"`
	TotalItems   int64 `json:"total_items"`
	ItemsPerPage int   `json:"items_per_page"`
	HasNext      bool  `json:"has_next"`
	HasPrevious  bool  `json:"has_previous"`
}

// UserListResult represents the result from use case
type UserListResult struct {
	Users      []*entity.User `json:"users"`
	Pagination PaginationMeta `json:"pagination"`
}
type UpdateProfileRequest struct {
	Language    string          `json:"language,omitempty"`
	Avatar      *string         `json:"avatar,omitempty"`
	DateOfBirth *time.Time      `json:"dateOfBirth,omitempty"`
	Gender      *string         `json:"gender,omitempty"`
	Address     *AddressRequest `json:"address,omitempty"`
	ContactInfo *ContactRequest `json:"contactInfo,omitempty"`
}
type MedicineRequest struct {
	SearchQuery string `json:"searchQuery"`
}
type DoctorRequest struct {
	Query string `json:"query"`
}
type RemoveFromCartRequest struct {
	MedicineID uuid.UUID `json:"medicine_id" binding:"required"`
}
