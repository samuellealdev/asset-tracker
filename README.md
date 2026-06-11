# Asset Tracker

> Demo microservices application — hexagonal architecture, Docker, Kubernetes, event-driven with Kafka.

## Phase Summary

| Phase | Description | Status | Completed |
|-------|-------------|--------|-----------|
| 0 | Docker Compose Base — 4 containers healthy | 🔜 Planned | — |
| 1 | Go Hexagonal + PostgreSQL — device CRUD | 🔜 Planned | — |
| 2 | Node Hexagonal + MongoDB — event logging | 🔜 Planned | — |
| 3 | Resilient Inter-service Communication | 🔜 Planned | — |
| 4 | Observability — structured logging, health checks | 🔜 Planned | — |
| 5 | Kubernetes Manifests | 🔜 Planned | — |

## Architecture

```
                 ┌──────────────┐
                 │  go-service  │────► PostgreSQL
                 │   :8080      │
                 │              │────► node-service (HTTP)
                 └──────────────┘        :3000
                                          │
                 ┌──────────────┐         │
                 │ node-service │◄────────┘
                 │   :3000      │────► MongoDB
                 └──────────────┘
```

Two microservices built with **hexagonal architecture** (ports & adapters):

| Service | Language | Port | Database | Responsibility |
|---------|----------|------|----------|----------------|
| `go-service` | Go 1.23+ | 8080 | PostgreSQL | Device CRUD (`POST/GET /devices`) |
| `node-service` | Node.js 22+ | 3000 | MongoDB | Event logging (`POST /events`) |

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Hexagonal architecture** (both services) | Domain logic isolated from infrastructure; testable without DB/HTTP |
| **Manual dependency injection** | No DI frameworks — explicit wiring in `main.go`/`index.js` |
| **`slog`** for Go logging | Standard library, zero dependencies, structured JSON natively |
| **`pino`** for Node.js logging | Fastest Node.js logger, ideal for microservices |
| **`pgx`** for PostgreSQL driver | Most idiomatic and performant Go PostgreSQL driver |
| **Native test runners** | `go test` (table-driven) + `node:test` — no test frameworks needed |
| **TDD mandatory** for business logic | Red → green → refactor for all domain + application layers |
| **12-Factor App** configuration | All config via environment variables; `.env` only for local dev |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Go service | Go 1.23+, `slog`, `pgx`, `net/http` |
| Node.js service | Node.js 22+, `pino`, MongoDB native driver |
| Databases | PostgreSQL 16, MongoDB 7 |
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

## Quick Start (after Phase 0)

```bash
docker compose up -d
curl localhost:8080/health  # → {"status":"ok"}
curl localhost:3000/health  # → {"status":"ok"}
```

## Running Tests

```bash
# Go service
cd go-service && go test ./...

# Node.js service
cd node-service && node --test
```

