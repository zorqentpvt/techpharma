package types

import (
	"time"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
)

// tygo:emit
// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"userName" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// tygo:emit
// LoginResponse represents a login response
type LoginResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	ExpiresAt    time.Time   `json:"expiresAt"`
	User         entity.User `json:"user"`
	FirstTime    bool        `json:"firsttime"`            // Indicates if it's the user's first login
	ResetToken   string      `json:"resetToken,omitempty"` // Optional reset token for first-time login
}

// tygo:emit
// RegisterRequest represents a user registration request
type RegisterRequest struct {
	FirstName   string          `json:"firstName"`
	LastName    string          `json:"lastName"`
	PhoneNumber string          `json:"phoneNumber"`
	Password    string          `json:"password"`
	Email       *string         `json:"email,omitempty"`
	Address     *AddressRequest `json:"address,omitempty"`     // Now an object
	ContactInfo *ContactRequest `json:"contactInfo,omitempty"` // Optional contact info as a JSON string
	RoleID      *uuid.UUID      `json:"roleId,omitempty"`      // ADD THIS FIELD
}

// tygo:emit

type CreateUserRequest struct {
	// Basic fields
	FirstName   string `form:"firstname" json:"firstname" binding:"required"`
	LastName    string `form:"lastname" json:"lastname" binding:"required"`
	Username    string `form:"username" json:"username" binding:"required"`
	Email       string `form:"email" json:"email" binding:"required,email"`
	Password    string `form:"password" json:"password" binding:"required,min=6"`
	CPassword   string `form:"cpassword" json:"cpassword" binding:"required"`
	PhoneNumber string `form:"num" json:"num" binding:"required"`
	Address     string `form:"address" json:"address"`
	DateOfBirth string `form:"dob" json:"dob" binding:"required"`
	Gender      string `form:"gen" json:"gen" binding:"required"`
	RoleID      string `form:"role" json:"role,omitempty"`

	// Doctor-specific fields
	SpecializationID    string `form:"specialization" json:"specialization,omitempty"`
	LicenseNumber       string `form:"licenseNumber" json:"licenseNumber,omitempty"`
	Qualification       string `form:"qual" json:"qual,omitempty"`
	StateMedicalCouncil string `form:"stateMedicalCouncil" json:"stateMedicalCouncil,omitempty"`
	YearOfPassing       int    `form:"yearOfPassing" json:"yearOfPassing,omitempty"`

	// Pharmacy-specific fields
	PharmacyName    string `form:"pharmacyName" json:"pharmacyName,omitempty"`
	PharmacyAddress string `form:"paddress" json:"paddress,omitempty"`
	GSTNumber       string `form:"gstnumber" json:"gstnumber,omitempty"`
	PharmacyPhone   string `form:"pnum" json:"pnum,omitempty"`

	Category                     string `form:"category" json:"category,omitempty"`
	IsFreeMedicineEnabled        bool   `form:"isFreeMedicineEnabled" json:"isFreeMedicineEnabled,omitempty"`
	GovernmentRegistrationNumber string `form:"governmentRegistrationNumber" json:"governmentRegistrationNumber,omitempty"`
	JanAushadhiID                string `form:"janAushadhiId" json:"janAushadhiId,omitempty"`
}

// tygo:emit
// AddressRequest represents a user's address details
type AddressRequest struct {
	Address    string  `jason:"address"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	Street     string  `json:"street"`
	City       string  `json:"city"`
	State      string  `json:"state"`
	Country    string  `json:"country"`
	PostalCode string  `json:"postalCode"`
}

type ContactRequest struct {
	PrimaryPhone   string  `json:"primaryPhone"`
	SecondaryPhone *string `json:"secondaryPhone,omitempty"`
	Email          *string `json:"email,omitempty"`
	Website        *string `json:"website,omitempty"`
}

// tygo:emit
// UpdateUserRequest represents a user update request
type UpdateUserRequest struct {
	/*FirstName   string          `json:"firstName,omitempty"`
	LastName    string          `json:"lastName,omitempty"`
	Email       *string         `json:"email,omitempty"`
	PhoneNumber string          `json:"phoneNumber,omitempty"`
	Address     *AddressRequest `json:"address,omitempty"`     // Now an object
	ContactInfo *ContactRequest `json:"contactInfo,omitempty"` // Optional contact info as a JSON string
	RoleID      string          `json:"RoleId,omitempty"`
	*/                                      // ADD THIS FIELD
	Status string `json:"status,omitempty"` // e.g., "active", "inactive"

}
type UpdateUserResponse struct {
	UserID  uuid.UUID `json:"userId"`
	Message string    `json:"message"`
}

// tygo:emit
// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	CurrentPassword         string `json:"currentPassword" binding:"required"`
	NewPassword             string `json:"newPassword" binding:"required"`
	NewPasswordConfirmation string `json:"newPasswordConfirmation" binding:"required"`
}

// tygo:emit
// UserListResponse represents a paginated user list response
type UserListResponse struct {
	Users       []entity.User `json:"users"`
	Total       int           `json:"total"`
	Page        int           `json:"page"`
	Limit       int           `json:"limit"`
	ID          uuid.UUID     `json:"id"`
	FirstName   string        `json:"first_name"`
	LastName    string        `json:"last_name"`
	DisplayName *string       `json:"display_name,omitempty"`
	Email       *string       `json:"email,omitempty"`
	PhoneNumber string        `json:"phone_number"`
	Status      string        `json:"status"`
	FileURL     *string       `json:"fileURL,omitempty"`
	Role        *RoleInfo     `json:"role,omitempty"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

// tygo:emit
// CreateRoleRequest represents a role creation request
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// tygo:emit
// UpdateRoleRequest represents a role update request
type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"isActive"`
}

// tygo:emit
// AssignRoleRequest represents a role assignment request
type AssignRoleRequest struct {
	UserID uint `json:"userId" binding:"required"`
	RoleID uint `json:"roleId" binding:"required"`
}

// tygo:emit
// CreatePermissionRequest represents a permission creation request
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Resource    string `json:"resource" binding:"required"`
	Action      string `json:"action" binding:"required"`
}

// tygo:emit
// UpdatePermissionRequest represents a permission update request
type UpdatePermissionRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	IsActive    *bool  `json:"isActive"`
}

// tygo:emit
// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// tygo:emit
// RefreshTokenResponse represents a token refresh response
type RefreshTokenResponse struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

// tygo:emit
// RegisterResponse represents a user registration response
type RegisterResponse struct {
	UserID  uuid.UUID `json:"userId"`
	Message string    `json:"message"`
}

// tygo:emit
// TokenValidationResponse represents a token validation response
type TokenValidationResponse struct {
	Valid  bool        `json:"valid"`
	UserID uuid.UUID   `json:"userId"`
	Email  string      `json:"email"`
	Role   string      `json:"role"`
	Claims interface{} `json:"claims,omitempty"`
}

// tygo:emit
// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// tygo:emit
// SuccessResponse represents a success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// tygo:emit
// TokenPair represents an access and refresh token pair
type TokenPair struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	ExpiresAt    time.Time `json:"expiresAt"`
}

// tygo:emit
// ForgotPasswordRequest represents a forgot password request
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// tygo:emit
// ResetPasswordRequest represents a reset password request
type ResetPasswordRequest struct {
	ResetToken      string `json:"resetToken" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=NewPassword"`
}

// tygo:emit
// RoleResponse represents a role response
type RoleResponse struct {
	RoleID   uuid.UUID `json:"role_id"`
	Name     string    `json:"name"`
	IsActive bool      `json:"is_active"`
}
type EmailRequest struct {
	To       string
	Subject  string
	Template string
	Data     map[string]interface{}
}

// tygo:emit
// CollageResponse represents a collage response

type UserListFilters struct {
	Role    string `form:"role" json:"role"`
	Status  string `form:"status" json:"status"`
	College string `form:"college" json:"college"`
	Search  string `form:"search" json:"search"`
}

// PaginationOptions represents pagination parameters
type PaginationOptions struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	SortField string `json:"sort_field,omitempty"`
	SortOrder string `json:"sort_order,omitempty"`
}

// UserListResponse represents a user in the list response

// RoleInfo represents role information in user response
type RoleInfo struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Code string    `json:"code"`
}

// CollegeInfo represents college information in user response

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success    bool                   `json:"success"`
	Data       interface{}            `json:"data"`
	Message    string                 `json:"message"`
	Pagination PaginationMeta         `json:"pagination"`
	Filters    map[string]interface{} `json:"filters,omitempty"` // Added to show applied filters
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	CurrentPage  int   `json:"current_page"`
	TotalPages   int   `json:"total_pages"`
	TotalItems   int64 `json:"total_items"`
	ItemsPerPage int   `json:"items_per_page"`
	HasNext      bool  `json:"has_next"`
	HasPrevious  bool  `json:"has_previous"`
}

// UserListResult represents the result from use case
type UserListResult struct {
	Users      []*entity.User `json:"users"`
	Pagination PaginationMeta `json:"pagination"`
}

type UpdateAvatarRequest struct {
	Avatar *string `form:"avatar" json:"avatar"`
}

type UpdateProfileRequest struct {
	FirstName       *string             `json:"firstName,omitempty"`
	LastName        *string             `json:"lastName,omitempty"`
	Email           *string             `json:"email,omitempty"`
	UserName        *string             `json:"username,omitempty"`
	Status          *string             `json:"status,omitempty"`
	IsActive        *bool               `json:"isActive,omitempty"`
	IsEmailVerified *bool               `json:"isEmailVerified,omitempty"`
	IsPhoneVerified *bool               `json:"isPhoneVerified,omitempty"`
	DisplayName     *string             `json:"displayName,omitempty"`
	PhoneNumber     *string             `json:"phoneNumber,omitempty"`
	Language        string              `json:"language,omitempty"`
	Avatar          *string             `json:"avatar,omitempty"`
	DateOfBirth     *string             `json:"dateOfBirth,omitempty"`
	Gender          *string             `json:"gender,omitempty"`
	Address         *entity.GeoLocation `json:"address,omitempty"`
	ContactInfo     *entity.ContactInfo `json:"contactInfo,omitempty"`
	RoleID          *string             `json:"roleId,omitempty"`

	// Pharmacy-specific fields
	Pharmacy *Pharmacy `json:"pharmacy,omitempty"`
	Doctor   *Doctor   `json:"doctor,omitempty"`
}
type Pharmacy struct {
	PharmacyName                 *string  `json:"name,omitempty"`
	PharmacyAddress              *string  `json:"address,omitempty"`
	Latitude                     *float64 `json:"latitude,omitempty"`
	Longitude                    *float64 `json:"longitude,omitempty"`
	City                         *string  `json:"city,omitempty"`
	Country                      *string  `json:"country,omitempty"`
	PostalCode                   *string  `json:"postalCode,omitempty"`
	State                        *string  `json:"state,omitempty"`
	LicenseNumber                *string  `json:"licenseNumber,omitempty"`
	GSTNumber                    *string  `json:"gstNumber,omitempty"`
	PharmacyPhone                *string  `json:"pharmacyPhone,omitempty"`
	Category                     *string  `json:"category,omitempty"`
	IsFreeMedicineEnabled        *bool    `json:"isFreeMedicineEnabled,omitempty"`
	GovernmentRegistrationNumber *string  `json:"governmentRegistrationNumber,omitempty"`
	JanAushadhiID                *string  `json:"janAushadhiId,omitempty"`
}
type Doctor struct {
	IsActive            *bool    `json:"isActive,omitempty"`
	SpecializationID    *string  `json:"specializationId,omitempty"`
	LicenseNumber       *string  `json:"licenseNumber,omitempty"`
	Qualification       *string  `json:"qualification,omitempty"`
	Experience          *int     `json:"experience,omitempty"`
	ConsultationFee     *float64 `json:"consultationFee,omitempty"`
	StateMedicalCouncil *string  `json:"stateMedicalCouncil,omitempty"`
	YearOfPassing       *int     `json:"yearOfPassing,omitempty"`
}
type MedicineRequest struct {
	SearchQuery string  `json:"searchQuery"`
	Latitude    float64 `json:"latitude,omitempty"`
	Longitude   float64 `json:"longitude,omitempty"`
	Radius      int     `json:"radius,omitempty" default:"20"`
}
type DoctorRequest struct {
	Query string `json:"query"`
}
type RemoveFromCartRequest struct {
	MedicineID uuid.UUID `json:"medicine_id" binding:"required"`
}

/*
type MedicineAddRequest struct {
	Name                 string    `json:"name" binding:"required"`
	Quantity             int       `json:"quantity" binding:"required"`
	Content              string    `json:"content" binding:"required"`
	PharmacyID           uuid.UUID `json:"pharmacyId" binding:"required"`
	Description          string    `json:"description,omitempty"`
	Price                float64   `json:"price" binding:"required"`
	PrescriptionRequired bool      `gorm:"default:false" json:"prescriptionRequired"`
	ImageURL             string    `gorm:"type:varchar(500)" json:"image,omitempty"`
}*/
// Update your MedicineAddRequest struct
type MedicineAddRequest struct {
	Name                 string     `form:"name" json:"name" binding:"required"`
	Content              string     `form:"content" json:"content" binding:"required"`
	Price                float64    `form:"price" json:"price" binding:"required,gt=0"`
	Quantity             int        `form:"quantity" json:"quantity" binding:"required,gte=0"`
	Description          string     `form:"description" json:"description"`
	PharmacyID           uuid.UUID  `form:"pharmacy_id" json:"pharmacy_id"`
	PrescriptionRequired bool       `form:"prescriptionRequired" json:"prescriptionRequired"`
	ExpiryDate           *time.Time `form:"expiryDate" json:"expiryDate" time_format:"2006-01-02"`
	ImageURL             *string    `form:"imageURL" json:"imageURL"`
}
type MedicineResponse struct {
	ID                   uuid.UUID  `json:"id"`
	Name                 string     `json:"name"`
	Content              *string    `json:"content,omitempty"`
	Description          *string    `json:"description,omitempty"`
	Manufacturer         *string    `json:"manufacturer,omitempty"`
	BatchNumber          *string    `json:"batchNumber,omitempty"`
	ExpiryDate           *time.Time `json:"expiryDate,omitempty"`
	Price                float64    `json:"price"`
	Quantity             int        `json:"quantity"`
	PrescriptionRequired bool       `json:"prescriptionRequired"`
	PharmacyID           uuid.UUID  `json:"pharmacyId"`
	IsActive             bool       `json:"isActive"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}
type MedicineFilters struct {
	Page                 int
	Limit                int
	Name                 string
	Content              string
	PharmacyID           *uuid.UUID
	PrescriptionRequired *bool
	IsActive             *bool
	IsFreeScheme         *bool
	SortBy               string
	SortOrder            string
}
type CreateOrderRequest struct {
	Amount          string  `form:"amount" json:"amount" binding:"required,gt=0"`
	Currency        string  `form:"currency" json:"currency" binding:"required"`
	MedicineID      *string `form:"medicineId" json:"medicineId" binding:"omitempty"`
	Quantity        *string `form:"quantity" json:"quantity" binding:"omitempty,gt=0"`
	Description     string  `form:"description" json:"description"`
	CartID          *string `form:"cartId" json:"cartId"`
	DeliveryAddress string  `form:"deliveryAddress" json:"deliveryAddress"`
	PrescriptionURL string  `form:"-" json:"prescriptionURL"`
	Notes           string  `form:"notes" json:"notes"`
}

type VerifyPaymentRequest struct {
	OrderID           string `json:"orderId" binding:"required"`
	RazorpayOrderID   string `json:"razorpayOrderId" binding:"required"`
	RazorpayPaymentID string `json:"razorpayPaymentId" binding:"required"`
	RazorpaySignature string `json:"razorpaySignature" binding:"required"`
}

type OrderResponse struct {
	OrderID         string                 `json:"orderId"`
	RazorpayOrderID string                 `json:"razorpayOrderId"`
	MedicineID      *uuid.UUID             `json:"medicineId"`
	Quantity        *int64                 `json:"quantity"`
	Amount          float64                `json:"amount"`
	Currency        string                 `json:"currency"`
	RazorpayKeyID   string                 `json:"razorpayKeyId"`
	Notes           map[string]interface{} `json:"notes"`
}

type PaymentStatusResponse struct {
	OrderID           string  `json:"orderId"`
	RazorpayOrderID   string  `json:"razorpayOrderId"`
	RazorpayPaymentID string  `json:"razorpayPaymentId"`
	Status            string  `json:"status"`
	Amount            float64 `json:"amount"`
	Currency          string  `json:"currency"`
	PaymentMethod     string  `json:"paymentMethod"`
}
type AppointmentRequest struct {
	PatientID     uuid.UUID                `json:"patientId" `
	DoctorID      uuid.UUID                `json:"doctorId" binding:"required"`
	Reason        string                   `json:"reason" binding:"required"`
	Mode          entity.AppointmentMode   `json:"mode" binding:"required"`
	SelectedSlots []entity.AppointmentSlot `json:"selectedSlots" binding:"required,min=1,max=5"`
}

type Slot struct {
	SlotID        string `json:"slotId"`        // <- Add this (BookedSlot.ID)
	AppointmentID string `json:"appointmentId"` // Keep this too if needed
	Date          string `json:"date"`
	Time          string `json:"time"`
}

// ScheduleSlotRequest represents a single slot in the schedule request from the frontend.
type ScheduleSlotRequest struct {
	Date string `json:"date" binding:"required"` // Format: "YYYY-MM-DD"
	Time string `json:"time" binding:"required"` // Format: "HH:MM"
	Mode string `json:"mode" binding:"required"`
}

type ScheduleAppointmentRequest struct {
	DoctorID        uuid.UUID `json:"-"`
	PatientID       uuid.UUID `json:"patientID"`
	AppointmentID   uuid.UUID `json:"appointmentID"`
	SlotID          uuid.UUID `json:"slotID"`
	JitsiID         string    `json:"jitsiID"`
	AppointmentDate *string   `json:"date"`
	AppointmentTime *string   `json:"time"`
	AppointmentMode *string   `json:"mode"`
}

type DoctorScheduleResponse struct {
	ID            string `json:"id"`
	Patient       string `json:"patient"`
	PatientID     string `json:"patientId"`
	Reason        string `json:"reason"`
	Mode          string `json:"mode"`
	Status        string `json:"status"`
	SelectedSlots []Slot `json:"selectedSlots"`
}

// tygo:emit
type UpdateAppointmentStatusRequest struct {
	DoctorID  uuid.UUID                `json:"doctorId" binding:"required"`
	PatientID uuid.UUID                `json:"patientId" binding:"required"`
	Date      string                   `json:"date" binding:"required"` // Format: "YYYY-MM-DD"
	Time      string                   `json:"time" binding:"required"` // Format: "HH:MM"
	Status    entity.AppointmentStatus `json:"status" binding:"required"`
}

type OpChartResponse struct {
	ID           uuid.UUID `json:"id"`
	Diagnosis    string    `json:"diagnosis"`
	Prescription string    `json:"prescription"`
	DoctorNotes  string    `json:"doctorNotes"`
	Date         string    `json:"date"`
	Time         string    `json:"time"`
}

type ConsultationResponse struct {
	ID                    uuid.UUID        `json:"id"`
	SlotID                uuid.UUID        `json:"slotId"`
	JitsiID               string           `json:"jitsiId"`
	DoctorID              uuid.UUID        `json:"doctorId"`
	PatientID             uuid.UUID        `json:"patientId"`
	Name                  string           `json:"name"`
	DoctorName            string           `json:"doctorName"`
	DoctorSpecialization  string           `json:"doctorSpecialization"`
	DoctorConsultationFee int64            `json:"doctorConsultationFee"`
	DoctorPhoneNumber     string           `json:"doctorPhoneNumber"`
	IsDoctorMeeting       bool             `json:"isDoctorMeeting"`
	IsPatientMeeting      bool             `json:"isPatientMeeting"`
	Time                  string           `json:"time"`
	Date                  string           `json:"date"`
	Status                string           `json:"status"`
	Mode                  string           `json:"mode,omitempty"`
	Reason                string           `json:"reason,omitempty"`
	Diagnosis             string           `json:"diagnosis,omitempty"`
	Prescription          string           `json:"prescription,omitempty"`
	Notes                 string           `json:"notes,omitempty"`
	OpChart               *OpChartResponse `json:"opChart,omitempty"`
}

type ConsultationsResponse struct {
	Upcoming []ConsultationResponse `json:"upcoming"`
	History  []ConsultationResponse `json:"history"`
}
type ListPharmacyOrders struct {
	Status string `json:"status" binding:"omitempty"`

	Page  int `json:"page"`
	Limit int `json:"limit"`
}
type ConfirmedSlotResponse struct {
	AppointmentDate *string `json:"date"`
	AppointmentTime *string `json:"time"`
}
type ConfirmedSlotRequest struct {
	DocID uuid.UUID `json:"docId"`
}
type CompleteConsultationRequest struct {
	AppointmentID uuid.UUID `json:"appointmentId" binding:"required"`
	SlotID        uuid.UUID `json:"slotId"`

	Diagnosis    string `json:"diagnosis" binding:"required"`
	Prescription string `json:"prescription" binding:"required"`
	DoctorNotes  string `json:"doctorNotes"`
}

// tygo:emit
// DashboardStatsResponse represents dashboard statistics
type DashboardStatsResponse struct {
	ActiveDoctors      int64 `json:"activeDoctors"`
	InactiveDoctors    int64 `json:"inactiveDoctors"`
	ActivePharmacies   int64 `json:"activePharmacies"`
	InactivePharmacies int64 `json:"inactivePharmacies"`
	TotalUsers         int64 `json:"totalUsers"`
}

type AppointmentStatsResponse struct {
	UpcomingAppointments   []UpcomingAppointment `json:"upcomingAppointments"`
	TodaysPatients         []TodaysPatient       `json:"todaysPatients"`
	TotalPatientsCount     int64                 `json:"totalPatientsCount"`
	TodayAppointmentsCount int64                 `json:"todayAppointmentsCount"`
}

type UpcomingAppointment struct {
	ID          uuid.UUID `json:"id"`
	PatientName string    `json:"patientName"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Mode        string    `json:"mode"`
	Status      string    `json:"status"`
}

type TodaysPatient struct {
	PatientID     uuid.UUID `json:"patientId"`
	AppointmentID uuid.UUID `json:"appointmentId"`
	Name          string    `json:"name"`
	Age           int       `json:"age"`
	Gender        string    `json:"gender"`
	Time          time.Time `json:"time"`
	Reason        string    `json:"reason"`
}

type FreeMedicineOrderRequest struct {
	CartID     uuid.UUID `json:"cartId" binding:"required"`
	PharmacyID uuid.UUID `json:"pharmacyId" binding:"required"`
}

type RegistryData struct {
	Name                string `json:"name"`
	RegistrationNumber  string `json:"registrationNumber"`
	StateMedicalCouncil string `json:"stateMedicalCouncil"`
	YearOfPassing       int    `json:"yearOfPassing"`
}

type VerificationResult struct {
	MatchStatus  string       `json:"matchStatus"`
	RegistryData RegistryData `json:"registryData"`
	LocalData    RegistryData `json:"localData"`
	Reason       string       `json:"reason,omitempty"`
	NMCDoctorID  int          `json:"nmcDoctorId,omitempty"` // ← add this
}

type UpdateDoctorVerifyStatusRequest struct {
	IsVerified bool `json:"isVerified"`
}
