package interfaces_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

type mockPinger struct {
	pingFunc func(ctx context.Context) error
}

func (m *mockPinger) Ping(ctx context.Context) error {
	return m.pingFunc(ctx)
}

func TestHealthHandler_HandleLive(t *testing.T) {
	t.Run("returns 200 with status ok", func(t *testing.T) {
		pinger := &mockPinger{}
		handler := interfaces.NewHealthHandler(pinger)

		req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["status"] != "ok" {
			t.Errorf("expected status 'ok', got %q", resp["status"])
		}
	})
}

func TestHealthHandler_HandleReady(t *testing.T) {
	t.Run("returns 200 with connected when DB is up", func(t *testing.T) {
		pinger := &mockPinger{
			pingFunc: func(_ context.Context) error {
				return nil
			},
		}
		handler := interfaces.NewHealthHandler(pinger)

		req := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["status"] != "ok" {
			t.Errorf("expected status 'ok', got %q", resp["status"])
		}
		if resp["database"] != "connected" {
			t.Errorf("expected database 'connected', got %q", resp["database"])
		}
	})

	t.Run("returns 503 with disconnected when DB is down", func(t *testing.T) {
		pinger := &mockPinger{
			pingFunc: func(_ context.Context) error {
				return errors.New("connection refused")
			},
		}
		handler := interfaces.NewHealthHandler(pinger)

		req := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("expected status 503, got %d", w.Code)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["status"] != "degraded" {
			t.Errorf("expected status 'degraded', got %q", resp["status"])
		}
		if resp["database"] != "disconnected" {
			t.Errorf("expected database 'disconnected', got %q", resp["database"])
		}
	})
}

func TestHealthHandler_HandleHealth(t *testing.T) {
	t.Run("alias for ready returns 200 when DB is up", func(t *testing.T) {
		pinger := &mockPinger{
			pingFunc: func(_ context.Context) error {
				return nil
			},
		}
		handler := interfaces.NewHealthHandler(pinger)

		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]string
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["status"] != "ok" {
			t.Errorf("expected status 'ok', got %q", resp["status"])
		}
		if resp["database"] != "connected" {
			t.Errorf("expected database 'connected', got %q", resp["database"])
		}
	})

	t.Run("alias for ready returns 503 when DB is down", func(t *testing.T) {
		pinger := &mockPinger{
			pingFunc: func(_ context.Context) error {
				return errors.New("timeout")
			},
		}
		handler := interfaces.NewHealthHandler(pinger)

		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("expected status 503, got %d", w.Code)
		}
	})
}
