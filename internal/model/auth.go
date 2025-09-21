package models

// SigninRequest represents the signin request payload
type SigninRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// SignupRequest represents the signup request payload
type SignupRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required,min=2"`
	UserType string `json:"user_type,omitempty"`
	Phone    string `json:"phone,omitempty"`
	Address  string `json:"address,omitempty"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
