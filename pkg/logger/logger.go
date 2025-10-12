package logger

import (
	"fmt"
	"log"
	"time"
)

// LogLevel represents the logging level
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
)

// Logger provides structured logging functionality
type Logger struct {
	level       LogLevel
	environment string
}

// NewLogger creates a new logger instance
func NewLogger(level string, environment string) *Logger {
	var logLevel LogLevel
	switch level {
	case "debug":
		logLevel = DEBUG
	case "info":
		logLevel = INFO
	case "warn":
		logLevel = WARN
	case "error":
		logLevel = ERROR
	default:
		logLevel = INFO
	}

	return &Logger{
		level:       logLevel,
		environment: environment,
	}
}

// log formats and outputs log messages
func (l *Logger) log(level LogLevel, message string, fields map[string]interface{}) {
	if level < l.level {
		return
	}

	timestamp := time.Now().Format(time.RFC3339)
	levelStr := l.levelToString(level)

	logMessage := fmt.Sprintf("[%s] %s: %s", timestamp, levelStr, message)

	if len(fields) > 0 {
		logMessage += fmt.Sprintf(" | Fields: %v", fields)
	}

	log.Println(logMessage)
}

// levelToString converts LogLevel to string
func (l *Logger) levelToString(level LogLevel) string {
	switch level {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	default:
		return "INFO"
	}
}

// Debug logs a debug message
func (l *Logger) Debug(message string, fields map[string]interface{}) {
	l.log(DEBUG, message, fields)
}

// Info logs an info message
func (l *Logger) Info(message string, fields map[string]interface{}) {
	l.log(INFO, message, fields)
}

// Warn logs a warning message
func (l *Logger) Warn(message string, fields map[string]interface{}) {
	l.log(WARN, message, fields)
}

// Error logs an error message
func (l *Logger) Error(message string, fields map[string]interface{}) {
	l.log(ERROR, message, fields)
}

// WithContext creates a new logger with context fields
func (l *Logger) WithContext(fields map[string]interface{}) *Logger {
	// For simplicity, return the same logger
	// In a more sophisticated implementation, this would create a new logger with embedded fields
	return l
}

// WithUser creates a new logger with user context
func (l *Logger) WithUser(userID uint, phone string) *Logger {
	return l.WithContext(map[string]interface{}{
		"user_id":    userID,
		"user_phone": phone,
	})
}

// WithRequest creates a new logger with request context
func (l *Logger) WithRequest(method, path, ip string) *Logger {
	return l.WithContext(map[string]interface{}{
		"method": method,
		"path":   path,
		"ip":     ip,
	})
}

// WithError creates a new logger with error context
func (l *Logger) WithError(err error) *Logger {
	return l.WithContext(map[string]interface{}{
		"error": err.Error(),
	})
}

// WithDuration creates a new logger with duration context
func (l *Logger) WithDuration(duration time.Duration) *Logger {
	return l.WithContext(map[string]interface{}{
		"duration": duration.String(),
	})
}
