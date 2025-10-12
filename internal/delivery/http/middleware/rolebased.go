package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/skryfon/collex/internal/delivery/http/response"
)

// RoleBasedAccess creates a role-based access control middleware
func RoleBasedAccess(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user role from context (set by JWTAuth middleware)
		roleValue, exists := c.Get("userRole")
		if !exists {
			response.Forbidden(c, "User role not found in context")
			c.Abort()
			return
		}

		userRole, ok := roleValue.(string)
		if !ok {
			response.Forbidden(c, "Invalid user role format")
			c.Abort()
			return
		}

		// Check if user role is in allowed roles
		for _, role := range allowedRoles {
			if strings.EqualFold(role, userRole) {
				c.Next()
				return
			}
		}

		response.Forbidden(c, "Access denied: insufficient permissions")
		c.Abort()
	}
}
