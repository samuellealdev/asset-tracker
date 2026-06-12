# Phase 2: Node Hexagonal + MongoDB

## Objective

Implement the Node.js service with full hexagonal architecture (Ports & Adapters). Expose `POST /events` endpoint backed by MongoDB. All business logic MUST be test-driven (TDD) with zero framework dependencies in the domain layer.

## Technical Requirements

- **Hexagonal architecture** with four layers: `domain/`, `application/`, `infrastructure/`, `interfaces/`. Dependency direction: interfaces → application → domain (inward only).
- **Domain layer**: `Event` entity with fields `id (string, UUID)`, `type (string, required)`, `deviceId (string, required UUID format)`, `timestamp (ISO 8601 string)`. MUST have zero framework imports. Factory function `createEvent({ type, deviceId })` that validates required fields, validates UUID format for `deviceId`, generates a UUID for `id`, and sets timestamp to `new Date().toISOString()`.
- **Domain layer**: `EventRepository` port (interface) with methods `save(event)` returning `Promise<Event>`.
- **Application layer**: `LogEventUseCase` class accepting an `EventRepository` via constructor injection. Method `execute({ type, deviceId })` — calls `createEvent`, then `save`. Returns the created event or throws.
- **Infrastructure layer**: `MongoEventRepository` implementing `EventRepository` using `mongodb` native driver. Constructor accepts `MongoClient` and database/collection names. Saves to `events` collection. Uses `insertOne`.
- **Interfaces layer**: HTTP handler (`createEventRouter`) accepting the use case via function argument (manual DI). Parses JSON body, validates presence of `type` and `deviceId`, returns 201 + event JSON on success, 400 on validation failure, 500 on internal errors. Uses `http.createServer` with URL-based routing.
- **Composition root** in `index.js`: wire everything manually — create MongoDB client, repository, use case, HTTP server. No DI framework.
- **Structured logging**: use `pino`. Log request start/end, errors, and DB operations at appropriate levels.
- **Tests**: Unit tests for domain entity (`createEvent` validation, UUID format enforcement). Unit tests for use case with mock repository. Integration tests for `MongoEventRepository` (skip if no DB available).

## Files to Create

- `node-service/src/domain/event.js` — `createEvent` factory function, validation errors
- `node-service/src/domain/event.test.js` — Tests for valid/invalid inputs, UUID validation, timestamp generation
- `node-service/src/domain/event-repository.js` — `EventRepository` interface (JSDoc typedef or abstract class pattern)
- `node-service/src/application/log-event.js` — `LogEventUseCase` class
- `node-service/src/application/log-event.test.js` — Tests with mock repository (happy path, validation failure, save failure)
- `node-service/src/infrastructure/mongo-event-repository.js` — `MongoEventRepository` class
- `node-service/src/infrastructure/mongo-event-repository.test.js` — Integration tests (skip if no MongoDB)
- `node-service/src/interfaces/event-router.js` — HTTP handler, exports `createEventRouter(repositoryOrUseCase)` function
- `node-service/src/interfaces/event-router.test.js` — HTTP handler tests using Node.js built-in test server or `node:http` mocks
- `node-service/src/index.js` — Modified: full composition root wiring plus health endpoint (renamed from `index.js`)
- `node-service/index.js` — Entry point re-exports or delegates to `src/index.js`

## Files to Modify

- `node-service/index.js` — Replace minimal health-only server with full composition root plus health endpoint.
- `node-service/package.json` — Add `mongodb` driver dependency.

## Acceptance Criteria

- [x] `node --test` passes all tests in node-service (domain, application, interfaces, infrastructure).
- [x] `curl -X POST http://localhost:3000/events -H 'Content-Type: application/json' -d '{"type":"device_created","deviceId":"550e8400-e29b-41d4-a716-446655440000"}'` returns HTTP 201 and JSON with `id`, `type`, `deviceId`, `timestamp`.
- [x] `curl -X POST http://localhost:3000/events -H 'Content-Type: application/json' -d '{"type":"device_created"}'` returns HTTP 400 (missing `deviceId`).
- [x] `curl -X POST http://localhost:3000/events -H 'Content-Type: application/json' -d '{"deviceId":"550e8400-e29b-41d4-a716-446655440000"}'` returns HTTP 400 (missing `type`).
- [x] `curl -X POST http://localhost:3000/events -H 'Content-Type: application/json' -d '{"type":"device_created","deviceId":"not-a-uuid"}'` returns HTTP 400 (invalid UUID format).
- [x] `curl http://localhost:3000/health` still works (Phase 0 regression).
- [x] `docker compose up --build` succeeds with node-service healthy and connected to MongoDB.
- [x] Domain layer has ZERO imports from `mongodb`, `http`, `express`, or any framework package.

## Constraints

- Domain layer MUST have zero framework dependencies. Verify with `grep -r "require('mongodb')\|require('http')\|require('express')" node-service/src/domain/` — it MUST return no matches.
- ALL business logic MUST be written test-first (red → green → refactor) per the `tdd` skill.
- Use `node:test` with `describe`/`it` and `mock` module per the `nodejs-best-practices` skill.
- Manual dependency injection only — no `awilix`, `tsyringe`, or other DI frameworks.
- The repository port MUST be defined in the domain layer as a JSDoc interface (following Node.js convention for interfaces).
- Input validation MUST happen in both the domain factory (`createEvent`) AND the HTTP handler (for early 400 responses).
- Use `"type": "module" in `package.json` — all code uses ES modules (`import`/`export`).
- The HTTP server MUST use the native `http` module — no Express, Fastify, or other frameworks.

## Notes

- Load the `nodejs-best-practices`, `hexagonal-architecture`, `solid-principles`, and `tdd` skills before implementation.
- For integration tests, check `MONGO_URI` env var and use `t.skip("requires running MongoDB")` when not set.
- Use `crypto.randomUUID()` (Node.js 19+) for UUID generation — no external UUID library needed.
- The MongoDB native driver (`mongodb`) is the recommended choice per AGENTS.md.
- The `index.js` file at the package root should remain the entry point. Move actual logic to `src/index.js` so the Dockerfile's `CMD` stays simple.
- Follow the hexagonal folder structure: `src/domain/`, `src/application/`, `src/infrastructure/`, `src/interfaces/`.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repository port location | `domain/` | Keeps domain self-contained with its own contracts |
| UUID generation | `crypto.randomUUID()` | Stdlib — zero dependencies, RFC 9562 v4 compliant |
| HTTP server | `node:http` | Constraints require native http module; 2 endpoints suffice |
| Port definition style | JSDoc typedef | No build step; JS-native interface contracts |
| MongoDB driver | `mongodb` native | Single collection, single operation — ORM unnecessary |
| Module system | ESM (`import`/`export`) | Modern standard; `"type": "module"` already configured |

## Implementation Summary

### Layers Created

- **Domain**: `createEvent()` factory with UUID v4 validation, `EventRepository` port (JSDoc), `ValidationError` sentinel
- **Application**: `LogEventUseCase` with constructor DI, coordidates domain factory + repository persistence
- **Infrastructure**: `MongoEventRepository` adapter for MongoDB via `insertOne`
- **Interfaces**: `EventHandler` class (naming deviation from spec's `event-router.js`), body parsing, 201/400/500 mapping
- **Composition Root** (`src/index.js`): Manual wiring `MongoClient → Repo → UseCase → Handler → http.createServer`

### Files Created

| File | Purpose |
|------|---------|
| `node-service/src/domain/event.js` | `createEvent` factory, `ValidationError` |
| `node-service/src/domain/event.test.js` | 7 tests: valid, missing type, missing deviceId, invalid UUID, custom timestamp, frozen, UUID format |
| `node-service/src/domain/event-repository.js` | `EventRepository` JSDoc port interface |
| `node-service/src/application/log-event.js` | `LogEventUseCase` with constructor DI |
| `node-service/src/application/log-event.test.js` | 4 tests: happy path, missing type, missing deviceId, save failure |
| `node-service/src/infrastructure/mongo-event-repository.js` | `MongoEventRepository` adapter |
| `node-service/src/infrastructure/mongo-event-repository.test.js` | Integration tests (skipped without MONGO_URI) |
| `node-service/src/interfaces/event-handler.js` | `EventHandler` class |
| `node-service/src/interfaces/event-handler.test.js` | 5 tests: 201, 400 type, 400 deviceId, 400 JSON, 500 |
| `node-service/src/index.js` | Composition root with routing and graceful shutdown |
| `node-service/index.js` | Entry point delegating to `src/index.js` |

### Test Results

- **16 tests pass** across 4 suites (domain 7, application 4, interfaces 5, infrastructure 2 skipped)
- **Zero framework imports** in domain layer
- **Zero dependency** on Express/Fastify

### Deviations from Spec

| Spec | Implementation | Impact |
|------|---------------|--------|
| `event-router.js` → `createEventRouter()` | `event-handler.js` → `EventHandler` class | None — functionally identical, class-based |
| `EventRepository.save()` returns `Promise<Event>` | JSDoc says `Promise<void>`, MongoDB returns `InsertOneResult` | None — minor contract looseness |
