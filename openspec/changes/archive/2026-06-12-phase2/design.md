# Design: Phase 2 — Node Hexagonal + MongoDB

## Technical Approach

Phase 2 implements POST /events on the Node.js service using hexagonal architecture (Ports & Adapters). Domain layer has zero framework imports. Manual dependency injection wires all components at startup. MongoDB native driver handles persistence in the `events` collection. All business logic built test-first with `node:test`. pino provides structured JSON logging.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Repository port location | domain/ | application/ | Spec mandates domain layer for the port; keeps domain self-contained as a reusable package with its own contracts |
| UUID generation | crypto.randomUUID() (Node 19+) | uuid package | Stdlib — zero dependencies, RFC 9562 v4 compliant UUIDs |
| HTTP server | node:http | Express, Fastify | Constraints require native http module; URL-based routing sufficient for 2 endpoints |
| Port definition style | JSDoc typedef | TypeScript interfaces, abstract class | No build step; Node conventions for interface contracts in plain JS |
| MongoDB driver | mongodb native | Mongoose | Spec constraints; single collection, one operation — ORM overhead unnecessary |
| Module system | ESM (import/export) | CommonJS | Modern standard; already "type": "module" in package.json |
| Error handling | ValidationError in domain, caught by handler | Error subclasses per field | Single sentinel with descriptive message keeps domain simple; handler maps to 400 vs 500 |

## Hexagonal Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                  interfaces/                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ EventHandler(useCase)                         │  │
│  │ handlePost(req, res)                          │  │
│  │ POST /events  GET /health                     │  │
│  │ Parses JSON body, validates, delegates        │  │
│  └────────────────────┬──────────────────────────┘  │
├───────────────────────┼──────────────────────────────┤
│        application/   │                              │
│  ┌────────────────────▼──────────────────────────┐  │
│  │ LogEventUseCase(eventRepository)               │  │
│  │ execute({ type, deviceId }) → Event            │  │
│  │   createEvent() → repo.save() → return         │  │
│  └────────────────────┬──────────────────────────┘  │
├───────────────────────┼──────────────────────────────┤
│          domain/      │                              │
│  ┌────────────────────▼──────────────────────────┐  │
│  │ createEvent({ type, deviceId }) → Event        │  │
│  │   Validates type (non-empty)                   │  │
│  │   Validates deviceId (non-empty)               │  │
│  │   Generates UUID id, ISO 8601 timestamp        │  │
│  │                                                 │  │
│  │ EventRepository port: save(event) → void       │  │
│  │ ValidationError sentinel                       │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│        infrastructure/                               │
│  ┌───────────────────────────────────────────────┐  │
│  │ MongoEventRepository(client, db, coll)         │  │
│  │   save(event) → insertOne → return result      │  │
│  └────────────────────┬──────────────────────────┘  │
│                       │                              │
│                  ┌────▼────┐                         │
│                  │ MongoDB │  collection: "events"   │
│                  └─────────┘                         │
└─────────────────────────────────────────────────────┘

DEPENDENCY DIRECTION: INWARD ONLY
  interfaces → application → domain
  infrastructure → domain (implements EventRepository port)
  NO layer imports frameworks, drivers, or adapters from outer layers
```

## Layers Created

### Infrastructure: MongoEventRepository (mongo-event-repository.js)
- Implements EventRepository port from domain
- Constructor receives MongoClient + db/collection names (defaults: 'asset_tracker', 'events')
- `save(event)` calls `collection.insertOne(event)` and returns the result
- Connection established in composition root; adapter receives already-connected client

### Interfaces: EventHandler (event-handler.js)
- Class receiving LogEventUseCase via constructor (manual DI)
- `handlePost(req, res)` parses JSON body via chunk accumulation
- Calls use case and maps results: 201 on success, 400 on ValidationError, 500 on unexpected errors
- Logs errors at error level with pino

### Composition Root (src/index.js)
- Wires: MongoClient → MongoEventRepository → LogEventUseCase → EventHandler → http.createServer
- Routes: GET /health, POST /events, OPTIONS (CORS), 404 otherwise
- Graceful shutdown on SIGTERM/SIGINT
- CORS headers for development

## Test Strategy

| Layer | What to test | Approach | Skip condition |
|-------|-------------|----------|----------------|
| Domain | createEvent valid/invalid inputs, UUID validation, timestamp | Pure unit — node:test, no mocks | Never |
| Application | Use case happy path, validation error propagation, save failure | mock.method with mock.fn() | Never |
| Infrastructure | MongoDB insert + round-trip read | Real MongoDB via MongoClient | MONGO_URI not set |
| Interfaces | HTTP status codes, response bodies | Real http.createServer, mock use case | Never |

All tests use `node --test` runner.
