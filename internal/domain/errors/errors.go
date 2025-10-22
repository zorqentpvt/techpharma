package errors

import (
	"errors"
	"fmt"
)

// Custom error types for domain-specific errors
var (
	ErrNotFound         = errors.New("resource not found")
	ErrAlreadyExists    = errors.New("resource already exists")
	ErrInvalidInput     = errors.New("invalid input")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrForbidden        = errors.New("forbidden")
	ErrInternalServer   = errors.New("internal server error")
	ErrValidationFailed = errors.New("validation failed")

	// Appointment-specific errors
	ErrDoctorNotFound         = errors.New("doctor not found")
	ErrSlotNotAvailable       = errors.New("slot not available")
	ErrInvalidTimeSlot        = errors.New("invalid time slot")
	ErrInvalidAppointmentMode = errors.New("invalid appointment mode")
)

// DomainError represents a domain-specific error
type DomainError struct {
	Code    string
	Message string
	Err     error
}

func (e *DomainError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%s)", e.Code, e.Message, e.Err.Error())
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *DomainError) Unwrap() error {
	return e.Err
}

// NewDomainError creates a new domain error
func NewDomainError(code, message string, err error) *DomainError {
	return &DomainError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// IsNotFound checks if the error is a not found error
func IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound) || errors.Is(err, ErrDoctorNotFound)
}

// IsAlreadyExists checks if the error is an already exists error
func IsAlreadyExists(err error) bool {
	return errors.Is(err, ErrAlreadyExists) || errors.Is(err, ErrSlotNotAvailable)
}

// IsInvalidInput checks if the error is an invalid input error
func IsInvalidInput(err error) bool {
	return errors.Is(err, ErrInvalidInput) ||
		errors.Is(err, ErrInvalidTimeSlot) ||
		errors.Is(err, ErrInvalidAppointmentMode)
}

// IsUnauthorized checks if the error is an unauthorized error
func IsUnauthorized(err error) bool {
	return errors.Is(err, ErrUnauthorized)
}

// IsForbidden checks if the error is a forbidden error
func IsForbidden(err error) bool {
	return errors.Is(err, ErrForbidden)
}

// As is a wrapper around errors.As for convenience
func As(err error, target interface{}) bool {
	return errors.As(err, target)
}
