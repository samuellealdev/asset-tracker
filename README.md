# Asset Tracker

> Demo microservices application — hexagonal architecture, Docker, Kubernetes, event-driven with Kafka.

## Phase Summary

| Phase | Description | Status | Completed |
|-------|-------------|--------|-----------|
| 0 | Docker Compose Base — 5 containers healthy | ✅ Complete | 2026-06-12 |
| 1 | Go Hexagonal + PostgreSQL — full device CRUD (5 endpoints) | ✅ Complete | 2026-06-12 |
| 2 | Node Hexagonal + MongoDB — event logging | ✅ Complete | 2026-06-12 |
| 3 | Event-Driven Communication with Kafka — 3 event types (created/updated/deleted) | ✅ Complete | 2026-06-12 |
| 4 | Observability — structured logging, health checks, metrics | ✅ Complete | 2026-06-12 |
| 5 | Kubernetes Manifests | ✅ Complete | 2026-06-12 |
| 6 | Business Events — manual event tracking with GET /events | ✅ Complete | 2026-06-15 |
| 7 | JWT Authentication — login endpoint, auth middleware, protected write endpoints | ✅ Complete | 2026-06-18 |
| 8 | Frontend — React 19 SPA, 8 routes, 223+ tests, Docker/K8s | ✅ Complete | 2026-06-20 |
| 9 | Professional Loading State — skeleton grid on deleted devices refresh, 337 tests | ✅ Complete | 2026-06-26 |
| 10 | Deleted Devices Redesign — "Red Ledger" visual distinction for archived cards, 348 tests | ✅ Complete | 2026-06-28 |
| 11 | Modal Timeline Layout Fix — scrollbar CSS (Tailwind v4 `@utility` bugfix) + modal overflow fix (`min-h-0` flex contract) | ✅ Complete | 2026-06-29 |
| 12 | Live Metrics Offline State — four-state health classification (healthy/offline/unhealthy/stale), priority badge, 359 tests | ✅ Complete | 2026-06-29 |
| 13 | Request Tracing Metrics — ring buffer (cap 200) per backend, `GET /metrics/requests?limit=N` endpoint, frontend trace table in ServiceDetailCard modal, 500+ tests | ✅ Complete | 2026-06-29 |

## Architecture

```
                     ┌──────────────┐
                     │   web-ui     │── React 19 SPA (Vite)
                     │   :80        │
                     └──────┬───────┘
                            │
               ┌────────────┴────────────┐
               │                         │
        ┌──────▼───────┐        ┌───────▼──────┐
        │  go-service  │────►   │ node-service │
        │   :8080      │        │   :3000      │
        │              │────►   │              │────► MongoDB
        └──────┬───────┘ :9092  └──────────────┘
               │
               ▼
          PostgreSQL
```

Three services built with **hexagonal architecture** (ports & adapters):

| Service | Language | Port | Database | Responsibility |
|---------|----------|------|----------|----------------|
| `web-ui` | React 19 + Vite | 80 (nginx) | — | SPA frontend with login, devices CRUD, events, dashboards, settings |
| `go-service` | Go 1.23+ | 8080 | PostgreSQL | Full device CRUD (5 endpoints) + JWT auth + Kafka producer |
| `node-service` | Node.js 22+ | 3000 | MongoDB | Event logging (`POST /events`) + Kafka consumer |

Inter-service communication is **event-driven via Apache Kafka** in KRaft mode (no Zookeeper). The Go service produces three event types — `device.created`, `device.updated`, `device.deleted` — to the `device-events` topic; the Node service consumes all three from it asynchronously.

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Hexagonal architecture** (both services) | Domain logic isolated from infrastructure; testable without DB/HTTP. Domain layer has zero framework imports; application layer defines interfaces (ports); infrastructure implements them (adapters) |
| **No HTTP framework (stdlib only)** | Go uses `net/http` with Go 1.22+ method-based routing (`"GET /health"`, `"POST /auth/login"`). Node uses `node:http` with manual routing. Frameworks add middleware magic and reflection — our handler layer is thin enough (pure functions + DTO marshalling) that a framework would add more surface area than value |
| **Kafka KRaft for event-driven communication** | Decouples services; single-broker KRaft mode (no Zookeeper) for development. ADR-005 documents production topology (3 brokers, replication-factor 3) |
| **Kafka library asymmetry** (Go producer, Node consumer) | Go uses `segmentio/kafka-go` (pure Go, no CGO — simplifies distroless builds). Node uses `@confluentinc/kafka-javascript` (richer consumer API). Node degrades gracefully without Kafka; Go requires it at startup |
| **Manual dependency injection** (no DI framework) | Interfaces are small and stable (1-5 methods); a DI framework would add magic without reducing code. Wiring lives in one file per service (`cmd/main.go`, `src/index.js`) — trivially auditable |
| **Polyglot persistence** (PostgreSQL + MongoDB) | Device CRUD goes to PostgreSQL (relational, ACID, schema-enforced). Event log goes to MongoDB (document store, schema-flexible, append-heavy workload). Each database fits its domain model |
| **Domain errors as sentinel values** | Go domain layer uses `errors.New` sentinels (`ErrNameRequired`, `ErrNotFound`). No custom error types, no panics as control flow. Interface layer maps sentinels to HTTP status codes via `errors.Is` |
| **Database connection pooling** (`pgxpool`) | Single pool shared across all use cases via `pgxpool.New()`. Migrations run on startup within the same pool. Pool closed on shutdown via `defer pool.Close()` |
| **Schema-on-read for Kafka events** (no Schema Registry) | Events published as plain JSON without Avro/Protobuf schema. Producer and consumer share the event shape by convention. Acceptable for demo scope; production would add schema versioning (ADR-002) |
| **JWT Bearer token authentication** | Stateless auth: HMAC-SHA256 signed tokens on all write endpoints (`POST/PUT/DELETE /devices`). GET is public. Token validated via middleware wrapping the HTTP handler chain. Credentials via env vars (demo scope) |
| **12-Factor App configuration** (Factor III: Config) | All config via environment variables; `.env.example` is the contract. Secrets via env vars mapped to K8s Secrets in production. No config files committed to the repo |
| **React Context for auth state** | Single JWT token value — no global state library (Redux/Zustand) needed. Context is sufficient for one scalar value; anything heavier would be over-engineering |
| **SPA with nginx reverse proxy** | Chose SPA over SSR for simplicity (no Node.js runtime needed in production). nginx serves static build and proxies `/api/go/*` to Go, `/api/node/*` to Node. Multi-stage Docker build: `node:22-alpine` for build, `nginx:alpine` for runtime |
| **Four-state health classification with priority badge** | Replaced binary `healthy: boolean` with `status: HealthStatus` (healthy/offline/unhealthy/stale). Single top-bar badge shows worst-case via priority chain (Offline > Unhealthy > Stale). `classifyHealth()` is a pure function with zero framework deps |
| **Ring buffer for request tracing (cap 200)** | In-memory ring buffer per backend — zero allocation per push after warmup (pre-allocated slice/array). `sync.Mutex` (Go) / shared-nothing (Node) for thread safety. Separate `count` tracked alongside `writeIdx` since slice stays at cap after first wrap. No external persistence — purely additive, no migration risk |
| **Multi-stage Docker builds** (distroless / alpine) | Go binary compiled statically (`CGO_ENABLED=0`) into `gcr.io/distroless/static:nonroot` — no shell, no package manager, minimal CVEs. Node service uses `node:22-alpine` (needs JS runtime, cannot use distroless). Build tools dropped after compilation |
| **Graceful shutdown with connection draining** | Both services trap SIGINT/SIGTERM. Go: server shutdown with 10s context timeout, Kafka writer closed after server. Node: `server.close()` + Kafka consumer stop + MongoDB client close. Ensures in-flight requests complete and messages are flushed before exit |

> Detailed architecture decisions, including deferred production patterns (circuit breaker, outbox, rate limiting, idempotent consumer, Kafka multi-node, testcontainers), are documented in [`docs/adr/`](docs/adr/).

### Development Practices

| Practice | Details |
|----------|---------|
| **TDD for domain + application layers** | Red → green → refactor for every use case and domain entity. Test files co-located with source at every layer (domain, application, interfaces, infrastructure) |
| **Stdlib test runners** (`go test` + `node:test`) | Zero external testing framework dependencies. Go: table-driven tests with `t.Run`. Node: `node:test` with `describe`/`it` and native `mock` module |
| **Conventional commits** | `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:` — one commit per logical work unit. No AI attribution (`Co-Authored-By`) |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite 6, TanStack Router, TanStack Query, Tailwind CSS 4, Zod |
| Go service | Go 1.23+, `slog`, `pgx`, `net/http`, `segmentio/kafka-go`, `golang-jwt/jwt/v5` |
| Node.js service | Node.js 22+, `node:http`, `pino`, MongoDB native driver, `@confluentinc/kafka-javascript` |
| Databases | PostgreSQL 16, MongoDB 7 |
| Message Broker | Apache Kafka 3.9.2 (KRaft mode, apache/kafka image) |
| Containerization | Docker multi-stage builds, Docker Compose |
| Orchestration | Kubernetes (Kind for local dev) |
| Testing (frontend) | Vitest (unit/integration), Playwright (E2E) |

## Skills

| Skill | Purpose |
|-------|---------|
| `golang-pro` | Idiomatic Go, concurrency, testing |
| `hexagonal-architecture` | Ports & Adapters pattern |
| `solid-principles` | SOLID principles in Go and Node.js |
| `tdd` | Test-driven development workflow |
| `docker-expert` | Multi-stage builds, security hardening |
| `nodejs-best-practices` | Node.js patterns, async, security |
| `kubernetes-manifests` | K8s manifests with probes, resources |

## Quick Start

### Full Stack (with Docker Compose)

```bash
docker compose up -d
# Open http://localhost in your browser
# Login with username: admin, password: admin
```

### Frontend Development (standalone Vite dev server)

Requires the backend services running (via `docker compose up -d`):

```bash
cd web-ui
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

The Vite dev server proxies `/api/go/*` to `localhost:8080` and `/api/node/*` to `localhost:3000`.

### Backend API (curl)

```bash
docker compose up -d
curl localhost:8080/health        # → {"status":"ok","database":"connected"}
curl localhost:8080/health/live   # → {"status":"ok"} (liveness)
curl localhost:8080/health/ready  # → {"status":"ok","database":"connected"} (readiness)
curl localhost:8080/metrics       # → {"requests_total":0,"errors_total":0}
curl localhost:3000/health        # → {"status":"ok","database":"connected"}
curl localhost:3000/health/live   # → {"status":"ok"} (liveness)
curl localhost:3000/health/ready  # → {"status":"ok","database":"connected"} (readiness)
curl localhost:3000/metrics       # → {"requests_total":0,"errors_total":0}
curl localhost:8080/metrics/requests?limit=5  # → {"requests_total":0,"errors_total":0,"recent":[...]}
curl localhost:3000/metrics/requests?limit=5  # → {"requests_total":0,"errors_total":0,"recent":[...]}

# Login and get a JWT token (POST/PUT/DELETE /devices require JWT; GET is public)
curl -X POST localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}'

# Create a device (authenticated)
TOKEN="<token-from-login>"
curl -X POST localhost:8080/devices \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"laptop","type":"computer"}'

# List all devices
curl localhost:8080/devices

# Log an event
curl -X POST localhost:3000/events \
  -H 'Content-Type: application/json' \
  -d '{"type":"device.created","deviceId":"550e8400-e29b-41d4-a716-446655440000","name":"laptop"}'

# Query events by device ID
curl "localhost:3000/events?deviceId=550e8400-e29b-41d4-a716-446655440000"

# Query events by type (e.g., view deleted devices)
curl "localhost:3000/events?type=device.deleted"

# Verify Kafka events (after CRUD operations)
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka:9092 --topic device-events --from-beginning --max-messages 3

# Verify events in MongoDB
docker compose exec mongo mongosh -u mongo -p changeme --authenticationDatabase admin \
  --eval "use asset_tracker; db.events.find().pretty()"
```

## Running Tests

```bash
# Go service
cd go-service && go test ./...

# Node.js service
cd node-service && node --test

# Frontend (unit + integration)
cd web-ui && npm test

# Frontend (E2E — requires backend running)
cd web-ui && npx playwright test
```

## Seed Script

Reset and populate databases with demo data:

```bash
# Prerequisites: services running via `docker compose up -d`
./seed.sh
```

The script performs:

1. **Cleans** PostgreSQL (`DELETE FROM devices`) and MongoDB (`db.events.deleteMany({})`)
2. **Logs in** to obtain a JWT token
3. **Creates** 10 devices across 6 types (server, network, laptop, tablet, phone, storage, iot)
4. **Logs** 160 manual events (~16 per device) with realistic types, actors, and descriptions
5. **Deletes** 3 devices (Cisco Catalyst 9300, iPad Pro 12.9, Raspberry Pi 5) — they remain visible in the Deleted Devices section via `device.deleted` events

Output:

```
✅ 10 devices created
✅ 160 events logged
🗑️  3 devices deleted
```

Tests run automatically on every push via [GitHub Actions](.github/workflows/ci.yml).



