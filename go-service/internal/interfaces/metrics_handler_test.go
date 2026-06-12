package interfaces_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

func TestMetricsHandler(t *testing.T) {
	t.Run("initial state returns zeros", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["requests_total"] != float64(0) {
			t.Errorf("expected requests_total 0, got %v", resp["requests_total"])
		}
		if resp["errors_total"] != float64(0) {
			t.Errorf("expected errors_total 0, got %v", resp["errors_total"])
		}
	})

	t.Run("after incrementing requests", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.IncrementRequests()
		handler.IncrementRequests()
		handler.IncrementRequests()

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["requests_total"] != float64(3) {
			t.Errorf("expected requests_total 3, got %v", resp["requests_total"])
		}
	})

	t.Run("after incrementing errors", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.IncrementErrors()
		handler.IncrementErrors()

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["errors_total"] != float64(2) {
			t.Errorf("expected errors_total 2, got %v", resp["errors_total"])
		}
	})

	t.Run("requests and errors are independent", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.IncrementRequests()
		handler.IncrementRequests()
		handler.IncrementErrors()

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["requests_total"] != float64(2) {
			t.Errorf("expected requests_total 2, got %v", resp["requests_total"])
		}
		if resp["errors_total"] != float64(1) {
			t.Errorf("expected errors_total 1, got %v", resp["errors_total"])
		}
	})

	t.Run("Content-Type is application/json", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		ct := w.Header().Get("Content-Type")
		if ct != "application/json" {
			t.Errorf("expected Content-Type application/json, got %q", ct)
		}
	})
}
