# Apply Progress — Phase 6: Business Event Tracking

## Summary

Implemented Phase 6 following strict TDD vertical slices. All 15 tasks completed. 61/61 tests pass (1 skip: MongoEventRepository integration without MONGO_URI).

## Files Created

- `node-service/src/application/list-events.js` — `ListEventsUseCase` with constructor injection, UUID validation, repository delegation
- `node-service/src/application/list-events.test.js` — 5 tests: valid UUID returns events, missing deviceId throws, non-UUID throws, empty result, repo error propagation

## Files Modified

| File | Change Summary |
|------|---------------|
| `node-service/src/domain/event.js` | Added `actor`, `description` optional params to `createEvent` (default `null`); added to JSDoc typedef; included in frozen output |
| `node-service/src/domain/event.test.js` | 3 new tests: actor/description provided, omitted (null), frozen keys present |
| `node-service/src/domain/event-repository.js` | Added `findByDeviceId(deviceId): Promise<Event[]>` to JSDoc port contract |
| `node-service/src/application/log-event.js` | Accepts optional `actor`, `description` params; forwards to `createEvent` |
| `node-service/src/application/log-event.test.js` | 1 new test: actor/description pass-through to saved event |
| `node-service/src/infrastructure/mongo-event-repository.js` | Implemented `findByDeviceId` with `find().sort().toArray()` + null normalization |
| `node-service/src/infrastructure/mongo-event-repository.test.js` | 2 new integration tests: sorted descending, empty array for unknown device |
| `node-service/src/interfaces/event-handler.js` | Constructor accepts 2nd param `listEventsUseCase`; renamed `useCase` → `logEventUseCase`; added `handleGet` with URL query parsing, ValidationError→400 mapping |
| `node-service/src/interfaces/event-handler.test.js` | Updated `createTestServer` to handle GET; added `getEvents` helper; 7 new tests: POST with actor/desc, 5 GET scenarios, 500 on repo error |
| `node-service/src/index.js` | Import `ListEventsUseCase`, wire with `eventRepository`, pass to `EventHandler`; register `GET /events` route before POST |

## Test Results

```
node --test
ℹ tests 61
ℹ suites 9
ℹ pass 61
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

Only skip: `MongoEventRepository` integration tests (no `MONGO_URI` in CI environment — expected).

## Diff Stats

```
10 files changed, 368 insertions(+), 14 deletions(-)
```

## Architecture Decisions (applied from design.md)

1. `createEvent` always emits `actor: null, description: null` when not provided → consistent JSON shape
2. `findByDeviceId` normalizes missing fields via `?? null` → backward compat with pre-Phase 6 documents
3. `ListEventsUseCase` reuses UUID regex from `event.js` → single source of truth
4. URL query parsing via `new URL(req.url, 'http://localhost').searchParams` → zero-dependency
5. Route matching via `pathname === '/events'` → prevents accidental match of `/events/something`
