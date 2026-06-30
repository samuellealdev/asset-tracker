# Contributing

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Go 1.23+ (for backend development)
- Node.js 22+ (for frontend/backend development)

### Getting Started

```bash
docker compose up -d
```

### Running Each Service

- **Go service**: `cd go-service && go run ./cmd/`
- **Node.js service**: `cd node-service && node src/index.js`
- **Frontend**: `cd web-ui && npm run dev`

## Testing

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

## Commit Conventions

- [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- One commit per logical work unit
- No AI attribution (`Co-Authored-By`)

## Architecture

See the [README](README.md) for an architecture overview and [`docs/adr/`](docs/adr/) for detailed architecture decision records.

## Skills (for AI-assisted development)

| Skill | Purpose |
|-------|---------|
| `golang-pro` | Idiomatic Go, concurrency, testing |
| `hexagonal-architecture` | Ports & Adapters pattern |
| `solid-principles` | SOLID principles in Go and Node.js |
| `tdd` | Test-driven development workflow |
| `docker-expert` | Multi-stage builds, security hardening |
| `nodejs-best-practices` | Node.js patterns, async, security |
| `kubernetes-manifests` | K8s manifests with probes, resources |
