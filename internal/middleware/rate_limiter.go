package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var loginAttempts = make(map[string]*rateLimitInfo)
var mu sync.Mutex

type rateLimitInfo struct {
	Requests int
	Expires  time.Time
}

// RateLimitMiddleware limits to 5 requests per 1 minute per IP
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		mu.Lock()
		info, exists := loginAttempts[ip]
		if !exists || time.Now().After(info.Expires) {
			info = &rateLimitInfo{
				Requests: 1,
				Expires:  time.Now().Add(window),
			}
			loginAttempts[ip] = info
		} else {
			info.Requests++
			if info.Requests > maxRequests {
				mu.Unlock()
				c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many login attempts. Please try again later."})
				c.Abort()
				return
			}
		}
		mu.Unlock()

		c.Next()
	}
}
