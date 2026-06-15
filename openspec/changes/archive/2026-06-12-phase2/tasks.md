# Tasks: Phase 2 — Node Hexagonal + MongoDB

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~480 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain+app, ~250) → PR 2 (infra+interfaces+wiring, ~230) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

### Suggested Work Units

| Unit | Goal | Status |
|------|------|--------|
| 1 | Domain entity, port + use case with tests | ✅ Complete |
| 2 | MongoDB adapter, HTTP handler, composition root, entry point | ✅ Complete |

## Phase 1: Domain Layer ✅

- [x] 1.1 `node-service/src/domain/event.js` — Event entity, ValidationError, createEvent factory
- [x] 1.2 `node-service/src/domain/event.test.js` — 10 tests (validation, UUID, frozen object)
- [x] 1.3 `node-service/src/domain/event-repository.js` — EventRepository port (JSDoc)

## Phase 2: Application Layer ✅

- [x] 2.1 `node-service/src/application/log-event.js` — LogEventUseCase
- [x] 2.2 `node-service/src/application/log-event.test.js` — Mock-based tests

## Phase 3: Infrastructure ✅

- [x] 3.1 `node-service/src/infrastructure/mongo-event-repository.js` — MongoDB adapter
- [x] 3.2 `node-service/src/infrastructure/mongo-event-repository.test.js` — Integration tests (skip without MONGO_URI)

## Phase 4: Interfaces ✅

- [x] 4.1 `node-service/src/interfaces/event-handler.js` — EventHandler with POST /events
- [x] 4.2 `node-service/src/interfaces/event-handler.test.js` — HTTP tests (201, 400, 500)

## Phase 5: Composition Root & Wiring ✅

- [x] 5.1 `node-service/src/index.js` — Manual DI, route wiring, graceful shutdown
- [x] 5.2 `node-service/index.js` — Entry point delegation
- [x] 5.3 `node-service/package.json` — mongodb dependency

## Phase 6: Verification ✅

- [x] 6.1 All 18 tests pass (with MongoDB)
- [x] 6.2 All acceptance criteria: POST /events 201/400, UUID validation
- [x] 6.3 Domain zero framework imports
