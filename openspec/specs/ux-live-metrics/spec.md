# ux-live-metrics Specification

## Purpose
Always-visible compact metrics bar showing service health dots and request/error counters, with configurable refresh intervals.

## Requirements

### Requirement: Health Indicators
The system MUST display health status dots for Go (:8080) and Node.js (:3000) services, polling every 2s by default. Each service MUST be classified as `healthy`, `offline`, `unhealthy`, or `stale` via `classifyHealth()`. A priority-based badge MUST appear in the top bar when any service is not healthy: Offline > Unhealthy > Stale. When all services are healthy, no badge is shown.

(Previously: binary healthy/unhealthy classification with a single amber "Stale" badge for any error)

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| All healthy | both health endpoints return `{status: "ok"}` | next poll cycle completes | two green dots render, no top-bar badge appears |
| Go offline | Go /health fetch throws TypeError, Node is healthy | next poll cycle completes | Go dot is gray, top-bar shows gray "Offline" badge |
| Node unhealthy | Node /health returns 503, Go is healthy | next poll cycle completes | Node dot is red, top-bar shows red "Unhealthy" badge |
| Go stale | Go query errored but stale cache exists, Node is healthy | next poll cycle completes | Go dot is amber, top-bar shows amber "Stale" badge |
| Badge priority — offline > unhealthy | Go is offline (TypeError), Node is unhealthy (503) | metrics bar renders | top-bar shows only gray "Offline" badge (not red "Unhealthy") |
| Badge priority — unhealthy > stale | Go is unhealthy (500), Node has stale cached data | metrics bar renders | top-bar shows only red "Unhealthy" badge (not amber "Stale") |
| Transition healthy → offline | both services healthy (green dots, no badge) | Go /health suddenly throws TypeError | Go dot transitions green→gray, top-bar shows gray "Offline" badge |
| Transition offline → healthy | Go offline (gray dot, "Offline" badge), Node healthy | Go /health recovers and returns `{status: "ok"}` | Go dot transitions gray→green, badge reverts to Node's state or disappears if all healthy |
| Concurrent network errors | both Go and Node /health throw TypeError simultaneously | metrics bar renders | both dots are gray, top-bar shows one gray "Offline" badge |
| Polling disabled | health interval set to 0 in settings | bar renders | dots show last known state, no polling |

### Requirement: classifyHealth() Utility

The system MUST provide a pure function `classifyHealth(error: unknown, data?: {status: string})` returning `"healthy" | "offline" | "unhealthy" | "stale"`.

Classification rules:
- `error` is `TypeError` (network failure) → `"offline"`
- `error` thrown with HTTP status and `!response.ok` → `"unhealthy"`
- `data !== undefined` AND `isError === true` (stale cache) → `"stale"`
- `data?.status === "ok"` AND `!isError` → `"healthy"`

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Healthy service | `error` is null and `data.status === "ok"` | `classifyHealth(null, { status: "ok" })` | returns `"healthy"` |
| Network error (offline) | `error` is a `TypeError` from a failed fetch | `classifyHealth(typeErrorInstance, undefined)` | returns `"offline"` |
| Unhealthy backend | `error` has `status: 503` and `body`, `data` is undefined | `classifyHealth({ status: 503, body: {} }, undefined)` | returns `"unhealthy"` |
| Stale cached data | `error` is non-null, `data.status === "ok"` (cached) | `classifyHealth(new Error("timeout"), { status: "ok" })` | returns `"stale"` |
| TypeError detection across bundlers | non-instanceof network error where `error.message` includes "fetch" | `classifyHealth({ message: "fetch failed" }, undefined)` | returns `"offline"` |

### Requirement: HealthDot Component

The `HealthDot` component MUST accept `status: "healthy" | "offline" | "unhealthy" | "stale"` and `label: string`, rendering a colored dot with aria-label. Color mapping:

| status | Tailwind class |
|--------|---------------|
| healthy | `bg-green-500` |
| offline | `bg-gray-400` |
| unhealthy | `bg-red-500` |
| stale | `bg-amber-400` |

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Each status renders correct color | `status` is `"offline"` | `HealthDot` renders | dot has `bg-gray-400` class and aria-label includes "offline" |
| Tooltip reflects status | any `status` value | dot is rendered | `title` attribute shows the human-readable status (e.g., "Healthy", "Offline", "Unhealthy", "Stale") |

### Requirement: ServiceDetailCard Modal

The `ServiceDetailCard` MUST reflect the correct status classification when opened, matching the dot color shown in the LiveMetrics bar.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Modal shows offline status | Go service is offline | user clicks the Go service button | modal's health badge shows a gray dot with "Offline" label |
| Modal shows stale status | Node service has stale data | user clicks the Node service button | modal's health badge shows an amber dot with "Stale" label |

### Requirement: Request/Error Counters
The system MUST display http_requests_total and errors_total from Prometheus metrics, polling every 5s by default.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Counters visible | metrics endpoint responds | bar renders | request and error counts for each service displayed |
| Metrics unavailable | GET /metrics fails | bar renders | "--" displayed for that service's counters |
| Polling active | bar visible | 5s elapses | counters refresh automatically |
| Configurable interval | settings change to 10s | — | counters refresh at new interval |

### Requirement: Compact Layout
The metrics bar MUST be compact, fitting within the TopBar area without requiring vertical scroll.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Desktop | viewport ≥ 1024px | bar renders | single row: [health dots] [request counters] [error counters] |
| Tablet | viewport 768-1023px | bar renders | single row with reduced spacing |
| Mobile | viewport < 768px | bar renders | compact icons only, counters on tap/hover |

### Requirement: Visibility
The LiveMetrics bar MUST be visible on all authenticated pages.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Devices page | user on /devices | page renders | metrics bar visible above/beside content |
| Dashboards page | user on /dashboards | page renders | metrics bar visible |
| Login page | user on /login | — | metrics bar NOT visible |
| Error page | 404/error renders | — | metrics bar visible if authenticated |

### Requirement: Ring Buffer Request Trace Storage
Each backend MUST maintain a thread-safe in-memory ring buffer (cap 200) of `RequestTrace` entries. When full, oldest MUST be overwritten. Zero-allocation push after warmup.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Normal push | buffer < 200 | new trace pushed | entry appended |
| Overflow wrap | buffer at 200 | new trace pushed | oldest overwritten, count stays 200 |
| Empty buffer | buffer empty | queried | returns empty array |
| Concurrent writes | two goroutines push | mutex arbitrates | no data races |
| Go integration | HTTP request completes | `ServeHTTP` returns | `PushTrace(method, path, status, duration, timestamp)` called |
| Node integration | response finishes | `res.finish` fires | `pushTrace({method, path, status, duration_ms, timestamp})` called |

### Requirement: Metrics Detail Endpoint
Each backend MUST expose `GET /metrics/requests?limit=N` returning `{requests_total, errors_total, recent: RequestTrace[]}`. `recent` MUST be newest-first. `limit` defaults to 50, caps at 200. Empty buffer returns `recent: []`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Default limit | 100 traces | `GET /metrics/requests` | 50 newest with counters |
| Custom limit | 100 traces | `?limit=10` | 10 newest |
| Limit capped | 200 traces | `?limit=500` | 200 newest |
| Empty buffer | buffer empty | endpoint called | `recent: []` with current counters |

### Requirement: Ring Buffer Integration Point
Go `MetricsMiddleware` MUST call `PushTrace(method, path, status, duration, timestamp)` after `ServeHTTP`. Node handler MUST call `pushTrace({method, path, status, duration_ms, timestamp})` on `res.finish`. No existing behavior removed.

(Previously: counters-only; no per-request trace.)

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Go success | 200 in 42ms | `ServeHTTP` done | `PushTrace({GET, /api/assets, 200, 42, <ISO>})` |
| Go error | 500 response | `ServeHTTP` done | `PushTrace` with error status |
| Node trace | response finished | `res.finish` | `pushTrace` with all fields |
| Counters retained | push added | counter increments | counters unaffected |

### Requirement: RequestTrace Type
Frontend MUST define TypeScript: `RequestTrace {method: string, path: string, status: number, duration_ms: number, timestamp: string}`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Type-safe parse | valid trace JSON | parsed as `RequestTrace` | all fields type-check |

### Requirement: getMetricsDetail API Function
MUST provide `getMetricsDetail(serviceUrl, opts?)` fetching `/metrics/requests`. Transport errors normalized (same pattern as `getMetrics`, `getHealth`).

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Success | backend returns JSON | called | typed `{requests_total, errors_total, recent}` |
| Network error | backend unreachable | called | normalized error thrown |
| Custom limit | `opts.limit = 10` | called | `?limit=10` in URL |
| Abort | signal aborted | fetch in flight | request cancelled |

### Requirement: useMetricsDetail Hook
MUST provide `useMetricsDetail(serviceUrl, limit?)` via TanStack Query: `retry: false`, `staleTime: 10_000`, own query key.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Initial load | hook mounted | query resolves | detail data returned |
| Error | fetch fails | query settles | error surfaced, no retry |
| Stale refetch | 10s elapsed | next focus/mount | query refetches |
| Key isolation | both metrics queries active | — | distinct cache entries |

### Requirement: ServiceDetailCard Trace Table
`ServiceDetailCard` modal MUST render scrollable trace table (`max-h-48 overflow-y-auto`) below health/counters. Columns: Method (colored badge), Path, Status (green <400, red ≥400), Duration (ms), Timestamp. Error rows (≥400) MUST have `border-l-2 border-red-500`. Empty state: "No recent requests".

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Table renders | 15 traces | modal opens | newest-first, all columns |
| Method badges | GET/POST/DELETE/PUT | table renders | blue/green/red/orange badges |
| Status colors | 200 vs 500 | table renders | green for 200, red for 500 |
| Error row border | status ≥ 400 | row renders | red left-border applied |
| Scroll overflow | 50+ traces | modal renders | container scrolls, header fixed |
| Empty state | zero traces | modal opens | "No recent requests" shown |
