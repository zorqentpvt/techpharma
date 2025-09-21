package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents the USER entity in the database
type User struct {
	UserID    uint           `gorm:"primaryKey;autoIncrement" json:"user_id"`
	Username  string         `gorm:"size:100;not null;unique" json:"username"`
	Email     string         `gorm:"size:150;not null;unique" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"` // Hide password in JSON responses
	FullName  string         `gorm:"size:150" json:"full_name"`
	UserType  string         `gorm:"size:50;default:'user'" json:"user_type"`
	Role      string         `gorm:"size:50;default:'patient'" json:"role"` // Changed default to 'patient'
	Phone     string         `gorm:"size:20" json:"phone"`
	Address   string         `gorm:"size:255" json:"address"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName overrides the default table name to "users"
func (User) TableName() string {
	return "users"
}
