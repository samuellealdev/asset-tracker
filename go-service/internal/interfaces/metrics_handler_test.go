package interfaces_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
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

func TestRequestTraceJSON(t *testing.T) {
	t.Run("JSON serialization matches expected field names", func(t *testing.T) {
		trace := interfaces.RequestTrace{
			Method: "GET", Path: "/api/devices", Status: 200, DurationMs: 42.5, Timestamp: "2026-06-29T14:30:00Z",
		}
		data, err := json.Marshal(trace)
		if err != nil {
			t.Fatalf("failed to marshal RequestTrace: %v", err)
		}

		var raw map[string]interface{}
		if err := json.Unmarshal(data, &raw); err != nil {
			t.Fatalf("failed to unmarshal JSON: %v", err)
		}

		if raw["method"] != "GET" {
			t.Errorf("expected method 'GET', got %v", raw["method"])
		}
		if raw["path"] != "/api/devices" {
			t.Errorf("expected path '/api/devices', got %v", raw["path"])
		}
		if raw["status"] != float64(200) {
			t.Errorf("expected status 200, got %v", raw["status"])
		}
		if raw["duration_ms"] != 42.5 {
			t.Errorf("expected duration_ms 42.5, got %v", raw["duration_ms"])
		}
		if raw["timestamp"] != "2026-06-29T14:30:00Z" {
			t.Errorf("expected timestamp '2026-06-29T14:30:00Z', got %v", raw["timestamp"])
		}
	})
}

func TestRingBuffer(t *testing.T) {
	t.Run("PushTrace appends when buffer below capacity", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.PushTrace(interfaces.RequestTrace{Method: "GET", Path: "/a", Status: 200, DurationMs: 1.0, Timestamp: "t1"})
		handler.PushTrace(interfaces.RequestTrace{Method: "GET", Path: "/b", Status: 200, DurationMs: 2.0, Timestamp: "t2"})
		handler.PushTrace(interfaces.RequestTrace{Method: "GET", Path: "/c", Status: 200, DurationMs: 3.0, Timestamp: "t3"})

		traces := handler.GetTraces(200)
		if len(traces) != 3 {
			t.Fatalf("expected 3 traces, got %d", len(traces))
		}
		if traces[0].Path != "/c" {
			t.Errorf("expected newest first: /c, got %s", traces[0].Path)
		}
		if traces[2].Path != "/a" {
			t.Errorf("expected oldest last: /a, got %s", traces[2].Path)
		}
	})

	t.Run("PushTrace overwrites oldest when buffer at capacity 200", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()

		// Fill buffer with 200 traces
		for i := 0; i < 200; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method:     "GET",
				Path:       "/original",
				Status:     200,
				DurationMs: float64(i),
				Timestamp:  "t",
			})
		}

		// Push one more — should overwrite the oldest (index 0)
		handler.PushTrace(interfaces.RequestTrace{
			Method:     "POST",
			Path:       "/new",
			Status:     201,
			DurationMs: 99.0,
			Timestamp:  "t-new",
		})

		traces := handler.GetTraces(200)
		if len(traces) != 200 {
			t.Fatalf("expected 200 traces, got %d", len(traces))
		}

		// Newest should be the newly pushed trace
		if traces[0].Path != "/new" {
			t.Errorf("expected newest to be '/new', got %s", traces[0].Path)
		}

		// The oldest remaining should be 1 (original at index 1 was oldest after wrap)
		oldest := traces[199]
		if oldest.Path != "/original" || oldest.DurationMs != 1.0 {
			t.Errorf("expected oldest to be /original with DurationMs 1.0, got %s/%f", oldest.Path, oldest.DurationMs)
		}
	})

	t.Run("GetTraces returns empty slice when buffer has zero entries", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		traces := handler.GetTraces(10)
		if len(traces) != 0 {
			t.Errorf("expected empty slice, got %d entries", len(traces))
		}
	})

	t.Run("GetTraces limit returns at most limit entries newest-first", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		for i := 0; i < 10; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method: "GET", Path: "/a", Status: 200, DurationMs: float64(i), Timestamp: "t",
			})
		}

		traces := handler.GetTraces(4)
		if len(traces) != 4 {
			t.Fatalf("expected 4 traces, got %d", len(traces))
		}
		if traces[0].DurationMs != 9.0 {
			t.Errorf("expected newest (DurationMs=9) first, got %f", traces[0].DurationMs)
		}
		if traces[3].DurationMs != 6.0 {
			t.Errorf("expected 4th newest (DurationMs=6), got %f", traces[3].DurationMs)
		}
	})

	t.Run("concurrent writes are safe under -race", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		var wg sync.WaitGroup
		const goroutines = 10
		const pushesPerGoroutine = 30

		for g := 0; g < goroutines; g++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for i := 0; i < pushesPerGoroutine; i++ {
					handler.PushTrace(interfaces.RequestTrace{
						Method: "POST", Path: "/concurrent", Status: 200, DurationMs: 1.0, Timestamp: "t",
					})
				}
			}()
		}
		wg.Wait()

		// traceCount should equal total pushes
		if count := handler.TraceCount(); count != int64(goroutines*pushesPerGoroutine) {
			t.Errorf("expected traceCount %d, got %d", goroutines*pushesPerGoroutine, count)
		}

		// Buffer should be at capacity (200) since total pushes > cap
		traces := handler.GetTraces(200)
		if len(traces) != 200 {
			t.Errorf("expected buffer to contain 200 traces, got %d", len(traces))
		}
	})
}

func TestHandleRequests(t *testing.T) {
	t.Run("default limit of 50 with 60 traces returns 50 newest and counters", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.IncrementRequests()
		handler.IncrementRequests()
		handler.IncrementErrors()

		for i := 0; i < 60; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method: "GET", Path: "/test", Status: 200,
				DurationMs: float64(i), Timestamp: "t",
			})
		}

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", w.Code)
		}

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

		recent, ok := resp["recent"].([]interface{})
		if !ok {
			t.Fatalf("expected recent to be an array, got %T", resp["recent"])
		}
		if len(recent) != 50 {
			t.Fatalf("expected 50 recent traces, got %d", len(recent))
		}
	})

	t.Run("custom limit with ?limit=10 returns 10 traces", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		for i := 0; i < 60; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method: "POST", Path: "/item", Status: 201,
				DurationMs: float64(i), Timestamp: "t",
			})
		}

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests?limit=10", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		recent, ok := resp["recent"].([]interface{})
		if !ok {
			t.Fatalf("expected recent to be an array, got %T", resp["recent"])
		}
		if len(recent) != 10 {
			t.Fatalf("expected 10 recent traces, got %d", len(recent))
		}
	})

	t.Run("limit 500 capped at 200", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		for i := 0; i < 200; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method: "GET", Path: "/a", Status: 200,
				DurationMs: float64(i), Timestamp: "t",
			})
		}

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests?limit=500", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		recent, ok := resp["recent"].([]interface{})
		if !ok {
			t.Fatalf("expected recent to be an array, got %T", resp["recent"])
		}
		if len(recent) != 200 {
			t.Fatalf("expected 200 recent traces (capped), got %d", len(recent))
		}
	})

	t.Run("limit 0 returns 1 trace (clamped to minimum)", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		for i := 0; i < 10; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method: "GET", Path: "/a", Status: 200,
				DurationMs: float64(i), Timestamp: "t",
			})
		}

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests?limit=0", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		recent, ok := resp["recent"].([]interface{})
		if !ok {
			t.Fatalf("expected recent to be an array, got %T", resp["recent"])
		}
		if len(recent) != 1 {
			t.Fatalf("expected 1 recent trace (clamped to 1), got %d", len(recent))
		}
	})

	t.Run("non-numeric limit defaults to 50", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		for i := 0; i < 60; i++ {
			handler.PushTrace(interfaces.RequestTrace{
				Method: "GET", Path: "/a", Status: 200,
				DurationMs: float64(i), Timestamp: "t",
			})
		}

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests?limit=abc", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		recent, ok := resp["recent"].([]interface{})
		if !ok {
			t.Fatalf("expected recent to be an array, got %T", resp["recent"])
		}
		if len(recent) != 50 {
			t.Fatalf("expected 50 recent traces (default), got %d", len(recent))
		}
	})

	t.Run("empty buffer returns recent: [] with current counters", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.IncrementRequests()

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["requests_total"] != float64(1) {
			t.Errorf("expected requests_total 1, got %v", resp["requests_total"])
		}
		if resp["errors_total"] != float64(0) {
			t.Errorf("expected errors_total 0, got %v", resp["errors_total"])
		}

		recent, ok := resp["recent"].([]interface{})
		if !ok {
			t.Fatalf("expected recent to be an array, got %T", resp["recent"])
		}
		if len(recent) != 0 {
			t.Fatalf("expected empty recent, got %d entries", len(recent))
		}
	})

	t.Run("Content-Type is application/json", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		req := httptest.NewRequest(http.MethodGet, "/metrics/requests", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		ct := w.Header().Get("Content-Type")
		if ct != "application/json" {
			t.Errorf("expected Content-Type application/json, got %q", ct)
		}
	})

	t.Run("response shape includes required keys", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		handler.PushTrace(interfaces.RequestTrace{
			Method: "GET", Path: "/a", Status: 200, DurationMs: 1.0, Timestamp: "t",
		})

		req := httptest.NewRequest(http.MethodGet, "/metrics/requests", nil)
		w := httptest.NewRecorder()
		handler.HandleRequests(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if _, ok := resp["requests_total"]; !ok {
			t.Error("expected requests_total key in response")
		}
		if _, ok := resp["errors_total"]; !ok {
			t.Error("expected errors_total key in response")
		}
		if _, ok := resp["recent"]; !ok {
			t.Error("expected recent key in response")
		}
	})
}

func TestMetricsMiddleware(t *testing.T) {
	t.Run("increments requests for every request", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/devices", nil))
		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/devices/123", nil))
		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/health", nil))

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
		if resp["errors_total"] != float64(0) {
			t.Errorf("expected errors_total 0, got %v", resp["errors_total"])
		}
	})

	t.Run("increments errors for 4xx responses", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/nonexistent", nil))

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["requests_total"] != float64(1) {
			t.Errorf("expected requests_total 1, got %v", resp["requests_total"])
		}
		if resp["errors_total"] != float64(1) {
			t.Errorf("expected errors_total 1, got %v", resp["errors_total"])
		}
	})

	t.Run("increments errors for 5xx responses", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/error", nil))

		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		var resp map[string]interface{}
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}

		if resp["requests_total"] != float64(1) {
			t.Errorf("expected requests_total 1, got %v", resp["requests_total"])
		}
		if resp["errors_total"] != float64(1) {
			t.Errorf("expected errors_total 1, got %v", resp["errors_total"])
		}
	})

	t.Run("200 responses do not increment errors", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/devices", nil))
		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/devices/123", nil))

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
		if resp["errors_total"] != float64(0) {
			t.Errorf("expected errors_total 0, got %v", resp["errors_total"])
		}
	})

	t.Run("calls next handler", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		var called bool
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
			w.WriteHeader(http.StatusOK)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/test", nil))

		if !called {
			t.Error("expected next handler to be called")
		}
	})

	t.Run("trace captured for 200 response with correct fields", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/api/devices", nil))

		traces := handler.GetTraces(10)
		if len(traces) != 1 {
			t.Fatalf("expected 1 trace, got %d", len(traces))
		}

		trace := traces[0]
		if trace.Method != "GET" {
			t.Errorf("expected method GET, got %s", trace.Method)
		}
		if trace.Path != "/api/devices" {
			t.Errorf("expected path /api/devices, got %s", trace.Path)
		}
		if trace.Status != http.StatusOK {
			t.Errorf("expected status 200, got %d", trace.Status)
		}
		if trace.DurationMs <= 0 {
			t.Errorf("expected positive duration, got %f", trace.DurationMs)
		}
		if trace.Timestamp == "" {
			t.Error("expected non-empty timestamp")
		}
	})

	t.Run("trace captured for 500 response with status 500", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/error", nil))

		traces := handler.GetTraces(10)
		if len(traces) != 1 {
			t.Fatalf("expected 1 trace, got %d", len(traces))
		}

		trace := traces[0]
		if trace.Method != "POST" {
			t.Errorf("expected method POST, got %s", trace.Method)
		}
		if trace.Path != "/api/error" {
			t.Errorf("expected path /api/error, got %s", trace.Path)
		}
		if trace.Status != http.StatusInternalServerError {
			t.Errorf("expected status 500, got %d", trace.Status)
		}
	})

	t.Run("counters still increment independently when trace captured", func(t *testing.T) {
		handler := interfaces.NewMetricsHandler()
		middleware := interfaces.MetricsMiddleware(handler)

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/a", nil))
		middleware(next).ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/b", nil))

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
		if resp["errors_total"] != float64(0) {
			t.Errorf("expected errors_total 0, got %v", resp["errors_total"])
		}

		traces := handler.GetTraces(10)
		if len(traces) != 2 {
			t.Errorf("expected 2 traces, got %d", len(traces))
		}
	})
}
