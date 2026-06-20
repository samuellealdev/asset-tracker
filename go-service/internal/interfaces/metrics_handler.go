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

// MetricsMiddleware returns an HTTP middleware that counts every request through
// the requests counter and counts errors (status >= 400) through the errors counter.
// The returned factory matches the existing middleware pattern in this package:
// it takes an http.Handler and returns the wrapped handler.
func MetricsMiddleware(m *MetricsHandler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			m.IncrementRequests()

			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
			next.ServeHTTP(rw, r)

			if rw.statusCode >= 400 {
				m.IncrementErrors()
			}
		})
	}
}
