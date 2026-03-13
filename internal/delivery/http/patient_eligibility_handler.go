package http

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

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
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Bad Request",
			Message: err.Error(),
		})
		return
	}

	// Handle file upload for 'document'
	file, header, err := c.Request.FormFile("document")
	if err == nil {
		defer file.Close()

		// Validate file extension
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext != ".pdf" && ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{
				Error:   "Invalid request",
				Message: "Document must be a PDF, JPG, JPEG, or PNG file",
			})
			return
		}

		// Create directory
		uploadDir := "uploads/eligibility_documents"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Internal server error",
				Message: "Failed to create upload directory",
			})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "File upload failed",
				Message: "Could not save document file",
			})
			return
		}

		// Set document URL
		docURL := filepath.ToSlash(filePath)
		req.DocumentURL = &docURL
	} else if err != http.ErrMissingFile {
		// An error other than missing file occurred
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "File Upload Error",
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
