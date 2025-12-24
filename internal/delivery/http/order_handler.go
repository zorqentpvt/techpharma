package http

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

type OrderHandlerClean struct {
	orderUseCase   usecase.OrderUseCase
	paymentUseCase *usecase.PaymentUseCase
}

func NewOrderHandlerClean(orderUseCase usecase.OrderUseCase, paymentUseCase *usecase.PaymentUseCase) *OrderHandlerClean {
	return &OrderHandlerClean{
		orderUseCase:   orderUseCase,
		paymentUseCase: paymentUseCase,
	}
}

// AddToCartRequest represents the request body for adding items to cart
type AddToCartRequest struct {
	MedicineID uuid.UUID `json:"medicine_id" binding:"required"`
	Quantity   int       `json:"quantity" binding:"required,min=1"`
}

func (o *OrderHandlerClean) AddToCart(c *gin.Context) {
	// Get user ID from context (key is "userID")
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convert to UUID
	var userID uuid.UUID
	var err error

	switch v := userIDValue.(type) {
	case string:
		userID, err = uuid.Parse(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
			return
		}
	case uuid.UUID:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unexpected user ID type"})
		return
	}

	// Parse request body
	var req AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create cart medicine item
	cartMedicine := entity.CartMedicine{
		MedicineID: req.MedicineID,
		Quantity:   req.Quantity,
	}

	// Create or update cart
	cart := &entity.Cart{
		UserID:    userID,
		Medicines: []entity.CartMedicine{cartMedicine},
	}

	// Call use case to add to cart
	if err := o.orderUseCase.AddToCart(c.Request.Context(), cart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to add to cart",
			"details": err.Error(),
		})
		return
	}

	// Fetch the complete cart with all details
	fullCart, err := o.orderUseCase.GetCart(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "item added but failed to retrieve cart details",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "item added to cart successfully",
		"cart":    fullCart,
	})
}
func (o *OrderHandlerClean) GetCart(c *gin.Context) {
	// Get user ID from context (key is "userID")
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convert to UUID
	var userID uuid.UUID
	var err error

	switch v := userIDValue.(type) {
	case string:
		userID, err = uuid.Parse(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
			return
		}
	case uuid.UUID:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unexpected user ID type"})
		return
	}

	// Call use case to get cart
	cart, err := o.orderUseCase.GetCart(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to get cart",
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Data:    cart,
		Message: "Cart retrieved successfully",
	})
}
func (o *OrderHandlerClean) RemoveFromCart(c *gin.Context) {
	// Get user ID from context
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convert to UUID
	var userID uuid.UUID
	var err error

	switch v := userIDValue.(type) {
	case string:
		userID, err = uuid.Parse(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
			return
		}
	case uuid.UUID:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unexpected user ID type"})
		return
	}

	// Parse request body
	var req types.RemoveFromCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Remove from cart
	if err := o.orderUseCase.RemoveFromCart(c.Request.Context(), userID, req.MedicineID); err != nil {
		if err.Error() == "cart not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "cart not found"})
			return
		}
		if err.Error() == "medicine not found in cart" {
			c.JSON(http.StatusNotFound, gin.H{"error": "medicine not found in cart"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "failed to remove item from cart",
			"details": err.Error(),
		})
		return
	}

	// Fetch updated cart
	cart, err := o.orderUseCase.GetCart(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "item removed from cart successfully",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "item removed from cart successfully",
		"data":    cart,
	})
}
func (o *OrderHandlerClean) UpdateCart(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	// Parse request body
	var req struct {
		MedicineID string `json:"medicine_id" binding:"required"`
		Quantity   int    `json:"quantity" binding:"required,min=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
		return
	}

	// Parse UUIDs
	userUUID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	medicineUUID, err := uuid.Parse(req.MedicineID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid medicine ID",
		})
		return
	}

	// Call use case
	cart, err := o.orderUseCase.UpdateCart(c.Request.Context(), userUUID, medicineUUID, req.Quantity)
	if err != nil {
		statusCode := http.StatusInternalServerError
		message := err.Error()

		// Map specific errors to appropriate status codes
		switch message {
		case "cart not found":
			statusCode = http.StatusNotFound
		case "item not found in cart":
			statusCode = http.StatusNotFound
		case "medicine not found":
			statusCode = http.StatusNotFound
		case "medicine is not active":
			statusCode = http.StatusBadRequest
		case "quantity cannot be negative":
			statusCode = http.StatusBadRequest
		default:
			if len(message) > 4 && message[:4] == "only" {
				// "only X units available" error
				statusCode = http.StatusBadRequest
			}
		}

		c.JSON(statusCode, gin.H{
			"success": false,
			"message": message,
		})
		return
	}

	// Determine success message
	message := "Cart updated successfully"
	if req.Quantity == 0 {
		message = "Item removed from cart successfully"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": message,
		"data":    cart,
	})
}
func (o *OrderHandlerClean) GetUserOrders(c *gin.Context) {
	// Get user ID from context
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User ID not found in context",
			},
		})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID format",
			},
		})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	// Get orders
	orders, total, err := o.paymentUseCase.GetUserOrders(c.Request.Context(), userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "FETCH_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	// Return paginated response
	response.Paginated(c, orders, page, limit, int(total), "Orders retrieved successfully")
}

// GetOrderByID retrieves a specific order by ID
func (o *OrderHandlerClean) GetOrderByID(c *gin.Context) {
	// Get user ID from context for authorization
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User ID not found in context",
			},
		})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID format",
			},
		})
		return
	}

	// Parse order ID from URL
	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_ORDER_ID",
				Message: "Invalid order ID format",
			},
		})
		return
	}

	// Get order
	order, err := o.paymentUseCase.GetOrderByID(c.Request.Context(), orderID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "order not found" {
			statusCode = http.StatusNotFound
		}

		c.JSON(statusCode, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "FETCH_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	// Check if order belongs to user
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "FORBIDDEN",
				Message: "You don't have permission to view this order",
			},
		})
		return
	}

	// Return order
	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Order retrieved successfully",
		Data:    order,
	})
}

// GetPharmacyOrders retrieves orders for a specific pharmacy
func (o *OrderHandlerClean) GetPharmacyOrders(c *gin.Context) {
	// Get user ID from context
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User ID not found in context",
			},
		})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID format",
			},
		})
		return
	}

	pharmacy, err := o.orderUseCase.GetPharmacyByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "PHARMACY_NOT_FOUND",
				Message: "Pharmacy not found for this user",
			},
		})
		return
	}

	// ADD THIS CHECK
	if pharmacy == nil {
		c.JSON(http.StatusNotFound, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "PHARMACY_NOT_FOUND",
				Message: "No pharmacy associated with this user",
			},
		})
		return
	}

	var filters types.ListPharmacyOrders
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_PARAMETERS",
				Message: err.Error(),
			},
		})
		return
	}
	if filters.Page < 1 {
		filters.Page = 1
	}
	if filters.Limit < 1 {
		filters.Limit = 10
	}

	// Get orders
	orders, total, err := o.orderUseCase.GetPharmacyOrders(c.Request.Context(), pharmacy.ID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "FETCH_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	type MedicineResponse struct {
		Name     string `json:"name"`
		Quantity int    `json:"quantity"`
	}

	type OrderResponse struct {
		ID            string             `json:"id"`
		CustomerName  string             `json:"customerName"`
		CustomerPhone string             `json:"customerPhone"`
		Medicines     []MedicineResponse `json:"medicines"`
		TotalAmount   float64            `json:"totalAmount"`
		Status        string             `json:"status"`
		OrderDate     time.Time          `json:"orderDate"`
		Pharmacy      string             `json:"pharmacy"`
	}

	orderResponses := []OrderResponse{}
	for _, order := range orders {
		medicines := []MedicineResponse{}
		for _, item := range order.OrderItems {
			medicines = append(medicines, MedicineResponse{
				Name:     item.Medicine.Name,
				Quantity: item.Quantity,
			})
		}

		orderResponses = append(orderResponses, OrderResponse{
			ID:            order.ID.String(),
			CustomerName:  order.User.FirstName + " " + order.User.LastName,
			CustomerPhone: order.User.PhoneNumber,
			Medicines:     medicines,
			TotalAmount:   order.TotalAmount,
			Status:        order.Status,
			OrderDate:     order.CreatedAt,
			Pharmacy:      pharmacy.Name,
		})
	}

	// Return paginated response
	response.Paginated(c, orderResponses, filters.Page, filters.Limit, int(total), "Pharmacy orders retrieved successfully")
}

// UpdateOrderStatus updates the status of an order
func (o *OrderHandlerClean) UpdateOrderStatus(c *gin.Context) {
	// Get user ID from context
	userIDStr := c.GetString("userID")
	if userIDStr == "" {
		c.JSON(http.StatusUnauthorized, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User ID not found in context",
			},
		})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID format",
			},
		})
		return
	}

	// Parse order ID from URL
	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_ORDER_ID",
				Message: "Invalid order ID format",
			},
		})
		return
	}

	// Parse request body
	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    "INVALID_PARAMETERS",
				Message: err.Error(),
			},
		})
		return
	}

	// Call use case
	if err := o.orderUseCase.UpdateOrderStatus(c.Request.Context(), orderID, req.Status, userID); err != nil {
		statusCode := http.StatusInternalServerError
		errorCode := "UPDATE_ERROR"

		switch err.Error() {
		case "order not found":
			statusCode = http.StatusNotFound
			errorCode = "ORDER_NOT_FOUND"
		case "unauthorized":
			statusCode = http.StatusForbidden
			errorCode = "FORBIDDEN"
		case "invalid status":
			statusCode = http.StatusBadRequest
			errorCode = "INVALID_STATUS"
		}

		c.JSON(statusCode, response.Response{
			Success: false,
			Error: &response.ErrorInfo{
				Code:    errorCode,
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Order status updated successfully",
	})
}
