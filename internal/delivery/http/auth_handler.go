package http

import (
	"encoding/json"
	"log"
	"net"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/entity"
	domainErrors "github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

// AuthHandler handles HTTP requests for authentication
type AuthHandlerClean struct {
	authUseCase  usecase.AuthUseCase
	auditRepo    repository.AuditLogRepository
	securityRepo repository.SecurityEventRepository
}

// NewAuthHandlerClean creates a new clean architecture auth handler
func NewAuthHandlerClean(
	authUseCase usecase.AuthUseCase,
	auditRepo repository.AuditLogRepository,
	securityRepo repository.SecurityEventRepository,
) *AuthHandlerClean {
	return &AuthHandlerClean{
		authUseCase:  authUseCase,
		auditRepo:    auditRepo,
		securityRepo: securityRepo,
	}
}

// Login handles user login requests
func (h *AuthHandlerClean) Login(c *gin.Context) {
	var req types.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login request binding error: %v", err)
		h.logLoginAttempt(c, nil, req.Email, "failed", "Invalid request format", nil)
		response.BadRequest(c, "Invalid request format or missing required fields")
		return
	}

	// Call use case
	loginResponse, err := h.authUseCase.Login(c.Request.Context(), &req)
	if err != nil {
		h.handleAuthError(c, err, req.Email, nil)
		return
	}

	// Log successful login
	h.logLoginAttempt(c, &loginResponse.User.ID, req.Email, "success", "", loginResponse.User.LastLoginAt)

	// Return success response
	response.Success(c, loginResponse, "Login successful")
}

// RefreshToken handles token refresh requests
func (h *AuthHandlerClean) RefreshToken(c *gin.Context) {
	var req types.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request format")
		return
	}

	// Call use case
	refreshResponse, err := h.authUseCase.RefreshToken(c.Request.Context(), &req)
	if err != nil {
		h.handleAuthError(c, err, "", nil)
		return
	}

	// Return success response
	response.Success(c, refreshResponse, "Token refreshed successfully")
}

// Register handles user registration requests
func (h *AuthHandlerClean) Register(c *gin.Context) {
	var req types.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Register request binding error: %v", err)
		response.BadRequest(c, "Invalid request format or missing required fields")
		return
	}

	// Call use case
	registerResponse, err := h.authUseCase.Register(c.Request.Context(), &req)
	if err != nil {
		h.handleAuthError(c, err, req.PhoneNumber, nil)
		return
	}

	// Return success response
	response.Success(c, registerResponse, "Registration successful")
}

// ChangePassword handles password change requests
func (h *AuthHandlerClean) ChangePassword(c *gin.Context) {
	// Extract user ID from JWT token (assuming middleware sets it)
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "User authentication required")
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		response.Unauthorized(c, "Invalid user context")
		return
	}

	var req types.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request format")
		return
	}

	// Call use case
	err := h.authUseCase.ChangePassword(c.Request.Context(), userIDStr, &req)
	if err != nil {
		h.handleAuthError(c, err, userIDStr, nil)
		return
	}

	// Return success response

	response.Success(c, nil, "Password changed successfully")
}

// ValidateToken handles token validation requests
func (h *AuthHandlerClean) ValidateToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		response.Unauthorized(c, "Authorization header required")
		return
	}

	// Extract token from Bearer format
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		response.Unauthorized(c, "Invalid authorization header format")
		return
	}

	token := tokenParts[1]

	// Call use case
	validationResponse, err := h.authUseCase.ValidateToken(c.Request.Context(), token)
	if err != nil {
		h.handleAuthError(c, err, "", nil)
		return
	}

	// Return success response
	response.Success(c, validationResponse, "Token is valid")
}

// handleAuthError handles authentication errors consistently
func (h *AuthHandlerClean) handleAuthError(c *gin.Context, err error, identifier string, userID *uuid.UUID) {
	if domainErr, ok := err.(*domainErrors.DomainError); ok {
		switch domainErr.Code {
		case "USER_NOT_FOUND", "INVALID_CREDENTIALS":
			h.logLoginAttempt(c, userID, identifier, "failed", "Invalid credentials", nil)
			h.logSecurityEvent(c, userID, "invalid_login", "Login attempt with invalid credentials", "medium")
			response.Unauthorized(c, domainErr.Message)
		case "LOGIN_BLOCKED":
			h.logLoginAttempt(c, userID, identifier, "blocked", domainErr.Message, nil)
			h.logSecurityEvent(c, userID, "blocked_login", "Login attempt on restricted account", "medium")
			response.Forbidden(c, domainErr.Message)
		case "USER_EXISTS", "EMAIL_EXISTS":
			response.Conflict(c, domainErr.Message)
		case "INVALID_REQUEST", "MISSING_CREDENTIALS", "MISSING_REQUIRED_FIELDS", "PASSWORD_MISMATCH", "INVALID_USER_ID":
			response.BadRequest(c, domainErr.Message)
		case "INVALID_CURRENT_PASSWORD":
			response.Unauthorized(c, domainErr.Message)
		case "TOKEN_GENERATION_FAILED", "USER_CREATION_FAILED", "PASSWORD_HASH_FAILED", "PASSWORD_UPDATE_FAILED":
			log.Printf("Internal error: %v", err)
			response.InternalServerError(c, "An internal error occurred")
		default:
			log.Printf("Unhandled domain error: %v", err)
			response.InternalServerError(c, "An error occurred processing your request")
		}
	} else {
		log.Printf("Non-domain error: %v", err)
		response.InternalServerError(c, "An internal error occurred")
	}
}

// Helper functions for logging (similar to original but cleaner)

func (h *AuthHandlerClean) getClientIP(c *gin.Context) string {
	xForwardedFor := c.GetHeader("X-Forwarded-For")
	if xForwardedFor != "" {
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			ip := strings.TrimSpace(ips[0])
			if net.ParseIP(ip) != nil {
				return ip
			}
		}
	}

	xRealIP := c.GetHeader("X-Real-IP")
	if xRealIP != "" {
		if net.ParseIP(xRealIP) != nil {
			return xRealIP
		}
	}

	ip, _, err := net.SplitHostPort(c.Request.RemoteAddr)
	if err != nil {
		return c.Request.RemoteAddr
	}
	return ip
}

func (h *AuthHandlerClean) generateSessionID() string {
	return uuid.New().String()
}

func (h *AuthHandlerClean) logLoginAttempt(c *gin.Context, userID *uuid.UUID, userName, status, reason string, previousLoginAt *time.Time) {
	clientIP := h.getClientIP(c)
	userAgent := c.GetHeader("User-Agent")
	sessionID := h.generateSessionID()

	auditData := map[string]interface{}{
		"userName":    userName,
		"loginTime":   time.Now(),
		"ipAddress":   clientIP,
		"userAgent":   userAgent,
		"loginStatus": status,
		"sessionId":   sessionID,
	}

	if reason != "" {
		auditData["failureReason"] = reason
	}

	if previousLoginAt != nil {
		auditData["previousLoginAt"] = previousLoginAt.Format(time.RFC3339)
	}

	auditDataJSON, err := json.Marshal(auditData)
	if err != nil {
		log.Printf("Failed to marshal login audit data: %v", err)
		return
	}

	auditLog := &entity.AuditLog{
		TableName:  "users",
		Action:     "login_attempt",
		ActionType: "manual",
		UserID:     userID,
		IPAddress:  clientIP,
		UserAgent:  userAgent,
		RequestID:  &sessionID,
		SessionID:  &sessionID,
		Source:     "web",
		Module:     "authentication",
		NewData:    auditDataJSON,
		ActionedAt: time.Now(),
		Tags:       json.RawMessage(`["login", "authentication"]`),
		Metadata:   auditDataJSON,
	}

	if userID != nil {
		auditLog.RecordID = *userID
	}

	if err := h.auditRepo.Create(c.Request.Context(), auditLog); err != nil {
		log.Printf("Failed to create login audit log: %v", err)
	}
}

func (h *AuthHandlerClean) logSecurityEvent(c *gin.Context, userID *uuid.UUID, eventType, description, threatLevel string) {
	clientIP := h.getClientIP(c)
	userAgent := c.GetHeader("User-Agent")

	eventDetails := map[string]interface{}{
		"login_attempt": true,
		"client_ip":     clientIP,
		"user_agent":    userAgent,
		"timestamp":     time.Now().Unix(),
	}

	eventDetailsJSON, _ := json.Marshal(eventDetails)

	securityEvent := &entity.SecurityEvent{
		EventType:    eventType,
		EventSubtype: "login_attempt",
		ThreatLevel:  threatLevel,
		UserID:       userID,
		Description:  description,
		EventDetails: eventDetailsJSON,
		SourceIP:     clientIP,
		UserAgent:    &userAgent,
		ImpactLevel:  "low",
		Status:       "open",
		DetectedAt:   time.Now(),
		Tags:         json.RawMessage(`["login", "authentication", "security"]`),
	}

	if err := h.securityRepo.Create(c.Request.Context(), securityEvent); err != nil {
		log.Printf("Failed to create security event: %v", err)
	}
}
func (h *AuthHandlerClean) ForgotPassword(c *gin.Context) {
	var req types.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Forgot password request binding error: %v", err)
		response.BadRequest(c, "Invalid request format or missing required fields")
		return
	}

	err := h.authUseCase.ForgotPassword(c.Request.Context(), &req)
	if err != nil {
		log.Printf("Forgot password error: %v", err)

		// Handle specific domain errors
		if domainErr, ok := err.(*domainErrors.DomainError); ok {
			switch domainErr.Code {
			case "USER_NOT_FOUND":
				response.NotFound(c, "User not found")
			case "EMAIL_NOT_REGISTERED":
				response.NotFound(c, "Email not registered")
			case "RESET_LINK_FAILED":
				response.InternalServerError(c, "Failed to send reset link. Please try again later.")
			default:
				response.InternalServerError(c, "An error occurred processing your request")
			}
		} else {
			// Handle non-domain errors
			response.InternalServerError(c, "An error occurred processing your request")
		}
		return
	}

	// Success response - only executes when no error occurred
	response.Success(c, nil, "Forgot password request processed successfully. Please check your email for further instructions.")
}
func (h *AuthHandlerClean) ResetPassword(c *gin.Context) {
	var req types.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Reset password request binding error: %v", err)
		response.BadRequest(c, "Invalid request format or missing required fields")
		return
	}

	err := h.authUseCase.ResetPassword(c.Request.Context(), &req)
	if err != nil {
		log.Printf("Reset password error: %v", err)

		// Handle specific domain errors
		if domainErr, ok := err.(*domainErrors.DomainError); ok {
			switch domainErr.Code {
			// Request validation errors
			case "INVALID_REQUEST", "MISSING_FIELDS":
				response.BadRequest(c, domainErr.Message)
			case "PASSWORD_MISMATCH":
				response.BadRequest(c, "New password and confirm password do not match")
			// Token validation errors
			case "INVALID_TOKEN", "WRONG_TOKEN_TYPE":
				response.BadRequest(c, "Invalid or expired reset token")
			case "TOKEN_EXPIRED":
				response.BadRequest(c, "Reset token has expired")
			// User-related errors
			case "USER_NOT_FOUND":
				response.BadRequest(c, "Invalid reset token")
			// Server errors
			case "USER_LOOKUP_FAILED", "PASSWORD_HASH_FAILED", "PASSWORD_UPDATE_FAILED":
				response.InternalServerError(c, "Failed to reset password. Please try again later.")
			default:
				response.InternalServerError(c, "An error occurred processing your request")
			}
		} else {
			// Handle non-domain errors
			response.InternalServerError(c, "An error occurred processing your request")
		}
		return
	}

	// Success response - only executes when no error occurred
	response.Success(c, nil, "Password has been reset successfully. You can now log in with your new password.")
}
