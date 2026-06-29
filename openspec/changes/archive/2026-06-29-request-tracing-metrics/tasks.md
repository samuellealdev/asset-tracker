# Tasks: Request Tracing Metrics

## Implementation Order

Backends first (Go → Node), then frontend. Each task follows strict TDD: RED → GREEN → REFACTOR.

---

## PR 1: Go Backend — Ring Buffer + Detail Endpoint

### Task 1.1 — RequestTrace struct and ring buffer data structure

**File**: `go-service/internal/interfaces/metrics_handler.go`
**Test file**: `go-service/internal/interfaces/metrics_handler_test.go`

**RED** — Write failing tests for ring buffer behavior:
- `PushTrace` appends when buffer below capacity (push 3 traces, retrieve 3)
- `PushTrace` overwrites oldest when buffer at capacity 200 (fill buffer, push one more, verify oldest dropped)
- `GetTraces` returns empty slice when buffer has zero entries
- `GetTraces(limit)` returns at most `limit` entries, newest-first
- Concurrent writes: spawn 10 goroutines each pushing 30 traces, run with `-race`, verify `traceCount` equals 300 and buffer contains 200 entries
- `RequestTrace` struct JSON serialization matches expected field names (`method`, `path`, `status`, `duration_ms`, `timestamp`)

**GREEN** — Add to `MetricsHandler`:
```go
type RequestTrace struct {
    Method     string  `json:"method"`
    Path       string  `json:"path"`
    Status     int     `json:"status"`
    DurationMs float64 `json:"duration_ms"`
    Timestamp  string  `json:"timestamp"`
}
```
- Fields: `traces []RequestTrace`, `traceWriteIdx int`, `traceCount int64`, `mu sync.Mutex`
- Constructor `NewMetricsHandler()` pre-allocates `traces := make([]RequestTrace, 200)`
- `PushTrace(trace RequestTrace)`: lock, write at `traces[traceWriteIdx]`, advance `traceWriteIdx = (traceWriteIdx + 1) % 200`, increment `traceCount`, unlock
- `GetTraces(limit int) []RequestTrace`: lock, clamp limit, walk buffer backwards from `traceWriteIdx-1` collecting up to `min(limit, storedCount)` entries, unlock, return

**REFACTOR** — Extract `min(a, b int) int` helper if used in multiple places. Verify `go vet ./...` passes. Run `-race` on tests.

**Acceptance criteria**:
- All six RED tests pass
- `go test -race ./internal/interfaces/` exits 0
- Ring buffer wraps correctly at cap 200
- Zero allocation per push after warmup (pre-allocated slice)

**Estimated lines**: +70 code, +100 tests

---

### Task 1.2 — Metrics detail endpoint handler

**File**: `go-service/internal/interfaces/metrics_handler.go`
**Test file**: `go-service/internal/interfaces/metrics_handler_test.go`

**RED** — Write failing tests for `HandleRequests`:
- `GET /metrics/requests` (no `?limit`) with 60 traces stored: returns 50 newest, correct counters
- `GET /metrics/requests?limit=10` with 60 traces stored: returns 10 newest
- `GET /metrics/requests?limit=500` with 200 traces stored: returns 200 (capped at buffer max)
- `GET /metrics/requests?limit=0` returns empty `recent` (clamped to 1 minimum per spec)
- `GET /metrics/requests` with empty buffer: returns `recent: []` with current counters
- Response has `Content-Type: application/json`
- Response shape includes key `requests_total`, `errors_total`, `recent` array

**GREEN** — Add `HandleRequests(w http.ResponseWriter, r *http.Request)`:
- Parse `limit` from `r.URL.Query().Get("limit")`, default 50
- Clamp to [1, 200]
- Read counters atomically (`m.requestsTotal.Load()`, `m.errorsTotal.Load()`)
- Call `m.GetTraces(limit)`
- `writeJSON(w, 200, map[string]interface{}{...})` with `requests_total`, `errors_total`, `recent`

**REFACTOR** — Consider extracting limit parsing into a helper. Run `go vet ./...`.

**Acceptance criteria**:
- All seven RED tests pass
- Response shape matches design contract
- Existing `ServeHTTP` on `/metrics` still works (backward compatible)

**Estimated lines**: +30 code, +80 tests

---

### Task 1.3 — Middleware push integration

**File**: `go-service/internal/interfaces/middleware.go`
**Test file**: `go-service/internal/interfaces/middleware_test.go`

**RED** — Write failing tests for `MetricsMiddleware` trace capture:
- After processing a 200 response: `PushTrace` was called with correct method, path, status 200, non-zero duration, ISO timestamp
- After processing a 500 response: `PushTrace` was called with status 500
- Counter behavior unchanged: `requestsTotal` and `errorsTotal` increment as before
- Existing counter-only middleware tests still pass

**GREEN** — Modify `MetricsMiddleware` inner handler:
- Capture `start := time.Now()` before `next.ServeHTTP(rw, r)`
- After `ServeHTTP`, compute `durationMs` from `time.Since(start)`
- Construct `RequestTrace{Method: r.Method, Path: r.URL.Path, Status: rw.statusCode, DurationMs: durationMs, Timestamp: time.Now().UTC().Format(time.RFC3339)}` 
- Call `m.PushTrace(trace)` AFTER incrementing counters (order per design data flow)
- Error increment logic unchanged

**REFACTOR** — Verify no regression in existing tests. Run `go vet ./...`.

**Acceptance criteria**:
- All four RED tests pass
- `go test -race ./internal/interfaces/` exits 0
- All existing middleware tests still pass (no regression)

**Estimated lines**: +8 code (modify inner handler), +60 tests

---

### Task 1.4 — Route wiring in main.go

**File**: `go-service/cmd/main.go`

**RED** — No new tests needed. Route wiring verified by existing middleware integration tests and manual `curl`.

**GREEN** — Add route registration in `main()`:
```go
mux.HandleFunc("GET /metrics/requests", metricsHandler.HandleRequests)
```
Place after existing `mux.Handle("GET /metrics", metricsHandler)` line.

**REFACTOR** — None.

**Acceptance criteria**:
- `curl http://localhost:8080/metrics/requests?limit=5` returns valid JSON
- `curl http://localhost:8080/metrics` still works (backward compatible)
- Application compiles and starts without errors

**Estimated lines**: +2 code

---

### PR 1 Review Budget: ~350 lines (270 code + 240 tests - 160 overlap adjustment)
**Under 400**: ✅ Single PR safe

---

## PR 2: Node Backend — Ring Buffer + Detail Endpoint

### Task 2.1 — Ring buffer data structure

**File**: `node-service/src/interfaces/metrics-handler.js`
**Test file**: `node-service/src/interfaces/metrics-handler.test.js`

**RED** — Write failing tests (use `node:test` + `node:assert`):
- `pushTrace` appends when buffer below capacity (push 3, retrieve 3 via `getTraces(200)`)
- `pushTrace` overwrites oldest when buffer at capacity 200 (fill, push one more, verify oldest dropped, count stays 200)
- `getTraces` returns empty array when buffer has zero entries
- `getTraces(limit)` returns at most `limit` entries, newest-first
- `pushTrace` fields preserved: method, path, status, durationMs, timestamp

**GREEN** — Add to `MetricsHandler`:
```js
constructor() {
  this.requests = 0;
  this.errors = 0;
  this.cap = 200;
  this.traces = new Array(this.cap);
  this.writeIdx = 0;
  this.count = 0;
}

pushTrace({ method, path, status, durationMs, timestamp }) {
  this.traces[this.writeIdx] = { method, path, status, duration_ms: durationMs, timestamp };
  this.writeIdx = (this.writeIdx + 1) % this.cap;
  this.count++;
}

getTraces(limit) {
  const stored = Math.min(this.count, this.cap);
  const clamped = Math.max(1, Math.min(limit, this.cap));
  const result = new Array(Math.min(clamped, stored));
  for (let i = 0; i < result.length; i++) {
    const idx = (this.writeIdx - 1 - i + this.cap) % this.cap;
    result[i] = { ...this.traces[idx] };
  }
  return result;
}
```

**REFACTOR** — Verify existing tests still pass. Check that `this.traces` pre-allocation with `new Array(this.cap)` creates a sparse array correctly for index assignment.

**Acceptance criteria**:
- All five RED tests pass
- Existing `MetricsHandler` tests still pass (no regression)
- Ring buffer wraps correctly at cap 200

**Estimated lines**: +25 code, +80 tests

---

### Task 2.2 — Metrics detail endpoint handler

**File**: `node-service/src/interfaces/metrics-handler.js`
**Test file**: `node-service/src/interfaces/metrics-handler.test.js`

**RED** — Write failing tests for `handleRequests`:
- `GET /metrics/requests` (no `?limit`) with 60 traces: returns 50 newest, correct counters via mocked req/res
- `GET /metrics/requests?limit=10`: returns 10 newest
- `GET /metrics/requests?limit=500`: returns 200 (capped)
- `GET /metrics/requests?limit=0`: returns empty `recent` (clamped to 1 minimum)
- Empty buffer: returns `recent: []` with current counters
- Content-Type is `application/json`
- Response shape includes `requests_total`, `errors_total`, `recent`

**GREEN** — Add `handleRequests(req, res)`:
- Parse limit from `new URL(req.url, 'http://localhost').searchParams.get('limit')`
- Default 50, clamp to [1, 200]
- Call `this.getTraces(limit)`
- `res.writeHead(200, { 'Content-Type': 'application/json' })`
- `res.end(JSON.stringify({ requests_total, errors_total, recent }) + '\n')`

**REFACTOR** — Extract limit parsing helper. Ensure existing `handleMetrics` still works.

**Acceptance criteria**:
- All seven RED tests pass
- Response JSON matches design contract
- Existing `handleMetrics` on `/metrics` still works

**Estimated lines**: +25 code, +75 tests

---

### Task 2.3 — Server integration (finish event + route)

**File**: `node-service/src/index.js`
**Test file**: `node-service/src/interfaces/metrics-handler.test.js` (integration test addition)

**RED** — Write failing integration test:
- Create real `http.createServer` with metrics handler
- Make request, verify trace pushed into ring buffer
- Verify `GET /metrics/requests` returns the captured trace
- Verify error status (500) captured and counters increment

**GREEN** — Modify `index.js`:
- In request handler's `finish` event callback: capture `req.method`, `req.url` path (parsed), `res.statusCode`, duration (computed from a `start` captured at `incrementRequest` time)
- Call `metricsHandler.pushTrace({ method, path, status, durationMs, timestamp })`
- Register route in URL dispatch:
```js
if (url.pathname === '/metrics/requests' && req.method === 'GET') {
  metricsHandler.handleRequests(req, res);
  return;
}
```

**REFACTOR** — Move `start` timestamp capture as close to request entry as possible. Verify existing tests still pass.

**Acceptance criteria**:
- Integration test passes: real HTTP request → trace pushed → detail endpoint returns it
- `curl http://localhost:3000/metrics/requests?limit=5` returns valid JSON
- `curl http://localhost:3000/metrics` still works

**Estimated lines**: +10 code, +50 tests

---

### PR 2 Review Budget: ~265 lines (60 code + 205 tests)
**Under 400**: ✅ Single PR safe

---

## PR 3: Frontend — Types, Hook, Table

### Task 3.1 — Types and API function

**File**: `web-ui/src/lib/api/metrics.ts`
**Test file**: `web-ui/src/lib/api/metrics.test.ts`

**RED** — Write failing tests for `getMetricsDetail`:
- Success: `getMetricsDetail("go")` fetches `/api/go/metrics/requests`, returns typed `MetricsDetail`
- Success with custom limit: `getMetricsDetail("go", { limit: 10 })` fetches `?limit=10`
- Network error: rejected with `TypeError`
- Non-OK response: rejected with `{ status, body }` matching existing `getMetrics` pattern
- Invalid JSON response: rejected with `TypeError`
- Abort signal: fetch aborted when signal fires

**GREEN** — Add to `metrics.ts`:
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

const DETAIL_MAP = {
  go: "/api/go/metrics/requests",
  node: "/api/node/metrics/requests",
} as const;

interface GetMetricsDetailOpts {
  limit?: number;
  signal?: AbortSignal;
}

export async function getMetricsDetail(
  service: "go" | "node",
  opts?: GetMetricsDetailOpts,
): Promise<MetricsDetail> {
  const baseUrl = DETAIL_MAP[service];
  const params = new URLSearchParams();
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
  const url = params.size > 0 ? `${baseUrl}?${params}` : baseUrl;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      signal: opts?.signal,
    });
  } catch {
    throw new TypeError(`Failed to fetch ${service} metrics detail`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TypeError(`Failed to fetch ${service} metrics detail`);
  }

  if (!response.ok) {
    throw { status: response.status, body };
  }

  return body as MetricsDetail;
}
```

**REFACTOR** — Consider extracting common fetch pattern if duplicated across multiple API functions. Verify existing `getMetrics` tests still pass. Run `vitest run`.

**Acceptance criteria**:
- All six RED tests pass
- Existing `getMetrics` tests still pass
- Types compile cleanly

**Estimated lines**: +35 code, +70 tests

---

### Task 3.2 — TanStack Query hooks

**File**: `web-ui/src/hooks/use-metrics.ts`
**Test file**: `web-ui/src/hooks/__tests__/use-metrics.test.tsx`

**RED** — Write failing tests for `useGoMetricsDetail` and `useNodeMetricsDetail`:
- `useGoMetricsDetail`: fetches on mount, returns `MetricsDetail` data
- `useNodeMetricsDetail`: fetches on mount, returns `MetricsDetail` data
- Error: query surfaces error state when fetch fails (no retry)
- Stale refetch: `staleTime` is 10,000ms
- Key isolation: Go and Node queries use distinct cache keys (e.g., `["metrics-detail", "go"]` vs `["metrics-detail", "node"]`)
- Custom `refetchInterval` parameter: passed through to `useQuery`

**GREEN** — Add to `use-metrics.ts`:
```typescript
import { getMetricsDetail } from "@/lib/api/metrics";

export function useGoMetricsDetail(refetchInterval: number = 10_000) {
  return useQuery({
    queryKey: ["metrics-detail", "go"],
    queryFn: () => getMetricsDetail("go"),
    staleTime: 10_000,
    refetchInterval,
    retry: false,
  });
}

export function useNodeMetricsDetail(refetchInterval: number = 10_000) {
  return useQuery({
    queryKey: ["metrics-detail", "node"],
    queryFn: () => getMetricsDetail("node"),
    staleTime: 10_000,
    refetchInterval,
    retry: false,
  });
}
```

**REFACTOR** — Consider factory pattern if both hooks share identical shape. Verify existing `useGoMetrics`/`useNodeMetrics` tests still pass.

**Acceptance criteria**:
- All six RED tests pass
- Existing `useGoMetrics`/`useNodeMetrics` tests still pass
- Hooks follow same pattern as existing metrics hooks

**Estimated lines**: +20 code, +75 tests

---

### Task 3.3 — ServiceDetailCard trace table

**File**: `web-ui/src/components/layout/LiveMetrics.tsx`
**Test file**: `web-ui/src/components/layout/__tests__/LiveMetrics.test.tsx`

**RED** — Write failing tests for trace table rendering:
- Table renders with 15 traces: newest-first, all columns visible (Method, Path, Status, Duration, Timestamp)
- Method badges: GET shows blue, POST shows green, DELETE shows red, PUT shows orange
- Status colors: status 200 shows green text, status 500 shows red text
- Error row border: status ≥ 400 rows have `border-l-2 border-red-500`
- Scroll overflow: container has `max-h-48 overflow-y-auto` classes
- Empty state: "No recent requests" when trace array is empty
- Integration with modal: clicking Go metrics button shows trace table in modal

**GREEN** — Modify `LiveMetrics.tsx`:
- Import `useGoMetricsDetail`, `useNodeMetricsDetail` hooks
- Import `RequestTrace`, `MetricsDetail` types
- Wire hooks: `const goDetail = useGoMetricsDetail(metricsInterval)` (same interval as metrics hook)
- Add `traces` prop to `ServiceDetailCard` interface
- Render trace table below existing counters section, after a divider
- Method badge component: `span` with text color classes mapped from method
- Status text: `text-green-400` for <400, `text-red-400` for ≥400
- Error row: conditional `border-l-2 border-red-500 pl-2` class
- Scroll container: `div` with `max-h-48 overflow-y-auto` wrapping the table
- Empty state: conditional render when `traces.length === 0`
- Pass detail hook data to `ServiceDetailCard` in the modal section:
```tsx
{detailService === "go" && (
  <ServiceDetailCard
    status={goStatus}
    requests={goReq}
    errors={goErr}
    lastRefresh={lastRefresh}
    traces={goDetail.data?.recent ?? []}
  />
)}
```
- Loading state: show loading skeleton in modal while detail query is loading
- Error state: show error message in modal if detail query fails

**REFACTOR** — Extract trace table into a separate `TraceTable` component if `LiveMetrics.tsx` exceeds 300 lines. Extract method badge into helper. Verify all existing `LiveMetrics` tests still pass.

**Acceptance criteria**:
- All seven RED tests pass
- All existing `LiveMetrics` tests still pass
- Table scrolls correctly with 50+ rows
- Empty state renders correctly
- Error rows visually distinct via red left border
- `vitest run` exits 0

**Estimated lines**: +70 code, +95 tests

---

### PR 3 Review Budget: ~365 lines (125 code + 240 tests)
**Under 400**: ✅ Single PR safe

---

## Review Workload Forecast

### Estimated Lines Changed by Chained PR

| PR | Tasks | Files | Est. Code | Est. Tests | Est. Total | Risk |
|----|-------|-------|-----------|------------|------------|------|
| PR #1 — Go Backend | 1.1–1.4 | `metrics_handler.go`, `middleware.go`, `main.go`, `metrics_handler_test.go`, `middleware_test.go` | ~110 | ~240 | ~350 | ✅ Under 400 |
| PR #2 — Node Backend | 2.1–2.3 | `metrics-handler.js`, `index.js`, `metrics-handler.test.js` | ~60 | ~205 | ~265 | ✅ Under 400 |
| PR #3 — Frontend | 3.1–3.3 | `metrics.ts`, `use-metrics.ts`, `LiveMetrics.tsx`, `metrics.test.ts`, `use-metrics.test.tsx`, `LiveMetrics.test.tsx` | ~125 | ~240 | ~365 | ✅ Under 400 |
| **Total** | **10 tasks** | **12 files** | **~295** | **~685** | **~980** | — |

### Delivery Strategy: Stacked PRs to Main

Each backend PR is independently deployable (tests pass, no frontend dependency). Frontend PR builds on both backend PRs via API contract.

```text
main
 ├── PR #1 (Go backend)      ~350 lines
 ├── PR #2 (Node backend)    ~265 lines
 └── PR #3 (Frontend)        ~365 lines   ← depends on PRs #1 + #2 landing first
```

**Rationale for Stacked over Feature Branch Chain**: Each backend endpoint can be deployed to main independently — the endpoints are additive and don't break existing functionality. The frontend can render traces from whichever backends support the endpoint; if only Go's endpoint is deployed, only Go's traces render.

### 400-Line Budget Risk Assessment

| Risk | Assessment |
|------|------------|
| All three PRs individually under 400 | ✅ Safe |
| Combined change exceeds 400 | ✅ Chained — handled by 3 PRs |
| Test code is majority of delta | 🔶 Monitor — but tests follow TDD discipline and are proportional |
| Go tests most complex (concurrency) | 🔶 Verify `-race` passes on PR #1 |

### Verification Plan Per PR

1. **PR #1**: `go test -race ./...` → `go vet ./...` → manual `curl /metrics/requests?limit=5`
2. **PR #2**: `node --test src/interfaces/metrics-handler.test.js` → manual `curl localhost:3000/metrics/requests`
3. **PR #3**: `vitest run` → manual UI verification: open modal, see trace table, scroll, verify error borders

### Implementation Checklist

- [x] **T1.1**: Go ring buffer data structure (RED → GREEN → REFACTOR)
- [x] **T1.2**: Go metrics detail endpoint handler
- [x] **T1.3**: Go middleware push integration
- [x] **T1.4**: Go route wiring in main.go
- [x] **T2.1**: Node ring buffer data structure
- [x] **T2.2**: Node metrics detail endpoint handler
- [x] **T2.3**: Node server integration (finish event + route)
- [x] **T3.1**: Frontend types and API function
- [x] **T3.2**: Frontend TanStack Query hooks
- [x] **T3.3**: Frontend ServiceDetailCard trace table
