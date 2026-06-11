# Phase 0: Docker Compose Base

## Objective

Establish the containerized development environment with all four services — PostgreSQL, MongoDB, Go service, and Node.js service — running and healthy inside Docker Compose. This phase provides the runtime foundation for all subsequent phases.

## Technical Requirements

- Docker Compose v3.8+ file defining four services on a shared bridge network named `app-network`.
- PostgreSQL 16 with persistent volume, exposed on port 5432, healthcheck via `pg_isready`.
- MongoDB 7 with persistent volume, exposed on port 27017, healthcheck via `mongosh --eval "db.adminCommand('ping')"`.
- go-service: minimal Go HTTP server on port 8080 with a single `GET /health` endpoint returning HTTP 200 and `{"status":"ok"}`. Multi-stage Dockerfile (build stage + distroless runtime).
- node-service: minimal Node.js HTTP server on port 3000 with a single `GET /health` endpoint returning HTTP 200 and `{"status":"ok"}`. Multi-stage Dockerfile (build/deps stage + slim runtime).
- All containers MUST have healthchecks. Compose `depends_on` with `condition: service_healthy` for go-service and node-service.
- Environment variables for database connection strings passed via Compose (not hardcoded).
- `.env.example` file documenting all required environment variables.

## Files to Create

- `docker-compose.yml` — Compose definition with 4 services, app-network, volumes, healthchecks, and depends_on conditions
- `.env.example` — Template documenting POSTGRES_DSN, MONGO_URI, GO_PORT, NODE_PORT, NODE_URL
- `go-service/Dockerfile` — Multi-stage: `golang:1.23-alpine` builder → `gcr.io/distroless/static:nonroot` runtime
- `go-service/cmd/main.go` — Minimal Go program: HTTP server on `:8080`, `mux.HandleFunc("/health", ...)` returning `{"status":"ok"}`, uses `log/slog`
- `go-service/go.mod` — Module definition: `module github.com/samuellealdev/asset-tracker/go-service`, Go 1.23
- `node-service/Dockerfile` — Multi-stage: `node:22-alpine` with `npm ci --omit=dev` → `node:22-alpine` slim runtime
- `node-service/package.json` — Package definition with `"type": "module"`, `pino` dependency
- `node-service/index.js` — Minimal Node program: `http.createServer` on port 3000, `/health` endpoint returning `{"status":"ok"}`, uses `pino` for logging

## Files to Modify

None — all files are new creations.

## Acceptance Criteria

- [ ] `docker compose up --build` starts all 4 containers without errors.
- [ ] `docker compose ps` shows all 4 services as `healthy` within 60 seconds.
- [ ] `curl -s http://localhost:8080/health` returns `{"status":"ok"}` with HTTP 200.
- [ ] `curl -s http://localhost:3000/health` returns `{"status":"ok"}` with HTTP 200.
- [ ] `docker compose down -v` stops all services and removes volumes cleanly.
- [ ] `docker compose build` succeeds with no warnings from multi-stage builds.
- [ ] PostgreSQL is reachable at `localhost:5432` with credentials from env vars.
- [ ] MongoDB is reachable at `localhost:27017` with credentials from env vars.

## Constraints

- Go service MUST use `log/slog` for structured JSON logging to stdout.
- Node service MUST use `pino` for structured JSON logging to stdout.
- Both Dockerfiles MUST be multi-stage with minimal runtime images (no dev tools in final image).
- Environment variables MUST follow 12-Factor App — no hardcoded config in source.
- Healthcheck intervals MUST be reasonable: interval=10s, timeout=5s, retries=5, start_period=15s.
- The `app-network` bridge network MUST be explicitly named and used by all services.
- No external orchestration tools — pure Docker Compose only.

## Notes

- Reference the `docker-expert` skill for multi-stage build best practices and security hardening.
- For local development, use `.env` file with `docker compose --env-file .env`.
- The distroless runtime image for Go means no shell access — use `COPY --from=builder` carefully.
- MongoDB 7 healthcheck uses `mongosh` (not the deprecated `mongo` shell).
- PostgreSQL healthcheck uses `pg_isready -U ${POSTGRES_USER:-postgres}`.
- This phase establishes the development environment — all later phases run inside these containers.
