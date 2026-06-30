package interfaces

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// RequestTrace represents a single HTTP request trace captured by the middleware.
type RequestTrace struct {
	Method     string  `json:"method"`
	Path       string  `json:"path"`
	Status     int     `json:"status"`
	DurationMs float64 `json:"duration_ms"`
	Timestamp  string  `json:"timestamp"`
}

// MetricsHandler tracks request and error counters using thread-safe atomic values,
// and maintains an append-only slice of request traces.
type MetricsHandler struct {
	requestsTotal atomic.Int64
	errorsTotal   atomic.Int64
	traces        []RequestTrace
	mu            sync.Mutex
}

// NewMetricsHandler creates a new MetricsHandler with zero-initialized counters
// and an empty append-only slice for traces.
func NewMetricsHandler() *MetricsHandler {
	return &MetricsHandler{
		traces: make([]RequestTrace, 0),
	}
}

// PushTrace appends a trace to the append-only slice. This method is thread-safe.
func (m *MetricsHandler) PushTrace(trace RequestTrace) {
	m.mu.Lock()
	m.traces = append(m.traces, trace)
	m.mu.Unlock()
}

// GetTraces returns up to `limit` traces from the append-only slice, newest-first.
// If fewer traces exist than `limit`, all available traces are returned.
// This method is thread-safe.
func (m *MetricsHandler) GetTraces(limit int) []RequestTrace {
	m.mu.Lock()
	defer m.mu.Unlock()

	n := len(m.traces)
	if n == 0 {
		return []RequestTrace{}
	}
	if limit > n {
		limit = n
	}
	if limit < 0 {
		limit = 0
	}

	result := make([]RequestTrace, limit)
	for i := 0; i < limit; i++ {
		result[i] = m.traces[n-1-i] // newest-first
	}
	return result
}

// parseLimit parses the "limit" query parameter, returning the default value if
// the parameter is missing or not a valid positive integer.
func parseLimit(r *http.Request, defaultLimit int) int {
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		return defaultLimit
	}
	var limit int
	if _, err := fmt.Sscanf(limitStr, "%d", &limit); err != nil {
		return defaultLimit
	}
	if limit < 1 {
		return 1
	}
	if limit > 10000 {
		return 10000
	}
	return limit
}

// HandleRequests handles GET /metrics/requests requests, returning JSON with
// requests_total, errors_total, and recent traces (newest-first, clamped by limit).
func (m *MetricsHandler) HandleRequests(w http.ResponseWriter, r *http.Request) {
	limit := parseLimit(r, 50)
	traces := m.GetTraces(limit)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"requests_total": m.requestsTotal.Load(),
		"errors_total":   m.errorsTotal.Load(),
		"recent":         traces,
	})
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
// the requests counter, counts errors (status >= 400) through the errors counter,
// and captures a RequestTrace for each request into the append-only slice.
// The returned factory matches the existing middleware pattern in this package:
// it takes an http.Handler and returns the wrapped handler.
func MetricsMiddleware(m *MetricsHandler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip health and metrics endpoints — they're infrastructure noise, not business traffic
			if strings.HasPrefix(r.URL.Path, "/health") || strings.HasPrefix(r.URL.Path, "/metrics") {
				next.ServeHTTP(w, r)
				return
			}

			start := time.Now()

			m.IncrementRequests()

			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
			next.ServeHTTP(rw, r)

			if rw.statusCode >= 400 {
				m.IncrementErrors()
			}

			m.PushTrace(RequestTrace{
				Method:     r.Method,
				Path:       r.URL.Path,
				Status:     rw.statusCode,
				DurationMs: time.Since(start).Seconds() * 1000,
				Timestamp:  time.Now().UTC().Format(time.RFC3339),
			})
		})
	}
}
