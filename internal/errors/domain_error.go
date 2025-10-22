package errors

// DomainError represents a domain-level error with a code and message.
type DomainError struct {
	Code    string
	Message string
	Err     error
}

// Error implements the error interface.
func (d *DomainError) Error() string {
	if d == nil {
		return ""
	}
	if d.Err != nil {
		return d.Message + ": " + d.Err.Error()
	}
	return d.Message
}

// Unwrap allows errors.Is / errors.As to inspect the wrapped error.
func (d *DomainError) Unwrap() error {
	if d == nil {
		return nil
	}
	return d.Err
}

// New creates a new DomainError.
func New(code, message string, err error) *DomainError {
	return &DomainError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}
