# Design: Phase 3 — Kafka Pub/Sub Communication

## Technical Approach

Implement hexagonal Ports & Adapters for event-driven communication. Go service publishes `device.created|updated|deleted` events to Kafka via an `EventPublisher` outbound port + `KafkaEventPublisher` adapter. Node service consumes via a `KafkaEventConsumer` adapter that validates messages and persists them through the existing `LogEventUseCase`. All produce operations are fire-and-forget goroutines with panic recovery — CRUD succeeds regardless of Kafka availability.

## Architecture Decisions

| # | Decision | Option A | Option B | Chosen | Rationale |
|---|----------|----------|----------|--------|-----------|
| 1 | Publisher port location | `application/event_publisher.go` | `domain/event_publisher.go` | A | Outbound port — follows existing `DeviceRepository` pattern at application layer (DIP: application owns contract). |
| 2 | Async context | `context.Background()` with 10s timeout | Request ctx via `context.WithoutCancel` | A | Simpler, no goroutine leak window. `WithoutCancel` still carries deadline baggage. Fresh background context is explicit about fire-and-forget semantics. |
| 3 | Delete name capture | `FindByID` before `Delete` | Change `repo.Delete` return signature | A | Minimal interface change. Delete doesn't need to know about events (SRP). |
| 4 | Message key | `deviceId` (UUID) | `type-deviceId` compound | A | Ensures per-device ordering. Consumer group distributes across partitions. Simple. |
| 5 | Consumer validation | Validate schema, skip malformed, log warning | Reject to DLQ | A | Phase scope is keep-it-simple — no DLQ. Consumer must never crash on bad messages. |
| 6 | Kafka client (Go) | `segmentio/kafka-go` | `confluent-kafka-go` (CGO) | A | Pure Go — compatible with distroless `static:nonroot`. Explicit spec requirement. |
| 7 | Kafka client (Node) | `kafkajs` | `node-rdkafka` (native addon) | A | Pure JS — no build issues in Alpine container. Explicit spec requirement. (Later migrated to @confluentinc/kafka-javascript due to protocol incompatibility) |
| 8 | Topic auto-creation | Auto-create on first publish | Manual topic creation | A | Kafka auto.create.topics.enable + AllowAutoTopicCreation on writer |

## Data Flow

```
POST /devices → DeviceHandler → CreateDeviceUseCase → PostgresDeviceRepository
                                      │                          │
                                      │ (fire-and-forget)        │ INSERT
                                      ▼                          ▼
                             KafkaEventPublisher            PostgreSQL
                                      │
                                      │ kafka.Writer.WriteMessages()
                                      ▼
                             Kafka broker (device-events)
                                      │
                                      │ consumer group: asset-tracker-node
                                      ▼
                             KafkaEventConsumer → LogEventUseCase → MongoEventRepository
                                                                         │
                                                                         │ insertOne({...event})
                                                                         ▼
                                                                    MongoDB (events)
```

## Event Schema

```json
{
  "type": "device.created|device.updated|device.deleted",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "laptop",
  "timestamp": "2026-06-11T10:30:00Z"
}
```

All 4 fields mandatory. Kafka message key = `deviceId`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `go-service/internal/application/event_publisher.go` | Create | `EventPublisher` interface: `PublishDeviceCreated`, `PublishDeviceUpdated`, `PublishDeviceDeleted` |
| `go-service/internal/infrastructure/kafka_event_publisher.go` | Create | `KafkaEventPublisher` struct with `kafka.Writer` |
| `go-service/internal/infrastructure/kafka_event_publisher_test.go` | Create | Integration tests against real Kafka container |
| `go-service/internal/application/create_device.go` | Modify | Add `publisher EventPublisher` to constructor, goroutine after save |
| `go-service/internal/application/update_device.go` | Modify | Same pattern |
| `go-service/internal/application/delete_device.go` | Modify | `FindByID` before delete, goroutine with captured name |
| `go-service/cmd/main.go` | Modify | Wire `KafkaEventPublisher`, graceful shutdown |
| `node-service/src/infrastructure/kafka-event-consumer.js` | Create | `KafkaEventConsumer` class with @confluentinc/kafka-javascript |
| `node-service/src/domain/event.js` | Modify | Add `name` parameter to `createEvent()` |
| `node-service/src/index.js` | Modify | Wire consumer, graceful shutdown |
| `docker-compose.yml` | Modify | Kafka topic auto-creation, env vars |
