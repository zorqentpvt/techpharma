package http

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

// UserHandlerClean handles HTTP requests for user operations
type MedicineHandlerClean struct {
	medicineUseCase usecase.MedicineUseCase
	userRepo        repository.UserRepository
}

// NewMedicineHandlerClean creates a new instance of MedicineHandlerClean
func NewMedicineHandlerClean(medicineUseCase usecase.MedicineUseCase, userRepo repository.UserRepository) *MedicineHandlerClean {
	return &MedicineHandlerClean{
		medicineUseCase: medicineUseCase,
		userRepo:        userRepo,
	}
}

/*PATEINT*/
func (h *MedicineHandlerClean) GetMedicines(c *gin.Context) {
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}

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

const (
	UploadDir = "uploads/medicine"
)

func init() {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(UploadDir, os.ModePerm); err != nil {
		panic(fmt.Sprintf("Failed to create upload directory: %v", err))
	}
}

func (h *MedicineHandlerClean) AddMedicine(c *gin.Context) {
	// Extract user ID from context
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}

	// Parse user ID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid User ID",
			Message: "User ID format is invalid",
		})
		return
	}

	// Get user data with preloaded pharmacy
	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Internal Server Error",
			Message: "Failed to retrieve user data",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User Not Found",
			Message: "User does not exist",
		})
		return
	}

	// Check if user has a pharmacy associated
	if user.Pharmacy == nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{
			Error:   "No Pharmacy Associated",
			Message: "User is not associated with any pharmacy",
		})
		return
	}

	// Parse multipart form (32MB default, but will accept any size)
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Form Error",
			Message: "Failed to parse form data",
		})
		return
	}

	// Parse and validate request body from form data
	var req types.MedicineAddRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Validation Error",
			Message: err.Error(),
		})
		return
	}

	// Handle image upload
	var imageURL string
	file, header, err := c.Request.FormFile("image")
	if err == nil {
		defer file.Close()

		// Validate file type
		if !isValidImageType(header.Filename) {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{
				Error:   "Invalid File Type",
				Message: "Only JPG, JPEG, PNG, and WEBP images are allowed",
			})
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
		filePath := filepath.Join(UploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Upload Failed",
				Message: "Failed to save image file",
			})
			return
		}

		// Set image URL (relative path or full URL based on your setup)
		imageURL = "/" + filePath
	} else if err != http.ErrMissingFile {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "File Upload Error",
			Message: err.Error(),
		})
		return
	}

	// Set pharmacy ID from user's pharmacy (override any value from request for security)
	req.PharmacyID = user.Pharmacy.ID

	// Create medicine entity
	newMedicine := &entity.Medicine{
		Name:                 req.Name,
		Content:              &req.Content,
		Price:                req.Price,
		Quantity:             req.Quantity,
		Description:          &req.Description,
		PharmacyID:           req.PharmacyID,
		PrescriptionRequired: req.PrescriptionRequired,
		IsActive:             true,
		ImageURL:             &imageURL,
	}

	// Call use case to add medicine
	createdMedicine, err := h.medicineUseCase.AddMedicine(c.Request.Context(), userID, newMedicine)
	if err != nil {
		// Clean up uploaded file if medicine creation fails
		if imageURL != "" {
			os.Remove(strings.TrimPrefix(imageURL, "/"))
		}

		statusCode := http.StatusInternalServerError
		if err.Error() == "pharmacy not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "medicine has already expired" {
			statusCode = http.StatusBadRequest
		}

		c.JSON(statusCode, types.ErrorResponse{
			Error:   "Failed to add medicine",
			Message: err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusCreated, response.Response{
		Success: true,
		Message: "Medicine added successfully",
		Data:    createdMedicine,
	})
}

// isValidImageType checks if the file has a valid image extension
func isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := []string{".jpg", ".jpeg", ".png", ".webp"}

	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}
	return false
}
func (h *MedicineHandlerClean) ListMedicines(c *gin.Context) {
	// Extract user ID from context
	userIDStr := c.GetString("userID")

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	name := c.Query("name")
	content := c.Query("content")
	prescriptionRequired := c.Query("prescription_required")
	isActive := c.Query("is_active")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Build filter object
	filters := types.MedicineFilters{
		Page:      page,
		Limit:     limit,
		Name:      name,
		Content:   content,
		SortBy:    sortBy,
		SortOrder: sortOrder,
	}

	// If user is authenticated, filter by their pharmacy
	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err == nil {
			// Get user data with preloaded pharmacy
			user, err := h.userRepo.GetByID(c.Request.Context(), userID)
			if err == nil && user != nil && user.Pharmacy != nil {
				// Set pharmacy ID filter from user's pharmacy
				filters.PharmacyID = &user.Pharmacy.ID
			}
		}
	}

	// Parse prescription required if provided
	if prescriptionRequired != "" {
		if pr, err := strconv.ParseBool(prescriptionRequired); err == nil {
			filters.PrescriptionRequired = &pr
		}
	}

	// Parse is active if provided
	if isActive != "" {
		if ia, err := strconv.ParseBool(isActive); err == nil {
			filters.IsActive = &ia
		}
	}

	// Call use case
	medicines, total, err := h.medicineUseCase.ListMedicines(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to retrieve medicines",
			Message: err.Error(),
		})
		return
	}

	// Calculate pagination metadata
	//totalPages := (total + int64(limit) - 1) / int64(limit)

	// Return success response
	response.Paginated(c, medicines, page, limit, int(total), "Medicines retrieved successfully")

}
func (h *MedicineHandlerClean) GetMedicineByID(c *gin.Context) {
	// Parse medicine ID from URL parameter
	medicineIDStr := c.Param("id")
	medicineID, err := uuid.Parse(medicineIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Medicine ID",
			Message: "Medicine ID format is invalid",
		})
		return
	}

	// Call use case
	medicine, err := h.medicineUseCase.GetMedicineByID(c.Request.Context(), medicineID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "medicine not found" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, types.ErrorResponse{
			Error:   "Failed to retrieve medicine",
			Message: err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Medicine retrieved successfully",
		Data:    medicine,
	})
}
func (h *MedicineHandlerClean) DeleteMedicine(c *gin.Context) {
	// Extract user ID from context
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}

	// Parse user ID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid User ID",
			Message: "User ID format is invalid",
		})
		return
	}

	// Parse medicine ID from URL parameter
	medicineIDStr := c.Param("id")
	medicineID, err := uuid.Parse(medicineIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Medicine ID",
			Message: "Medicine ID format is invalid",
		})
		return
	}

	// Get user data with preloaded pharmacy
	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Internal Server Error",
			Message: "Failed to retrieve user data",
		})
		return
	}

	if user == nil || user.Pharmacy == nil {
		c.JSON(http.StatusForbidden, types.ErrorResponse{
			Error:   "Forbidden",
			Message: "User is not associated with any pharmacy",
		})
		return
	}

	// Call use case to delete medicine
	imageURL, err := h.medicineUseCase.DeleteMedicine(c.Request.Context(), userID, medicineID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "medicine not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "unauthorized to delete this medicine" {
			statusCode = http.StatusForbidden
		}

		c.JSON(statusCode, types.ErrorResponse{
			Error:   "Failed to delete medicine",
			Message: err.Error(),
		})
		return
	}

	// Delete image file if exists
	if imageURL != "" {
		filePath := strings.TrimPrefix(imageURL, "/")
		os.Remove(filePath)
	}

	// Return success response
	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Medicine deleted successfully",
	})
}
