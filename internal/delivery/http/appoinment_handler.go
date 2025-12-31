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

	var req types.AppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	req.PatientID = userID

	if len(req.SelectedSlots) < 1 || len(req.SelectedSlots) > 5 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Selected slots must be between 1 and 5",
		})
		return
	}

	if req.Mode != entity.AppointmentModeOnline && req.Mode != entity.AppointmentModeInPerson {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid appointment mode. Must be 'online' or 'in_person'",
		})
		return
	}

	appointments, err := h.appointmentUseCase.BookAppointment(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Appointments booked successfully",
		"data":    appointments,
	})
}

// GetDoctorSchedule handles GET /api/doctor/schedule (for doctors)
func (h *AppointmentHandlerClean) GetDoctorSchedule(c *gin.Context) {
	doctorIDStr := c.GetString("userID")
	if doctorIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Doctor ID not found in context",
		})
		return
	}

	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Doctor ID",
			Message: "Doctor ID format is invalid",
		})
		return
	}

	appointments, err := h.appointmentUseCase.GetDoctorSchedule(c.Request.Context(), doctorID)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Fetched schedule successfully",
		"data":    appointments,
	})
}

// FetchConsultations handles GET /api/doctor/consultations (for doctors)
func (h *AppointmentHandlerClean) FetchConsultations(c *gin.Context) {
	doctorIDStr := c.GetString("userID")
	if doctorIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Doctor ID not found in context",
		})
		return
	}

	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Doctor ID",
			Message: "Doctor ID format is invalid",
		})
		return
	}

	consultations, err := h.appointmentUseCase.FetchConsultations(c.Request.Context(), doctorID)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, consultations)
}

// FetchPatientConsultations handles GET /api/user/consultations (for patients)
func (h *AppointmentHandlerClean) FetchPatientConsultations(c *gin.Context) {
	patientIDStr := c.GetString("userID")
	if patientIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Patient ID not found in context",
		})
		return
	}

	patientID, err := uuid.Parse(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Patient ID",
			Message: "Patient ID format is invalid",
		})
		return
	}

	consultations, err := h.appointmentUseCase.FetchPatientConsultations(c.Request.Context(), patientID)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, consultations)
}

// CancelAppointment handles DELETE /api/user/cancel-appointment
func (h *AppointmentHandlerClean) CancelAppointment(c *gin.Context) {
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

	var req struct {
		AppointmentID string `json:"appointmentId" binding:"required"`
		Reason        string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	appointmentID, err := uuid.Parse(req.AppointmentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid appointment ID format",
		})
		return
	}

	err = h.appointmentUseCase.CancelAppointment(c.Request.Context(), appointmentID, userID, req.Reason)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Appointment cancelled successfully",
	})
}

// ScheduleAppointment handles POST /api/doctor/schedule-appointment (doctor setting available slots)
func (h *AppointmentHandlerClean) ScheduleAppointment(c *gin.Context) {
	doctorIDStr := c.GetString("userID")
	if doctorIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Doctor ID not found in context",
		})
		return
	}

	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Doctor ID",
			Message: "Doctor ID format is invalid",
		})
		return
	}

	var req types.ScheduleAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	req.DoctorID = doctorID

	err = h.appointmentUseCase.ScheduleAppointment(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Schedule created successfully",
	})
}

// ConfirmedAppionmentSlot handles GET /api/doctor/confirmed-slots
func (h *AppointmentHandlerClean) ConfirmedAppionmentSlot(c *gin.Context) {
	// Get docId from query parameter (not body)
	docIDStr := c.Query("docId")
	if docIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "docId is required",
		})
		return
	}

	// Parse UUID
	docID, err := uuid.Parse(docIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid docId format",
		})
		return
	}

	req := types.ConfirmedSlotRequest{
		DocID: docID,
	}

	slots, err := h.appointmentUseCase.GetConfirmedAppionmentSlot(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Fetched confirmed slots successfully",
		"data":    slots,
	})
}

// CompleteConsultation handles POST /api/doctor/complete-consultation
func (h *AppointmentHandlerClean) CompleteConsultation(c *gin.Context) {
	doctorIDStr := c.GetString("userID")
	if doctorIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Doctor ID not found in context",
		})
		return
	}

	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Doctor ID",
			Message: "Doctor ID format is invalid",
		})
		return
	}

	var req types.CompleteConsultationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	err = h.appointmentUseCase.CompleteConsultation(c.Request.Context(), &req, doctorID)
	if err != nil {
		h.handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Consultation completed successfully",
	})
}

func (h *AppointmentHandlerClean) handleError(c *gin.Context, err error) {
	switch {
	case errors.IsNotFound(err):
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
	case errors.IsAlreadyExists(err):
		c.JSON(http.StatusConflict, gin.H{"success": false, "message": err.Error()})
	case errors.IsInvalidInput(err):
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
	case errors.IsUnauthorized(err):
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
	case errors.IsForbidden(err):
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
	default:
		var domainErr *errors.DomainError
		if errors.As(err, &domainErr) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": domainErr.Message,
				"code":    domainErr.Code,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Internal server error"})
	}
}
