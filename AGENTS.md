# AGENTS.md — asset-tracker

Project-level agent instructions. Complements the global `~/.config/opencode/AGENTS.md`.

## Language

- Conversation with the user: **Spanish from Spain** (Castilian). Neutral, professional tone.
- Technical artifacts (code, comments, identifiers, UI copy, commit messages, PR descriptions, docs): **English** by default.
- If Spanish technical artifacts are explicitly requested, use neutral Spanish.

## Methodology — SDD (Spec-Driven Development)

This project follows the SDD workflow defined in the Gentle AI orchestrator. Key rules:

- Every change goes through: `proposal → specs → design → tasks → apply → verify → archive`.
- All SDD artifacts (design, tasks, verify-report, archive-report) MUST be persisted to BOTH Engram AND the filesystem (`openspec/changes/archive/`). Never save to only one — Engram is session memory, filesystem is the permanent record.
- Session preflight (pace, artifact store, PR strategy, review budget) must be completed before ANY SDD command.

### README Update Protocol

After completing each development phase, update `README.md` incrementally:

1. Add a **Phase Summary** section at the top of the README with the current phase status table.
2. Document the **architecture decisions** made during that phase.
3. Do NOT erase previous phase documentation — the README grows incrementally.
4. After updating the phase status, review ALL other README sections (Quick Start, Architecture, Running Tests) and update any that reference now-completed phases or stale information.

The README serves as the living project journal. It should answer: what we built, why we built it that way, and how to run it.

### TDD Requirement

All business logic MUST be written test-first (red → green → refactor):

- Go: `go test ./...` (table-driven tests, subtests with `t.Run`)
- Node.js: `node --test` (native test runner) or `vitest` if the project adopts it later

## Project Skills

The following skills are installed at `.agents/skills/` and MUST be loaded before any code work:

| Skill | Path | Purpose |
|-------|------|---------|
| `golang-pro` | `.agents/skills/golang-pro/SKILL.md` | Idiomatic Go, concurrency, testing, gRPC/REST |
| `hexagonal-architecture` | `.agents/skills/hexagonal-architecture/SKILL.md` | Ports & Adapters pattern across Go and Node.js |
| `solid-principles` | `.agents/skills/solid-principles/SKILL.md` | All five SOLID principles with Go/Node examples |
| `tdd` | `.agents/skills/tdd/SKILL.md` | Red-green-refactor workflow |
| `docker-expert` | `.agents/skills/docker-expert/SKILL.md` | Multi-stage builds, security hardening, compose |
| `nodejs-best-practices` | `.agents/skills/nodejs-best-practices/SKILL.md` | Node.js patterns, async, security |
| `kubernetes-manifests` | `.agents/skills/kubernetes-manifests/SKILL.md` | K8s manifests with probes, resources, best practices |

Load protocol: before any code task, read the relevant SKILL.md files. The registry at `.atl/skill-registry.md` contains the full index.

## Code Conventions

### Architecture

- **Hexagonal (Ports & Adapters)** for both services.
- Directory structure per service:
  ```
  service/
  ├── cmd/              # Entry point (main)
  ├── internal/
  │   ├── domain/       # Entities, value objects, repository interfaces (ports)
  │   ├── application/  # Use cases, service layer
  │   ├── infrastructure/ # Adapters: DB, HTTP clients, external services
  │   └── interfaces/   # Adapters: HTTP handlers, gRPC, message consumers
  └── test/             # Integration and E2E tests
  ```
- Domain layer has ZERO framework dependencies. Infrastructure and interfaces adapt external tools to domain ports.

### Logging

- **Go service**: `log/slog` (standard library, structured JSON output)
- **Node.js service**: `pino` (fastest structured JSON logger)
- Log format: JSON with at minimum `level`, `msg`, `time`, and relevant context fields.
- Use `DEBUG` level for development, `INFO` for production.
- Never log secrets, tokens, or personally identifiable information.

### Configuration

- All configuration via environment variables (12-Factor App).
- `.env.example` is the reference; never commit `.env`.
- Use `.env` files only for local development; production uses actual env vars or secret managers.

### Testing

- TDD for all business logic (domain + application layers).
- Unit tests: domain and application layers (fast, no external deps).
- Integration tests: infrastructure adapters (DB, HTTP clients) with test containers or mocks.
- E2E tests: inter-service communication (phase 5+).
- Go: table-driven tests with `t.Run`, mocks via interfaces (no mock library by default).
- Node.js: `node:test` with `describe`/`it` and `mock` module.

### Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- One commit per logical work unit (see `work-unit-commits` skill).
- Never include AI attribution (`Co-Authored-By`).

## Tech Stack

| Component | Technology |
|-----------|------------|
| Go service | Go 1.23+, `log/slog`, PostgreSQL driver (`pgx`) |
| Node.js service | Node.js 22+, `pino`, MongoDB driver |
| Containerization | Docker with multi-stage builds |
| Orchestration | Kubernetes (local: kind or minikube) |
| API protocol | REST (JSON), gRPC considered for inter-service comms |
| Testing (Go) | `go test` with stdlib `testing` |
| Testing (Node.js) | `node:test` (native) |

## Delivery

- Private GitHub repo: `samuellealdev/asset-tracker`
- Branch strategy: `main` is the default; feature branches for changes
- PR review budget: 400 lines (configurable via SDD preflight)
