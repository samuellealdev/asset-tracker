package interfaces_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
	"github.com/samuellealdev/asset-tracker/go-service/internal/interfaces"
)

// mockUseCases holds mock implementations of all use cases.
type mockUseCases struct {
	createFunc func(ctx context.Context, name, deviceType string) (*domain.Device, error)
	listFunc   func(ctx context.Context) ([]*domain.Device, error)
	getFunc    func(ctx context.Context, id string) (*domain.Device, error)
	updateFunc func(ctx context.Context, id, name, deviceType string) (*domain.Device, error)
	deleteFunc func(ctx context.Context, id string) error
}

func (m *mockUseCases) Create(ctx context.Context, name, deviceType string) (*domain.Device, error) {
	return m.createFunc(ctx, name, deviceType)
}
func (m *mockUseCases) List(ctx context.Context) ([]*domain.Device, error) {
	return m.listFunc(ctx)
}
func (m *mockUseCases) Get(ctx context.Context, id string) (*domain.Device, error) {
	return m.getFunc(ctx, id)
}
func (m *mockUseCases) Update(ctx context.Context, id, name, deviceType string) (*domain.Device, error) {
	return m.updateFunc(ctx, id, name, deviceType)
}
func (m *mockUseCases) Delete(ctx context.Context, id string) error {
	return m.deleteFunc(ctx, id)
}

func TestDeviceHandler_HandleCreate(t *testing.T) {
	t.Run("returns 201 with device JSON on success", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			createFunc: func(_ context.Context, name, dtype string) (*domain.Device, error) {
				return &domain.Device{ID: "abc-123", Name: name, Type: dtype, CreatedAt: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)}, nil
			},
		})

		req := httptest.NewRequest(http.MethodPost, "/devices", strings.NewReader(`{"name":"laptop","type":"computer"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Errorf("expected status 201, got %d", w.Code)
		}

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["name"] != "laptop" {
			t.Errorf("expected name 'laptop', got %v", resp["name"])
		}
		if resp["type"] != "computer" {
			t.Errorf("expected type 'computer', got %v", resp["type"])
		}
		if resp["id"] != "abc-123" {
			t.Errorf("expected id 'abc-123', got %v", resp["id"])
		}
	})

	t.Run("returns 400 when name is empty", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			createFunc: func(_ context.Context, name, dtype string) (*domain.Device, error) {
				return nil, domain.ErrNameRequired
			},
		})

		req := httptest.NewRequest(http.MethodPost, "/devices", strings.NewReader(`{"name":"","type":"computer"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("returns 400 when JSON body is malformed", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{})

		req := httptest.NewRequest(http.MethodPost, "/devices", strings.NewReader(`{invalid json}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("returns 400 when type is empty", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			createFunc: func(_ context.Context, name, dtype string) (*domain.Device, error) {
				return nil, domain.ErrTypeRequired
			},
		})

		req := httptest.NewRequest(http.MethodPost, "/devices", strings.NewReader(`{"name":"laptop","type":""}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("returns 500 on unexpected use case error", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			createFunc: func(_ context.Context, name, dtype string) (*domain.Device, error) {
				return nil, errors.New("database connection failed")
			},
		})

		req := httptest.NewRequest(http.MethodPost, "/devices", strings.NewReader(`{"name":"laptop","type":"computer"}`))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", w.Code)
		}
	})
}

func TestDeviceHandler_HandleList(t *testing.T) {
	t.Run("returns 200 with empty array when no devices", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			listFunc: func(_ context.Context) ([]*domain.Device, error) {
				return []*domain.Device{}, nil
			},
		})

		req := httptest.NewRequest(http.MethodGet, "/devices", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var devices []interface{}
		if err := json.NewDecoder(w.Body).Decode(&devices); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if len(devices) != 0 {
			t.Errorf("expected empty array, got %d items", len(devices))
		}
	})

	t.Run("returns 200 with devices", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			listFunc: func(_ context.Context) ([]*domain.Device, error) {
				return []*domain.Device{
					{ID: "1", Name: "laptop", Type: "computer"},
				}, nil
			},
		})

		req := httptest.NewRequest(http.MethodGet, "/devices", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var devices []map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&devices); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if len(devices) != 1 {
			t.Fatalf("expected 1 device, got %d", len(devices))
		}
		if devices[0]["name"] != "laptop" {
			t.Errorf("expected name 'laptop', got %v", devices[0]["name"])
		}
	})

	t.Run("returns 500 on use case error", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			listFunc: func(_ context.Context) ([]*domain.Device, error) {
				return nil, errors.New("db unavailable")
			},
		})

		req := httptest.NewRequest(http.MethodGet, "/devices", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", w.Code)
		}
	})
}

func TestDeviceHandler_HandleGet(t *testing.T) {
	t.Run("returns 200 with device JSON", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			getFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return &domain.Device{ID: id, Name: "laptop", Type: "computer"}, nil
			},
		})

		req := httptest.NewRequest(http.MethodGet, "/devices/abc-123", nil)
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["id"] != "abc-123" {
			t.Errorf("expected id 'abc-123', got %v", resp["id"])
		}
	})

	t.Run("returns 404 when device not found", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			getFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return nil, application.ErrNotFound
			},
		})

		req := httptest.NewRequest(http.MethodGet, "/devices/nonexistent", nil)
		req.SetPathValue("id", "nonexistent")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", w.Code)
		}

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["error"] == nil {
			t.Error("expected error message in response")
		}
	})

	t.Run("returns 500 on unexpected use case error", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			getFunc: func(_ context.Context, id string) (*domain.Device, error) {
				return nil, errors.New("storage failure")
			},
		})

		req := httptest.NewRequest(http.MethodGet, "/devices/abc-123", nil)
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", w.Code)
		}
	})
}

func TestDeviceHandler_HandleUpdate(t *testing.T) {
	t.Run("returns 200 with updated device JSON", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			updateFunc: func(_ context.Context, id, name, dtype string) (*domain.Device, error) {
				return &domain.Device{ID: id, Name: name, Type: dtype}, nil
			},
		})

		req := httptest.NewRequest(http.MethodPut, "/devices/abc-123", strings.NewReader(`{"name":"server","type":"infrastructure"}`))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", w.Code)
		}

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp["name"] != "server" {
			t.Errorf("expected name 'server', got %v", resp["name"])
		}
		if resp["type"] != "infrastructure" {
			t.Errorf("expected type 'infrastructure', got %v", resp["type"])
		}
	})

	t.Run("returns 400 when name is empty", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			updateFunc: func(_ context.Context, id, name, dtype string) (*domain.Device, error) {
				return nil, domain.ErrNameRequired
			},
		})

		req := httptest.NewRequest(http.MethodPut, "/devices/abc-123", strings.NewReader(`{"name":"","type":"server"}`))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("returns 404 when device not found", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			updateFunc: func(_ context.Context, id, name, dtype string) (*domain.Device, error) {
				return nil, application.ErrNotFound
			},
		})

		req := httptest.NewRequest(http.MethodPut, "/devices/nonexistent", strings.NewReader(`{"name":"x","type":"y"}`))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", "nonexistent")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", w.Code)
		}
	})

	t.Run("returns 400 when type is empty", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			updateFunc: func(_ context.Context, id, name, dtype string) (*domain.Device, error) {
				return nil, domain.ErrTypeRequired
			},
		})

		req := httptest.NewRequest(http.MethodPut, "/devices/abc-123", strings.NewReader(`{"name":"server","type":""}`))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})

	t.Run("returns 500 on unexpected use case error", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			updateFunc: func(_ context.Context, id, name, dtype string) (*domain.Device, error) {
				return nil, errors.New("update failed")
			},
		})

		req := httptest.NewRequest(http.MethodPut, "/devices/abc-123", strings.NewReader(`{"name":"server","type":"infrastructure"}`))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", w.Code)
		}
	})

	t.Run("returns 400 when update JSON body is malformed", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{})

		req := httptest.NewRequest(http.MethodPut, "/devices/abc-123", strings.NewReader(`{invalid json}`))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", w.Code)
		}
	})
}

func TestDeviceHandler_HandleDelete(t *testing.T) {
	t.Run("returns 204 with no body on success", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			deleteFunc: func(_ context.Context, id string) error {
				return nil
			},
		})

		req := httptest.NewRequest(http.MethodDelete, "/devices/abc-123", nil)
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", w.Code)
		}
		if w.Body.Len() != 0 {
			t.Errorf("expected empty body, got %q", w.Body.String())
		}
	})

	t.Run("returns 404 when device not found", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			deleteFunc: func(_ context.Context, id string) error {
				return application.ErrNotFound
			},
		})

		req := httptest.NewRequest(http.MethodDelete, "/devices/nonexistent", nil)
		req.SetPathValue("id", "nonexistent")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", w.Code)
		}
	})

	t.Run("returns 500 on unexpected use case error", func(t *testing.T) {
		handler := interfaces.NewDeviceHandler(&mockUseCases{
			deleteFunc: func(_ context.Context, id string) error {
				return errors.New("delete failed")
			},
		})

		req := httptest.NewRequest(http.MethodDelete, "/devices/abc-123", nil)
		req.SetPathValue("id", "abc-123")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", w.Code)
		}
	})
}



