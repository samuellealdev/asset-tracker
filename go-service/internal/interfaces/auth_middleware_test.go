package interfaces_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

func generateToken(t *testing.T, secret []byte, sub string, exp time.Time) string {
	t.Helper()
	claims := jwt.MapClaims{
		"sub": sub,
		"exp": exp.Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(secret)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func TestAuthMiddleware(t *testing.T) {
	secret := []byte("test-secret")

	t.Run("valid token passes through and injects username", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)
		token := generateToken(t, secret, "admin", time.Now().Add(1*time.Hour))

		var injectedUsername string
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			username, ok := r.Context().Value(interfaces.UsernameKey).(string)
			if !ok {
				t.Error("expected username in context")
			}
			injectedUsername = username
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}
		if injectedUsername != "admin" {
			t.Errorf("expected username 'admin', got %q", injectedUsername)
		}
	})

	t.Run("missing authorization header returns 401", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Error("next handler should not be called")
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
	})

	t.Run("malformed authorization header returns 401", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Error("next handler should not be called")
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "InvalidFormat")
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
	})

	t.Run("invalid token returns 401", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Error("next handler should not be called")
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer invalidtoken")
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
	})

	t.Run("expired token returns 401", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)
		token := generateToken(t, secret, "admin", time.Now().Add(-1*time.Hour))

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Error("next handler should not be called")
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
	})

	t.Run("token signed with wrong secret returns 401", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)
		token := generateToken(t, []byte("wrong-secret"), "admin", time.Now().Add(1*time.Hour))

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Error("next handler should not be called")
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
	})

	t.Run("response body contains error JSON on 401", func(t *testing.T) {
		middleware := interfaces.NewAuthMiddleware(secret)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			t.Error("next handler should not be called")
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		middleware(next).ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "error") {
			t.Errorf("expected error JSON in body, got %q", w.Body.String())
		}
	})
}
