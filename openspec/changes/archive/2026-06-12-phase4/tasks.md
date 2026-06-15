# Tasks: Phase 4 — Observability

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Go observability → PR 2: Node observability |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Status |
|------|------|--------|
| 1 | Go service: health, logging middleware, metrics | ✅ Complete |
| 2 | Node service: health, logging middleware, metrics | ✅ Complete |

## Phase 1: Go Service — Health & Middleware (PR 1) ✅

- [x] 1.1 Remove `HandleHealth` from DeviceHandler (SRP)
- [x] 1.2 Create `HealthHandler` with Pinger interface, /health/live + /health/ready
- [x] 1.3 Create health handler tests with mock pinger
- [x] 1.4 Create `LoggingMiddleware` wrapping http.Handler
- [x] 1.5 Create middleware tests with slog buffer capture
- [x] 1.6 Create `MetricsHandler` with atomic counters
- [x] 1.7 Create metrics handler tests
- [x] 1.8 Wire in main.go

## Phase 2: Node Service — Health & Middleware (PR 2) ✅

- [x] 2.1 Create `HealthHandler` with mongoClient ping
- [x] 2.2 Create health handler tests with stubbed mongo
- [x] 2.3 Create logging middleware with pino
- [x] 2.4 Create middleware tests with pino capture
- [x] 2.5 Create `MetricsHandler` with plain counters
- [x] 2.6 Create metrics handler tests
- [x] 2.7 Wire in index.js

## Phase 3: Verification ✅

- [x] 3.1 Go tests pass (85 tests)
- [x] 3.2 Node tests pass (46 tests)
- [x] 3.3 E2E: all /health/* endpoints respond correctly
- [x] 3.4 Metrics endpoints return JSON counters
- [x] 3.5 Structured JSON logs present in both services
