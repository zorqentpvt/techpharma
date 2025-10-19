// payment_handler.go
package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

type PaymentHandler struct {
	paymentUseCase *usecase.PaymentUseCase
	userRepo       repository.UserRepository
}

// NewPaymentHandlerClean creates a new payment handler
func NewPaymentHandlerClean(
	paymentUseCase *usecase.PaymentUseCase,
	userRepo repository.UserRepository,
) *PaymentHandler {
	if paymentUseCase == nil {
		panic("paymentUseCase cannot be nil")
	}
	if userRepo == nil {
		panic("userRepo cannot be nil")
	}

	return &PaymentHandler{
		paymentUseCase: paymentUseCase,
		userRepo:       userRepo,
	}
}

// CreateOrder creates a new payment order
func (h *PaymentHandler) CreateOrder(c *gin.Context) {
	// Get user ID from context
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

	// Parse request
	var req types.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Validation Error",
			Message: err.Error(),
		})
		return
	}

	// Set default currency if not provided
	if req.Currency == "" {
		req.Currency = "INR"
	}

	// Create order
	orderResp, err := h.paymentUseCase.CreateOrder(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to create order",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, response.Response{
		Success: true,
		Message: "Order created successfully",
		Data:    orderResp,
	})
}

// VerifyPayment verifies the payment signature
func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	var req types.VerifyPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Validation Error",
			Message: err.Error(),
		})
		return
	}

	paymentStatus, err := h.paymentUseCase.VerifyPayment(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Payment verification failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Payment verified successfully",
		Data:    paymentStatus,
	})
}

// GetPaymentStatus gets the status of a payment
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	orderID := c.Param("orderId")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Request",
			Message: "Order ID is required",
		})
		return
	}

	paymentStatus, err := h.paymentUseCase.GetPaymentStatus(c.Request.Context(), orderID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "payment not found" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, types.ErrorResponse{
			Error:   "Failed to get payment status",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Payment status retrieved successfully",
		Data:    paymentStatus,
	})
}

// GetUserPayments gets all payments for a user
func (h *PaymentHandler) GetUserPayments(c *gin.Context) {
	// Get user ID from context
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

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Get payments
	payments, total, err := h.paymentUseCase.GetUserPayments(c.Request.Context(), userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to retrieve payments",
			Message: err.Error(),
		})
		return
	}

	response.Paginated(c, payments, page, limit, int(total), "Payments retrieved successfully")
}
