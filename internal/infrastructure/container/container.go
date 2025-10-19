// Updated container/container.go
package container

import (
	"github.com/skryfon/collex/internal/domain/repository"
	"github.com/skryfon/collex/internal/domain/service"
	"github.com/skryfon/collex/internal/infrastructure/database"
	"github.com/skryfon/collex/internal/infrastructure/persistence"
	infraService "github.com/skryfon/collex/internal/infrastructure/service"
	"github.com/skryfon/collex/internal/usecase"
	"github.com/skryfon/collex/pkg/config"
)

// Container holds all application dependencies following clean architecture
type Container struct {
	// Configuration
	Config *config.Config

	// Infrastructure Layer
	Database *database.Database

	// Repository Layer (Infrastructure -> Domain)
	UserRepository     repository.UserRepository
	AuditLogRepository repository.AuditLogRepository
	SecurityRepository repository.SecurityEventRepository
	MedicineRepository repository.MedicineRepository
	DoctorRepository   repository.DoctorRepository
	OrderRepository    repository.OrderRepository

	// Domain Services
	AuthService  service.AuthService
	TokenService service.TokenService
	EmailService service.EmailService // ✅ Added Email Service

	// Use Cases (Application Layer)
	AuthUseCase     usecase.AuthUseCase
	UserUseCase     usecase.UserUseCase
	MedicineUseCase usecase.MedicineUseCase
	DoctorUseCase   usecase.DoctorUseCase
	OrderUsecase    usecase.OrderUseCase
}

// NewContainer creates a new dependency injection container
func NewContainer(config *config.Config, db *database.Database) *Container {
	container := &Container{
		Config:   config,
		Database: db,
	}

	// Initialize repositories (Infrastructure Layer)
	container.initRepositories()

	// Initialize domain services
	container.initDomainServices()

	// Initialize use cases (Application Layer)
	container.initUseCases()

	return container
}

// initRepositories initializes all repository implementations
func (c *Container) initRepositories() {
	c.UserRepository = persistence.NewUserRepository(c.Database.DB)
	c.AuditLogRepository = persistence.NewAuditLogRepository(c.Database.DB)
	c.SecurityRepository = persistence.NewSecurityEventRepository(c.Database.DB)
	c.MedicineRepository = persistence.NewMedicineRepository(c.Database.DB)
	c.DoctorRepository = persistence.NewDoctorRepository(c.Database.DB)
	c.OrderRepository = persistence.NewOrderRepository(c.Database.DB)
}

// initDomainServices initializes domain services
func (c *Container) initDomainServices() {
	c.TokenService = infraService.NewTokenService(c.Config)
	c.AuthService = infraService.NewAuthService(c.UserRepository)
	c.EmailService = infraService.NewEmailService(c.Config) // ✅ Initialize Email Service
}

// initUseCases initializes all use cases
func (c *Container) initUseCases() {
	c.AuthUseCase = usecase.NewAuthUseCase(
		c.UserRepository,
		c.AuditLogRepository,
		c.SecurityRepository,
		c.TokenService,
		c.AuthService,
		c.EmailService, // ✅ Pass Email Service to AuthUseCase
		c.Config,
	)
	c.UserUseCase = usecase.NewUserUseCase(
		c.UserRepository,
		c.EmailService, // ✅ Pass Email Service to UserUseCase
	)
	c.MedicineUseCase = usecase.NewMedicineUseCase(
		c.MedicineRepository,
		c.UserRepository,
	)
	c.DoctorUseCase = usecase.NewDoctorUseCase(
		c.DoctorRepository,
	)
	c.OrderUsecase = usecase.NewOrderUseCase(
		c.OrderRepository,
	)
}

// GetAuthUseCase returns the authentication use case
func (c *Container) GetAuthUseCase() usecase.AuthUseCase {
	return c.AuthUseCase
}

// GetUserUseCase returns the user use case
func (c *Container) GetUserUseCase() usecase.UserUseCase {
	return c.UserUseCase
}

// GetMedicineUseCase returns the medicine use case
func (c *Container) GetMedicineUseCase() usecase.MedicineUseCase {
	return c.MedicineUseCase
}
func (c *Container) GetDoctorUseCase() usecase.DoctorUseCase {
	return c.DoctorUseCase
}

// GetTokenService returns the token service
func (c *Container) GetTokenService() service.TokenService {
	return c.TokenService
}

// GetAuthService returns the authentication service
func (c *Container) GetAuthService() service.AuthService {
	return c.AuthService
}

// GetEmailService returns the email service ✅ Added getter
func (c *Container) GetEmailService() service.EmailService {
	return c.EmailService
}

// GetUserRepository returns the user repository
func (c *Container) GetUserRepository() repository.UserRepository {
	return c.UserRepository
}
