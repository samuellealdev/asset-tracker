# Phase 4: Observability

## Objective

Instrument both services with structured JSON logging, database-aware health checks, and basic request/error counters. This phase ensures the system is observable and debuggable in both development and production-like environments.

## Technical Requirements

- **Structured JSON logging** (already present from Phases 0–2). This phase enhances log messages with consistent field names (`service`, `method`, `path`, `status`, `duration_ms`, `error`) and appropriate levels (DEBUG for detailed traces, INFO for request/response, WARN for retries, ERROR for failures).
- **Logging middleware** in both services: intercept every HTTP request, log `method`, `path`, `status`, and `duration_ms` at INFO level after response completes. In Go: a middleware wrapper around `http.Handler`. In Node: a wrapper function around the handler.
- **Enhanced `/health` endpoint** in both services: MUST check database connectivity (liveness) and return appropriate HTTP status. 200 if DB is reachable, 503 if DB is unreachable. Response format: `{"status":"ok","database":"connected"}` or `{"status":"degraded","database":"disconnected"}`.
- **Go service**: `GET /health` checks PostgreSQL via `pgxpool.Pool.Ping(ctx)`. Add `GET /health/live` (always 200 while process is running) and `GET /health/ready` (200 only if DB is connected).
- **Node service**: `GET /health` checks MongoDB via `MongoClient.db().admin().ping()`. Add `GET /health/live` and `GET /health/ready` with same semantics.
- **Metrics endpoint** (OPTIONAL — implement if time permits): `GET /metrics` in both services returning JSON with counters: `requests_total`, `requests_errors_total`, `devices_created_total` (Go), `events_logged_total` (Node). Use in-memory counters (`sync/atomic` in Go, simple variable in Node). Expose as `Content-Type: application/json`.

## Files to Create

- `go-service/internal/interfaces/logging_middleware.go` — HTTP middleware wrapping handler, logs request/response with duration
- `go-service/internal/interfaces/logging_middleware_test.go` — Tests verifying log output contains expected fields
- `go-service/internal/interfaces/health_handler.go` — Enhanced health handler with DB ping: `/health`, `/health/live`, `/health/ready`
- `go-service/internal/interfaces/health_handler_test.go` — Tests: 200 when DB healthy, 503 when DB down, live always 200
- `go-service/internal/interfaces/metrics_handler.go` — (OPTIONAL) Metrics endpoint with atomic counters
- `go-service/internal/interfaces/metrics_handler_test.go` — (OPTIONAL) Tests verifying counter increment
- `node-service/src/interfaces/logging-middleware.js` — Request logging wrapper, logs method/path/status/duration
- `node-service/src/interfaces/logging-middleware.test.js` — Tests verifying log output
- `node-service/src/interfaces/health-handler.js` — Enhanced health handler: `/health`, `/health/live`, `/health/ready`
- `node-service/src/interfaces/health-handler.test.js` — Tests for health states
- `node-service/src/interfaces/metrics-handler.js` — (OPTIONAL) Metrics endpoint
- `node-service/src/interfaces/metrics-handler.test.js` — (OPTIONAL) Metrics tests

## Files to Modify

- `go-service/cmd/main.go` — Wire logging middleware around all routes. Wire enhanced health handler with DB pool injected. Register `/health/live`, `/health/ready` routes. Optionally register `/metrics`.
- `go-service/internal/interfaces/device_handler.go` — Apply logging middleware (or wire in main.go).
- `node-service/src/index.js` — Wire logging middleware. Wire enhanced health handler with MongoDB client injection. Register `/health/live`, `/health/ready` routes. Optionally register `/metrics`.
- `node-service/src/interfaces/event-router.js` — Apply logging middleware (or wire in index.js).

## Acceptance Criteria

- [ ] `go test ./...` and `node --test` pass all tests including logging and health check tests.
- [ ] `curl -s http://localhost:8080/health | jq` returns `{"status":"ok","database":"connected"}` when PostgreSQL is running.
- [ ] `curl -s http://localhost:3000/health | jq` returns `{"status":"ok","database":"connected"}` when MongoDB is running.
- [ ] `curl -s http://localhost:8080/health/live` returns HTTP 200 even if DB is down (liveness probe).
- [ ] `curl -s http://localhost:3000/health/ready` returns HTTP 503 when MongoDB is stopped (readiness probe).
- [ ] `docker compose logs go-service | grep '"level":"INFO"'` shows structured JSON log entries for HTTP requests with `method`, `path`, `status`, `duration_ms` fields.
- [ ] `docker compose logs node-service | grep '"level":30'` shows structured JSON log entries for HTTP requests (pino uses numeric levels: 30=INFO).
- [ ] OPTIONAL: `curl -s http://localhost:8080/metrics` returns JSON with `requests_total` and `devices_created_total` counters. Same for Node on port 3000.

## Constraints

- Logging MUST use `log/slog` (Go) and `pino` (Node) — no alternative logging libraries.
- Log level MUST be configurable via environment variable: `LOG_LEVEL` (default: `INFO` or `info`).
- Health check responses MUST complete in under 1 second (DB ping timeout of 500ms).
- Do NOT expose sensitive data in logs — no SQL queries, no MongoDB connection strings, no request bodies that may contain PII.
- Log format MUST be JSON with at minimum `level`, `msg`, `time` fields in every log line.
- Metrics counters (if implemented) MUST be thread-safe (`sync/atomic` in Go, no special handling needed in single-threaded Node).

## Notes

- Load the `golang-pro` and `nodejs-best-practices` skills for logging patterns.
- In pino, the default log level values are: 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal.
- In slog, use `slog.LevelInfo`, `slog.LevelWarn`, `slog.LevelError`, `slog.LevelDebug`.
- The Kubernetes manifests in Phase 5 will use `/health/live` for liveness probes and `/health/ready` for readiness probes. Implementing them now is forward-looking.
- For Go logging middleware, use `slog.LogAttrs` with structured attributes for best performance.
- For Node logging middleware, use `pino` child loggers or pass `req.log = logger.child({...})`.
- The metrics endpoint is optional but highly recommended — it provides immediate observability value for minimal effort.
