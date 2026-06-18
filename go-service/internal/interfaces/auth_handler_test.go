package interfaces_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

func TestAuthHandler_HandleLogin(t *testing.T) {
	handler := interfaces.NewAuthHandler("admin", "admin", []byte("test-secret"), 1*time.Hour)

	t.Run("valid credentials returns 200 with JWT token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(`{"username":"admin","password":"admin"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.HandleLogin(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		tokenStr, ok := resp["token"]
		if !ok {
			t.Fatal("expected token in response")
		}

		// Verify the token is valid and contains expected claims
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte("test-secret"), nil
		})
		if err != nil {
			t.Fatalf("failed to parse returned token: %v", err)
		}
		if !token.Valid {
			t.Error("expected valid token")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			t.Fatal("expected MapClaims")
		}
		if claims["sub"] != "admin" {
			t.Errorf("expected sub 'admin', got %v", claims["sub"])
		}
		if _, ok := claims["exp"]; !ok {
			t.Error("expected exp claim")
		}
		if _, ok := claims["iat"]; !ok {
			t.Error("expected iat claim")
		}
	})

	t.Run("wrong password returns 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(`{"username":"admin","password":"wrong"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.HandleLogin(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", w.Code)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["error"] != "invalid credentials" {
			t.Errorf("expected error 'invalid credentials', got %q", resp["error"])
		}
	})

	t.Run("missing username returns 400", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(`{"password":"admin"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.HandleLogin(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("missing password returns 400", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(`{"username":"admin"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.HandleLogin(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("malformed JSON body returns 400", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(`{invalid json}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.HandleLogin(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})
}
