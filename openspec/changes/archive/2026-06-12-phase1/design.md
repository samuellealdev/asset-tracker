# Design: Phase 1 — Go Hexagonal + PostgreSQL

## Technical Approach

Phase 1 implements a full CRUD REST API for devices using Hexagonal Architecture (Ports & Adapters) in Go 1.23+. The domain layer has zero framework imports. Manual dependency injection wires all components at startup in `cmd/main.go`. PostgreSQL provides persistence via `pgx/v5` with `pgxpool` connection pooling. All business logic was built test-first (TDD).

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| **Repository port location** | `application/` layer (DIP) | `domain/` layer | Application layer owns the contract; infrastructure implements it. Domain stays pure. |
| **DI mechanism** | Manual wiring in `main.go` | wire, fx, dig | Zero code generation, no framework magic. 5 use cases → ~15 lines of wiring. |
| **HTTP router** | `net/http` Go 1.22+ `PathValue` | chi, gin, echo | Stdlib-only keeps attack surface minimal. Go 1.22 routing patterns (`GET /devices/{id}`) are sufficient. |
| **Logging** | `log/slog` structured JSON | zap, zerolog | Standard library — no dependency, structured output, context propagation. |
| **UUID generation** | `github.com/google/uuid` | `os/exec uuidgen`, custom | Battle-tested, RFC 9562 compliant, zero allocations for v4. Domain layer's only external import. |
| **DB driver** | `pgx/v5` with `pgxpool` | `database/sql` + `lib/pq` | Native PostgreSQL protocol, connection pooling built-in, `RowsAffected()` for not-found detection. |
| **Handler-use case contract** | `DeviceUseCases` interface (inbound port) | Direct struct injection | Enables handler testing with a single mock; follows Interface Segregation Principle. |
| **Migration strategy** | Idempotent `CREATE TABLE IF NOT EXISTS` on startup | golang-migrate, atlas | Simplest viable approach for Phase 1. Will evolve to proper migration tooling in later phases. |

## Hexagonal Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   interfaces/                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │ DeviceHandler (HTTP)                              │    │
│  │ POST /devices  GET /devices  GET /devices/{id}   │    │
│  │ PUT /devices/{id}  DELETE /devices/{id}          │    │
│  │ GET /health                                       │    │
│  │ DeviceUseCases interface (inbound port)           │    │
│  └──────────────────────┬───────────────────────────┘    │
├─────────────────────────┼────────────────────────────────┤
│           application/  │                                │
│  ┌──────────────────────▼───────────────────────────┐    │
│  │ CreateDeviceUseCase  ListDevicesUseCase           │    │
│  │ GetDeviceUseCase     UpdateDeviceUseCase          │    │
│  │ DeleteDeviceUseCase                               │    │
│  │ DeviceRepository interface (outbound port)        │    │
│  │ ErrNotFound sentinel                              │    │
│  └──────────────────────┬───────────────────────────┘    │
├─────────────────────────┼────────────────────────────────┤
│           domain/       │                                │
│  ┌──────────────────────▼───────────────────────────┐    │
│  │ Device entity (ID, Name, Type, CreatedAt)        │    │
│  │ NewDevice(name, type) factory + validation       │    │
│  │ device.Update(name, type) method                 │    │
│  │ ErrNameRequired, ErrTypeRequired sentinels       │    │
│  └──────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────┤
│           infrastructure/                                │
│  ┌──────────────────────────────────────────────────┐    │
│  │ PostgresDeviceRepository (implements             │    │
│  │   application.DeviceRepository)                  │    │
│  │ RunMigrations(pool) — idempotent DDL             │    │
│  └──────────────────────┬───────────────────────────┘    │
│                         │                                 │
│                   ┌─────▼─────┐                          │
│                   │ PostgreSQL │                          │
│                   └───────────┘                          │
└──────────────────────────────────────────────────────────┘

Dependency direction: interfaces → application → domain (INWARD ONLY)
Infrastructure → application (implements outbound port)
```

## Device Entity Design

```
Device {
    ID        string    // UUIDv4, set by NewDevice
    Name      string    // non-empty, validated in NewDevice + Update
    Type      string    // non-empty, validated in NewDevice + Update
    CreatedAt time.Time // UTC, set by NewDevice
}
```

- **Factory**: `NewDevice(name, type) (*Device, error)` — validates non-empty, generates UUID via `uuid.New()`, sets `CreatedAt` to `time.Now().UTC()`.
- **Update**: `device.Update(name, type) error` — validates non-empty, mutates Name and Type in-place. Validation matches NewDevice exactly.
- **Errors**: `ErrNameRequired` and `ErrTypeRequired` as package-level sentinels checked by `errors.Is` in the handler.

## POST /devices Sequence

```
Client                Handler              CreateDeviceUseCase       Domain          Repository          PostgreSQL
  │                      │                        │                    │                │                   │
  │ POST /devices        │                        │                    │                │                   │
  │ {name,type} ────────▶│                        │                    │                │                   │
  │                      │ Decode JSON            │                    │                │                   │
  │                      │──▶ Execute(name, type) │                    │                │                   │
  │                      │                        │ NewDevice(n,t)     │                │                   │
  │                      │                        │───────────────────▶│                │                   │
  │                      │                        │◀─── *Device, nil ──│                │                   │
  │                      │                        │ Save(ctx, device)  │                │                   │
  │                      │                        │────────────────────────────────────▶│                   │
  │                      │                        │                                    │ INSERT INTO       │
  │                      │                        │                                    │ devices... ──────▶│
  │                      │                        │◀─── nil ─────────────────────────│                   │
  │                      │◀── *Device, nil ───────│                    │                │                   │
  │◀── 201 + JSON ───────│                        │                    │                │                   │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `go-service/internal/domain/device.go` | Create | Device entity, NewDevice factory, Update method, validation errors |
| `go-service/internal/domain/device_test.go` | Create | Table-driven tests for factory and Update (8 subtests) |
| `go-service/internal/application/repository.go` | Create | DeviceRepository interface (5 methods) in application layer (DIP) |
| `go-service/internal/application/errors.go` | Create | ErrNotFound sentinel error |
| `go-service/internal/application/create_device.go` | Create | CreateDeviceUseCase — validates → creates → saves |
| `go-service/internal/application/create_device_test.go` | Create | 3 subtests: happy path, empty name, save failure |
| `go-service/internal/application/list_devices.go` | Create | ListDevicesUseCase — delegates to FindAll |
| `go-service/internal/application/list_devices_test.go` | Create | 2 subtests: empty list, populated list |
| `go-service/internal/application/get_device.go` | Create | GetDeviceUseCase — delegates to FindByID |
| `go-service/internal/application/get_device_test.go` | Create | 2 subtests: found, not found |
| `go-service/internal/application/update_device.go` | Create | UpdateDeviceUseCase — find → domain.Update → repo.Update |
| `go-service/internal/application/update_device_test.go` | Create | 4 subtests: happy path, not found, validation, update failure |
| `go-service/internal/application/delete_device.go` | Create | DeleteDeviceUseCase — delegates to Delete |
| `go-service/internal/application/delete_device_test.go` | Create | 2 subtests: happy path, not found |
| `go-service/internal/infrastructure/migrations.go` | Create | RunMigrations — idempotent `CREATE TABLE IF NOT EXISTS devices` |
| `go-service/internal/infrastructure/postgres_device_repository.go` | Create | PostgresDeviceRepository implementing all 5 port methods with pgxpool |
| `go-service/internal/infrastructure/postgres_device_repository_test.go` | Create | Integration tests for all 5 methods (skipped without POSTGRES_DSN) |
| `go-service/internal/interfaces/device_use_cases.go` | Create | DeviceUseCases interface (inbound port) + composite implementation |
| `go-service/internal/interfaces/device_handler.go` | Create | HTTP handler with Go 1.22+ route registration, JSON encode/decode, error-to-status mapping |
| `go-service/internal/interfaces/device_handler_test.go` | Create | httptest-based handler tests for all 5 endpoints + health (18 subtests) |
| `go-service/cmd/main.go` | Modify | Composition root: pool → repo → 5 use cases → handler → server |
| `go-service/go.mod` | Modify | Add pgx/v5, google/uuid dependencies |

## Testing Strategy

| Layer | Type | Mock Strategy | Files |
|-------|------|---------------|-------|
| Domain | Unit | None — pure logic | `device_test.go` (8 subtests) |
| Application | Unit | Manual `mockDeviceRepository` struct implementing `DeviceRepository` | 5 test files (13 subtests total) |
| Infrastructure | Integration | Real PostgreSQL via `t.Skip` when `POSTGRES_DSN` unset | `postgres_device_repository_test.go` (5 test funcs, 8 subtests) |
| Interfaces | Unit | Manual `mockUseCases` struct implementing `DeviceUseCases` interface | `device_handler_test.go` (18 subtests across all endpoints) |

All tests use `go test` stdlib with table-driven patterns and `t.Run` subtests. Integration tests guard with `t.Skip` for CI without a database. Handler tests use `httptest.NewRequest` + `req.SetPathValue` for Go 1.22+ routing.

## Migration / Rollout

No migration required. The table DDL is idempotent (`CREATE TABLE IF NOT EXISTS`), and `go.mod` changes are additive. Rollback is `git revert`.

## Open Questions

- None. Phase 1 is archived.
