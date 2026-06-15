# Asset Tracker — Development Phases

## Project Overview

Asset Tracker is a demo microservices application demonstrating hexagonal architecture (Ports & Adapters), Docker containerization, event-driven communication with Kafka, and Kubernetes orchestration. It consists of two services:

- **go-service** (port 8080): Device lifecycle management using Go 1.23+ and PostgreSQL
- **node-service** (port 3000): Event logging using Node.js 22+ and MongoDB

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

- **Go service**: Full CRUD for devices (`POST /devices`, `GET /devices`, `GET /devices/:id`, `PUT /devices/:id`, `DELETE /devices/:id`). On create, update, and delete, produces `device.created`, `device.updated`, and `device.deleted` events to Kafka topic `device-events`.
- **Node service**: Event logging. Consumes from `device-events` Kafka topic and stores events in MongoDB.
- **Communication**: Event-driven via Apache Kafka (KRaft mode, single broker, no Zookeeper). Async produce (non-blocking) on the producer side. Consumer group support for scalability.
- **Both services**: Hexagonal architecture, structured JSON logging, manual dependency injection.

## Phase Index

| Phase | Description | Depends On | Status |
|-------|-------------|------------|--------|
| 0 | Docker Compose Base — all 5 containers healthy | None | ✅ Complete |
| 1 | Go Hexagonal + PostgreSQL — full device CRUD (5 endpoints) | Phase 0 | ✅ Complete |
| 2 | Node Hexagonal + MongoDB — event logging endpoint | Phase 0 | ✅ Complete |
| 3 | Event-Driven Communication with Kafka — pub/sub with 3 event types | Phases 1, 2 | ✅ Complete |
| 4 | Observability — structured logging, health checks, metrics | Phases 1, 2 | ✅ Complete |
| 5 | Kubernetes Manifests — Deployments, Services, ConfigMaps, Ingress | Phases 0–4 | ✅ Complete |
| 6 | Business Events — manual event tracking with GET /events | Phases 1, 2 | 🔜 Planned |

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
