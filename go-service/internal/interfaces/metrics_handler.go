package interfaces

import (
	"fmt"
	"net/http"
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
// and maintains a ring buffer of recent request traces.
type MetricsHandler struct {
	requestsTotal atomic.Int64
	errorsTotal   atomic.Int64
	traces        []RequestTrace
	traceWriteIdx int
	traceCount    int64
	mu            sync.Mutex
}

// NewMetricsHandler creates a new MetricsHandler with zero-initialized counters
// and a pre-allocated ring buffer of capacity 200.
func NewMetricsHandler() *MetricsHandler {
	return &MetricsHandler{
		traces: make([]RequestTrace, 200),
	}
}

// PushTrace inserts a trace into the ring buffer. If the buffer is full, the oldest
// trace is overwritten. This method is thread-safe.
func (m *MetricsHandler) PushTrace(trace RequestTrace) {
	m.mu.Lock()
	m.traces[m.traceWriteIdx] = trace
	m.traceWriteIdx = (m.traceWriteIdx + 1) % 200
	m.traceCount++
	m.mu.Unlock()
}

// GetTraces returns up to `limit` traces from the ring buffer, newest-first.
// If fewer traces exist than `limit`, all available traces are returned.
// This method is thread-safe.
func (m *MetricsHandler) GetTraces(limit int) []RequestTrace {
	m.mu.Lock()
	defer m.mu.Unlock()

	stored := m.traceCount
	if stored > 200 {
		stored = 200
	}
	if stored == 0 {
		return []RequestTrace{}
	}

	n := min(limit, int(stored))
	if n < 0 {
		n = 0
	}

	result := make([]RequestTrace, n)
	for i := 0; i < n; i++ {
		// Walk backwards from the write pointer (newest written entry is at traceWriteIdx-1)
		idx := (m.traceWriteIdx - 1 - i) % 200
		if idx < 0 {
			idx += 200
		}
		result[i] = m.traces[idx]
	}
	return result
}

// TraceCount returns the total number of traces pushed since startup.
func (m *MetricsHandler) TraceCount() int64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.traceCount
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
	if limit > 200 {
		return 200
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
// and captures a RequestTrace for each request into the ring buffer.
// The returned factory matches the existing middleware pattern in this package:
// it takes an http.Handler and returns the wrapped handler.
func MetricsMiddleware(m *MetricsHandler) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
