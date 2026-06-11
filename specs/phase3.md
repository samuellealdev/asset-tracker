# Phase 3: Event-Driven Communication with Kafka

## Objective

Implement Kafka-based pub/sub communication between the Go service (producer) and the Node.js service (consumer). When a device is created via `POST /devices`, the Go service MUST produce a `device.created` event to the `device-events` Kafka topic. The Node service MUST consume from this topic and persist events to MongoDB. The produce operation is asynchronous — device creation succeeds regardless of Kafka availability.

## Technical Requirements

- **Kafka Producer (Go service)**: Infrastructure adapter `KafkaEventPublisher` implementing the `EventPublisher` port interface. Uses `segmentio/kafka-go` library (pure Go, no CGO). Publishes `device.created` events to topic `device-events`.
- **EventPublisher port**: Interface in the application layer with method `PublishDeviceCreated(ctx context.Context, deviceID, deviceName string, timestamp time.Time) error`. Parameters provide all fields for the event schema.
- **Kafka Consumer (Node service)**: Infrastructure adapter `KafkaEventConsumer` consuming from `device-events` topic. Uses `kafkajs` library (most popular, pure JS). Stores consumed events as documents in MongoDB `events` collection.
- **EventConsumer port**: Interface in the application layer with method `startConsuming()` that begins the consumer loop and calls `handleEvent(event)` for each received message.
- **Event Schema**: JSON payload published to `device-events` topic:
  ```json
  {
    "type": "device.created",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "laptop",
    "timestamp": "2026-06-11T10:30:00Z"
  }
  ```
  - `type`: Always `"device.created"` (string, MUST be present).
  - `deviceId`: UUID v4 string (MUST be present).
  - `name`: Device name as provided in the create request (string, MUST be present).
  - `timestamp`: ISO 8601 UTC timestamp of when the event was produced (string, MUST be present).
  - All four fields are mandatory. Consumer SHALL validate the schema and log warnings for malformed messages (skip, do NOT crash).
- **Async produce (non-blocking)**: `CreateDeviceUseCase` MUST call `PublishDeviceCreated` in a goroutine. The use case returns the created device with HTTP 201 and does NOT wait for Kafka acknowledgment. Errors are logged via `slog.Error` and never returned to the caller.
- **Consumer group**: Node service consumer MUST use a consumer group ID (`asset-tracker-node`) so multiple replicas can share consumption load. Each event is processed at-least-once.
- **Panic recovery**: The goroutine for producing MUST recover from panics to prevent crashing the HTTP handler. The consumer loop MUST also recover from panics on individual message processing.
- **Kafka configuration**: All Kafka settings (broker address, topic name, consumer group) MUST be read from environment variables with sensible defaults:
  - `KAFKA_BROKER` (default: `kafka:9092`)
  - `KAFKA_TOPIC` (default: `device-events`)
  - `KAFKA_CONSUMER_GROUP` (default: `asset-tracker-node`)

## Files to Create

- `go-service/internal/application/event_publisher.go` — `EventPublisher` interface with `PublishDeviceCreated(ctx, deviceID, deviceName string, timestamp time.Time) error`
- `go-service/internal/infrastructure/kafka_event_publisher.go` — `KafkaEventPublisher` struct implementing `EventPublisher`. Uses `segmentio/kafka-go` writer. JSON marshaling of event schema. Constructor accepts broker address and topic. WriteTimeout 5s. Async produce via goroutine in use case layer.
- `go-service/internal/infrastructure/kafka_event_publisher_test.go` — Tests for: successful produce (verify message sent to topic), JSON schema correctness, error handling when broker unreachable, context cancellation. Use a real Kafka broker (via Docker test container) or a mock `kafka-go` writer interface.
- `node-service/internal/application/event_consumer.js` — `EventConsumer` abstract class/interface defining `startConsuming()` and `handleEvent(event)` with JSDoc types
- `node-service/internal/infrastructure/kafka_event_consumer.js` — `KafkaEventConsumer` class extending `EventConsumer`. Uses `kafkajs.Kafka` client with consumer group. Connects on startup, subscribes to topic, runs consumer loop. Validates event schema before storing. Calls MongoDB adapter to insert into `events` collection. Graceful shutdown on SIGTERM/SIGINT.
- `node-service/internal/infrastructure/kafka_event_consumer.test.js` — Tests for: successful consume and store, schema validation (missing fields, wrong types), consumer group behavior. Use a mock `kafkajs` consumer or a test Kafka container.

## Files to Modify

- `go-service/internal/application/create_device.go` — Add `EventPublisher` field to `CreateDeviceUseCase`. After saving device, launch goroutine calling `eventPublisher.PublishDeviceCreated(ctx, device.ID, device.Name, time.Now().UTC())`. Log errors via `slog.Error`, never return them. Recover from panics.
- `go-service/internal/application/create_device_test.go` — Add test cases: event published successfully (verify publisher called with correct fields), event publish fails but device still returned (HTTP 201), publisher never called when device save fails. Use mock `EventPublisher`.
- `go-service/cmd/main.go` — Initialize `KafkaEventPublisher` with `KAFKA_BROKER` and `KAFKA_TOPIC` from env vars. Wire into `CreateDeviceUseCase`. Shutdown: close Kafka writer on SIGTERM/SIGINT.
- `go-service/go.mod` — Add `require github.com/segmentio/kafka-go v0.4.47`
- `docker-compose.yml` — Add `KAFKA_BROKER=kafka:9092` and `KAFKA_TOPIC=device-events` environment variables to both go-service and node-service. Ensure go-service `depends_on` includes kafka with `condition: service_healthy`. Create `device-events` topic on startup via Kafka init container or documented command (`docker compose exec kafka kafka-topics.sh --create --topic device-events --bootstrap-server localhost:9092`).
- `node-service/internal/domain/event.js` — Add or update Event entity/value object to include all four schema fields (`type`, `deviceId`, `name`, `timestamp`) with validation
- `node-service/internal/infrastructure/mongo_event_repository.js` — Ensure `save(event)` accepts the event schema fields and stores as a MongoDB document in `events` collection
- `node-service/index.js` — Initialize `KafkaEventConsumer`, call `startConsuming()`, handle graceful shutdown on SIGTERM/SIGINT
- `node-service/package.json` — Add `"kafkajs": "^2.2.4"` dependency

## Acceptance Criteria

- [ ] `go test ./...` in go-service passes, including all `kafka_event_publisher_test.go` tests.
- [ ] `node --test` in node-service passes, including all `kafka_event_consumer.test.js` tests.
- [ ] `docker compose up -d` starts all 5 services healthy. Kafka is running in KRaft mode.
- [ ] `docker compose exec kafka /opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` shows `device-events` topic exists (create manually if not auto-created).
- [ ] `curl -X POST http://localhost:8080/devices -H 'Content-Type: application/json' -d '{"name":"laptop","type":"computer"}'` returns HTTP 201 with created device.
- [ ] Verify the event appears in Kafka: `docker compose exec kafka /opt/bitnami/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic device-events --from-beginning --max-messages 1` shows a JSON message with `"type":"device.created"`.
- [ ] Verify the event is persisted in MongoDB: `docker compose exec mongo mongosh --eval "db.events.find().pretty()"` shows a document with `type`, `deviceId`, `name`, and `timestamp` fields.
- [ ] Stop Kafka (`docker compose stop kafka`). Create a device via `POST /devices` — still returns HTTP 201. Go service logs an ERROR about the failed produce (`slog.Error`).
- [ ] Restart Kafka. Create another device — events flow normally again. No persistent backlog or duplicate handling expected (best-effort semantics).
- [ ] `POST /devices` completes in under 100ms regardless of Kafka availability (produce is non-blocking).
- [ ] Check Go service logs: successful produces logged at INFO level, failures at ERROR level with `deviceID` in context.
- [ ] `docker compose ps` shows all 5 services healthy.

## Constraints

- `CreateDeviceUseCase` MUST NOT return an error when event publishing fails. The user contract is "device is created" — events are best-effort.
- The goroutine for event publishing MUST recover from panics to prevent crashing the HTTP handler.
- The Node service consumer loop MUST recover from panics on individual message processing — one malformed message MUST NOT crash the consumer.
- Go producer MUST use `segmentio/kafka-go` (no CGO dependency — compatible with `distroless/static` runtime image).
- Node consumer MUST use `kafkajs` (pure JavaScript, no native addons needed).
- All Kafka configuration MUST be via environment variables (`KAFKA_BROKER`, `KAFKA_TOPIC`, `KAFKA_CONSUMER_GROUP`) with sensible defaults.
- The `KafkaEventPublisher` constructor MUST accept broker address and topic (not hardcoded).
- The `KafkaEventConsumer` constructor MUST accept broker address, topic, and consumer group ID (not hardcoded).
- Producer write timeout SHOULD be 5 seconds to prevent goroutine leaks.
- Do NOT implement outbox pattern, dead-letter queues, or message retry in this phase — keep it simple per the demo scope.
- The `device-events` topic MUST exist before the Node consumer starts. Use `docker compose exec` to create it or add a startup script in docker-compose.

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
