# Verification Report: Phase 2 — Node Hexagonal + MongoDB (FINAL AUDIT 2026-06-17)

**Status**: FAIL

## Audit Scope

Exhaustive comparison of ALL 4 openspec artifacts (`design.md`, `tasks.md`, `archive-report.md`, previous `verify-report.md`) + spec (`specs/phase2.md`) against ALL 20 source files and 9 test suites in `node-service/src/`. Every line of every implementation file inspected. Full test suite executed (`node --test`). Domain import purity verified with `grep`. Fresh runtime evidence collected.

---

## Test Results (Runtime Evidence — Fresh Execution 2026-06-17)

```
▶ Event entity .................. 13 pass
▶ LogEventUseCase ...............  6 pass
▶ ListEventsUseCase .............  5 pass
▶ KafkaEventConsumer ............ 11 pass
﹣ MongoEventRepository .......... SKIPPED (MONGO_URI not set) — 4 test cases inside
▶ EventHandler .................. 11 pass
▶ HealthHandler .................  6 pass
▶ MetricsHandler ................  6 pass
▶ loggingMiddleware .............  4 pass
─────────────────────────────────────
  tests  62
  pass   62
  fail    0
  skip    0 (suite skipped via describe({skip:...}) — 4 test cases not counted)
  suites  9
  duration_ms 2323.82
```

| Suite | Pass | Skip | Notes |
|-------|------|------|-------|
| Event entity | 13 | 0 | Includes name, actor, description tests |
| LogEventUseCase | 6 | 0 | Requires name param |
| ListEventsUseCase | 5 | 0 | Phase 3 leak |
| KafkaEventConsumer | 11 | 0 | Phase 4 leak |
| MongoEventRepository | 0 | 4 | MONGO_URI not set |
| EventHandler | 11 | 0 | Accepts 2 use cases |
| HealthHandler | 6 | 0 | Live/Ready/Health endpoints |
| MetricsHandler | 6 | 0 | Request/error counters |
| loggingMiddleware | 4 | 0 | Request logging |
| **TOTAL** | **62** | **4** | |

---

## 1. File Existence Check (tasks.md → code)

| Task | Spec File | Actual File | Exists? |
|------|-----------|-------------|---------|
| 1.1 | `domain/event.js` | `node-service/src/domain/event.js` | ✅ |
| 1.2 | `domain/event.test.js` | `node-service/src/domain/event.test.js` | ✅ |
| 1.3 | `domain/event-repository.js` | `node-service/src/domain/event-repository.js` | ✅ |
| 2.1 | `application/log-event.js` | `node-service/src/application/log-event.js` | ✅ |
| 2.2 | `application/log-event.test.js` | `node-service/src/application/log-event.test.js` | ✅ |
| 3.1 | `infrastructure/mongo-event-repository.js` | `node-service/src/infrastructure/mongo-event-repository.js` | ✅ |
| 3.2 | `infrastructure/mongo-event-repository.test.js` | `node-service/src/infrastructure/mongo-event-repository.test.js` | ✅ |
| 4.1 | `interfaces/event-handler.js` | `node-service/src/interfaces/event-handler.js` | ✅ |
| 4.2 | `interfaces/event-handler.test.js` | `node-service/src/interfaces/event-handler.test.js` | ✅ |
| 5.1 | `src/index.js` | `node-service/src/index.js` | ✅ |
| 5.2 | `index.js` (root) | `node-service/index.js` | ✅ |
| 5.3 | `package.json` | `node-service/package.json` | ✅ |

**All 12 task-referenced files exist.** ✅

---

## 2. File Naming Deviations (spec vs actual)

| Spec File | Actual File | Severity |
|-----------|-------------|----------|
| `interfaces/event-router.js` | `interfaces/event-handler.js` | WARNING |
| `interfaces/event-router.test.js` | `interfaces/event-handler.test.js` | WARNING |
| Export: `createEventRouter()` function | Export: `EventHandler` class | WARNING |

Spec lines 28-29 explicitly say `event-router.js` and `createEventRouter(repositoryOrUseCase)`. Implementation uses `event-handler.js` and `EventHandler` class.

---

## 3. Extra Files — Phase Isolation Violation (CRITICAL)

The following 10 files exist in `node-service/src/` but are NOT referenced by any Phase 2 task:

| File | Belongs To | Reason |
|------|-----------|--------|
| `application/list-events.js` | Phase 3+ | ListEventsUseCase — querying events |
| `application/list-events.test.js` | Phase 3+ | Tests for list use case |
| `infrastructure/kafka-event-consumer.js` | Phase 3+ | Kafka consumer adapter |
| `infrastructure/kafka-event-consumer.test.js` | Phase 3+ | Tests for Kafka consumer |
| `interfaces/health-handler.js` | Phase 3+ | Multi-endpoint health (live/ready) |
| `interfaces/health-handler.test.js` | Phase 3+ | Tests for health handler |
| `interfaces/middleware.js` | Phase 3+ | Logging middleware |
| `interfaces/middleware.test.js` | Phase 3+ | Tests for middleware |
| `interfaces/metrics-handler.js` | Phase 3+ | Metrics endpoint |
| `interfaces/metrics-handler.test.js` | Phase 3+ | Tests for metrics handler |

**Impact**: Later-phase code modifies Phase 2 files in-place (e.g., `EventHandler` constructor changed from 1→2 use case params, `EventRepository` port gained `findByDeviceId`, `src/index.js` grew from ~60 lines to 146 lines with Kafka/metrics/health/middleware wiring). This violates SDD phase isolation — each phase should be independently verifiable.

---

## 4. Domain Layer — Zero Framework Imports ✅

```
$ grep -rnE "from '(mongodb|http|express|fastify|pino|kafka|@confluentinc)" node-service/src/domain/
→ (no output)

$ grep -rnE "^import" node-service/src/domain/event.js
1:import crypto from 'node:crypto';
```

**PASS** — Domain layer has zero framework/driver dependencies. The only import is `node:crypto` (Node.js standard library, not a framework).

---

## 5. Event Entity — Fields (CRITICAL REGRESSION)

### Spec (specs/phase2.md line 10)

> Event entity with fields `id (string, UUID)`, `type (string, required)`, `deviceId (string, required UUID format)`, `timestamp (ISO 8601 string)`.

**Spec mandates 4 fields.**

### Implementation (domain/event.js lines 39-72)

```js
Object.freeze({
  id: crypto.randomUUID(),      // UUID — ✅
  type,                          // string, required — ✅
  deviceId,                      // string, required UUID — ✅
  name,                          // string, REQUIRED — ❌ NOT IN SPEC
  timestamp: timestamp || ...,   // ISO 8601 — ✅
  actor,                         // string|null, optional — ❌ NOT IN SPEC
  description,                   // string|null, optional — ❌ NOT IN SPEC
})
```

**Implementation has 7 fields. `name` is REQUIRED.**

| Field | In Spec? | Required? | Behavior |
|-------|----------|-----------|----------|
| `id` | ✅ | Auto-gen | UUID v4 from `crypto.randomUUID()` |
| `type` | ✅ | Yes | Non-empty string |
| `deviceId` | ✅ | Yes | UUID v4 format enforced |
| `timestamp` | ✅ | Auto-gen | ISO 8601, `new Date().toISOString()` |
| `name` | ❌ | **Yes** | Non-empty string — **breaks backward compat** |
| `actor` | ❌ | No (null) | Added out of scope |
| `description` | ❌ | No (null) | Added out of scope |

---

## 6. EventRepository Port — Deviations

### Spec (line 11)

> `EventRepository` port with methods `save(event)` returning `Promise<Event>`.

### Implementation

| Aspect | Spec | Implementation | Status |
|--------|------|---------------|--------|
| Location | domain layer | `domain/event-repository.js` | ✅ |
| Style | JSDoc typedef | JSDoc `@typedef` | ✅ |
| `save(event)` return | `Promise<Event>` | `Promise<void>` (JSDoc) / `InsertOneResult` (actual) | ❌ |
| `findByDeviceId` | NOT in spec | Present | ❌ Extra method |

JSDoc port definition (line 8-10): `Promise<void>` — contradicts spec's `Promise<Event>` and actual return `InsertOneResult`.

---

## 7. LogEventUseCase — Signature Change

### Spec (line 12)

> `execute({ type, deviceId })` — calls `createEvent`, then `save`.

### Implementation (application/log-event.js line 25)

```js
async execute({ type, deviceId, name, timestamp, actor, description }) {
```

**`name` is now part of the execute signature.** The spec only mentions `{ type, deviceId }`.

---

## 8. Composition Root (src/index.js) — Scope Bloat

### Spec (lines 14-15, 35-37)

> Composition root wires: MongoClient → MongoEventRepository → LogEventUseCase → EventHandler → http.createServer. Routes: GET /health, POST /events, OPTIONS (CORS), 404 otherwise.

### Implementation (src/index.js)

Actual routes served:
| Route | Method | In Spec? |
|-------|--------|-----------|
| `/health` | GET | ✅ |
| `/health/live` | GET | ❌ Phase 3+ |
| `/health/ready` | GET | ❌ Phase 3+ |
| `/metrics` | GET | ❌ Phase 3+ |
| `/events` | GET | ❌ Phase 3+ |
| `/events` | POST | ✅ |
| OPTIONS | * | ✅ |
| 404 | * | ✅ |

Actual wiring in `main()`:
- `MongoEventRepository` → ✅
- `LogEventUseCase` → ✅
- `ListEventsUseCase` → ❌ Not in spec
- `EventHandler(logEventUseCase, listEventsUseCase)` → ❌ Takes 2 use cases; spec says 1
- `HealthHandler(mongoClient)` → ❌
- `MetricsHandler()` → ❌
- `createLoggingMiddleware(logger)` → ❌
- `KafkaEventConsumer` → ❌ (KAFKA_BROKER env-driven)

---

## 9. Design Diagram vs Reality (design.md)

| Design (design.md) | Reality | Severity |
|---|---|---|
| Event: 4 fields | Event: 7 fields | CRITICAL |
| EventRepository: only `save(event)` | Also `findByDeviceId(deviceId)` | WARNING |
| `save` returns `Event` | Returns `InsertOneResult` | WARNING |
| Handler takes 1 use case | Takes 2 use cases | WARNING |
| Routes: 3 (GET /health, POST /events, OPTIONS) | Routes: 7 (5 routes + OPTIONS + 404) | CRITICAL |
| No Kafka consumer | KafkaEventConsumer present | CRITICAL |
| No ListEventsUseCase | ListEventsUseCase present | CRITICAL |
| No HealthHandler (multi-endpoint) | HealthHandler with live/ready/health | CRITICAL |
| No MetricsHandler | MetricsHandler present | CRITICAL |
| No loggingMiddleware | loggingMiddleware present | CRITICAL |

---

## 10. Dependencies — Out of Scope

### Spec (phase2.md line 36)

> Add `mongodb` driver dependency.

### package.json

```json
"dependencies": {
  "@confluentinc/kafka-javascript": "^1.9.1",  ← ❌ NOT IN PHASE 2 SPEC
  "mongodb": "^6.21.0",                         ← ✅
  "pino": "^9.0.0"                              ← ✅ (mentioned as logging requirement)
}
```

`@confluentinc/kafka-javascript` is a Phase 3+ dependency leaked into the Phase 2 `package.json`. The spec only authorizes `mongodb` driver addition.

---

## 11. Spec Compliance Matrix

| # | Requirement (specs/phase2.md) | Status | Evidence |
|---|-------------------------------|--------|----------|
| R1 | Hexagonal: domain/, application/, infrastructure/, interfaces/ | ✅ | All 4 dirs present |
| R2 | Dependency direction: inward only | ✅ | interfaces→application→domain, infra→domain |
| R3 | Event: id(UUID), type, deviceId(UUID), timestamp(ISO8601) | ❌ | 7 fields; name required |
| R4 | createEvent({type, deviceId}) validates required | ❌ | Now requires name too |
| R5 | UUID v4 validation for deviceId | ✅ | Regex line 52-54 event.js |
| R6 | UUID generation via crypto.randomUUID() | ✅ | Line 65 event.js |
| R7 | EventRepository port: save(event)→Promise\<Event\> | ❌ | JSDoc says void; actual returns InsertOneResult |
| R8 | EventRepository port in domain as JSDoc | ✅ | event-repository.js |
| R9 | LogEventUseCase: execute({type, deviceId}) | ❌ | Now requires name |
| R10 | MongoEventRepository uses insertOne | ✅ | Line 30 mongo-event-repository.js |
| R11 | HTTP handler: createEventRouter function | ⚠️ | EventHandler class, different name |
| R12 | HTTP handler parses JSON, validates type/deviceId | ⚠️ | Parses JSON; domain does all validation |
| R13 | HTTP handler: 201/400/500 | ✅ | Tested in event-handler.test.js |
| R14 | http.createServer with URL routing | ✅ | src/index.js line 61 |
| R15 | pino structured logging | ✅ | All files use pino |
| R16 | Manual DI only — no framework | ✅ | src/index.js manual wiring |
| R17 | "type": "module" in package.json | ✅ | package.json line 5 |
| R18 | node:test with describe/it and mock module | ✅ | All test files use node:test |
| R19 | Domain zero framework deps | ✅ | grep confirmed — only node:crypto |
| R20 | compose root: index.js delegates to src/index.js | ✅ | index.js line 2 |
| R21 | Input validation in BOTH domain AND HTTP handler | ⚠️ | Handler parses body only; validation only in domain |
| R22 | package.json: mongodb driver dependency | ✅ | mongodb ^6.21.0 |
| R23 | File: event-router.js | ❌ | event-handler.js (naming) |
| R24 | File: event-router.test.js | ❌ | event-handler.test.js (naming) |

**Compliance: 15/24 requirements fully compliant. 5 deviations, 3 partial, 1 naming mismatch.**

---

## 12. Acceptance Criteria — Behavioral Compliance

| # | curl Command | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| AC1 | `POST {"type":"device_created","deviceId":"550e8400-e29b-41d4-a716-446655440000"}` | HTTP 201 + JSON | **HTTP 400** — `name is required` | ❌ **CRITICAL** |
| AC2 | `POST {"type":"device_created"}` | HTTP 400 (missing deviceId) | HTTP 400 (missing deviceId **and** name) | ✅ (400 returned) |
| AC3 | `POST {"deviceId":"550e8400-e29b-41d4-a716-446655440000"}` | HTTP 400 (missing type) | HTTP 400 (missing type **and** name) | ✅ (400 returned) |
| AC4 | `POST {"type":"device_created","deviceId":"not-a-uuid"}` | HTTP 400 (invalid UUID) | HTTP 400 (invalid UUID **and** missing name) | ✅ (400 returned) |
| AC5 | `GET /health` | HTTP 200 | HTTP 200 (redirects to handleReady) | ✅ |
| AC6 | `docker compose up --build` succeeds | All healthy | ⚠️ Not tested (requires Docker runtime) | ⚠️ SKIPPED |
| AC7 | Domain zero framework imports | No matches | No matches (grep confirmed) | ✅ |

**Compliance: 4/7 ACs pass. AC1 is CRITICAL failure — the spec's primary acceptance criterion no longer works.**

---

## 13. Stale Artifact References

| Artifact | Line/Reference | Claim | Actual | Severity |
|----------|---------------|-------|--------|----------|
| `archive-report.md` | line 14 | "18 tests passing" | 62 tests pass | CRITICAL — obsolete count |
| `tasks.md` | line 50 | "All 18 tests pass" | 62 tests pass | CRITICAL — obsolete count |
| `design.md` | Layer diagram | 4 fields, 1 use case, 3 routes | 7 fields, 3 use cases, 7 routes | CRITICAL — diagram misleading |
| `design.md` | line 28 | `save(event) → Event` | Returns `InsertOneResult` | WARNING |
| `design.md` | line 38 | Routes: "GET /health, POST /events, OPTIONS (CORS), 404" | 7 routes + Kafka consumer | CRITICAL |
| `design.md` | line 70 | `MongoEventRepository(client, db, coll)` — 3 params? | Constructor takes (client, dbName, collectionName) | SUGGESTION |
| Prior `verify-report.md` | | "16/16 passed" | 62 pass | CRITICAL — pre-audit stale count |

---

## 14. Issue Summary

### CRITICAL (blocks archive readiness — 5 items)

1. **AC1 regression — `name` field breaks spec acceptance criterion.** The spec's primary test case (`POST {"type":"device_created","deviceId":"uuid"}` → 201) now returns 400 because `name` is required but was never part of the Phase 2 spec. This is the single most impactful issue — the implementation no longer satisfies the spec it was built for.

2. **Phase isolation violation — 10 extra files from later phases.** `ListEventsUseCase`, `KafkaEventConsumer`, `HealthHandler` (multi-endpoint), `MetricsHandler`, `loggingMiddleware` and their tests exist in what should be a pure Phase 2 codebase. Phase 2 core files (`EventHandler`, `EventRepository`, `src/index.js`) have been modified to accommodate these later-phase additions.

3. **Event entity has 7 fields instead of 4.** `name` (required), `actor` (optional), `description` (optional) were added outside the Phase 2 spec. The `createEvent` factory signature changed from `{type, deviceId}` to `{type, deviceId, name, ...}`.

4. **Dependency `@confluentinc/kafka-javascript` present but not authorized.** The Phase 2 spec only adds `mongodb` to `package.json`. Kafka integration is Phase 3+.

5. **Stale test counts in archived artifacts.** `archive-report.md` claims 18 tests, `tasks.md` claim 18 tests. Actual is 62 (plus 4 skipped). These artifacts cannot be trusted for future reference.

### WARNING (7 items)

6. `EventRepository.save()` port JSDoc says `Promise<void>` but spec says `Promise<Event>` and implementation returns `InsertOneResult`.

7. `EventRepository` port has `findByDeviceId` method not in the Phase 2 spec.

8. File naming: spec says `event-router.js` / `createEventRouter()`, implementation says `event-handler.js` / `EventHandler` class.

9. HTTP handler does not independently validate `type`/`deviceId` presence (spec constraint line 56 says validation MUST happen in BOTH domain AND handler). Handler only parses JSON body.

10. Design diagram in `design.md` is dangerously misleading — shows 4 fields, 3 routes, 1 use case when reality is 7 fields, 7 routes, 3 use cases + Kafka.

11. Health handler changed from simple 1-endpoint health to 3-endpoint handler (live/ready/health alias) — spec calls for simple GET /health.

12. `archive-report.md` line 19 claims "Tests went from 15→16" — no longer meaningful given 62 current tests.

### SUGGESTION (2 items)

13. `design.md` line 70 references `MongoEventRepository(client, db, coll)` with 3 params, but actual constructor signature is `(mongoClient, dbName, collectionName)` — parameter naming mismatch.

14. `node-service/index.js` is a 2-line delegation file using ESM `import` via `"type": "module"` — no issue, just noting pattern.

---

## 15. Verdict

**FAIL** — 5 CRITICAL issues.

Phase 2 cannot be considered verified or archived in its current state. The implementation has been contaminated by later-phase features that modified core Phase 2 contracts (Event entity, EventRepository port, LogEventUseCase signature, EventHandler constructor, composition root). The spec's primary acceptance criterion (`POST {"type":"device_created","deviceId":"uuid"}` → 201) no longer passes because `name` is now required.

**To pass verification, Phase 2 must be one of:**
1. **Rolled back** to its pure Phase 2 state (remove `name`/`actor`/`description` from entity, remove `ListEventsUseCase`/`KafkaEventConsumer`/extra handlers, restore 1-param EventHandler), OR
2. **Re-specced** with the `name` field and updated artifacts (specs, design, tasks) reflecting the current state.

Additionally, all stale artifact counts (archive-report's "18 tests", tasks.md's "18 tests") must be corrected.
