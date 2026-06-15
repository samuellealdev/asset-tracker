# Design: Phase 4 — Observability

## Technical Approach

Phase 4 adds three observability layers to both services without external dependencies. Structured JSON logging (slog/pino) is already present; this phase adds: (1) database-aware health endpoints with liveness/readiness split, (2) request logging middleware capturing method/path/status/duration, (3) optional in-memory `/metrics` endpoint with atomic counters. All new code lives in `interfaces/` (adapters layer) per hexagonal architecture.

## Architecture Decisions

### Decision 1: Separate HealthHandler from DeviceHandler

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep health inside DeviceHandler | Violates SRP | Rejected |
| Extract HealthHandler as new adapter | Clean separation; SRP compliant | **Chosen** |

**Rationale**: The `HealthHandler` needs `*pgxpool.Pool` for ping; the `DeviceHandler` needs only `DeviceUseCases`. Keeping them separate follows SRP.

### Decision 2: Liveness vs Readiness endpoints

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single `/health` with DB check | K8s can't distinguish probe types | Rejected |
| `/health/live` + `/health/ready` | K8s-idiomatic; clear semantics | **Chosen** |
| `/health` as backward-compat alias | Zero client breakage | **Chosen** |

### Decision 3: Middleware implementation style

Top-level middleware wrapping entire mux — one line in `main.go`/`index.js`, catches every request including 404s and health checks.

### Decision 4: Metrics endpoint simplicity

Plain JSON `{"requests_total": N, "errors_total": N}` — human-readable, curl-friendly, zero-dependency. Not Prometheus format.

## Data Flow

```
HTTP Request → LoggingMiddleware → Router → Handler → Response
                  │                              │
                  │ logs: method, path,          │
                  │ status, duration_ms          │
                  │                              │
                  └── MetricsHandler ────────────┘
                       increments counters
```

## File Changes

### Go Service
- `go-service/internal/interfaces/health_handler.go` — Create: HealthHandler with Pinger interface
- `go-service/internal/interfaces/health_handler_test.go` — Create: mock-based tests
- `go-service/internal/interfaces/middleware.go` — Create: LoggingMiddleware
- `go-service/internal/interfaces/middleware_test.go` — Create: buffer capture tests
- `go-service/internal/interfaces/metrics_handler.go` — Create: MetricsHandler with atomic counters
- `go-service/internal/interfaces/metrics_handler_test.go` — Create: counter tests
- `go-service/cmd/main.go` — Modify: wire HealthHandler, LoggingMiddleware, /metrics

### Node Service
- `node-service/src/interfaces/health-handler.js` — Create: HealthHandler with mongoClient
- `node-service/src/interfaces/health-handler.test.js` — Create: stubbed mongo tests
- `node-service/src/interfaces/middleware.js` — Create: logging middleware
- `node-service/src/interfaces/middleware.test.js` — Create: pino capture tests
- `node-service/src/interfaces/metrics-handler.js` — Create: MetricsHandler
- `node-service/src/interfaces/metrics-handler.test.js` — Create: counter tests
- `node-service/src/index.js` — Modify: wire all new components
