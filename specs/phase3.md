# Phase 3: Event-Driven Communication with Kafka

## Objective

Implement Kafka-based pub/sub communication between the Go service (producer) and the Node.js service (consumer). The Go service MUST produce events to the `device-events` Kafka topic for all three device lifecycle operations: `device.created` (on create), `device.updated` (on update), and `device.deleted` (on delete). The Node service MUST consume from this topic and persist all event types to MongoDB. The produce operation is asynchronous — CRUD operations succeed regardless of Kafka availability.

## Technical Requirements

- **Kafka Producer (Go service)**: Infrastructure adapter `KafkaEventPublisher` implementing the `EventPublisher` port interface. Uses `segmentio/kafka-go` library (pure Go, no CGO). Publishes `device.created`, `device.updated`, and `device.deleted` events to topic `device-events`.
- **EventPublisher port**: Interface in the application layer with three methods:
  - `PublishDeviceCreated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error`
  - `PublishDeviceUpdated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error`
  - `PublishDeviceDeleted(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error`
  Parameters provide all fields for the event schema.
- **Kafka Consumer (Node service)**: Infrastructure adapter `KafkaEventConsumer` consuming from `device-events` topic. Uses `kafkajs` library (most popular, pure JS). Stores consumed events as documents in MongoDB `events` collection. MUST handle all three event types (`device.created`, `device.updated`, `device.deleted`).
- **EventConsumer port**: Interface in the application layer with method `startConsuming()` that begins the consumer loop and calls `handleEvent(event)` for each received message.
- **Event Schema**: JSON payload published to `device-events` topic. Uniform schema across all three event types:
  ```json
  {
    "type": "device.created|device.updated|device.deleted",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "laptop",
    "timestamp": "2026-06-11T10:30:00Z"
  }
  ```
  - `type`: One of `"device.created"`, `"device.updated"`, or `"device.deleted"` (string, MUST be present).
  - `deviceId`: UUID v4 string (MUST be present).
  - `name`: Device name (string, MUST be present). For `device.deleted`, this is the device name BEFORE deletion.
  - `timestamp`: ISO 8601 UTC timestamp of when the event was produced (string, MUST be present).
  - All four fields are mandatory for ALL event types. Consumer SHALL validate the schema and log warnings for malformed messages (skip, do NOT crash).
- **Async produce (non-blocking)**: Use cases MUST call their respective `EventPublisher` method in a goroutine. The use case returns its result (created/updated device or nil for delete) and does NOT wait for Kafka acknowledgment. Errors are logged via `slog.Error` and never returned to the caller. Applies to:
  - `CreateDeviceUseCase` → calls `PublishDeviceCreated` in goroutine
  - `UpdateDeviceUseCase` → calls `PublishDeviceUpdated` in goroutine
  - `DeleteDeviceUseCase` → calls `PublishDeviceDeleted` in goroutine
- **Consumer group**: Node service consumer MUST use a consumer group ID (`asset-tracker-node`) so multiple replicas can share consumption load. Each event is processed at-least-once.
- **Panic recovery**: The goroutine for producing MUST recover from panics to prevent crashing the HTTP handler. The consumer loop MUST also recover from panics on individual message processing.
- **Kafka configuration**: All Kafka settings (broker address, topic name, consumer group) MUST be read from environment variables with sensible defaults:
  - `KAFKA_BROKER` (default: `kafka:9092`)
  - `KAFKA_TOPIC` (default: `device-events`)
  - `KAFKA_CONSUMER_GROUP` (default: `asset-tracker-node`)

## Files to Create

- `go-service/internal/application/event_publisher.go` — `EventPublisher` interface with three methods: `PublishDeviceCreated`, `PublishDeviceUpdated`, `PublishDeviceDeleted`. Each accepts `(ctx, deviceID, deviceName string, timestamp time.Time) error`.
- `go-service/internal/infrastructure/kafka_event_publisher.go` — `KafkaEventPublisher` struct implementing `EventPublisher`. Uses `segmentio/kafka-go` writer. JSON marshaling of event schema. Constructor accepts broker address and topic. WriteTimeout 5s. Three public methods corresponding to the interface, each serializing the event with the correct `type` field.
- `go-service/internal/infrastructure/kafka_event_publisher_test.go` — Tests for: successful produce for each event type, JSON schema correctness per type, error handling when broker unreachable, context cancellation. Use a real Kafka broker (via Docker test container) or a mock `kafka-go` writer interface.
- `node-service/internal/application/event_consumer.js` — `EventConsumer` abstract class/interface defining `startConsuming()` and `handleEvent(event)` with JSDoc types
- `node-service/internal/infrastructure/kafka_event_consumer.js` — `KafkaEventConsumer` class extending `EventConsumer`. Uses `kafkajs.Kafka` client with consumer group. Connects on startup, subscribes to topic, runs consumer loop. Validates event schema (all 3 type values accepted) before storing. Calls MongoDB adapter to insert into `events` collection. Graceful shutdown on SIGTERM/SIGINT.
- `node-service/internal/infrastructure/kafka_event_consumer.test.js` — Tests for: successful consume and store for all 3 event types, schema validation (missing fields, wrong types, unknown `type` value), consumer group behavior. Use a mock `kafkajs` consumer or a test Kafka container.

## Files to Modify

- `go-service/internal/application/create_device.go` — Add `EventPublisher` field. After saving device, launch goroutine calling `eventPublisher.PublishDeviceCreated(ctx, device.ID, device.Name, time.Now().UTC())`. Log errors via `slog.Error`, never return them. Recover from panics.
- `go-service/internal/application/create_device_test.go` — Add test cases: event published successfully (verify publisher called with correct fields), event publish fails but device still returned (HTTP 201), publisher never called when device save fails. Use mock `EventPublisher`.
- `go-service/internal/application/update_device.go` — Add `EventPublisher` field. After calling `repository.Update`, launch goroutine calling `eventPublisher.PublishDeviceUpdated(ctx, device.ID, device.Name, time.Now().UTC())`. Log errors via `slog.Error`, never return them. Recover from panics.
- `go-service/internal/application/update_device_test.go` — Add test cases: event published successfully on update, event publish fails but device still returned, publisher never called when update fails.
- `go-service/internal/application/delete_device.go` — Add `EventPublisher` field. Before calling `repository.Delete`, capture `device.Name` from the `FindByID` result. After successful delete, launch goroutine calling `eventPublisher.PublishDeviceDeleted(ctx, id, capturedName, time.Now().UTC())`. Log errors via `slog.Error`, never return them. Recover from panics.
- `go-service/internal/application/delete_device_test.go` — Add test cases: event published successfully on delete (with device name from before deletion), event publish fails but delete still returns success, publisher never called when device not found.
- `go-service/cmd/main.go` — Initialize `KafkaEventPublisher` with `KAFKA_BROKER` and `KAFKA_TOPIC` from env vars. Wire into `CreateDeviceUseCase`, `UpdateDeviceUseCase`, and `DeleteDeviceUseCase`. Shutdown: close Kafka writer on SIGTERM/SIGINT.
- `go-service/go.mod` — Add `require github.com/segmentio/kafka-go v0.4.47`
- `docker-compose.yml` — Add `KAFKA_BROKER=kafka:9092` and `KAFKA_TOPIC=device-events` environment variables to both go-service and node-service. Ensure go-service `depends_on` includes kafka with `condition: service_healthy`. Create `device-events` topic on startup via Kafka init container or documented command.
- `node-service/internal/domain/event.js` — Add or update Event entity/value object to include all four schema fields (`type`, `deviceId`, `name`, `timestamp`) with validation that accepts all three `type` values
- `node-service/internal/infrastructure/mongo_event_repository.js` — Ensure `save(event)` accepts the event schema fields and stores as a MongoDB document in `events` collection. Works for all 3 event types.
- `node-service/index.js` — Initialize `KafkaEventConsumer`, call `startConsuming()`, handle graceful shutdown on SIGTERM/SIGINT
- `node-service/package.json` — Add `"kafkajs": "^2.2.4"` dependency

## Acceptance Criteria

- [ ] `go test ./...` in go-service passes, including all `kafka_event_publisher_test.go` tests and updated use case tests.
- [ ] `node --test` in node-service passes, including all `kafka_event_consumer.test.js` tests.
- [ ] `docker compose up -d` starts all 5 services healthy. Kafka is running in KRaft mode.
- [ ] `docker compose exec kafka /opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` shows `device-events` topic exists.
- [ ] **CREATE**: `curl -X POST http://localhost:8080/devices -H 'Content-Type: application/json' -d '{"name":"laptop","type":"computer"}'` returns HTTP 201. Verify Kafka message: `docker compose exec kafka /opt/bitnami/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic device-events --from-beginning --max-messages 1` shows `"type":"device.created"`.
- [ ] **UPDATE**: `curl -X PUT http://localhost:8080/devices/<id> -H 'Content-Type: application/json' -d '{"name":"server","type":"infrastructure"}'` returns HTTP 200. Verify Kafka message shows `"type":"device.updated"` with updated `"name":"server"`.
- [ ] **DELETE**: `curl -X DELETE http://localhost:8080/devices/<id>'` returns HTTP 204. Verify Kafka message shows `"type":"device.deleted"` with the device name from before deletion.
- [ ] Verify all 3 events are persisted in MongoDB: `docker compose exec mongo mongosh --eval "db.events.find().pretty()"` shows 3 documents with distinct `type` values (`device.created`, `device.updated`, `device.deleted`).
- [ ] Stop Kafka (`docker compose stop kafka`). Create, update, and delete devices — all return their respective success status codes (201, 200, 204). Go service logs ERROR for each failed produce.
- [ ] Restart Kafka. Perform CRUD operations again — events flow normally again. No persistent backlog or duplicate handling expected (best-effort semantics).
- [ ] All CRUD endpoints complete in under 100ms regardless of Kafka availability (produce is non-blocking).
- [ ] Check Go service logs: successful produces logged at INFO level with event type in context, failures at ERROR level with `deviceID` in context.
- [ ] `docker compose ps` shows all 5 services healthy.

## Constraints

- `CreateDeviceUseCase`, `UpdateDeviceUseCase`, and `DeleteDeviceUseCase` MUST NOT return an error when event publishing fails. The user contract is "operation succeeded" — events are best-effort.
- `DeleteDeviceUseCase` MUST capture the device name BEFORE deletion and pass it to `PublishDeviceDeleted`, so the event includes the name of the device that was deleted.
- The goroutine for event publishing MUST recover from panics to prevent crashing the HTTP handler. This applies to ALL three use cases that publish events.
- The Node service consumer loop MUST recover from panics on individual message processing — one malformed message MUST NOT crash the consumer.
- Go producer MUST use `segmentio/kafka-go` (no CGO dependency — compatible with `distroless/static` runtime image).
- Node consumer MUST use `kafkajs` (pure JavaScript, no native addons needed).
- All Kafka configuration MUST be via environment variables (`KAFKA_BROKER`, `KAFKA_TOPIC`, `KAFKA_CONSUMER_GROUP`) with sensible defaults.
- The `KafkaEventPublisher` constructor MUST accept broker address and topic (not hardcoded).
- The `KafkaEventConsumer` constructor MUST accept broker address, topic, and consumer group ID (not hardcoded).
- Producer write timeout SHOULD be 5 seconds to prevent goroutine leaks.
- Do NOT implement outbox pattern, dead-letter queues, or message retry in this phase — keep it simple per the demo scope.
- The `device-events` topic MUST exist before the Node consumer starts. Use `docker compose exec` to create it or add a startup script in docker-compose.
- Event type validation in the consumer MUST accept exactly three values: `device.created`, `device.updated`, `device.deleted`. Unknown type values SHALL be logged as a warning and the message skipped.

## Notes

- Load the `golang-pro`, `hexagonal-architecture`, `solid-principles`, and `nodejs-best-practices` skills.
- For Go Kafka producer, `segmentio/kafka-go` provides both `Writer` (high-level) and `Conn` (low-level) APIs. Use `Writer` for simplicity.
- The `EventPublisher` interface belongs in the application layer (outbound port), while `KafkaEventPublisher` is an infrastructure adapter.
- The `EventConsumer` interface belongs in the application layer (inbound port), while `KafkaEventConsumer` is an infrastructure adapter.
- For Go tests, create a `KafkaWriter` interface to enable mocking: `segmentio/kafka-go.Writer` does not expose an interface natively. Wrap it or use a test Kafka container.
- For Node tests, use `node:test` with `mock` module to mock the `kafkajs` consumer. Alternatively, use a testcontainers-based Kafka for integration tests.
- Use `slog.With("deviceID", deviceID)` to attach context to produce log entries.
- The consumer group ID `asset-tracker-node` ensures that when multiple Node replicas run (Phase 5), they share the partition load without duplicate processing.
- Kafka KRaft mode: the bitnami/kafka image handles the combined broker+controller role. No Zookeeper is needed.
- Consumer graceful shutdown: On SIGTERM, stop consuming, commit offsets, disconnect. Use `process.on('SIGTERM', ...)` and `process.on('SIGINT', ...)`.
