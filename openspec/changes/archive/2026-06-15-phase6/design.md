# Design: Phase 6 — Business Event Tracking

## Technical Approach

Extend the Node.js event pipeline with optional `actor`/`description` fields and a read-side query endpoint. Follows existing hexagonal layers: domain entity → application use cases → interface handlers → infrastructure adapters. No new dependencies. Zero changes to Kafka consumer (system events automatically inherit the optional fields via `createEvent` defaults).

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Field defaults | `createEvent()` always emits `actor: null, description: null` when not provided | Guarantees consistent JSON shape for ALL events (manual + Kafka). `JSON.stringify` includes `null` values, fulfilling the "not omitted" constraint. |
| Repository normalization | `findByDeviceId` maps missing `actor`/`description` to `null` via `?? null` | Existing MongoDB documents from before Phase 6 lack these fields. Normalization at the repository boundary keeps domain and use cases clean. |
| UUID validation reuse | `ListEventsUseCase` uses the same regex from `event.js` (`/^[0-9a-f]{8}-...$/i`) | Single source of truth; spec explicitly requires this. |
| URL parsing | `new URL(req.url, 'http://localhost')` for query param extraction | Zero-dependency. The base URL is irrelevant — only `searchParams` is used. Consistent with Node.js 22 built-in API. |
| Route matching | `pathname === '/events'` (parsed URL) instead of `req.url.startsWith` | Prevents accidental matching of `/events/something`. Uses the same `URL` object created for query parsing. |
| No PUT/DELETE | Not implemented by design | Events model an immutable audit log. Adding these would violate the domain invariant. |

## Data Flow

```
POST /events (manual)                    GET /events?deviceId=...
      │                                         │
      ▼                                         ▼
EventHandler.handlePost()              EventHandler.handleGet()
      │                                         │
      ▼                                         ▼
LogEventUseCase.execute()              ListEventsUseCase.execute(deviceId)
      │                                         │
      ├─ createEvent({type,deviceId,  ├─ validate UUID (same regex)
      │   name, actor?, desc?})              │
      │                                      ▼
      ▼                              MongoEventRepository
MongoEventRepository                       .findByDeviceId(deviceId)
      .save(event)                              │
      │                                      ▼
      ▼                              find({deviceId})
   MongoDB                           .sort({timestamp:-1})
                                         .toArray()
                                         .map(normalize nulls)
                                              │
                                              ▼
                                        JSON array response
```

Kafka consumer (unchanged) → `LogEventUseCase.execute()` → `createEvent()` now includes `actor:null, description:null` automatically.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `node-service/src/domain/event.js` | Modify | Add optional `actor`, `description` params to `createEvent`; destructure with `= null` defaults; include in frozen output |
| `node-service/src/domain/event.test.js` | Modify | Add tests: event with actor/desc, event without (both null), frozen includes both keys |
| `node-service/src/domain/event-repository.js` | Modify | Add `findByDeviceId(deviceId): Promise<Event[]>` to JSDoc port contract |
| `node-service/src/application/log-event.js` | Modify | Accept optional `actor`, `description` params; forward to `createEvent` |
| `node-service/src/application/log-event.test.js` | Modify | Add test: passes actor/description through to saved event |
| `node-service/src/application/list-events.js` | Create | `ListEventsUseCase` with constructor(repo); `execute(deviceId)` validates UUID, calls `repo.findByDeviceId` |
| `node-service/src/application/list-events.test.js` | Create | Tests: valid UUID returns events, missing deviceId throws, non-UUID throws, empty result, populated result, repo error propagation |
| `node-service/src/infrastructure/mongo-event-repository.js` | Modify | Implement `findByDeviceId`: `find({deviceId}).sort({timestamp:-1}).toArray()` with null normalization |
| `node-service/src/infrastructure/mongo-event-repository.test.js` | Modify | Add integration tests: findByDeviceId returns events sorted desc, empty for unknown device, includes actor/description nulls |
| `node-service/src/interfaces/event-handler.js` | Modify | Constructor accepts `ListEventsUseCase` as 2nd param; add `handleGet(req, res)` parsing `deviceId` from URL query, delegating to `listEventsUseCase`, mapping `ValidationError` to 400 |
| `node-service/src/interfaces/event-handler.test.js` | Modify | Add tests: 200 with JSON array, 400 missing deviceId, 400 non-UUID, 400 no query at all, 200 empty array |
| `node-service/src/index.js` | Modify | Import `ListEventsUseCase`, instantiate with `eventRepository`, pass to `EventHandler`; register `GET /events` route using parsed URL pathname |

## Interfaces / Contracts

### `ListEventsUseCase`

```js
class ListEventsUseCase {
  constructor(eventRepository) { /* stores repo */ }
  async execute(deviceId) {
    // 1. Validate deviceId is a non-empty string matching UUID v4 regex
    // 2. Throw ValidationError on invalid
    // 3. Return await this.repo.findByDeviceId(deviceId)
  }
}
```

### `EventRepository.findByDeviceId` (addition to port)

```js
/**
 * @param {string} deviceId
 * @returns {Promise<import('../domain/event.js').Event[]>}
 */
async findByDeviceId(deviceId) { /* adapter implements */ }
```

### `EventHandler` constructor change

```js
// Before: constructor(logEventUseCase)
// After:  constructor(logEventUseCase, listEventsUseCase)
```

### Route registration (index.js)

```js
const url = new URL(req.url, 'http://localhost');
if (url.pathname === '/events' && req.method === 'GET') {
  eventHandler.handleGet(req, res);
  return;
}
```

Place the GET route BEFORE the existing POST route to avoid ambiguity.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Domain unit | `createEvent` with/without actor/description; frozen object includes both keys as `null` | `node:test` + `assert` |
| Application unit | `ListEventsUseCase`: valid UUID, missing, invalid, empty result, repo error propagation | `node:test` + `mock.fn` for repository |
| Application unit | `LogEventUseCase`: passes actor/description through | Extend existing test suite |
| Adapter integration | `findByDeviceId`: sorted descending, empty array, null normalization for missing fields | MONGO_URI required; real MongoDB |
| Interface unit | `handleGet`: 200 with array, 400 missing/invalid deviceId, 200 empty, 500 on repo error | HTTP test server pattern (same as existing `event-handler.test.js`) |

## Migration / Rollout

No migration required. Existing MongoDB documents without `actor`/`description` are normalized to `null` by `findByDeviceId`. New events (Kafka + manual) automatically include the fields via `createEvent` defaults. Rollback: revert `event.js` and composition root; `POST /events` continues working (optional fields are ignored by clients that don't send them).

## Architectural Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Query param injection**: Parsing raw URL without validation could allow malformed input. | Low | `URL.searchParams.get('deviceId')` returns string or null; use case validates UUID. No eval/exec. |
| **Route ordering**: Placing GET before POST prevents accidental POST matching on partial URL. | Low | Explicit `pathname === '/events'` with method check. No `startsWith` ambiguity. |
| **null serialization edge case**: MongoDB `find().toArray()` preserves JavaScript `null` in documents, but `JSON.stringify` on raw MongoDB documents may include `_id`. | Low | `findByDeviceId` maps to clean objects (no `_id`); normalization ensures `actor`/`description` are always present. |
