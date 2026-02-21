// payment_handler.go
package http

import (
	"context"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/delivery/http/response"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
	"github.com/skryfon/collex/pkg/config"
)

type PaymentHandler struct {
	paymentUseCase *usecase.PaymentUseCase
	userRepo       repository.UserRepository
	config         *config.Config
}

// NewPaymentHandlerClean creates a new payment handler
func NewPaymentHandlerClean(
	paymentUseCase *usecase.PaymentUseCase,
	userRepo repository.UserRepository,
	config *config.Config,
) *PaymentHandler {
	if paymentUseCase == nil {
		panic("paymentUseCase cannot be nil")
	}
	if userRepo == nil {
		panic("userRepo cannot be nil")
	}
	if config == nil {
		panic("config cannot be nil")
	}
	return &PaymentHandler{
		paymentUseCase: paymentUseCase,
		userRepo:       userRepo,
		// Add other dependencies here
		config: config,
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
	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to get user",
			Message: err.Error(),
		})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "User not found",
			Message: "User profile not found",
		})
		return
	}
	// Parse request
	var req types.CreateOrderRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Validation Error",
			Message: err.Error(),
		})
		return
	}

	if req.DeliveryAddress == "" {
		parts := []string{
			user.Address.Address,
			user.Address.City,
			user.Address.State,
			user.Address.Country,
			user.Address.PostalCode,
		}
		var validParts []string
		for _, p := range parts {
			if strings.TrimSpace(p) != "" {
				validParts = append(validParts, strings.TrimSpace(p))
			}
		}
		req.DeliveryAddress = strings.Join(validParts, ", ")
	}
	fmt.Printf("Delivery Address: %s\n", req.DeliveryAddress)

	// Handle prescription file upload
	file, header, err := c.Request.FormFile("prescriptionURL")
	if err == nil {
		defer file.Close()

		// Validate file extension
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext != ".pdf" && ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{
				Error:   "Invalid request",
				Message: "Prescription must be a PDF, JPG, JPEG, or PNG file",
			})
			return
		}

		// Create directory
		uploadDir := "uploads/prescriptions"
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
				Message: "Could not save prescription file",
			})
			return
		}

		req.PrescriptionURL = filepath.ToSlash(filePath)
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

	// Send WhatsApp Confirmation (Async)
	go func() {
		// Fetch order and user details to send notification
		// Note: Ensure req.OrderId is a valid UUID. If using custom IDs, adjust parsing logic.
		order, err := h.paymentUseCase.GetOrderByOrderID(context.Background(), req.OrderID)
		if err != nil {
			fmt.Printf("Failed to get order '%s': %v\n", req.OrderID, err)
			return
		}

		user, err := h.userRepo.GetByID(context.Background(), order.UserID)
		if err != nil {
			fmt.Printf("Failed to get user '%s': %v\n", order.UserID, err)
			return
		}

		if user.Email != nil && *user.Email != "" {
			h.sendEmailConfirmation(
				*user.Email,
				user.FirstName,
				order.OrderNumber,
				time.Now().Format("2006-01-02"),
				fmt.Sprintf("%.2f", order.Payment.Amount),
				"Online",
			)
		}
	}()

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

// sendWhatsAppConfirmation sends a WhatsApp message using Fast2SMS

// sendEmailConfirmation sends an email using SMTP
func (h *PaymentHandler) sendEmailConfirmation(to, name, invoiceID, date, amount, method string) {
	// TODO: Move these credentials to your configuration file
	from := h.config.Email.FromEmail
	password := h.config.Email.Password
	const (
		smtpHost = "smtp.gmail.com"
		smtpPort = "587"
	)

	subject := "Order Confirmation - TechPharma"
	invoiceURL := fmt.Sprintf("http://localhost:8080/static/invoice.html?order=%s", invoiceID)

	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body>
<p>Dear %s,</p>

<p>Thank you for your purchase at TechPharma! 💊</p>

<p>Your invoice #%s dated %s has been generated.</p>

<h3>📄 Invoice Details:</h3>
<ul>
<li>Total Amount: ₹%s</li>
<li>Payment Method: %s</li>
</ul>

<p>Please click the button below to view your invoice:</p>
<a href="%s" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 4px;">View Invoice</a>

<p>If you have any questions about your medicines or order, feel free to reach out!</p>

<p>We appreciate your trust in us and hope for your well-being! 🏥</p>

<p>Best regards,<br>
TechPharma Team<br>
Online Pharmacy & Healthcare</p>

<p>Powered By TechPharma</p>
</body>
</html>`, name, invoiceID, date, amount, method, invoiceURL)

	msg := []byte("From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=\"utf-8\"\r\n" +
		"\r\n" +
		body + "\r\n")

	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, msg)
	if err != nil {
		fmt.Printf("Failed to send email: %v\n", err)
	}
}
func (h *PaymentHandler) GenerateInvoice(c *gin.Context) {
	orderID := c.Param("orderId")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid Request",
			Message: "Order ID is required",
		})
		return
	}

	order, err := h.paymentUseCase.GetOrderByOrderID(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to retrieve order",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response.Response{
		Success: true,
		Message: "Invoice generated successfully",
		Data:    order,
	})
}
