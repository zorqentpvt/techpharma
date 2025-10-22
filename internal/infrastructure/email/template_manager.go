// internal/infrastructure/email/template_manager.go
package email

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"path/filepath"
	"strings"

	"github.com/skryfon/collex/internal/domain/entity"
)

// TemplateManager manages email templates
type TemplateManager struct {
	templates    map[entity.EmailType]*EmailTemplate
	templatePath string
}

// EmailTemplate holds template information
type EmailTemplate struct {
	Subject     string
	HTMLContent string
	TextContent string
}

// NewTemplateManager creates a new template manager
func NewTemplateManager(templatePath string) *TemplateManager {
	fmt.Printf("Initializing TemplateManager with path: %s\n", templatePath)

	// Check if template directory exists
	if _, err := ioutil.ReadDir(templatePath); err != nil {
		fmt.Printf("Warning: Template directory not accessible: %v\n", err)
	} else {
		fmt.Printf("Template directory exists and is accessible\n")
	}

	tm := &TemplateManager{
		templates:    make(map[entity.EmailType]*EmailTemplate),
		templatePath: templatePath,
	}
	tm.loadTemplatesFromFiles()
	return tm
}

// loadTemplatesFromFiles loads email templates from HTML files
func (tm *TemplateManager) loadTemplatesFromFiles() {
	// Define template configurations - only subjects and filenames
	templateConfigs := map[entity.EmailType]struct {
		subject  string
		htmlFile string
		textFile string
	}{
		entity.EmailTypeWelcome: {
			subject:  "Welcome to {{.AppName}}!",
			htmlFile: "welcome.html",
			textFile: "welcome.txt",
		},
		entity.EmailTypeUserStatusUpdate: {
			subject:  "Account Status Update - {{.AppName}}",
			htmlFile: "user_status_update.html",
			textFile: "user_status_update.txt",
		},
		entity.EmailTypePasswordReset: {
			subject:  "Reset Your Password - {{.AppName}}",
			htmlFile: "password_reset.html",
			textFile: "password_reset.txt",
		},
		entity.EmailTypeNotification: {
			subject:  "{{.Subject}} - {{.AppName}}",
			htmlFile: "notification.html",
			textFile: "notification.txt",
		},
	}

	// Load templates from files
	for emailType, config := range templateConfigs {
		htmlContent, err := tm.loadTemplateFile(config.htmlFile)
		if err != nil {
			fmt.Printf("Error: Failed to load HTML template file %s: %v\n", config.htmlFile, err)
			continue
		}

		textContent, err := tm.loadTemplateFile(config.textFile)
		if err != nil {
			fmt.Printf("Error: Failed to load text template file %s: %v\n", config.textFile, err)
			continue
		}

		tm.templates[emailType] = &EmailTemplate{
			Subject:     config.subject,
			HTMLContent: htmlContent,
			TextContent: textContent,
		}
	}
}

// loadTemplateFile reads template content from file
func (tm *TemplateManager) loadTemplateFile(filename string) (string, error) {
	filePath := filepath.Join(tm.templatePath, filename)
	fmt.Printf("Attempting to load template file: %s\n", filePath)

	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read template file %s: %w", filePath, err)
	}

	fmt.Printf("Successfully loaded template file: %s (size: %d bytes)\n", filePath, len(content))
	return string(content), nil
}

// GetTemplate returns a template for the given email type
func (tm *TemplateManager) GetTemplate(emailType entity.EmailType) (*EmailTemplate, error) {

	template, exists := tm.templates[emailType]
	if !exists {
		// List available templates for debugging
		availableTypes := make([]string, 0, len(tm.templates))
		for t := range tm.templates {
			availableTypes = append(availableTypes, string(t))
		}
		return nil, fmt.Errorf("template not found for email type: '%s'. Available types: %v", emailType, availableTypes)
	}
	return template, nil
}

// RenderTemplate renders a template with the given data
func (tm *TemplateManager) RenderTemplate(emailType entity.EmailType, data map[string]interface{}) (subject, htmlContent, textContent string, err error) {
	emailTemplate, err := tm.GetTemplate(emailType)
	if err != nil {
		return "", "", "", err
	}

	// Render subject
	subjectTmpl, err := template.New("subject").Parse(emailTemplate.Subject)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse subject template: %w", err)
	}

	var subjectBuf bytes.Buffer
	if err := subjectTmpl.Execute(&subjectBuf, data); err != nil {
		return "", "", "", fmt.Errorf("failed to render subject: %w", err)
	}
	subject = strings.TrimSpace(subjectBuf.String())

	// Render HTML content
	htmlTmpl, err := template.New("html").Parse(emailTemplate.HTMLContent)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	var htmlBuf bytes.Buffer
	if err := htmlTmpl.Execute(&htmlBuf, data); err != nil {
		return "", "", "", fmt.Errorf("failed to render HTML: %w", err)
	}
	htmlContent = htmlBuf.String()

	// Render text content
	textTmpl, err := template.New("text").Parse(emailTemplate.TextContent)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to parse text template: %w", err)
	}

	var textBuf bytes.Buffer
	if err := textTmpl.Execute(&textBuf, data); err != nil {
		return "", "", "", fmt.Errorf("failed to render text: %w", err)
	}
	textContent = textBuf.String()

	return subject, htmlContent, textContent, nil
}

// AddCustomTemplate adds or updates a custom template
func (tm *TemplateManager) AddCustomTemplate(emailType entity.EmailType, template *EmailTemplate) {

	tm.templates[emailType] = template
}

// ReloadTemplates reloads all templates from files
func (tm *TemplateManager) ReloadTemplates() error {
	tm.templates = make(map[entity.EmailType]*EmailTemplate)
	tm.loadTemplatesFromFiles()
	return nil
}
