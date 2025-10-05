package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	App      AppConfig
	CORS     Cors        // Added CORS configuration
	Email    EmailConfig // ✅ add this
}

type Cors struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
	MaxAge           int
	ExposedHeaders   []string
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string

	// Connection pool settings
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration

	// Migration settings
	AutoMigrate bool
	MigratePath string
}

// JWTConfig holds JWT-related configuration
type JWTConfig struct {
	SecretKey     string
	Expiration    time.Duration
	RefreshExpiry time.Duration
}

// AppConfig holds application-specific configuration
type AppConfig struct {
	Environment string
	LogLevel    string
}

// EmailConfig holds Resend Email Service configuration
type EmailConfig struct {
	Provider         string // e.g. "resend"
	APIKey           string
	FromEmail        string
	FromName         string
	Domain           string // Optional: for DKIM/custom domain
	MaxRetries       int
	BatchSize        int
	RetryBackoff     time.Duration
	APIBaseURL       string        // Optional: for custom API base URL
	HTTPTimeout      time.Duration // Optional: for HTTP client timeout
	UserAgent        string        // Optional: for custom User-Agent header
	InitialBackoff   time.Duration // Optional: for initial backoff delay
	MaxBackoff       time.Duration // Optional: for maximum backoff delay
	BatchConcurrency int           // Optional: for batch processing concurrency
	TemplatePath     string        // Path to template files
	DevBaseUrl       string
}

// LoadConfig loads configuration from environment variables and .env files
func LoadConfig() *Config {
	// Load .env file if it exists
	loadEnvFile()

	return &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			ReadTimeout:  getDurationEnv("SERVER_READ_TIMEOUT", 30*time.Second),
			WriteTimeout: getDurationEnv("SERVER_WRITE_TIMEOUT", 30*time.Second),
			IdleTimeout:  getDurationEnv("SERVER_IDLE_TIMEOUT", 60*time.Second),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			DBName:   getEnv("DB_NAME", "collex"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),

			// Connection pool settings
			MaxOpenConns:    getIntEnv("DB_MAX_OPEN_CONNS", 100),
			MaxIdleConns:    getIntEnv("DB_MAX_IDLE_CONNS", 10),
			ConnMaxLifetime: getDurationEnv("DB_CONN_MAX_LIFETIME", time.Hour),
			ConnMaxIdleTime: getDurationEnv("DB_CONN_MAX_IDLE_TIME", 30*time.Minute),

			// Migration settings
			AutoMigrate: getBoolEnv("DB_AUTO_MIGRATE", true),
			MigratePath: getEnv("DB_MIGRATE_PATH", "migrations"),
		},
		JWT: JWTConfig{
			SecretKey:     getEnv("JWT_SECRET_KEY", "your-secret-key-change-in-production"),
			Expiration:    getDurationEnv("JWT_EXPIRATION", 24*time.Hour),
			RefreshExpiry: getDurationEnv("JWT_REFRESH_EXPIRY", 7*24*time.Hour),
		},
		App: AppConfig{
			Environment: getEnv("APP_ENV", "development"),
			LogLevel:    getEnv("LOG_LEVEL", "info"),
		},
		Email: EmailConfig{
			Provider:         getEnv("EMAIL_PROVIDER", "resend"),
			APIKey:           getEnv("RESEND_API_KEY", ""), // Remove the hardcoded key for security
			FromEmail:        getEnv("EMAIL_FROM_EMAIL", "info@skryfon.com"),
			FromName:         getEnv("EMAIL_FROM_NAME", "Collex"),
			Domain:           getEnv("EMAIL_DOMAIN", "skryfon.com"),
			MaxRetries:       getIntEnv("EMAIL_MAX_RETRIES", 3),
			BatchSize:        getIntEnv("EMAIL_BATCH_SIZE", 50),
			RetryBackoff:     getDurationEnv("EMAIL_RETRY_BACKOFF", 5*time.Second),
			APIBaseURL:       getEnv("EMAIL_API_BASE_URL", "https://api.resend.com"),
			HTTPTimeout:      getDurationEnv("EMAIL_HTTP_TIMEOUT", 15*time.Second),
			UserAgent:        getEnv("EMAIL_USER_AGENT", "CollexEmailService/1.0"),
			InitialBackoff:   getDurationEnv("EMAIL_INITIAL_BACKOFF", 500*time.Millisecond),
			MaxBackoff:       getDurationEnv("EMAIL_MAX_BACKOFF", 10*time.Second),
			BatchConcurrency: getIntEnv("EMAIL_BATCH_CONCURRENCY", 6),
			TemplatePath:     getEnv("EMAIL_TEMPLATE_PATH", "./templates"), // Added template path loading
			DevBaseUrl:       getEnv("DEV_BASE_URL", "collex.com"),
		},

		CORS: Cors{
			AllowedOrigins:   getStringSliceEnv("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:5500", "http://localhost:5173", "http://localhost:8080"}),
			AllowedMethods:   getStringSliceEnv("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
			AllowedHeaders:   getStringSliceEnv("CORS_ALLOWED_HEADERS", []string{"Origin", "Content-Length", "Content-Type", "Authorization"}),
			AllowCredentials: getBoolEnv("CORS_ALLOW_CREDENTIALS", true),
			MaxAge:           getIntEnv("CORS_MAX_AGE", 86400), // Default 1 day
			ExposedHeaders:   getStringSliceEnv("CORS_EXPOSED_HEADERS", []string{"Content-Length", "Content-Type", "Authorization"}),
		},
	}
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// getDurationEnv gets duration environment variable with fallback
func getDurationEnv(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return fallback
}

// getIntEnv gets integer environment variable with fallback
func getIntEnv(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return fallback
}

// getBoolEnv gets boolean environment variable with fallback
func getBoolEnv(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return fallback
}

// getStringSliceEnv gets comma-separated string slice environment variable with fallback
func getStringSliceEnv(key string, fallback []string) []string {
	if value := os.Getenv(key); value != "" {
		// Split by comma and trim whitespace
		parts := strings.Split(value, ",")
		result := make([]string, 0, len(parts))
		for _, part := range parts {
			if trimmed := strings.TrimSpace(part); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return fallback
}

// IsProduction checks if the application is running in production
func (c *Config) IsProduction() bool {
	return c.App.Environment == "production"
}

// IsDevelopment checks if the application is running in development
func (c *Config) IsDevelopment() bool {
	return c.App.Environment == "development"
}

// Validate validates the configuration
func (c *Config) Validate() error {
	// Validate Email configuration
	if c.Email.APIKey == "" {
		return fmt.Errorf("email API key is required")
	}
	if c.Email.FromEmail == "" {
		return fmt.Errorf("email from address is required")
	}
	if c.Email.TemplatePath == "" {
		return fmt.Errorf("email template path is required")
	}

	// Validate JWT configuration
	if c.JWT.SecretKey == "" || c.JWT.SecretKey == "your-secret-key-change-in-production" {
		return fmt.Errorf("JWT secret key must be set and changed from default")
	}

	// Validate Database configuration
	if c.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}
	if c.Database.DBName == "" {
		return fmt.Errorf("database name is required")
	}

	return nil
}

// GetEmailTemplatePathWithFallback returns the email template path with environment-based fallbacks
func (c *Config) GetEmailTemplatePathWithFallback() string {
	if c.Email.TemplatePath != "" {
		return c.Email.TemplatePath
	}

	// Environment-based fallbacks
	switch c.App.Environment {
	case "production":
		return "/app/templates" // Common production path in containers
	case "development":
		return "./templates"
	default:
		return "./templates"
	}
}

// loadEnvFile loads environment variables from container/.env files based on APP_ENV
func loadEnvFile() {
	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	// Define possible env file paths in order of preference
	var envFiles []string

	switch appEnv {
	case "development":
		envFiles = []string{
			"container/.env.dev",
			"container/.env",
			".env.dev",
			".env",
		}
	case "production":
		envFiles = []string{
			"container/.env.prod",
			"container/.env",
			".env.prod",
			".env",
		}
	default:
		envFiles = []string{
			"container/.env." + appEnv,
			"container/.env",
			".env." + appEnv,
			".env",
		}
	}

	// Try to load environment files in order of preference
	loaded := false
	for _, envFile := range envFiles {
		if err := godotenv.Load(envFile); err == nil {
			log.Printf("Loaded environment variables from %s", envFile)
			loaded = true
			break
		}
	}

	if !loaded {
		// No .env file found, this is not an error in production
		// but we should log it in development
		if appEnv == "development" {
			log.Printf("Warning: No .env files found in paths: %v", envFiles)
		}
	}
}
