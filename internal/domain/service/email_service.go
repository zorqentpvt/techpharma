// internal/domain/service/email_service.go
package service

import (
	"context"

	"github.com/skryfon/collex/internal/domain/entity"
)

// EmailService defines the interface for email operations
type EmailService interface {
	// Send sends a single email immediately
	Send(ctx context.Context, emailType entity.EmailType, data map[string]interface{}) error

	// SendToRecipient sends an email to specific recipient(s)
	SendToRecipient(ctx context.Context, to []string, emailType entity.EmailType, data map[string]interface{}) error

	// SendWithAttachments sends an email with attachments
	SendWithAttachments(ctx context.Context, to []string, emailType entity.EmailType, data map[string]interface{}, attachments []entity.EmailAttachment) error

	// SendBatch sends multiple emails in batches
	SendBatch(ctx context.Context, requests []entity.EmailRequest) error

	// Schedule schedules an email to be sent later
	Schedule(ctx context.Context, request entity.EmailRequest) error

	// GetEmailStatus gets the status of an email by ID
	GetEmailStatus(ctx context.Context, emailID string) (*entity.EmailLog, error)

	// RetryFailed retries failed emails
	RetryFailed(ctx context.Context) error
}
