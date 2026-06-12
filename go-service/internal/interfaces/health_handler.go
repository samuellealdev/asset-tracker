package interfaces

import (
	"context"
	"log/slog"
	"net/http"
	"time"
)

// Pinger is implemented by *pgxpool.Pool for database health checks.
type Pinger interface {
	Ping(ctx context.Context) error
}

// HealthHandler handles health check HTTP endpoints.
// Registered routes: GET /health (backward-compat alias), GET /health/live, GET /health/ready.
type HealthHandler struct {
	pinger Pinger
	mux    *http.ServeMux
}

// NewHealthHandler creates a new HealthHandler with the given Pinger.
func NewHealthHandler(pinger Pinger) *HealthHandler {
	h := &HealthHandler{pinger: pinger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.HandleHealth)
	mux.HandleFunc("GET /health/live", h.HandleLive)
	mux.HandleFunc("GET /health/ready", h.HandleReady)
	h.mux = mux
	return h
}

// ServeHTTP delegates to the internal mux for routing.
func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.mux.ServeHTTP(w, r)
}

// HandleLive responds with 200 {"status":"ok"} — liveness, no DB check.
func (h *HealthHandler) HandleLive(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// HandleReady pings the database.
// Returns 200 {"status":"ok","database":"connected"} if DB is reachable,
// or 503 {"status":"degraded","database":"disconnected"} if not.
func (h *HealthHandler) HandleReady(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 500*time.Millisecond)
	defer cancel()

	if err := h.pinger.Ping(ctx); err != nil {
		slog.Warn("health check: database unreachable", "error", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status":   "degraded",
			"database": "disconnected",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":   "ok",
		"database": "connected",
	})
}

// HandleHealth is a backward-compatible alias for HandleReady.
func (h *HealthHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	h.HandleReady(w, r)
}
