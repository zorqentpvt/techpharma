package validator

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/skryfon/collex/internal/domain/errors"
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("validation failed for field '%s': %s", e.Field, e.Message)
}

// Validator interface for validation operations
type Validator interface {
	Validate() []ValidationError
}

// UserValidator validates user input
type UserValidator struct {
	FirstName   string
	LastName    string
	PhoneNumber string
	Email       *string
	Password    string
	Role        string
}

func (v *UserValidator) Validate() []ValidationError {
	var errors []ValidationError

	// First name validation
	if strings.TrimSpace(v.FirstName) == "" {
		errors = append(errors, ValidationError{Field: "firstName", Message: "first name is required"})
	} else if len(v.FirstName) > 50 {
		errors = append(errors, ValidationError{Field: "firstName", Message: "first name must be less than 50 characters"})
	}

	// Last name validation
	if strings.TrimSpace(v.LastName) == "" {
		errors = append(errors, ValidationError{Field: "lastName", Message: "last name is required"})
	} else if len(v.LastName) > 50 {
		errors = append(errors, ValidationError{Field: "lastName", Message: "last name must be less than 50 characters"})
	}

	// Phone number validation
	if strings.TrimSpace(v.PhoneNumber) == "" {
		errors = append(errors, ValidationError{Field: "phoneNumber", Message: "phone number is required"})
	} else {
		phoneRegex := regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)
		if !phoneRegex.MatchString(v.PhoneNumber) {
			errors = append(errors, ValidationError{Field: "phoneNumber", Message: "invalid phone number format"})
		}
	}

	// Email validation (optional field)
	if v.Email != nil && *v.Email != "" {
		emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
		if !emailRegex.MatchString(*v.Email) {
			errors = append(errors, ValidationError{Field: "email", Message: "invalid email format"})
		}
	}

	// Password validation
	if strings.TrimSpace(v.Password) == "" {
		errors = append(errors, ValidationError{Field: "password", Message: "password is required"})
	} else if len(v.Password) < 8 {
		errors = append(errors, ValidationError{Field: "password", Message: "password must be at least 8 characters long"})
	}

	// Role validation
	if strings.TrimSpace(v.Role) == "" {
		errors = append(errors, ValidationError{Field: "role", Message: "role is required"})
	} else {
		validRoles := []string{"user", "admin", "moderator"}
		valid := false
		for _, role := range validRoles {
			if v.Role == role {
				valid = true
				break
			}
		}
		if !valid {
			errors = append(errors, ValidationError{Field: "role", Message: "invalid role. Must be one of: user, admin, moderator"})
		}
	}

	return errors
}

// ValidateUser validates user input and returns domain error if validation fails
func ValidateUser(firstName, lastName, phoneNumber, password, role string, email *string) error {
	validator := &UserValidator{
		FirstName:   firstName,
		LastName:    lastName,
		PhoneNumber: phoneNumber,
		Email:       email,
		Password:    password,
		Role:        role,
	}

	validationErrors := validator.Validate()
	if len(validationErrors) > 0 {
		return errors.NewDomainError("VALIDATION_ERROR", "user validation failed", fmt.Errorf("validation errors: %v", validationErrors))
	}

	return nil
}
