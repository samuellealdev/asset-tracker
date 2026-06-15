# Phase 6: Business Event Tracking

## Objective

Extend the Node.js service to support business-level event tracking. In addition to the system-generated events from Kafka (device.created, device.updated, device.deleted), users can now manually create and query business events associated with a device. Events are immutable — once created, they cannot be modified or deleted. All manual events are stored directly in MongoDB without passing through Kafka.

## Technical Requirements

- **Extended POST /events endpoint**: Accept `actor` and `description` as optional fields in addition to the existing `type`, `deviceId`, and `name` fields. The endpoint must still support the existing system event format (backward compatible).
  - `actor` (string, optional): who performed the action (e.g., "samuel.leal", "it.admin")
  - `description` (string, optional): free-text explanation of what happened
- **New GET /events endpoint**: Query events by `deviceId` via query parameter `GET /events?deviceId=<uuid>`. Returns a JSON array of all events for that device, ordered by `timestamp` descending (most recent first). Returns an empty array if no events exist for the device.
  - Response format: `[ { "id": "...", "type": "...", "deviceId": "...", "name": "...", "timestamp": "...", "actor": "...", "description": "..." }, ... ]`
  - Missing `actor` or `description` fields are returned as `null` in JSON (not omitted) for consistency
  - Missing or invalid `deviceId` query parameter returns 400
  - Non-UUID `deviceId` returns 400
- **Immutability**: Events cannot be modified or deleted once created. No PUT or DELETE endpoints for events. This models real-world audit logging.
- **No Kafka for manual events**: Manual events are saved directly to MongoDB via the existing `MongoEventRepository`. They do NOT go through Kafka because there are no downstream consumers for business events in this project.
- **Event types**: Support arbitrary event type strings for manual events (e.g., "device.delivered", "device.formatted", "device.incident", "device.returned"). Validation: type must be a non-empty string. System event types remain "device.created", "device.updated", "device.deleted".
- **Domain layer**: Extend the `Event` entity to include optional `actor` and `description` fields. Update `createEvent()` factory to accept these fields. The `ValidationError` must not reject missing `actor`/`description` — they are optional.
- **Repository layer**: Add `findByDeviceId(deviceId)` method to the `EventRepository` port and implement it in `MongoEventRepository` using `find({ deviceId }).sort({ timestamp: -1 }).toArray()`.
- **Application layer**: Create `ListEventsUseCase` with constructor injection of `EventRepository`. Method `execute(deviceId)` validates the deviceId format, queries the repository, and returns the event list.
- **Interfaces layer**: Update `EventHandler` to accept the new use case. Add `handleGet` method that extracts `deviceId` from query params, delegates to `ListEventsUseCase`, and returns 200 with JSON array. Validation errors map to 400.
- **Composition root**: Wire `ListEventsUseCase` into `index.js` and register `GET /events` route.

## Files to Create

- `node-service/src/application/list-events.js` — `ListEventsUseCase`
- `node-service/src/application/list-events.test.js` — Tests (valid query, missing deviceId, non-UUID, empty result, populated result)

## Files to Modify

- `node-service/src/domain/event.js` — Add `actor` and `description` as optional parameters to `createEvent()`
- `node-service/src/domain/event.test.js` — Add tests for optional actor/description fields
- `node-service/src/domain/event-repository.js` — Add `findByDeviceId(deviceId)` to the JSDoc port contract
- `node-service/src/infrastructure/mongo-event-repository.js` — Implement `findByDeviceId` method
- `node-service/src/infrastructure/mongo-event-repository.test.js` — Add integration tests for `findByDeviceId`
- `node-service/src/interfaces/event-handler.js` — Add `handleGet` method, accept `ListEventsUseCase` in constructor
- `node-service/src/interfaces/event-handler.test.js` — Add tests for GET /events endpoint
- `node-service/src/index.js` — Wire `ListEventsUseCase`, register `GET /events?deviceId=...` route
- `node-service/src/application/log-event.js` — Accept optional `actor` and `description` parameters

## Acceptance Criteria

- [ ] `node --test` passes all tests (existing + new).
- [ ] `curl -X POST http://localhost:3000/events -H 'Content-Type: application/json' -d '{"type":"device.delivered","deviceId":"550e8400-e29b-41d4-a716-446655440000","name":"laptop","actor":"samuel.leal","description":"Entregado al trabajador"}'` returns HTTP 201.
- [ ] `curl -X POST http://localhost:3000/events -H 'Content-Type: application/json' -d '{"type":"device.created","deviceId":"550e8400-e29b-41d4-a716-446655440000","name":"laptop"}'` still returns HTTP 201 (backward compatible — no actor/description).
- [ ] `curl "http://localhost:3000/events?deviceId=550e8400-e29b-41d4-a716-446655440000"` returns HTTP 200 with a JSON array containing all events for that device.
- [ ] `curl "http://localhost:3000/events?deviceId=00000000-0000-0000-0000-000000000000"` returns HTTP 200 with an empty JSON array `[]`.
- [ ] `curl "http://localhost:3000/events"` returns HTTP 400 (missing deviceId query parameter).
- [ ] `curl "http://localhost:3000/events?deviceId=not-a-uuid"` returns HTTP 400 (invalid UUID format).
- [ ] System events from Kafka (device.created) still appear in `GET /events?deviceId=...` results alongside manual events.
- [ ] `docker compose up --build` succeeds with node-service healthy.

## Constraints

- Domain layer MUST have zero framework or infrastructure imports.
- Manual events MUST NOT be published to Kafka — only stored directly in MongoDB.
- Events are immutable: no PUT or DELETE endpoints for `/events`.
- Backward compatible: existing `POST /events` format (without actor/description) MUST still work.
- Use `node:test` for all tests — no external test framework.
- The `actor` and `description` fields in the JSON response MUST be `null` when not provided, not omitted.
- UUID validation on `deviceId` query parameter MUST use the same regex as the domain entity (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`).

## Notes

- This phase completes the original vision of events as a human-readable audit log.
- The `GET /events` endpoint is designed to be consumed by a frontend to display a device's event history.
- System events (from Kafka) and manual events coexist in the same MongoDB `events` collection.
- The frontend can distinguish them by the `type` field: system events are `device.*`, manual events have custom types.
- The `ListEventsUseCase` follows the same constructor injection pattern as `LogEventUseCase`.
