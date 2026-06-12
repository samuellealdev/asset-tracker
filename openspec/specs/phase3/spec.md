# Phase 3: Event-Driven Communication with Kafka

## Objective

Implement Kafka-based pub/sub communication between the Go service (producer) and the Node.js service (consumer). The Go service produces events to the `device-events` Kafka topic for all three device lifecycle operations. The Node service consumes from this topic and persists all event types to MongoDB. The produce operation is asynchronous — CRUD operations succeed regardless of Kafka availability.

## Technical Requirements

- **Kafka Producer (Go service)**: Infrastructure adapter `KafkaEventPublisher` implementing the `EventPublisher` port interface. Uses `segmentio/kafka-go` library (pure Go, no CGO). Publishes `device.created`, `device.updated`, and `device.deleted` events to topic `device-events`.
- **EventPublisher port**: Interface in the application layer with three methods: `PublishDeviceCreated`, `PublishDeviceUpdated`, `PublishDeviceDeleted`. Each accepts `(ctx, deviceID, deviceName string, timestamp time.Time) error`.
- **Kafka Consumer (Node service)**: Infrastructure adapter `KafkaEventConsumer` consuming from `device-events` topic. Uses `kafkajs` library (pure JS). Stores consumed events as documents in MongoDB `events` collection. Handles all three event types.
- **Event Schema**: JSON payload with 4 mandatory fields: `type`, `deviceId`, `name`, `timestamp`. Consumer validates schema and logs warnings for malformed messages (skip, do NOT crash).
- **Async produce (non-blocking)**: Use cases call `EventPublisher` methods in goroutines. Results returned to caller regardless of Kafka status. Errors logged via `slog.Error`, never returned.
- **Consumer group**: `asset-tracker-node` for multi-replica load sharing.
- **Kafka configuration**: All settings via environment variables with defaults.

## Files Created

| File | Purpose |
|------|---------|
| `go-service/internal/application/event_publisher.go` | `EventPublisher` port interface (3 methods) |
| `go-service/internal/infrastructure/kafka_event_publisher.go` | `KafkaEventPublisher` adapter using `segmentio/kafka-go` Writer |
| `go-service/internal/infrastructure/kafka_event_publisher_test.go` | Tests: implements interface, error handling, integration (skipped) |
| `node-service/src/infrastructure/kafka-event-consumer.js` | `KafkaEventConsumer` adapter using `kafkajs` consumer |
| `node-service/src/infrastructure/kafka-event-consumer.test.js` | Tests: 3 event types, schema validation, error recovery, connection errors |

## Files Modified

| File | Changes |
|------|---------|
| `go-service/internal/application/create_device.go` | Added `EventPublisher` field; goroutine + panic recovery for `PublishDeviceCreated` |
| `go-service/internal/application/create_device_test.go` | Tests: event published, publish fails but device returned, no publish on save fail |
| `go-service/internal/application/update_device.go` | Added `EventPublisher` field; goroutine + panic recovery for `PublishDeviceUpdated` |
| `go-service/internal/application/update_device_test.go` | Tests: event published, publish fails but device returned, no publish on update fail |
| `go-service/internal/application/delete_device.go` | Added `EventPublisher` field; captures device name before deletion; goroutine + panic recovery |
| `go-service/internal/application/delete_device_test.go` | Tests: event published with pre-delete name, publish fails but delete succeeds, no publish when not found |
| `go-service/cmd/main.go` | Kafka writer initialization; wiring into all 3 use cases; graceful shutdown with writer close |
| `go-service/go.mod` | Added `github.com/segmentio/kafka-go v0.4.47` |
| `docker-compose.yml` | Added `KAFKA_BROKER`, `KAFKA_TOPIC`, `KAFKA_CONSUMER_GROUP` env vars; go-service depends_on kafka |
| `node-service/src/domain/event.js` | Added `name` field to Event entity + validation |
| `node-service/src/infrastructure/mongo-event-repository.js` | Updated to accept event schema fields |
| `node-service/src/index.js` | Kafka consumer initialization, graceful shutdown on SIGTERM/SIGINT |
| `node-service/package.json` | Added `kafkajs: ^2.2.4` dependency |

## Test Results

- **Go**: 23 tests pass across domain, application, infrastructure, interfaces layers
  - 2 Kafka integration tests skipped (require `KAFKA_BROKER` env)
  - 7 Postgres integration tests skipped (require `POSTGRES_DSN` env)
- **Node**: 31 tests pass across domain, application, infrastructure, interfaces layers
  - 1 MongoDB integration test skipped (requires `MONGO_URI` env)
  - Consumer tests: 3 event types, 4 validation failure modes, connection error handling, panic recovery

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Kafka library (Go) | `segmentio/kafka-go` | Pure Go, no CGO dependency — compatible with distroless/static runtime |
| Kafka library (Node) | `kafkajs` | Pure JavaScript, most popular — no native addons needed |
| Event publisher location | Application layer (outbound port) | DIP: application owns the contract |
| Kafka mode | KRaft (Apache Kafka 3.9.2) | No Zookeeper dependency needed |
| Async produce strategy | Goroutine per event + panic recovery | Non-blocking CRUD; errors logged, never returned |
| Consumer group ID | `asset-tracker-node` | Enables multi-replica load sharing (Phase 5+) |
| Event schema validation | Both producer (typed struct) and consumer (runtime checks) | Defense in depth |

## Known Issues

1. **Context cancellation**: Use cases pass HTTP request context to publish goroutine. When the HTTP handler returns before the goroutine writes to Kafka, the context is canceled → event may not be published. Recommended fix: use `context.Background()` with 5s timeout in goroutines.
2. **kafkajs compatibility**: kafkajs ^2.2.4 has protocol-level issues with Apache Kafka 3.9.2 in certain configurations. Consumer joins group but fetch requests may fail. Consider `@confluentinc/kafka-javascript` for production use.
