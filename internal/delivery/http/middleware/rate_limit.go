package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter defines the interface for rate limiting
type RateLimiter interface {
	Allow(key string) bool
	Reset(key string)
}

// TokenBucketRateLimiter implements rate limiting using token bucket algorithm
type TokenBucketRateLimiter struct {
	capacity   int           // Maximum tokens in bucket
	refillRate time.Duration // How often to refill tokens
	tokens     map[string]*tokenBucket
	mu         sync.RWMutex
}

type tokenBucket struct {
	tokens     int
	lastRefill time.Time
}

// NewTokenBucketRateLimiter creates a new rate limiter
func NewTokenBucketRateLimiter(capacity int, refillRate time.Duration) *TokenBucketRateLimiter {
	return &TokenBucketRateLimiter{
		capacity:   capacity,
		refillRate: refillRate,
		tokens:     make(map[string]*tokenBucket),
	}
}

// Allow checks if a request is allowed
func (r *TokenBucketRateLimiter) Allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	bucket, exists := r.tokens[key]

	if !exists {
		bucket = &tokenBucket{
			tokens:     r.capacity - 1, // Start with capacity - 1
			lastRefill: now,
		}
		r.tokens[key] = bucket
		return true
	}

	// Refill tokens based on time passed
	timePassed := now.Sub(bucket.lastRefill)
	tokensToAdd := int(timePassed / r.refillRate)

	if tokensToAdd > 0 {
		bucket.tokens = min(r.capacity, bucket.tokens+tokensToAdd)
		bucket.lastRefill = now
	}

	if bucket.tokens > 0 {
		bucket.tokens--
		return true
	}

	return false
}

// Reset resets the rate limit for a key
func (r *TokenBucketRateLimiter) Reset(key string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.tokens, key)
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter RateLimiter, keyFunc func(c *gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := keyFunc(c)

		if !limiter.Allow(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"retry_after": "60s",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// IPBasedRateLimit creates rate limiting based on IP address
func IPBasedRateLimit(requestsPerMinute int) gin.HandlerFunc {
	limiter := NewTokenBucketRateLimiter(requestsPerMinute, time.Minute)

	return RateLimitMiddleware(limiter, func(c *gin.Context) string {
		return c.ClientIP()
	})
}

// UserBasedRateLimit creates rate limiting based on user ID
func UserBasedRateLimit(requestsPerMinute int) gin.HandlerFunc {
	limiter := NewTokenBucketRateLimiter(requestsPerMinute, time.Minute)

	return RateLimitMiddleware(limiter, func(c *gin.Context) string {
		userID, exists := c.Get("user_id")
		if !exists {
			return c.ClientIP() // Fallback to IP if no user ID
		}
		return "user:" + fmt.Sprintf("%d", userID.(uint))
	})
}

// GlobalRateLimit creates a global rate limit for all requests
func GlobalRateLimit(requestsPerMinute int) gin.HandlerFunc {
	limiter := NewTokenBucketRateLimiter(requestsPerMinute, time.Minute)

	return RateLimitMiddleware(limiter, func(c *gin.Context) string {
		return "global"
	})
}

// TieredRateLimit creates different rate limits for different user roles
func TieredRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			// Anonymous users get lowest rate limit
			limiter := NewTokenBucketRateLimiter(10, time.Minute)
			key := "anon:" + c.ClientIP()

			if !limiter.Allow(key) {
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":       "rate limit exceeded",
					"retry_after": "60s",
				})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		role := userRole.(string)
		var requestsPerMinute int

		switch role {
		case "admin":
			requestsPerMinute = 1000
		case "business_owner":
			requestsPerMinute = 500
		case "office_manager":
			requestsPerMinute = 100
		case "office_staff":
			requestsPerMinute = 100
		case "driver":
			requestsPerMinute = 25
		default:
			requestsPerMinute = 50
		}

		limiter := NewTokenBucketRateLimiter(requestsPerMinute, time.Minute)
		key := "role:" + role + ":" + c.ClientIP()

		if !limiter.Allow(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"retry_after": "60s",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
