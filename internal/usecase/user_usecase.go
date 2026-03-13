package usecase

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/domain/service"
	"github.com/skryfon/collex/internal/types"
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
	GetRoleByID(ctx context.Context, id uuid.UUID) ([]*entity.Role, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
	CreateDoctor(ctx context.Context, doctor *entity.Doctor) (*entity.Doctor, error)
	CreatePharmacy(ctx context.Context, pharmacy *entity.Pharmacy) (*entity.Pharmacy, error)
	UpdateDoctor(ctx context.Context, doctor *entity.Doctor) (*entity.Doctor, error)
	UpdatePharmacy(ctx context.Context, pharmacy *entity.Pharmacy) (*entity.Pharmacy, error)
	GetActivePharmacies(ctx context.Context) ([]*entity.Pharmacy, error)
	GetPharmacyDetails(ctx context.Context, id uuid.UUID) (*entity.Pharmacy, error)
	GetDashboardStats(ctx context.Context) (*types.DashboardStatsResponse, error)
	ToggleFreeMedicineStatus(ctx context.Context, pharmacyID uuid.UUID, enabled bool) error
	VerifyDoctorIdentity(ctx context.Context, userID uuid.UUID) (*types.VerificationResult, error)
	// in your usecase interface definition
	GetNMCDoctorDetails(doctorID int, regno string) (*NMCDoctorDetails, error)
	UpdateDoctorVerificationStatus(ctx context.Context, userID uuid.UUID, isVerified bool) error
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
	if user.RoleID == "" {
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
	if status != "active" && status != "inactive" {
		return &errors.DomainError{
			Code:    "INVALID_STATUS",
			Message: "Status must be either 'active' or 'inactive'",
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
	case "inactive":
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
	if user.FirstName != "" && user.FirstName != existingUser.FirstName {
		existingUser.FirstName = user.FirstName
		profileUpdated = true
	}
	if user.LastName != "" && user.LastName != existingUser.LastName {
		existingUser.LastName = user.LastName
		profileUpdated = true
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

	if user.PhoneNumber != "" {
		if existingUser.PhoneNumber == "" || user.PhoneNumber != existingUser.PhoneNumber {
			existingUser.PhoneNumber = user.PhoneNumber
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
			if user.Address.Latitude != existingUser.Address.Latitude {
				existingUser.Address.Latitude = user.Address.Latitude
				addressUpdated = true
			}
			if user.Address.Longitude != existingUser.Address.Longitude {
				existingUser.Address.Longitude = user.Address.Longitude
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
func (u *userUseCase) GetRoleByID(ctx context.Context, id uuid.UUID) ([]*entity.Role, error) {
	roles, err := u.userRepo.GetRoleByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 {
		return nil, &errors.DomainError{
			Code:    "ROLE_NOT_FOUND",
			Message: "Role not found",
		}
	}
	return roles, nil
}
func (u *userUseCase) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return u.userRepo.DeleteUser(ctx, id)
}
func (u *userUseCase) CreateDoctor(ctx context.Context, user *entity.Doctor) (*entity.Doctor, error) {
	return u.userRepo.CreateDoctor(ctx, user)
}

func (u *userUseCase) CreatePharmacy(ctx context.Context, pharmacy *entity.Pharmacy) (*entity.Pharmacy, error) {
	return u.userRepo.CreatePharmacy(ctx, pharmacy)
}

func (u *userUseCase) UpdateDoctor(ctx context.Context, doctor *entity.Doctor) (*entity.Doctor, error) {
	if doctor == nil {
		return nil, &errors.DomainError{
			Code:    "DOCTOR_VALIDATION_ERROR",
			Message: "Doctor data cannot be empty",
		}
	}
	return u.userRepo.UpdateDoctor(ctx, doctor)
}

func (u *userUseCase) UpdatePharmacy(ctx context.Context, pharmacy *entity.Pharmacy) (*entity.Pharmacy, error) {
	if pharmacy == nil {
		return nil, &errors.DomainError{
			Code:    "PHARMACY_VALIDATION_ERROR",
			Message: "Pharmacy data cannot be empty",
		}
	}
	return u.userRepo.UpdatePharmacy(ctx, pharmacy)
}

func (h *userUseCase) GetDashboardStats(ctx context.Context) (*types.DashboardStatsResponse, error) {
	activeDoctors, err := h.userRepo.CountActiveDoctors(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count active doctors: %w", err)
	}

	inactiveDoctors, err := h.userRepo.CountInactiveDoctors(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count inactive doctors: %w", err)
	}

	activePharmacies, err := h.userRepo.CountActivePharmacies(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count active pharmacies: %w", err)
	}

	inactivePharmacies, err := h.userRepo.CountInactivePharmacies(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count inactive pharmacies: %w", err)
	}

	totalUsers, err := h.userRepo.CountTotalUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}

	stats := &types.DashboardStatsResponse{
		ActiveDoctors:      activeDoctors,
		InactiveDoctors:    inactiveDoctors,
		ActivePharmacies:   activePharmacies,
		InactivePharmacies: inactivePharmacies,
		TotalUsers:         totalUsers,
	}

	return stats, nil
}

func (u *userUseCase) ToggleFreeMedicineStatus(ctx context.Context, pharmacyID uuid.UUID, enabled bool) error {
	return u.userRepo.UpdatePharmacyFreeMedicineStatus(ctx, pharmacyID, enabled)
}

func (u *userUseCase) GetActivePharmacies(ctx context.Context) ([]*entity.Pharmacy, error) {
	return u.userRepo.GetActivePharmacies(ctx)
}

func (u *userUseCase) GetPharmacyDetails(ctx context.Context, id uuid.UUID) (*entity.Pharmacy, error) {
	return u.userRepo.GetPharmacyWithMedicines(ctx, id)
}
func (u *userUseCase) VerifyDoctorIdentity(ctx context.Context, userID uuid.UUID) (*types.VerificationResult, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	if user.Doctor == nil {
		return nil, fmt.Errorf("doctor profile not found for user")
	}

	localData := types.RegistryData{
		Name:                strings.TrimSpace(user.FirstName + " " + user.LastName),
		RegistrationNumber:  strings.TrimSpace(user.Doctor.LicenseNumber),
		StateMedicalCouncil: strings.TrimSpace(user.Doctor.StateMedicalCouncil),
		YearOfPassing:       user.Doctor.YearOfPassing,
	}

	registryData, nmcDoctorID, err := u.scrapeNMCRegistry(
		localData.RegistrationNumber,
		localData.Name,
		localData.StateMedicalCouncil,
		localData.YearOfPassing,
	)
	if err != nil {
		return &types.VerificationResult{
			MatchStatus:  "PENDING_MANUAL_REVIEW",
			LocalData:    localData,
			RegistryData: types.RegistryData{},
			Reason:       err.Error(),
		}, nil
	}

	regMatch := strings.EqualFold(
		strings.TrimSpace(registryData.RegistrationNumber),
		strings.TrimSpace(localData.RegistrationNumber),
	)
	nameMatch := strings.EqualFold(
		strings.TrimSpace(registryData.Name),
		strings.TrimSpace(localData.Name),
	)
	councilMatch := strings.EqualFold(
		strings.TrimSpace(registryData.StateMedicalCouncil),
		strings.TrimSpace(localData.StateMedicalCouncil),
	)

	matchStatus := "MATCHED"
	if !regMatch || !nameMatch || !councilMatch {
		matchStatus = "MISMATCH"
	}

	return &types.VerificationResult{
		MatchStatus:  matchStatus,
		RegistryData: registryData,
		LocalData:    localData,
		NMCDoctorID:  nmcDoctorID,
	}, nil
}

type nmcPaginatedResponse struct {
	RecordsTotal    int             `json:"recordsTotal"`
	RecordsFiltered int             `json:"recordsFiltered"`
	Draw            string          `json:"draw"`
	Data            [][]interface{} `json:"data"`
}

func (u *userUseCase) scrapeNMCRegistry(regNo, name, council string, year int) (types.RegistryData, int, error) {
	smcID := getNMCSmcID(council)

	params := url.Values{}
	params.Set("service", "getPaginatedDoctor")
	params.Set("draw", "1")
	for i := 0; i < 7; i++ {
		idx := strconv.Itoa(i)
		params.Set("columns["+idx+"][data]", idx)
		params.Set("columns["+idx+"][name]", "")
		params.Set("columns["+idx+"][searchable]", "true")
		params.Set("columns["+idx+"][orderable]", "true")
		params.Set("columns["+idx+"][search][value]", "")
		params.Set("columns["+idx+"][search][regex]", "false")
	}
	params.Set("order[0][column]", "0")
	params.Set("order[0][dir]", "asc")
	params.Set("start", "0")
	params.Set("length", "500")
	params.Set("search[value]", "")
	params.Set("search[regex]", "false")
	params.Set("name", name)
	params.Set("registrationNo", regNo)
	params.Set("smcId", smcID)
	params.Set("year", strconv.Itoa(year))
	params.Set("_", strconv.FormatInt(time.Now().UnixMilli(), 10))

	apiURL := "https://www.nmc.org.in/MCIRest/open/getPaginatedData?" + params.Encode()

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
	}
	client := &http.Client{
		Timeout:   15 * time.Second,
		Transport: transport,
	}

	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return types.RegistryData{}, 0, fmt.Errorf("failed to build NMC request: %w", err)
	}
	req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("Referer", "https://www.nmc.org.in/information-desk/indian-medical-register/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return types.RegistryData{}, 0, fmt.Errorf("NMC registry unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return types.RegistryData{}, 0, fmt.Errorf("NMC registry returned status %d", resp.StatusCode)
	}

	var nmcResp nmcPaginatedResponse
	if err := json.NewDecoder(resp.Body).Decode(&nmcResp); err != nil {
		return types.RegistryData{}, 0, fmt.Errorf("failed to decode NMC response: %w", err)
	}

	if nmcResp.RecordsFiltered == 0 || len(nmcResp.Data) == 0 {
		return types.RegistryData{}, 0, fmt.Errorf("no doctor found in NMC registry for registration number: %s", regNo)
	}

	row := nmcResp.Data[0]
	if len(row) < 6 {
		return types.RegistryData{}, 0, fmt.Errorf("unexpected NMC response format: only %d columns", len(row))
	}

	yearOfPassing, _ := strconv.Atoi(fmt.Sprintf("%v", row[1]))

	nmcDoctorID := 0
	if len(row) >= 7 {
		nmcDoctorID = extractDoctorID(fmt.Sprintf("%v", row[6]))
	}

	return types.RegistryData{
		Name:                strings.TrimSpace(fmt.Sprintf("%v", row[4])),
		RegistrationNumber:  strings.TrimSpace(fmt.Sprintf("%v", row[2])),
		StateMedicalCouncil: strings.TrimSpace(fmt.Sprintf("%v", row[3])),
		YearOfPassing:       yearOfPassing,
	}, nmcDoctorID, nil
}

func getNMCSmcID(council string) string {
	councilMap := map[string]string{
		"Andhra Pradesh Medical Council":    "1",
		"Arunachal Pradesh Medical Council": "2",
		"Assam Medical Council":             "3",
		"Bihar Medical Council":             "4",
		"Chhattisgarh Medical Council":      "5",
		"Delhi Medical Council":             "6",
		"Goa Medical Council":               "7",
		"Gujarat Medical Council":           "8",
		"Haryana Medical Council":           "9",
		"Himachal Pradesh Medical Council":  "10",
		"Jammu & Kashmir Medical Council":   "11",
		"Jharkhand Medical Council":         "12",
		"Karnataka Medical Council":         "13",
		"Kerala Medical Council":            "14",
		"Madhya Pradesh Medical Council":    "15",
		"Maharashtra Medical Council":       "16",
		"Manipur Medical Council":           "17",
		"Meghalaya Medical Council":         "18",
		"Mizoram Medical Council":           "19",
		"Nagaland Medical Council":          "20",
		"Odisha Medical Council":            "21",
		"Punjab Medical Council":            "22",
		"Rajasthan Medical Council":         "23",
		"Sikkim Medical Council":            "24",
		"Tamil Nadu Medical Council":        "25",
		"Telangana State Medical Council":   "26",
		"Tripura Medical Council":           "27",
		"Uttar Pradesh Medical Council":     "28",
		"Uttarakhand Medical Council":       "29",
		"West Bengal Medical Council":       "30",
		"Travancore Cochin Medical Council": "31",
		"Vidarbha Medical Council":          "32",
	}

	normalized := strings.TrimSpace(council)
	for key, id := range councilMap {
		if strings.EqualFold(key, normalized) {
			return id
		}
	}
	return ""
}

type NMCDoctorDetails struct {
	DoctorID      int     `json:"doctorId"`
	FirstName     string  `json:"firstName"`
	MiddleName    *string `json:"middleName"`
	LastName      *string `json:"lastName"`
	ParentName    string  `json:"parentName"`
	BirthDateStr  string  `json:"birthDateStr"`
	Degree        string  `json:"doctorDegree"`
	University    string  `json:"university"`
	YearOfPassing string  `json:"yearOfPassing"`
	RegNo         string  `json:"registrationNo"`
	RegDate       string  `json:"regDate"`
	SmcName       string  `json:"smcName"`
	Address       string  `json:"address"`
	YearInfo      int     `json:"yearInfo"`
	UprnNo        *string `json:"uprnNo"`
	RemovedStatus bool    `json:"removedStatus"`
}

func (u *userUseCase) GetNMCDoctorDetails(doctorID int, regNo string) (*NMCDoctorDetails, error) {
	const apiURL = "https://www.nmc.org.in/MCIRest/open/getDataFromService?service=getDoctorDetailsByIdImrExt"

	payload := map[string]interface{}{
		"doctorId":    strconv.Itoa(doctorID),
		"regdNoValue": regNo,
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
	}
	client := &http.Client{
		Timeout:   15 * time.Second,
		Transport: transport,
	}

	req, err := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("Referer", "https://www.nmc.org.in/information-desk/indian-medical-register/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Origin", "https://www.nmc.org.in")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("NMC registry unreachable: %w", err)
	}
	defer resp.Body.Close()

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NMC returned status %d", resp.StatusCode)
	}

	bodyStr := strings.TrimSpace(string(rawBody))
	if bodyStr == "error" || strings.HasPrefix(bodyStr, "<") {
		return nil, fmt.Errorf("NMC returned error response for doctorId %d", doctorID)
	}

	var details NMCDoctorDetails
	if err := json.Unmarshal(rawBody, &details); err != nil {
		return nil, fmt.Errorf("failed to decode NMC details: %w", err)
	}

	return &details, nil
}

func extractDoctorID(actionHTML string) int {
	start := strings.Index(actionHTML, "openDoctorDetailsnew('")
	if start == -1 {
		return 0
	}
	start += len("openDoctorDetailsnew('")
	end := strings.Index(actionHTML[start:], "'")
	if end == -1 {
		return 0
	}
	id, _ := strconv.Atoi(actionHTML[start : start+end])
	return id
}

func (u *userUseCase) UpdateDoctorVerificationStatus(ctx context.Context, userID uuid.UUID, isVerified bool) error {
	doctor := &entity.Doctor{
		UserID:     userID,
		IsVerified: &isVerified,
	}
	_, err := u.userRepo.UpdateDoctor(ctx, doctor)
	return err
}
