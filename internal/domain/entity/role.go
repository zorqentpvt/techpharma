package entity

import (
	"encoding/json"
)

// tygo:emit
// Role represents system roles with hierarchical permissions
type Role struct {
	BaseModel
	// Basic information
	Name        string  `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`
	Code        string  `gorm:"type:varchar(50);not null;uniqueIndex" json:"code"`
	Description *string `gorm:"type:text" json:"description,omitempty"`

	// Role hierarchy and categorization
	Category string `gorm:"type:varchar(100);not null;index" json:"category"`
	Level    int    `gorm:"type:int;not null;default:1" json:"level"`

	// Role configuration
	IsSystemRole bool `gorm:"default:false" json:"isSystemRole"` // Cannot be deleted
	IsDefault    bool `gorm:"default:false" json:"isDefault"`
	IsActive     bool `gorm:"default:true;index" json:"isActive"`
	DisplayOrder int  `gorm:"type:int;default:0" json:"displayOrder"`

	// Access control
	MaxUsers *int   `gorm:"type:int" json:"maxUsers,omitempty"`
	Scope    string `gorm:"type:varchar(50);default:'business'" json:"scope"` // system, collage, department, student

	// Role metadata
	Color *string `gorm:"type:varchar(20)" json:"color,omitempty"`
	Icon  *string `gorm:"type:varchar(100)" json:"icon,omitempty"`

	// Additional configuration
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	// Relationships
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions,omitempty"`
}

// tygo:emit
// Permission represents granular system permissions
type Permission struct {
	BaseModel
	// Basic information
	Name        string  `gorm:"type:varchar(100);not null" json:"name"`
	Code        string  `gorm:"type:varchar(100);not null;uniqueIndex" json:"code"`
	Description *string `gorm:"type:text" json:"description,omitempty"`

	// Permission categorization
	Module   string `gorm:"type:varchar(100);not null;index" json:"module"`
	Resource string `gorm:"type:varchar(100);not null" json:"resource"`
	Action   string `gorm:"type:varchar(50);not null" json:"action"`

	// Permission hierarchy
	Category    string  `gorm:"type:varchar(100);not null" json:"category"`
	SubCategory *string `gorm:"type:varchar(100)" json:"subCategory,omitempty"`

	// Permission configuration
	IsSystemPermission bool `gorm:"default:false" json:"isSystemPermission"`
	IsActive           bool `gorm:"default:true;index" json:"isActive"`
	RequiresApproval   bool `gorm:"default:false" json:"requiresApproval"`
	IsFullAccess       bool `gorm:"default:false" json:"isFullAccess"`

	// Access level and scope
	AccessLevel string `gorm:"type:varchar(50);default:'read'" json:"accessLevel"` // read, write, delete, admin
	Scope       string `gorm:"type:varchar(50);default:'own'" json:"scope"`        // own, department, business, system

	// Dependencies and conflicts
	Dependencies  json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"dependencies"`
	ConflictsWith json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"conflictsWith"`

	// Display and grouping
	DisplayOrder int     `gorm:"type:int;default:0" json:"displayOrder"`
	GroupName    *string `gorm:"type:varchar(100)" json:"groupName,omitempty"`

	// Additional information
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	// Relationships
	Roles []Role `gorm:"many2many:role_permissions;" json:"roles,omitempty"`
}

// tygo:emit
// UserRole represents user-role assignments

// Role methods
func (r *Role) IsActiveRole() bool {
	return r.IsActive
}

func (r *Role) CanBeDeleted() bool {
	return !r.IsSystemRole
}

func (r *Role) GetHierarchyLevel() int {
	return r.Level
}

func (r *Role) IsWithinUserLimit(currentUsers int) bool {
	if r.MaxUsers == nil {
		return true
	}
	return currentUsers < *r.MaxUsers
}

// Permission methods
func (p *Permission) IsActivePermission() bool {
	return p.IsActive
}

func (p *Permission) CanBeDeleted() bool {
	return !p.IsSystemPermission
}

func (p *Permission) GetFullCode() string {
	return p.Module + ":" + p.Resource + ":" + p.Action
}

func (p *Permission) RequiresApprovalCheck() bool {
	return p.RequiresApproval
}

func (p *Permission) IsHighPrivilege() bool {
	return p.IsFullAccess || p.AccessLevel == "admin" || p.Action == "delete"
}

// UserRole methods
