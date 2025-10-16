package http

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

// UserHandlerClean handles HTTP requests for user operations
type MedicineHandlerClean struct {
	medicineUseCase usecase.MedicineUseCase
}

// NewMedicineHandlerClean creates a new instance of MedicineHandlerClean
func NewMedicineHandlerClean(medicineUseCase usecase.MedicineUseCase) *MedicineHandlerClean {
	return &MedicineHandlerClean{
		medicineUseCase: medicineUseCase,
	}
}

/*PATEINT*/
func (h *MedicineHandlerClean) GetMedicines(c *gin.Context) {
	/*userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}*/

	lattitude := c.GetFloat64("lattitude")
	longitude := c.GetFloat64("longitude")

	var req types.MedicineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Bad Request",
			Message: "Invalid request payload",
			Details: err.Error(),
		})
		return
	}
	searchquery := req.SearchQuery

	medicinedata, err := h.medicineUseCase.GetMedicines(c.Request.Context(), searchquery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to retrieve medicines",
			Message: "Medicine retrieval failed",
			Details: err.Error(),
		})
		return
	}
	log.Printf("%f,%f", lattitude, longitude)
	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    medicinedata,
		Message: "Medicines retrieved successfully",
	})
}
