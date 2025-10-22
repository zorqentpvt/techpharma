package http

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
	"golang.org/x/crypto/bcrypt"
)

// UserHandlerClean handles HTTP requests for user operations
type UserHandlerClean struct {
	userUseCase usecase.UserUseCase
}

// NewUserHandlerClean creates a new instance of UserHandlerClean
func NewUserHandlerClean(userUseCase usecase.UserUseCase) *UserHandlerClean {
	return &UserHandlerClean{
		userUseCase: userUseCase,
	}
}

// CreateUser handles POST /users
func (h *UserHandlerClean) CreateUser(c *gin.Context) {
	var req types.CreateUserRequest

	// Bind and validate JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Request body validation failed",
			Details: err.Error(),
		})
		return
	}

	// Validate password match
	if req.Password != req.CPassword {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Passwords do not match",
		})
		return
	}

	// Validate RoleID is not empty
	if req.RoleID == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Role ID is required",
		})
		return
	}

	// Normalize role name (case-insensitive)
	roleName := strings.ToLower(strings.TrimSpace(req.RoleID))

	// Validate role exists
	validRoles := map[string]bool{
		"normal":   true,
		"doctor":   true,
		"pharmacy": true,
	}

	if !validRoles[roleName] {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Invalid role. Must be one of: patient, doctor, pharmacy",
		})
		return
	}

	// Create context once
	ctx := context.WithValue(c.Request.Context(), "userID", c.GetString("userID"))

	// Validate role-specific required fields
	if err := h.validateRoleSpecificFields(&req, roleName); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Parse date of birth
	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Invalid date of birth format (use YYYY-MM-DD)",
		})
		return
	}

	// Hash password
	hashedPassword, err := h.hashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to process password",
			Message: "Password hashing failed",
		})
		return
	}

	// Create base user entity
	user := &entity.User{
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Email:           &req.Email,
		PhoneNumber:     req.PhoneNumber,
		Password:        hashedPassword,
		DateOfBirth:     &dob,
		Gender:          &req.Gender,
		RoleID:          req.RoleID, // Now stores the string directly
		IsEmailVerified: true,
		IsPhoneVerified: true,
		Status:          "active",
		Language:        "en",
		FirstTimeLogin:  true,
		IsActive:        true,
	}

	// Create user in database
	createdUser, err := h.userUseCase.CreateUser(ctx, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to create user",
			Message: err.Error(),
		})
		return
	}

	// Handle role-specific creation based on role name
	switch roleName {
	case "doctor":
		if err := h.createDoctor(ctx, createdUser.ID, &req); err != nil {
			// Rollback user creation if doctor creation fails
			h.userUseCase.DeleteUser(ctx, createdUser.ID)
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Failed to create doctor profile",
				Message: err.Error(),
			})
			return
		}

	case "pharmacy":
		if err := h.createPharmacy(ctx, createdUser.ID, &req); err != nil {
			// Rollback user creation if pharmacy creation fails
			h.userUseCase.DeleteUser(ctx, createdUser.ID)
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Failed to create pharmacy profile",
				Message: err.Error(),
			})
			return
		}

	case "normal":
		// No additional profile creation needed for patients
		// Add patient-specific logic here if needed in the future
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    createdUser.ID,
		Message: "User created successfully",
	})
}

// validateRoleSpecificFields validates required fields based on user role
func (h *UserHandlerClean) validateRoleSpecificFields(req *types.CreateUserRequest, roleName string) error {
	switch roleName {
	case "doctor":
		if req.SpecializationID == "" {
			return fmt.Errorf("specialization ID is required for doctors")
		}
		if req.LicenseNumber == "" {
			return fmt.Errorf("license number is required for doctors")
		}
		if req.Qualification == "" {
			return fmt.Errorf("qualification is required for doctors")
		}

	case "pharmacy":
		if req.PharmacyName == "" {
			return fmt.Errorf("pharmacy name is required")
		}
		if req.PharmacyAddress == "" {
			return fmt.Errorf("pharmacy address is required")
		}
		if req.LicenseNumber == "" {
			return fmt.Errorf("pharmacy license number is required")
		}

	case "patient":
		// No additional required fields for patients
		// Add patient-specific validation here if needed
	}

	return nil
}

// createDoctor creates a doctor profile linked to the user
func (h *UserHandlerClean) createDoctor(ctx context.Context, userID uuid.UUID, req *types.CreateUserRequest) error {
	// Parse specialization UUID

	doctor := &entity.Doctor{
		UserID:           userID,
		SpecializationID: req.SpecializationID,
		LicenseNumber:    req.LicenseNumber,
		Experience:       0, // Default, can be added to form
		ConsultationFee:  0, // Default, can be added to form
		IsActive:         true,
	}

	_, err := h.userUseCase.CreateDoctor(ctx, doctor)
	if err != nil {
		return fmt.Errorf("failed to create doctor profile: %w", err)
	}

	return nil
}

// createPharmacy creates a pharmacy profile
func (h *UserHandlerClean) createPharmacy(ctx context.Context, userID uuid.UUID, req *types.CreateUserRequest) error {
	pharmacy := &entity.Pharmacy{
		UserID:        userID,
		Name:          req.PharmacyName,
		LicenseNumber: req.LicenseNumber,
		Email:         &req.Email,
		PhoneNumber:   req.PharmacyPhone,
		Address:       req.PharmacyAddress,
		IsActive:      true,
	}

	_, err := h.userUseCase.CreatePharmacy(ctx, pharmacy)
	if err != nil {
		return fmt.Errorf("failed to create pharmacy profile: %w", err)
	}

	return nil
}

// hashPassword hashes the password using bcrypt
func (h *UserHandlerClean) hashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}
func (h *UserHandlerClean) FetchRoles(c *gin.Context) {
	roles, err := h.userUseCase.GetAllRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to fetch roles",
			Message: "Could not retrieve roles",
			Details: err.Error(),
		})
		return
	}

	// Convert to response format
	var roleResponses []types.RoleResponse
	for _, role := range roles {
		roleResponses = append(roleResponses, types.RoleResponse{
			RoleID:   role.ID,
			Name:     role.Name,
			IsActive: role.IsActive,
		})
	}

	// Return success even if empty array
	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    roleResponses,
		Message: "Roles fetched successfully",
	})
}

// Use Case - doesn't treat empty results as error
// UpdateUser handles PUT /users/:id
func (h *UserHandlerClean) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "User ID is required",
		})
		return
	}

	// ISSUE 1 FIX: Parse UUID properly
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Invalid user ID format",
			Details: err.Error(),
		})
		return
	}

	var req types.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Request body validation failed",
			Details: err.Error(),
		})
		return
	}
	ctx := context.WithValue(c.Request.Context(), "userID", c.GetString("userID"))
	// Prepare user entity for update
	user := &entity.User{
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		PhoneNumber: req.PhoneNumber,
		Status:      req.Status,
	}
	// Handle optional email
	if req.Email != nil {
		user.Email = req.Email
	}

	// Handle optional user role update
	if req.RoleID != "" {
		user.RoleID = req.RoleID
	}

	// ISSUE 3 FIX: Pass UUID instead of string
	updatedUser, err := h.userUseCase.UpdateUser(ctx, userID, user)
	if err != nil {
		// Handle specific error types
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Error:   "User not found",
				Message: "The specified user does not exist",
				Details: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to update user",
			Message: "User update failed",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    updatedUser,
		Message: "User updated successfully",
	})
}

func (h *UserHandlerClean) UpdateUserStatus(c *gin.Context) {
	userIDStr := c.Param("id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "User ID is required",
		})
		return
	}

	// Parse UUID properly
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Invalid user ID format",
			Details: err.Error(),
		})
		return
	}

	var req types.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Request body validation failed",
			Details: err.Error(),
		})
		return
	}

	if req.Status == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Status is required",
		})
		return
	}

	// Call use case to update user status
	ctx := context.WithValue(c.Request.Context(), "userID", c.GetString("userID"))
	err = h.userUseCase.UpdateUserStatus(ctx, userID, req.Status)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Error:   "User not found",
				Message: "The specified user does not exist",
				Details: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to update user status",
			Message: "User status update failed",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, types.UpdateUserResponse{
		UserID:  userID,
		Message: "User status updated successfully",
	})
}

func (h *UserHandlerClean) ListUsers(c *gin.Context) {
	// Parse pagination parameters
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	// Parse filter parameters
	roleFilter := c.Query("role")
	statusFilter := c.Query("status")
	collegeFilter := c.Query("college")
	searchQuery := c.Query("search")
	sortParam := c.DefaultQuery("sort", "created_at_desc") // Default sort by creation date descending

	// Convert string parameters to integers
	pageInt, err := strconv.Atoi(page)
	if err != nil || pageInt < 1 {
		pageInt = 1
	}

	limitInt, err := strconv.Atoi(limit)
	if err != nil || limitInt < 1 {
		limitInt = 10
	}

	// Enforce maximum limit to prevent abuse
	if limitInt > 100 {
		limitInt = 100
	}

	// Parse and validate sort parameter
	sortField, sortOrder := parseSortParam(sortParam)

	// Create filter options
	filters := types.UserListFilters{
		Role:    roleFilter,
		Status:  statusFilter,
		College: collegeFilter,
		Search:  searchQuery,
	}

	// Create pagination options with sorting
	pagination := types.PaginationOptions{
		Page:      pageInt,
		Limit:     limitInt,
		SortField: sortField,
		SortOrder: sortOrder,
	}

	// Call use case
	result, err := h.userUseCase.ListUsers(c.Request.Context(), filters, pagination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to fetch users",
			Message: "Could not retrieve users",
			Details: err.Error(),
		})
		return
	}

	// Convert users to response format
	var userResponses []types.UserListResponse
	for _, user := range result.Users {
		userResponse := types.UserListResponse{
			ID:          user.ID,
			FirstName:   user.FirstName,
			LastName:    user.LastName,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			PhoneNumber: user.PhoneNumber,
			Status:      user.Status,
			CreatedAt:   user.CreatedAt,
			UpdatedAt:   user.UpdatedAt,
		}

		// Add role information if available

		// Add college information if available

		userResponses = append(userResponses, userResponse)
	}

	// Return paginated response
	c.JSON(http.StatusOK, types.PaginatedResponse{
		Success: true,
		Data:    userResponses,
		Message: "Users fetched successfully",
		Pagination: types.PaginationMeta{
			CurrentPage:  result.Pagination.CurrentPage,
			TotalPages:   result.Pagination.TotalPages,
			TotalItems:   result.Pagination.TotalItems,
			ItemsPerPage: result.Pagination.ItemsPerPage,
			HasNext:      result.Pagination.HasNext,
			HasPrevious:  result.Pagination.HasPrevious,
		},
		Filters: map[string]interface{}{
			"role":    roleFilter,
			"status":  statusFilter,
			"college": collegeFilter,
			"search":  searchQuery,
			"sort":    sortParam,
		},
	})
}

// Helper function to parse sort parameter
func parseSortParam(sortParam string) (string, string) {
	// Valid sort fields mapping
	validSortFields := map[string]string{
		"name_asc":        "first_name",
		"created_at_asc":  "created_at",
		"created_at_desc": "created_at",
		"updated_at_asc":  "updated_at",
		"updated_at_desc": "updated_at",
		"status_asc":      "status",
		"status_desc":     "status",
	}

	field, exists := validSortFields[sortParam]
	if !exists {
		// Default to created_at desc if invalid sort parameter
		return "created_at", "DESC"
	}

	// Determine sort order
	order := "ASC"
	if strings.HasSuffix(sortParam, "_desc") {
		order = "DESC"
	}

	return field, order
}

func (h *UserHandlerClean) UserProfile(c *gin.Context) {
	userIDStr := c.Param("id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "User ID is required",
		})
		return
	}

	// Parse UUID properly
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Invalid user ID format",
			Details: err.Error(),
		})
		return
	}

	// Get user profile from use case
	user, err := h.userUseCase.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		// Handle specific error types
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Error:   "User not found",
				Message: "The specified user does not exist",
				Details: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to fetch user profile",
			Message: "Could not retrieve user profile",
			Details: err.Error(),
		})
		return
	}

	// Convert user entity to profile response format matching the required structure
	profileResponse := map[string]interface{}{
		"firstName":       user.FirstName,
		"lastName":        user.LastName,
		"email":           getStringValue(user.Email),
		"isEmailVerified": user.IsEmailVerified,
		"phoneNumber":     user.PhoneNumber,
		"isPhoneVerified": user.IsPhoneVerified,
		"status":          user.Status,
		"language":        user.Language,
		"image":           getStringValue(user.Avatar),
		"createdAt":       user.CreatedAt.Format("2006-01-02"),
		"lastLoginAt":     formatLastLogin(user.LastLoginAt),
		"isActive":        user.IsActive,
	}

	// Add role name if available

	// Add college name if available

	// Add address information from embedded GeoLocation
	if user.Address.Address != "" {
		profileResponse["address"] = map[string]interface{}{
			"address":    user.Address.Address,
			"city":       user.Address.City,
			"state":      user.Address.State,
			"country":    user.Address.Country,
			"postalCode": user.Address.PostalCode,
		}
	} else {
		profileResponse["address"] = map[string]interface{}{
			"address":    "",
			"city":       "",
			"state":      "",
			"country":    "",
			"postalCode": "",
		}
	}

	// Add contact information from embedded ContactInfo
	profileResponse["contactInfo"] = map[string]interface{}{
		"primaryPhone":    user.ContactInfo.PrimaryPhone,
		"secondaryPhone":  getSecondaryPhone(user),
		"email":           getStringValue(user.ContactInfo.Email),
		"isEmailVerified": user.IsEmailVerified,
		"isPhoneVerified": user.IsPhoneVerified,
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    profileResponse,
		Message: "profile fetched successfully",
	})
}

// Helper functions for UserProfile
func getStringValue(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}

func formatLastLogin(lastLogin *time.Time) string {
	if lastLogin == nil {
		return ""
	}
	return lastLogin.Format("2006-01-02T15:04:05Z")
}

func getSecondaryPhone(user *entity.User) string {
	// Get secondary phone from embedded ContactInfo
	return getStringValue(user.ContactInfo.SecondaryPhone)
}

// GetUserProfile handles getting the current authenticated user's profile
// GET /api/user/profile
func (h *UserHandlerClean) GetUserProfile(c *gin.Context) {
	// Extract user ID from JWT token (set by JWT middleware)
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	// Parse UUID properly
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "Failed to parse user ID from token",
			Details: err.Error(),
		})
		return
	}

	// Get user profile from use case
	user, err := h.userUseCase.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		// Handle specific error types
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Error:   "User not found",
				Message: "The authenticated user no longer exists",
				Details: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to fetch user profile",
			Message: "Could not retrieve user profile",
			Details: err.Error(),
		})
		return
	}

	// Convert user entity to profile response format matching the required structure
	profileResponse := map[string]interface{}{
		"id":              user.ID,
		"firstName":       user.FirstName,
		"lastName":        user.LastName,
		"displayName":     user.DisplayName,
		"email":           getStringValue(user.Email),
		"isEmailVerified": user.IsEmailVerified,
		"phoneNumber":     user.PhoneNumber,
		"isPhoneVerified": user.IsPhoneVerified,
		"status":          user.Status,
		"language":        user.Language,
		"image":           getStringValue(user.Avatar),
		"createdAt":       user.CreatedAt.Format("2006-01-02"),
		"updatedAt":       user.UpdatedAt.Format("2006-01-02"),
		"lastLoginAt":     formatLastLogin(user.LastLoginAt),
		"isActive":        user.IsActive,
		"firstTimeLogin":  user.FirstTimeLogin,
	}

	// Add role information if available

	// Add college information if available

	// Add address information from embedded GeoLocation
	if user.Address.Address != "" {
		profileResponse["address"] = map[string]interface{}{
			"address":    user.Address.Address,
			"city":       user.Address.City,
			"state":      user.Address.State,
			"country":    user.Address.Country,
			"postalCode": user.Address.PostalCode,
		}
	} else {
		profileResponse["address"] = map[string]interface{}{
			"address":    "",
			"city":       "",
			"state":      "",
			"country":    "",
			"postalCode": "",
		}
	}

	// Add contact information from embedded ContactInfo
	profileResponse["contactInfo"] = map[string]interface{}{
		"primaryPhone":    user.ContactInfo.PrimaryPhone,
		"secondaryPhone":  getSecondaryPhone(user),
		"email":           getStringValue(user.ContactInfo.Email),
		"isEmailVerified": user.IsEmailVerified,
		"isPhoneVerified": user.IsPhoneVerified,
	}

	// Add additional profile fields if they exist
	if user.DateOfBirth != nil {
		profileResponse["dateOfBirth"] = user.DateOfBirth.Format("2006-01-02")
	} else {
		profileResponse["dateOfBirth"] = ""
	}

	if user.Gender != nil {
		profileResponse["gender"] = *user.Gender
	} else {
		profileResponse["gender"] = ""
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    profileResponse,
		Message: "User profile fetched successfully",
	})
}
func (h *UserHandlerClean) UpdateUserProfile(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not authenticated",
		})
		return
	}

	// Parse UUID properly
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "Failed to parse user ID from token",
			Details: err.Error(),
		})
		return
	}

	var req types.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Message: "Request body validation failed",
			Details: err.Error(),
		})
		return
	}

	ctx := context.WithValue(c.Request.Context(), "userID", userIDStr)

	// Prepare user entity for profile update (excluding restricted fields)
	user := &entity.User{}

	// Updatable fields

	if req.Language != "" {
		user.Language = req.Language
	}

	if req.Avatar != nil {
		user.Avatar = req.Avatar
	}

	if req.DateOfBirth != nil {
		user.DateOfBirth = req.DateOfBirth
	}

	if req.Gender != nil {
		user.Gender = req.Gender
	}

	// Update address information if provided
	if req.Address != nil {
		user.Address = entity.GeoLocation{
			Address:    req.Address.Address,
			City:       req.Address.City,
			State:      req.Address.State,
			Country:    req.Address.Country,
			PostalCode: req.Address.PostalCode,
		}
	}

	// Update contact information if provided (excluding primary email and phone which are restricted)
	if req.ContactInfo != nil {
		user.ContactInfo = entity.ContactInfo{
			SecondaryPhone: req.ContactInfo.SecondaryPhone,
			Email:          req.ContactInfo.Email,
			// Note: Primary phone and email are restricted and handled elsewhere
		}
	}

	// Call use case to update user profile
	updatedUser, err := h.userUseCase.UpdateUserProfile(ctx, userID, user)
	if err != nil {
		// Handle specific error types
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Error:   "User not found",
				Message: "The authenticated user no longer exists",
				Details: err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to update profile",
			Message: "Profile update failed",
			Details: err.Error(),
		})
		return
	}

	// Convert updated user to response format
	profileResponse := map[string]interface{}{
		"id":              updatedUser.ID,
		"firstName":       updatedUser.FirstName,
		"lastName":        updatedUser.LastName,
		"displayName":     updatedUser.DisplayName,
		"email":           getStringValue(updatedUser.Email),
		"isEmailVerified": updatedUser.IsEmailVerified,
		"phoneNumber":     updatedUser.PhoneNumber,
		"isPhoneVerified": updatedUser.IsPhoneVerified,
		"status":          updatedUser.Status,
		"language":        updatedUser.Language,
		"image":           getStringValue(updatedUser.Avatar),
		"createdAt":       updatedUser.CreatedAt.Format("2006-01-02"),
		"updatedAt":       updatedUser.UpdatedAt.Format("2006-01-02"),
		"lastLoginAt":     formatLastLogin(updatedUser.LastLoginAt),
		"isActive":        updatedUser.IsActive,
		"firstTimeLogin":  updatedUser.FirstTimeLogin,
	}

	// Add college information if available

	// Add address information
	if updatedUser.Address.Address != "" {
		profileResponse["address"] = map[string]interface{}{
			"address":    updatedUser.Address.Address,
			"city":       updatedUser.Address.City,
			"state":      updatedUser.Address.State,
			"country":    updatedUser.Address.Country,
			"postalCode": updatedUser.Address.PostalCode,
		}
	} else {
		profileResponse["address"] = map[string]interface{}{
			"address":    "",
			"city":       "",
			"state":      "",
			"country":    "",
			"postalCode": "",
		}
	}

	// Add contact information
	profileResponse["contactInfo"] = map[string]interface{}{
		"primaryPhone":    updatedUser.ContactInfo.PrimaryPhone,
		"secondaryPhone":  getSecondaryPhone(updatedUser),
		"email":           getStringValue(updatedUser.ContactInfo.Email),
		"isEmailVerified": updatedUser.IsEmailVerified,
		"isPhoneVerified": updatedUser.IsPhoneVerified,
	}

	// Add additional profile fields
	if updatedUser.DateOfBirth != nil {
		profileResponse["dateOfBirth"] = updatedUser.DateOfBirth.Format("2006-01-02")
	} else {
		profileResponse["dateOfBirth"] = ""
	}

	if updatedUser.Gender != nil {
		profileResponse["gender"] = *updatedUser.Gender
	} else {
		profileResponse["gender"] = ""
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    profileResponse,
		Message: "Profile updated successfully",
	})
}
