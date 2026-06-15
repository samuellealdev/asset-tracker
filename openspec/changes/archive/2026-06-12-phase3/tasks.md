# Tasks: Phase 3 — Kafka Pub/Sub Communication

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~780 (5 new files, 15 modified) |
| Decision needed before apply | Yes |
| Chained PRs recommended | Yes |
| Chain strategy | stacked-to-main |
| 400-line budget risk | High |
| Delivery strategy | ask-on-risk |

### Suggested Work Units

| Unit | Goal | Lines | Status |
|------|------|-------|--------|
| 1 | Go EventPublisher + Kafka adapter + tests | ~200 | ✅ Complete |
| 2 | Go use-case integration + composition root | ~230 | ✅ Complete |
| 3 | Node consumer + domain + Docker + E2E | ~350 | ✅ Complete |

## Phase 1: Go — EventPublisher Port & Kafka Adapter (PR 1) ✅

- [x] 1.1 `go-service/internal/application/event_publisher.go` — `EventPublisher` interface
- [x] 1.2 `go-service/internal/infrastructure/kafka_event_publisher.go` — `KafkaEventPublisher` struct
- [x] 1.3 `go-service/internal/infrastructure/kafka_event_publisher_test.go` — integration tests
- [x] 1.4 `go-service/go.mod` — add `segmentio/kafka-go`

## Phase 2: Go — Use Case Integration & Wiring (PR 2) ✅

- [x] 2.1 `go-service/internal/application/create_device.go` — inject EventPublisher, fire goroutine
- [x] 2.2 `go-service/internal/application/create_device_test.go` — mock publisher assertions
- [x] 2.3 `go-service/internal/application/update_device.go` — inject EventPublisher
- [x] 2.4 `go-service/internal/application/update_device_test.go` — mock publisher assertions
- [x] 2.5 `go-service/internal/application/delete_device.go` — FindByID before Delete, publish name
- [x] 2.6 `go-service/internal/application/delete_device_test.go` — mock publisher assertions
- [x] 2.7 `go-service/cmd/main.go` — wire KafkaEventPublisher, graceful shutdown

## Phase 3: Node — Domain, Consumer Adapter & Wiring (PR 3) ✅

- [x] 3.1 `node-service/src/domain/event.js` — add `name` parameter
- [x] 3.2 `node-service/src/domain/event.test.js` — name validation tests
- [x] 3.3 `node-service/src/infrastructure/kafka-event-consumer.js` — @confluentinc/kafka-javascript consumer
- [x] 3.4 `node-service/src/infrastructure/kafka-event-consumer.test.js` — mocked consumer tests
- [x] 3.5 `node-service/package.json` — add @confluentinc/kafka-javascript
- [x] 3.6 `node-service/src/index.js` — wire consumer, graceful shutdown

## Phase 4: Docker Configuration & Verification ✅

- [x] 4.1 `docker-compose.yml` — Kafka topic config, env vars
- [x] 4.2 `.env.example` — KAFKA_TOPIC, KAFKA_CONSUMER_GROUP
- [x] 4.3 Go tests pass
- [x] 4.4 Node tests pass (31/31)
- [x] 4.5 E2E: docker compose up, CRUD → Kafka → MongoDB
- [x] 4.6 Kafka-down resilience verified
