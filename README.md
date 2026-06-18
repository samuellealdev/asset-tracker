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

## Architecture

```
                 ┌──────────────┐
                 │  go-service  │────► PostgreSQL
                 │   :8080      │
                 │              │────► Kafka (producer)
                 └──────────────┘      :9092
                                        │
                 ┌──────────────┐       │
                 │ node-service │◄──────┘
                 │   :3000      │────► MongoDB
                 └──────────────┘      (consumer)
```

Two microservices built with **hexagonal architecture** (ports & adapters):

| Service | Language | Port | Database | Responsibility |
|---------|----------|------|----------|----------------|
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

> Detailed architecture decisions, including deferred production patterns (circuit breaker, outbox, rate limiting, idempotent consumer, Kafka multi-node, testcontainers), are documented in [`docs/adr/`](docs/adr/).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Go service | Go 1.23+, `slog`, `pgx`, `net/http`, `segmentio/kafka-go`, `golang-jwt/jwt/v5` |
| Node.js service | Node.js 22+, `pino`, MongoDB native driver, `@confluentinc/kafka-javascript` |
| Databases | PostgreSQL 16, MongoDB 7 |
| Message Broker | Apache Kafka 3.9.2 (KRaft mode, apache/kafka image) |
| Containerization | Docker multi-stage builds, Docker Compose |
| Orchestration | Kubernetes (Kind for local dev) |

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
```

Tests run automatically on every push via [GitHub Actions](.github/workflows/ci.yml).



