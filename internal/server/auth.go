// Package server defines all HTTP handlers for the Skryfon blog platform.
package server

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"skryfon_blog/internal/model"
	"time"
)
