# Design: Phase 0 — Docker Compose Base

## Technical Approach

Phase 0 establishes the containerized development runtime: five services on a single Docker Compose bridge network (`app-network`) with persistent volumes, health checks, and startup ordering via `depends_on: condition: service_healthy`. Two application services (Go, Node.js) use multi-stage Dockerfiles for minimal runtime images. All configuration follows 12-Factor App — environment variables flow from `.env` → Compose → containers.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| **Network topology** | Single `app-network` bridge, all services attached | Multiple networks per service | Simpler DNS-based discovery; all internal traffic stays on one network; no cross-network routing complexity needed at this stage |
| **Kafka mode** | KRaft (no Zookeeper) + static `CLUSTER_ID` | bitnami/kafka with Zookeeper, or dynamic cluster ID | Eliminates Zookeeper container; static ID ensures deterministic restarts; apache/kafka:3.9.2 has first-class KRaft support |
| **Go runtime image** | `gcr.io/distroless/static:nonroot` | `alpine` or `scratch` | No shell, no package manager → minimal attack surface; nonroot user; requires built-in healthcheck binary mode since no `curl`/`wget` available |
| **Node runtime image** | `node:22-alpine` (slim stage) | `distroless/nodejs` or full Debian image | Alpine keeps image small (~50MB after deps); `wget` available for healthcheck; distroless lacks shell for `CMD-SHELL` healthchecks |
| **Healthcheck strategy** | Per-container: `pg_isready` (PG), `mongosh ping` (Mongo), `kafka-topics.sh --list` (Kafka), `/server healthcheck` built-in (Go), `wget /health` (Node) | Docker's built-in TCP probe or `curl`-based curl for Go | Distroless Go image has no shell → custom binary healthcheck subcommand; Kafka `--list` validates full broker readiness, not just port open; `wget` is present in node:22-alpine |

## Container Architecture

```
                    ┌─────────────────────────────────────────┐
                    │          app-network (bridge)            │
                    │                                          │
  Host              │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
  :5432 ──────────────▶│postgres │  │  mongo  │  │  kafka  │ │
  :27017 ─────────────▶│  :5432  │  │ :27017  │  │ :9092   │ │
  :9092 ──────────────▶│         │  │         │  │         │ │
  :8080 ──────────────▶└────┬────┘  └────┬────┘  └────┬────┘ │
  :3000 ──────────────▶     │            │            │       │
                    │       │            │            │       │
                    │  ┌────▼────────────▼────────────▼────┐  │
                    │  │         go-service :8080          │  │
                    │  │   depends_on: postgres, kafka     │  │
                    │  │   /server healthcheck (internal)  │  │
                    │  └───────────────────────────────────┘  │
                    │                                          │
                    │  ┌───────────────────────────────────┐  │
                    │  │       node-service :3000          │  │
                    │  │   depends_on: mongo, kafka        │  │
                    │  │   wget /health (external probe)   │  │
                    │  └───────────────────────────────────┘  │
                    └─────────────────────────────────────────┘
```

- **Postgres, Mongo, Kafka**: exposed to host for direct dev access (ports 5432, 27017, 9092)
- **Go-service, Node-service**: exposed to host for API access (ports 8080, 3000); inter-service comms use internal DNS names (`postgres`, `mongo`, `kafka`)
- All five containers resolve each other by Compose service name via Docker's embedded DNS

## Startup Dependency Order

```
postgres ──┐
            ├──(healthy)──▶ go-service
kafka ─────┘
                              │
mongo ──────┬──(healthy)──▶ node-service
kafka ──────┘
```

`depends_on` with `condition: service_healthy` ensures application services only start after their dependencies pass health checks. Kafka has `start_period: 30s` (KRaft initialization is slower). All others use `start_period: 15s`. Health check interval is 10s with 5 retries → each service can take up to ~65s (15 + 5×10) before being marked unhealthy.

## Data Flow

### Environment Variable Flow

```
.env.example ──(copy)──▶ .env ──(docker compose --env-file)──▶ Compose variable substitution
                                                                      │
                                                     ┌────────────────┼────────────────┐
                                                     ▼                ▼                ▼
                                              postgres env      go-service env    node-service env
                                              (POSTGRES_DB,     (POSTGRES_DSN,    (MONGO_URI,
                                               POSTGRES_USER,    KAFKA_BROKER,    KAFKA_BROKER,
                                               POSTGRES_PASSWORD) PORT)            PORT)
```

- `POSTGRES_DSN` and `MONGO_URI` are full connection strings composed in `.env` from individual variables
- Compose interpolates `${VAR}` references at parse time
- Services receive only the variables they need via the `environment:` block

### Volume Persistence

| Volume | Mount point | Content | Lifecycle |
|--------|-------------|---------|-----------|
| `postgres_data` | `/var/lib/postgresql/data` | PG data directory | Survives `down`; destroyed by `down -v` |
| `mongo_data` | `/data/db` | MongoDB data files | Survives `down`; destroyed by `down -v` |
| `kafka_data` | `/var/lib/kafka/data` | KRaft metadata + topic logs | Survives `down`; destroyed by `down -v` |

Application services are stateless — no volumes needed. Named volumes are managed by Docker and stored in `/var/lib/docker/volumes/`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `docker-compose.yml` | Create | 5-service Compose definition with network, volumes, health checks, depends_on |
| `.env.example` | Create | Template documenting all required environment variables |
| `go-service/Dockerfile` | Create | Multi-stage: `golang:1.23-alpine` → `gcr.io/distroless/static:nonroot` |
| `go-service/cmd/main.go` | Create | HTTP server on :8080, `/health` endpoint, built-in `healthcheck` subcommand |
| `go-service/go.mod` | Create | Module `github.com/samuellealdev/asset-tracker/go-service`, Go 1.23 |
| `node-service/Dockerfile` | Create | Multi-stage: `node:22-alpine` deps → `node:22-alpine` runtime |
| `node-service/package.json` | Create | `"type": "module"`, `pino` dependency |
| `node-service/index.js` | Create | HTTP server on :3000, `/health` endpoint, pino structured logging |

## Health Check Strategy

| Service | Probe | Mechanism | Remarks |
|---------|-------|-----------|---------|
| postgres | `pg_isready -U postgres` | `CMD-SHELL` | Native PG tool, validates DB accepts connections |
| mongo | `mongosh --eval 'db.adminCommand("ping")'` | `CMD-SHELL` | Validates MongoDB is writable (not just listening) |
| kafka | `kafka-topics.sh --bootstrap-server localhost:9092 --list` | `CMD-SHELL` | Validates broker accepts admin requests; exit 0 = ready |
| go-service | `/server healthcheck` | `CMD` (no shell) | Custom subcommand does HTTP GET to `localhost:8080/health`; distroless-compatible |
| node-service | `wget -qO- http://localhost:3000/health` | `CMD-SHELL` | Lightweight; `wget` present in Alpine image |

## Multi-Stage Dockerfile Rationale

Both Dockerfiles separate build dependencies from runtime artifacts:

- **Go**: Builder stage compiles a static binary (`CGO_ENABLED=0`). Runtime stage (distroless) copies only the binary — no Go toolchain, no source, no shell. Image size: ~5MB for the binary + ~2MB for distroless base.
- **Node.js**: Deps stage runs `npm ci --omit=dev`. Runtime stage copies `node_modules` + source. No devDependencies, no npm cache in final image. `USER node` enforces non-root execution.

This eliminates dev tools from production images, reducing attack surface and image size.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | `docker compose up --build` succeeds all 5 containers healthy | Manual verification script |
| Integration | `curl /health` on both services returns 200 | Manual or CI health check |
| Integration | `docker compose exec kafka ... --list` returns exit 0 | Manual Kafka readiness check |
| Integration | `docker compose down -v` cleans up cleanly | Manual teardown check |

No unit tests required for Phase 0 — only container health and connectivity are validated.

## Open Questions

- None. Phase 0 is archived.
