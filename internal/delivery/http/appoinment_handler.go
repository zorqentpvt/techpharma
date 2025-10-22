package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/errors"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

// UserHandlerClean handles HTTP requests for user operations
type AppointmentHandlerClean struct {
	appointmentUseCase usecase.AppoinmentUseCase
	userRepo           repository.UserRepository
}

// NewMedicineHandlerClean creates a new instance of MedicineHandlerClean
func NewAppoinmentHandlerClean(appointmentUseCase usecase.AppoinmentUseCase, userRepo repository.UserRepository) *AppointmentHandlerClean {
	return &AppointmentHandlerClean{
		appointmentUseCase: appointmentUseCase,
		userRepo:           userRepo,
	}
}
func (h *AppointmentHandlerClean) BookAppointment(c *gin.Context) {
	// Extract patient ID from context
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid User ID",
			Message: "User ID format is invalid",
		})
		return
	}

	// Bind and validate request body
	var req types.AppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	// Set patient ID from authenticated user
	req.PatientID = userID

	// Additional validation for selected slots
	if len(req.SelectedSlots) < 1 || len(req.SelectedSlots) > 5 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Selected slots must be between 1 and 5",
		})
		return
	}

	// Validate appointment mode
	if req.Mode != entity.AppointmentModeOnline && req.Mode != entity.AppointmentModeInPerson {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid appointment mode. Must be 'online' or 'in_person'",
		})
		return
	}

	// Call use case
	appointment, err := h.appointmentUseCase.BookAppointment(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Appointment booked successfully",
		"data":    appointment,
	})
}

// handleError maps domain errors to HTTP responses
func (h *AppointmentHandlerClean) handleError(c *gin.Context, err error) {
	switch {
	case errors.IsNotFound(err):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.IsAlreadyExists(err):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	case errors.IsInvalidInput(err):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.IsUnauthorized(err):
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
	case errors.IsForbidden(err):
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
	default:
		// Check if it's a DomainError for more specific handling
		var domainErr *errors.DomainError
		if errors.As(err, &domainErr) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": domainErr.Message,
				"code":  domainErr.Code,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book appointment"})
	}
}
