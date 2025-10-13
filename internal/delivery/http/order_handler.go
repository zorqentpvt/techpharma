package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

type OrderHandlerClean struct {
	orderUseCase usecase.OrderUseCase
}

func NewOrderHandlerClean(orderUseCase usecase.OrderUseCase) *OrderHandlerClean {
	return &OrderHandlerClean{
		orderUseCase: orderUseCase,
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
