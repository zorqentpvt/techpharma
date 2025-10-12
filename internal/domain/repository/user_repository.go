package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/types"
)

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*entity.User, error) // Changed to uuid.UUID
	GetByPhoneNumber(ctx context.Context, phoneNumber string) (*entity.User, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
	UpdateUser(ctx context.Context, id uuid.UUID, user *entity.User) error
	Delete(ctx context.Context, id uuid.UUID) error // Changed to uuid.UUID
	List(ctx context.Context, limit, offset int) ([]*entity.User, error)
	GetAllRoles(ctx context.Context) ([]*entity.Role, error)
	ListWithFilters(ctx context.Context, filters types.UserListFilters, limit, offset int, sortField, sortOrder string) ([]*entity.User, int64, error)
}

type AuditLogRepository interface {
	// Create adds a new audit log entry to the database.
	Create(ctx context.Context, logEntry *entity.AuditLog) error
}
type SecurityEventRepository interface {
	// Create adds a new security event to the database.
	Create(ctx context.Context, securityEvent *entity.SecurityEvent) error
	SendPasswordResetEmail(ctx context.Context, email string, resetoken string) error
}
type MedicineRepository interface {
	GetMedicines(ctx context.Context, searchQuery string) ([]*entity.Medicine, error)
}
type DoctorRepository interface {
	GetDoctors(ctx context.Context, searchQuery string) ([]*entity.Doctor, error)
}
type OrderRepository interface {
	AddToCart(ctx context.Context, cart *entity.Cart) error
	GetCartByUserID(ctx context.Context, userID uuid.UUID) (*entity.Cart, error)
	RemoveFromCart(ctx context.Context, userID uuid.UUID, medicineID uuid.UUID) error
}
