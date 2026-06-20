package interfaces_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

func restoreLogger(t *testing.T, original *slog.Logger) {
	t.Helper()
	slog.SetDefault(original)
}

func TestLoggingMiddleware(t *testing.T) {
	t.Run("calls next handler", func(t *testing.T) {
		var called bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			w.WriteHeader(http.StatusOK)
		})

		middleware := interfaces.LoggingMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		if !called {
			t.Error("expected next handler to be called")
		}
	})

	t.Run("logs method, path, status, duration", func(t *testing.T) {
		var buf bytes.Buffer
		original := slog.Default()
		logger := slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo}))
		slog.SetDefault(logger)
		defer restoreLogger(t, original)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		})

		middleware := interfaces.LoggingMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/not-found", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		var logEntry map[string]interface{}
		if err := json.Unmarshal(buf.Bytes(), &logEntry); err != nil {
			t.Fatalf("failed to parse log entry: %v", err)
		}

		if logEntry["method"] != "GET" {
			t.Errorf("expected method 'GET', got %v", logEntry["method"])
		}
		if logEntry["path"] != "/not-found" {
			t.Errorf("expected path '/not-found', got %v", logEntry["path"])
		}
		if logEntry["status"] != float64(http.StatusNotFound) {
			t.Errorf("expected status %d, got %v", http.StatusNotFound, logEntry["status"])
		}
		if _, ok := logEntry["duration_ms"]; !ok {
			t.Error("expected duration_ms field in log")
		}
		if _, ok := logEntry["time"]; !ok {
			t.Error("expected time field in log")
		}
	})

	t.Run("captures 500 status code", func(t *testing.T) {
		var buf bytes.Buffer
		original := slog.Default()
		logger := slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo}))
		slog.SetDefault(logger)
		defer restoreLogger(t, original)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		})

		middleware := interfaces.LoggingMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/error", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		var logEntry map[string]interface{}
		if err := json.Unmarshal(buf.Bytes(), &logEntry); err != nil {
			t.Fatalf("failed to parse log entry: %v", err)
		}

		if logEntry["status"] != float64(http.StatusInternalServerError) {
			t.Errorf("expected status %d, got %v", http.StatusInternalServerError, logEntry["status"])
		}
	})

	t.Run("captures 200 status code when handler writes without calling WriteHeader", func(t *testing.T) {
		var buf bytes.Buffer
		original := slog.Default()
		logger := slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo}))
		slog.SetDefault(logger)
		defer restoreLogger(t, original)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("ok"))
		})

		middleware := interfaces.LoggingMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/ok", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		var logEntry map[string]interface{}
		if err := json.Unmarshal(buf.Bytes(), &logEntry); err != nil {
			t.Fatalf("failed to parse log entry: %v", err)
		}

		if logEntry["method"] != "GET" {
			t.Errorf("expected method 'GET', got %v", logEntry["method"])
		}
		if logEntry["status"] != float64(http.StatusOK) {
			t.Errorf("expected status %d, got %v", http.StatusOK, logEntry["status"])
		}
	})

	t.Run("log message is present", func(t *testing.T) {
		var buf bytes.Buffer
		original := slog.Default()
		logger := slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo}))
		slog.SetDefault(logger)
		defer restoreLogger(t, original)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		middleware := interfaces.LoggingMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		var logEntry map[string]interface{}
		if err := json.Unmarshal(buf.Bytes(), &logEntry); err != nil {
			t.Fatalf("failed to parse log entry: %v", err)
		}

		msg, ok := logEntry["msg"]
		if !ok {
			t.Fatal("expected msg field in log")
		}
		if !strings.Contains(msg.(string), "request") {
			t.Errorf("expected msg to contain 'request', got %q", msg)
		}
	})
}

func TestCORSMiddleware(t *testing.T) {
	t.Run("sets CORS headers on all responses", func(t *testing.T) {
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		middleware := interfaces.CORSMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("expected Access-Control-Allow-Origin: *, got %q", w.Header().Get("Access-Control-Allow-Origin"))
		}
		if w.Header().Get("Access-Control-Allow-Headers") != "Authorization, Content-Type" {
			t.Errorf("expected Access-Control-Allow-Headers: Authorization, Content-Type, got %q", w.Header().Get("Access-Control-Allow-Headers"))
		}
		if w.Header().Get("Access-Control-Allow-Methods") != "GET, POST, PUT, DELETE, OPTIONS" {
			t.Errorf("expected Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, got %q", w.Header().Get("Access-Control-Allow-Methods"))
		}
	})

	t.Run("handles OPTIONS preflight with 204 and no next handler call", func(t *testing.T) {
		var called bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			w.WriteHeader(http.StatusOK)
		})

		middleware := interfaces.CORSMiddleware(next)
		req := httptest.NewRequest(http.MethodOptions, "/test", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		if called {
			t.Error("expected next handler NOT to be called for OPTIONS preflight")
		}
		if w.Code != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", w.Code)
		}
	})

	t.Run("passes through non-OPTIONS request to next handler", func(t *testing.T) {
		var called bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		})

		middleware := interfaces.CORSMiddleware(next)
		req := httptest.NewRequest(http.MethodGet, "/api/devices", nil)
		w := httptest.NewRecorder()
		middleware.ServeHTTP(w, req)

		if !called {
			t.Error("expected next handler to be called for GET request")
		}
		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}
		if w.Body.String() != "ok" {
			t.Errorf("expected body 'ok', got %q", w.Body.String())
		}
	})
}
