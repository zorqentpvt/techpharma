// internal/domain/entity/email.go
package entity

import (
	"time"

	"github.com/google/uuid"
)

// EmailType represents different types of emails
type EmailType string

const (
	EmailTypeWelcome           EmailType = "welcome"
	EmailTypePasswordReset     EmailType = "password_reset"
	EmailTypeUserStatusUpdate  EmailType = "user_status_update"
	EmailTypeAccountActivation EmailType = "account_activation"
	EmailTypeNotification      EmailType = "notification"
	EmailTypeInvoice           EmailType = "invoice"
	EmailTypeGeneral           EmailType = "general"
)

// EmailPriority represents email priority levels
type EmailPriority string

const (
	EmailPriorityLow    EmailPriority = "low"
	EmailPriorityNormal EmailPriority = "normal"
	EmailPriorityHigh   EmailPriority = "high"
	EmailPriorityUrgent EmailPriority = "urgent"
)

// EmailStatus represents the status of an email
type EmailStatus string

const (
	EmailStatusPending EmailStatus = "pending"
	EmailStatusSent    EmailStatus = "sent"
	EmailStatusFailed  EmailStatus = "failed"
	EmailStatusRetry   EmailStatus = "retry"
)

// EmailAttachment represents a file attachment
type EmailAttachment struct {
	Filename    string `json:"filename"`
	Content     []byte `json:"content"`
	ContentType string `json:"content_type"`
}

// EmailRequest represents an email to be sent
type EmailRequest struct {
	ID          uuid.UUID              `json:"id"`
	Type        EmailType              `json:"type"`
	To          []string               `json:"to"`
	CC          []string               `json:"cc,omitempty"`
	BCC         []string               `json:"bcc,omitempty"`
	Subject     string                 `json:"subject"`
	Data        map[string]interface{} `json:"data"`
	Attachments []EmailAttachment      `json:"attachments,omitempty"`
	Priority    EmailPriority          `json:"priority"`
	ScheduledAt *time.Time             `json:"scheduled_at,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// EmailLog represents email sending history
type EmailLog struct {
	ID         uuid.UUID   `json:"id"`
	EmailID    uuid.UUID   `json:"email_id"`
	Status     EmailStatus `json:"status"`
	Error      string      `json:"error,omitempty"`
	SentAt     *time.Time  `json:"sent_at,omitempty"`
	RetryCount int         `json:"retry_count"`
	CreatedAt  time.Time   `json:"created_at"`
}
