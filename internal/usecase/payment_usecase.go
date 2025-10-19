package usecase

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/razorpay/razorpay-go"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
)

type PaymentUseCase struct {
	paymentRepo    repository.PaymentRepository
	orderRepo      repository.OrderRepository
	razorpayKey    string
	razorpaySecret string
	client         *razorpay.Client
}

func NewPaymentUseCase(
	paymentRepo repository.PaymentRepository,
	orderRepo repository.OrderRepository,
	razorpayKey string,
	razorpaySecret string,
) *PaymentUseCase {
	client := razorpay.NewClient(razorpayKey, razorpaySecret)
	return &PaymentUseCase{
		paymentRepo:    paymentRepo,
		orderRepo:      orderRepo,
		razorpayKey:    razorpayKey,
		razorpaySecret: razorpaySecret,
		client:         client,
	}
}
func (u *PaymentUseCase) CreateOrder(ctx context.Context, userID uuid.UUID, req types.CreateOrderRequest) (*types.OrderResponse, error) {
	// Generate unique order ID (max 40 chars for Razorpay receipt)
	// Using timestamp + random string to keep it under 40 characters
	timestamp := time.Now().Unix()
	shortUUID := uuid.New().String()[:8] // Take first 8 chars of UUID
	orderID := fmt.Sprintf("ORD%d%s", timestamp, shortUUID)

	// Ensure it's under 40 characters (should be ~18-20 chars)
	if len(orderID) > 40 {
		orderID = orderID[:40]
	}

	// Convert amount to paise (Razorpay expects amount in smallest currency unit)
	amountInPaise := int(req.Amount * 100)

	// Prepare Razorpay order data
	data := map[string]interface{}{
		"amount":   amountInPaise,
		"currency": req.Currency,
		"receipt":  orderID,
	}

	if req.Notes != nil {
		data["notes"] = req.Notes
	}

	// Create order in Razorpay
	body, err := u.client.Order.Create(data, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create razorpay order: %w", err)
	}

	razorpayOrderID := body["id"].(string)

	// Parse cart ID if provided
	var cartID *uuid.UUID
	if req.CartID != nil && *req.CartID != "" {
		cid, err := uuid.Parse(*req.CartID)
		if err == nil {
			cartID = &cid
		}
	}

	// Convert notes to JSON string
	notesJSON := ""
	if req.Notes != nil {
		notesBytes, _ := json.Marshal(req.Notes)
		notesJSON = string(notesBytes)
	}

	// Save payment record in database
	payment := &entity.Payment{
		OrderID:         orderID,
		Amount:          req.Amount,
		Currency:        req.Currency,
		UserID:          userID,
		CartID:          cartID,
		RazorpayOrderID: razorpayOrderID,
		Status:          "pending",
		Description:     req.Description,
		Notes:           notesJSON,
		DeliveryAddress: req.DeliveryAddress,
	}

	if err := u.paymentRepo.Create(ctx, payment); err != nil {
		return nil, fmt.Errorf("failed to save payment: %w", err)
	}

	return &types.OrderResponse{
		OrderID:         orderID,
		RazorpayOrderID: razorpayOrderID,
		Amount:          req.Amount,
		Currency:        req.Currency,
		RazorpayKeyID:   u.razorpayKey,
		Notes:           req.Notes,
	}, nil
}

func (u *PaymentUseCase) VerifyPayment(ctx context.Context, req types.VerifyPaymentRequest) (*types.PaymentStatusResponse, error) {
	// Get payment from database
	payment, err := u.paymentRepo.GetByOrderID(ctx, req.OrderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}
	if payment == nil {
		return nil, errors.New("payment not found")
	}

	// Verify signature
	message := req.RazorpayOrderID + "|" + req.RazorpayPaymentID
	if !u.verifySignature(message, req.RazorpaySignature) {
		// Update payment status to failed
		u.paymentRepo.UpdateStatus(ctx, req.OrderID, "failed", req.RazorpayPaymentID, "", "", "Invalid signature")
		return nil, errors.New("invalid payment signature")
	}

	// Fetch payment details from Razorpay
	paymentData, err := u.client.Payment.Fetch(req.RazorpayPaymentID, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch payment from razorpay: %w", err)
	}

	paymentMethod := ""
	if method, ok := paymentData["method"].(string); ok {
		paymentMethod = method
	}

	// Update payment status to success
	err = u.paymentRepo.UpdateStatus(
		ctx,
		req.OrderID,
		"success",
		req.RazorpayPaymentID,
		req.RazorpaySignature,
		paymentMethod,
		"",
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update payment status: %w", err)
	}

	return &types.PaymentStatusResponse{
		OrderID:           req.OrderID,
		RazorpayOrderID:   req.RazorpayOrderID,
		RazorpayPaymentID: req.RazorpayPaymentID,
		Status:            "success",
		Amount:            payment.Amount,
		Currency:          payment.Currency,
		PaymentMethod:     paymentMethod,
	}, nil
}

func (u *PaymentUseCase) GetPaymentStatus(ctx context.Context, orderID string) (*types.PaymentStatusResponse, error) {
	payment, err := u.paymentRepo.GetByOrderID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}
	if payment == nil {
		return nil, errors.New("payment not found")
	}

	return &types.PaymentStatusResponse{
		OrderID:           payment.OrderID,
		RazorpayOrderID:   payment.RazorpayOrderID,
		RazorpayPaymentID: payment.RazorpayPaymentID,
		Status:            payment.Status,
		Amount:            payment.Amount,
		Currency:          payment.Currency,
		PaymentMethod:     payment.PaymentMethod,
	}, nil
}

func (u *PaymentUseCase) GetUserPayments(ctx context.Context, userID uuid.UUID, page, limit int) ([]*entity.Payment, int64, error) {
	return u.paymentRepo.GetUserPayments(ctx, userID, page, limit)
}

func (u *PaymentUseCase) verifySignature(message, signature string) bool {
	mac := hmac.New(sha256.New, []byte(u.razorpaySecret))
	mac.Write([]byte(message))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}
