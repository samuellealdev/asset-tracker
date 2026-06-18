package interfaces

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// contextKey is a typed key for request context values.
type contextKey string

// UsernameKey is the context key used to store the authenticated username.
const UsernameKey contextKey = "username"

// NewAuthMiddleware creates a middleware that validates JWT Bearer tokens.
// It returns a closure matching the func(http.Handler) http.Handler signature,
// composable with existing middleware patterns.
func NewAuthMiddleware(jwtSecret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr, err := extractBearerToken(r)
			if err != nil {
				writeAuthError(w, err.Error())
				return
			}

			claims := &jwt.MapClaims{}
			token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return jwtSecret, nil
			})
			if err != nil || !token.Valid {
				writeAuthError(w, "invalid or expired token")
				return
			}

			sub, ok := (*claims)["sub"].(string)
			if !ok || sub == "" {
				writeAuthError(w, "invalid token payload")
				return
			}

			ctx := context.WithValue(r.Context(), UsernameKey, sub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extractBearerToken extracts the Bearer token from the Authorization header.
func extractBearerToken(r *http.Request) (string, error) {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return "", errMissingAuthHeader
	}

	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errMalformedAuthHeader
	}

	return parts[1], nil
}

// writeAuthError writes a 401 JSON error response.
func writeAuthError(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// errMissingAuthHeader is returned when no Authorization header is present.
var errMissingAuthHeader = &authError{"missing authorization header"}

// errMalformedAuthHeader is returned when the Authorization header is malformed.
var errMalformedAuthHeader = &authError{"malformed authorization header"}

type authError struct {
	msg string
}

func (e *authError) Error() string {
	return e.msg
}
