package interfaces

import (
	"net/http"
	"sync/atomic"
)

// MetricsHandler tracks request and error counters using thread-safe atomic values.
type MetricsHandler struct {
	requestsTotal atomic.Int64
	errorsTotal   atomic.Int64
}

// NewMetricsHandler creates a new MetricsHandler with zero-initialized counters.
func NewMetricsHandler() *MetricsHandler {
	return &MetricsHandler{}
}

// ServeHTTP handles GET /metrics requests and returns JSON with counter values.
func (m *MetricsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]int64{
		"requests_total": m.requestsTotal.Load(),
		"errors_total":   m.errorsTotal.Load(),
	})
}

// IncrementRequests increments the requests counter by 1.
func (m *MetricsHandler) IncrementRequests() {
	m.requestsTotal.Add(1)
}

// IncrementErrors increments the errors counter by 1.
func (m *MetricsHandler) IncrementErrors() {
	m.errorsTotal.Add(1)
}
