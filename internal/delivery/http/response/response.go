package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/domain/errors"
)

// tygo:emit
// Response represents a standardized API response
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

// tygo:emit
// ErrorInfo represents error information in the response
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// tygo:emit
// MetaInfo represents metadata for paginated responses
type MetaInfo struct {
	Page       int `json:"page,omitempty"`
	Limit      int `json:"limit,omitempty"`
	Total      int `json:"total,omitempty"`
	TotalPages int `json:"totalPages,omitempty"`
}

// Success sends a successful response
func Success(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Created sends a created response
func Created(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error sends an error response
func Error(c *gin.Context, statusCode int, err error) {
	var errorInfo *ErrorInfo

	if domainErr, ok := err.(*errors.DomainError); ok {
		errorInfo = &ErrorInfo{
			Code:    domainErr.Code,
			Message: domainErr.Message,
			Details: err.Error(),
		}
	} else {
		errorInfo = &ErrorInfo{
			Code:    "INTERNAL_ERROR",
			Message: err.Error(),
		}
	}

	c.JSON(statusCode, Response{
		Success: false,
		Error:   errorInfo,
	})
}

// BadRequest sends a bad request response
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "BAD_REQUEST",
			Message: message,
		},
	})
}

// NotFound sends a not found response
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "NOT_FOUND",
			Message: message,
		},
	})
}

// Unauthorized sends an unauthorized response
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "UNAUTHORIZED",
			Message: message,
		},
	})
}

// Forbidden sends a forbidden response
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "FORBIDDEN",
			Message: message,
		},
	})
}

// InternalServerError sends an internal server error response
func InternalServerError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "INTERNAL_SERVER_ERROR",
			Message: message,
		},
	})
}

// Conflict sends a conflict response
func Conflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    "CONFLICT",
			Message: message,
		},
	})
}

// Paginated sends a paginated response
func Paginated(c *gin.Context, data interface{}, page, limit, total int, message string) {
	totalPages := (total + limit - 1) / limit // Ceiling division

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
		Meta: &MetaInfo{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}
