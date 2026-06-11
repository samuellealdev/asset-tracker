# Asset Tracker — Development Phases

## Project Overview

Asset Tracker is a demo microservices application demonstrating hexagonal architecture (Ports & Adapters), Docker containerization, resilient inter-service communication, and Kubernetes orchestration. It consists of two services:

- **go-service** (port 8080): Device lifecycle management using Go 1.23+ and PostgreSQL
- **node-service** (port 3000): Event logging using Node.js 22+ and MongoDB

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

- **Go service**: CRUD for devices (POST/GET /devices). On device creation, calls Node service to log a `device_created` event.
- **Node service**: Event logging (POST /events). Stores events in MongoDB.
- **Communication**: HTTP REST with exponential backoff retries (max 2 retries, 2s timeout), non-blocking on failure.
- **Both services**: Hexagonal architecture, structured JSON logging, manual dependency injection.

## Phase Index

| Phase | Description | Depends On | Status |
|-------|-------------|------------|--------|
| 0 | Docker Compose Base — all 4 containers healthy | None | 🔜 Planned |
| 1 | Go Hexagonal + PostgreSQL — device CRUD endpoints | Phase 0 | 🔜 Planned |
| 2 | Node Hexagonal + MongoDB — event logging endpoint | Phase 0 | 🔜 Planned |
| 3 | Resilient Inter-service Communication — retries, timeouts | Phases 1, 2 | 🔜 Planned |
| 4 | Observability — structured logging, health checks, metrics | Phases 1, 2 | 🔜 Planned |
| 5 | Kubernetes Manifests — Deployments, Services, ConfigMaps | Phases 0–4 | 🔜 Planned |

## How to Use

Each phase specification (`specs/phaseN.md`) is a self-contained, actionable document. Phases MUST be applied sequentially — each phase depends on all prior phases being complete.

### Applying a Phase

1. Read the phase specification fully.
2. Implement files in the order listed under **Files to Create**.
3. Verify each **Acceptance Criterion** using the specified commands.
4. Do NOT proceed to the next phase until ALL acceptance criteria pass.

### Relevant Skills

These project skills provide implementation guidance. Load them before writing code:

| Skill | Path | Used In |
|-------|------|---------|
| `hexagonal-architecture` | `.agents/skills/hexagonal-architecture/SKILL.md` | All phases |
| `golang-pro` | `.agents/skills/golang-pro/SKILL.md` | Phases 1, 3, 4 |
| `nodejs-best-practices` | `.agents/skills/nodejs-best-practices/SKILL.md` | Phases 2, 3, 4 |
| `tdd` | `.agents/skills/tdd/SKILL.md` | Phases 1, 2, 3 |
| `solid-principles` | `.agents/skills/solid-principles/SKILL.md` | All phases |
| `docker-expert` | `.agents/skills/docker-expert/SKILL.md` | Phase 0 |
| `kubernetes-manifests` | `.agents/skills/kubernetes-manifests/SKILL.md` | Phase 5 |

### Test Commands

| Service | Unit Tests | Build Check |
|---------|-----------|-------------|
| go-service | `go test ./...` | `go build ./...` |
| node-service | `node --test` | `node --check` |
