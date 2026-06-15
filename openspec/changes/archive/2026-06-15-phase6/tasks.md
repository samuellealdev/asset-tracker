# Tasks: Phase 6 — Business Event Tracking

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~370-420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full Phase 6: Domain → App → Infra → Interfaces → Wiring | Single PR | ~400 lines; TDD-ordered tasks. One session. |

## Phase 1: Domain Layer (Foundation)

- [x] 1.1 RED: `event.test.js` — Add tests for optional `actor`/`description`: (a) event with both fields set, (b) event without them has both as `null`, (c) frozen object includes both keys
- [x] 1.2 GREEN: `event.js` — Add `actor = null`, `description = null` to `createEvent` destructure; include both in frozen return object
- [x] 1.3 `event-repository.js` — Add `findByDeviceId(deviceId): Promise<Event[]>` to JSDoc port contract

## Phase 2: Application Layer (Core)

- [x] 2.1 RED: `list-events.test.js` — Write tests for `ListEventsUseCase`: valid UUID returns events, missing deviceId throws `ValidationError`, non-UUID throws, empty result returns `[]`, populated result returns array, repo error propagates
- [x] 2.2 GREEN: `list-events.js` — Implement `ListEventsUseCase` with constructor(repo), `execute(deviceId)` validates UUID via same regex as `event.js`, delegates to `repo.findByDeviceId`
- [x] 2.3 RED: `log-event.test.js` — Add test: `execute` with `actor`/`description` passes them through to saved event
- [x] 2.4 GREEN: `log-event.js` — Accept optional `actor`, `description` params; destructure and forward to `createEvent`

## Phase 3: Infrastructure Layer (Adapters)

- [x] 3.1 RED: `mongo-event-repository.test.js` — Add integration tests: `findByDeviceId` returns events sorted by `timestamp` descending, returns `[]` for unknown device, normalizes missing `actor`/`description` to `null`
- [x] 3.2 GREEN: `mongo-event-repository.js` — Implement `findByDeviceId(deviceId)` using `find({ deviceId }).sort({ timestamp: -1 }).toArray()` with null normalization via `?? null`

## Phase 4: Interfaces Layer (Handlers)

- [x] 4.1 RED: `event-handler.test.js` — Add tests for `handleGet`: (a) 200 with JSON array, (b) 400 missing `deviceId` query param, (c) 400 non-UUID `deviceId`, (d) 400 no query string, (e) 200 empty array, (f) 500 on repo error. Update `createTestServer` to also route `GET /events` to `handler.handleGet`.
- [x] 4.2 GREEN: `event-handler.js` — Update constructor to accept `listEventsUseCase` as 2nd param. Add `handleGet(req, res)` parsing `deviceId` from `new URL(req.url, 'http://localhost').searchParams`, delegating to `listEventsUseCase`, mapping `ValidationError` to 400, unknown errors to 500.
- [x] 4.3 RED: `event-handler.test.js` — Add POST test: sending `actor`/`description` in body results in 201 response with those fields present in returned event JSON
- [x] 4.4 GREEN: `event-handler.test.js` — Verify existing POST tests still pass (backward compatible). No code change needed for `handlePost` — it already passes `body` to `logEventUseCase.execute`, which now accepts the new fields.

## Phase 5: Wiring & Verification

- [x] 5.1 `index.js` — Import `ListEventsUseCase`, instantiate with `eventRepository`, pass to `EventHandler` constructor. Add `GET /events` route (before POST) using `new URL(req.url, 'http://localhost').pathname === '/events'`.
- [x] 5.2 Run `node --test` full suite; verify all acceptance criteria from spec: POST with actor/description → 201, POST without → 201 (backward compat), GET with valid deviceId → 200 array, GET with no deviceId → 400, GET with invalid UUID → 400, GET with unknown deviceId → 200 empty array, Kafka system events appear alongside manual events.
