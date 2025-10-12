// internal/infrastructure/email/resend_client.go
package email

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/pkg/config"
)

// ResendClient is a client for Resend API
type ResendClient struct {
	httpClient *http.Client
	config     *config.EmailConfig
	baseURL    string
}

// NewResendClient creates a new Resend client
func NewResendClient(cfg *config.EmailConfig) *ResendClient {
	return &ResendClient{
		httpClient: &http.Client{
			Timeout: cfg.HTTPTimeout,
		},
		config:  cfg,
		baseURL: cfg.APIBaseURL,
	}
}

// ResendEmailRequest represents the request payload for Resend API
type ResendEmailRequest struct {
	From        string             `json:"from"`
	To          []string           `json:"to"`
	CC          []string           `json:"cc,omitempty"`
	BCC         []string           `json:"bcc,omitempty"`
	Subject     string             `json:"subject"`
	HTML        string             `json:"html,omitempty"`
	Text        string             `json:"text,omitempty"`
	Attachments []ResendAttachment `json:"attachments,omitempty"`
	Tags        []ResendTag        `json:"tags,omitempty"`
	Headers     map[string]string  `json:"headers,omitempty"`
}

// ResendAttachment represents an attachment in Resend format
type ResendAttachment struct {
	Filename string `json:"filename"`
	Content  string `json:"content"` // base64 encoded content
	Type     string `json:"type,omitempty"`
	Path     string `json:"path,omitempty"`
}

// ResendTag represents a tag for email tracking
type ResendTag struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// ResendEmailResponse represents the response from Resend API
type ResendEmailResponse struct {
	ID      string    `json:"id"`
	From    string    `json:"from"`
	To      []string  `json:"to"`
	Created time.Time `json:"created"`
}

// ResendError represents an error response from Resend API
type ResendError struct {
	Name    string `json:"name"`
	Message string `json:"message"`
}

func (e *ResendError) Error() string {
	return fmt.Sprintf("resend error: %s - %s", e.Name, e.Message)
}

// SendEmail sends an email through Resend API
func (rc *ResendClient) SendEmail(ctx context.Context, req *ResendEmailRequest) (*ResendEmailResponse, error) {
	// Prepare the request body
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", rc.baseURL+"/emails", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Authorization", "Bearer "+rc.config.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("User-Agent", rc.config.UserAgent)

	// Send the request
	resp, err := rc.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for HTTP errors
	if resp.StatusCode >= 400 {
		var resendErr ResendError
		if err := json.Unmarshal(body, &resendErr); err != nil {
			return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
		}
		return nil, &resendErr
	}

	// Parse successful response
	var emailResp ResendEmailResponse
	if err := json.Unmarshal(body, &emailResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &emailResp, nil
}

// SendBatchEmails sends multiple emails in a single batch
func (rc *ResendClient) SendBatchEmails(ctx context.Context, requests []*ResendEmailRequest) ([]*ResendEmailResponse, error) {
	responses := make([]*ResendEmailResponse, len(requests))
	errors := make([]error, len(requests))

	// Create a semaphore for controlling concurrency
	sem := make(chan struct{}, rc.config.BatchConcurrency)

	// Use goroutines for concurrent sending
	done := make(chan struct{})
	for i, req := range requests {
		go func(index int, request *ResendEmailRequest) {
			defer func() { done <- struct{}{} }()

			// Acquire semaphore
			sem <- struct{}{}
			defer func() { <-sem }()

			resp, err := rc.SendEmail(ctx, request)
			responses[index] = resp
			errors[index] = err
		}(i, req)
	}

	// Wait for all goroutines to complete
	for range requests {
		<-done
	}

	// Check if any errors occurred
	var hasErrors bool
	for _, err := range errors {
		if err != nil {
			hasErrors = true
			break
		}
	}

	if hasErrors {
		return responses, fmt.Errorf("batch send completed with errors: %v", errors)
	}

	return responses, nil
}

// convertAttachments converts domain attachments to Resend format
func (rc *ResendClient) convertAttachments(attachments []entity.EmailAttachment) []ResendAttachment {
	resendAttachments := make([]ResendAttachment, len(attachments))

	for i, att := range attachments {
		resendAttachments[i] = ResendAttachment{
			Filename: att.Filename,
			Content:  base64.StdEncoding.EncodeToString(att.Content),
			Type:     att.ContentType,
		}
	}

	return resendAttachments
}

// GetEmailStatus retrieves the status of an email by ID
func (rc *ResendClient) GetEmailStatus(ctx context.Context, emailID string) (*ResendEmailStatusResponse, error) {
	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "GET", rc.baseURL+"/emails/"+emailID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Authorization", "Bearer "+rc.config.APIKey)
	httpReq.Header.Set("User-Agent", rc.config.UserAgent)

	// Send the request
	resp, err := rc.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for HTTP errors
	if resp.StatusCode >= 400 {
		var resendErr ResendError
		if err := json.Unmarshal(body, &resendErr); err != nil {
			return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
		}
		return nil, &resendErr
	}

	// Parse successful response
	var statusResp ResendEmailStatusResponse
	if err := json.Unmarshal(body, &statusResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &statusResp, nil
}

// ResendEmailStatusResponse represents email status from Resend API
type ResendEmailStatusResponse struct {
	ID        string    `json:"id"`
	From      string    `json:"from"`
	To        []string  `json:"to"`
	Subject   string    `json:"subject"`
	Created   time.Time `json:"created"`
	LastEvent string    `json:"last_event"`
}
