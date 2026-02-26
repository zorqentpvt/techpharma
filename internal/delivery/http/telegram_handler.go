package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"github.com/skryfon/collex/internal/usecase"
)

// UserState represents the current state of the user in the bot flow
type UserState int

const (
	StateStart UserState = iota
	StateWaitingEmail
	StateSelectingSpec
	StateSelectingDoctor
	StateSelectingDate
	StateSelectingTime
)

type UserSession struct {
	UserID       uuid.UUID
	State        UserState
	BookingDraft BookingDraft
	Options      map[int]string
}

type BookingDraft struct {
	SpecializationID string
	DoctorID         uuid.UUID
	Date             string
	Time             string
}

type TelegramHandler struct {
	appointmentUseCase usecase.AppoinmentUseCase
	userRepo           repository.UserRepository
	doctorUseCase      usecase.DoctorUseCase
	sessions           map[int64]*UserSession
	mu                 sync.RWMutex
	botToken           string
	httpClient         *http.Client
}

func NewTelegramHandler(
	appointmentUseCase usecase.AppoinmentUseCase,
	userRepo repository.UserRepository,
	doctorUseCase usecase.DoctorUseCase,
	botToken string,
) *TelegramHandler {
	return &TelegramHandler{
		appointmentUseCase: appointmentUseCase,
		userRepo:           userRepo,
		doctorUseCase:      doctorUseCase,
		sessions:           make(map[int64]*UserSession),
		botToken:           botToken,
		httpClient:         &http.Client{Timeout: 10 * time.Second},
	}
}

// Telegram structures
type TelegramUpdate struct {
	UpdateID int              `json:"update_id"`
	Message  *TelegramMessage `json:"message"`
}

type TelegramMessage struct {
	MessageID int           `json:"message_id"`
	From      *TelegramUser `json:"from"`
	Chat      *TelegramChat `json:"chat"`
	Text      string        `json:"text"`
}

type TelegramUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

type TelegramChat struct {
	ID int64 `json:"id"`
}

type telegramSendMessageRequest struct {
	ChatID int64  `json:"chat_id"`
	Text   string `json:"text"`
}

// HandleWebhook processes incoming updates from Telegram
func (h *TelegramHandler) HandleWebhook(c *gin.Context) {
	var update TelegramUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if update.Message != nil {
		go h.processMessage(update.Message)
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *TelegramHandler) processMessage(msg *TelegramMessage) {
	chatID := msg.Chat.ID
	text := strings.TrimSpace(msg.Text)

	session := h.getSession(chatID)

	if text == "/start" {
		h.updateState(chatID, StateWaitingEmail)
		h.sendMessage(chatID, "Welcome to TechPharma! 👋\nPlease enter your registered email address to verify your identity:")
		return
	}

	if text == "/book" {
		if session.UserID == uuid.Nil {
			h.sendMessage(chatID, "⚠️ Please verify your email first using /start")
			return
		}
		h.startBooking(chatID)
		return
	}

	switch session.State {
	case StateWaitingEmail:
		h.handleEmailVerification(chatID, text)
	case StateSelectingSpec:
		h.handleSpecSelection(chatID, text)
	case StateSelectingDoctor:
		h.handleDoctorSelection(chatID, text)
	case StateSelectingDate:
		h.handleDateSelection(chatID, text)
	case StateSelectingTime:
		h.handleTimeSelection(chatID, text)
	default:
		h.sendMessage(chatID, "Unknown command. Type /start to begin or /book to book an appointment.")
	}
}

func (h *TelegramHandler) getSession(chatID int64) *UserSession {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if session, exists := h.sessions[chatID]; exists {
		return session
	}
	return &UserSession{State: StateStart}
}

func (h *TelegramHandler) updateState(chatID int64, state UserState) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, exists := h.sessions[chatID]; !exists {
		h.sessions[chatID] = &UserSession{}
	}
	h.sessions[chatID].State = state
}

func (h *TelegramHandler) updateSession(chatID int64, updater func(*UserSession)) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if session, exists := h.sessions[chatID]; exists {
		updater(session)
	}
}

func (h *TelegramHandler) handleEmailVerification(chatID int64, email string) {
	user, err := h.userRepo.GetByEmail(context.Background(), email)
	if err != nil || user == nil {
		h.sendMessage(chatID, "❌ Email not found. Please try again or register via the app.")
		return
	}

	h.updateSession(chatID, func(s *UserSession) {
		s.UserID = user.ID
		s.State = StateStart
	})
	h.sendMessage(chatID, fmt.Sprintf("✅ Welcome back, %s! You are now verified.\nType /book to schedule an appointment.", user.FirstName))
}

func (h *TelegramHandler) startBooking(chatID int64) {
	doctors, err := h.doctorUseCase.GetDoctors(context.Background(), "")
	if err != nil {
		h.sendMessage(chatID, "❌ Failed to fetch specializations. Please try again later.")
		return
	}

	specs := make(map[string]bool)
	for _, doc := range doctors {
		specs[doc.SpecializationID] = true
	}

	if len(specs) == 0 {
		h.sendMessage(chatID, "No specializations available at the moment.")
		return
	}

	options := make(map[int]string)
	msg := "🏥 Select a Specialization (reply with the number):\n\n"
	i := 1
	for specID := range specs {
		options[i] = specID
		msg += fmt.Sprintf("%d. %s\n", i, specID)
		i++
	}

	h.updateSession(chatID, func(s *UserSession) {
		s.State = StateSelectingSpec
		s.Options = options
	})
	h.sendMessage(chatID, msg)
}

func (h *TelegramHandler) handleSpecSelection(chatID int64, input string) {
	session := h.getSession(chatID)

	var specID string
	if num, err := strconv.Atoi(input); err == nil {
		if val, ok := session.Options[num]; ok {
			specID = val
		}
	}

	if specID == "" {
		h.sendMessage(chatID, "❌ Invalid selection. Please reply with the number corresponding to the specialization.")
		return
	}

	doctors, err := h.doctorUseCase.GetDoctors(context.Background(), "")
	if err != nil {
		h.sendMessage(chatID, "❌ Failed to fetch doctors.")
		return
	}

	doctorOptions := make(map[int]string)
	msg := "👨‍⚕️ Select a Doctor (reply with the number):\n\n"
	found := false
	count := 1
	for _, doc := range doctors {
		if doc.SpecializationID == specID {
			name := "Doctor"
			if doc.User != nil {
				name = doc.User.FirstName + " " + doc.User.LastName
			}
			doctorOptions[count] = doc.UserID.String()
			msg += fmt.Sprintf("%d. %s\n", count, name)
			count++
			found = true
		}
	}

	if !found {
		h.sendMessage(chatID, "No doctors found for this specialization. Please try another.")
		return
	}

	h.updateSession(chatID, func(s *UserSession) {
		s.BookingDraft.SpecializationID = specID
		s.State = StateSelectingDoctor
		s.Options = doctorOptions
	})
	h.sendMessage(chatID, msg)
}

func (h *TelegramHandler) handleDoctorSelection(chatID int64, input string) {
	session := h.getSession(chatID)

	var doctorIDStr string
	if num, err := strconv.Atoi(input); err == nil {
		if val, ok := session.Options[num]; ok {
			doctorIDStr = val
		}
	}

	if doctorIDStr == "" {
		h.sendMessage(chatID, "❌ Invalid selection. Please reply with the number corresponding to the doctor.")
		return
	}

	doctorID, err := uuid.Parse(doctorIDStr)
	if err != nil {
		h.sendMessage(chatID, "❌ Invalid Doctor ID.")
		return
	}

	h.updateSession(chatID, func(s *UserSession) {
		s.BookingDraft.DoctorID = doctorID
		s.State = StateSelectingDate
		s.Options = nil
	})
	h.sendMessage(chatID, "📅 Please enter the appointment date:\nFormat: YYYY-MM-DD\nExample: 2024-12-25")
}

func (h *TelegramHandler) handleDateSelection(chatID int64, dateStr string) {
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		h.sendMessage(chatID, "❌ Invalid date format. Use YYYY-MM-DD\nExample: 2024-12-25")
		return
	}

	h.updateSession(chatID, func(s *UserSession) {
		s.BookingDraft.Date = dateStr
		s.State = StateSelectingTime
	})
	h.sendMessage(chatID, "🕐 Please enter the appointment time:\nFormat: HH:MM\nExample: 10:00")
}

func (h *TelegramHandler) handleTimeSelection(chatID int64, timeStr string) {
	// Validate time format
	_, err := time.Parse("15:04", timeStr)
	if err != nil {
		h.sendMessage(chatID, "❌ Invalid time format. Use HH:MM\nExample: 10:00")
		return
	}

	session := h.getSession(chatID)

	req := types.AppointmentRequest{
		PatientID:     session.UserID,
		DoctorID:      session.BookingDraft.DoctorID,
		SelectedSlots: []entity.AppointmentSlot{{Date: session.BookingDraft.Date, Time: timeStr}},
		Mode:          entity.AppointmentModeOnline,
		Reason:        "Booked via Telegram",
	}

	_, err = h.appointmentUseCase.BookAppointment(context.Background(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "booked") || strings.Contains(err.Error(), "conflict") {
			h.sendMessage(chatID, "⚠️ This slot is already booked. Please enter a different time:")
			// Keep state at SelectingTime so they can retry
			return
		}
		h.sendMessage(chatID, fmt.Sprintf("❌ Failed to book appointment: %v", err.Error()))
		h.updateState(chatID, StateStart)
		return
	}

	h.sendMessage(chatID, fmt.Sprintf(
		"✅ Appointment booked successfully!\n\n📅 Date: %s\n🕐 Time: %s\n👨‍⚕️ Doctor ID: %s",
		session.BookingDraft.Date,
		timeStr,
		session.BookingDraft.DoctorID,
	))
	h.updateState(chatID, StateStart)
}

func (h *TelegramHandler) sendMessage(chatID int64, text string) {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", h.botToken)

	payload := telegramSendMessageRequest{
		ChatID: chatID,
		Text:   text,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("[Telegram] Failed to marshal message: %v\n", err)
		return
	}

	resp, err := h.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		fmt.Printf("[Telegram] Failed to send message to chat %d: %v\n", chatID, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("[Telegram] Unexpected status %d for chat %d\n", resp.StatusCode, chatID)
	}
}

// SetWebhook registers your HTTPS server URL with Telegram (call once on startup)
func (h *TelegramHandler) SetWebhook(serverURL string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/setWebhook", h.botToken)

	payload := map[string]string{
		"url": serverURL + "/api/telegram/webhook",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	log.Printf("[Telegram] Registering webhook with URL: %s/api/telegram/webhook", serverURL)

	resp, err := h.httpClient.Post(apiURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[Telegram] Response status: %d", resp.StatusCode)
	log.Printf("[Telegram] Response body: %s", string(respBody))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram returned status %d: %s", resp.StatusCode, string(respBody))
	}

	log.Printf("[Telegram] Webhook registered successfully")
	return nil
}
