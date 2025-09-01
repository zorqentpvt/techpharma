package middleware

import (
	"fmt"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggingMiddleware creates a custom logging middleware that writes to both console and file
func LoggingMiddleware() gin.HandlerFunc {
	// Set up log file
	logFile, err := os.OpenFile("bloglog.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("LOG FILE ERROR:", err)
		panic("failed to open bloglog.txt")
	}

	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start)

		// Create log entry
		logLine := fmt.Sprintf("[%s] %d | %v | %s | %s %s | UA: %s\n",
			start.Format("2006-01-02 15:04:05"),
			c.Writer.Status(),
			duration,
			c.ClientIP(),
			c.Request.Method,
			c.Request.URL.Path,
			c.Request.UserAgent(),
		)

		// Write to file (no color)
		logFile.WriteString(logLine)
	}
}

// SetupGinLogging configures Gin's built-in logging with colors
func SetupGinLogging() {
	// Enable console colors manually (important)
	gin.ForceConsoleColor()
}
