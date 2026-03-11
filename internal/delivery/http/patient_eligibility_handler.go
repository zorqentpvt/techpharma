package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

type PatientEligibilityHandler struct {
	eligibilityUC usecase.PatientEligibilityUseCase
}

func NewPatientEligibilityHandler(eligibilityUC usecase.PatientEligibilityUseCase) *PatientEligibilityHandler {
	return &PatientEligibilityHandler{
		eligibilityUC: eligibilityUC,
	}
}

func (h *PatientEligibilityHandler) ApplyForEligibility(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	var req types.EligibilityApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Bad Request",
			Message: err.Error(),
		})
		return
	}

	req.UserID = userID

	eligibility, err := h.eligibilityUC.ApplyForEligibility(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to apply for eligibility",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, eligibility, "Eligibility application submitted successfully")
}

func (h *PatientEligibilityHandler) GetMyEligibility(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	eligibilities, err := h.eligibilityUC.GetUserEligibility(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to fetch eligibility",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, eligibilities, "Eligibility records fetched successfully")
}

func (h *PatientEligibilityHandler) GetActiveEligibility(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	eligibility, err := h.eligibilityUC.GetActiveEligibility(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "No active eligibility",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, eligibility, "Active eligibility fetched successfully")
}

func (h *PatientEligibilityHandler) ApproveEligibility(c *gin.Context) {
	eligibilityIDStr := c.Param("id")
	eligibilityID, err := uuid.Parse(eligibilityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid eligibility ID",
			Message: err.Error(),
		})
		return
	}

	verifiedByStr := c.GetString("userID")
	verifiedBy, err := uuid.Parse(verifiedByStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	if err := h.eligibilityUC.ApproveEligibility(c.Request.Context(), eligibilityID, verifiedBy); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to approve eligibility",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, nil, "Eligibility approved successfully")
}

func (h *PatientEligibilityHandler) RejectEligibility(c *gin.Context) {
	eligibilityIDStr := c.Param("id")
	eligibilityID, err := uuid.Parse(eligibilityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid eligibility ID",
			Message: err.Error(),
		})
		return
	}

	verifiedByStr := c.GetString("userID")
	verifiedBy, err := uuid.Parse(verifiedByStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Bad Request",
			Message: err.Error(),
		})
		return
	}

	if err := h.eligibilityUC.RejectEligibility(c.Request.Context(), eligibilityID, verifiedBy, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to reject eligibility",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, nil, "Eligibility rejected successfully")
}
func (h *PatientEligibilityHandler) GetAllEligibilityRequests(c *gin.Context) {
	statusFilter := c.Query("status") // optional ?status=pending

	eligibilities, err := h.eligibilityUC.GetAllEligibilityRequests(c.Request.Context(), statusFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to fetch eligibility requests",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, eligibilities, "Eligibility requests fetched successfully")
}
