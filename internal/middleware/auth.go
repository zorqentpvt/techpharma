package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWT secret key - should match the one in auth_handlers.go
var jwtSecretKey = []byte("your-secret-key-here")

// Claims structure - should match the one in auth_handlers.go
type Claims struct {
	UserID   uint   `json:"user_id"`
	Email    string `json:"email"`
	UserType string `json:"user_type"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check Bearer prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecretKey, nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract claims
		if claims, ok := token.Claims.(*Claims); ok && token.Valid {
			// Set user info in context
			c.Set("user_id", claims.UserID)
			c.Set("email", claims.Email)
			c.Set("user_type", claims.UserType)
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}
	}
}

// RequireRole middleware checks if user has required role
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User type not found"})
			c.Abort()
			return
		}

		if userType != role {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
