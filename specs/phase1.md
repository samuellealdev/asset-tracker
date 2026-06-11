# Phase 1: Go Hexagonal + PostgreSQL

## Objective

Implement the Go service with full hexagonal architecture (Ports & Adapters). Expose full CRUD endpoints — `POST /devices`, `GET /devices`, `GET /devices/:id`, `PUT /devices/:id`, `DELETE /devices/:id` — backed by PostgreSQL. All business logic MUST be test-driven (TDD) with zero framework dependencies in the domain layer.

## Technical Requirements

- **Hexagonal architecture** with four layers: `domain/`, `application/`, `infrastructure/`, `interfaces/`. Dependency direction: interfaces → application → domain (inward only).
- **Domain layer — Device entity**: Fields `ID (uuid)`, `Name (string, required)`, `Type (string, required)`, `CreatedAt (time.Time)`. MUST have zero framework imports. Include a `NewDevice` factory function that validates required fields and generates a UUID. Add `Update(name, type string) error` method that validates and mutates `Name` and `Type` in-place.
- **Domain layer — DeviceRepository port**: Interface with methods `Save(ctx, *Device) error`, `FindAll(ctx) ([]*Device, error)`, `FindByID(ctx, id string) (*Device, error)`, `Update(ctx, *Device) error`, `Delete(ctx, id string) error`.
- **Application layer — CreateDeviceUseCase**: Accepts `DeviceRepository` via constructor injection. Method `Execute(ctx, name, type string) (*Device, error)` — validates inputs, calls `NewDevice`, then `Save`. Returns the created device or error.
- **Application layer — ListDevicesUseCase**: Method `Execute(ctx) ([]*Device, error)` — delegates to `FindAll`.
- **Application layer — GetDeviceUseCase**: Method `Execute(ctx, id string) (*Device, error)` — calls `FindByID`. Returns `ErrNotFound` if the device does not exist.
- **Application layer — UpdateDeviceUseCase**: Method `Execute(ctx, id, name, type string) (*Device, error)` — calls `FindByID`, then `device.Update(name, type)`, then repository `Update`. Returns `ErrNotFound` if the device does not exist, validation error if `name` or `type` is empty.
- **Application layer — DeleteDeviceUseCase**: Method `Execute(ctx, id string) error` — calls `Delete`. Returns `ErrNotFound` if the device does not exist.
- **Infrastructure layer**: `PostgresDeviceRepository` implementing `DeviceRepository` using `pgx/v5`. Constructor accepts `*pgxpool.Pool`. Table schema: `id UUID PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL`. Implements all five port methods (`Save`, `FindAll`, `FindByID`, `Update`, `Delete`).
- **Interfaces layer**: HTTP handler (`DeviceHandler`) accepting all use cases via constructor injection. Routes:
  - `POST /devices` — reads JSON body `{name, type}`, returns 201 + device JSON. 400 for missing/invalid fields.
  - `GET /devices` — returns 200 + JSON array (may be empty).
  - `GET /devices/:id` — returns 200 + device JSON. 404 if not found.
  - `PUT /devices/:id` — reads JSON body `{name, type}`, validates, updates. Returns 200 + updated device JSON. 400 for invalid fields, 404 if not found.
  - `DELETE /devices/:id` — deletes device. Returns 204 (no body). 404 if not found.
  - All error responses return JSON `{"error": "message"}`.
- **Composition root** in `cmd/main.go`: wire everything manually — create DB pool, repository, all five use cases, handler, HTTP server. No DI framework.
- **Structured logging**: use `log/slog`. Log request start/end, errors, and DB operations at appropriate levels.
- **Tests**: Unit tests for domain entity (`Device` validation, UUID generation, `Update` method). Unit tests for ALL use cases with mock repository (implement `DeviceRepository` interface manually in test). Integration tests for `PostgresDeviceRepository` covering all five methods using a test PostgreSQL instance.

## Files to Create

- `go-service/internal/domain/device.go` — `Device` entity, `NewDevice` factory, `Update` method, validation errors
- `go-service/internal/domain/device_test.go` — Table-driven tests for `NewDevice` and `Update` (valid/invalid inputs, UUID uniqueness)
- `go-service/internal/domain/repository.go` — `DeviceRepository` interface (5 methods)
- `go-service/internal/application/create_device.go` — `CreateDeviceUseCase`
- `go-service/internal/application/create_device_test.go` — Tests with mock repository (happy path, validation failure, save failure)
- `go-service/internal/application/list_devices.go` — `ListDevicesUseCase`
- `go-service/internal/application/list_devices_test.go` — Tests with mock repository (empty list, populated list)
- `go-service/internal/application/get_device.go` — `GetDeviceUseCase`
- `go-service/internal/application/get_device_test.go` — Tests with mock repository (found, not found)
- `go-service/internal/application/update_device.go` — `UpdateDeviceUseCase`
- `go-service/internal/application/update_device_test.go` — Tests with mock repository (happy path, not found, validation failure, update failure)
- `go-service/internal/application/delete_device.go` — `DeleteDeviceUseCase`
- `go-service/internal/application/delete_device_test.go` — Tests with mock repository (happy path, not found)
- `go-service/internal/infrastructure/postgres_device_repository.go` — `PostgresDeviceRepository` with `pgx` (all 5 methods)
- `go-service/internal/infrastructure/postgres_device_repository_test.go` — Integration tests for all 5 methods (skip if no DB, use `t.Skip`)
- `go-service/internal/infrastructure/migrations.go` — `CREATE TABLE IF NOT EXISTS devices (...)` migration function
- `go-service/internal/interfaces/device_handler.go` — HTTP handler struct with all 5 route handlers
- `go-service/internal/interfaces/device_handler_test.go` — HTTP handler tests using `httptest` for all 5 endpoints (200, 201, 204, 400, 404)
- `go-service/go.sum` — Generated by `go mod tidy`

## Files to Modify

- `go-service/cmd/main.go` — Replace minimal health-only server with full composition root plus health endpoint. Wire all 5 use cases.
- `go-service/go.mod` — Add `pgx/v5`, `google/uuid` dependencies (via `go mod tidy`).

## Acceptance Criteria

- [ ] `go test ./...` passes all tests in go-service (domain, application, interfaces, infrastructure).
- [ ] `curl -X POST http://localhost:8080/devices -H 'Content-Type: application/json' -d '{"name":"laptop","type":"computer"}'` returns HTTP 201 and JSON with `id`, `name`, `type`, `createdAt`.
- [ ] `curl -X POST http://localhost:8080/devices -H 'Content-Type: application/json' -d '{"name":""}'` returns HTTP 400.
- [ ] `curl -X POST http://localhost:8080/devices -H 'Content-Type: application/json' -d '{"type":"computer"}'` returns HTTP 400 (missing `name`).
- [ ] `curl http://localhost:8080/devices` returns HTTP 200 and a JSON array (may be empty or populated).
- [ ] `curl http://localhost:8080/devices/<id>` (with a valid ID from a prior POST) returns HTTP 200 and JSON with matching `id`.
- [ ] `curl http://localhost:8080/devices/00000000-0000-0000-0000-000000000000` returns HTTP 404 with JSON `{"error": "device not found"}`.
- [ ] `curl -X PUT http://localhost:8080/devices/<id> -H 'Content-Type: application/json' -d '{"name":"server","type":"infrastructure"}'` returns HTTP 200 and updated JSON with new `name` and `type`.
- [ ] `curl -X PUT http://localhost:8080/devices/<id> -H 'Content-Type: application/json' -d '{"name":""}'` returns HTTP 400.
- [ ] `curl -X PUT http://localhost:8080/devices/00000000-0000-0000-0000-000000000000 -H 'Content-Type: application/json' -d '{"name":"x","type":"y"}'` returns HTTP 404.
- [ ] `curl -X DELETE http://localhost:8080/devices/<id>` (with a valid ID) returns HTTP 204 with no body.
- [ ] `curl -X DELETE http://localhost:8080/devices/<id>` (same ID again) returns HTTP 404.
- [ ] `curl http://localhost:8080/health` still works (Phase 0 regression).
- [ ] `docker compose up --build` succeeds with go-service healthy and connected to PostgreSQL.
- [ ] Domain layer has ZERO imports from `database/sql`, `pgx`, `net/http`, or any framework package.

## Constraints

- Domain layer MUST have zero framework dependencies. Use `grep -r "pgx\|sql\|http\|gin\|echo\|chi" go-service/internal/domain/` to verify — it MUST return no matches.
- ALL business logic MUST be written test-first (red → green → refactor) per the `tdd` skill.
- Use table-driven tests with `t.Run` subtests per the `golang-pro` skill.
- Manual dependency injection only — no `wire`, `fx`, or other DI frameworks.
- The repository interface MUST be defined in the application layer (not domain), following the Dependency Inversion Principle.
- Input validation MUST happen in both the domain entity AND the HTTP handler (for early 400/404 responses).
- Migration MUST be idempotent (`CREATE TABLE IF NOT EXISTS`).
- Use `context.Context` throughout — every function that does I/O MUST accept `ctx` as the first parameter.
- `DeleteDeviceUseCase` and `GetDeviceUseCase` MUST return a domain-specific `ErrNotFound` sentinel error, not a generic DB error.
- Handler MUST use `http.PathValue(r, "id")` (Go 1.22+ stdlib) to extract the `:id` path parameter — no third-party router.

## Notes

- Load the `golang-pro`, `hexagonal-architecture`, `solid-principles`, and `tdd` skills before implementation.
- For integration tests, use `t.Skip("requires running PostgreSQL")` when `POSTGRES_DSN` is not set, so unit tests can run without a database.
- The `uuid` package from Google (`github.com/google/uuid`) is the recommended choice for UUID generation.
- Use `pgxpool` for connection pooling — it handles reconnection automatically.
- Follow the hexagonal folder structure exactly: `internal/domain/`, `internal/application/`, `internal/infrastructure/`, `internal/interfaces/`.
- The `Device.Update()` method MUST validate that `name` and `type` are non-empty before mutating, matching the same validation rules as `NewDevice`.
- Repository `Update` and `Delete` methods MUST use `sql.Result.RowsAffected()` to detect whether a row was actually modified — return `ErrNotFound` if zero rows affected.
