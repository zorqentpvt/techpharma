package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

type DeliveryHandlerClean struct {
	deliveryUseCase usecase.DeliveryUseCase
}

func NewDeliveryHandlerClean(deliveryUseCase usecase.DeliveryUseCase) *DeliveryHandlerClean {
	return &DeliveryHandlerClean{
		deliveryUseCase: deliveryUseCase,
	}
}

func (h *DeliveryHandlerClean) AddDeliveryAgent(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	var req usecase.AddDeliveryAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Bad Request",
			Message: err.Error(),
		})
		return
	}

	agent, err := h.deliveryUseCase.AddDeliveryAgent(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to add delivery agent",
			Message: err.Error(),
		})
		return
	}

	response.Success(c, agent, "Delivery agent added successfully")
}

func (h *DeliveryHandlerClean) GetPharmacyAgents(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	agents, err := h.deliveryUseCase.GetPharmacyAgents(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to fetch agents", Message: err.Error()})
		return
	}

	response.Success(c, agents, "Delivery agents retrieved successfully")
}

func (h *DeliveryHandlerClean) AssignOrder(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "Invalid user ID"})
		return
	}

	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid order ID"})
		return
	}

	var req struct {
		AgentID string `json:"agentId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: err.Error()})
		return
	}

	agentID, err := uuid.Parse(req.AgentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid agent ID"})
		return
	}

	err = h.deliveryUseCase.AssignOrder(c.Request.Context(), userID, orderID, agentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to assign order", Message: err.Error()})
		return
	}

	response.Success(c, nil, "Order assigned to agent successfully")
}

func (h *DeliveryHandlerClean) GetDeliveryOrders(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	orders, err := h.deliveryUseCase.GetDeliveryOrders(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to fetch orders", Message: err.Error()})
		return
	}

	response.Success(c, orders, "Delivery orders retrieved successfully")
}

func (h *DeliveryHandlerClean) UpdateDeliveryStatus(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid order ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: err.Error()})
		return
	}

	err = h.deliveryUseCase.UpdateDeliveryStatus(c.Request.Context(), userID, orderID, req.Status)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: order not assigned to this agent" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "order not found" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, types.ErrorResponse{Error: "Failed to update status", Message: err.Error()})
		return
	}

	response.Success(c, nil, "Order status updated successfully")
}

func (h *DeliveryHandlerClean) UpdateAgentStatus(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{
			Error:   "Unauthorized",
			Message: "Invalid user ID",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: err.Error()})
		return
	}

	err = h.deliveryUseCase.UpdateAgentStatus(c.Request.Context(), userID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to update status", Message: err.Error()})
		return
	}

	response.Success(c, nil, "Agent status updated successfully")
}

func (h *DeliveryHandlerClean) UpdateDeliveryAgent(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "Invalid user ID"})
		return
	}

	agentIDStr := c.Param("id")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid agent ID"})
		return
	}

	var req usecase.UpdateDeliveryAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: err.Error()})
		return
	}

	err = h.deliveryUseCase.UpdateDeliveryAgent(c.Request.Context(), userID, agentID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to update agent", Message: err.Error()})
		return
	}

	response.Success(c, nil, "Delivery agent updated successfully")
}

func (h *DeliveryHandlerClean) DeleteDeliveryAgent(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "Invalid user ID"})
		return
	}

	agentIDStr := c.Param("id")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid agent ID"})
		return
	}

	err = h.deliveryUseCase.DeleteDeliveryAgent(c.Request.Context(), userID, agentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to delete agent", Message: err.Error()})
		return
	}

	response.Success(c, nil, "Delivery agent deleted successfully")
}

func (h *DeliveryHandlerClean) UnassignOrder(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "Unauthorized", Message: "Invalid user ID"})
		return
	}

	orderIDStr := c.Param("id")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "Bad Request", Message: "Invalid order ID"})
		return
	}

	if err := h.deliveryUseCase.UnassignOrder(c.Request.Context(), userID, orderID); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "Failed to unassign order", Message: err.Error()})
		return
	}

	response.Success(c, nil, "Agent removed from order successfully")
}
