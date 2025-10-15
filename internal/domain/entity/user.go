package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// tygo:emit
// User represents a system user with enhanced features
type User struct {
	BaseModel
	// Authentication fields
	PhoneNumber     string  `gorm:"type:varchar(20);uniqueIndex;not null" json:"phoneNumber"`
	Email           *string `gorm:"type:varchar(100);uniqueIndex" json:"email,omitempty"`
	Password        string  `gorm:"not null" json:"-"` // Never expose password in JSON
	IsEmailVerified bool    `gorm:"default:false" json:"isEmailVerified"`
	IsPhoneVerified bool    `gorm:"default:true" json:"isPhoneVerified"`

	// Profile fields
	FirstName   string     `gorm:"type:varchar(100);not null" json:"firstName"`
	LastName    string     `gorm:"type:varchar(100);not null" json:"lastName"`
	DisplayName *string    `gorm:"type:varchar(200)" json:"displayName,omitempty"`
	Avatar      *string    `gorm:"type:varchar(500)" json:"avatar,omitempty"`
	DateOfBirth *time.Time `json:"dateOfBirth,omitempty"`
	Gender      *string    `gorm:"type:varchar(20)" json:"gender,omitempty"`

	// Contact and location
	ContactInfo ContactInfo `gorm:"embedded;embeddedPrefix:contact_" json:"contactInfo"`
	Address     GeoLocation `gorm:"embedded;embeddedPrefix:address_" json:"address,omitempty"`

	// System fields
	Status       string     `gorm:"type:varchar(50);default:'active';index" json:"status"`
	LastLoginAt  *time.Time `json:"lastLoginAt,omitempty"`
	RefreshToken *string    `gorm:"type:varchar(500)" json:"-"`

	// Preferences and settings
	Language    string          `gorm:"type:varchar(10);default:'en'" json:"language"`
	Preferences json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"preferences"`

	RoleID *uuid.UUID `gorm:"type:uuid;index" json:"roleId,omitempty"`
	Role   *Role      `gorm:"foreignKey:RoleID" json:"role,omitempty"`

	// Add this: Doctor relationship (one-to-one)
	Doctor   *Doctor   `gorm:"foreignKey:UserID" json:"doctor,omitempty"`
	Pharmacy *Pharmacy `gorm:"foreignKey:UserID" json:"pharmacy,omitempty"`
	// Audit fields
	IsActive       bool       `gorm:"default:true;index" json:"isActive"`
	DeactivatedAt  *time.Time `json:"deactivatedAt,omitempty"`
	DeactivatedBy  *uuid.UUID `gorm:"type:uuid" json:"deactivatedBy,omitempty"`
	FirstTimeLogin bool       `gorm:"default:true" json:"firsttime"`
}

// tygo:emit
// UserSession represents user login sessions
type UserSession struct {
	BaseModel
	UserID uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
	User   User      `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Session details
	SessionToken string  `gorm:"type:varchar(500);not null;uniqueIndex" json:"-"`
	DeviceInfo   string  `gorm:"type:varchar(500)" json:"deviceInfo"`
	IPAddress    string  `gorm:"type:varchar(45)" json:"ipAddress"`
	UserAgent    string  `gorm:"type:text" json:"userAgent"`
	Location     *string `gorm:"type:varchar(200)" json:"location,omitempty"`

	// Session lifecycle
	LoginAt      time.Time  `gorm:"not null" json:"loginAt"`
	LastActiveAt time.Time  `gorm:"not null" json:"lastActiveAt"`
	LogoutAt     *time.Time `json:"logoutAt,omitempty"`
	ExpiresAt    time.Time  `gorm:"not null;index" json:"expiresAt"`

	// Session status
	IsActive bool   `gorm:"default:true;index" json:"isActive"`
	Status   string `gorm:"type:varchar(50);default:'active'" json:"status"`
}

// tygo:emit
// UserActivity represents user activity logs
type UserActivity struct {
	BaseModel
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"userId"`
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	BusinessID *uuid.UUID `gorm:"type:uuid;index" json:"businessId,omitempty"`

	// Activity details
	ActivityType string     `gorm:"type:varchar(100);not null;index" json:"activityType"`
	Action       string     `gorm:"type:varchar(100);not null" json:"action"`
	Resource     string     `gorm:"type:varchar(100)" json:"resource"`
	ResourceID   *uuid.UUID `gorm:"type:uuid" json:"resourceId,omitempty"`

	// Context and metadata
	Description string          `gorm:"type:text" json:"description"`
	Metadata    json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IPAddress   string          `gorm:"type:varchar(45)" json:"ipAddress"`
	UserAgent   string          `gorm:"type:text" json:"userAgent"`

	// Result and status
	Status       string  `gorm:"type:varchar(50)" json:"status"`
	ErrorMessage *string `gorm:"type:text" json:"errorMessage,omitempty"`
}

// User methods
func (u *User) GetFullName() string {
	if u.DisplayName != nil && *u.DisplayName != "" {
		return *u.DisplayName
	}
	return u.FirstName + " " + u.LastName
}

func (u *User) IsVerified() bool {
	return u.IsPhoneVerified && (u.Email == nil || u.IsEmailVerified)
}

func (u *User) CanLogin() bool {
	return u.IsActive && u.Status == "active" && u.IsVerified()
}

func (u *User) GetPrimaryContact() string {
	if u.Email != nil && *u.Email != "" {
		return *u.Email
	}
	return u.PhoneNumber
}

// UserSession methods
func (us *UserSession) IsExpired() bool {
	return time.Now().After(us.ExpiresAt)
}

func (us *UserSession) IsValidSession() bool {
	return us.IsActive && !us.IsExpired() && us.LogoutAt == nil
}

func (us *UserSession) UpdateLastActive() {
	us.LastActiveAt = time.Now()
}

func (us *UserSession) Logout() {
	now := time.Now()
	us.LogoutAt = &now
	us.IsActive = false
	us.Status = "logged_out"
}
