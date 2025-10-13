package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

// UserHandlerClean handles HTTP requests for user operations
type DoctorHandlerClean struct {
	doctorUseCase usecase.DoctorUseCase
}

// NewMedicineHandlerClean creates a new instance of MedicineHandlerClean
func NewDoctorHandlerClean(doctorUseCase usecase.DoctorUseCase) *DoctorHandlerClean {
	return &DoctorHandlerClean{
		doctorUseCase: doctorUseCase,
	}
}
func (h *DoctorHandlerClean) GetDoctors(c *gin.Context) {
	/*userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}*/

	var req types.DoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Bad Request",
			Message: "Invalid request payload",
			Details: err.Error(),
		})
		return
	}
	searchquery := req.Query

	doctorData, err := h.doctorUseCase.GetDoctors(c.Request.Context(), searchquery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to retrieve doctors",
			Message: "Doctor retrieval failed",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    doctorData,
		Message: "Doctors retrieved successfully",
	})
}
