package interfaces

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/samuellealdev/asset-tracker/go-service/internal/application"
	"github.com/samuellealdev/asset-tracker/go-service/internal/domain"
)

// DeviceUseCases is the inbound port that combines all device use cases.
// The handler depends on this interface, not on concrete use case structs.
type DeviceUseCases interface {
	Create(ctx context.Context, name, deviceType string) (*domain.Device, error)
	List(ctx context.Context) ([]*domain.Device, error)
	Get(ctx context.Context, id string) (*domain.Device, error)
	Update(ctx context.Context, id, name, deviceType string) (*domain.Device, error)
	Delete(ctx context.Context, id string) error
}

// DeviceHandler handles HTTP requests for device CRUD operations.
// It uses Go 1.22+ stdlib routing — no third-party router.
type DeviceHandler struct {
	useCases DeviceUseCases
	mux      *http.ServeMux
}

// NewDeviceHandler creates a new DeviceHandler and registers all routes.
func NewDeviceHandler(useCases DeviceUseCases) *DeviceHandler {
	h := &DeviceHandler{useCases: useCases}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /devices", h.HandleCreate)
	mux.HandleFunc("GET /devices", h.HandleList)
	mux.HandleFunc("GET /devices/{id}", h.HandleGet)
	mux.HandleFunc("PUT /devices/{id}", h.HandleUpdate)
	mux.HandleFunc("DELETE /devices/{id}", h.HandleDelete)
	h.mux = mux
	return h
}

// ServeHTTP delegates to the internal mux for routing.
func (h *DeviceHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.mux.ServeHTTP(w, r)
}

// HandleCreate handles POST /devices.
func (h *DeviceHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("invalid request body", "error", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	device, err := h.useCases.Create(r.Context(), req.Name, req.Type)
	if err != nil {
		if errors.Is(err, domain.ErrNameRequired) || errors.Is(err, domain.ErrTypeRequired) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		slog.Error("failed to create device", "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusCreated, device)
}

// HandleList handles GET /devices.
func (h *DeviceHandler) HandleList(w http.ResponseWriter, r *http.Request) {
	devices, err := h.useCases.List(r.Context())
	if err != nil {
		slog.Error("failed to list devices", "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, devices)
}

// HandleGet handles GET /devices/{id}.
func (h *DeviceHandler) HandleGet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	device, err := h.useCases.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, application.ErrNotFound) {
			writeError(w, http.StatusNotFound, "device not found")
			return
		}
		slog.Error("failed to get device", "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, device)
}

// HandleUpdate handles PUT /devices/{id}.
func (h *DeviceHandler) HandleUpdate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("invalid request body", "error", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	device, err := h.useCases.Update(r.Context(), id, req.Name, req.Type)
	if err != nil {
		if errors.Is(err, application.ErrNotFound) {
			writeError(w, http.StatusNotFound, "device not found")
			return
		}
		if errors.Is(err, domain.ErrNameRequired) || errors.Is(err, domain.ErrTypeRequired) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		slog.Error("failed to update device", "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	writeJSON(w, http.StatusOK, device)
}

// HandleDelete handles DELETE /devices/{id}.
func (h *DeviceHandler) HandleDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	if err := h.useCases.Delete(r.Context(), id); err != nil {
		if errors.Is(err, application.ErrNotFound) {
			writeError(w, http.StatusNotFound, "device not found")
			return
		}
		slog.Error("failed to delete device", "error", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("failed to encode JSON response", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
