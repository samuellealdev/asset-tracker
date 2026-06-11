# Phase 3: Resilient Inter-service Communication

## Objective

Implement resilient, non-blocking communication from the Go service to the Node.js service. When a device is created via `POST /devices`, the Go service MUST call `POST /events` on the Node service to log a `device_created` event. The communication MUST tolerate Node service failures — the device creation succeeds regardless.

## Technical Requirements

- **HTTP Client Adapter**: New infrastructure adapter in Go (`NodeEventClient`) implementing an `EventPublisher` port interface. The adapter calls `POST http://node-service:3000/events` with JSON body `{"type":"device_created","deviceId":"<uuid>"}`.
- **EventPublisher port**: Interface in the application layer with method `PublishDeviceCreated(ctx, deviceID string) error`. This follows the Dependency Inversion Principle — the use case depends on the port, not the HTTP client.
- **Retry with exponential backoff**: `NodeEventClient` MUST retry failed requests up to 2 times (3 total attempts). Backoff: 500ms, then 1s between retries. Jitter SHOULD be added (±100ms).
- **Timeout**: Each HTTP request MUST have a 2-second context deadline. If the context expires, treat as failure and retry or give up.
- **Non-blocking guarantee**: `CreateDeviceUseCase` MUST NOT return an error if the event logging fails. The use case calls `PublishDeviceCreated` in a goroutine, logs the error via `slog.Error` if it fails, and returns the created device with HTTP 201.
- **Graceful degradation**: If Node service is completely down, Go service continues operating. Devices are created, events are lost (logged, not queued). This is the documented behavior.
- **Circuit Breaker pattern**: Documented in code comments but NOT implemented in this phase. The `NodeEventClient` code MUST include a comment describing where a circuit breaker would be inserted (e.g., "Future: wrap with circuit breaker — open after 5 consecutive failures, half-open after 30s").
- **Docker Compose**: Update `docker-compose.yml` so go-service depends on node-service (with `condition: service_healthy`). Add `NODE_URL=http://node-service:3000` environment variable to go-service.

## Files to Create

- `go-service/internal/application/event_publisher.go` — `EventPublisher` interface with `PublishDeviceCreated(ctx, deviceID string) error`
- `go-service/internal/infrastructure/node_event_client.go` — `NodeEventClient` struct implementing `EventPublisher` with HTTP client, retry logic, backoff, timeout, and circuit breaker documentation comment
- `go-service/internal/infrastructure/node_event_client_test.go` — Tests for retry behavior (success on first try, success on retry, failure after all retries), timeout handling, JSON marshaling correctness. Use `httptest.NewServer` as a fake Node service.

## Files to Modify

- `go-service/internal/application/create_device.go` — Add `EventPublisher` field to `CreateDeviceUseCase`. After saving device, call `PublishDeviceCreated` in a goroutine. Log errors, never return them.
- `go-service/internal/application/create_device_test.go` — Add test cases: event published successfully, event publish fails but device still returned, mock EventPublisher verification.
- `go-service/cmd/main.go` — Wire `NodeEventClient` into `CreateDeviceUseCase`. Read `NODE_URL` from environment variable.
- `docker-compose.yml` — Add `NODE_URL` env var to go-service. Ensure go-service `depends_on` includes node-service with `condition: service_healthy`.

## Acceptance Criteria

- [ ] `go test ./...` in go-service passes, including retry and timeout tests.
- [ ] `curl -X POST http://localhost:8080/devices -H 'Content-Type: application/json' -d '{"name":"laptop","type":"computer"}'` returns HTTP 201. An event appears in MongoDB's `events` collection. Verify with `docker compose exec mongo mongosh --eval "db.events.find().pretty()"`.
- [ ] Stop node-service (`docker compose stop node-service`). Create a device via `POST /devices` — still returns HTTP 201. Go service logs an error about the failed event publish.
- [ ] Check Go logs: retry attempts are logged with `slog` at WARN level. Final failure is logged at ERROR level.
- [ ] Restart node-service. Create a device again — events are logged normally (no persistent backlog from downtime; that's expected behavior).
- [ ] `POST /devices` completes in under 100ms regardless of Node service availability (the event publish is non-blocking).
- [ ] `docker compose ps` shows all 4 services healthy. go-service depends_on node-service healthy.

## Constraints

- `CreateDeviceUseCase` MUST NOT return an error when event publishing fails. The user contract is "device is created" — events are best-effort.
- The goroutine for event publishing MUST recover from panics to prevent crashing the HTTP handler.
- Retry logic MUST use `time.Sleep` or `time.After` — no busy waiting or spin loops.
- The `NodeEventClient` MUST accept the base URL via constructor (not hardcoded to localhost). Default: `NODE_URL` env var, fallback `http://node-service:3000`.
- All HTTP calls MUST use `context.Context` with proper deadline propagation.
- Do NOT introduce message queues (RabbitMQ, Kafka, NATS) or persistent outbox patterns — keep it simple per the demo scope.

## Notes

- Load the `golang-pro`, `hexagonal-architecture`, and `solid-principles` skills.
- Use `net/http` standard library client — no external HTTP client libraries.
- For tests, `httptest.NewServer` with a custom handler that simulates failures/retries is the idiomatic Go approach. See `go-testing` skill for patterns.
- The `EventPublisher` interface belongs in the application layer (outbound port), while `NodeEventClient` is an infrastructure adapter.
- Consider using `slog.Group` or `slog.With` to attach `deviceID` and `attempt` number to retry log entries.
