# Delta for ux-live-metrics

## ADDED Requirements

### Requirement: Ring Buffer Request Trace Storage
Each backend MUST maintain a thread-safe in-memory ring buffer (cap 200) of `RequestTrace` entries. When full, oldest MUST be overwritten. Zero-allocation push after warmup.

- **Normal push**: GIVEN buffer < 200 WHEN new trace pushed THEN entry appended.
- **Overflow wrap**: GIVEN buffer at 200 WHEN new trace pushed THEN oldest overwritten, count stays 200.
- **Empty buffer**: GIVEN buffer empty WHEN queried THEN returns empty array.
- **Concurrent writes**: GIVEN two goroutines push WHEN mutex arbitrates THEN no data races.
- **Go integration**: GIVEN HTTP request completes WHEN `ServeHTTP` returns THEN `PushTrace(method, path, status, duration, timestamp)` called.
- **Node integration**: GIVEN response finishes WHEN `res.finish` fires THEN `pushTrace({method, path, status, duration_ms, timestamp})` called.

### Requirement: Metrics Detail Endpoint
Each backend MUST expose `GET /metrics/requests?limit=N` returning `{requests_total, errors_total, recent: RequestTrace[]}`. `recent` MUST be newest-first. `limit` defaults to 50, caps at 200. Empty buffer returns `recent: []`.

- **Default limit**: GIVEN 100 traces WHEN `GET /metrics/requests` THEN 50 newest with counters.
- **Custom limit**: GIVEN 100 traces WHEN `?limit=10` THEN 10 newest.
- **Limit capped**: GIVEN 200 traces WHEN `?limit=500` THEN 200 newest.
- **Empty buffer**: GIVEN buffer empty WHEN endpoint called THEN `recent: []` with current counters.

### Requirement: RequestTrace Type
Frontend MUST define TypeScript: `RequestTrace {method: string, path: string, status: number, duration_ms: number, timestamp: string}`.

- **Type-safe parse**: GIVEN valid trace JSON WHEN parsed as `RequestTrace` THEN all fields type-check.

### Requirement: getMetricsDetail API Function
MUST provide `getMetricsDetail(serviceUrl, opts?)` fetching `/metrics/requests`. Transport errors normalized (same pattern as `getMetrics`, `getHealth`).

- **Success**: GIVEN backend returns JSON WHEN called THEN typed `{requests_total, errors_total, recent}`.
- **Network error**: GIVEN backend unreachable WHEN called THEN normalized error thrown.
- **Custom limit**: GIVEN `opts.limit = 10` WHEN called THEN `?limit=10` in URL.
- **Abort**: GIVEN signal aborted WHEN fetch in flight THEN request cancelled.

### Requirement: useMetricsDetail Hook
MUST provide `useMetricsDetail(serviceUrl, limit?)` via TanStack Query: `retry: false`, `staleTime: 10_000`, own query key.

- **Initial load**: GIVEN hook mounted WHEN query resolves THEN detail data returned.
- **Error**: GIVEN fetch fails WHEN query settles THEN error surfaced, no retry.
- **Stale refetch**: GIVEN 10s elapsed WHEN next focus/mount THEN query refetches.
- **Key isolation**: GIVEN both metrics queries active THEN distinct cache entries.

### Requirement: ServiceDetailCard Trace Table
`ServiceDetailCard` modal MUST render scrollable trace table (`max-h-48 overflow-y-auto`) below health/counters. Columns: Method (colored badge), Path, Status (green <400, red ≥400), Duration (ms), Timestamp. Error rows (≥400) MUST have `border-l-2 border-red-500`. Empty state: "No recent requests".

- **Table renders**: GIVEN 15 traces WHEN modal opens THEN newest-first, all columns.
- **Method badges**: GIVEN GET/POST/DELETE/PUT WHEN table renders THEN blue/green/red/orange badges.
- **Status colors**: GIVEN 200 vs 500 WHEN table renders THEN green for 200, red for 500.
- **Error row border**: GIVEN status ≥ 400 WHEN row renders THEN red left-border applied.
- **Scroll overflow**: GIVEN 50+ traces WHEN modal renders THEN container scrolls, header fixed.
- **Empty state**: GIVEN zero traces WHEN modal opens THEN "No recent requests" shown.

## MODIFIED Requirements

### Requirement: Ring Buffer Integration Point
Go `MetricsMiddleware` MUST call `PushTrace(method, path, status, duration, timestamp)` after `ServeHTTP`. Node handler MUST call `pushTrace({method, path, status, duration_ms, timestamp})` on `res.finish`. No existing behavior removed.

(Previously: counters-only; no per-request trace.)

- **Go success**: GIVEN 200 in 42ms WHEN `ServeHTTP` done THEN `PushTrace({GET, /api/assets, 200, 42, <ISO>})`.
- **Go error**: GIVEN 500 response WHEN `ServeHTTP` done THEN `PushTrace` with error status.
- **Node trace**: GIVEN response finished WHEN `res.finish` THEN `pushTrace` with all fields.
- **Counters retained**: GIVEN push added WHEN counter increments THEN counters unaffected.
