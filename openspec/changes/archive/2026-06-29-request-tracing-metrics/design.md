# Design: Request Tracing Metrics

## Technical Approach

Ring buffer (cap 200) per backend stores request traces captured by existing middleware/handler instrumentation. New `GET /metrics/requests?limit=` endpoint returns counters + newest-first traces. Frontend polls at 10s via React Query, renders scrollable table inside `ServiceDetailCard` modal.

## Architecture Decisions

| Decision | Option | Choice | Rationale |
|----------|--------|--------|-----------|
| Fetch timing | Always vs lazy (enabled flag) | Always | Consistent with existing metrics hooks; data is tiny (~7KB). Lazy via `enabled` documented as viable if scaling |
| Go thread safety | Mutex vs atomic spin-lock | `sync.Mutex` | Composite state (slice + index + count). Contention is negligible at ring-buffer scale |
| Ring buffer count | Separate `count` vs `len(traces)` | Separate `count` | `len(traces)` stays at cap after first wrap; `count` tracks actual inserts for correct `min(count,limit)` math |
| Go route dispatch | Separate `HandleRequests` vs `ServeHTTP` path dispatch | Separate method | Go 1.22+ exact path matching; `/metrics` and `/metrics/requests` are distinct. Clearer intent |
| Timestamp format | Unix ms vs ISO 8601 | ISO 8601 string | Human-readable in API responses, frontend renders with `toLocaleString()` |
| Trace pre-allocation | In constructor vs lazy | Constructor (`make([]RequestTrace, cap)`) | Zero allocations per push; ~12KB fixed overhead at startup |

## Data Flow

```
HTTP request → middleware captures {method, path, status, duration, timestamp}
  ├── MetricsHandler.IncrementRequests() (atomic)
  ├── MetricsHandler.PushTrace(trace) → mutex lock → traces[writeIdx] = trace → advance modulo cap → unlock
  └── if status ≥ 400 → MetricsHandler.IncrementErrors() (atomic)

GET /metrics/requests?limit=50
  → MetricsHandler.HandleRequests()
    → atomic reads: requestsTotal, errorsTotal
    → mutex lock → copy newest-first slice → unlock
    → JSON response: {requests_total, errors_total, recent: Trace[]}

UI: useGoMetricsDetail() → 10s poll → getMetricsDetail("go") → fetch /api/go/metrics/requests
  → MetricsDetail → ServiceDetailCard renders scrollable table
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `go-service/internal/interfaces/metrics_handler.go` | Modify | Add `RequestTrace` struct, ring buffer fields (`traces`, `writeIdx`, `count`, `mu`), `PushTrace()`, `GetTraces()`, `HandleRequests()` |
| `go-service/internal/interfaces/middleware.go` | Modify | `MetricsMiddleware` captures `time.Now()` at start, constructs `RequestTrace` after `ServeHTTP`, calls `PushTrace` |
| `go-service/cmd/main.go` | Modify | Register `GET /metrics/requests` route on mux |
| `node-service/src/interfaces/metrics-handler.js` | Modify | Ring buffer fields (`traces`, `cap`, `writeIdx`, `count`), `pushTrace()`, `getTraces()`, `handleRequests()` |
| `node-service/src/index.js` | Modify | In request handler `finish` event: capture duration, call `pushTrace()`. Register `/metrics/requests` route |
| `web-ui/src/lib/api/metrics.ts` | Modify | Add `RequestTrace` interface, `MetricsDetail` interface, `getMetricsDetail()` (same error-handling pattern as `getMetrics`) |
| `web-ui/src/hooks/use-metrics.ts` | Modify | Add `useGoMetricsDetail()`, `useNodeMetricsDetail()` with 10s staleTime+refetchInterval |
| `web-ui/src/components/layout/LiveMetrics.tsx` | Modify | Add `traces` prop to `ServiceDetailCard`, render scrollable table below counters, wire detail hooks |

## Interfaces / Contracts

### Go — RequestTrace struct

```go
type RequestTrace struct {
    Method     string `json:"method"`
    Path       string `json:"path"`
    Status     int    `json:"status"`
    DurationMs float64 `json:"duration_ms"`
    Timestamp  string `json:"timestamp"`
}
```

### Go — MetricsHandler additions

```go
// fields
traces       []RequestTrace
traceWriteIdx int
traceCount   int64
mu           sync.Mutex

// PushTrace inserts a trace into the ring buffer.
func (m *MetricsHandler) PushTrace(trace RequestTrace)

// GetTraces returns up to `limit` traces, newest-first.
func (m *MetricsHandler) GetTraces(limit int) []RequestTrace

// HandleRequests handles GET /metrics/requests?limit=N
func (m *MetricsHandler) HandleRequests(w http.ResponseWriter, r *http.Request)
```

### Node — pushTrace shape

```js
pushTrace({ method, path, status, durationMs, timestamp }) {
    this.traces[this.writeIdx] = trace;
    this.writeIdx = (this.writeIdx + 1) % this.cap;
    this.count++;
}
```

### TypeScript — shared types

```typescript
export interface RequestTrace {
    method: string;
    path: string;
    status: number;
    duration_ms: number;
    timestamp: string; // ISO 8601
}

export interface MetricsDetail {
    requests_total: number;
    errors_total: number;
    recent: RequestTrace[];
}
```

### HTTP API — `GET /metrics/requests`

```
Request:  GET /metrics/requests?limit=50
Response: 200 application/json
{
  "requests_total": 1042,
  "errors_total": 7,
  "recent": [
    {"method":"GET","path":"/api/devices","status":200,"duration_ms":42.3,"timestamp":"2026-06-29T14:30:00Z"},
    ...
  ]
}
```

- `limit` query param: integer, default 50, clamped to [1, 200].
- `recent` ordered newest-first.
- When fewer than `limit` traces exist, returns all available.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Go unit | Ring buffer push/retrieve (under, at, over capacity); `HandleRequests` response shape and limit clamping; middleware captures all fields | `go test` with `httptest`, table-driven subtests |
| Node unit | Ring buffer push/retrieve (under, at, over capacity); `handleRequests` response shape | `node:test` with `mock.fn()` for res |
| Frontend unit | `getMetricsDetail` resolves/rejects; `useMetricsDetail` hook fetches; `ServiceDetailCard` renders trace rows, error styling, empty state | Vitest + `@testing-library/react`, mock fetch |
| Integration | Go middleware → handler round-trip; Node request handler → pushTrace in `finish` event | `httptest` (Go), real `http.createServer` (Node) |

## Migration / Rollout

No migration required. New endpoint is additive. Ring buffer is in-memory only. Rollback: revert the 8 files to HEAD~.

## Open Questions

None.
