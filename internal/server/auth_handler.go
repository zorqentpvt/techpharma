package server

import (
	"net/http"
	"os"
	"time"

	models "techpharma/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// JWT secret key - get from environment variable or use default
var jwtSecretKey = func() []byte {
	key := os.Getenv("JWT_SECRET_KEY")
	if key == "" {
		key = "your-secret-key-here" // Change this in production!
	}
	return []byte(key)
}()

// JWT Claims structure
type Claims struct {
	UserID   uint   `json:"user_id"`
	Email    string `json:"email"`
	UserType string `json:"user_type"`
	jwt.RegisteredClaims
}

// signin handles user authentication
func (s *Server) signin(c *gin.Context) {
	var req models.SigninRequest

	// Bind and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get GORM database instance
	db := s.db.Gorm()

	// Find user by email
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := s.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

// signup handles user registration
func (s *Server) signup(c *gin.Context) {
	var req models.SignupRequest

	// Bind and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get GORM database instance
	db := s.db.Gorm()

	// Check if user already exists
	var existingUser models.User
	if err := db.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not hash password"})
		return
	}

	// Set default user type if not provided
	userType := req.UserType
	if userType == "" {
		userType = "user"
	}

	// Create new user
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		FullName: req.FullName,
		UserType: userType,
		Phone:    req.Phone,
		Address:  req.Address,
	}

	// Save user to database
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
		return
	}

	// Generate JWT token
	token, err := s.generateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// Return success response
	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

// generateJWT creates a JWT token for the user
func (s *Server) generateJWT(user models.User) (string, error) {
	// Create claims
	claims := Claims{
		UserID:   user.UserID,
		Email:    user.Email,
		UserType: user.UserType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token expires in 24 hours
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString(jwtSecretKey)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// AuthMiddleware validates JWT tokens
func (s *Server) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecretKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract claims
		if claims, ok := token.Claims.(*Claims); ok {
			c.Set("user_id", claims.UserID)
			c.Set("email", claims.Email)
			c.Set("user_type", claims.UserType)
		}

		c.Next()
	}
}
