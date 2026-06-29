# Proposal: Request Tracing Metrics

## Intent

Operators see aggregate request/error counters in LiveMetrics but cannot identify WHICH endpoints are slow or failing without grepping logs. This surfaces recent HTTP request traces (method, path, status, duration, timestamp) inside the ServiceDetailCard modal.

## Scope

### In Scope
- Ring buffer (cap 200) per backend: Go `sync.Mutex` + slice / Node `Array`
- `GET /metrics/requests?limit=50` in both services → `{requests_total, errors_total, recent: RequestTrace[]}`
- Go `MetricsHandler.PushTrace()` via `MetricsMiddleware` (already captures all fields)
- Node `MetricsHandler.pushTrace()` via request handler's `finish` event
- Frontend: `RequestTrace` type, `getMetricsDetail()`, `useMetricsDetail()` hook
- `ServiceDetailCard` table: Method badge, Path, Status (color-coded), Duration (ms), Timestamp
- Error rows (status ≥ 400): red left-border

### Out of Scope
- Body/header capture | Cursor pagination | Sampling config | External persistence | WebSocket push

## Capabilities

### Modified Capabilities
- `ux-live-metrics`: ServiceDetailCard gains request trace table below existing health/counters

## Approach

Ring buffer, per exploration recommendation. Write pointer advances modulo 200; no allocation per push. Memory: ~40KB per backend. New endpoint returns counters + `recent` slice (newest-first). Frontend renders table with `max-h-48 overflow-y-auto`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `go-service/.../metrics_handler.go` | Modified | Ring buffer, PushTrace, route handler |
| `go-service/.../middleware.go` | Modified | Push trace entries |
| `go-service/cmd/main.go` | Modified | Wire `/metrics/requests` |
| `node-service/.../metrics-handler.js` | Modified | Ring buffer, pushTrace, route handler |
| `node-service/src/index.js` | Modified | Route + pushTrace call |
| `web-ui/src/lib/api/metrics.ts` | Modified | `getMetricsDetail()`, types |
| `web-ui/src/hooks/use-metrics.ts` | Modified | `useMetricsDetail()` hook |
| `web-ui/.../LiveMetrics.tsx` | Modified | ServiceDetailCard table |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race on ring buffer (Go) | Low | `sync.Mutex`; 200-entry buffer minimizes contention |
| Modal overflow with 50+ rows | Med | Scrollable container; server-side limit cap |
| TS type mismatch | Low | Separate `MetricsDetail` interface |

## Rollback Plan

Revert 8 files to HEAD~. Endpoint is additive — no DB migrations or config changes.

## Dependencies

None — both backends already capture required fields in existing middleware/request handlers.

## Success Criteria

- [ ] `/metrics/requests?limit=10` returns counters + ≤10 traces, newest-first, with method/path/status/duration_ms/timestamp
- [ ] Ring buffer wraps at 200 (oldest dropped, no leak)
- [ ] ServiceDetailCard renders scrollable trace table; error rows have red left-border
- [ ] All current tests pass + new tests: ring overflow (Go, Node), handler responses (Go, Node), hook, component table
