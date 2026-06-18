package interfaces

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// AuthHandler handles POST /auth/login for JWT token issuance.
type AuthHandler struct {
	username   string
	password   string
	jwtSecret  []byte
	expiration time.Duration
}

// NewAuthHandler creates a new AuthHandler with the given credentials and JWT config.
func NewAuthHandler(username, password string, jwtSecret []byte, expiration time.Duration) *AuthHandler {
	return &AuthHandler{
		username:   username,
		password:   password,
		jwtSecret:  jwtSecret,
		expiration: expiration,
	}
}

// HandleLogin handles POST /auth/login.
// It parses the JSON body for username/password, validates credentials,
// and returns a signed JWT token on success.
func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username and password are required")
		return
	}

	if req.Username != h.username || req.Password != h.password {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"sub": req.Username,
		"exp": now.Add(h.expiration).Unix(),
		"iat": now.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(h.jwtSecret)
	if err != nil {
		slog.Error("failed to sign JWT token", "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": signedToken})
}
