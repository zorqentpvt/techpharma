// internal/infrastructure/service/email_service.go
package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/service"
	"github.com/skryfon/collex/internal/infrastructure/email"
	"github.com/skryfon/collex/pkg/config"
)

// emailService implements the EmailService interface
type emailService struct {
	config          *config.EmailConfig
	resendClient    *email.ResendClient
	templateManager *email.TemplateManager
	retryBackoff    RetryBackoff
}

// NewEmailService creates a new email service
func NewEmailService(cfg *config.Config) service.EmailService {
	return &emailService{
		config:          &cfg.Email,
		resendClient:    email.NewResendClient(&cfg.Email),
		templateManager: email.NewTemplateManager("/home/ebinb/collex/template"),
		retryBackoff:    NewExponentialBackoff(cfg.Email.InitialBackoff, cfg.Email.MaxBackoff),
	}
}

// Send sends a single email immediately with default recipient from data
func (es *emailService) Send(ctx context.Context, emailType entity.EmailType, data map[string]interface{}) error {
	// Extract recipient from data
	var to []string

	if emailInterface, exists := data["UserEmail"]; exists {
		// Handle both string and *string types
		switch email := emailInterface.(type) {
		case string:
			to = []string{email}
		case *string:
			if email != nil {
				to = []string{*email}
			} else {
				return fmt.Errorf("UserEmail is nil pointer")
			}
		default:
			return fmt.Errorf("UserEmail must be string or *string, got %T", emailInterface)
		}
	} else if emails, exists := data["Recipients"]; exists {
		// Handle Recipients field (assuming it's []string or []*string)
		switch recipients := emails.(type) {
		case []string:
			to = recipients
		case []*string:
			to = make([]string, 0, len(recipients))
			for _, email := range recipients {
				if email != nil {
					to = append(to, *email)
				}
			}
		default:
			return fmt.Errorf("recipients must be []string or []*string, got %T", emails)
		}
	} else {
		return fmt.Errorf("no recipient found in email data")
	}

	if len(to) == 0 {
		return fmt.Errorf("no valid recipient emails provided")
	}
	return es.SendToRecipient(ctx, to, emailType, data)
}

// SendToRecipient sends an email to specific recipient(s)
func (es *emailService) SendToRecipient(ctx context.Context, to []string, emailType entity.EmailType, data map[string]interface{}) error {
	return es.SendWithAttachments(ctx, to, emailType, data, nil)
}

// SendWithAttachments sends an email with attachments
func (es *emailService) SendWithAttachments(ctx context.Context, to []string, emailType entity.EmailType, data map[string]interface{}, attachments []entity.EmailAttachment) error {
	// Add default data if not present
	if data == nil {
		data = map[string]interface{}{}
	}
	es.addDefaultData(data)

	// Render the email template
	subject, htmlContent, textContent, err := es.templateManager.RenderTemplate(emailType, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	// Create Resend email request
	resendReq := &email.ResendEmailRequest{
		From:    fmt.Sprintf("%s <%s>", es.config.FromName, es.config.FromEmail),
		To:      to,
		Subject: subject,
		HTML:    htmlContent,
		Text:    textContent,
		Tags: []email.ResendTag{
			{Name: "email_type", Value: string(emailType)},
			{Name: "environment", Value: "production"}, // or get from config
		},
	}

	// Add CC and BCC if present in data with safe type assertions
	if cc, exists := data["CC"]; exists {
		switch v := cc.(type) {
		case []string:
			resendReq.CC = v
		case []*string:
			for _, p := range v {
				if p != nil {
					resendReq.CC = append(resendReq.CC, *p)
				}
			}
		default:
			log.Printf("Warning: CC field has unexpected type %T, expected []string or []*string", cc)
		}
	}
	if bcc, exists := data["BCC"]; exists {
		switch v := bcc.(type) {
		case []string:
			resendReq.BCC = v
		case []*string:
			for _, p := range v {
				if p != nil {
					resendReq.BCC = append(resendReq.BCC, *p)
				}
			}
		default:
			log.Printf("Warning: BCC field has unexpected type %T, expected []string or []*string", bcc)
		}
	}

	// Add attachments if any
	if len(attachments) > 0 {
		resendReq.Attachments = es.convertAttachments(attachments)
	}

	// Send email with retry logic
	return es.sendWithRetry(ctx, resendReq, es.config.MaxRetries)
}

// SendBatch sends multiple emails in batches
func (es *emailService) SendBatch(ctx context.Context, requests []entity.EmailRequest) error {
	// Process requests in batches
	batchSize := es.config.BatchSize
	for i := 0; i < len(requests); i += batchSize {
		end := i + batchSize
		if end > len(requests) {
			end = len(requests)
		}

		batch := requests[i:end]
		if err := es.processBatch(ctx, batch); err != nil {
			return fmt.Errorf("failed to process batch %d-%d: %w", i, end-1, err)
		}

		// Add small delay between batches to avoid rate limiting
		if end < len(requests) {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(100 * time.Millisecond):
			}
		}
	}

	return nil
}

// Schedule schedules an email to be sent later (placeholder - would need queue implementation)
func (es *emailService) Schedule(ctx context.Context, request entity.EmailRequest) error {
	// TODO: Implement email scheduling with a queue system (Redis, database, etc.)
	log.Printf("Email scheduled for %v: %s", request.ScheduledAt, request.Subject)

	// For now, if scheduled time is in the past or very soon, send immediately
	if request.ScheduledAt == nil || time.Until(*request.ScheduledAt) < time.Minute {
		return es.SendWithAttachments(ctx, request.To, request.Type, request.Data, request.Attachments)
	}

	// In production, you would:
	// 1. Store the request in a database or queue
	// 2. Have a background worker process scheduled emails
	// 3. Return success immediately

	return fmt.Errorf("email scheduling not yet implemented - use a queue system")
}

// GetEmailStatus gets the status of an email by ID
func (es *emailService) GetEmailStatus(ctx context.Context, emailID string) (*entity.EmailLog, error) {
	status, err := es.resendClient.GetEmailStatus(ctx, emailID)
	if err != nil {
		return nil, fmt.Errorf("failed to get email status: %w", err)
	}

	// Convert Resend status to domain entity
	emailLog := &entity.EmailLog{
		ID: uuid.New(),
		// Only set if valid UUID; otherwise leave zero value or adjust domain model.
		// Consider storing raw string separately if supported.
		// EmailID:
		Status:     es.mapResendStatus(status.LastEvent),
		RetryCount: 0, // Would need to track this separately
		CreatedAt:  status.Created,
	}
	if id, err := uuid.Parse(emailID); err == nil {
		emailLog.EmailID = id
	} else {
		log.Printf("Non-UUID emailID from provider: %s", emailID)
	}

	if status.LastEvent == "delivered" || status.LastEvent == "sent" {
		emailLog.SentAt = &status.Created
	}

	return emailLog, nil
}

// RetryFailed retries failed emails (placeholder - would need database integration)
func (es *emailService) RetryFailed(ctx context.Context) error {
	// TODO: Implement retry logic for failed emails
	// This would typically:
	// 1. Query database for failed emails
	// 2. Check if they're eligible for retry (retry count < max, not too old)
	// 3. Attempt to resend them
	// 4. Update their status in the database

	log.Printf("Retry failed emails not yet implemented - needs database integration")
	return nil
}

// Helper methods

// addDefaultData adds default data to email template data
func (es *emailService) addDefaultData(data map[string]interface{}) {
	if _, exists := data["AppName"]; !exists {
		data["AppName"] = "Collex"
	}
	if _, exists := data["CurrentYear"]; !exists {
		data["CurrentYear"] = time.Now().Year()
	}
	if _, exists := data["Timestamp"]; !exists {
		data["Timestamp"] = time.Now().Format("January 2, 2006 15:04 MST")
	}
}

// processBatch processes a batch of email requests
func (es *emailService) processBatch(ctx context.Context, batch []entity.EmailRequest) error {
	resendRequests := make([]*email.ResendEmailRequest, 0, len(batch))

	for _, req := range batch {
		// Add default data
		es.addDefaultData(req.Data)

		// Render template
		subject, htmlContent, textContent, err := es.templateManager.RenderTemplate(req.Type, req.Data)
		if err != nil {
			log.Printf("Failed to render template for email %s: %v", req.ID, err)
			continue
		}

		// Create Resend request
		resendReq := &email.ResendEmailRequest{
			From:    fmt.Sprintf("%s <%s>", es.config.FromName, es.config.FromEmail),
			To:      req.To,
			CC:      req.CC,
			BCC:     req.BCC,
			Subject: subject,
			HTML:    htmlContent,
			Text:    textContent,
			Tags: []email.ResendTag{
				{Name: "email_type", Value: string(req.Type)},
				{Name: "priority", Value: string(req.Priority)},
				{Name: "batch_id", Value: req.ID.String()},
			},
		}

		// Add attachments if any
		if len(req.Attachments) > 0 {
			resendReq.Attachments = es.convertAttachments(req.Attachments)
		}

		resendRequests = append(resendRequests, resendReq)
	}

	// Send batch
	responses, err := es.resendClient.SendBatchEmails(ctx, resendRequests)
	if err != nil {
		return fmt.Errorf("failed to send batch emails: %w", err)
	}

	// Log results
	for i, resp := range responses {
		if resp != nil {
			log.Printf("Email sent successfully: ID=%s, recipients=%d", resp.ID, len(resp.To))
		} else {
			log.Printf("Failed to send email in batch position %d", i)
		}
	}

	return nil
}

// sendWithRetry sends an email with retry logic
func (es *emailService) sendWithRetry(ctx context.Context, req *email.ResendEmailRequest, maxRetries int) error {
	var lastErr error
	if maxRetries < 0 {
		maxRetries = 0
	}

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			// Wait before retrying
			backoff := es.retryBackoff.NextBackoff(attempt - 1)
			log.Printf("Retrying email send (attempt %d/%d) after %v", attempt+1, maxRetries+1, backoff)

			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
			}
		}

		resp, err := es.resendClient.SendEmail(ctx, req)
		if err == nil {
			log.Printf("Email sent successfully: ID=%s, recipients=%d", resp.ID, len(resp.To))
			return nil
		}

		lastErr = err
		log.Printf("Email send attempt %d failed: %v", attempt+1, err)

		// Don't retry on certain errors (like invalid email format)
		if !es.shouldRetry(err) {
			break
		}
	}

	return fmt.Errorf("failed to send email after %d attempts: %w", maxRetries+1, lastErr)
}

// shouldRetry determines if an error is retryable
func (es *emailService) shouldRetry(err error) bool {
	// Check if it's a Resend error
	if resendErr, ok := err.(*email.ResendError); ok {
		// Don't retry on validation errors
		return resendErr.Name != "validation_error"
	}

	// Retry on network errors and temporary failures
	return true
}

// convertAttachments converts domain attachments to Resend format
func (es *emailService) convertAttachments(attachments []entity.EmailAttachment) []email.ResendAttachment {
	resendAttachments := make([]email.ResendAttachment, len(attachments))

	for i, att := range attachments {
		resendAttachments[i] = email.ResendAttachment{
			Filename: att.Filename,
			Content:  es.encodeAttachment(att.Content),
			Type:     att.ContentType,
		}
	}

	return resendAttachments
}

// encodeAttachment encodes attachment content to base64
func (es *emailService) encodeAttachment(content []byte) string {
	return base64.StdEncoding.EncodeToString(content)
}

// mapResendStatus maps Resend status to domain status
func (es *emailService) mapResendStatus(resendStatus string) entity.EmailStatus {
	switch resendStatus {
	case "sent", "delivered":
		return entity.EmailStatusSent
	case "bounced", "complained", "failed":
		return entity.EmailStatusFailed
	default:
		return entity.EmailStatusPending
	}
}
