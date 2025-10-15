package persistence

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/skryfon/collex/internal/domain/entity"
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/types"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) Create(ctx context.Context, user *entity.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	var user entity.User
	if err := r.db.WithContext(ctx).
		Preload("Role").
		Preload("Doctor").
		Preload("Pharmacy").
		First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByPhoneNumber(ctx context.Context, phoneNumber string) (*entity.User, error) {
	var user entity.User
	if err := r.db.WithContext(ctx).
		Preload("Role").
		Preload("Doctor").
		Preload("Pharmacy").
		Where("phone_number = ?", phoneNumber).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	var user entity.User
	if err := r.db.WithContext(ctx).
		Preload("Role").
		Preload("Doctor").
		Preload("Pharmacy").
		Where("email = ?", email).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	log.Printf("User found by email: %s (ID: %s)", email, user.ID)
	return &user, nil
}

// Alternative: If you only need specific role fields, you can use Select to optimize the query
func (r *userRepository) GetByIDWithRoleName(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	var user entity.User
	if err := r.db.WithContext(ctx).
		Preload("UserRole.Role", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, code, description")
		}).
		First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// If you want to get all users with their roles
func (r *userRepository) GetAllWithRoles(ctx context.Context) ([]*entity.User, error) {
	var users []*entity.User
	if err := r.db.WithContext(ctx).
		Preload("UserRole.Role").
		Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// Add the missing GetEmail method

func (r *userRepository) Update(ctx context.Context, user *entity.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entity.User{}, "id = ?", id).Error
}

func (r *userRepository) List(ctx context.Context, limit, offset int) ([]*entity.User, error) {
	var users []*entity.User
	if err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// Check if the roles table actually has data
func (r *userRepository) GetAllRoles(ctx context.Context) ([]*entity.Role, error) {
	var roles []*entity.Role

	if err := r.db.WithContext(ctx).Find(&roles).Error; err != nil {
		return nil, err
	}

	log.Printf("Fetched %d roles", len(roles))

	return roles, nil
}

func (r *userRepository) UpdateUser(ctx context.Context, id uuid.UUID, user *entity.User) error {
	return r.db.WithContext(ctx).Model(&entity.User{}).Where("id = ?", id).
		Select("*"). // This forces GORM to update all fields, including nil ones
		Updates(user).Error
}

func (r *userRepository) ListWithFilters(ctx context.Context, filters types.UserListFilters, limit, offset int, sortField, sortOrder string) ([]*entity.User, int64, error) {
	var users []*entity.User
	var total int64

	// Start building the query
	query := r.db.WithContext(ctx).
		Preload("UserRole.Role").
		Preload("Collage")

	// Apply filters with explicit table names
	if filters.Status != "" {
		query = query.Where("users.status = ?", filters.Status)
	}

	if filters.College != "" {
		// Convert college filter to UUID if it's a UUID, otherwise filter by name
		if collegeUUID, err := uuid.Parse(filters.College); err == nil {
			query = query.Where("users.collage_id = ?", collegeUUID)
		} else {
			query = query.Joins("JOIN collages ON users.collage_id = collages.id").
				Where("collages.name ILIKE ?", "%"+filters.College+"%")
		}
	}

	if filters.Role != "" {
		// Filter by role name or code
		query = query.Joins("JOIN user_roles ON users.user_role_id = user_roles.id").
			Joins("JOIN roles ON user_roles.role_id = roles.id").
			Where("user_roles.is_active = ? AND (roles.name ILIKE ? OR roles.code ILIKE ?)",
				true, "%"+filters.Role+"%", "%"+filters.Role+"%")
	}

	if filters.Search != "" {
		// Search with explicit table prefix for users table
		searchTerm := "%" + filters.Search + "%"
		query = query.Where(
			"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.display_name ILIKE ? OR users.email ILIKE ? OR users.phone_number ILIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	// Get total count for pagination (before applying limit/offset)
	if err := query.Model(&entity.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Build order clause using display_name for name sorting
	var orderClause string

	switch sortField {
	case "first_name":
		// Use display_name for name sorting
		orderClause = "users.display_name " + sortOrder
	case "email":
		orderClause = "users.email " + sortOrder
	case "created_at":
		orderClause = "users.created_at " + sortOrder
	case "updated_at":
		orderClause = "users.updated_at " + sortOrder
	case "status":
		orderClause = "users.status " + sortOrder
	default:
		// Fallback to created_at DESC
		orderClause = "users.created_at DESC"
	}

	// Apply pagination and ordering
	if err := query.Order(orderClause).
		Limit(limit).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
func (r *userRepository) GetRoleByID(ctx context.Context, id uuid.UUID) ([]*entity.Role, error) {
	var role []*entity.Role

	if err := r.db.WithContext(ctx).First(&role, "id = ?", id).Error; err != nil {
		return nil, err
	}

	// Print role details properly
	if len(role) > 0 {
		fmt.Printf("Fetched role: ID=%s, Name=%s, Description=%s\n",
			role[0].ID,
			role[0].Name,
			role[0].Description)
	} else {
		fmt.Println("No role found")
	}

	return role, nil
}

func (r *userRepository) DeleteUser(ctx context.Context, id uuid.UUID) error {

	return r.db.WithContext(ctx).Delete(&entity.User{}, "id = ?", id).Error
}

func (r *userRepository) CreateDoctor(ctx context.Context, user *entity.Doctor) (*entity.Doctor, error) {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}
func (r *userRepository) CreatePharmacy(ctx context.Context, pharmacy *entity.Pharmacy) (*entity.Pharmacy, error) {
	if err := r.db.WithContext(ctx).Create(pharmacy).Error; err != nil {
		return nil, err
	}
	return pharmacy, nil
}
