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
| **Hexagonal architecture** (both services) | Domain logic isolated from infrastructure; testable without DB/HTTP |
| **Kafka KRaft for event-driven communication** | Decouples services; single broker, no Zookeeper; KRaft simplifies ops |
| **Manual dependency injection** | No DI frameworks — explicit wiring in `main.go`/`index.js` |
| **`slog`** for Go logging | Standard library, zero dependencies, structured JSON natively |
| **`pino`** for Node.js logging | Fastest Node.js logger, ideal for microservices |
| **`pgx`** for PostgreSQL driver | Most idiomatic and performant Go PostgreSQL driver |
| **`golang-jwt/jwt/v5`** for JWT | Maintained fork of the standard Go JWT library; HMAC-SHA256 signing |
| **Native test runners** | `go test` (table-driven) + `node:test` — no test frameworks needed |
| **TDD mandatory** for business logic | Red → green → refactor for all domain + application layers |
| **12-Factor App** configuration | All config via environment variables; `.env` only for local dev |
| **JWT Bearer token authentication** | JWT auth on all `/devices` endpoints; `golang-jwt/jwt/v5` library; credentials via env vars (demo scope) |
| **React 19 + Vite** for frontend | Fast dev server with HMR, type-safe routing with TanStack Router |
| **TanStack Query** for server state | Cache invalidation on mutations, stale-while-revalidate, zero reducers |
| **React Context** for auth state | Single token value — no global state library needed |
| **SPA with nginx** | Multi-stage Docker build; nginx serves static assets and proxies API calls |
| **`LoadingSkeleton` grid variant** | Single component handles both row and grid skeletons via `variant` prop — backward-compatible, single source of animation/pulse |
| **Refresh skeleton over inline spinner** | Dual indicators (spinner + skeleton) create cognitive noise; full-grid skeleton is unambiguous, professional feedback |
| **Skeleton cards mirror card container classes** | Identical `rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-sm` classes prevent layout shift during skeleton-to-card transition |

> Detailed architecture decisions, including deferred production patterns (circuit breaker, outbox, rate limiting, idempotent consumer, Kafka multi-node, testcontainers), are documented in [`docs/adr/`](docs/adr/).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite 6, TanStack Router, TanStack Query, Tailwind CSS 4, Zod |
| Go service | Go 1.23+, `slog`, `pgx`, `net/http`, `segmentio/kafka-go`, `golang-jwt/jwt/v5` |
| Node.js service | Node.js 22+, `pino`, MongoDB native driver, `@confluentinc/kafka-javascript` |
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



