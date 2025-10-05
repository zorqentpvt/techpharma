// internal/infrastructure/service/retry_backoff.go
package service

import (
	"math"
	"time"
)

// RetryBackoff defines the interface for retry backoff strategies
type RetryBackoff interface {
	NextBackoff(attempt int) time.Duration
}

// ExponentialBackoff implements exponential backoff with jitter
type ExponentialBackoff struct {
	initialBackoff time.Duration
	maxBackoff     time.Duration
	multiplier     float64
}

// NewExponentialBackoff creates a new exponential backoff strategy
func NewExponentialBackoff(initialBackoff, maxBackoff time.Duration) RetryBackoff {
	return &ExponentialBackoff{
		initialBackoff: initialBackoff,
		maxBackoff:     maxBackoff,
		multiplier:     2.0,
	}
}

// NextBackoff calculates the next backoff duration
func (eb *ExponentialBackoff) NextBackoff(attempt int) time.Duration {
	if attempt <= 0 {
		return eb.initialBackoff
	}

	// Calculate exponential backoff
	backoff := float64(eb.initialBackoff) * math.Pow(eb.multiplier, float64(attempt))

	// Apply maximum backoff limit
	if time.Duration(backoff) > eb.maxBackoff {
		backoff = float64(eb.maxBackoff)
	}

	// Add jitter (±25%)
	jitter := backoff * 0.25 * (2.0*float64(time.Now().UnixNano()%1000)/1000.0 - 1.0)

	result := time.Duration(backoff + jitter)
	if result < 0 {
		result = eb.initialBackoff
	}

	return result
}
